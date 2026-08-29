import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

let poseLandmarkerInstance = null;
let initPromise = null;

export const STICKMAN_COLOR_PRESETS = [
  { name: 'Electric Cyan', line: '#06B6D4', joint: '#22D3EE', head: '#06B6D4', glow: 'rgba(6, 182, 212, 0.4)' },
  { name: 'Neon Lime', line: '#10B981', joint: '#34D399', head: '#10B981', glow: 'rgba(16, 185, 129, 0.4)' },
  { name: 'Amber Sunset', line: '#F59E0B', joint: '#FBBF24', head: '#F59E0B', glow: 'rgba(245, 158, 11, 0.4)' },
  { name: 'Hot Pink', line: '#EC4899', joint: '#F472B6', head: '#EC4899', glow: 'rgba(236, 72, 153, 0.4)' },
  { name: 'Chalk White', line: '#F8FAFC', joint: '#E2E8F0', head: '#F8FAFC', glow: 'rgba(248, 250, 252, 0.2)' },
  { name: 'Pitch Black', line: '#0F172A', joint: '#1E293B', head: '#0F172A', glow: 'transparent' },
];

/**
 * Initialize MediaPipe Pose Landmarker
 */
export async function getPoseLandmarker() {
  if (poseLandmarkerInstance) {
    return poseLandmarkerInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      poseLandmarkerInstance = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numPoses: 2,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      return poseLandmarkerInstance;
    } catch (err) {
      console.warn('Falling back to CPU delegate for PoseLandmarker:', err);
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      poseLandmarkerInstance = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'CPU',
        },
        runningMode: 'IMAGE',
        numPoses: 2,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      return poseLandmarkerInstance;
    }
  })();

  return initPromise;
}

/**
 * Detect full-body pose from an image, canvas or video
 */
export async function detectPose(imageElement) {
  const landmarker = await getPoseLandmarker();
  if (!landmarker) {
    throw new Error('Pose landmarker could not be initialized');
  }

  const detectionResults = landmarker.detect(imageElement);
  const width = imageElement.naturalWidth || imageElement.videoWidth || imageElement.width;
  const height = imageElement.naturalHeight || imageElement.videoHeight || imageElement.height;

  return processPoseLandmarks(detectionResults, width, height);
}

/**
 * Process pose landmarks into simplified matchstick figure structure
 */
export function processPoseLandmarks(detectionResults, width, height) {
  if (!detectionResults || !detectionResults.landmarks || detectionResults.landmarks.length === 0) {
    return {
      poseDetected: false,
      poses: [],
      timestamp: Date.now(),
      width,
      height,
    };
  }

  const poses = detectionResults.landmarks.map((landmarks, idx) => {
    const getPt = (index) => {
      const p = landmarks[index];
      if (!p) return null;
      return {
        x: p.x * width,
        y: p.y * height,
        z: p.z || 0,
        visibility: p.visibility !== undefined ? p.visibility : 1,
      };
    };

    const nose = getPt(0);
    const leftShoulder = getPt(11);
    const rightShoulder = getPt(12);
    const leftElbow = getPt(13);
    const rightElbow = getPt(14);
    const leftWrist = getPt(15);
    const rightWrist = getPt(16);
    const leftHip = getPt(23);
    const rightHip = getPt(24);
    const leftKnee = getPt(25);
    const rightKnee = getPt(26);
    const leftAnkle = getPt(27);
    const rightAnkle = getPt(28);
    const leftFoot = getPt(31);
    const rightFoot = getPt(32);

    const neckBase = (leftShoulder && rightShoulder) ? {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    } : leftShoulder || rightShoulder || nose;

    const pelvis = (leftHip && rightHip) ? {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    } : leftHip || rightHip || neckBase;

    let headCenter = nose || { x: width / 2, y: height / 4 };
    let headRadius = 24;

    if (leftShoulder && rightShoulder) {
      const shoulderDist = Math.hypot(rightShoulder.x - leftShoulder.x, rightShoulder.y - leftShoulder.y);
      headRadius = Math.max(14, Math.round(shoulderDist * 0.32));
      if (neckBase && nose) {
        headCenter = {
          x: (nose.x * 0.6 + neckBase.x * 0.4),
          y: Math.min(nose.y, neckBase.y - headRadius * 0.9),
        };
      }
    }

    // Calculate joint angles in degrees
    const leftElbowAngle = calculateJointAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateJointAngle(rightShoulder, rightElbow, rightWrist);
    const leftKneeAngle = calculateJointAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateJointAngle(rightHip, rightKnee, rightAnkle);

    // Calculate body posture balance score
    const balance = calculateBodyBalance({
      leftShoulder,
      rightShoulder,
      leftHip,
      rightHip,
      neckBase,
      pelvis,
      head: { center: headCenter, radius: headRadius },
    });

    return {
      poseIndex: idx,
      rawLandmarks: landmarks,
      stickman: {
        head: { center: headCenter, radius: headRadius },
        neckBase,
        pelvis,
        leftShoulder,
        rightShoulder,
        leftElbow,
        rightElbow,
        leftWrist,
        rightWrist,
        leftHip,
        rightHip,
        leftKnee,
        rightKnee,
        leftAnkle,
        rightAnkle,
        leftFoot,
        rightFoot,
        angles: {
          leftElbow: leftElbowAngle,
          rightElbow: rightElbowAngle,
          leftKnee: leftKneeAngle,
          rightKnee: rightKneeAngle,
        },
        balance,
      },
    };
  });

  return {
    poseDetected: true,
    posesCount: poses.length,
    poses,
    timestamp: Date.now(),
    width,
    height,
  };
}

