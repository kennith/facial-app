# FaceVision & Matchstick Figure (Pure Vue 3 SPA)

A 100% client-side web application built with **Vue 3**, **Vue Router**, **MediaPipe Vision**, **Tailwind CSS**, and **IndexedDB** for real-time facial part identification, matchstick skeleton pose tracking, and local gallery management with **zero backend servers**.

---

## 🎨 Highlighting & Color System

| Mode | Target / Feature | Visual Style | Color Hex | Landmarks Used |
|---|---|---|---|---|
| 👤 **Face Mode** | 🟦 **Eyes** | Blue Rectangle | `#2563EB` | Left & Right Eye contours, pupils, and orbital boundaries |
| 👤 **Face Mode** | 🟩 **Ears** | Green Rectangle | `#16A34A` | Left & Right lateral tragus/auricular anchors |
| 👤 **Face Mode** | 🌸 **Nose** | Pink Rectangle | `#EC4899` | Nasal bridge, tip, subnasale, and alae |
| 👤 **Face Mode** | 🩵 **Mouth** | Teal Rectangle | `#0D9488` | Upper & lower lips and oral commissures |
| 🧍 **Stickman Mode** | **Full Body** | Matchstick Skeleton Drawing | Multi-palette (Cyan, Lime, Amber, Pink, White) | 33 3D Pose Landmarks (head circle, spine, limbs, joints) |

---

## 🚀 Key Features

1. **100% Pure Client-Side (Zero Backend)**:
   - MediaPipe Vision models run directly inside your browser via **WebAssembly (WASM)** and **WebGL/GPU**.
   - No images, video frames, or biometric data are ever sent over the network.
2. **Vue Router Multi-Page Navigation**:
   - `/camera` — Live camera stream with real-time detection overlay, countdown timer, start/stop toggle, and image upload.
   - `/studio` — Interactive canvas review studio with layer toggles, color pickers, and download options.
   - `/gallery` — Full CRUD collection stored locally in browser **IndexedDB** database (Dexie.js).
   - `/about` — Architecture and privacy guide.
3. **Anatomically Accurate & Unmirrored**:
   - Correct physical left vs right eye and ear mappings.
   - Text tags and badges remain standard orientation when webcam mirror mode is active.
4. **Matchstick Figure Customizer**:
   - Photo overlay or pure cartoon stick figure on **Chalkboard**, **White Sketchpad**, **Blueprint Grid**, or **Transparent** canvas.
   - Adjustable line thickness, joint node size, and neon glow effects.

---

## 🛠️ Quick Start

```sh
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build static production bundle
npm run build

# Preview production build
npm run preview
```
