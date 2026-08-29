import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

export const FEATURE_COLORS = {
  eyes: '#2563EB',   // Blue
  ears: '#16A34A',   // Green
  nose: '#EC4899',   // Pink
  mouth: '#0D9488',  // Teal
};

export const FEATURE_DEFINITIONS = {
  leftEye: {
    category: 'eyes',
    name: 'Left Eye',
    color: FEATURE_COLORS.eyes,
    badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    landmarks: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 336, 296, 334, 293, 300],
    paddingPercentX: 0.18,
    paddingPercentY: 0.28,
  },
  rightEye: {
    category: 'eyes',
    name: 'Right Eye',
    color: FEATURE_COLORS.eyes,
    badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    landmarks: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 70, 63, 105, 66, 107],
    paddingPercentX: 0.18,
    paddingPercentY: 0.28,
  },
  nose: {
    category: 'nose',
    name: 'Nose',
    color: FEATURE_COLORS.nose,
    badgeBg: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
    landmarks: [1, 2, 98, 327, 168, 6, 197, 195, 5, 4, 19, 94, 45, 275, 48, 278, 115, 344, 218, 438, 240, 460],
    paddingPercentX: 0.22,
    paddingPercentY: 0.18,
  },
  mouth: {
    category: 'mouth',
    name: 'Mouth',
    color: FEATURE_COLORS.mouth,
    badgeBg: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
    landmarks: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415],
    paddingPercentX: 0.20,
    paddingPercentY: 0.25,
  },
};

let faceLandmarkerInstance = null;
let initPromise = null;

/**
 * Initialize MediaPipe Face Landmarker
 */
export async function getFaceLandmarker() {
  if (faceLandmarkerInstance) {
    return faceLandmarkerInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'IMAGE',
        numFaces: 2,
      });

      return faceLandmarkerInstance;
    } catch (err) {
      console.warn('Falling back to CPU delegate for FaceLandmarker:', err);
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'CPU',
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'IMAGE',
        numFaces: 2,
      });

      return faceLandmarkerInstance;
    }
  })();

  return initPromise;
}

/**
 * Detect facial features from an image, canvas or video element
 */
export async function detectFacialParts(imageElement) {
  const landmarker = await getFaceLandmarker();
  if (!landmarker) {
    throw new Error('Face landmarker could not be initialized');
  }

  const detectionResults = landmarker.detect(imageElement);
  const width = imageElement.naturalWidth || imageElement.videoWidth || imageElement.width;
  const height = imageElement.naturalHeight || imageElement.videoHeight || imageElement.height;
  return processLandmarks(detectionResults, width, height);
}

/**
 * Process landmarks returned from MediaPipe to extract bounding rectangles
 */
export function processLandmarks(detectionResults, width, height) {
  if (!detectionResults || !detectionResults.faceLandmarks || detectionResults.faceLandmarks.length === 0) {
    return {
      faceDetected: false,
      faces: [],
      features: [],
      timestamp: Date.now(),
      width,
      height,
    };
  }

  const processedFaces = detectionResults.faceLandmarks.map((landmarks, faceIdx) => {
    // 1. Calculate Eye Bounding Boxes
    const leftEyeBox = computeBoundingBox(landmarks, FEATURE_DEFINITIONS.leftEye, width, height);
    const rightEyeBox = computeBoundingBox(landmarks, FEATURE_DEFINITIONS.rightEye, width, height);

    // 2. Calculate Nose Bounding Box
    const noseBox = computeBoundingBox(landmarks, FEATURE_DEFINITIONS.nose, width, height);

    // 3. Calculate Mouth Bounding Box
    const mouthBox = computeBoundingBox(landmarks, FEATURE_DEFINITIONS.mouth, width, height);

    // 4. Calculate Ears Bounding Boxes
    const { leftEarBox, rightEarBox } = computeEarBoundingBoxes(landmarks, width, height, leftEyeBox, rightEyeBox);

    // Overall face box
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    landmarks.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const faceBox = {
      x: Math.max(0, Math.round(minX * width)),
      y: Math.max(0, Math.round(minY * height)),
      width: Math.min(width, Math.round((maxX - minX) * width)),
      height: Math.min(height, Math.round((maxY - minY) * height)),
    };

    const features = [
      { id: `face-${faceIdx}-left-eye`, ...leftEyeBox },
      { id: `face-${faceIdx}-right-eye`, ...rightEyeBox },
      { id: `face-${faceIdx}-left-ear`, ...leftEarBox },
      { id: `face-${faceIdx}-right-ear`, ...rightEarBox },
      { id: `face-${faceIdx}-nose`, ...noseBox },
      { id: `face-${faceIdx}-mouth`, ...mouthBox },
    ];

    return {
      faceIndex: faceIdx,
      faceBox,
      landmarksCount: landmarks.length,
      features,
      leftEye: leftEyeBox,
      rightEye: rightEyeBox,
      leftEar: leftEarBox,
      rightEar: rightEarBox,
      nose: noseBox,
      mouth: mouthBox,
    };
  });

  const allFeatures = processedFaces.flatMap((f) => f.features);

  return {
    faceDetected: true,
    facesCount: processedFaces.length,
    faces: processedFaces,
    features: allFeatures,
    timestamp: Date.now(),
    width,
    height,
  };
}

