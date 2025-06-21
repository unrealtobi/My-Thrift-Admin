import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/", // Use '/my-thrift-admin/' if deployed to a subdirectory
});
