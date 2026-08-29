<template>
  <div class="space-y-6">
    <!-- Header Bar -->
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
            Video Power & Biomechanics Analytics
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 font-medium">
              {{ analytics.strikeCount }} Strikes Analyzed
            </span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Full session kinetic force, angular speed, torque, and power output breakdown
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
          Record Again
        </button>

        <button
          v-if="videoUrl"
          @click="downloadVideo"
          class="bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
        >
          <Download class="w-3.5 h-3.5 text-cyan-400" />
          Download Video
        </button>

        <button
          @click="saveSessionToDB"
          :disabled="isSaving || isSaved"
          class="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-pink-500/20 transition flex items-center gap-2"
        >
          <CheckCircle2 v-if="isSaved" class="w-4 h-4 text-white" />
          <Save v-else class="w-4 h-4 text-white" />
          <span>{{ isSaved ? 'Session Saved!' : isSaving ? 'Saving...' : 'Save to Gallery' }}</span>
        </button>
      </div>
    </div>

    <!-- Power Analytics Dashboard Metric Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      <!-- 1. Strikes / Reps -->
      <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
          <span>Strikes / Reps</span>
          <Award class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-3xl font-black font-mono text-white mb-1">
          {{ analytics.strikeCount }}
        </div>
        <div class="text-[11px] text-slate-500">
          Detected motion cycles
        </div>
      </div>

      <!-- 2. Peak Force -->
      <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
          <span>Peak Force</span>
          <Flame class="w-4 h-4 text-pink-400" />
        </div>
        <div class="text-3xl font-black font-mono text-pink-400 mb-1">
          {{ analytics.peakForceN }}<span class="text-sm text-slate-400 font-bold ml-1">N</span>
        </div>
        <div class="text-[11px] text-slate-500 font-mono">
          ≈ {{ analytics.peakForceLbs }} lbs ({{ analytics.peakForceKgf }} kgf)
        </div>
      </div>

      <!-- 3. Average Force -->
      <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
          <span>Average Force</span>
          <BarChart2 class="w-4 h-4 text-cyan-400" />
        </div>
        <div class="text-3xl font-black font-mono text-cyan-400 mb-1">
          {{ analytics.avgForceN }}<span class="text-sm text-slate-400 font-bold ml-1">N</span>
        </div>
        <div class="text-[11px] text-slate-500 font-mono">
          Mean dynamic load
        </div>
      </div>

      <!-- 4. Max Strike Speed -->
      <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
          <span>Max Velocity</span>
          <Zap class="w-4 h-4 text-blue-400" />
        </div>
        <div class="text-3xl font-black font-mono text-blue-400 mb-1">
          {{ analytics.maxHandSpeedMs }}<span class="text-sm text-slate-400 font-bold ml-1">m/s</span>
        </div>
        <div class="text-[11px] text-slate-500 font-mono">
          {{ analytics.maxHandSpeedKmh }} km/h ({{ analytics.maxSpeedDeg }}°/s)
        </div>
      </div>

      <!-- 5. Peak Power Output -->
      <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
          <span>Peak Power</span>
          <Activity class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="text-3xl font-black font-mono text-emerald-400 mb-1">
          {{ analytics.peakPowerWatts }}<span class="text-sm text-slate-400 font-bold ml-1">W</span>
        </div>
        <div class="text-[11px] text-slate-500 font-mono">
          Avg: {{ analytics.avgPowerWatts }} Watts
        </div>
      </div>

      <!-- 6. Total Energy / Duration -->
      <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
          <span>Total Work</span>
          <Clock class="w-4 h-4 text-indigo-400" />
        </div>
        <div class="text-3xl font-black font-mono text-indigo-400 mb-1">
          {{ analytics.totalWorkJoules }}<span class="text-sm text-slate-400 font-bold ml-1">J</span>
        </div>
        <div class="text-[11px] text-slate-500 font-mono">
          {{ durationSec }}s ({{ analytics.caloriesKcal }} kcal)
        </div>
      </div>
    </div>

    <!-- Main Content: Video Player + Synchronized Force Waveform Timeline -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Video Playback Container -->
      <div class="lg:col-span-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-2xl space-y-4">
        <div class="relative w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-4/3 sm:aspect-16/10 flex items-center justify-center shadow-inner">
          <video
            ref="videoElementRef"
            :src="videoUrl"
            playsinline
            @timeupdate="onVideoTimeUpdate"
            @ended="isPlaying = false"
            class="w-full h-full object-contain"
          ></video>

          <!-- Play/Pause Overlay button -->
          <button
            v-if="!isPlaying"
            @click="togglePlay"
            class="absolute w-16 h-16 rounded-full bg-slate-900/80 hover:bg-pink-600 border border-slate-700 text-white flex items-center justify-center shadow-2xl transition transform active:scale-95 cursor-pointer"
          >
            <Play class="w-7 h-7 fill-current ml-1" />
          </button>
        </div>

        <!-- Video Controls Bar -->
        <div class="flex items-center justify-between gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div class="flex items-center gap-2">
            <button
              @click="togglePlay"
              class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
            >
              <Pause v-if="isPlaying" class="w-4 h-4" />
              <Play v-else class="w-4 h-4 fill-current" />
            </button>
            <button
              @click="restartVideo"
              class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Restart"
            >
              <RotateCcw class="w-4 h-4" />
            </button>
            <span class="font-mono text-slate-300 font-medium ml-1">
              {{ formatTime(currentTime) }} / {{ formatTime(durationSec) }}
            </span>
          </div>

          <!-- Playback Speed Pills -->
          <div class="flex items-center gap-1.5">
            <button
              v-for="rate in [0.5, 1.0, 2.0]"
              :key="rate"
              @click="setPlaybackRate(rate)"
              :class="[
                'px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition',
                playbackRate === rate ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              ]"
            >
              {{ rate }}x
            </button>
          </div>
        </div>
      </div>

      <!-- Synchronized Force & Speed Time-Series Chart -->
      <div class="lg:col-span-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-2xl space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-pink-400" />
            Kinetic Force (N) vs Timeline
          </h3>
          <div class="flex items-center gap-3 text-[11px]">
            <span class="inline-flex items-center gap-1 text-pink-400 font-semibold">
              <span class="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Force (N)
            </span>
            <span class="inline-flex items-center gap-1 text-cyan-400 font-semibold">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Speed (°/s)
            </span>
          </div>
        </div>

        <!-- Interactive SVG Chart -->
        <div
          class="relative w-full h-56 bg-slate-950 rounded-xl border border-slate-800/80 p-3 overflow-hidden cursor-crosshair select-none"
          @mousedown="startScrubbing"
          @mousemove="onChartMouseMove"
          @mouseup="stopScrubbing"
          @mouseleave="stopScrubbing"
          ref="chartContainerRef"
        >
          <!-- SVG Waveform -->
          <svg class="w-full h-full overflow-visible" :viewBox="`0 0 ${chartWidth} ${chartHeight}`">
            <!-- Grid Lines -->
            <line
              v-for="y in [0.25, 0.5, 0.75]"
              :key="y"
              x1="0"
              :y1="chartHeight * y"
              :x2="chartWidth"
              :y2="chartHeight * y"
              stroke="#1e293b"
              stroke-dasharray="3,3"
            />

            <!-- Force Area Fill -->
            <path :d="forceAreaPath" fill="rgba(236, 72, 153, 0.15)" />

            <!-- Force Path -->
            <path :d="forceLinePath" fill="none" stroke="#EC4899" stroke-width="2.5" stroke-linecap="round" />

            <!-- Speed Path (dashed cyan) -->
            <path :d="speedLinePath" fill="none" stroke="#06B6D4" stroke-width="1.8" stroke-dasharray="4,3" />

            <!-- Strike Peak Marker Dots -->
            <g v-for="(strike, idx) in analytics.strikes" :key="idx">
              <circle
                :cx="timeToX(strike.time)"
                :cy="forceToY(strike.peakForceN)"
                r="4.5"
                fill="#F43F5E"
                stroke="#FFFFFF"
                stroke-width="1.5"
              />
            </g>

            <!-- Active Playhead / Scrubber Line -->
            <line
              :x1="timeToX(currentTime)"
              y1="0"
              :x2="timeToX(currentTime)"
              :y2="chartHeight"
              stroke="#FBBF24"
              stroke-width="2"
              stroke-dasharray="2,2"
            />
            <circle
              :cx="timeToX(currentTime)"
              :cy="forceToY(currentSample?.activeForceN || 0)"
              r="6"
              fill="#FBBF24"
              stroke="#090D16"
              stroke-width="2"
            />
          </svg>

          <!-- Current Frame HUD Floating Tooltip -->
          <div
            class="absolute top-2 left-2 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-3 font-mono shadow-xl"
          >
            <span class="text-amber-400 font-bold">{{ currentTime.toFixed(2) }}s</span>
            <span class="text-pink-400 font-bold">⚡ {{ currentSample?.activeForceN || 0 }} N</span>
            <span class="text-cyan-400 font-bold">🚀 {{ currentSample?.activeSpeedDeg || 0 }}°/s</span>
          </div>
        </div>

        <!-- Interactive Scrub Slider -->
        <div class="space-y-1">
          <input
            type="range"
            min="0"
            :max="durationSec"
            step="0.02"
            v-model.number="currentTime"
            @input="seekVideo"
            class="w-full accent-pink-500 cursor-pointer"
          />
          <div class="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>0.00s</span>
            <span class="text-slate-400">Drag to inspect strike waveform at exact millisecond</span>
            <span>{{ durationSec.toFixed(2) }}s</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  RotateCcw,
  Download,
  Save,
  CheckCircle2,
  Play,
  Pause,
  Flame,
  Zap,
  Award,
  Activity,
  BarChart2,
  Clock,
  TrendingUp,
} from 'lucide-vue-next';
import { saveCapture } from '../services/db';

