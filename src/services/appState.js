import { ref, reactive } from 'vue';

export const activeMode = ref('face'); // 'face' | 'body'

export const capturedState = reactive({
  mode: 'face', // 'face' | 'body' | 'video'
  rawImageUrl: null,
  imageElement: null,
  detectionData: null,
  poseData: null,
  biomechanics: null,
  videoSession: null,
  width: 1280,
  height: 720,
  timestamp: null,
});

export function setCapturedData(data) {
  capturedState.mode = data.mode || activeMode.value;
  capturedState.rawImageUrl = data.rawImageUrl || null;
  capturedState.imageElement = data.imageElement || null;
  capturedState.detectionData = data.detectionData || null;
  capturedState.poseData = data.poseData || null;
  capturedState.biomechanics = data.biomechanics || null;
  capturedState.videoSession = data.videoSession || null;
  capturedState.width = data.width || 1280;
  capturedState.height = data.height || 720;
  capturedState.timestamp = Date.now();
}

export function clearCapturedData() {
  capturedState.rawImageUrl = null;
  capturedState.imageElement = null;
  capturedState.detectionData = null;
  capturedState.poseData = null;
  capturedState.biomechanics = null;
  capturedState.videoSession = null;
}

export const toastState = reactive({
  message: '',
  type: 'success',
  visible: false,
  timer: null,
});

export function showToast(message, type = 'success') {
  if (toastState.timer) clearTimeout(toastState.timer);
  toastState.message = message;
  toastState.type = type;
  toastState.visible = true;
  toastState.timer = setTimeout(() => {
    toastState.visible = false;
  }, 4000);
}
