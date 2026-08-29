<template>
  <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl">
    <!-- View Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
      <div>
        <h2 class="text-xl font-bold text-white flex items-center gap-2.5">
          <span class="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Camera class="w-5 h-5" />
          </span>
          {{ activeMode === 'body' ? 'Full Body Stickman Capture' : 'Live Facial Capture' }}
        </h2>
        <p class="text-sm text-slate-400 mt-1">
          {{ activeMode === 'body' ? 'Position your full body in frame to generate a matchstick figure drawing' : 'Position your face in frame to detect eyes, ears, nose, and mouth' }}
        </p>
      </div>

      <!-- Camera Selector & Controls -->
      <div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
        <select
          v-if="videoDevices.length > 1"
          v-model="selectedDeviceId"
          @change="restartCamera"
          class="bg-slate-800 text-slate-200 text-xs rounded-lg border border-slate-700 px-3 py-2 focus:outline-none focus:border-teal-500"
        >
          <option v-for="dev in videoDevices" :key="dev.deviceId" :value="dev.deviceId">
            {{ dev.label || `Camera ${dev.deviceId.slice(0, 5)}...` }}
          </option>
        </select>

        <!-- Camera Start / Stop Toggle -->
        <button
          v-if="isCameraStreaming"
          @click="stopCamera"
          class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs"
          title="Stop camera stream"
        >
          <VideoOff class="w-3.5 h-3.5" />
          <span>Stop Camera</span>
        </button>

        <button
          v-else
          @click="startCamera"
          class="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-xs"
          title="Start camera stream"
        >
          <Video class="w-3.5 h-3.5" />
          <span>Start Camera</span>
        </button>

        <button
          @click="toggleLiveOverlay"
          :disabled="!isCameraStreaming"
          :class="[
            'text-xs font-medium px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5',
            !isCameraStreaming
              ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700'
              : liveOverlayEnabled
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          ]"
        >
          <ScanFace class="w-3.5 h-3.5" />
          Live Preview {{ liveOverlayEnabled ? 'ON' : 'OFF' }}
        </button>

        <label class="cursor-pointer bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition flex items-center gap-1.5">
          <Upload class="w-3.5 h-3.5" />
          Upload Image
          <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
        </label>
      </div>
    </div>

    <!-- Camera Viewport Container -->
    <div class="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 aspect-4/3 sm:aspect-16/10 flex items-center justify-center group shadow-inner">
      <!-- Video Element -->
      <video
        ref="videoRef"
        autoplay
        playsinline
        muted
        :class="['w-full h-full object-cover transition-transform duration-200', isMirrored ? '-scale-x-100' : '']"
      ></video>

      <!-- Overlay Canvas for Real-time Landmarks -->
      <canvas
        ref="liveCanvasRef"
        class="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
      ></canvas>

      <!-- Countdown Overlay -->
      <div
        v-if="countdown !== null"
        class="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex items-center justify-center"
      >
        <span class="text-7xl sm:text-9xl font-extrabold text-white animate-ping">
          {{ countdown }}
        </span>
      </div>

      <!-- Flash Shutter Effect -->
      <div
        v-if="isFlashing"
        class="absolute inset-0 bg-white z-40 transition-opacity duration-200"
      ></div>

      <!-- Loading / Placeholder State -->
      <div
        v-if="!isCameraStreaming && !cameraError"
        class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-950"
      >
        <div class="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-teal-400">
          <CameraOff class="w-8 h-8 opacity-60" />
        </div>
        <h3 class="text-base font-semibold text-white mb-1">Camera Stream Inactive</h3>
        <p class="text-xs text-slate-400 max-w-sm mb-5">
          Start your webcam to begin tracking facial parts or body matchstick pose in real time.
        </p>
        <div class="flex flex-wrap gap-2.5 justify-center">
          <button
            @click="startCamera"
            class="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
          >
            <Video class="w-4 h-4" />
            <span>Start Camera Feed</span>
          </button>
          <label class="cursor-pointer bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5">
            <Upload class="w-4 h-4" />
            <span>Upload Image Instead</span>
            <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
          </label>
        </div>
      </div>

      <!-- Error State -->
      <div
        v-if="cameraError"
        class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-950"
      >
        <div class="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3 text-red-400">
          <AlertCircle class="w-7 h-7" />
        </div>
        <h3 class="text-sm font-semibold text-red-400 mb-1">Camera Permission or Device Error</h3>
        <p class="text-xs text-slate-400 max-w-md mb-4">{{ cameraError }}</p>
        <div class="flex gap-2">
          <button
            @click="startCamera"
            class="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg border border-slate-700"
          >
            Retry Camera
          </button>
          <label class="cursor-pointer bg-teal-600 hover:bg-teal-500 text-white text-xs px-4 py-2 rounded-lg">
            Upload Image Instead
            <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
          </label>
        </div>
      </div>

      <!-- Active Video Recording Banner -->
      <div
        v-if="isRecordingVideo"
        class="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-rose-950/90 backdrop-blur-md border border-rose-500/50 px-4 py-1.5 rounded-full text-xs text-white shadow-2xl shadow-rose-900/50 font-mono"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
        <span class="font-bold text-rose-300">REC</span>
        <span class="font-black text-white">{{ formatRecordingTime(recordingDuration) }}</span>
        <span class="text-rose-400/80 hidden sm:inline">• Logging Power Metrics</span>
      </div>

      <!-- Real-time Live Indicators Badge Bar -->
      <div
        v-if="isCameraStreaming && liveDetectedPartsCount > 0"
        class="absolute top-3 left-3 z-30 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-full text-xs"
      >
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span class="text-slate-300 font-medium">{{ activeMode === 'body' ? 'Tracking Pose' : 'Tracking Face' }}</span>
        <span class="text-slate-500">|</span>
        <span class="text-teal-400 font-semibold">
          {{ activeMode === 'body' ? 'Skeleton Active' : `${liveDetectedPartsCount} Parts Found` }}
        </span>
      </div>

      <!-- Real-time Kinetic Force & Speed HUD (Body Mode) -->
      <div
        v-if="isCameraStreaming && activeMode === 'body' && liveMetrics"
        class="absolute bottom-3 left-3 z-30 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl text-xs flex items-center gap-3.5 shadow-xl"
      >
        <div class="flex items-center gap-1.5">
          <Zap class="w-3.5 h-3.5 text-cyan-400" />
          <span class="text-slate-400">Speed:</span>
          <span class="font-mono font-bold text-cyan-300">
            {{ Math.max(liveMetrics.left?.speedDeg || 0, liveMetrics.right?.speedDeg || 0) }}°/s
          </span>
        </div>

        <div class="hidden sm:flex items-center gap-1.5 border-l border-slate-800 pl-3">
          <Activity class="w-3.5 h-3.5 text-blue-400" />
          <span class="text-slate-400">Hand:</span>
          <span class="font-mono font-bold text-blue-300">
            {{ Math.max(liveMetrics.left?.handSpeedMs || 0, liveMetrics.right?.handSpeedMs || 0) }} m/s
          </span>
        </div>

        <div class="flex items-center gap-1.5 border-l border-slate-800 pl-3">
          <Flame class="w-3.5 h-3.5 text-pink-400" />
          <span class="text-slate-400">Force:</span>
          <span class="font-mono font-bold text-pink-400">
            {{ Math.max(liveMetrics.left?.forceN || 0, liveMetrics.right?.forceN || 0) }} N
          </span>
        </div>

        <div class="hidden sm:flex items-center gap-1.5 border-l border-slate-800 pl-3">
          <Trophy class="w-3.5 h-3.5 text-amber-400" />
          <span class="text-slate-400">Peak:</span>
          <span class="font-mono font-bold text-amber-400">
            {{ liveMetrics.peaks?.overallMaxForceN || 0 }} N
          </span>
          <button
            @click.stop="resetPeakForce"
            class="text-[10px] text-slate-500 hover:text-slate-300 ml-1 p-0.5"
            title="Reset Peak Force"
          >
            ↺
          </button>
        </div>
      </div>

      <!-- Mirror toggle badge -->
      <button
        v-if="isCameraStreaming"
        @click="isMirrored = !isMirrored"
        title="Toggle Mirror View"
        class="absolute top-3 right-3 z-30 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-slate-300 p-2 rounded-lg border border-slate-800/80 transition"
      >
        <FlipHorizontal class="w-4 h-4" />
      </button>
    </div>

    <!-- Capture Action Bar -->
    <div class="mt-5 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <!-- Legend Indicator Badges for Face Mode -->
        <div v-if="activeMode === 'face'" class="hidden md:flex items-center gap-2 text-xs">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span class="w-2 h-2 rounded-full bg-[#2563EB]"></span> Eyes (Blue)
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/30">
            <span class="w-2 h-2 rounded-full bg-[#16A34A]"></span> Ears (Green)
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/30">
            <span class="w-2 h-2 rounded-full bg-[#EC4899]"></span> Nose (Pink)
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <span class="w-2 h-2 rounded-full bg-[#0D9488]"></span> Mouth (Teal)
          </span>
        </div>

        <!-- Legend Indicator Badges for Body Mode -->
        <div v-else class="hidden md:flex items-center gap-2 text-xs">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <span class="w-2 h-2 rounded-full bg-cyan-500"></span> Matchstick Head & Torso
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span> Arms & Wrists
          </span>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Legs & Feet
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
        <button
          v-if="!isCameraStreaming"
          @click="startCamera"
          class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <Video class="w-4 h-4" />
          <span>Start Camera</span>
        </button>

        <template v-else>
          <!-- Active Recording State Button -->
          <button
            v-if="isRecordingVideo"
            @click="stopVideoRecording"
            :disabled="isProcessing"
            class="bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-rose-600/30 transition-all transform active:scale-95 flex items-center gap-2.5 animate-pulse"
          >
            <span class="w-3 h-3 rounded-full bg-white animate-ping"></span>
            <span>End Recording & Analyze ({{ recordingDuration }}s)</span>
          </button>

          <!-- Standard Idle Streaming Controls -->
          <template v-else>
            <!-- Start Video Recording Button -->
            <button
              v-if="activeMode === 'body'"
              @click="startVideoRecording"
              :disabled="isProcessing"
              class="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl shadow-lg shadow-pink-500/25 transition-all transform active:scale-95 flex items-center gap-2"
            >
              <Disc class="w-4 h-4 text-white" />
              <span>Record Video Session</span>
            </button>

            <button
              @click="startCountdownCapture(3)"
              :disabled="isProcessing"
              class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium px-4 py-3 rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <Timer class="w-4 h-4 text-amber-400" />
              3s Timer
            </button>

            <button
              @click="captureNow"
              :disabled="isProcessing"
              class="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl shadow-lg shadow-teal-500/25 transition-all transform active:scale-95 flex items-center gap-2"
            >
              <Camera class="w-4 h-4" />
              <span>{{ isProcessing ? 'Processing...' : 'Capture Photo' }}</span>
            </button>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Camera,
  CameraOff,
  Video,
  VideoOff,
  ScanFace,
  Upload,
  FlipHorizontal,
  Timer,
  AlertCircle,
  Zap,
  Activity,
  Flame,
  Trophy,
  Disc,
} from 'lucide-vue-next';
import { activeMode, setCapturedData, showToast } from '../services/appState';
import { getFaceLandmarker, detectFacialParts, drawFeatureBoxes, processLandmarks } from '../services/faceDetector';
import { getPoseLandmarker, detectPose, drawMatchstickFigure, processPoseLandmarks } from '../services/poseDetector';
import { BiomechanicsTracker } from '../services/biomechanics';
import { VideoSessionRecorder } from '../services/sessionRecorder';

