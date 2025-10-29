import {defineConfig} from 'vite';
import minifyHTML from 'rollup-plugin-minify-html-literals';
// import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        //// @ts-expect-error wrong type
        // minifyHTML.default(),
        // VitePWA({
        //     registerType: 'autoUpdate',
        //     includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        //     manifest: {
        //         name: 'Photo Slideshow',
        //         short_name: 'Slideshow',
        //         description: 'Photo slideshow with Home Assistant integration',
        //         theme_color: '#000000',
        //         background_color: '#000000',
        //         display: 'standalone',
        //         icons: [
        //             {
        //                 src: 'pwa-192x192.png',
        //                 sizes: '192x192',
        //                 type: 'image/png'
        //             },
        //             {
        //                 src: 'pwa-512x512.png',
        //                 sizes: '512x512',
        //                 type: 'image/png'
        //             },
        //             {
        //                 src: 'pwa-512x512.png',
        //                 sizes: '512x512',
        //                 type: 'image/png',
        //                 purpose: 'maskable'
        //             }
        //         ]
        //     },
        //     workbox: {
        //         runtimeCaching: [
        //             {
        //                 urlPattern: /^https:\/\/api\.photoprism\.local\/.*$/i,
        //                 handler: 'CacheFirst',
        //                 options: {
        //                     cacheName: 'photoprism-api-cache',
        //                     expiration: {
        //                         maxEntries: 10,
        //                         maxAgeSeconds: 60 * 60 * 24 // 24 hours
        //                     },
        //                     cacheableResponse: {
        //                         statuses: [0, 200]
        //                     }
        //                 }
        //             },
        //             {
        //                 urlPattern: /^https:\/\/homeassistant\.local\/api\/.*$/i,
        //                 handler: 'NetworkFirst',
        //                 options: {
        //                     cacheName: 'home-assistant-api-cache',
        //                     expiration: {
        //                         maxEntries: 10,
        //                         maxAgeSeconds: 60 * 5 // 5 minutes
        //                     },
        //                     cacheableResponse: {
        //                         statuses: [0, 200]
        //                     }
        //                 }
        //             }
        //         ]
        //     }
        // })
    ],
    server: {
        port: 3000,
        open: true,
        // proxy: {
        //     '/api/photoprism': {
        //         target: 'http://nas:2342',
        //         changeOrigin: true,
        //         rewrite: (path) => path.replace('/api/photoprism', '/api'),
        //         secure: false
        //     }
        // }
    },
    build: {
        sourcemap: true,
        minify: false,
        outDir: 'dist'
    }
});