/**
 * Calculate body posture balance score (0 - 100%)
 */
export function calculateBodyBalance(stickman) {
  if (!stickman) return null;

  const { leftShoulder, rightShoulder, leftHip, rightHip, neckBase, pelvis } = stickman;
  if (!leftShoulder || !rightShoulder) return null;

  // 1. Shoulder Tilt Angle (in degrees from horizontal 0°)
  const shoulderDx = Math.abs(rightShoulder.x - leftShoulder.x) || 1;
  const shoulderDy = Math.abs(rightShoulder.y - leftShoulder.y);
  const shoulderTiltDeg = (Math.atan2(shoulderDy, shoulderDx) * 180) / Math.PI;

  // 2. Hip Tilt Angle (in degrees from horizontal 0°)
  let hipTiltDeg = 0;
  if (leftHip && rightHip) {
    const hipDx = Math.abs(rightHip.x - leftHip.x) || 1;
    const hipDy = Math.abs(rightHip.y - leftHip.y);
    hipTiltDeg = (Math.atan2(hipDy, hipDx) * 180) / Math.PI;
  }

  // 3. Central Line (Head/Neck to Pelvis lateral deviation from vertical 0°)
  let spineTiltDeg = 0;
  if (neckBase && pelvis) {
    const spineDx = Math.abs(neckBase.x - pelvis.x);
    const spineDy = Math.abs(neckBase.y - pelvis.y) || 1;
    spineTiltDeg = (Math.atan2(spineDx, spineDy) * 180) / Math.PI;
  }

  // Scoring components:
  // - Shoulder score: 0° tilt = 100%, 10° tilt = 30% (7% deduction per deg)
  const shoulderScore = Math.max(0, 100 - shoulderTiltDeg * 7);
  // - Hip score: 0° tilt = 100%, 10° tilt = 30%
  const hipScore = Math.max(0, 100 - hipTiltDeg * 7);
  // - Spine vertical score: 0° tilt = 100%, 12° tilt = 0% (8% deduction per deg)
  const spineScore = Math.max(0, 100 - spineTiltDeg * 8);

  // Overall weighted balance percentage
  const rawScore = (leftHip && rightHip)
    ? 0.4 * shoulderScore + 0.35 * hipScore + 0.25 * spineScore
    : 0.6 * shoulderScore + 0.4 * spineScore;

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Status mapping:
  // >= 90% -> Green, "Balanced"
  // 80% - 89% -> Yellow, "Moderate Balance"
  // < 80% -> Red, "Unbalanced"
  let status = 'unbalanced';
  let label = 'Unbalanced';
  let color = 'red';

  if (score >= 90) {
    status = 'balanced';
    label = 'Balanced';
    color = 'green';
  } else if (score >= 80) {
    status = 'slight_tilt';
    label = 'Moderate Balance';
    color = 'yellow';
  } else {
    status = 'unbalanced';
    label = 'Unbalanced';
    color = 'red';
  }

  return {
    score,
    status,
    label,
    color,
    shoulderTiltDeg: Number(shoulderTiltDeg.toFixed(1)),
    hipTiltDeg: Number(hipTiltDeg.toFixed(1)),
    spineTiltDeg: Number(spineTiltDeg.toFixed(1)),
  };
}

/**
 * Calculate 2D angle (in degrees 0-180) at vertex point B between vectors BA and BC
 */