const router = useRouter();

const videoRef = ref(null);
const liveCanvasRef = ref(null);
const isCameraStreaming = ref(false);
const cameraError = ref(null);
const isMirrored = ref(true);
const isFlashing = ref(false);
const isProcessing = ref(false);
const countdown = ref(null);
const liveOverlayEnabled = ref(true);
const liveDetectedPartsCount = ref(0);

const liveBiomechanics = new BiomechanicsTracker({ bodyWeightKg: 70 });
const liveMetrics = ref(null);

const sessionRecorder = new VideoSessionRecorder();
const isRecordingVideo = ref(false);
const recordingDuration = ref(0);
let recordingInterval = null;

function formatRecordingTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function startVideoRecording() {
  const stream = videoRef.value?.srcObject || mediaStream;
  if (!stream) {
    showToast('Cannot start recording: camera stream unavailable', 'error');
    return;
  }

  sessionRecorder.start(stream);
  isRecordingVideo.value = true;
  recordingDuration.value = 0;

  if (recordingInterval) clearInterval(recordingInterval);
  recordingInterval = setInterval(() => {
    recordingDuration.value += 1;
  }, 1000);

  showToast('Recording video & tracking live power metrics...', 'info');
}

async function stopVideoRecording() {
  if (!isRecordingVideo.value) return;
  if (recordingInterval) clearInterval(recordingInterval);
  isProcessing.value = true;

  try {
    const session = await sessionRecorder.stop();
    isRecordingVideo.value = false;

    setCapturedData({
      mode: 'video',
      videoSession: session,
    });

    showToast(`Video recorded (${session.durationSec}s)! Analyzing power metrics...`, 'success');
    router.push('/studio');
  } catch (err) {
    console.error('Error stopping video recording:', err);
    showToast(`Error completing video session: ${err.message}`, 'error');
  } finally {
    isProcessing.value = false;
  }
}

