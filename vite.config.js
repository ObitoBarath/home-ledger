import { defineConfig } from "vite";

const api = { "/api": "http://localhost:3001", "/uploads": "http://localhost:3001" };

export default defineConfig({
  server: { host: true, port: 5173, proxy: api },
  preview: { host: true, proxy: api },
});
