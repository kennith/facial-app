<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
    <!-- Top Navigation Header -->
    <header class="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <!-- Logo & Branding -->
        <router-link to="/camera" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-teal-500/20 flex items-center justify-center group-hover:scale-105 transition">
            <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <UserCheck v-if="activeMode === 'body'" class="w-5 h-5 text-cyan-400" />
              <ScanFace v-else class="w-5 h-5 text-teal-400" />
            </div>
          </div>
          <div>
            <h1 class="text-base font-bold text-white tracking-tight flex items-center gap-2">
              FaceVision
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                Pure SPA
              </span>
            </h1>
            <p class="text-[11px] text-slate-400">Facial Highlights & Matchstick Figure Drawing</p>
          </div>
        </router-link>

        <!-- Mode Switcher Pill (Face vs Body Stickman) -->
        <div class="hidden sm:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            @click="switchMode('face')"
            :class="[
              'px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5',
              activeMode === 'face'
                ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            <ScanFace class="w-3.5 h-3.5" />
            <span>Face Parts</span>
          </button>

          <button
            @click="switchMode('body')"
            :class="[
              'px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5',
              activeMode === 'body'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            <UserCheck class="w-3.5 h-3.5" />
            <span>Body Matchstick</span>
          </button>
        </div>

        <!-- Navigation Tabs (Vue Router) -->
        <nav class="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <router-link
            to="/camera"
            v-slot="{ isActive, navigate }"
            custom
          >
            <button
              @click="navigate"
              :class="[
                'px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5',
                isActive
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              <Camera class="w-3.5 h-3.5 text-teal-400" />
              <span>Camera</span>
            </button>
          </router-link>

          <router-link
            to="/studio"
            v-slot="{ isActive, navigate }"
            custom
          >
            <button
              @click="navigate"
              :class="[
                'px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5',
                isActive
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              <Sparkles class="w-3.5 h-3.5 text-cyan-400" />
              <span>Studio</span>
            </button>
          </router-link>

          <router-link
            to="/gallery"
            v-slot="{ isActive, navigate }"
            custom
          >
            <button
              @click="navigate"
              :class="[
                'px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5',
                isActive
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              <Images class="w-3.5 h-3.5 text-indigo-400" />
              <span>Gallery</span>
            </button>
          </router-link>

          <router-link
            to="/about"
            v-slot="{ isActive, navigate }"
            custom
          >
            <button
              @click="navigate"
              :class="[
                'px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5',
                isActive
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              ]"
            >
              <Info class="w-3.5 h-3.5 text-slate-400" />
              <span class="hidden md:inline">About</span>
            </button>
          </router-link>
        </nav>
      </div>

      <!-- Mobile Mode Switcher Bar -->
      <div class="sm:hidden border-t border-slate-850 bg-slate-900/40 p-2 flex justify-center">
        <div class="flex bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs w-full max-w-xs justify-center">
          <button
            @click="switchMode('face')"
            :class="[
              'flex-1 py-1.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5',
              activeMode === 'face' ? 'bg-teal-600 text-white' : 'text-slate-400'
            ]"
          >
            <ScanFace class="w-3.5 h-3.5" />
            Face Parts
          </button>
          <button
            @click="switchMode('body')"
            :class="[
              'flex-1 py-1.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5',
              activeMode === 'body' ? 'bg-cyan-600 text-white' : 'text-slate-400'
            ]"
          >
            <UserCheck class="w-3.5 h-3.5" />
            Body Matchstick
          </button>
        </div>
      </div>
    </header>

    <!-- Context Info / Legend Bar -->
    <div class="bg-slate-900/50 border-b border-slate-800/60 py-2">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2 text-slate-400 text-[11px]">
          <Palette class="w-3.5 h-3.5 text-slate-500" />
          <span>{{ activeMode === 'face' ? 'Assigned Feature Color Scheme:' : 'Matchstick Figure Components:' }}</span>
        </div>

        <!-- Face Mode Scheme -->
        <div v-if="activeMode === 'face'" class="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] font-medium">
          <span class="inline-flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
            <span class="w-2 h-2 rounded-full bg-[#2563EB]"></span>
            Eyes: Blue
          </span>
          <span class="inline-flex items-center gap-1.5 text-green-400 bg-green-500/10 px-2.5 py-1 rounded-md border border-green-500/20">
            <span class="w-2 h-2 rounded-full bg-[#16A34A]"></span>
            Ears: Green
          </span>
          <span class="inline-flex items-center gap-1.5 text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-md border border-pink-500/20">
            <span class="w-2 h-2 rounded-full bg-[#EC4899]"></span>
            Nose: Pink
          </span>
          <span class="inline-flex items-center gap-1.5 text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20">
            <span class="w-2 h-2 rounded-full bg-[#0D9488]"></span>
            Mouth: Teal
          </span>
        </div>

        <!-- Body Matchstick Scheme -->
        <div v-else class="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] font-medium">
          <span class="inline-flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
            <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
            Square Head & Spine
          </span>
          <span class="inline-flex items-center gap-1.5 text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
            <span class="w-2 h-2 rounded-full bg-sky-400"></span>
            Arms & Joint Nodes
          </span>
          <span class="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            Legs & Feet
          </span>
        </div>
      </div>
    </div>

    <!-- Main Dynamic Content Router View -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Toast Notification Banner -->
    <div
      v-if="toastState.visible"
      class="fixed bottom-6 right-6 z-50 transition-all duration-300 transform translate-y-0 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-xs sm:text-sm font-medium"
      :class="toastState.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-200' : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'"
    >
      <AlertCircle v-if="toastState.type === 'error'" class="w-4 h-4 text-red-400" />
      <CheckCircle2 v-else class="w-4 h-4 text-emerald-400" />
      <span>{{ toastState.message }}</span>
    </div>

    <!-- Footer -->
    <footer class="mt-auto border-t border-slate-850 py-4 text-center text-xs text-slate-500">
      <p>Pure Client-Side Single Page App • Vue 3 + Vue Router + MediaPipe Tasks Vision + IndexedDB</p>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import {
  ScanFace,
  UserCheck,
  Camera,
  Sparkles,
  Images,
  Info,
  Palette,
  CheckCircle2,
  AlertCircle,
} from 'lucide-vue-next';
import { activeMode, toastState } from './services/appState';

const router = useRouter();

function switchMode(mode) {
  activeMode.value = mode;
  router.push('/camera');
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