function resetPeakForce() {
  liveBiomechanics.resetPeaks();
  if (liveMetrics.value) {
    liveMetrics.value.peaks = liveBiomechanics.peaks;
  }
}

const videoDevices = ref([]);
const selectedDeviceId = ref('');
let mediaStream = null;
let animationFrameId = null;
let countdownTimer = null;

onMounted(async () => {
  await fetchVideoDevices();
  await startCamera();
  // Preload vision models
  getFaceLandmarker().catch((err) => console.warn('Preload face model:', err));
  getPoseLandmarker().catch((err) => console.warn('Preload pose model:', err));
});

onUnmounted(() => {
  stopCamera();
  if (countdownTimer) clearInterval(countdownTimer);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});

async function fetchVideoDevices() {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    videoDevices.value = devices.filter((d) => d.kind === 'videoinput');
    if (videoDevices.value.length > 0 && !selectedDeviceId.value) {
      selectedDeviceId.value = videoDevices.value[0].deviceId;
    }
  } catch (err) {
    console.error('Error fetching devices:', err);
  }
}

async function startCamera() {
  cameraError.value = null;
  stopCamera();

  const constraints = {
    audio: false,
    video: {
      deviceId: selectedDeviceId.value ? { exact: selectedDeviceId.value } : undefined,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user',
    },
  };

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
      await videoRef.value.play();
      isCameraStreaming.value = true;
      startLiveDetectionLoop();
    }
  } catch (err) {
    console.error('Camera access failed:', err);
    cameraError.value = err.name === 'NotAllowedError'
      ? 'Permission to access camera was denied. Please allow camera permissions in browser settings.'
      : `Unable to access webcam: ${err.message || err.name}`;
    isCameraStreaming.value = false;
  }
}

