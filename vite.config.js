import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps every asset path relative, so the build works from any folder or GitHub Pages sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 },
  server: { port: 5178, strictPort: false, watch: { ignored: ['**/.work/**', '**/legacy/**', '**/docs/**', '**/dist/**', '**/tests/**'] } },
});
