import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Cpp/',
  plugins: [react()],
  server: { host: '0.0.0.0', port: 4173, allowedHosts: ['terminal.local'] },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: ['terminal.local'] },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