const props = defineProps({
  videoSession: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['retake', 'saved', 'error']);

const videoElementRef = ref(null);
const chartContainerRef = ref(null);
const isPlaying = ref(false);
const isSaving = ref(false);
const isSaved = ref(false);
const currentTime = ref(0);
const playbackRate = ref(1.0);
const isDraggingScrubber = ref(false);

const chartWidth = 500;
const chartHeight = 200;

const videoUrl = computed(() => props.videoSession?.videoUrl || '');
const timeSeries = computed(() => props.videoSession?.timeSeries || []);
const analytics = computed(() => props.videoSession?.analytics || {});
const durationSec = computed(() => Math.max(0.1, props.videoSession?.durationSec || 1));

const maxForce = computed(() => Math.max(100, analytics.value?.peakForceN || 100) * 1.15);
const maxSpeed = computed(() => Math.max(300, analytics.value?.maxSpeedDeg || 300) * 1.15);

const currentSample = computed(() => {
  if (!timeSeries.value.length) return null;
  const t = currentTime.value;
  let closest = timeSeries.value[0];
  let minDiff = Math.abs(closest.time - t);

  for (let i = 1; i < timeSeries.value.length; i++) {
    const diff = Math.abs(timeSeries.value[i].time - t);
    if (diff < minDiff) {
      minDiff = diff;
      closest = timeSeries.value[i];
    }
  }
  return closest;
});

function timeToX(t) {
  return Math.max(0, Math.min(chartWidth, (t / durationSec.value) * chartWidth));
}

function forceToY(f) {
  return chartHeight - (f / maxForce.value) * chartHeight;
}

function speedToY(s) {
  return chartHeight - (s / maxSpeed.value) * chartHeight;
}

const forceLinePath = computed(() => {
  if (!timeSeries.value.length) return '';
  return timeSeries.value.reduce((acc, pt, idx) => {
    const x = timeToX(pt.time);
    const y = forceToY(pt.activeForceN);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');
});

const forceAreaPath = computed(() => {
  if (!timeSeries.value.length) return '';
  const firstX = timeToX(timeSeries.value[0].time);
  const lastX = timeToX(timeSeries.value[timeSeries.value.length - 1].time);
  return `${forceLinePath.value} L ${lastX} ${chartHeight} L ${firstX} ${chartHeight} Z`;
});

const speedLinePath = computed(() => {
  if (!timeSeries.value.length) return '';
  return timeSeries.value.reduce((acc, pt, idx) => {
    const x = timeToX(pt.time);
    const y = speedToY(pt.activeSpeedDeg);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');
});

function togglePlay() {
  const vid = videoElementRef.value;
  if (!vid) return;

  if (vid.paused || vid.ended) {
    vid.play();
    isPlaying.value = true;
  } else {
    vid.pause();
    isPlaying.value = false;
  }
}

function onVideoTimeUpdate() {
  if (videoElementRef.value && !isDraggingScrubber.value) {
    currentTime.value = videoElementRef.value.currentTime;
  }
}

function seekVideo() {
  if (videoElementRef.value) {
    videoElementRef.value.currentTime = currentTime.value;
  }
}

function restartVideo() {
  if (videoElementRef.value) {
    videoElementRef.value.currentTime = 0;
    videoElementRef.value.play();
    isPlaying.value = true;
  }
}

function setPlaybackRate(rate) {
  playbackRate.value = rate;
  if (videoElementRef.value) {
    videoElementRef.value.playbackRate = rate;
  }
}

function onChartMouseMove(e) {
  if (!isDraggingScrubber.value || !chartContainerRef.value) return;
  const rect = chartContainerRef.value.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  currentTime.value = Number((ratio * durationSec.value).toFixed(2));
  seekVideo();
}

function startScrubbing(e) {
  isDraggingScrubber.value = true;
  onChartMouseMove(e);
}

function stopScrubbing() {
  isDraggingScrubber.value = false;
}

function formatTime(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const tenths = Math.floor((s % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

function downloadVideo() {
  if (!props.videoSession?.videoUrl) return;
  const a = document.createElement('a');
  a.href = props.videoSession.videoUrl;
  a.download = `power-session-${Date.now()}.webm`;
  a.click();
}

async function saveSessionToDB() {
  if (isSaving.value || isSaved.value) return;
  isSaving.value = true;

  try {
    const record = await saveCapture({
      title: `Power Session (${analytics.value.strikeCount} Strikes, ${analytics.value.peakForceN}N Peak)`,
      type: 'video',
      video_blob: props.videoSession.videoBlob,
      video_url: props.videoSession.videoUrl,
      analytics: analytics.value,
      time_series: timeSeries.value,
      duration_sec: durationSec.value,
    });

    isSaved.value = true;
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.65 },
    });
    emit('saved', record);
  } catch (err) {
    console.error('Failed to save session to DB:', err);
    emit('error', 'Error saving session: ' + err.message);
  } finally {
    isSaving.value = false;
  }
}
</script>
