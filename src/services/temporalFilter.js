/**
 * 1-Euro Filter & Temporal Anti-Jitter Stabilizer for Pose Landmarks
 * 
 * Provides rock-solid stabilization when stationary while maintaining
 * zero-latency responsiveness during fast movements (punches, kicks, jumps).
 * Reference: Casiez et al., "1 € Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Human-Computer Interaction", CHI 2012.
 */

class LowPassFilter {
  constructor(alpha = 0.5, initVal = 0) {
    this.y = initVal;
    this.alpha = alpha;
    this.initialized = false;
  }

  filter(val, alpha = this.alpha) {
    if (!this.initialized) {
      this.y = val;
      this.initialized = true;
      return val;
    }
    this.y = alpha * val + (1 - alpha) * this.y;
    return this.y;
  }

  reset() {
    this.initialized = false;
    this.y = 0;
  }
}

class OneEuroFilter1D {
  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff; // Hz (lower = smoother when still)
    this.beta = beta;           // speed coefficient (higher = faster response when moving)
    this.dCutoff = dCutoff;     // derivative cutoff frequency
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
    this.lastTime = null;
  }

  alpha(rate, cutoff) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    const te = 1.0 / rate;
    return 1.0 / (1.0 + tau / te);
  }

  filter(val, timestamp) {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      return this.xFilter.filter(val, 1.0);
    }

    const dt = Math.max(0.001, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;
    const rate = 1.0 / dt;

    // Estimate derivative (velocity)
    const prevX = this.xFilter.y;
    const dx = (val - prevX) / dt;
    const edx = this.dxFilter.filter(dx, this.alpha(rate, this.dCutoff));

    // Dynamic adaptive cutoff frequency
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(val, this.alpha(rate, cutoff));
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

export class OneEuroPointFilter {
  constructor(minCutoff = 0.8, beta = 0.006, deadband = 1.8) {
    this.xFilter = new OneEuroFilter1D(minCutoff, beta);
    this.yFilter = new OneEuroFilter1D(minCutoff, beta);
    this.deadband = deadband; // Minimum pixel change to break deadband lock
    this.lastOutput = null;
  }

  filter(pt, timestamp) {
    if (!pt) {
      this.reset();
      return null;
    }

    const filteredX = this.xFilter.filter(pt.x, timestamp);
    const filteredY = this.yFilter.filter(pt.y, timestamp);

    // Apply deadband jitter gate
    if (this.lastOutput) {
      const dist = Math.hypot(filteredX - this.lastOutput.x, filteredY - this.lastOutput.y);
      if (dist < this.deadband) {
        return {
          ...pt,
          x: this.lastOutput.x,
          y: this.lastOutput.y,
        };
      }
    }

    this.lastOutput = { x: filteredX, y: filteredY };
    return {
      ...pt,
      x: filteredX,
      y: filteredY,
    };
  }

  reset() {
    this.xFilter.reset();
    this.yFilter.reset();
    this.lastOutput = null;
  }
}

/**
 * Full Body Pose Landmark Stabilizer
 */
export class PoseLandmarkStabilizer {
  constructor(mode = 'smooth') {
    this.mode = mode;
    this.pointFilters = new Map();
    this.angleFilters = {
      leftElbow: new OneEuroFilter1D(1.2, 0.01),
      rightElbow: new OneEuroFilter1D(1.2, 0.01),
    };
    this.balanceFilter = new OneEuroFilter1D(0.6, 0.005);
    this.setMode(mode);
  }

  setMode(mode) {
    this.mode = mode;
    let minCutoff = 0.8;
    let beta = 0.008;
    let deadband = 1.8;

    if (mode === 'extra_smooth') {
      minCutoff = 0.4;
      beta = 0.004;
      deadband = 2.5;
    } else if (mode === 'responsive') {
      minCutoff = 1.5;
      beta = 0.02;
      deadband = 0.8;
    } else if (mode === 'off') {
      minCutoff = 100;
      beta = 1.0;
      deadband = 0;
    }

    this.minCutoff = minCutoff;
    this.beta = beta;
    this.deadband = deadband;
    this.pointFilters.clear();
  }

  getOrCreatePointFilter(key) {
    if (!this.pointFilters.has(key)) {
      this.pointFilters.set(
        key,
        new OneEuroPointFilter(this.minCutoff, this.beta, this.deadband)
      );
    }
    return this.pointFilters.get(key);
  }

  /**
   * Smooth entire stickman figure and posture metrics
   * @param {Object} poseData Processed pose results
   * @param {number} timestamp Current microsecond timestamp
   * @returns {Object} Smoothed pose data
   */
  smooth(poseData, timestamp = performance.now()) {
    if (!poseData || !poseData.poseDetected || !poseData.poses || poseData.poses.length === 0) {
      this.reset();
      return poseData;
    }

    if (this.mode === 'off') {
      return poseData;
    }

    const smoothedPoses = poseData.poses.map((p, idx) => {
      const s = p.stickman;
      if (!s) return p;

      const smoothPt = (pt, name) => {
        if (!pt) return null;
        const filter = this.getOrCreatePointFilter(`${idx}_${name}`);
        return filter.filter(pt, timestamp);
      };

      // Smooth Head
      const smoothedHeadCenter = smoothPt(s.head?.center, 'headCenter');
      const smoothedHead = s.head ? {
        center: smoothedHeadCenter || s.head.center,
        radius: s.head.radius,
      } : s.head;

      // Smooth Body Keypoints
      const smoothedStickman = {
        head: smoothedHead,
        neckBase: smoothPt(s.neckBase, 'neckBase'),
        pelvis: smoothPt(s.pelvis, 'pelvis'),
        leftShoulder: smoothPt(s.leftShoulder, 'lShoulder'),
        rightShoulder: smoothPt(s.rightShoulder, 'rShoulder'),
        leftElbow: smoothPt(s.leftElbow, 'lElbow'),
        rightElbow: smoothPt(s.rightElbow, 'rElbow'),
        leftWrist: smoothPt(s.leftWrist, 'lWrist'),
        rightWrist: smoothPt(s.rightWrist, 'rWrist'),
        leftHip: smoothPt(s.leftHip, 'lHip'),
        rightHip: smoothPt(s.rightHip, 'rHip'),
        leftKnee: smoothPt(s.leftKnee, 'lKnee'),
        rightKnee: smoothPt(s.rightKnee, 'rKnee'),
        leftAnkle: smoothPt(s.leftAnkle, 'lAnkle'),
        rightAnkle: smoothPt(s.rightAnkle, 'rAnkle'),
        leftFoot: smoothPt(s.leftFoot, 'lFoot'),
        rightFoot: smoothPt(s.rightFoot, 'rFoot'),
      };

      // Smooth Angles
      const rawLeftAngle = s.angles?.leftElbow;
      const rawRightAngle = s.angles?.rightElbow;

      const smoothedLeftAngle = rawLeftAngle !== null && rawLeftAngle !== undefined
        ? Math.round(this.angleFilters.leftElbow.filter(rawLeftAngle, timestamp))
        : rawLeftAngle;

      const smoothedRightAngle = rawRightAngle !== null && rawRightAngle !== undefined
        ? Math.round(this.angleFilters.rightElbow.filter(rawRightAngle, timestamp))
        : rawRightAngle;

      smoothedStickman.angles = {
        ...s.angles,
        leftElbow: smoothedLeftAngle,
        rightElbow: smoothedRightAngle,
      };

      // Smooth Balance Score
      if (s.balance) {
        const smoothedScore = Math.max(0, Math.min(100, Math.round(
          this.balanceFilter.filter(s.balance.score, timestamp)
        )));

        let status = 'unbalanced';
        let label = 'Unbalanced';
        let color = 'red';

        if (smoothedScore >= 90) {
          status = 'balanced';
          label = 'Balanced';
          color = 'green';
        } else if (smoothedScore >= 80) {
          status = 'slight_tilt';
          label = 'Moderate Balance';
          color = 'yellow';
        }

        smoothedStickman.balance = {
          ...s.balance,
          score: smoothedScore,
          status,
          label,
          color,
        };
      }

      return {
        ...p,
        stickman: smoothedStickman,
      };
    });

    return {
      ...poseData,
      poses: smoothedPoses,
    };
  }

  reset() {
    this.pointFilters.forEach((f) => f.reset());
    this.angleFilters.leftElbow.reset();
    this.angleFilters.rightElbow.reset();
    this.balanceFilter.reset();
  }
}
