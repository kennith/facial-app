/**
 * Biomechanical Kinetic & Kinematic Force Engine
 * 
 * Computes angular speed (deg/s), linear hand speed (m/s, km/h),
 * angular acceleration (rad/s²), joint torque (N·m), generated dynamic force (Newtons & lbs),
 * and power output (Watts) based on elbow angle changes over time.
 */

export class BiomechanicsTracker {
  constructor(options = {}) {
    this.bodyWeightKg = options.bodyWeightKg || 70; // Standard adult weight
    this.forearmLengthM = options.forearmLengthM || 0.28; // Standard forearm+hand length (~28cm)
    this.historySize = options.historySize || 6;
    
    // Left & Right Arm history buffers: [{ time, angle, rad, wrist }]
    this.leftHistory = [];
    this.rightHistory = [];

    // Filtered / Smoothed velocities
    this.leftSmoothedVel = 0;
    this.rightSmoothedVel = 0;

    // Peak Records
    this.peaks = {
      left: { maxSpeedDeg: 0, maxAccelRad: 0, maxForceN: 0, maxPowerW: 0 },
      right: { maxSpeedDeg: 0, maxAccelRad: 0, maxForceN: 0, maxPowerW: 0 },
      overallMaxForceN: 0,
    };
  }

  setBodyWeight(kg) {
    this.bodyWeightKg = Math.max(20, Math.min(200, Number(kg) || 70));
  }

  resetPeaks() {
    this.peaks = {
      left: { maxSpeedDeg: 0, maxAccelRad: 0, maxForceN: 0, maxPowerW: 0 },
      right: { maxSpeedDeg: 0, maxAccelRad: 0, maxForceN: 0, maxPowerW: 0 },
      overallMaxForceN: 0,
    };
  }

  /**
   * Update kinematics with new elbow angles and current timestamp
   * @param {Object} data { leftAngle, rightAngle, timestamp }
   */
  update(data) {
    const now = data.timestamp || performance.now();

    const leftMetrics = this.computeArmKinematics(
      data.leftAngle,
      now,
      this.leftHistory,
      'left'
    );

    const rightMetrics = this.computeArmKinematics(
      data.rightAngle,
      now,
      this.rightHistory,
      'right'
    );

    const activeMaxForce = Math.max(leftMetrics.forceN, rightMetrics.forceN);
    if (activeMaxForce > this.peaks.overallMaxForceN) {
      this.peaks.overallMaxForceN = activeMaxForce;
    }

    return {
      left: leftMetrics,
      right: rightMetrics,
      peaks: this.peaks,
      bodyWeightKg: this.bodyWeightKg,
    };
  }

