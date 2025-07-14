import {registerSW} from 'virtual:pwa-register';
import './components/root-app';
// Create services directory structure
import './services/photoprism-service';
import './services/home-assistant-service';

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

console.log('Photo Slideshow PWA initialized ✨');
