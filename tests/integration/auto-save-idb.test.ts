import { describe, it, expect, beforeEach } from 'bun:test';
import 'fake-indexeddb/auto';
import { saveAutoState, loadAutoState, clearAutoState, type AutoSaveState } from '../../src/auto-save';

function makeState(overrides: Partial<AutoSaveState> = {}): AutoSaveState {
  return {
    images: overrides.images ?? [],
    groups: overrides.groups ?? [],
    groupCounter: overrides.groupCounter ?? 0,
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
        },
      ],
      groups: [{ id: 'group-1', name: 'Group 1', visible: true }],
      groupCounter: 1,
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
    expect(loaded!.images).toHaveLength(1);
    expect(loaded!.images[0].filename).toBe('photo.png');
    expect(loaded!.images[0].left).toBe(10);
    expect(loaded!.images[0].angle).toBe(45);
    expect(loaded!.groups).toHaveLength(1);
    expect(loaded!.groups[0].name).toBe('Group 1');
    expect(loaded!.groupCounter).toBe(1);
    expect(loaded!.settings.correctionX).toBe(0.95);
    expect(loaded!.settings.exportFormat).toBe('jpeg');
  });

  it('clearAutoState removes saved data', async () => {
    const state = makeState({ groupCounter: 5 });
    await saveAutoState(state);

    const before = await loadAutoState();
    expect(before).not.toBeNull();

    await clearAutoState();
    const after = await loadAutoState();
    expect(after).toBeNull();
  });

  it('saveAutoState overwrites previous state', async () => {
    await saveAutoState(makeState({ groupCounter: 1 }));
    await saveAutoState(makeState({ groupCounter: 42 }));

    const loaded = await loadAutoState();
    expect(loaded!.groupCounter).toBe(42);
  });

  it('handles state with multiple images', async () => {
    const state = makeState({
      images: [
        { dataUrl: 'data:a', filename: 'a.png', visible: true, locked: false, groupId: null, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0 },
        { dataUrl: 'data:b', filename: 'b.jpg', visible: false, locked: true, groupId: 'g1', left: 50, top: 60, scaleX: 2, scaleY: 2, angle: 90 },
      ],
      groups: [{ id: 'g1', name: 'Photos', visible: true }],
    });

    await saveAutoState(state);
    const loaded = await loadAutoState();

    expect(loaded!.images).toHaveLength(2);
    expect(loaded!.images[1].filename).toBe('b.jpg');
    expect(loaded!.images[1].locked).toBe(true);
    expect(loaded!.images[1].angle).toBe(90);
  });
});
