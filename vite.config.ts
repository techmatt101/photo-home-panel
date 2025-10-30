import {defineConfig} from 'vite';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        //// @ts-expect-error wrong type
        // minifyHTML.default(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: "Photo Home Panel",
                short_name: "Home Panel",
                display: "standalone",
                background_color: "#000000",
                theme_color: "#000000",
                icons: [
                    {
                        "src": "/icons/icon-192.png",
                        "sizes": "192x192",
                        "type": "image/png",
                        "purpose": "any"
                    },
                    {
                        "src": "/icons/icon-192-maskable.png",
                        "sizes": "192x192",
                        "type": "image/png",
                        "purpose": "maskable"
                    },
                    {
                        "src": "/icons/icon-512.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "any"
                    },
                    {
                        "src": "/icons/icon-512-maskable.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "maskable"
                    }
                ]
            }
        })
    ],
    server: {
        port: 3000,
        open: true
    },
    build: {
        sourcemap: true,
        minify: false,
        outDir: 'dist'
    }
});
