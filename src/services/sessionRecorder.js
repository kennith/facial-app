/**
 * Video Session & Biomechanical Time-Series Logger
 */

export class VideoSessionRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.startTime = null;
    this.samples = [];
  }

  /**
   * Start recording from a MediaStream (camera feed or canvas stream)
   * @param {MediaStream} stream 
   */
  start(stream) {
    this.recordedChunks = [];
    this.samples = [];
    this.startTime = performance.now();
    this.isRecording = true;

    // Determine supported mime type
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
        }
      }
    }

    try {
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
        videoBitsPerSecond: 2500000,
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100); // chunk every 100ms
    } catch (err) {
      console.warn('Failed to start MediaRecorder:', err);
      this.mediaRecorder = null;
    }
  }

  /**
   * Log a single time-series frame of biomechanical metrics
   */
  logFrame(metrics) {
    if (!this.isRecording || !this.startTime) return;

    const elapsedSec = Number(((performance.now() - this.startTime) / 1000).toFixed(3));
    const left = metrics?.left || {};
    const right = metrics?.right || {};

    const leftForce = left.forceN || 0;
    const rightForce = right.forceN || 0;
    const activeForce = Math.max(leftForce, rightForce);

    const leftSpeed = left.speedDeg || 0;
    const rightSpeed = right.speedDeg || 0;
    const activeSpeed = Math.max(leftSpeed, rightSpeed);

    const leftHandSpeed = left.handSpeedMs || 0;
    const rightHandSpeed = right.handSpeedMs || 0;
    const activeHandSpeed = Math.max(leftHandSpeed, rightHandSpeed);

    const power = Math.max(left.powerWatts || 0, right.powerWatts || 0);

    this.samples.push({
      time: elapsedSec,
      leftAngle: left.angle || null,
      rightAngle: right.angle || null,
      leftForceN: leftForce,
      rightForceN: rightForce,
      activeForceN: activeForce,
      leftSpeedDeg: leftSpeed,
      rightSpeedDeg: rightSpeed,
      activeSpeedDeg: activeSpeed,
      activeHandSpeedMs: activeHandSpeed,
      powerWatts: power,
    });
  }

  /**
   * Stop recording and compile session analytics
   * @returns {Promise<Object>} Compiled session analytics and video blob
   */
  async stop() {
    this.isRecording = false;
    const durationSec = this.startTime ? Number(((performance.now() - this.startTime) / 1000).toFixed(2)) : 0;

    let videoBlob = null;
    let videoUrl = null;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise((resolve) => {
        this.mediaRecorder.onstop = resolve;
        this.mediaRecorder.stop();
      });

      if (this.recordedChunks.length > 0) {
        const mime = this.recordedChunks[0].type || 'video/webm';
        videoBlob = new Blob(this.recordedChunks, { type: mime });
        videoUrl = URL.createObjectURL(videoBlob);
      }
    }

    const analytics = this.computeSessionAnalytics(this.samples, durationSec);

    return {
      durationSec,
      videoBlob,
      videoUrl,
      timeSeries: this.samples,
      analytics,
    };
  }

  /**
   * Aggregate statistics, peak values, and count strikes/repetitions
   */
  computeSessionAnalytics(samples, durationSec) {
    if (!samples || samples.length === 0) {
      return {
        durationSec,
        samplesCount: 0,
        peakForceN: 0,
        peakForceLbs: 0,
        peakForceKgf: 0,
        avgForceN: 0,
        maxSpeedDeg: 0,
        maxHandSpeedMs: 0,
        maxHandSpeedKmh: 0,
        peakPowerWatts: 0,
        avgPowerWatts: 0,
        totalWorkJoules: 0,
        caloriesKcal: 0,
        strikeCount: 0,
        strikes: [],
      };
    }

    let peakForceN = 0;
    let sumForceN = 0;
    let maxSpeedDeg = 0;
    let maxHandSpeedMs = 0;
    let peakPowerWatts = 0;
    let sumPowerWatts = 0;

    samples.forEach((s) => {
      if (s.activeForceN > peakForceN) peakForceN = s.activeForceN;
      sumForceN += s.activeForceN;

      if (s.activeSpeedDeg > maxSpeedDeg) maxSpeedDeg = s.activeSpeedDeg;
      if (s.activeHandSpeedMs > maxHandSpeedMs) maxHandSpeedMs = s.activeHandSpeedMs;

      if (s.powerWatts > peakPowerWatts) peakPowerWatts = s.powerWatts;
      sumPowerWatts += s.powerWatts;
    });

    const avgForceN = Math.round(sumForceN / samples.length);
    const avgPowerWatts = Math.round(sumPowerWatts / samples.length);
    const peakForceLbs = Math.round(peakForceN * 0.224809);
    const peakForceKgf = Number((peakForceN * 0.101972).toFixed(1));
    const maxHandSpeedKmh = Number((maxHandSpeedMs * 3.6).toFixed(1));

    // Approximate Work Done: W = AvgPower * duration
    const totalWorkJoules = Math.round(avgPowerWatts * durationSec);
    const caloriesKcal = Number((totalWorkJoules / 4184).toFixed(2));

    // Peak strike detection (hysteresis algorithm)
    const { strikeCount, strikes } = this.detectStrikes(samples);

    return {
      durationSec,
      samplesCount: samples.length,
      peakForceN,
      peakForceLbs,
      peakForceKgf,
      avgForceN,
      maxSpeedDeg,
      maxHandSpeedMs,
      maxHandSpeedKmh,
      peakPowerWatts,
      avgPowerWatts,
      totalWorkJoules,
      caloriesKcal,
      strikeCount,
      strikes,
    };
  }

  /**
   * Peak detection algorithm to identify individual punch/curl repetitions
   */
  detectStrikes(samples) {
    const thresholdForce = 45; // Min force in Newtons to qualify as active motion
    const strikes = [];
    let inStrike = false;
    let currentStrikePeak = 0;
    let currentStrikeTime = 0;

    samples.forEach((s) => {
      if (s.activeForceN > thresholdForce) {
        if (!inStrike) {
          inStrike = true;
          currentStrikePeak = s.activeForceN;
          currentStrikeTime = s.time;
        } else {
          if (s.activeForceN > currentStrikePeak) {
            currentStrikePeak = s.activeForceN;
            currentStrikeTime = s.time;
          }
        }
      } else if (inStrike && s.activeForceN < thresholdForce * 0.5) {
        // Strike finished
        strikes.push({
          time: currentStrikeTime,
          peakForceN: currentStrikePeak,
        });
        inStrike = false;
        currentStrikePeak = 0;
      }
    });

    if (inStrike && currentStrikePeak > 0) {
      strikes.push({
        time: currentStrikeTime,
        peakForceN: currentStrikePeak,
      });
    }

    return {
      strikeCount: strikes.length,
      strikes,
    };
  }
}
