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

const DB_NAME = 'selphyoto';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const STATE_KEY = 'current';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
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
