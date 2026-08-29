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
            Facial Annotation Studio
            <span
              v-if="detectionData.faceDetected"
              class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium"
            >
              {{ detectionData.features.length }} Features Identified
            </span>
            <span
              v-else
              class="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium"
            >
              No Face Detected
            </span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Bounding boxes: Eyes (Blue), Ears (Green), Nose (Pink), Mouth (Teal)
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
          @click="downloadAnnotatedImage"
          class="bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
        >
          <Download class="w-3.5 h-3.5 text-teal-400" />
          Download Highlighted
        </button>

        <button
          @click="saveToIndexedDB"
          :disabled="isSaving || isSaved"
          class="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
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

        <!-- Canvas Quick Controls Bar -->
        <div class="w-full mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              {{ canvasDimensions.width }} × {{ canvasDimensions.height }} px
            </span>
          </div>

          <div class="flex items-center gap-4">
            <label class="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
              <input
                type="checkbox"
                v-model="renderOptions.showCoordinates"
                @change="redrawCanvas"
                class="rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-800 w-3.5 h-3.5"
              />
              Show Dimensions
            </label>

            <label class="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
              <input
                type="checkbox"
                v-model="renderOptions.showLabels"
                @change="redrawCanvas"
                class="rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-800 w-3.5 h-3.5"
              />
              Show Tags
            </label>
          </div>
        </div>
      </div>

      <!-- Right Column: Layer Toggles & Feature Coordinates -->
      <div class="lg:col-span-4 space-y-5">
        <!-- Feature Visibility Card -->
        <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
          <h3 class="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
            <Layers class="w-4 h-4 text-teal-400" />
            Layer Visibility & Colors
          </h3>

          <div class="space-y-2.5">
            <!-- Eyes -->
            <label
              class="flex items-center justify-between p-3 rounded-xl border transition cursor-pointer"
              :class="renderOptions.showEyes ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60'"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-3.5 h-3.5 rounded-full bg-[#2563EB] shadow-xs"></span>
                <span class="text-xs font-semibold">Eyes (Blue)</span>
              </div>
              <input
                type="checkbox"
                v-model="renderOptions.showEyes"
                @change="redrawCanvas"
                class="rounded border-blue-500/50 text-blue-600 focus:ring-blue-500 bg-slate-900 w-4 h-4 cursor-pointer"
              />
            </label>

            <!-- Ears -->
            <label
              class="flex items-center justify-between p-3 rounded-xl border transition cursor-pointer"
              :class="renderOptions.showEars ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60'"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-3.5 h-3.5 rounded-full bg-[#16A34A] shadow-xs"></span>
                <span class="text-xs font-semibold">Ears (Green)</span>
              </div>
              <input
                type="checkbox"
                v-model="renderOptions.showEars"
                @change="redrawCanvas"
                class="rounded border-green-500/50 text-green-600 focus:ring-green-500 bg-slate-900 w-4 h-4 cursor-pointer"
              />
            </label>

            <!-- Nose -->
            <label
              class="flex items-center justify-between p-3 rounded-xl border transition cursor-pointer"
              :class="renderOptions.showNose ? 'bg-pink-500/10 border-pink-500/30 text-pink-300' : 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60'"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-3.5 h-3.5 rounded-full bg-[#EC4899] shadow-xs"></span>
                <span class="text-xs font-semibold">Nose (Pink)</span>
              </div>
              <input
                type="checkbox"
                v-model="renderOptions.showNose"
                @change="redrawCanvas"
                class="rounded border-pink-500/50 text-pink-600 focus:ring-pink-500 bg-slate-900 w-4 h-4 cursor-pointer"
              />
            </label>

            <!-- Mouth -->
            <label
              class="flex items-center justify-between p-3 rounded-xl border transition cursor-pointer"
              :class="renderOptions.showMouth ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' : 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-60'"
            >
              <div class="flex items-center gap-2.5">
                <span class="w-3.5 h-3.5 rounded-full bg-[#0D9488] shadow-xs"></span>
                <span class="text-xs font-semibold">Mouth (Teal)</span>
              </div>
              <input
                type="checkbox"
                v-model="renderOptions.showMouth"
                @change="redrawCanvas"
                class="rounded border-teal-500/50 text-teal-600 focus:ring-teal-500 bg-slate-900 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </div>

        <!-- Styling Sliders Card -->
        <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          <h3 class="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <SlidersHorizontal class="w-4 h-4 text-teal-400" />
            Display Properties
          </h3>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>Border Thickness:</span>
              <span class="font-mono text-slate-200">{{ renderOptions.lineWidth }}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              v-model.number="renderOptions.lineWidth"
              @input="redrawCanvas"
              class="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>Box Tint Fill:</span>
              <span class="font-mono text-slate-200">{{ Math.round(renderOptions.fillOpacity * 100) }}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.4"
              step="0.02"
              v-model.number="renderOptions.fillOpacity"
              @input="redrawCanvas"
              class="w-full accent-teal-500 cursor-pointer"
            />
          </div>
        </div>

        <!-- Coordinates Details List -->
        <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
          <h3 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Crosshair class="w-4 h-4 text-teal-400" />
            Detected Coordinates
          </h3>

          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div
              v-for="f in detectionData.features"
              :key="f.id || f.name"
              class="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: f.color }"></span>
                <span class="font-semibold text-slate-200">{{ f.name }}</span>
              </div>
              <div class="text-[11px] font-mono text-slate-400">
                x:{{ f.x }}, y:{{ f.y }} [{{ f.width }}×{{ f.height }}]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  RotateCcw,
  Download,
  Save,
  CheckCircle2,
  Layers,
  SlidersHorizontal,
  Crosshair,
} from 'lucide-vue-next';
import { drawFeatureBoxes } from '../services/faceDetector';
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
  detectionData: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['retake', 'saved', 'error']);

const canvasRef = ref(null);
const isSaving = ref(false);
const isSaved = ref(false);
const canvasDimensions = reactive({ width: 0, height: 0 });

const renderOptions = reactive({
  showEyes: true,
  showEars: true,
  showNose: true,
  showMouth: true,
  showLabels: true,
  showCoordinates: false,
  lineWidth: 3,
  fillOpacity: 0.12,
});

onMounted(() => {
  renderCanvas();
});

watch(
  () => props.detectionData,
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

  canvasDimensions.width = canvas.width;
  canvasDimensions.height = canvas.height;

  redrawCanvas();
}

function redrawCanvas() {
  const canvas = canvasRef.value;
  if (!canvas || !props.imageElement) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw raw photo
  ctx.drawImage(props.imageElement, 0, 0, canvas.width, canvas.height);

  // 2. Draw colored bounding boxes
  if (props.detectionData?.features) {
    drawFeatureBoxes(ctx, props.detectionData.features, renderOptions);
  }
}

function downloadAnnotatedImage() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const link = document.createElement('a');
  link.download = `face-highlighted-${Date.now()}.png`;
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
      title: `Face Capture ${new Date().toLocaleTimeString()}`,
      type: 'face',
      raw_image: props.rawImageUrl,
      annotated_image: annotatedDataUrl,
      features: props.detectionData,
      face_detected: props.detectionData.faceDetected,
      confidence: 0.98,
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
    console.error('Failed to save to IndexedDB:', err);
    emit('error', 'Error saving to local storage: ' + err.message);
  } finally {
    isSaving.value = false;
  }
}
</script>
