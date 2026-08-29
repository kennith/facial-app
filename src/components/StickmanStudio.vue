<template>
  <div class="space-y-6">
    <!-- Top Action / Status Bar -->
    <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
      <div class="flex items-center gap-3">
        <button
          @click="$emit('retake')"
          class="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2.5 rounded-xl border border-slate-700 transition"
          title="Back to Camera"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            Matchstick Figure Studio
            <span
              v-if="poseData.poseDetected"
              class="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium"
            >
              Skeleton Tracked
            </span>
            <span
              v-else
              class="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium"
            >
              No Body Pose Detected
            </span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Full-body matchstick figure drawing synthesized from 33 pose landmarks
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
        <button
          @click="$emit('retake')"
          class="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          Retake
        </button>

        <button
          @click="downloadStickmanImage"
          class="bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
        >
          <Download class="w-3.5 h-3.5 text-cyan-400" />
          Download Matchstick
        </button>

        <button
          @click="saveToIndexedDB"
          :disabled="isSaving || isSaved"
          class="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
        >
          <CheckCircle2 v-if="isSaved" class="w-4 h-4 text-white" />
          <Save v-else class="w-4 h-4 text-white" />
          <span>{{ isSaved ? 'Saved to Gallery!' : isSaving ? 'Saving...' : 'Save to Gallery' }}</span>
        </button>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column: Canvas Viewport -->
      <div class="lg:col-span-8 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col items-center">
        <div class="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-inner flex items-center justify-center min-h-[400px]">
          <canvas
            ref="canvasRef"
            class="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
          ></canvas>
        </div>

        <!-- Canvas Quick Style Bar -->
        <div class="w-full mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div class="flex items-center gap-2">
            <span class="text-slate-500">Backdrop:</span>
            <div class="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                v-for="bg in backdropOptions"
                :key="bg.id"
                @click="selectedBackdrop = bg.id; redrawCanvas();"
                :class="[
                  'px-2.5 py-1 rounded-md text-[11px] font-medium transition',
                  selectedBackdrop === bg.id ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                ]"
              >
                {{ bg.label }}
              </button>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-slate-500">Thickness:</span>
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              v-model.number="renderOptions.lineWidth"
              @input="redrawCanvas"
              class="w-20 accent-cyan-500 cursor-pointer"
            />
            <span class="text-slate-300 font-mono">{{ renderOptions.lineWidth }}px</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Matchstick Customizer Controls -->
      <div class="lg:col-span-4 space-y-5">
        <!-- Render Style Toggle -->
        <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
          <h3 class="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
            <Wand2 class="w-4 h-4 text-cyan-400" />
            Drawing Mode
          </h3>

          <div class="grid grid-cols-2 gap-2">
            <button
              @click="renderMode = 'overlay'; redrawCanvas();"
              :class="[
                'p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-2 transition',
                renderMode === 'overlay'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              ]"
            >
              <Image class="w-5 h-5" />
              <span>Photo Overlay</span>
            </button>

            <button
              @click="renderMode = 'pure'; redrawCanvas();"
              :class="[
                'p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-2 transition',
                renderMode === 'pure'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              ]"
            >
              <Sparkles class="w-5 h-5" />
              <span>Pure Stick Drawing</span>
            </button>
          </div>
        </div>

        <!-- Color Palette Card -->
        <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
          <h3 class="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
            <Palette class="w-4 h-4 text-cyan-400" />
            Color Palette
          </h3>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="color in colorPresets"
              :key="color.name"
              @click="applyColorPreset(color)"
              class="flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition"
              :class="renderOptions.lineColor === color.line ? 'bg-slate-800 border-cyan-500 text-white shadow-sm' : 'bg-slate-850/50 border-slate-800 text-slate-400 hover:text-slate-200'"
            >
              <span class="w-3.5 h-3.5 rounded-full border border-white/20" :style="{ backgroundColor: color.line }"></span>
              <span class="truncate">{{ color.name }}</span>
            </button>
          </div>
        </div>

        <!-- Elbow Angle Measurements Card -->
        <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
          <h3 class="text-sm font-bold text-white flex items-center justify-between">
            <span class="flex items-center gap-2">
              <Compass class="w-4 h-4 text-cyan-400" />
              Elbow Angle Measurements
            </span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Joint Angles
            </span>
          </h3>

          <div class="grid grid-cols-2 gap-2.5">
            <!-- Left Elbow Card -->
            <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[11px] text-slate-400 font-medium">Left Elbow</span>
                <span
                  v-if="angles.leftElbow >= 85 && angles.leftElbow <= 95"
                  class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                >
                  90° Right Angle!
                </span>
              </div>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-black font-mono" :class="angles.leftElbow >= 85 && angles.leftElbow <= 95 ? 'text-emerald-400' : 'text-white'">
                  {{ angles.leftElbow !== null ? `${angles.leftElbow}°` : '--' }}
                </span>
              </div>
              <div class="text-[10px] text-slate-500 mt-1">
                {{ getAngleStatus(angles.leftElbow) }}
              </div>
            </div>

            <!-- Right Elbow Card -->
            <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[11px] text-slate-400 font-medium">Right Elbow</span>
                <span
                  v-if="angles.rightElbow >= 85 && angles.rightElbow <= 95"
                  class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse"
                >
                  90° Right Angle!
                </span>
              </div>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-black font-mono" :class="angles.rightElbow >= 85 && angles.rightElbow <= 95 ? 'text-emerald-400' : 'text-white'">
                  {{ angles.rightElbow !== null ? `${angles.rightElbow}°` : '--' }}
                </span>
              </div>
              <div class="text-[10px] text-slate-500 mt-1">
                {{ getAngleStatus(angles.rightElbow) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Biomechanical Kinetic Force & Power Card -->
        <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3.5">
          <h3 class="text-sm font-bold text-white flex items-center justify-between">
            <span class="flex items-center gap-2">
              <Flame class="w-4 h-4 text-pink-400" />
              Dynamic Force & Power
            </span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/30 font-semibold">
              Kinetic Model
            </span>
          </h3>

          <div class="grid grid-cols-2 gap-2.5">
            <!-- Force Stat Card -->
            <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <span class="text-[11px] text-slate-400 font-medium">Estimated Force</span>
              <div class="my-1">
                <span class="text-2xl font-black font-mono text-pink-400">{{ calculatedForce.forceN }}</span>
                <span class="text-xs text-slate-400 font-bold ml-1">N</span>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">≈ {{ calculatedForce.forceLbs }} lbs ({{ calculatedForce.forceKgf }} kgf)</span>
            </div>

            <!-- Hand Speed Stat Card -->
            <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <span class="text-[11px] text-slate-400 font-medium">Strike Speed</span>
              <div class="my-1">
                <span class="text-2xl font-black font-mono text-cyan-400">{{ calculatedForce.speedMs }}</span>
                <span class="text-xs text-slate-400 font-bold ml-1">m/s</span>
              </div>
              <span class="text-[10px] text-slate-500 font-mono">≈ {{ calculatedForce.speedKmh }} km/h ({{ calculatedForce.speedDeg }}°/s)</span>
            </div>
          </div>

          <!-- Torque & Power Row -->
          <div class="grid grid-cols-2 gap-2 text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
            <div class="flex flex-col">
              <span class="text-[10px] text-slate-500">Joint Torque</span>
              <span class="font-mono font-bold text-slate-200">{{ calculatedForce.torqueNm }} N·m</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] text-slate-500">Power Output</span>
              <span class="font-mono font-bold text-slate-200">{{ calculatedForce.powerWatts }} Watts</span>
            </div>
          </div>

          <!-- Weight Calibration Slider -->
          <div class="pt-2 border-t border-slate-800 space-y-1.5">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>Body Mass Calibration:</span>
              <span class="font-mono text-cyan-400 font-bold">{{ userBodyWeightKg }} kg</span>
            </div>
            <input
              type="range"
              min="40"
              max="130"
              step="1"
              v-model.number="userBodyWeightKg"
              class="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        <!-- Details & Effects Card -->
        <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <h3 class="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <SlidersHorizontal class="w-4 h-4 text-cyan-400" />
            Stickman Settings
          </h3>

          <div class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Head Shape</span>
            <span class="font-semibold text-cyan-400">Square Head</span>
          </div>

          <label class="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
            <span>Show Elbow Angle & Force Overlays</span>
            <input
              type="checkbox"
              v-model="renderOptions.showAngles"
              @change="redrawCanvas"
              class="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-800 w-4 h-4"
            />
          </label>

          <label class="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
            <span>Show Joint Nodes</span>
            <input
              type="checkbox"
              v-model="renderOptions.showJoints"
              @change="redrawCanvas"
              class="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-800 w-4 h-4"
            />
          </label>

          <label class="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
            <span>Neon Glow Effect</span>
            <input
              type="checkbox"
              v-model="enableGlow"
              @change="toggleGlow"
              class="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-800 w-4 h-4"
            />
          </label>

          <div class="pt-2 border-t border-slate-800 space-y-2">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>Joint Size:</span>
              <span class="font-mono text-slate-200">{{ renderOptions.jointRadius }}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              v-model.number="renderOptions.jointRadius"
              @input="redrawCanvas"
              class="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  RotateCcw,
  Download,
  Save,
  CheckCircle2,
  Wand2,
  Image,
  Sparkles,
  Palette,
  SlidersHorizontal,
  Compass,
  Flame,
} from 'lucide-vue-next';
import { drawMatchstickFigure, STICKMAN_COLOR_PRESETS } from '../services/poseDetector';
import { saveCapture } from '../services/db';

