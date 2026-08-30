import { createRouter, createWebHashHistory } from 'vue-router';
import CameraView from '../views/CameraView.vue';
import StudioView from '../views/StudioView.vue';
import GalleryView from '../views/GalleryView.vue';
import AboutView from '../views/AboutView.vue';

const routes = [
  {
    path: '/',
    redirect: '/camera',
  },
  {
    path: '/camera',
    name: 'camera',
    component: CameraView,
    meta: { title: 'Live Camera Capture' },
  },
  {
    path: '/studio',
    name: 'studio',
    component: StudioView,
    meta: { title: 'Interactive Studio' },
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: GalleryView,
    meta: { title: 'Local IndexedDB Gallery' },
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
    meta: { title: 'About FaceVision & Stickman' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} — FaceVision`;
  }
});

export default router;
