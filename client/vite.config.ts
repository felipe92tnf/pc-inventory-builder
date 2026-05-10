import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Prefer TS sobre .js hermanos: sin esto Vite resuelve PartForm.js antes que PartForm.tsx.
  resolve: {
    extensions: [".mjs", ".mts", ".ts", ".tsx", ".jsx", ".js", ".json"]
  }
});