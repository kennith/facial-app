<template>
  <div>
    <!-- Video Analytics Studio View -->
    <VideoAnalyticsStudio
      v-if="capturedState.videoSession"
      :video-session="capturedState.videoSession"
      @retake="handleRetake"
      @saved="handleSaved"
      @error="handleError"
    />

    <!-- Empty State if no captured photo or video yet -->
    <div
      v-else-if="!capturedState.rawImageUrl || !capturedState.imageElement"
      class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-8 sm:p-12 text-center shadow-xl max-w-xl mx-auto"
    >
      <div class="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4 text-teal-400">
        <Sparkles class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-white mb-2">No Active Capture in Studio</h3>
      <p class="text-xs sm:text-sm text-slate-400 mb-6">
        Take a live photo, record a video session, or upload an image to inspect facial feature bounding boxes or customize a matchstick figure drawing.
      </p>
      <div class="flex flex-wrap gap-3 justify-center">
        <router-link
          to="/camera"
          class="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
        >
          <Camera class="w-4 h-4" />
          <span>Open Camera</span>
        </router-link>
      </div>
    </div>

    <!-- Body Matchstick Studio View -->
    <StickmanStudio
      v-else-if="capturedState.mode === 'body' && capturedState.poseData"
      :raw-image-url="capturedState.rawImageUrl"
      :image-element="capturedState.imageElement"
      :pose-data="capturedState.poseData"
      :biomechanics="capturedState.biomechanics"
      @retake="handleRetake"
      @saved="handleSaved"
      @error="handleError"
    />

    <!-- Facial Annotation Studio View -->
    <AnnotatedCanvas
      v-else-if="capturedState.detectionData"
      :raw-image-url="capturedState.rawImageUrl"
      :image-element="capturedState.imageElement"
      :detection-data="capturedState.detectionData"
      @retake="handleRetake"
      @saved="handleSaved"
      @error="handleError"
    />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { Sparkles, Camera } from 'lucide-vue-next';
import { capturedState, showToast } from '../services/appState';
import AnnotatedCanvas from '../components/AnnotatedCanvas.vue';
import StickmanStudio from '../components/StickmanStudio.vue';
import VideoAnalyticsStudio from '../components/VideoAnalyticsStudio.vue';

const router = useRouter();

function handleRetake() {
  router.push('/camera');
}

function handleSaved() {
  showToast('Capture saved to local IndexedDB gallery!', 'success');
}

function handleError(err) {
  showToast(err, 'error');
}
</script>