function stopCamera() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  if (liveCanvasRef.value) {
    const ctx = liveCanvasRef.value.getContext('2d');
    ctx.clearRect(0, 0, liveCanvasRef.value.width, liveCanvasRef.value.height);
  }
  liveDetectedPartsCount.value = 0;
  isCameraStreaming.value = false;
}

async function restartCamera() {
  await startCamera();
}

function toggleLiveOverlay() {
  liveOverlayEnabled.value = !liveOverlayEnabled.value;
  if (!liveOverlayEnabled.value && liveCanvasRef.value) {
    const ctx = liveCanvasRef.value.getContext('2d');
    ctx.clearRect(0, 0, liveCanvasRef.value.width, liveCanvasRef.value.height);
  }
}

/**
 * Real-time detection loop for live video overlay
 */
async function startLiveDetectionLoop() {
  let lastTime = 0;

  async function renderFrame(timestamp) {
    if (!isCameraStreaming.value || !videoRef.value || videoRef.value.paused || videoRef.value.ended) {
      return;
    }

    if (timestamp - lastTime > 70 && liveOverlayEnabled.value && videoRef.value.readyState >= 2) {
      lastTime = timestamp;
      try {
        const video = videoRef.value;
        const canvas = liveCanvasRef.value;
        if (canvas && video.videoWidth > 0) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (activeMode.value === 'body') {
            const poseLandmarker = await getPoseLandmarker();
            if (poseLandmarker) {
              const results = poseLandmarker.detect(video);
              const processed = processPoseLandmarks(results, canvas.width, canvas.height);
              liveDetectedPartsCount.value = processed.posesCount > 0 ? 33 : 0;

              if (processed.poseDetected) {
                const leftAngle = processed.poses[0]?.stickman?.angles?.leftElbow;
                const rightAngle = processed.poses[0]?.stickman?.angles?.rightElbow;
                const metrics = liveBiomechanics.update({
                  leftAngle,
                  rightAngle,
                  timestamp: performance.now(),
                });
                liveMetrics.value = metrics;

                if (isRecordingVideo.value) {
                  sessionRecorder.logFrame(metrics);
                }

                drawMatchstickFigure(ctx, processed, {
                  isMirrored: isMirrored.value,
                  canvasWidth: canvas.width,
                  lineWidth: 3.5,
                  jointRadius: 4.5,
                  lineColor: '#06B6D4',
                  jointColor: '#22D3EE',
                  headColor: '#06B6D4',
                  glowColor: 'rgba(6, 182, 212, 0.4)',
                  biomechanics: metrics,
                  showForceMetrics: true,
                });
              }
            }
          } else {
            const landmarker = await getFaceLandmarker();
            if (landmarker) {
              const results = landmarker.detect(video);
              const processed = processLandmarks(results, canvas.width, canvas.height);
              liveDetectedPartsCount.value = processed.features.length;

              if (processed.faceDetected) {
                let displayFeatures = processed.features;
                if (isMirrored.value) {
                  displayFeatures = processed.features.map((f) => ({
                    ...f,
                    x: Math.max(0, canvas.width - f.x - f.width),
                  }));
                }

                drawFeatureBoxes(ctx, displayFeatures, {
                  showEyes: true,
                  showEars: true,
                  showNose: true,
                  showMouth: true,
                  showLabels: true,
                  showCoordinates: false,
                  lineWidth: 2.5,
                  fillOpacity: 0.08,
                });
              }
            }
          }
        }
      } catch (e) {
        // Continue loop gracefully
      }
    }

    animationFrameId = requestAnimationFrame(renderFrame);
  }

  animationFrameId = requestAnimationFrame(renderFrame);
}

