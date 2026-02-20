import { describe, it, expect, mock } from 'bun:test';
import { collectState } from '../../src/auto-save';
import type { CanvasManager } from '../../src/canvas-manager';

function makeMockCM(overrides: Partial<{
  images: Array<{
    fabricImage: { left: number; top: number; scaleX: number; scaleY: number; angle: number };
    filename: string;
    visible: boolean;
    locked: boolean;
    groupId?: string;
    originalDataUrl: string;
  }>;
  groups: Array<{ id: string; name: string; visible: boolean }>;
  groupCounter: number;
  corrX: number;
  corrY: number;
  bgColor: string;
  markColor: string;
  guidelinesVisible: boolean;
}> = {}): CanvasManager {
  const images = overrides.images ?? [];
  const groups = overrides.groups ?? [];
  return {
    images,
    groups,
    getGroupCounter: mock(() => overrides.groupCounter ?? 0),
    getCorrectionX: mock(() => overrides.corrX ?? 0.961),
    getCorrectionY: mock(() => overrides.corrY ?? 0.961),
    getBackgroundColor: mock(() => overrides.bgColor ?? '#ffffff'),
    getMarkColor: mock(() => overrides.markColor ?? '#cc0000'),
    getGuidelinesVisible: mock(() => overrides.guidelinesVisible ?? true),
  } as unknown as CanvasManager;
}

describe('collectState', () => {
  it('returns correct structure with populated images', () => {
    const cm = makeMockCM({
      images: [
        {
          fabricImage: { left: 10, top: 20, scaleX: 0.5, scaleY: 0.5, angle: 45 },
          filename: 'photo.png',
          visible: true,
          locked: false,
          groupId: 'group-1',
          originalDataUrl: 'data:image/png;base64,AAA',
        },
      ],
      groups: [{ id: 'group-1', name: 'Group 1', visible: true }],
      groupCounter: 1,
      corrX: 0.95,
      corrY: 0.96,
      bgColor: '#000000',
      markColor: '#ffffff',
      guidelinesVisible: false,
    });

    const state = collectState(cm, 'jpeg');

    expect(state.images).toHaveLength(1);
    expect(state.images[0]).toEqual({
      dataUrl: 'data:image/png;base64,AAA',
      filename: 'photo.png',
      visible: true,
      locked: false,
      groupId: 'group-1',
      left: 10,
      top: 20,
      scaleX: 0.5,
      scaleY: 0.5,
      angle: 45,
    });

    expect(state.groups).toHaveLength(1);
    expect(state.groups[0].id).toBe('group-1');
    expect(state.groupCounter).toBe(1);

    expect(state.settings).toEqual({
      correctionX: 0.95,
      correctionY: 0.96,
      backgroundColor: '#000000',
      markColor: '#ffffff',
      guidelinesVisible: false,
      exportFormat: 'jpeg',
    });
  });

  it('handles empty images array', () => {
    const cm = makeMockCM();
    const state = collectState(cm, 'png');
    expect(state.images).toHaveLength(0);
    expect(state.groups).toHaveLength(0);
    expect(state.groupCounter).toBe(0);
  });

  it('maps fabricImage properties correctly for multiple images', () => {
    const cm = makeMockCM({
      images: [
        {
          fabricImage: { left: 100, top: 200, scaleX: 2, scaleY: 3, angle: 90 },
          filename: 'a.png',
          visible: false,
          locked: true,
          originalDataUrl: 'data:a',
        },
        {
          fabricImage: { left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0 },
          filename: 'b.jpg',
          visible: true,
          locked: false,
          groupId: undefined,
          originalDataUrl: 'data:b',
        },
      ],
    });

    const state = collectState(cm, 'png');
    expect(state.images).toHaveLength(2);
    expect(state.images[0].left).toBe(100);
    expect(state.images[0].locked).toBe(true);
    expect(state.images[0].groupId).toBeNull();
    expect(state.images[1].filename).toBe('b.jpg');
    expect(state.images[1].groupId).toBeNull();
  });

  it('uses provided export format', () => {
    const cm = makeMockCM();
    expect(collectState(cm, 'png').settings.exportFormat).toBe('png');
    expect(collectState(cm, 'jpeg').settings.exportFormat).toBe('jpeg');
  });
});