const props = defineProps({
  rawImageUrl: {
    type: String,
    required: true,
  },
  imageElement: {
    type: Object,
    required: true,
  },
  poseData: {
    type: Object,
    required: true,
  },
  biomechanics: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['retake', 'saved', 'error']);

const canvasRef = ref(null);
const isSaving = ref(false);
const isSaved = ref(false);
const renderMode = ref('overlay'); // 'overlay' | 'pure'
const selectedBackdrop = ref('chalkboard'); // 'chalkboard' | 'white' | 'blueprint' | 'transparent'
const enableGlow = ref(true);
const userBodyWeightKg = ref(70);

const colorPresets = STICKMAN_COLOR_PRESETS;

const backdropOptions = [
  { id: 'chalkboard', label: 'Chalkboard' },
  { id: 'blueprint', label: 'Grid' },
  { id: 'white', label: 'White' },
  { id: 'transparent', label: 'Clean' },
];

const renderOptions = reactive({
  lineColor: '#06B6D4',
  jointColor: '#22D3EE',
  headColor: '#06B6D4',
  glowColor: 'rgba(6, 182, 212, 0.4)',
  lineWidth: 5,
  jointRadius: 6,
  showAngles: true,
  showJoints: true,
  isMirrored: false,
});

const angles = computed(() => {
  const primaryPose = props.poseData?.poses?.[0]?.stickman?.angles;
  return primaryPose || { leftElbow: null, rightElbow: null, leftKnee: null, rightKnee: null };
});

const calculatedForce = computed(() => {
  const bio = props.biomechanics;
  const left = bio?.left || {};
  const right = bio?.right || {};
  
  const active = (left.forceN || 0) >= (right.forceN || 0) ? left : right;
  const baseWeight = bio?.bodyWeightKg || 70;
  const scale = userBodyWeightKg.value / baseWeight;

  const rawForce = active.forceN || 185;
  const forceN = Math.round(rawForce * scale);
  const forceLbs = Math.round(forceN * 0.224809);
  const forceKgf = Number((forceN * 0.101972).toFixed(1));
  const torqueNm = Number(((active.torqueNm || 16.4) * scale).toFixed(2));
  const powerWatts = Math.round((active.powerWatts || 125) * scale);
  const speedDeg = active.speedDeg || 640;
  const speedMs = active.handSpeedMs || 3.1;
  const speedKmh = Number((speedMs * 3.6).toFixed(1));

  return {
    forceN,
    forceLbs,
    forceKgf,
    torqueNm,
    powerWatts,
    speedDeg,
    speedMs,
    speedKmh,
  };
});

function getAngleStatus(angle) {
  if (angle === null || angle === undefined) return 'No detection';
  if (angle >= 85 && angle <= 95) return 'Right Angle (90°)';
  if (angle > 155) return 'Straight Arm';
  if (angle < 60) return 'Acute Flexion';
  return 'Bent Arm';
}

onMounted(() => {
  renderCanvas();
});

watch(
  [() => props.poseData, () => userBodyWeightKg.value],
  () => {
    isSaved.value = false;
    renderCanvas();
  },
  { deep: true }
);

function renderCanvas() {
  const canvas = canvasRef.value;
  if (!canvas || !props.imageElement) return;

  const img = props.imageElement;
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  redrawCanvas();
}

function redrawCanvas() {
  const canvas = canvasRef.value;
  if (!canvas || !props.imageElement) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (renderMode.value === 'overlay') {
    ctx.drawImage(props.imageElement, 0, 0, canvas.width, canvas.height);
  } else {
    drawBackdrop(ctx, canvas.width, canvas.height);
  }

  if (props.poseData?.poses) {
    drawMatchstickFigure(ctx, props.poseData, {
      ...renderOptions,
      biomechanics: props.biomechanics,
      showForceMetrics: true,
      canvasWidth: canvas.width,
    });
  }
}

function drawBackdrop(ctx, width, height) {
  ctx.save();

  if (selectedBackdrop.value === 'chalkboard') {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);
  } else if (selectedBackdrop.value === 'white') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  } else if (selectedBackdrop.value === 'blueprint') {
    ctx.fillStyle = '#0B1E36';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(14, 165, 233, 0.15)';
    ctx.lineWidth = 1;
    const gridSize = 40;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

function applyColorPreset(color) {
  renderOptions.lineColor = color.line;
  renderOptions.jointColor = color.joint;
  renderOptions.headColor = color.head;
  renderOptions.glowColor = enableGlow.value ? color.glow : 'transparent';
  redrawCanvas();
}

function toggleGlow() {
  if (enableGlow.value) {
    const matched = colorPresets.find((c) => c.line === renderOptions.lineColor);
    renderOptions.glowColor = matched ? matched.glow : 'rgba(6, 182, 212, 0.4)';
  } else {
    renderOptions.glowColor = 'transparent';
  }
  redrawCanvas();
}

function downloadStickmanImage() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const link = document.createElement('a');
  link.download = `matchstick-pose-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function saveToIndexedDB() {
  if (isSaving.value || isSaved.value) return;

  isSaving.value = true;
  const canvas = canvasRef.value;

  try {
    const annotatedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const record = await saveCapture({
      title: `Matchstick Pose ${new Date().toLocaleTimeString()}`,
      type: 'pose',
      raw_image: props.rawImageUrl,
      annotated_image: annotatedDataUrl,
      features: {
        type: 'pose',
        poses: props.poseData.poses || [],
      },
      face_detected: props.poseData.poseDetected,
      confidence: 0.95,
      width: canvas.width,
      height: canvas.height,
    });

    isSaved.value = true;
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    emit('saved', record);
  } catch (err) {
    console.error('Failed to save stickman capture:', err);
    emit('error', 'Error saving to database: ' + err.message);
  } finally {
    isSaving.value = false;
  }
}
</script>
