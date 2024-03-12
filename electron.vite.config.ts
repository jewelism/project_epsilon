import { defineConfig, externalizeDepsPlugin, swcPlugin } from 'electron-vite';
import path from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), swcPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin(), swcPlugin()],
  },
  renderer: {
    plugins: [externalizeDepsPlugin(), swcPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/renderer/src'),
      },
    },
  },
});