  computeArmKinematics(angle, timestamp, history, side) {
    if (angle === null || angle === undefined) {
      return this.emptyMetrics();
    }

    const rad = (angle * Math.PI) / 180;
    history.push({ time: timestamp, angle, rad });
    if (history.length > this.historySize) {
      history.shift();
    }

    if (history.length < 2) {
      return this.emptyMetrics(angle);
    }

    const curr = history[history.length - 1];
    const prev = history[history.length - 2];
    const dt = (curr.time - prev.time) / 1000; // in seconds

    if (dt <= 0.001 || dt > 0.6) {
      // Avoid division by zero or large frame jumps
      return this.emptyMetrics(angle);
    }

    // 1. Angular Velocity (dθ/dt)
    const rawAngVelDeg = Math.abs(curr.angle - prev.angle) / dt; // deg/s
    const rawAngVelRad = Math.abs(curr.rad - prev.rad) / dt;     // rad/s

    // EMA smoothing to reduce camera jitter
    const alpha = 0.65;
    const smoothedVelDeg = side === 'left'
      ? (this.leftSmoothedVel = this.leftSmoothedVel * (1 - alpha) + rawAngVelDeg * alpha)
      : (this.rightSmoothedVel = this.rightSmoothedVel * (1 - alpha) + rawAngVelDeg * alpha);
    
    const smoothedVelRad = (smoothedVelDeg * Math.PI) / 180;

    // 2. Tangential Hand Speed (v = ω * L)
    const handSpeedMs = smoothedVelRad * this.forearmLengthM; // m/s
    const handSpeedKmh = handSpeedMs * 3.6;                   // km/h
    const handSpeedMph = handSpeedMs * 2.23694;               // mph

    // 3. Angular Acceleration (dω/dt)
    let angAccelRad = 0;
    if (history.length >= 3) {
      const prevPrev = history[history.length - 3];
      const dtPrev = (prev.time - prevPrev.time) / 1000;
      if (dtPrev > 0.001) {
        const prevVelRad = Math.abs(prev.rad - prevPrev.rad) / dtPrev;
        angAccelRad = Math.abs(rawAngVelRad - prevVelRad) / ((dt + dtPrev) / 2);
      }
    }

    // 4. Biomechanical Anthropometrics (Winter's Model)
    // Forearm + hand is ~2.2% of body mass
    const armMassKg = 0.022 * this.bodyWeightKg; 
    const rCom = 0.43 * this.forearmLengthM; // Center of mass distance from elbow
    // Moment of inertia around elbow: I = 1/3 * m * L^2
    const momentOfInertia = (1 / 3) * armMassKg * Math.pow(this.forearmLengthM, 2);

    // 5. Dynamic Torque (τ = I * α) in Newton-meters
    const torqueNm = momentOfInertia * angAccelRad;

    // 6. Generated Effective Dynamic Force (F = τ / r_com + dynamic centripetal force)
    // Tangential force + kinetic acceleration force
    const tangentialForceN = armMassKg * rCom * angAccelRad;
    const kineticEnergyForceN = 0.5 * armMassKg * Math.pow(handSpeedMs, 2) / (this.forearmLengthM || 0.28);
    const totalForceN = Math.round(tangentialForceN + kineticEnergyForceN);
    const forceLbs = Math.round(totalForceN * 0.224809);
    const forceKgf = Number((totalForceN * 0.101972).toFixed(1));

    // 7. Mechanical Power Output (P = τ * ω) in Watts
    const powerWatts = Math.round(torqueNm * smoothedVelRad);

    // Update Peak Records
    const peak = this.peaks[side];
    if (smoothedVelDeg > peak.maxSpeedDeg) peak.maxSpeedDeg = Math.round(smoothedVelDeg);
    if (angAccelRad > peak.maxAccelRad) peak.maxAccelRad = Math.round(angAccelRad);
    if (totalForceN > peak.maxForceN) peak.maxForceN = totalForceN;
    if (powerWatts > peak.maxPowerW) peak.maxPowerW = powerWatts;

    return {
      angle,
      speedDeg: Math.round(smoothedVelDeg),
      speedRad: Number(smoothedVelRad.toFixed(2)),
      handSpeedMs: Number(handSpeedMs.toFixed(2)),
      handSpeedKmh: Number(handSpeedKmh.toFixed(1)),
      handSpeedMph: Number(handSpeedMph.toFixed(1)),
      accelRad: Math.round(angAccelRad),
      torqueNm: Number(torqueNm.toFixed(2)),
      forceN: totalForceN,
      forceLbs,
      forceKgf,
      powerWatts,
      intensity: this.calculateIntensity(totalForceN, smoothedVelDeg),
    };
  }

  calculateIntensity(forceN, speedDeg) {
    if (forceN > 250 || speedDeg > 700) return 'explosive'; // Blazing purple/red
    if (forceN > 120 || speedDeg > 350) return 'high';      // Amber
    if (forceN > 40 || speedDeg > 120) return 'moderate';   // Cyan
    return 'idle';                                          // Normal
  }

  emptyMetrics(angle = null) {
    return {
      angle,
      speedDeg: 0,
      speedRad: 0,
      handSpeedMs: 0,
      handSpeedKmh: 0,
      handSpeedMph: 0,
      accelRad: 0,
      torqueNm: 0,
      forceN: 0,
      forceLbs: 0,
      forceKgf: 0,
      powerWatts: 0,
      intensity: 'idle',
    };
  }
}

export const globalBiomechanics = new BiomechanicsTracker();
