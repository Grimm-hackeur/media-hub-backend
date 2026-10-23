/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const preview = process.env.VITE_DEMO === '1';
export default defineConfig({
  plugins: [react(), tailwindcss(), ...(preview ? [viteSingleFile()] : [])],
  server: { proxy: { '/api': { target: process.env.API_PROXY ?? 'http://localhost:4000', changeOrigin: false } } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['tests/setup.ts'], include: ['tests/**/*.test.{ts,tsx}'] },
});
