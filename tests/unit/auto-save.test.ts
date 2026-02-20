import { describe, it, expect, mock } from 'bun:test';
import { collectState } from '../../src/auto-save';
import type { CanvasManager } from '../../src/canvas-manager';

function makeMockCM(overrides: Partial<{
  images: Array<{
    type?: 'image' | 'text';
    fabricImage: Record<string, unknown>;
    filename: string;
    visible: boolean;
    locked: boolean;
    groupId?: string;
    originalDataUrl: string;
  }>;
  groups: Array<{ id: string; name: string; visible: boolean }>;
  groupCounter: number;
  textCounter: number;
  corrX: number;
  corrY: number;
  bgColor: string;
  markColor: string;
  guidelinesVisible: boolean;
}> = {}): CanvasManager {
  const images = (overrides.images ?? []).map(img => ({ type: 'image' as const, ...img }));
  const groups = overrides.groups ?? [];
  return {
    images,
    groups,
    getGroupCounter: mock(() => overrides.groupCounter ?? 0),
    getTextCounter: mock(() => overrides.textCounter ?? 0),
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
          fabricImage: { left: 10, top: 20, scaleX: 0.5, scaleY: 0.5, angle: 45, flipX: true, flipY: false, opacity: 0.8 },
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
    expect(state.images[0]).toMatchObject({
      type: 'image',
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
      flipX: true,
      flipY: false,
      opacity: 0.8,
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

  it('collects text layer properties including textAlign', () => {
    const cm = makeMockCM({
      images: [{
        type: 'text',
        fabricImage: {
          left: 100, top: 200, scaleX: 1, scaleY: 1, angle: 0,
          flipX: false, flipY: false, opacity: 0.9,
          text: 'Hello', fontFamily: 'Georgia', fontSize: 60,
          fill: '#ff0000', fontWeight: 'bold', fontStyle: 'italic',
          textAlign: 'right', width: 300,
        },
        filename: 'Text 1',
        visible: true,
        locked: false,
        originalDataUrl: '',
      }],
      textCounter: 1,
    });

    const state = collectState(cm, 'png');
    expect(state.images).toHaveLength(1);
    expect(state.images[0]).toMatchObject({
      type: 'text',
      text: 'Hello',
      fontFamily: 'Georgia',
      fontSize: 60,
      fill: '#ff0000',
      fontWeight: 'bold',
      fontStyle: 'italic',
      textAlign: 'right',
      width: 300,
    });
    expect(state.textCounter).toBe(1);
  });
});
