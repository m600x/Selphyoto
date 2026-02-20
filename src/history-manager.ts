import type { GroupEntry } from './canvas-manager';

export interface HistoryImage {
  type?: 'image' | 'text';
  dataKey: string;
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

export interface HistorySnapshot {
  images: HistoryImage[];
  groups: GroupEntry[];
  groupCounter: number;
}

export interface PersistedHistory {
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  imageData: Record<string, string>;
}

export class HistoryManager {
  private undoStack: HistorySnapshot[] = [];
  private redoStack: HistorySnapshot[] = [];
  private imageDataStore: Map<string, string> = new Map();
  private refCounts: Map<string, number> = new Map();
  private maxHistory = 20;

  onDirty: (() => void) | null = null;

  push(snapshot: HistorySnapshot): void {
    this.evictSnapshots(this.redoStack);
    this.redoStack.length = 0;

    this.addRefs(snapshot);
    this.undoStack.push(snapshot);

    while (this.undoStack.length > this.maxHistory) {
      const evicted = this.undoStack.shift()!;
      this.removeRefs(evicted);
    }

    this.onDirty?.();
  }

  undo(currentState: HistorySnapshot): HistorySnapshot | null {
    if (this.undoStack.length === 0) return null;

    this.addRefs(currentState);
    this.redoStack.push(currentState);

    const snapshot = this.undoStack.pop()!;

    this.onDirty?.();
    return snapshot;
  }

  redo(currentState: HistorySnapshot): HistorySnapshot | null {
    if (this.redoStack.length === 0) return null;

    this.addRefs(currentState);
    this.undoStack.push(currentState);

    const snapshot = this.redoStack.pop()!;

    this.onDirty?.();
    return snapshot;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.imageDataStore.clear();
    this.refCounts.clear();
    this.onDirty?.();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  registerImageData(dataKey: string, dataUrl: string): void {
    if (!this.imageDataStore.has(dataKey)) {
      this.imageDataStore.set(dataKey, dataUrl);
    }
  }

  resolveDataUrl(dataKey: string): string {
    return this.imageDataStore.get(dataKey) ?? '';
  }

  toSerializable(): PersistedHistory {
    const imageData: Record<string, string> = {};
    for (const [k, v] of this.imageDataStore) {
      imageData[k] = v;
    }
    return {
      undoStack: this.undoStack.map(s => structuredClone(s)),
      redoStack: this.redoStack.map(s => structuredClone(s)),
      imageData,
    };
  }

  restoreFrom(data: PersistedHistory): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.imageDataStore.clear();
    this.refCounts.clear();

    for (const [k, v] of Object.entries(data.imageData)) {
      this.imageDataStore.set(k, v);
    }

    for (const snap of data.undoStack) {
      this.addRefs(snap);
      this.undoStack.push(snap);
    }
    for (const snap of data.redoStack) {
      this.addRefs(snap);
      this.redoStack.push(snap);
    }
  }

  private addRefs(snapshot: HistorySnapshot): void {
    for (const img of snapshot.images) {
      this.refCounts.set(img.dataKey, (this.refCounts.get(img.dataKey) ?? 0) + 1);
    }
  }

  private removeRefs(snapshot: HistorySnapshot): void {
    for (const img of snapshot.images) {
      const count = (this.refCounts.get(img.dataKey) ?? 1) - 1;
      if (count <= 0) {
        this.refCounts.delete(img.dataKey);
        this.imageDataStore.delete(img.dataKey);
      } else {
        this.refCounts.set(img.dataKey, count);
      }
    }
  }

  private evictSnapshots(stack: HistorySnapshot[]): void {
    for (const snap of stack) {
      this.removeRefs(snap);
    }
  }
}
