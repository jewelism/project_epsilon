/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_PORT: number;
  readonly RENDERER_VITE_WINDOW_WIDTH: number;
  readonly RENDERER_VITE_WINDOW_HEIGHT: number;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
