import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryManager, type HistorySnapshot } from '../../src/history-manager';

function makeSnapshot(overrides: Partial<HistorySnapshot> = {}): HistorySnapshot {
  return {
    images: overrides.images ?? [],
    groups: overrides.groups ?? [],
    groupCounter: overrides.groupCounter ?? 0,
  };
}

function makeImageSnapshot(keys: string[]): HistorySnapshot {
  return makeSnapshot({
    images: keys.map(k => ({
      dataKey: k,
      filename: `${k}.png`,
      visible: true,
      locked: false,
      groupId: null,
      left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
    })),
  });
}

describe('HistoryManager', () => {
  let hm: HistoryManager;

  beforeEach(() => {
    hm = new HistoryManager();
  });

  describe('push', () => {
    it('allows undo after push', () => {
      hm.push(makeSnapshot());
      expect(hm.canUndo()).toBe(true);
      expect(hm.canRedo()).toBe(false);
    });

    it('clears redo stack on push', () => {
      hm.push(makeSnapshot({ groupCounter: 1 }));
      hm.undo(makeSnapshot({ groupCounter: 2 }));
      expect(hm.canRedo()).toBe(true);
      hm.push(makeSnapshot({ groupCounter: 3 }));
      expect(hm.canRedo()).toBe(false);
    });

    it('respects max history of 20', () => {
      for (let i = 0; i < 30; i++) {
        hm.push(makeSnapshot({ groupCounter: i }));
      }
      let undoCount = 0;
      let current = makeSnapshot({ groupCounter: 99 });
      while (hm.canUndo()) {
        const s = hm.undo(current);
        if (s) current = s;
        undoCount++;
      }
      expect(undoCount).toBe(20);
    });
  });

  describe('undo', () => {
    it('returns null when nothing to undo', () => {
      const result = hm.undo(makeSnapshot());
      expect(result).toBeNull();
    });

    it('returns the pushed snapshot', () => {
      const snap = makeSnapshot({ groupCounter: 42 });
      hm.push(snap);
      const result = hm.undo(makeSnapshot({ groupCounter: 99 }));
      expect(result).not.toBeNull();
      expect(result!.groupCounter).toBe(42);
    });

    it('enables redo after undo', () => {
      hm.push(makeSnapshot());
      hm.undo(makeSnapshot());
      expect(hm.canRedo()).toBe(true);
    });
  });

  describe('redo', () => {
    it('returns null when nothing to redo', () => {
      expect(hm.redo(makeSnapshot())).toBeNull();
    });

    it('restores what was undone', () => {
      hm.push(makeSnapshot({ groupCounter: 1 }));
      const current = makeSnapshot({ groupCounter: 2 });
      hm.undo(current);
      const result = hm.redo(makeSnapshot({ groupCounter: 3 }));
      expect(result).not.toBeNull();
      expect(result!.groupCounter).toBe(2);
    });
  });

  describe('clear', () => {
    it('resets both stacks', () => {
      hm.push(makeSnapshot());
      hm.push(makeSnapshot());
      hm.undo(makeSnapshot());
      hm.clear();
      expect(hm.canUndo()).toBe(false);
      expect(hm.canRedo()).toBe(false);
    });
  });

  describe('imageDataStore and reference counting', () => {
    it('registers and resolves image data', () => {
      hm.registerImageData('img-1', 'data:image/png;base64,ABC');
      expect(hm.resolveDataUrl('img-1')).toBe('data:image/png;base64,ABC');
    });

    it('returns empty string for unknown key', () => {
      expect(hm.resolveDataUrl('unknown')).toBe('');
    });

    it('cleans up unreferenced image data on eviction', () => {
      hm.registerImageData('img-1', 'data:a');
      hm.registerImageData('img-2', 'data:b');

      hm.push(makeImageSnapshot(['img-1']));
      hm.push(makeImageSnapshot(['img-2']));

      expect(hm.resolveDataUrl('img-1')).toBe('data:a');

      for (let i = 0; i < 20; i++) {
        hm.push(makeImageSnapshot(['img-2']));
      }

      expect(hm.resolveDataUrl('img-1')).toBe('');
      expect(hm.resolveDataUrl('img-2')).toBe('data:b');
    });

    it('clear removes all image data', () => {
      hm.registerImageData('img-1', 'data:a');
      hm.push(makeImageSnapshot(['img-1']));
      hm.clear();
      expect(hm.resolveDataUrl('img-1')).toBe('');
    });
  });

  describe('onDirty callback', () => {
    it('fires on push', () => {
      const cb = vi.fn();
      hm.onDirty = cb;
      hm.push(makeSnapshot());
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('fires on undo', () => {
      hm.push(makeSnapshot());
      const cb = vi.fn();
      hm.onDirty = cb;
      hm.undo(makeSnapshot());
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('fires on redo', () => {
      hm.push(makeSnapshot());
      hm.undo(makeSnapshot());
      const cb = vi.fn();
      hm.onDirty = cb;
      hm.redo(makeSnapshot());
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('fires on clear', () => {
      hm.push(makeSnapshot());
      const cb = vi.fn();
      hm.onDirty = cb;
      hm.clear();
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('serialization', () => {
    it('toSerializable round-trips with restoreFrom', () => {
      hm.registerImageData('img-1', 'data:a');
      hm.registerImageData('img-2', 'data:b');
      hm.push(makeImageSnapshot(['img-1']));
      hm.push(makeImageSnapshot(['img-2']));
      hm.undo(makeImageSnapshot(['img-1']));

      const serialized = hm.toSerializable();

      const hm2 = new HistoryManager();
      hm2.restoreFrom(serialized);

      expect(hm2.canUndo()).toBe(true);
      expect(hm2.canRedo()).toBe(true);
      expect(hm2.resolveDataUrl('img-1')).toBe('data:a');
      expect(hm2.resolveDataUrl('img-2')).toBe('data:b');

      const undone = hm2.undo(makeImageSnapshot(['img-2']));
      expect(undone).not.toBeNull();
      expect(undone!.images[0].dataKey).toBe('img-1');
    });

    it('toSerializable produces plain objects', () => {
      hm.registerImageData('img-1', 'data:x');
      hm.push(makeImageSnapshot(['img-1']));
      const data = hm.toSerializable();

      expect(Array.isArray(data.undoStack)).toBe(true);
      expect(Array.isArray(data.redoStack)).toBe(true);
      expect(typeof data.imageData).toBe('object');
      expect(data.imageData['img-1']).toBe('data:x');
    });
  });

  describe('complex undo/redo sequences', () => {
    it('handles multiple undo then redo', () => {
      hm.push(makeSnapshot({ groupCounter: 1 }));
      hm.push(makeSnapshot({ groupCounter: 2 }));
      hm.push(makeSnapshot({ groupCounter: 3 }));

      const u1 = hm.undo(makeSnapshot({ groupCounter: 4 }));
      expect(u1!.groupCounter).toBe(3);

      const u2 = hm.undo(u1!);
      expect(u2!.groupCounter).toBe(2);

      const r1 = hm.redo(u2!);
      expect(r1!.groupCounter).toBe(3);

      const r2 = hm.redo(r1!);
      expect(r2!.groupCounter).toBe(4);
    });

    it('push after undo discards redo branch', () => {
      hm.push(makeSnapshot({ groupCounter: 1 }));
      hm.push(makeSnapshot({ groupCounter: 2 }));
      hm.undo(makeSnapshot({ groupCounter: 3 }));

      hm.push(makeSnapshot({ groupCounter: 10 }));
      expect(hm.canRedo()).toBe(false);

      const u = hm.undo(makeSnapshot({ groupCounter: 11 }));
      expect(u!.groupCounter).toBe(10);
    });
  });
});
