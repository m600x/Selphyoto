import { describe, it, expect, beforeEach } from 'bun:test';
import 'fake-indexeddb/auto';
import {
  saveHistoryState,
  loadHistoryState,
  clearHistoryState,
} from '../../src/auto-save';
import type { PersistedHistory } from '../../src/history-manager';

function makeHistory(overrides: Partial<PersistedHistory> = {}): PersistedHistory {
  return {
    undoStack: overrides.undoStack ?? [],
    redoStack: overrides.redoStack ?? [],
    imageData: overrides.imageData ?? {},
  };
}

describe('history IndexedDB operations', () => {
  beforeEach(() => {
    indexedDB.deleteDatabase('selphyoto');
  });

  it('loadHistoryState returns null when nothing saved', async () => {
    const result = await loadHistoryState();
    expect(result).toBeNull();
  });

  it('round-trips history state through IDB', async () => {
    const data = makeHistory({
      undoStack: [
        {
          images: [{
            dataKey: 'img-1',
            filename: 'test.png',
            visible: true,
            locked: false,
            groupId: null,
            left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
            flipX: false, flipY: false, opacity: 1,
          }],
          groups: [{ id: 'g1', name: 'Group 1', visible: true }],
          groupCounter: 1,
        },
      ],
      redoStack: [],
      imageData: { 'img-1': 'data:image/png;base64,ABC' },
    });

    await saveHistoryState(data);
    const loaded = await loadHistoryState();

    expect(loaded).not.toBeNull();
    expect(loaded!.undoStack).toHaveLength(1);
    expect(loaded!.undoStack[0].images[0].dataKey).toBe('img-1');
    expect(loaded!.undoStack[0].groups[0].name).toBe('Group 1');
    expect(loaded!.imageData['img-1']).toBe('data:image/png;base64,ABC');
  });

  it('clearHistoryState removes saved data', async () => {
    await saveHistoryState(makeHistory({
      imageData: { 'k': 'v' },
    }));

    const before = await loadHistoryState();
    expect(before).not.toBeNull();

    await clearHistoryState();
    const after = await loadHistoryState();
    expect(after).toBeNull();
  });

  it('overwrites previous history state', async () => {
    await saveHistoryState(makeHistory({
      imageData: { 'old': 'data' },
    }));
    await saveHistoryState(makeHistory({
      imageData: { 'new': 'data2' },
    }));

    const loaded = await loadHistoryState();
    expect(loaded!.imageData).not.toHaveProperty('old');
    expect(loaded!.imageData['new']).toBe('data2');
  });

  it('coexists with auto-save state store', async () => {
    const { saveAutoState, loadAutoState } = await import('../../src/auto-save');

    const autoState = {
      pages: [{ images: [], groups: [], groupCounter: 5, textCounter: 0 }],
      currentPage: 0,
      settings: {
        correctionX: 0.961,
        correctionY: 0.961,
        backgroundColor: '#ffffff',
        markColor: '#cc0000',
        outlineVisible: true,
        centerLinesVisible: false,
        exportFormat: 'png' as const,
      },
    };

    await saveAutoState(autoState);
    await saveHistoryState(makeHistory({
      imageData: { 'history-key': 'history-data' },
    }));

    const loadedAuto = await loadAutoState();
    const loadedHistory = await loadHistoryState();

    expect(loadedAuto).not.toBeNull();
    expect(loadedAuto!.pages[0].groupCounter).toBe(5);
    expect(loadedHistory).not.toBeNull();
    expect(loadedHistory!.imageData['history-key']).toBe('history-data');
  });
});
