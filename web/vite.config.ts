import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/spa/" : "/",
  build: {
    outDir: "../API/wwwroot/spa",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          charts: ["recharts"],
          xlsx: ["xlsx", "file-saver"],
          signalr: ["@microsoft/signalr"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      "/stats": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      "/hub": {
        target: "http://localhost:5001",
        ws: true,
      },
      "/log": {
        target: "http://localhost:5001",
        ws: true,
      },
    },
  },
}));
