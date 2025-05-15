import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// import { VitePWA } from "vite-plugin-pwa";

export const production = true;

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: "autoUpdate",
    //   includeAssets: ["favicon.svg", "robots.txt", "apple-touch-icon.png"],
    //   filename: "sw.js",
    //   srcDir: "src",
    //   strategies: "injectManifest",
    //   injectManifest: {
    //     swSrc: "/sw.js",
    //     maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 💡 allow 5MB precache files
    //   },
    //   manifest: {
    //     name: "Serviny",
    //     short_name: "Serviny",
    //     description: "Your Serviny Progressive Web App",
    //     theme_color: "#ffffff",
    //     background_color: "#ffffff",
    //     display: "standalone",
    //     start_url: "/",
    //     icons: [
    //       {
    //         src: "pwa-64x64.png",
    //         sizes: "64x64",
    //         type: "image/png",
    //       },
    //       {
    //         src: "pwa-192x192.png",
    //         sizes: "192x192",
    //         type: "image/png",
    //       },
    //       {
    //         src: "pwa-512x512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //       },
    //       {
    //         src: "maskable-icon-512x512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //         purpose: "maskable",
    //       },
    //     ],
    //   },
    // }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/minio": {
        // target: "https://files.winnemart.com/",
        target: 'http://localhost:9000', // Adjust if MinIO is not running on

        
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/minio/, ""),
      },
    },
    // headers: {
    //   "Cross-Origin-Opener-Policy": "same-origin",
    //   "Cross-Origin-Embedder-Policy": "require-corp",
    // },
    // host: "0.0.0.0",
  },
  preview: {
    // allowedHosts: [".serviny.com", ".r.serviny.com"],
    allowedHosts: [".winnemart.com",".r.winnemart.com"], 

  },
  // build: {
  //   rollupOptions: {
  //     external: ["src/sw.js"], // Exclude sw.js from the Rollup bundle
  //   },
  // },
});