function startCountdownCapture(seconds = 3) {
  if (countdownTimer) clearInterval(countdownTimer);
  countdown.value = seconds;

  countdownTimer = setInterval(() => {
    if (countdown.value > 1) {
      countdown.value -= 1;
    } else {
      clearInterval(countdownTimer);
      countdown.value = null;
      captureNow();
    }
  }, 1000);
}

async function captureNow() {
  if (!videoRef.value || isProcessing.value) return;

  isProcessing.value = true;
  triggerFlash();

  try {
    const video = videoRef.value;
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth || 1280;
    captureCanvas.height = video.videoHeight || 720;

    const ctx = captureCanvas.getContext('2d');

    if (isMirrored.value) {
      ctx.translate(captureCanvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    const rawDataUrl = captureCanvas.toDataURL('image/jpeg', 0.95);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = rawDataUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    if (activeMode.value === 'body') {
      const poseData = await detectPose(img);
      setCapturedData({
        mode: 'body',
        rawImageUrl: rawDataUrl,
        imageElement: img,
        width: captureCanvas.width,
        height: captureCanvas.height,
        poseData,
        biomechanics: liveMetrics.value,
      });
    } else {
      const detectionData = await detectFacialParts(img);
      setCapturedData({
        mode: 'face',
        rawImageUrl: rawDataUrl,
        imageElement: img,
        width: captureCanvas.width,
        height: captureCanvas.height,
        detectionData,
      });
    }

    showToast(
      `${activeMode.value === 'body' ? 'Matchstick skeleton' : 'Facial features'} analyzed successfully!`,
      'success'
    );
    router.push('/studio');
  } catch (err) {
    console.error('Capture processing error:', err);
    showToast(`Error analyzing capture: ${err.message}`, 'error');
  } finally {
    isProcessing.value = false;
  }
}

function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  isProcessing.value = true;
  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const rawDataUrl = e.target.result;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = rawDataUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      if (activeMode.value === 'body') {
        const poseData = await detectPose(img);
        setCapturedData({
          mode: 'body',
          rawImageUrl: rawDataUrl,
          imageElement: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          poseData,
          biomechanics: liveMetrics.value,
        });
      } else {
        const detectionData = await detectFacialParts(img);
        setCapturedData({
          mode: 'face',
          rawImageUrl: rawDataUrl,
          imageElement: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          detectionData,
        });
      }

      showToast('Uploaded image analyzed successfully!', 'success');
      router.push('/studio');
    } catch (err) {
      console.error('File analysis error:', err);
      showToast(`Error analyzing uploaded image: ${err.message}`, 'error');
    } finally {
      isProcessing.value = false;
      event.target.value = '';
    }
  };

  reader.readAsDataURL(file);
}

function triggerFlash() {
  isFlashing.value = true;
  setTimeout(() => {
    isFlashing.value = false;
  }, 200);
}
</script>
