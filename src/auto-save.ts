import type { Textbox } from 'fabric';
import type { CanvasManager, GroupEntry } from './canvas-manager';
import type { PageData } from './page-manager';

export interface AutoSaveImage {
  type?: 'image' | 'text';
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
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  width?: number;
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
  pages: PageData[];
  currentPage: number;
  settings: AutoSaveSettings;
}

// Legacy single-page format (for backward compat on load)
interface LegacyAutoSaveState {
  images: AutoSaveImage[];
  groups: GroupEntry[];
  groupCounter: number;
  textCounter?: number;
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

function writeTx(store: string, action: (s: IDBObjectStore) => void): Promise<void> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    action(tx.objectStore(store));
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  }));
}

function readTx<T>(store: string, key: string): Promise<T | undefined> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  }));
}

export function saveAutoState(state: AutoSaveState): Promise<void> {
  return writeTx(STORE_NAME, s => s.put(state, STATE_KEY));
}

export async function loadAutoState(): Promise<AutoSaveState | null> {
  const raw = await readTx<AutoSaveState | LegacyAutoSaveState>(STORE_NAME, STATE_KEY);
  return raw ? migrateState(raw) : null;
}

function migrateState(raw: AutoSaveState | LegacyAutoSaveState): AutoSaveState {
  if ('pages' in raw && Array.isArray(raw.pages)) {
    return raw as AutoSaveState;
  }
  const legacy = raw as LegacyAutoSaveState;
  return {
    pages: [{
      images: legacy.images,
      groups: legacy.groups,
      groupCounter: legacy.groupCounter,
      textCounter: legacy.textCounter ?? 0,
    }],
    currentPage: 0,
    settings: legacy.settings,
  };
}

export function clearAutoState(): Promise<void> {
  return writeTx(STORE_NAME, s => s.delete(STATE_KEY));
}

export function saveHistoryState(data: PersistedHistory): Promise<void> {
  return writeTx(HISTORY_STORE, s => s.put(data, HISTORY_KEY));
}

export async function loadHistoryState(): Promise<PersistedHistory | null> {
  const result = await readTx<PersistedHistory>(HISTORY_STORE, HISTORY_KEY);
  return result ?? null;
}

export function clearHistoryState(): Promise<void> {
  return writeTx(HISTORY_STORE, s => s.delete(HISTORY_KEY));
}

export function collectPageData(cm: CanvasManager, backgroundColor?: string, markColor?: string): PageData {
  return {
    backgroundColor,
    markColor,
    images: cm.images.map(e => {
      const base: AutoSaveImage = {
        type: e.type,
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
      };
      if (e.type === 'text') {
        const tb = e.fabricImage as unknown as Textbox;
        base.text = tb.text ?? '';
        base.fontFamily = (tb.fontFamily as string) ?? 'Arial';
        base.fontSize = tb.fontSize ?? 40;
        base.fill = (tb.fill as string) ?? '#000000';
        base.fontWeight = (tb.fontWeight as string) ?? 'normal';
        base.fontStyle = (tb.fontStyle as string) ?? 'normal';
        base.textAlign = (tb.textAlign as string) ?? 'center';
        base.width = tb.width ?? 200;
      }
      return base;
    }),
    groups: cm.groups.map(g => ({ ...g })),
    groupCounter: cm.getGroupCounter(),
    textCounter: cm.getTextCounter(),
  };
}

export function collectState(
  cm: CanvasManager,
  pages: PageData[],
  currentPage: number,
  exportFormat: 'png' | 'jpeg',
): AutoSaveState {
  return {
    pages,
    currentPage,
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
