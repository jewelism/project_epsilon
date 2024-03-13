import { contextBridge } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { io } from 'socket.io-client';
import { signal, effect } from '@preact/signals-core';
// Custom APIs for renderer
const api = {};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
    contextBridge.exposeInMainWorld('io', io);
    contextBridge.exposeInMainWorld('signal', signal);
    contextBridge.exposeInMainWorld('effect', effect);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
  console.log('contextBridge not available');
}
