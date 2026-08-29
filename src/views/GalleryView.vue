<template>
  <div class="space-y-6">
    <!-- Gallery Header Bar -->
    <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
      <div>
        <h2 class="text-lg font-bold text-white flex items-center gap-2.5">
          <span class="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Images class="w-5 h-5" />
          </span>
          Local IndexedDB Gallery
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {{ captures.length }} Saved
          </span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">
          100% stored in your browser's private local IndexedDB storage (Zero Cloud / No Server)
        </p>
      </div>

      <!-- Filters & Actions -->
      <div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
        <!-- Filter Tabs -->
        <div class="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
          <button
            @click="filterType = null; loadCaptures();"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition',
              filterType === null ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            All
          </button>
          <button
            @click="filterType = 'video'; loadCaptures();"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition',
              filterType === 'video' ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            🎥 Videos
          </button>
          <button
            @click="filterType = 'pose'; loadCaptures();"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition',
              filterType === 'pose' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            Matchstick
          </button>
          <button
            @click="filterType = 'face'; loadCaptures();"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium transition',
              filterType === 'face' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            Face Parts
          </button>
        </div>

        <button
          v-if="captures.length > 0"
          @click="handleClearAll"
          class="bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-medium px-3 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          title="Clear all saved gallery items"
        >
          <Trash2 class="w-3.5 h-3.5" />
          Clear All
        </button>

        <router-link
          to="/camera"
          class="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center gap-1.5"
        >
          <Camera class="w-3.5 h-3.5" />
          <span>New Capture</span>
        </router-link>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="captures.length === 0"
      class="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-12 text-center shadow-xl"
    >
      <div class="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-500">
        <Images class="w-8 h-8" />
      </div>
      <h3 class="text-base font-bold text-white mb-1">No Captures Saved Yet</h3>
      <p class="text-xs text-slate-400 max-w-sm mx-auto mb-5">
        Capture and highlight your face or full-body matchstick figure and click "Save to Gallery" to build your local collection.
      </p>
      <router-link
        to="/camera"
        class="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl border border-slate-700 transition"
      >
        <Camera class="w-4 h-4 text-teal-400" />
        Open Camera
      </router-link>
    </div>

    <!-- Captures Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="item in captures"
        :key="item.id"
        class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden shadow-xl hover:border-slate-700 transition flex flex-col group"
      >
        <!-- Thumbnail -->
        <div
          class="relative aspect-4/3 bg-slate-950 cursor-pointer overflow-hidden flex items-center justify-center"
          @click="openModal(item)"
        >
          <video
            v-if="item.type === 'video'"
            :src="item.video_url"
            muted
            playsinline
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
          ></video>
          <img
            v-else
            :src="item.annotated_image || item.raw_image"
            :alt="item.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
            <span class="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
              <Eye class="w-3.5 h-3.5" /> Click to Inspect
            </span>
          </div>

          <!-- Feature Badges on thumbnail -->
          <div class="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
            <template v-if="item.type === 'video'">
              <span class="text-[10px] px-2.5 py-0.5 rounded-md bg-pink-600 text-white font-bold backdrop-blur-xs flex items-center gap-1">
                🎥 Video Session ({{ item.duration_sec || 0 }}s)
              </span>
              <span v-if="item.analytics?.peakForceN" class="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/90 text-white font-bold backdrop-blur-xs">
                ⚡ {{ item.analytics.peakForceN }}N Peak
              </span>
            </template>
            <template v-else-if="item.type === 'pose' || item.features?.type === 'pose'">
              <span class="text-[10px] px-2.5 py-0.5 rounded-md bg-cyan-500/90 text-white font-semibold backdrop-blur-xs flex items-center gap-1">
                🧍 Matchstick Figure
              </span>
            </template>
            <template v-else>
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/80 text-white font-semibold backdrop-blur-xs">Eyes</span>
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-green-500/80 text-white font-semibold backdrop-blur-xs">Ears</span>
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-pink-500/80 text-white font-semibold backdrop-blur-xs">Nose</span>
              <span class="text-[10px] px-2 py-0.5 rounded-md bg-teal-500/80 text-white font-semibold backdrop-blur-xs">Mouth</span>
            </template>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-1">
              <h4 class="text-sm font-bold text-white truncate">{{ item.title }}</h4>
              <span class="text-[11px] font-mono text-slate-500">
                {{ item.type === 'video' ? `${item.duration_sec}s Video` : `${item.width}×${item.height}` }}
              </span>
            </div>
            <p class="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Clock class="w-3 h-3 text-slate-500" />
              {{ formatDate(item.created_at) }}
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <button
              @click="openModal(item)"
              class="text-xs font-medium text-teal-400 hover:text-teal-300 transition flex items-center gap-1"
            >
              <Maximize2 class="w-3.5 h-3.5" /> View
            </button>

            <div class="flex items-center gap-1.5">
              <a
                :href="item.video_url || item.annotated_image || item.raw_image"
                :download="item.type === 'video' ? `power-session-${item.id}.webm` : `capture-${item.id}.jpg`"
                class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Download"
              >
                <Download class="w-3.5 h-3.5" />
              </a>

              <button
                @click="handleDeleteItem(item.id)"
                class="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                title="Delete"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Inspector Modal -->
    <div
      v-if="selectedItem"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      @click.self="selectedItem = null"
    >
      <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <!-- Modal Header -->
        <div class="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              {{ selectedItem.title }}
              <span
                v-if="selectedItem.type === 'video'"
                class="text-[10px] px-2.5 py-0.5 rounded-md bg-pink-500/20 text-pink-400 border border-pink-500/30 font-bold"
              >
                🎥 Video Power Analytics
              </span>
              <span
                v-else-if="selectedItem.type === 'pose' || selectedItem.features?.type === 'pose'"
                class="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium"
              >
                Matchstick Pose
              </span>
              <span
                v-else
                class="text-[10px] px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-400 border border-teal-500/30 font-medium"
              >
                Facial Parts
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Saved {{ formatDate(selectedItem.created_at) }}
            </p>
          </div>

          <button
            @click="selectedItem = null"
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-4 sm:p-6 flex flex-col items-center">
          <!-- Video Player if Video -->
          <template v-if="selectedItem.type === 'video'">
            <div class="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center max-h-[55vh]">
              <video
                :src="selectedItem.video_url"
                controls
                autoplay
                playsinline
                class="max-w-full max-h-[55vh] object-contain"
              ></video>
            </div>

            <!-- Video Analytics Grid -->
            <div v-if="selectedItem.analytics" class="w-full mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div class="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300">
                <div class="font-bold text-white">Peak Force</div>
                <div class="text-lg font-black font-mono text-pink-400">{{ selectedItem.analytics.peakForceN }} N</div>
                <div class="text-[10px] text-slate-400">≈ {{ selectedItem.analytics.peakForceLbs }} lbs</div>
              </div>

              <div class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                <div class="font-bold text-white">Avg Force</div>
                <div class="text-lg font-black font-mono text-cyan-400">{{ selectedItem.analytics.avgForceN }} N</div>
                <div class="text-[10px] text-slate-400">Mean load</div>
              </div>

              <div class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300">
                <div class="font-bold text-white">Max Speed</div>
                <div class="text-lg font-black font-mono text-blue-400">{{ selectedItem.analytics.maxHandSpeedMs }} m/s</div>
                <div class="text-[10px] text-slate-400">{{ selectedItem.analytics.maxHandSpeedKmh }} km/h</div>
              </div>

              <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <div class="font-bold text-white">Strikes / Reps</div>
                <div class="text-lg font-black font-mono text-amber-400">{{ selectedItem.analytics.strikeCount }}</div>
                <div class="text-[10px] text-slate-400">{{ selectedItem.duration_sec }}s Session</div>
              </div>
            </div>
          </template>

          <!-- Image Display if Image -->
          <template v-else>
            <!-- View Toggle -->
            <div class="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 mb-4 text-xs">
              <button
                @click="modalViewMode = 'annotated'"
                :class="[
                  'px-4 py-1.5 rounded-lg font-medium transition',
                  modalViewMode === 'annotated' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                ]"
              >
                Highlighted Result
              </button>
              <button
                @click="modalViewMode = 'raw'"
                :class="[
                  'px-4 py-1.5 rounded-lg font-medium transition',
                  modalViewMode === 'raw' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                ]"
              >
                Original Photo
              </button>
            </div>

            <div class="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center max-h-[55vh]">
              <img
                :src="modalViewMode === 'annotated' ? selectedItem.annotated_image : selectedItem.raw_image"
                :alt="selectedItem.title"
                class="max-w-full max-h-[55vh] object-contain"
              />
            </div>

          <!-- Feature Summary in Modal for Pose -->
          <div v-if="selectedItem.type === 'pose' || selectedItem.features?.type === 'pose'" class="w-full mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-cyan-400"></span>
              <div>
                <div class="font-bold text-white">Head & Spine</div>
                <div class="text-[11px] text-cyan-400/80">Square Head & Torso</div>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-sky-400"></span>
              <div>
                <div class="font-bold text-white">Arms & Joints</div>
                <div class="text-[11px] text-sky-400/80">Shoulders, Elbows, Wrists</div>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
              <div>
                <div class="font-bold text-white">Legs & Feet</div>
                <div class="text-[11px] text-emerald-400/80">Hips, Knees, Ankles</div>
              </div>
            </div>
          </div>

          <!-- Feature Summary in Modal for Face -->
          <div v-else class="w-full mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#2563EB]"></span>
              <div>
                <div class="font-bold text-white">Eyes (Blue)</div>
                <div class="text-[11px] text-blue-400/80">Left & Right Eye</div>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#16A34A]"></span>
              <div>
                <div class="font-bold text-white">Ears (Green)</div>
                <div class="text-[11px] text-green-400/80">Left & Right Ear</div>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#EC4899]"></span>
              <div>
                <div class="font-bold text-white">Nose (Pink)</div>
                <div class="text-[11px] text-pink-400/80">Bridge & Tip</div>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#0D9488]"></span>
              <div>
                <div class="font-bold text-white">Mouth (Teal)</div>
                <div class="text-[11px] text-teal-400/80">Upper & Lower Lips</div>
              </div>
            </div>
          </div>
        </template>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between">
          <button
            @click="handleDeleteItem(selectedItem.id); selectedItem = null;"
            class="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5"
          >
            <Trash2 class="w-3.5 h-3.5" /> Delete Item
          </button>

          <a
            :href="selectedItem.type === 'video' ? selectedItem.video_url : (modalViewMode === 'annotated' ? selectedItem.annotated_image : selectedItem.raw_image)"
            :download="selectedItem.type === 'video' ? `power-session-${selectedItem.id}.webm` : `capture-${selectedItem.id}.jpg`"
            class="bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2"
          >
            <Download class="w-4 h-4" /> {{ selectedItem.type === 'video' ? 'Download Video' : 'Download Image' }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  Images,
  Camera,
  Download,
  Trash2,
  Maximize2,
  Clock,
  Eye,
  X,
} from 'lucide-vue-next';
import { getAllCaptures, deleteCapture, clearAllCaptures } from '../services/db';
import { showToast } from '../services/appState';

const captures = ref([]);
const filterType = ref(null);
const selectedItem = ref(null);
const modalViewMode = ref('annotated'); // 'annotated' | 'raw'

onMounted(() => {
  loadCaptures();
});

async function loadCaptures() {
  try {
    captures.value = await getAllCaptures(filterType.value);
  } catch (err) {
    console.error('Error loading captures:', err);
    showToast('Failed to load gallery from IndexedDB', 'error');
  }
}

function openModal(item) {
  selectedItem.value = item;
  modalViewMode.value = 'annotated';
}

async function handleDeleteItem(id) {
  if (!confirm('Are you sure you want to delete this capture from your local gallery?')) return;

  try {
    await deleteCapture(id);
    await loadCaptures();
    showToast('Capture deleted from local storage', 'success');
  } catch (err) {
    showToast('Failed to delete capture: ' + err.message, 'error');
  }
}

async function handleClearAll() {
  if (!confirm('Are you sure you want to delete ALL saved captures from your local database?')) return;

  try {
    await clearAllCaptures();
    await loadCaptures();
    showToast('Local gallery cleared', 'success');
  } catch (err) {
    showToast('Failed to clear gallery: ' + err.message, 'error');
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>