export function calculateJointAngle(pointA, pointB, pointC) {
  if (!pointA || !pointB || !pointC) return null;

  const vA = { x: pointA.x - pointB.x, y: pointA.y - pointB.y };
  const vC = { x: pointC.x - pointB.x, y: pointC.y - pointB.y };

  const dot = vA.x * vC.x + vA.y * vC.y;
  const magA = Math.hypot(vA.x, vA.y);
  const magC = Math.hypot(vC.x, vC.y);

  if (magA === 0 || magC === 0) return null;

  let cosTheta = dot / (magA * magC);
  cosTheta = Math.max(-1, Math.min(1, cosTheta));

  const rad = Math.acos(cosTheta);
  return Math.round((rad * 180) / Math.PI);
}

/**
 * Render simplified matchstick figure onto canvas context
 */
export function drawMatchstickFigure(ctx, poseData, options = {}) {
  if (!poseData || !poseData.poses || poseData.poses.length === 0) return;

  const {
    isMirrored = false,
    lineColor = '#06B6D4',
    jointColor = '#22D3EE',
    headColor = '#06B6D4',
    glowColor = 'rgba(6, 182, 212, 0.4)',
    lineWidth = 4,
    jointRadius = 5,
    showFaceDetails = true,
    showJoints = true,
    canvasWidth = ctx.canvas.width,
  } = options;

  poseData.poses.forEach((p) => {
    const s = p.stickman;
    if (!s) return;

    const mapPt = (pt) => {
      if (!pt) return null;
      return isMirrored
        ? { x: Math.max(0, canvasWidth - pt.x), y: pt.y }
        : { x: pt.x, y: pt.y };
    };

    const head = {
      center: mapPt(s.head.center),
      radius: s.head.radius,
    };
    const neck = mapPt(s.neckBase);
    const pelvis = mapPt(s.pelvis);
    const lShoulder = mapPt(s.leftShoulder);
    const rShoulder = mapPt(s.rightShoulder);
    const lElbow = mapPt(s.leftElbow);
    const rElbow = mapPt(s.rightElbow);
    const lWrist = mapPt(s.leftWrist);
    const rWrist = mapPt(s.rightWrist);
    const lHip = mapPt(s.leftHip);
    const rHip = mapPt(s.rightHip);
    const lKnee = mapPt(s.leftKnee);
    const rKnee = mapPt(s.rightKnee);
    const lAnkle = mapPt(s.leftAnkle);
    const rAnkle = mapPt(s.rightAnkle);
    const lFoot = mapPt(s.leftFoot);
    const rFoot = mapPt(s.rightFoot);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (glowColor && glowColor !== 'transparent') {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
    }

    const drawBone = (ptA, ptB, customWidth = lineWidth) => {
      if (!ptA || !ptB) return;
      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = customWidth;
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();
    };

    const drawJoint = (pt, r = jointRadius) => {
      if (!pt || !showJoints || r <= 0) return;
      ctx.beginPath();
      ctx.fillStyle = jointColor;
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    // Spine
    if (neck && pelvis) drawBone(neck, pelvis, lineWidth * 1.2);

    // Shoulder Bar
    if (lShoulder && rShoulder) drawBone(lShoulder, rShoulder, lineWidth * 1.1);

    // 3. Draw Neck Connection (Head bottom center to Neck)
    const headSide = Math.round(head.radius * 1.75);
    if (head.center && neck) {
      const neckTop = {
        x: head.center.x,
        y: head.center.y + headSide / 2,
      };
      drawBone(neckTop, neck, lineWidth);
    }

    // 4. Draw Hip / Pelvis Bar
    if (lHip && rHip) drawBone(lHip, rHip, lineWidth * 1.1);

    // 5. Left Arm
    drawBone(lShoulder, lElbow);
    drawBone(lElbow, lWrist);

    // 6. Right Arm
    drawBone(rShoulder, rElbow);
    drawBone(rElbow, rWrist);

    // 7. Left Leg
    drawBone(lHip, lKnee);
    drawBone(lKnee, lAnkle);
    if (lFoot && lAnkle) drawBone(lAnkle, lFoot, lineWidth * 0.9);

    // 8. Right Leg
    drawBone(rHip, rKnee);
    drawBone(rKnee, rAnkle);
    if (rFoot && rAnkle) drawBone(rAnkle, rFoot, lineWidth * 0.9);

    // 9. Joint Nodes
    drawJoint(neck, jointRadius * 0.9);
    drawJoint(pelvis, jointRadius * 0.9);
    drawJoint(lShoulder);
    drawJoint(rShoulder);
    drawJoint(lElbow);
    drawJoint(rElbow);
    drawJoint(lWrist, jointRadius * 1.1);
    drawJoint(rWrist, jointRadius * 1.1);
    drawJoint(lHip);
    drawJoint(rHip);
    drawJoint(lKnee);
    drawJoint(rKnee);
    drawJoint(lAnkle);
    drawJoint(rAnkle);

    // 10. Draw Square Head (No eyes/mouth)
    if (head.center && headSide > 0) {
      const headX = head.center.x - headSide / 2;
      const headY = head.center.y - headSide / 2;

      ctx.beginPath();
      ctx.strokeStyle = headColor;
      ctx.lineWidth = Math.max(3, lineWidth * 1.1);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.rect(headX, headY, headSide, headSide);
      ctx.fill();
      ctx.stroke();
    }

    // 11. Draw Elbow Angles & Arcs
    const showAngles = options.showAngles !== false;
    if (showAngles) {
      // Left Elbow Angle
      if (lShoulder && lElbow && lWrist) {
        const leftAngle = calculateJointAngle(lShoulder, lElbow, lWrist);
        if (leftAngle !== null) {
          const leftMetrics = options.biomechanics?.left || null;
          drawElbowAngleIndicator(ctx, lElbow, lShoulder, lWrist, leftAngle, 'L', leftMetrics, options.showForceMetrics);
        }
      }

      // Right Elbow Angle
      if (rShoulder && rElbow && rWrist) {
        const rightAngle = calculateJointAngle(rShoulder, rElbow, rWrist);
        if (rightAngle !== null) {
          const rightMetrics = options.biomechanics?.right || null;
          drawElbowAngleIndicator(ctx, rElbow, rShoulder, rWrist, rightAngle, 'R', rightMetrics, options.showForceMetrics);
        }
      }
    }

    ctx.restore();
  });
}

/**
 * Draw angle arc and badge indicator with optional Force (N) and Speed (deg/s)
 */
function drawElbowAngleIndicator(ctx, elbow, shoulder, wrist, angle, sideLabel = '', metrics = null, showForceMetrics = true) {
  ctx.save();

  const isRightAngle = angle >= 85 && angle <= 95;
  const isExplosive = metrics && metrics.forceN > 200;
  const isHighForce = metrics && metrics.forceN > 100;

  let angleColor = '#06B6D4';
  if (isExplosive) angleColor = '#EC4899'; // Hot pink / explosive
  else if (isHighForce) angleColor = '#F59E0B'; // Amber
  else if (isRightAngle) angleColor = '#10B981'; // Green right angle

  const angleRadA = Math.atan2(shoulder.y - elbow.y, shoulder.x - elbow.x);
  const angleRadC = Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x);

  // 1. Draw angle arc at elbow
  const arcRadius = 18;
  ctx.beginPath();
  ctx.strokeStyle = angleColor;
  ctx.lineWidth = isRightAngle || isExplosive ? 2.5 : 1.8;
  ctx.setLineDash(isRightAngle ? [] : [2, 2]);

  let diff = angleRadC - angleRadA;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;

  const counterClockwise = diff < 0;
  ctx.arc(elbow.x, elbow.y, arcRadius, angleRadA, angleRadC, counterClockwise);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Compute outward badge position
  const midX = (shoulder.x + wrist.x) / 2;
  const midY = (shoulder.y + wrist.y) / 2;
  let dirX = elbow.x - midX;
  let dirY = elbow.y - midY;
  const dist = Math.hypot(dirX, dirY) || 1;
  dirX /= dist;
  dirY /= dist;

  const badgeDist = 28;
  const badgeX = elbow.x + dirX * badgeDist;
  const badgeY = elbow.y + dirY * badgeDist;

  // 3. Construct badge text (Degrees + Dynamic Force)
  let badgeText = `${angle}°`;
  if (metrics && showForceMetrics && metrics.forceN > 5) {
    badgeText = `${angle}° • ${metrics.forceN}N`;
  } else if (isRightAngle) {
    badgeText = `${angle}° (90°)`;
  }

  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  const textWidth = ctx.measureText(badgeText).width;
  const pillW = textWidth + 14;
  const pillH = 20;
  const pillX = badgeX - pillW / 2;
  const pillY = badgeY - pillH / 2;

  // Background
  ctx.fillStyle = isExplosive
    ? 'rgba(131, 24, 67, 0.92)'
    : isRightAngle
      ? 'rgba(6, 78, 59, 0.92)'
      : 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(pillX, pillY, pillW, pillH, 5) : ctx.rect(pillX, pillY, pillW, pillH);
  ctx.fill();

  // Border
  ctx.strokeStyle = angleColor;
  ctx.lineWidth = isRightAngle || isExplosive ? 2 : 1.2;
  ctx.stroke();

  // Text
  ctx.fillStyle = isExplosive ? '#F472B6' : isRightAngle ? '#34D399' : '#E2E8F0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, badgeX, badgeY + 1);

  ctx.restore();
}
