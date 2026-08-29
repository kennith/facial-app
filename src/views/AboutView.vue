<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
          <ShieldCheck class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">Pure Client-Side Architecture</h2>
          <p class="text-xs text-slate-400">Zero backend, zero cloud inference, 100% private in-browser execution</p>
        </div>
      </div>

      <p class="text-sm text-slate-300 leading-relaxed">
        <strong>FaceVision & Matchstick</strong> runs completely inside your local browser using modern web standards (Vue 3, WebAssembly, WebGL, HTML5 Canvas, and IndexedDB). No video frames, photographs, or biometrics are ever uploaded or sent to any remote server.
      </p>
    </div>

    <!-- Tech Stack Highlights -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-2">
        <div class="flex items-center gap-2 text-teal-400 font-bold text-sm">
          <Cpu class="w-4 h-4" />
          <span>Local AI Inference</span>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Google MediaPipe Tasks Vision runs client-side via WebAssembly and WebGL/GPU hardware acceleration, processing 478 3D facial landmarks and 33 body pose joints in real-time.
        </p>
      </div>

      <div class="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-2">
        <div class="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <Database class="w-4 h-4" />
          <span>IndexedDB Local Storage</span>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Persistent history and high-res image saves are stored entirely in your browser's private IndexedDB database using Dexie.js. Your collection stays on your disk even across page reloads.
        </p>
      </div>

      <div class="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-2">
        <div class="flex items-center gap-2 text-blue-400 font-bold text-sm">
          <Palette class="w-4 h-4" />
          <span>Color Highlighting Rules</span>
        </div>
        <div class="text-xs text-slate-400 space-y-1">
          <div>🟦 <strong>Eyes</strong>: Blue (<code class="text-blue-400">#2563EB</code>)</div>
          <div>🟩 <strong>Ears</strong>: Green (<code class="text-green-400">#16A34A</code>)</div>
          <div>🌸 <strong>Nose</strong>: Pink (<code class="text-pink-400">#EC4899</code>)</div>
          <div>🩵 <strong>Mouth</strong>: Teal (<code class="text-teal-400">#0D9488</code>)</div>
        </div>
      </div>

      <div class="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-2">
        <div class="flex items-center gap-2 text-pink-400 font-bold text-sm">
          <Globe class="w-4 h-4" />
          <span>Universal Static Deployment</span>
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Because there is no backend server required, the built app can be hosted for free on GitHub Pages, Cloudflare Pages, Vercel, Netlify, or run locally offline.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ShieldCheck, Cpu, Database, Palette, Globe } from 'lucide-vue-next';
</script>
