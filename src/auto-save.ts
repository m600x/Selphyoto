import type { CanvasManager, GroupEntry } from './canvas-manager';

export interface AutoSaveImage {
  dataUrl: string;
  filename: string;
  visible: boolean;
  locked: boolean;
  groupId: string | null;
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  flipX: boolean;
  flipY: boolean;
  opacity: number;
}

export interface AutoSaveSettings {
  correctionX: number;
  correctionY: number;
  backgroundColor: string;
  markColor: string;
  guidelinesVisible: boolean;
  exportFormat: 'png' | 'jpeg';
}

export interface AutoSaveState {
  images: AutoSaveImage[];
  groups: GroupEntry[];
  groupCounter: number;
  settings: AutoSaveSettings;
}

import type { PersistedHistory } from './history-manager';

const DB_NAME = 'selphyoto';
const DB_VERSION = 2;
const STORE_NAME = 'state';
const STATE_KEY = 'current';
const HISTORY_STORE = 'history';
const HISTORY_KEY = 'current';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAutoState(state: AutoSaveState): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(state, STATE_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadAutoState(): Promise<AutoSaveState | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(STATE_KEY);
    req.onsuccess = () => { db.close(); resolve(req.result ?? null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function clearAutoState(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(STATE_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function saveHistoryState(data: PersistedHistory): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    tx.objectStore(HISTORY_STORE).put(data, HISTORY_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadHistoryState(): Promise<PersistedHistory | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE, 'readonly');
    const req = tx.objectStore(HISTORY_STORE).get(HISTORY_KEY);
    req.onsuccess = () => { db.close(); resolve(req.result ?? null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function clearHistoryState(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    tx.objectStore(HISTORY_STORE).delete(HISTORY_KEY);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export function collectState(
  cm: CanvasManager,
  exportFormat: 'png' | 'jpeg',
): AutoSaveState {
  return {
    images: cm.images.map(e => ({
      dataUrl: e.originalDataUrl,
      filename: e.filename,
      visible: e.visible,
      locked: e.locked,
      groupId: e.groupId ?? null,
      left: e.fabricImage.left ?? 0,
      top: e.fabricImage.top ?? 0,
      scaleX: e.fabricImage.scaleX ?? 1,
      scaleY: e.fabricImage.scaleY ?? 1,
      angle: e.fabricImage.angle ?? 0,
      flipX: e.fabricImage.flipX ?? false,
      flipY: e.fabricImage.flipY ?? false,
      opacity: e.fabricImage.opacity ?? 1,
    })),
    groups: cm.groups.map(g => ({ ...g })),
    groupCounter: cm.getGroupCounter(),
    settings: {
      correctionX: cm.getCorrectionX(),
      correctionY: cm.getCorrectionY(),
      backgroundColor: cm.getBackgroundColor(),
      markColor: cm.getMarkColor(),
      guidelinesVisible: cm.getGuidelinesVisible(),
      exportFormat,
    },
  };
}