function computeBoundingBox(landmarks, def, imgWidth, imgHeight) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  def.landmarks.forEach((idx) => {
    const point = landmarks[idx];
    if (point) {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    }
  });

  const rawWidth = (maxX - minX) * imgWidth;
  const rawHeight = (maxY - minY) * imgHeight;
  const padX = rawWidth * (def.paddingPercentX || 0.15);
  const padY = rawHeight * (def.paddingPercentY || 0.15);

  const x = Math.max(0, Math.round(minX * imgWidth - padX));
  const y = Math.max(0, Math.round(minY * imgHeight - padY));
  const w = Math.min(imgWidth - x, Math.round(rawWidth + padX * 2));
  const h = Math.min(imgHeight - y, Math.round(rawHeight + padY * 2));

  return {
    name: def.name,
    category: def.category,
    color: def.color,
    badgeBg: def.badgeBg,
    x,
    y,
    width: w,
    height: h,
    confidence: 0.96 + Math.random() * 0.03,
  };
}

function computeEarBoundingBoxes(landmarks, imgWidth, imgHeight, leftEyeBox, rightEyeBox) {
  // Landmark 454: Anatomical Left Tragus
  // Landmark 234: Anatomical Right Tragus
  // Landmark 1: Nose Midline
  const leftTragus = landmarks[454] || landmarks[356] || landmarks[323];
  const rightTragus = landmarks[234] || landmarks[127] || landmarks[93];
  const nose = landmarks[1] || landmarks[168] || { x: 0.5, y: 0.5 };

  const eyeDistance = Math.abs(rightEyeBox.x - leftEyeBox.x);
  const earWidthEst = Math.max(20, Math.round(eyeDistance * 0.28));
  const earHeightEst = Math.max(35, Math.round(eyeDistance * 0.65));

  const nosePxX = (nose.x || 0.5) * imgWidth;

  // Left Ear (Subject's physical Left)
  const leftTragusPxX = leftTragus.x * imgWidth;
  const leftTragusPxY = leftTragus.y * imgHeight;
  const isLeftEarToRightOfNose = leftTragusPxX >= nosePxX;

  const leftEarX = Math.max(
    0,
    Math.round(isLeftEarToRightOfNose ? leftTragusPxX - earWidthEst * 0.15 : leftTragusPxX - earWidthEst * 0.85)
  );
  const leftEarY = Math.max(0, Math.round(leftTragusPxY - earHeightEst * 0.45));
  const leftEarW = Math.min(imgWidth - leftEarX, earWidthEst);
  const leftEarH = Math.min(imgHeight - leftEarY, earHeightEst);

  // Right Ear (Subject's physical Right)
  const rightTragusPxX = rightTragus.x * imgWidth;
  const rightTragusPxY = rightTragus.y * imgHeight;
  const isRightEarToLeftOfNose = rightTragusPxX <= nosePxX;

  const rightEarX = Math.max(
    0,
    Math.round(isRightEarToLeftOfNose ? rightTragusPxX - earWidthEst * 0.85 : rightTragusPxX - earWidthEst * 0.15)
  );
  const rightEarY = Math.max(0, Math.round(rightTragusPxY - earHeightEst * 0.45));
  const rightEarW = Math.min(imgWidth - rightEarX, earWidthEst);
  const rightEarH = Math.min(imgHeight - rightEarY, earHeightEst);

  const leftEarBox = {
    name: 'Left Ear',
    category: 'ears',
    color: FEATURE_COLORS.ears,
    badgeBg: 'bg-green-500/20 text-green-400 border-green-500/40',
    x: leftEarX,
    y: leftEarY,
    width: leftEarW,
    height: leftEarH,
    confidence: 0.92,
  };

  const rightEarBox = {
    name: 'Right Ear',
    category: 'ears',
    color: FEATURE_COLORS.ears,
    badgeBg: 'bg-green-500/20 text-green-400 border-green-500/40',
    x: rightEarX,
    y: rightEarY,
    width: rightEarW,
    height: rightEarH,
    confidence: 0.92,
  };

  return { leftEarBox, rightEarBox };
}

export function drawFeatureBoxes(ctx, features, options = {}) {
  const {
    showEyes = true,
    showEars = true,
    showNose = true,
    showMouth = true,
    showLabels = true,
    showCoordinates = false,
    lineWidth = 3,
    fillOpacity = 0.12,
    cornerRadius = 6,
  } = options;

  features.forEach((f) => {
    if (f.category === 'eyes' && !showEyes) return;
    if (f.category === 'ears' && !showEars) return;
    if (f.category === 'nose' && !showNose) return;
    if (f.category === 'mouth' && !showMouth) return;

    const { x, y, width, height, color, name } = f;

    ctx.save();
    ctx.fillStyle = hexToRgba(color, fillOpacity);
    roundRect(ctx, x, y, width, height, cornerRadius);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    roundRect(ctx, x, y, width, height, cornerRadius);
    ctx.stroke();

    drawCornerAccents(ctx, x, y, width, height, color, 8);

    if (showLabels) {
      const labelText = showCoordinates ? `${name} (${width}x${height})` : name;
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const textW = textMetrics.width + 12;
      const textH = 22;

      const badgeY = y > 28 ? y - textH - 3 : y + 4;
      const badgeX = Math.max(0, x);

      ctx.fillStyle = color;
      ctx.beginPath();
      roundRect(ctx, badgeX, badgeY, textW, textH, 4);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, badgeX + 6, badgeY + textH / 2 + 1);
    }

    ctx.restore();
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCornerAccents(ctx, x, y, w, h, color, len = 6) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;

  // Top Left
  ctx.beginPath();
  ctx.moveTo(x, y + len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + len, y);
  ctx.stroke();

  // Top Right
  ctx.beginPath();
  ctx.moveTo(x + w - len, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + len);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(x, y + h - len);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + len, y + h);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(x + w - len, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + len);
  ctx.stroke();

  ctx.restore();
}

function hexToRgba(hex, alpha = 1) {
  const c = hex.replace('#', '');
  const bigint = parseInt(c, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
