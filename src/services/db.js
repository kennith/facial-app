import Dexie from 'dexie';

export const db = new Dexie('FaceVisionDB');

db.version(1).stores({
  captures: '++id, title, type, face_detected, created_at',
});

/**
 * Fetch all captures ordered by creation date descending
 */
export async function getAllCaptures(filterType = null) {
  try {
    let collection = db.captures.orderBy('created_at').reverse();
    if (filterType) {
      const items = await collection.toArray();
      return items.filter((item) => item.type === filterType);
    }
    return await collection.toArray();
  } catch (err) {
    console.error('Failed to get captures from IndexedDB:', err);
    return [];
  }
}

/**
 * Fetch a single capture by ID
 */
export async function getCaptureById(id) {
  try {
    return await db.captures.get(Number(id));
  } catch (err) {
    console.error(`Failed to get capture with id ${id}:`, err);
    return null;
  }
}

/**
 * Save a new capture to IndexedDB
 */
export async function saveCapture(data) {
  try {
    const record = {
      title: data.title || `Capture ${new Date().toLocaleTimeString()}`,
      type: data.type || (data.features?.type === 'pose' ? 'pose' : data.video_blob ? 'video' : 'face'),
      raw_image: data.raw_image || null,
      annotated_image: data.annotated_image || null,
      video_blob: data.video_blob || null,
      video_url: data.video_url || null,
      analytics: data.analytics || null,
      time_series: data.time_series || null,
      duration_sec: data.duration_sec || null,
      features: data.features || null,
      face_detected: data.face_detected !== undefined ? data.face_detected : true,
      confidence: data.confidence || 0.95,
      width: data.width || 1280,
      height: data.height || 720,
      created_at: new Date().toISOString(),
    };

    const id = await db.captures.add(record);
    return { ...record, id };
  } catch (err) {
    console.error('Failed to save capture to IndexedDB:', err);
    throw err;
  }
}

/**
 * Delete a capture by ID
 */
export async function deleteCapture(id) {
  try {
    await db.captures.delete(Number(id));
    return true;
  } catch (err) {
    console.error(`Failed to delete capture ${id}:`, err);
    throw err;
  }
}

/**
 * Clear all saved captures
 */
export async function clearAllCaptures() {
  try {
    await db.captures.clear();
    return true;
  } catch (err) {
    console.error('Failed to clear database:', err);
    throw err;
  }
}

/**
 * Get count statistics
 */
export async function getCaptureStats() {
  try {
    const total = await db.captures.count();
    const all = await db.captures.toArray();
    const faceCount = all.filter((c) => c.type === 'face').length;
    const poseCount = all.filter((c) => c.type === 'pose').length;
    return { total, faceCount, poseCount };
  } catch (err) {
    return { total: 0, faceCount: 0, poseCount: 0 };
  }
}
