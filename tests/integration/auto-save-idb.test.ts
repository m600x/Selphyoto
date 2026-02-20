import { describe, it, expect, beforeEach } from 'bun:test';
import 'fake-indexeddb/auto';
import { saveAutoState, loadAutoState, clearAutoState, type AutoSaveState } from '../../src/auto-save';

function makeState(overrides: Partial<AutoSaveState> = {}): AutoSaveState {
  return {
    pages: overrides.pages ?? [{ images: [], groups: [], groupCounter: 0, textCounter: 0 }],
    currentPage: overrides.currentPage ?? 0,
    settings: overrides.settings ?? {
      correctionX: 0.961,
      correctionY: 0.961,
      backgroundColor: '#ffffff',
      markColor: '#cc0000',
      guidelinesVisible: true,
      exportFormat: 'png',
    },
  };
}

describe('auto-save IndexedDB operations', () => {
  beforeEach(async () => {
    await clearAutoState().catch(() => {});
    indexedDB.deleteDatabase('selphyoto');
  });

  it('loadAutoState returns null when nothing is saved', async () => {
    const result = await loadAutoState();
    expect(result).toBeNull();
  });

  it('saveAutoState then loadAutoState roundtrips correctly', async () => {
    const state = makeState({
      pages: [{
        images: [
          {
            dataUrl: 'data:image/png;base64,ABC',
            filename: 'photo.png',
            visible: true,
            locked: false,
            groupId: null,
            left: 10,
            top: 20,
            scaleX: 0.5,
            scaleY: 0.5,
            angle: 45,
            flipX: true,
            flipY: false,
            opacity: 0.8,
          },
        ],
        groups: [{ id: 'group-1', name: 'Group 1', visible: true }],
        groupCounter: 1,
        textCounter: 0,
      }],
      settings: {
        correctionX: 0.95,
        correctionY: 0.96,
        backgroundColor: '#000000',
        markColor: '#ffffff',
        guidelinesVisible: false,
        exportFormat: 'jpeg',
      },
    });

    await saveAutoState(state);
    const loaded = await loadAutoState();

    expect(loaded).not.toBeNull();
    expect(loaded!.pages[0].images).toHaveLength(1);
    expect(loaded!.pages[0].images[0].filename).toBe('photo.png');
    expect(loaded!.pages[0].images[0].left).toBe(10);
    expect(loaded!.pages[0].groups).toHaveLength(1);
    expect(loaded!.pages[0].groups[0].name).toBe('Group 1');
    expect(loaded!.pages[0].groupCounter).toBe(1);
    expect(loaded!.settings.correctionX).toBe(0.95);
    expect(loaded!.settings.exportFormat).toBe('jpeg');
  });

  it('clearAutoState removes saved data', async () => {
    const state = makeState({
      pages: [{ images: [], groups: [], groupCounter: 5, textCounter: 0 }],
    });
    await saveAutoState(state);

    const before = await loadAutoState();
    expect(before).not.toBeNull();

    await clearAutoState();
    const after = await loadAutoState();
    expect(after).toBeNull();
  });

  it('saveAutoState overwrites previous state', async () => {
    await saveAutoState(makeState({
      pages: [{ images: [], groups: [], groupCounter: 1, textCounter: 0 }],
    }));
    await saveAutoState(makeState({
      pages: [{ images: [], groups: [], groupCounter: 42, textCounter: 0 }],
    }));

    const loaded = await loadAutoState();
    expect(loaded!.pages[0].groupCounter).toBe(42);
  });

  it('handles state with multiple images and text layers', async () => {
    const state = makeState({
      pages: [{
        images: [
          { dataUrl: 'data:a', filename: 'a.png', visible: true, locked: false, groupId: null, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0, flipX: false, flipY: false, opacity: 1 },
          { dataUrl: 'data:b', filename: 'b.jpg', visible: false, locked: true, groupId: 'g1', left: 50, top: 60, scaleX: 2, scaleY: 2, angle: 90, flipX: true, flipY: true, opacity: 0.5 },
          { type: 'text', dataUrl: '', filename: 'Text 1', visible: true, locked: false, groupId: null, left: 100, top: 200, scaleX: 1, scaleY: 1, angle: 0, flipX: false, flipY: false, opacity: 0.8, text: 'Hello', fontFamily: 'Georgia', fontSize: 60, fill: '#ff0000', fontWeight: 'bold', fontStyle: 'italic', textAlign: 'right', width: 300 },
        ],
        groups: [{ id: 'g1', name: 'Photos', visible: true }],
        groupCounter: 1,
        textCounter: 1,
      }],
    });

    await saveAutoState(state);
    const loaded = await loadAutoState();

    expect(loaded!.pages[0].images).toHaveLength(3);
    expect(loaded!.pages[0].images[1].filename).toBe('b.jpg');
    expect(loaded!.pages[0].images[1].locked).toBe(true);
    expect(loaded!.pages[0].images[2].type).toBe('text');
    expect(loaded!.pages[0].images[2].text).toBe('Hello');
    expect(loaded!.pages[0].images[2].fontFamily).toBe('Georgia');
  });

  it('handles multi-page state', async () => {
    const state = makeState({
      pages: [
        { images: [{ dataUrl: 'data:p1', filename: 'p1.png', visible: true, locked: false, groupId: null, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0, flipX: false, flipY: false, opacity: 1 }], groups: [], groupCounter: 0, textCounter: 0 },
        { images: [{ dataUrl: 'data:p2', filename: 'p2.png', visible: true, locked: false, groupId: null, left: 10, top: 10, scaleX: 1, scaleY: 1, angle: 0, flipX: false, flipY: false, opacity: 1 }], groups: [], groupCounter: 0, textCounter: 0 },
      ],
      currentPage: 1,
    });

    await saveAutoState(state);
    const loaded = await loadAutoState();

    expect(loaded!.pages).toHaveLength(2);
    expect(loaded!.currentPage).toBe(1);
    expect(loaded!.pages[0].images[0].filename).toBe('p1.png');
    expect(loaded!.pages[1].images[0].filename).toBe('p2.png');
  });

  it('migrates legacy single-page state', async () => {
    const legacyState = {
      images: [{ dataUrl: 'data:old', filename: 'old.png', visible: true, locked: false, groupId: null, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0, flipX: false, flipY: false, opacity: 1 }],
      groups: [{ id: 'g1', name: 'Old Group', visible: true }],
      groupCounter: 1,
      textCounter: 0,
      settings: {
        correctionX: 0.961,
        correctionY: 0.961,
        backgroundColor: '#ffffff',
        markColor: '#cc0000',
        guidelinesVisible: true,
        exportFormat: 'png' as const,
      },
    };

    // Save legacy state directly
    const { openDB } = await import('./idb-helper');
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('state', 'readwrite');
      tx.objectStore('state').put(legacyState, 'current');
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });

    const loaded = await loadAutoState();
    expect(loaded).not.toBeNull();
    expect(loaded!.pages).toHaveLength(1);
    expect(loaded!.pages[0].images[0].filename).toBe('old.png');
    expect(loaded!.pages[0].groups[0].name).toBe('Old Group');
    expect(loaded!.currentPage).toBe(0);
  });
});
