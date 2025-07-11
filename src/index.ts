import { registerSW } from 'virtual:pwa-register';
import './components/photo-slideshow';

// Register service worker for PWA functionality
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

// Create services directory structure
import './services/photoprism-service';
import './services/home-assistant-service';

console.log('Photo Slideshow PWA initialized ✨');
