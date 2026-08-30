# 🧍 FaceVision & Biomechanical Matchstick Studio

A **100% client-side web application** built with **Vue 3**, **Vue Router**, **MediaPipe Vision (WASM/GPU)**, **Tailwind CSS**, and **IndexedDB** for real-time facial feature bounding, matchstick skeleton pose tracking, biomechanical kinetic force measurement, and video session power analytics with **zero backend servers**.

---

## 🌟 Key Features

### 1. 👤 Precision Facial Feature Bounding
- **MediaPipe FaceLandmarker** (478 3D facial landmarks).
- **Anatomically Accurate Left/Right Mapping**:
  - 🟦 **Eyes**: Blue (`#2563EB`)
  - 🟩 **Ears**: Green (`#16A34A`)
  - 🌸 **Nose**: Pink (`#EC4899`)
  - 🩵 **Mouth**: Teal (`#0D9488`)
- **Unmirrored Natural Text**: Coordinates and labels stay standard, readable orientation in camera mirror mode.

### 2. 🧍 Stabilized Matchstick Figure Skeleton
- **Square Head & Geometric Torso**: Minimalist, clean matchstick drawing with square head, spine, shoulder/pelvis bars, and joint nodes.
- **Adaptive 1-Euro Anti-Jitter Filter**: Eliminates frame-to-frame coordinate bouncing when stationary while retaining instant zero-lag response during fast motions.

### 3. ⚖️ Real-Time Body Posture Balance Check
- Continuous biomechanical alignment scoring:
  - **$\ge 90\%$ Balance**: 🟩 Emerald Green (`Balanced`)
  - **$80\% - 89\%$ Balance**: 🟨 Amber / Yellow (`Moderate`)
  - **$< 80\%$ Balance**: 🟥 Red (`Unbalanced`)

### 4. 📐 Elbow Joint Angle & 90° Bend Detection
- Measures elbow angles from $0^\circ$ to $180^\circ$ using vector dot products.
- Highlights exact **90° Right Angle Bends** ($85^\circ - 95^\circ$) in vibrant emerald green.

### 5. ⚡ Biomechanical Kinetic Force & Speed Engine
- **Physics Formulas Applied**:
  - **Angular Speed ($\omega$)**: $\text{deg/s}$ & $\text{rad/s}$
  - **Tangential Hand Speed ($v$)**: $\text{m/s}$ & $\text{km/h}$
  - **Dynamic Torque ($\tau$)**: $\text{N}\cdot\text{m}$
  - **Dynamic Strike Force ($F$)**: $\text{Newtons (N)}$ & $\text{lbs}$
  - **Mechanical Power ($P$)**: $\text{Watts (W)}$
- Interactive body mass calibration slider ($40 - 130\text{kg}$).

### 6. 🎥 Video Recording Session & Power Analytics Studio
- **Start / End Session Capture**: Record webcam video while logging time-series biomechanical kinetic telemetry.
- **Interactive Waveform Graph**: Scrub through the video player and inspect the exact force generated at every millisecond.
- **Reps / Strikes Counter**: Peak-detection algorithm counts repetitions automatically.
- **Export & Storage**: Download `.webm` video or save to browser **IndexedDB** gallery.

### 7. 🔒 Zero-Server 100% Offline Privacy
- Runs completely in the browser via **WebAssembly (WASM)** and **WebGL**.
- Zero cloud uploads, zero telemetry, full offline persistence via **Dexie.js (IndexedDB)**.

---

## 🚀 Live Demo & GitHub Pages Hosting

This repository is configured with **GitHub Actions** for automated continuous deployment to **GitHub Pages**:

1. Push this repository to GitHub.
2. In your GitHub repository, go to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. Every push to `main` will automatically build and deploy the app!

---

## 🛠️ Local Development

```sh
# Clone the repository
git clone https://github.com/<your-username>/facial-app.git
cd facial-app

# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📦 Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) + [Vue Router 4](https://router.vuejs.org/) (Hash History for zero-config GitHub Pages hosting)
- **Build Tool**: [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Vision ML Models**: [Google MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision)
- **Local Storage**: [Dexie.js](https://dexie.org/) (IndexedDB)
- **Icons**: [Lucide Vue Next](https://lucide.dev/)
- **CI/CD**: GitHub Actions (`deploy-pages@v4`)

---

## 📄 License

MIT License. Open source and free to use!
