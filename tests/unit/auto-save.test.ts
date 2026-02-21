import { describe, it, expect, mock } from 'bun:test';
import { collectPageData, collectState } from '../../src/auto-save';
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
  outlineVisible: boolean;
  centerLinesVisible: boolean;
  rulerVisible: boolean;
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
    getOutlineVisible: mock(() => overrides.outlineVisible ?? true),
    getCenterLinesVisible: mock(() => overrides.centerLinesVisible ?? false),
    getRulerVisible: mock(() => overrides.rulerVisible ?? false),
  } as unknown as CanvasManager;
}

describe('collectPageData', () => {
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
    });

    const pageData = collectPageData(cm);

    expect(pageData.images).toHaveLength(1);
    expect(pageData.images[0]).toMatchObject({
      type: 'image',
      dataUrl: 'data:image/png;base64,AAA',
      filename: 'photo.png',
      visible: true,
      locked: false,
      groupId: 'group-1',
      left: 10,
      top: 20,
    });

    expect(pageData.groups).toHaveLength(1);
    expect(pageData.groups[0].id).toBe('group-1');
    expect(pageData.groupCounter).toBe(1);
  });

  it('handles empty images array', () => {
    const cm = makeMockCM();
    const pageData = collectPageData(cm);
    expect(pageData.images).toHaveLength(0);
    expect(pageData.groups).toHaveLength(0);
    expect(pageData.groupCounter).toBe(0);
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

    const pageData = collectPageData(cm);
    expect(pageData.images).toHaveLength(2);
    expect(pageData.images[0].left).toBe(100);
    expect(pageData.images[0].locked).toBe(true);
    expect(pageData.images[0].groupId).toBeNull();
    expect(pageData.images[1].filename).toBe('b.jpg');
    expect(pageData.images[1].groupId).toBeNull();
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

    const pageData = collectPageData(cm);
    expect(pageData.images).toHaveLength(1);
    expect(pageData.images[0]).toMatchObject({
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
    expect(pageData.textCounter).toBe(1);
  });
});

describe('collectState', () => {
  it('wraps pages and settings into multi-page format', () => {
    const cm = makeMockCM({
      corrX: 0.95,
      corrY: 0.96,
      bgColor: '#000000',
      markColor: '#ffffff',
      outlineVisible: false,
      centerLinesVisible: true,
    });

    const pages = [{ images: [], groups: [], groupCounter: 0, textCounter: 0 }];
    const state = collectState(cm, pages, 0, 'jpeg');

    expect(state.pages).toHaveLength(1);
    expect(state.currentPage).toBe(0);
    expect(state.settings).toEqual({
      correctionX: 0.95,
      correctionY: 0.96,
      backgroundColor: '#000000',
      markColor: '#ffffff',
      outlineVisible: false,
      centerLinesVisible: true,
      rulerVisible: false,
      exportFormat: 'jpeg',
    });
  });

  it('uses provided export format', () => {
    const cm = makeMockCM();
    const pages = [{ images: [], groups: [], groupCounter: 0, textCounter: 0 }];
    expect(collectState(cm, pages, 0, 'png').settings.exportFormat).toBe('png');
    expect(collectState(cm, pages, 0, 'jpeg').settings.exportFormat).toBe('jpeg');
  });
});
