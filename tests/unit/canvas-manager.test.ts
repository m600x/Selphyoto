import { describe, it, expect, mock, beforeEach } from 'bun:test';

mock.module('fabric', () => {
  class MockCanvas {
    renderOnAddRemove = true;
    private objects: unknown[] = [];
    private activeObject: unknown = null;
    private _width = 740;
    private _height = 500;
    private _zoom = 1;
    private _listeners: Record<string, Array<(data?: unknown) => void>> = {};

    add(obj: unknown) { this.objects.push(obj); }
    remove(obj: unknown) {
      const i = this.objects.indexOf(obj);
      if (i >= 0) this.objects.splice(i, 1);
    }
    getObjects() { return [...this.objects]; }
    setActiveObject(obj: unknown) { this.activeObject = obj; }
    discardActiveObject() { this.activeObject = null; }
    getActiveObject() { return this.activeObject; }
    getActiveObjects() {
      const ao = this.activeObject;
      if (!ao) return [];
      if (ao instanceof MockActiveSelection) return (ao as any)._objects as unknown[];
      return [ao];
    }
    requestRenderAll() {}
    renderAll() {}
    setDimensions(dims: { width?: number; height?: number }) {
      if (dims.width !== undefined) this._width = dims.width;
      if (dims.height !== undefined) this._height = dims.height;
    }
    getWidth() { return this._width; }
    getHeight() { return this._height; }
    setZoom(z: number) { this._zoom = z; }
    getZoom() { return this._zoom; }
    on(event: string, fn: (data?: unknown) => void) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(fn);
    }
    emit(event: string, data?: unknown) {
      (this._listeners[event] ?? []).forEach(fn => fn(data));
    }
    toDataURL() { return 'data:image/png;base64,TEST'; }
  }

  class MockRect {
    fill = '';
    left = 0; top = 0; width = 0; height = 0;
    constructor(opts?: Record<string, unknown>) {
      if (opts) Object.assign(this, opts);
    }
    set(key: string | Record<string, unknown>, val?: unknown) {
      if (typeof key === 'string') (this as Record<string, unknown>)[key] = val;
      else Object.assign(this, key);
    }
  }

  class MockLine {
    stroke = '';
    visible = true;
    constructor(_coords?: number[], opts?: Record<string, unknown>) {
      if (opts) Object.assign(this, opts);
    }
    set(key: string | Record<string, unknown>, val?: unknown) {
      if (typeof key === 'string') (this as Record<string, unknown>)[key] = val;
      else Object.assign(this, key);
    }
  }

  class MockFabricImage {
    left = 0; top = 0; scaleX = 1; scaleY = 1; angle = 0;
    flipX = false; flipY = false; opacity = 1;
    width = 100; height = 100; visible = true;
    selectable = true; evented = true;
    filters: unknown[] = [];

    constructor(opts?: Record<string, unknown>) {
      if (opts) Object.assign(this, opts);
    }
    set(key: string | Record<string, unknown>, val?: unknown) {
      if (typeof key === 'string') (this as Record<string, unknown>)[key] = val;
      else Object.assign(this, key);
    }
    setCoords() {}
    applyFilters() {}
    getElement() {
      return { width: this.width, height: this.height };
    }
    getBoundingRect() {
      return {
        left: this.left,
        top: this.top,
        width: this.width * this.scaleX,
        height: this.height * this.scaleY,
      };
    }
    getScaledWidth() { return this.width * this.scaleX; }
    getScaledHeight() { return this.height * this.scaleY; }
    scaleToWidth(value: number) {
      const factor = this.getBoundingRect().width / this.getScaledWidth();
      const s = value / this.width / factor;
      this.scaleX = s;
      this.scaleY = s;
    }
    scaleToHeight(value: number) {
      const factor = this.getBoundingRect().height / this.getScaledHeight();
      const s = value / this.height / factor;
      this.scaleX = s;
      this.scaleY = s;
    }
    toDataURL() { return 'data:image/png;base64,IMGDATA'; }
    static fromURL = mock().mockImplementation(async () => new MockFabricImage());
  }

  class MockTextbox {
    text = ''; left = 0; top = 0; scaleX = 1; scaleY = 1; angle = 0;
    flipX = false; flipY = false; opacity = 1;
    width = 200; height = 50; visible = true;
    selectable = true; evented = true;
    fontFamily = 'Arial'; fontSize = 40; fill = '#000000';
    fontWeight = 'normal'; fontStyle = 'normal'; textAlign = 'center';

    constructor(text?: string, opts?: Record<string, unknown>) {
      if (text) this.text = text;
      if (opts) Object.assign(this, opts);
    }
    set(key: string | Record<string, unknown>, val?: unknown) {
      if (typeof key === 'string') (this as Record<string, unknown>)[key] = val;
      else Object.assign(this, key);
    }
    dirty = false;
    setCoords() {}
    calcTextWidth() { return (this.text?.length ?? 4) * 20; }
    initDimensions() {}
    getBoundingRect() {
      return {
        left: this.left,
        top: this.top,
        width: this.width * this.scaleX,
        height: this.height * this.scaleY,
      };
    }
    toDataURL() { return 'data:image/png;base64,TEXT'; }
  }

  class MockActiveSelection {
    _objects: unknown[];
    canvas: unknown;
    constructor(objects: unknown[], opts?: Record<string, unknown>) {
      this._objects = objects;
      this.canvas = opts?.canvas;
    }
  }

  class MockText {
    text = ''; left = 0; top = 0; fontSize = 12; fill = '#000';
    visible = true; selectable = false; evented = false;
    constructor(text?: string, opts?: Record<string, unknown>) {
      if (text) this.text = text;
      if (opts) Object.assign(this, opts);
    }
    set(key: string | Record<string, unknown>, val?: unknown) {
      if (typeof key === 'string') (this as Record<string, unknown>)[key] = val;
      else Object.assign(this, key);
    }
  }

  class MockBrightness { brightness = 0; constructor(opts?: any) { if (opts) Object.assign(this, opts); } }
  class MockContrast { contrast = 0; constructor(opts?: any) { if (opts) Object.assign(this, opts); } }
  class MockSaturation { saturation = 0; constructor(opts?: any) { if (opts) Object.assign(this, opts); } }
  class MockVibrance { vibrance = 0; constructor(opts?: any) { if (opts) Object.assign(this, opts); } }
  class MockConvolute { matrix: number[] = []; constructor(opts?: any) { if (opts) Object.assign(this, opts); } }

  return {
    Canvas: MockCanvas,
    Rect: MockRect,
    Line: MockLine,
    FabricImage: MockFabricImage,
    FabricObject: class {},
    Textbox: MockTextbox,
    ActiveSelection: MockActiveSelection,
    Text: MockText,
    filters: {
      Brightness: MockBrightness,
      Contrast: MockContrast,
      Saturation: MockSaturation,
      Vibrance: MockVibrance,
      Convolute: MockConvolute,
    },
  };
});

import { CanvasManager } from '../../src/canvas-manager';
import type { Canvas } from 'fabric';

if (typeof document !== 'undefined') {
  const origCreate = document.createElement.bind(document);
  document.createElement = ((tag: string) => {
    if (tag === 'canvas') {
      const c: Record<string, unknown> = {
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage: () => {},
          fillRect: () => {},
          fillStyle: '',
          globalCompositeOperation: '',
          filter: '',
        }),
      };
      return c;
    }
    return origCreate(tag);
  }) as typeof document.createElement;
} else {
  (globalThis as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({
            drawImage: () => {},
            fillRect: () => {},
            fillStyle: '',
            globalCompositeOperation: '',
            filter: '',
          }),
        };
      }
      return {};
    },
  };
}

interface MockCanvasWithEmit extends Canvas {
  emit(event: string, data?: unknown): void;
}

function mockCanvas(cm: CanvasManager): MockCanvasWithEmit {
  return cm.canvas as unknown as MockCanvasWithEmit;
}

describe('CanvasManager', () => {
  let cm: CanvasManager;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="test-canvas"></canvas>';
    cm = new CanvasManager('test-canvas');
  });

  describe('group management', () => {
    it('createGroup returns incrementing IDs', () => {
      const id1 = cm.createGroup();
      const id2 = cm.createGroup();
      expect(id1).toBe('group-1');
      expect(id2).toBe('group-2');
    });

    it('createGroup assigns default names', () => {
      cm.createGroup();
      cm.createGroup();
      expect(cm.groups[0].name).toBe('Group 1');
      expect(cm.groups[1].name).toBe('Group 2');
    });

    it('new groups are visible by default', () => {
      cm.createGroup();
      expect(cm.groups[0].visible).toBe(true);
    });

    it('renameGroup updates the name', () => {
      const id = cm.createGroup();
      cm.renameGroup(id, 'My Custom Group');
      expect(cm.groups[0].name).toBe('My Custom Group');
    });

    it('renameGroup with non-existent ID does nothing', () => {
      cm.createGroup();
      cm.renameGroup('group-999', 'Nope');
      expect(cm.groups[0].name).toBe('Group 1');
    });

    it('deleteGroup removes the group', () => {
      const id = cm.createGroup();
      cm.deleteGroup(id);
      expect(cm.groups.length).toBe(0);
    });

    it('getGroupCounter increments correctly', () => {
      expect(cm.getGroupCounter()).toBe(0);
      cm.createGroup();
      expect(cm.getGroupCounter()).toBe(1);
      cm.createGroup();
      expect(cm.getGroupCounter()).toBe(2);
    });
  });

  describe('correction factors', () => {
    it('defaults to 0.9610', () => {
      expect(cm.getCorrectionX()).toBe(0.9610);
      expect(cm.getCorrectionY()).toBe(0.9610);
    });

    it('setCorrectionX updates the value', () => {
      cm.setCorrectionX(0.95);
      expect(cm.getCorrectionX()).toBe(0.95);
    });

    it('setCorrectionY updates the value', () => {
      cm.setCorrectionY(0.98);
      expect(cm.getCorrectionY()).toBe(0.98);
    });

    it('clamps correctionX to min 0.5', () => {
      cm.setCorrectionX(0.1);
      expect(cm.getCorrectionX()).toBe(0.5);
    });

    it('clamps correctionX to max 1.5', () => {
      cm.setCorrectionX(2.0);
      expect(cm.getCorrectionX()).toBe(1.5);
    });

    it('clamps correctionY to min 0.5', () => {
      cm.setCorrectionY(0.0);
      expect(cm.getCorrectionY()).toBe(0.5);
    });

    it('clamps correctionY to max 1.5', () => {
      cm.setCorrectionY(99);
      expect(cm.getCorrectionY()).toBe(1.5);
    });
  });

  describe('image management', () => {
    async function addTestImages(count: number) {
      for (let i = 0; i < count; i++) {
        await cm.addImageFromDataURL('data:image/png;base64,TEST', {
          filename: `image${i}.png`,
          visible: true,
          left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
        });
      }
    }

    it('addImageFromDataURL adds images', async () => {
      await addTestImages(2);
      expect(cm.images.length).toBe(2);
      expect(cm.images[0].filename).toBe('image0.png');
      expect(cm.images[1].filename).toBe('image1.png');
    });

    it('removeImage removes by index', async () => {
      await addTestImages(3);
      cm.removeImage(1);
      expect(cm.images.length).toBe(2);
      expect(cm.images[0].filename).toBe('image0.png');
      expect(cm.images[1].filename).toBe('image2.png');
    });

    it('removeImage with invalid index does nothing', async () => {
      await addTestImages(2);
      cm.removeImage(-1);
      cm.removeImage(5);
      expect(cm.images.length).toBe(2);
    });

    it('reorderImages swaps correctly', async () => {
      await addTestImages(3);
      cm.reorderImages(0, 2);
      expect(cm.images[0].filename).toBe('image1.png');
      expect(cm.images[1].filename).toBe('image2.png');
      expect(cm.images[2].filename).toBe('image0.png');
    });

    it('reorderImages with same index does nothing', async () => {
      await addTestImages(3);
      cm.reorderImages(1, 1);
      expect(cm.images[0].filename).toBe('image0.png');
      expect(cm.images[1].filename).toBe('image1.png');
      expect(cm.images[2].filename).toBe('image2.png');
    });

    it('reorderImages with out-of-range index does nothing', async () => {
      await addTestImages(2);
      cm.reorderImages(-1, 0);
      cm.reorderImages(0, 5);
      expect(cm.images.length).toBe(2);
    });

    it('toggleVisibility flips visible state', async () => {
      await addTestImages(1);
      expect(cm.images[0].visible).toBe(true);
      cm.toggleVisibility(0);
      expect(cm.images[0].visible).toBe(false);
      cm.toggleVisibility(0);
      expect(cm.images[0].visible).toBe(true);
    });

    it('toggleLock flips locked state', async () => {
      await addTestImages(1);
      expect(cm.images[0].locked).toBe(false);
      cm.toggleLock(0);
      expect(cm.images[0].locked).toBe(true);
      cm.toggleLock(0);
      expect(cm.images[0].locked).toBe(false);
    });

    it('clearAll removes all images and groups', async () => {
      await addTestImages(3);
      cm.createGroup();
      cm.clearAll();
      expect(cm.images.length).toBe(0);
      expect(cm.groups.length).toBe(0);
      expect(cm.getGroupCounter()).toBe(0);
    });
  });

  describe('guidelines and marks', () => {
    it('outline is visible by default', () => {
      expect(cm.getOutlineVisible()).toBe(true);
    });

    it('center lines are hidden by default', () => {
      expect(cm.getCenterLinesVisible()).toBe(false);
    });

    it('setOutlineVisible toggles state', () => {
      cm.setOutlineVisible(false);
      expect(cm.getOutlineVisible()).toBe(false);
      cm.setOutlineVisible(true);
      expect(cm.getOutlineVisible()).toBe(true);
    });

    it('setCenterLinesVisible toggles state', () => {
      cm.setCenterLinesVisible(true);
      expect(cm.getCenterLinesVisible()).toBe(true);
      cm.setCenterLinesVisible(false);
      expect(cm.getCenterLinesVisible()).toBe(false);
    });

    it('setCalibrationVisible toggles state', () => {
      expect(cm.getCalibrationVisible()).toBe(false);
      cm.setCalibrationVisible(true);
      expect(cm.getCalibrationVisible()).toBe(true);
      cm.setCalibrationVisible(false);
      expect(cm.getCalibrationVisible()).toBe(false);
    });

    it('design rulers are hidden by default', () => {
      expect(cm.getDesignRulerVisible()).toBe(false);
    });

    it('setDesignRulerVisible toggles state', () => {
      cm.setDesignRulerVisible(true);
      expect(cm.getDesignRulerVisible()).toBe(true);
      cm.setDesignRulerVisible(false);
      expect(cm.getDesignRulerVisible()).toBe(false);
    });

    it('getBackgroundColor returns default white', () => {
      expect(cm.getBackgroundColor()).toBe('#ffffff');
    });

    it('setBackground updates color', () => {
      cm.setBackground('#000000');
      expect(cm.getBackgroundColor()).toBe('#000000');
    });
  });

  describe('restoreGroups', () => {
    it('restores groups and counter from saved state', () => {
      const groups = [
        { id: 'group-1', name: 'Restored 1', visible: true },
        { id: 'group-2', name: 'Restored 2', visible: false },
      ];
      cm.restoreGroups(groups, 5);
      expect(cm.groups.length).toBe(2);
      expect(cm.groups[0].name).toBe('Restored 1');
      expect(cm.groups[1].visible).toBe(false);
      expect(cm.getGroupCounter()).toBe(5);
    });
  });

  describe('moveGroupToPosition', () => {
    it('reorders groups in the groups array', () => {
      const g1 = cm.createGroup();
      const g2 = cm.createGroup();
      cm.moveGroupToPosition(g1, 0, g2, false);
      expect(cm.groups[0].id).toBe(g2);
      expect(cm.groups[1].id).toBe(g1);
    });

    it('handles empty group reordering', () => {
      const g1 = cm.createGroup();
      const g2 = cm.createGroup();
      const g3 = cm.createGroup();
      cm.moveGroupToPosition(g3, 0, g1, true);
      expect(cm.groups[0].id).toBe(g3);
      expect(cm.groups[1].id).toBe(g1);
      expect(cm.groups[2].id).toBe(g2);
    });
  });

  describe('setImageGroup', () => {
    it('assigns image to a group', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      const gid = cm.createGroup();
      cm.setImageGroup(0, gid);
      expect(cm.images[0].groupId).toBe(gid);
    });

    it('removes image from group with undefined', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, groupId: 'group-1',
        left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageGroup(0, undefined);
      expect(cm.images[0].groupId).toBeUndefined();
    });

    it('does nothing for invalid index', () => {
      cm.setImageGroup(-1, 'group-1');
      cm.setImageGroup(99, 'group-1');
      expect(cm.images.length).toBe(0);
    });
  });

  describe('toggleGroupVisibility', () => {
    it('toggles visibility of all images in a group', async () => {
      const gid = cm.createGroup();
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'a.png', visible: true, groupId: gid,
        left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'b.png', visible: true, groupId: gid,
        left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });

      cm.toggleGroupVisibility(gid);
      expect(cm.groups[0].visible).toBe(false);
      expect(cm.images[0].visible).toBe(false);
      expect(cm.images[1].visible).toBe(false);

      cm.toggleGroupVisibility(gid);
      expect(cm.groups[0].visible).toBe(true);
      expect(cm.images[0].visible).toBe(true);
      expect(cm.images[1].visible).toBe(true);
    });
  });

  describe('deleteGroup', () => {
    it('removes group and all its images', async () => {
      const gid = cm.createGroup();
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'a.png', visible: true, groupId: gid,
        left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'b.png', visible: true,
        left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });

      cm.deleteGroup(gid);
      expect(cm.groups.length).toBe(0);
      expect(cm.images.length).toBe(1);
      expect(cm.images[0].filename).toBe('b.png');
    });
  });

  describe('flip', () => {
    async function addAndSelect() {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectImage(0);
    }

    it('flipSelectedH toggles flipX on the active object', async () => {
      await addAndSelect();
      const fi = cm.images[0].fabricImage;
      expect(fi.flipX).toBe(false);
      cm.flipSelectedH();
      expect(fi.flipX).toBe(true);
      cm.flipSelectedH();
      expect(fi.flipX).toBe(false);
    });

    it('flipSelectedV toggles flipY on the active object', async () => {
      await addAndSelect();
      const fi = cm.images[0].fabricImage;
      expect(fi.flipY).toBe(false);
      cm.flipSelectedV();
      expect(fi.flipY).toBe(true);
      cm.flipSelectedV();
      expect(fi.flipY).toBe(false);
    });

    it('flipSelectedH does nothing without selection', () => {
      expect(() => cm.flipSelectedH()).not.toThrow();
    });

    it('flipSelectedV does nothing without selection', () => {
      expect(() => cm.flipSelectedV()).not.toThrow();
    });

    it('addImageFromDataURL respects flipX/flipY props', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'flipped.png', visible: true,
        left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
        flipX: true, flipY: true,
      });
      const fi = cm.images[0].fabricImage;
      expect(fi.flipX).toBe(true);
      expect(fi.flipY).toBe(true);
    });

    it('addImageFromDataURL defaults flipX/flipY to false', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'normal.png', visible: true,
        left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      const fi = cm.images[0].fabricImage;
      expect(fi.flipX).toBe(false);
      expect(fi.flipY).toBe(false);
    });
  });

  describe('opacity', () => {
    it('setImageOpacity sets opacity on the fabric image', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageOpacity(0, 0.5);
      expect(cm.images[0].fabricImage.opacity).toBe(0.5);
    });

    it('getImageOpacity returns the current opacity', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      expect(cm.getImageOpacity(0)).toBe(1);
      cm.setImageOpacity(0, 0.3);
      expect(cm.getImageOpacity(0)).toBeCloseTo(0.3);
    });

    it('clamps opacity to [0, 1]', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageOpacity(0, -0.5);
      expect(cm.getImageOpacity(0)).toBe(0);
      cm.setImageOpacity(0, 2.0);
      expect(cm.getImageOpacity(0)).toBe(1);
    });

    it('does nothing for invalid index', async () => {
      expect(() => cm.setImageOpacity(-1, 0.5)).not.toThrow();
      expect(() => cm.setImageOpacity(99, 0.5)).not.toThrow();
    });

    it('getImageOpacity returns 1 for invalid index', () => {
      expect(cm.getImageOpacity(-1)).toBe(1);
      expect(cm.getImageOpacity(99)).toBe(1);
    });

    it('addImageFromDataURL respects opacity prop', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'semi.png', visible: true,
        left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
        opacity: 0.7,
      });
      expect(cm.images[0].fabricImage.opacity).toBeCloseTo(0.7);
    });

    it('addImageFromDataURL defaults opacity to 1', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'full.png', visible: true,
        left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      expect(cm.images[0].fabricImage.opacity).toBe(1);
    });
  });

  describe('text layers', () => {
    it('addText creates a text layer with center alignment', () => {
      cm.addText();
      expect(cm.images.length).toBe(1);
      expect(cm.images[0].type).toBe('text');
      expect(cm.images[0].originalDataUrl).toBe('');
      const props = cm.getTextProps(0);
      expect(props!.textAlign).toBe('center');
    });

    it('addText increments text counter', () => {
      expect(cm.getTextCounter()).toBe(0);
      cm.addText();
      expect(cm.getTextCounter()).toBe(1);
      cm.addText();
      expect(cm.getTextCounter()).toBe(2);
    });

    it('addTextLayer restores a text layer with properties', () => {
      cm.addTextLayer({
        text: 'Hello',
        fontFamily: 'Georgia',
        fontSize: 60,
        fill: '#ff0000',
        fontWeight: 'bold',
        fontStyle: 'italic',
        textAlign: 'right',
        filename: 'Test Text',
        visible: true,
        locked: false,
        left: 10, top: 20, scaleX: 1.5, scaleY: 1.5, angle: 45,
        flipX: true, flipY: false, opacity: 0.7,
        width: 300,
      });
      expect(cm.images.length).toBe(1);
      expect(cm.images[0].type).toBe('text');
      expect(cm.images[0].filename).toBe('Test Text');
      const props = cm.getTextProps(0);
      expect(props).not.toBeNull();
      expect(props!.text).toBe('Hello');
      expect(props!.fontFamily).toBe('Georgia');
      expect(props!.fontSize).toBe(60);
      expect(props!.fill).toBe('#ff0000');
      expect(props!.fontWeight).toBe('bold');
      expect(props!.fontStyle).toBe('italic');
      expect(props!.textAlign).toBe('right');
    });

    it('getSelectedType returns text for text layer', () => {
      cm.addText();
      cm.selectImage(0);
      expect(cm.getSelectedType()).toBe('text');
    });

    it('getSelectedType returns image for image layer', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectImage(0);
      expect(cm.getSelectedType()).toBe('image');
    });

    it('getSelectedType returns null with no selection', () => {
      expect(cm.getSelectedType()).toBeNull();
    });

    it('getTextProps returns null for image layers', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      expect(cm.getTextProps(0)).toBeNull();
    });

    it('setTextProp updates text properties', () => {
      cm.addText();
      cm.setTextProp(0, { fontFamily: 'Verdana', fontSize: 80 });
      const props = cm.getTextProps(0);
      expect(props!.fontFamily).toBe('Verdana');
      expect(props!.fontSize).toBe(80);
    });

    it('setTextProp does nothing for image layers', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      expect(() => cm.setTextProp(0, { fontFamily: 'Arial' })).not.toThrow();
    });

    it('clearAll resets text counter', () => {
      cm.addText();
      cm.addText();
      expect(cm.getTextCounter()).toBe(2);
      cm.clearAll();
      expect(cm.getTextCounter()).toBe(0);
    });

    it('text layers work with visibility toggle', () => {
      cm.addText();
      expect(cm.images[0].visible).toBe(true);
      cm.toggleVisibility(0);
      expect(cm.images[0].visible).toBe(false);
    });

    it('text layers work with lock toggle', () => {
      cm.addText();
      expect(cm.images[0].locked).toBe(false);
      cm.toggleLock(0);
      expect(cm.images[0].locked).toBe(true);
    });

    it('text layers can be removed', () => {
      cm.addText();
      cm.addText();
      expect(cm.images.length).toBe(2);
      cm.removeImage(0);
      expect(cm.images.length).toBe(1);
    });

    it('addTextLayer uses provided id', () => {
      cm.addTextLayer({
        id: 'custom-text-42',
        text: 'Hello', fontFamily: 'Arial', fontSize: 40, fill: '#000', fontWeight: 'normal', fontStyle: 'normal',
        filename: 'T', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      expect(cm.images[0].id).toBe('custom-text-42');
    });
  });

  describe('onListChange callback', () => {
    it('is called on finalizeRestore', async () => {
      const spy = mock(() => {});
      cm.onListChange = spy;
      cm.finalizeRestore();
      expect(spy).toHaveBeenCalled();
    });

    it('is called on removeImage', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      const spy = mock(() => {});
      cm.onListChange = spy;
      cm.removeImage(0);
      expect(spy).toHaveBeenCalled();
    });

    it('is called on clearAll', () => {
      const spy = mock(() => {});
      cm.onListChange = spy;
      cm.clearAll();
      expect(spy).toHaveBeenCalled();
    });

    it('is called on createGroup', () => {
      const spy = mock(() => {});
      cm.onListChange = spy;
      cm.createGroup();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('z-order methods', () => {
    beforeEach(async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'a.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'b.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'c.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
    });

    it('bringForward swaps with previous item', () => {
      cm.bringForward(1);
      expect(cm.images[0].filename).toBe('b.png');
      expect(cm.images[1].filename).toBe('a.png');
    });

    it('bringForward does nothing at index 0', () => {
      cm.bringForward(0);
      expect(cm.images[0].filename).toBe('a.png');
    });

    it('sendBackward swaps with next item', () => {
      cm.sendBackward(1);
      expect(cm.images[1].filename).toBe('c.png');
      expect(cm.images[2].filename).toBe('b.png');
    });

    it('sendBackward does nothing at last index', () => {
      cm.sendBackward(2);
      expect(cm.images[2].filename).toBe('c.png');
    });

    it('bringToFront moves item to index 0', () => {
      cm.bringToFront(2);
      expect(cm.images[0].filename).toBe('c.png');
      expect(cm.images[1].filename).toBe('a.png');
      expect(cm.images[2].filename).toBe('b.png');
    });

    it('sendToBack moves item to last index', () => {
      cm.sendToBack(0);
      expect(cm.images[0].filename).toBe('b.png');
      expect(cm.images[1].filename).toBe('c.png');
      expect(cm.images[2].filename).toBe('a.png');
    });
  });

  describe('duplicateLayer', () => {
    it('duplicates an image layer', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'photo.png', visible: true, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
      });
      expect(cm.images.length).toBe(1);
      await cm.duplicateLayer(0);
      expect(cm.images.length).toBe(2);
      expect(cm.images[1].filename).toBe('photo.png');
      expect(cm.images[1].type).toBe('image');
    });

    it('duplicates a text layer', async () => {
      cm.addText();
      expect(cm.images.length).toBe(1);
      await cm.duplicateLayer(0);
      expect(cm.images.length).toBe(2);
      expect(cm.images[1].type).toBe('text');
    });

    it('offsets the duplicate position', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'photo.png', visible: true, left: 100, top: 200, scaleX: 1, scaleY: 1, angle: 0,
      });
      await cm.duplicateLayer(0);
      const origLeft = cm.images[0].fabricImage.left ?? 0;
      const dupeLeft = cm.images[1].fabricImage.left ?? 0;
      expect(dupeLeft).toBe(origLeft + 15);
    });
  });

  describe('deleteSelected', () => {
    it('removes the selected image', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'a.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectImage(0);
      cm.deleteSelected();
      expect(cm.images.length).toBe(0);
    });

    it('does nothing when nothing is selected', () => {
      expect(() => cm.deleteSelected()).not.toThrow();
    });
  });

  describe('scaleSelected', () => {
    it('scales the active object by factor', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectImage(0);
      cm.scaleSelected(2);
      expect(cm.images[0].fabricImage.scaleX).toBe(2);
      expect(cm.images[0].fabricImage.scaleY).toBe(2);
    });

    it('does nothing without selection', () => {
      expect(() => cm.scaleSelected(2)).not.toThrow();
    });
  });

  describe('nudgeSelected', () => {
    it('nudges the active object by dx/dy', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 100, top: 200, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectImage(0);
      cm.nudgeSelected(5, -3);
      expect(cm.images[0].fabricImage.left).toBe(105);
      expect(cm.images[0].fabricImage.top).toBe(197);
    });

    it('does nothing without selection', () => {
      expect(() => cm.nudgeSelected(1, 1)).not.toThrow();
    });
  });

  describe('rotation', () => {
    it('setRotation sets angle on active object', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectImage(0);
      cm.setRotation(45);
      expect(cm.images[0].fabricImage.angle).toBe(45);
    });

    it('setRotation does nothing without selection', () => {
      expect(() => cm.setRotation(90)).not.toThrow();
    });

    it('getRotation returns active object angle', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 30,
      });
      cm.selectImage(0);
      expect(cm.getRotation()).toBe(30);
    });

    it('getRotation returns 0 without selection', () => {
      expect(cm.getRotation()).toBe(0);
    });
  });

  describe('mark color', () => {
    it('setMarkColor updates divider and cutting marks', () => {
      cm.setMarkColor('#00ff00');
      expect(cm.getMarkColor()).toBe('#00ff00');
    });

    it('getMarkColor returns the current color', () => {
      const color = cm.getMarkColor();
      expect(typeof color).toBe('string');
    });
  });

  describe('requestRenderAll', () => {
    it('delegates to canvas.requestRenderAll', () => {
      expect(() => cm.requestRenderAll()).not.toThrow();
    });
  });

  describe('exportImageDataUrl', () => {
    it('returns a data URL string', () => {
      const result = cm.exportImageDataUrl('png');
      expect(result).toContain('data:image');
    });

    it('works with jpeg format', () => {
      const result = cm.exportImageDataUrl('jpeg');
      expect(result).toContain('data:image');
    });
  });

  describe('exportImage', () => {
    it('creates a download link and clicks it', () => {
      const clickSpy = mock(() => {});
      const origCreateElement = document.createElement.bind(document);
      document.createElement = ((tag: string) => {
        const el = origCreateElement(tag);
        if (tag === 'a') {
          el.click = clickSpy;
        }
        return el;
      }) as typeof document.createElement;

      cm.exportImage('png');
      expect(clickSpy).toHaveBeenCalled();

      document.createElement = origCreateElement;
    });

    it('uses jpg extension for jpeg format', () => {
      let downloadName = '';
      const origCreateElement = document.createElement.bind(document);
      document.createElement = ((tag: string) => {
        const el = origCreateElement(tag);
        if (tag === 'a') {
          el.click = () => {};
          const origSet = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, 'download')?.set;
          Object.defineProperty(el, 'download', {
            set(v: string) { downloadName = v; origSet?.call(el, v); },
            get() { return downloadName; },
          });
        }
        return el;
      }) as typeof document.createElement;

      cm.exportImage('jpeg');
      expect(downloadName).toContain('.jpg');

      document.createElement = origCreateElement;
    });
  });

  describe('fitToContainer', () => {
    it('sets canvas dimensions from container size', () => {
      const container = document.createElement('div');
      Object.defineProperty(container, 'clientWidth', { value: 800 });
      Object.defineProperty(container, 'clientHeight', { value: 600 });

      cm.fitToContainer(container);
      const w = cm.canvas.getWidth();
      const h = cm.canvas.getHeight();
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
    });

    it('handles tall container (height-limited)', () => {
      const container = document.createElement('div');
      Object.defineProperty(container, 'clientWidth', { value: 2000 });
      Object.defineProperty(container, 'clientHeight', { value: 300 });

      cm.fitToContainer(container);
      const h = cm.canvas.getHeight();
      expect(h).toBeLessThanOrEqual(300);
    });

    it('does nothing with zero-size container', () => {
      const container = document.createElement('div');
      Object.defineProperty(container, 'clientWidth', { value: 0 });
      Object.defineProperty(container, 'clientHeight', { value: 0 });

      const wBefore = cm.canvas.getWidth();
      cm.fitToContainer(container);
      expect(cm.canvas.getWidth()).toBe(wBefore);
    });
  });

  describe('constrainDataUrl', () => {
    it('returns small data URLs unchanged', async () => {
      const small = 'data:image/png;base64,TINY';
      const result = await CanvasManager.constrainDataUrl(small);
      expect(result).toBe(small);
    });

    it('downsizes oversized data URLs', async () => {
      const OrigImage = globalThis.Image;
      const origCreateElement = document.createElement.bind(document);

      globalThis.Image = class MockImage {
        naturalWidth = 200;
        naturalHeight = 200;
        onload: (() => void) | null = null;
        set src(_v: string) {
          setTimeout(() => this.onload?.(), 0);
        }
      } as unknown as typeof Image;

      document.createElement = ((tag: string) => {
        const el = origCreateElement(tag);
        if (tag === 'canvas') {
          const canvas = el as HTMLCanvasElement;
          canvas.getContext = (() => ({
            drawImage() {},
          })) as unknown as typeof canvas.getContext;
          canvas.toDataURL = () => 'data:image/jpeg;base64,SMALL';
        }
        return el;
      }) as typeof document.createElement;

      const huge = 'data:image/png;base64,' + 'A'.repeat(200);
      const result = await CanvasManager.constrainDataUrl(huge, 50);
      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThanOrEqual(50);

      globalThis.Image = OrigImage;
      document.createElement = origCreateElement;
    });
  });

  describe('addImage (File-based)', () => {
    it('adds an image from a File object', async () => {
      const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' });
      await cm.addImage(file);
      expect(cm.images.length).toBe(1);
      expect(cm.images[0].filename).toBe('photo.jpg');
      expect(cm.images[0].type).toBe('image');
    });
  });

  describe('selection events', () => {
    it('onSelectionChange is called on selection:created', async () => {
      const spy = mock(() => {});
      cm.onSelectionChange = spy;
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectImage(0);
      mockCanvas(cm).emit('selection:created');
      expect(spy).toHaveBeenCalled();
    });

    it('onSelectionChange is called on selection:updated', async () => {
      const spy = mock(() => {});
      cm.onSelectionChange = spy;
      mockCanvas(cm).emit('selection:updated');
      expect(spy).toHaveBeenCalled();
    });

    it('onSelectionChange is called on selection:cleared', () => {
      const spy = mock(() => {});
      cm.onSelectionChange = spy;
      mockCanvas(cm).emit('selection:cleared');
      expect(spy).toHaveBeenCalled();
    });

    it('text:editing:exited updates filename from text content', () => {
      cm.addText();
      const tb = cm.images[0].fabricImage as unknown as Record<string, unknown>;
      tb.text = 'Hello World';
      cm.canvas.setActiveObject(cm.images[0].fabricImage);

      const listSpy = mock(() => {});
      cm.onListChange = listSpy;

      mockCanvas(cm).emit('text:editing:exited');
      expect(cm.images[0].filename).toBe('Hello World');
      expect(listSpy).toHaveBeenCalled();
    });

    it('text:editing:exited truncates long text', () => {
      cm.addText();
      const tb = cm.images[0].fabricImage as unknown as Record<string, unknown>;
      tb.text = 'A'.repeat(50);
      cm.canvas.setActiveObject(cm.images[0].fabricImage);

      mockCanvas(cm).emit('text:editing:exited');
      expect(cm.images[0].filename.length).toBeLessThanOrEqual(31);
      expect(cm.images[0].filename.endsWith('…')).toBe(true);
    });

    it('text:editing:exited does nothing for non-text entries', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectImage(0);
      const origName = cm.images[0].filename;

      mockCanvas(cm).emit('text:editing:exited');
      expect(cm.images[0].filename).toBe(origName);
    });

    it('text:editing:exited does nothing when no active object', () => {
      cm.canvas.discardActiveObject();
      expect(() => mockCanvas(cm).emit('text:editing:exited')).not.toThrow();
    });

    it('text:editing:exited keeps filename if text is empty', () => {
      cm.addText();
      const tb = cm.images[0].fabricImage as unknown as Record<string, unknown>;
      tb.text = '   ';
      cm.canvas.setActiveObject(cm.images[0].fabricImage);
      const origName = cm.images[0].filename;

      mockCanvas(cm).emit('text:editing:exited');
      expect(cm.images[0].filename).toBe(origName);
    });
  });

  describe('subframe alignment', () => {
    it('getSubframeBounds returns two subframes', () => {
      const bounds = cm.getSubframeBounds();
      expect(bounds).toHaveLength(2);
      expect(bounds[0].left).toBeLessThan(bounds[1].left);
      expect(bounds[0].width).toBeGreaterThan(0);
      expect(bounds[0].height).toBeGreaterThan(0);
    });

    it('alignSelected does nothing without selection', () => {
      expect(() => cm.alignSelected('left')).not.toThrow();
    });

    describe('aligns to left subframe when object is on left side', () => {
      let sf: { left: number; top: number; width: number; height: number };

      beforeEach(async () => {
        sf = cm.getSubframeBounds()[0];
        await cm.addImageFromDataURL('data:image/png;base64,TEST', {
          filename: 'img.png', visible: true,
          left: sf.left + 10, top: sf.top + 10,
          scaleX: 0.5, scaleY: 0.5, angle: 0,
        });
        cm.selectImage(0);
      });

      it('align left', () => {
        cm.alignSelected('left');
        expect(cm.images[0].fabricImage.left).toBeCloseTo(sf.left);
      });

      it('align right', () => {
        cm.alignSelected('right');
        const objW = (cm.images[0].fabricImage.width ?? 0) * (cm.images[0].fabricImage.scaleX ?? 1);
        expect(cm.images[0].fabricImage.left).toBeCloseTo(sf.left + sf.width - objW);
      });

      it('align top', () => {
        cm.alignSelected('top');
        expect(cm.images[0].fabricImage.top).toBeCloseTo(sf.top);
      });

      it('align bottom', () => {
        cm.alignSelected('bottom');
        const objH = (cm.images[0].fabricImage.height ?? 0) * (cm.images[0].fabricImage.scaleY ?? 1);
        expect(cm.images[0].fabricImage.top).toBeCloseTo(sf.top + sf.height - objH);
      });

      it('center horizontally', () => {
        cm.alignSelected('center-h');
        const objW = (cm.images[0].fabricImage.width ?? 0) * (cm.images[0].fabricImage.scaleX ?? 1);
        expect(cm.images[0].fabricImage.left).toBeCloseTo(sf.left + (sf.width - objW) / 2);
      });

      it('center vertically', () => {
        cm.alignSelected('center-v');
        const objH = (cm.images[0].fabricImage.height ?? 0) * (cm.images[0].fabricImage.scaleY ?? 1);
        expect(cm.images[0].fabricImage.top).toBeCloseTo(sf.top + (sf.height - objH) / 2);
      });
    });

    describe('aligns to right subframe when object is on right side', () => {
      let sf: { left: number; top: number; width: number; height: number };

      beforeEach(async () => {
        sf = cm.getSubframeBounds()[1];
        await cm.addImageFromDataURL('data:image/png;base64,TEST', {
          filename: 'img.png', visible: true,
          left: sf.left + 10, top: sf.top + 10,
          scaleX: 0.5, scaleY: 0.5, angle: 0,
        });
        cm.selectImage(0);
      });

      it('align left snaps to right subframe', () => {
        cm.alignSelected('left');
        expect(cm.images[0].fabricImage.left).toBeCloseTo(sf.left);
      });

      it('center horizontally in right subframe', () => {
        cm.alignSelected('center-h');
        const objW = (cm.images[0].fabricImage.width ?? 0) * (cm.images[0].fabricImage.scaleX ?? 1);
        expect(cm.images[0].fabricImage.left).toBeCloseTo(sf.left + (sf.width - objW) / 2);
      });
    });
  });

  describe('selectAll', () => {
    it('does nothing when no images exist', () => {
      cm.selectAll();
      expect(cm.canvas.getActiveObject()).toBeNull();
    });

    it('selects single visible image', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,A', {
        filename: 'a.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.canvas.discardActiveObject();
      cm.selectAll();
      expect(cm.canvas.getActiveObject()).toBe(cm.images[0].fabricImage);
    });

    it('creates multi-selection for multiple visible images', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,A', {
        filename: 'a.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      await cm.addImageFromDataURL('data:image/png;base64,B', {
        filename: 'b.png', visible: true, left: 10, top: 10, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectAll();
      const objs = cm.canvas.getActiveObjects();
      expect(objs).toHaveLength(2);
    });

    it('skips locked and hidden images', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,A', {
        filename: 'visible.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      await cm.addImageFromDataURL('data:image/png;base64,B', {
        filename: 'hidden.png', visible: false, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      await cm.addImageFromDataURL('data:image/png;base64,C', {
        filename: 'locked.png', visible: true, locked: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectAll();
      expect(cm.canvas.getActiveObject()).toBe(cm.images[0].fabricImage);
    });
  });

  describe('serializeSelected', () => {
    it('returns null with no selection', () => {
      expect(cm.serializeSelected()).toBeNull();
    });

    it('serializes a selected image layer', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,IMG', {
        filename: 'photo.png', visible: true, left: 10, top: 20, scaleX: 0.5, scaleY: 0.8, angle: 45,
        flipX: true, flipY: false, opacity: 0.7,
      });
      cm.selectImage(0);
      const result = cm.serializeSelected();
      expect(result).not.toBeNull();
      expect(result!.type).toBe('image');
      expect(result!.filename).toBe('photo.png');
      expect(result!.left).toBe(10);
      expect(result!.top).toBe(20);
      expect(result!.scaleX).toBe(0.5);
      expect(result!.scaleY).toBe(0.8);
      expect(result!.angle).toBe(45);
      expect(result!.flipX).toBe(true);
      expect(result!.opacity).toBe(0.7);
      expect(result!.dataUrl).toBeDefined();
    });

    it('serializes a selected text layer with text properties', () => {
      cm.addTextLayer({
        text: 'Hello', fontFamily: 'Verdana', fontSize: 24, fill: '#ff0000',
        fontWeight: 'bold', fontStyle: 'italic', textAlign: 'left',
        filename: 'hello', visible: true, left: 5, top: 15,
        scaleX: 1, scaleY: 1, angle: 0, width: 300,
      });
      cm.selectImage(0);
      const result = cm.serializeSelected();
      expect(result).not.toBeNull();
      expect(result!.type).toBe('text');
      expect(result!.text).toBe('Hello');
      expect(result!.fontFamily).toBe('Verdana');
      expect(result!.fontSize).toBe(24);
      expect(result!.fill).toBe('#ff0000');
      expect(result!.fontWeight).toBe('bold');
      expect(result!.fontStyle).toBe('italic');
      expect(result!.textAlign).toBe('left');
      expect(result!.width).toBe(300);
    });
  });

  describe('serializeAllSelected', () => {
    it('returns empty array with no selection', () => {
      expect(cm.serializeAllSelected()).toEqual([]);
    });

    it('serializes a single selected image', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,A', {
        filename: 'a.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectImage(0);
      const results = cm.serializeAllSelected();
      expect(results).toHaveLength(1);
      expect(results[0].filename).toBe('a.png');
    });

    it('serializes multiple selected layers', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,A', {
        filename: 'img.png', visible: true, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.addTextLayer({
        text: 'Hi', fontFamily: 'Arial', fontSize: 40, fill: '#000',
        fontWeight: 'normal', fontStyle: 'normal',
        filename: 'text', visible: true, left: 30, top: 40,
        scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectAll();
      const results = cm.serializeAllSelected();
      expect(results).toHaveLength(2);
      const types = results.map(r => r.type).sort();
      expect(types).toEqual(['image', 'text']);
    });

    it('preserves absolute coordinates after multi-serialize', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,A', {
        filename: 'a.png', visible: true, left: 100, top: 200, scaleX: 1, scaleY: 1, angle: 0,
      });
      await cm.addImageFromDataURL('data:image/png;base64,B', {
        filename: 'b.png', visible: true, left: 300, top: 400, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectAll();
      const results = cm.serializeAllSelected();
      const aResult = results.find(r => r.filename === 'a.png')!;
      const bResult = results.find(r => r.filename === 'b.png')!;
      expect(aResult.left).toBe(100);
      expect(aResult.top).toBe(200);
      expect(bResult.left).toBe(300);
      expect(bResult.top).toBe(400);
    });
  });

  describe('addSticker', () => {
    it('adds a sticker image to the canvas', async () => {
      await cm.addSticker('data:image/svg+xml;base64,SVG', 'Grinning Face');
      expect(cm.images).toHaveLength(1);
      expect(cm.images[0].filename).toBe('Grinning Face');
      expect(cm.images[0].type).toBe('image');
      expect(cm.images[0].originalDataUrl).toBe('data:image/svg+xml;base64,SVG');
    });

    it('sets the sticker as active object', async () => {
      await cm.addSticker('data:image/svg+xml;base64,SVG', 'Star');
      const active = cm.images[0].fabricImage;
      expect(active).toBeDefined();
    });

    it('scales sticker to fit 80px target', async () => {
      await cm.addSticker('data:image/svg+xml;base64,SVG', 'Big');
      const img = cm.images[0].fabricImage;
      const targetPx = 80;
      const expectedScale = Math.min(targetPx / 100, targetPx / 100);
      expect(img.scaleX).toBe(expectedScale);
      expect(img.scaleY).toBe(expectedScale);
    });

    it('calls onListChange callback', async () => {
      const cb = mock(() => {});
      cm.onListChange = cb;
      await cm.addSticker('data:image/svg+xml;base64,SVG', 'Smile');
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('assigns a unique id', async () => {
      await cm.addSticker('data:image/svg+xml;base64,A', 'A');
      await cm.addSticker('data:image/svg+xml;base64,B', 'B');
      expect(cm.images[0].id).not.toBe(cm.images[1].id);
    });
  });

  describe('grid overlay', () => {
    it('grid is hidden by default', () => {
      expect(cm.getGridVisible()).toBe(false);
    });

    it('setGridVisible toggles state', () => {
      cm.setGridVisible(true);
      expect(cm.getGridVisible()).toBe(true);
      cm.setGridVisible(false);
      expect(cm.getGridVisible()).toBe(false);
    });

    it('grid size defaults to 5mm', () => {
      expect(cm.getGridSizeMm()).toBe(5);
    });

    it('setGridSizeMm updates grid size', () => {
      cm.setGridSizeMm(2);
      expect(cm.getGridSizeMm()).toBe(2);
    });

    it('setGridSizeMm clamps to min 1', () => {
      cm.setGridSizeMm(0);
      expect(cm.getGridSizeMm()).toBe(1);
    });

    it('setGridSizeMm clamps to max 50', () => {
      cm.setGridSizeMm(100);
      expect(cm.getGridSizeMm()).toBe(50);
    });
  });

  describe('image filters', () => {
    it('getImageFilters returns all-zero defaults for a new image', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      const f = cm.getImageFilters(0);
      expect(f).toEqual({ exposure: 0, contrast: 0, clarity: 0, vibrance: 0, saturation: 0 });
    });

    it('setImageFilters applies partial updates', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageFilters(0, { exposure: 50, contrast: -30 });
      const f = cm.getImageFilters(0);
      expect(f.exposure).toBe(50);
      expect(f.contrast).toBe(-30);
      expect(f.clarity).toBe(0);
      expect(f.vibrance).toBe(0);
      expect(f.saturation).toBe(0);
    });

    it('setImageFilters clamps values to [-100, 100]', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageFilters(0, { exposure: 200, contrast: -150 });
      const f = cm.getImageFilters(0);
      expect(f.exposure).toBe(100);
      expect(f.contrast).toBe(-100);
    });

    it('setImageFilters rebuilds fabric filters array', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageFilters(0, { exposure: 50 });
      const fi = cm.images[0].fabricImage as any;
      expect(fi.filters.length).toBeGreaterThan(0);
    });

    it('setImageFilters does nothing for invalid index', () => {
      expect(() => cm.setImageFilters(-1, { exposure: 50 })).not.toThrow();
      expect(() => cm.setImageFilters(99, { exposure: 50 })).not.toThrow();
    });

    it('getImageFilters returns all-zero for invalid index', () => {
      const f = cm.getImageFilters(-1);
      expect(f).toEqual({ exposure: 0, contrast: 0, clarity: 0, vibrance: 0, saturation: 0 });
    });

    it('setImageFilters with all zeros produces empty filters array', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageFilters(0, { exposure: 50 });
      cm.setImageFilters(0, { exposure: 0 });
      const fi = cm.images[0].fabricImage as any;
      expect(fi.filters.length).toBe(0);
    });

    it('does not apply filters to text layers', () => {
      cm.addText();
      cm.setImageFilters(0, { exposure: 50 });
      const f = cm.getImageFilters(0);
      expect(f).toEqual({ exposure: 0, contrast: 0, clarity: 0, vibrance: 0, saturation: 0 });
    });

    it('clarity with negative value creates convolute filter', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageFilters(0, { clarity: -50 });
      const fi = cm.images[0].fabricImage as any;
      expect(fi.filters.length).toBe(1);
    });

    it('all five filter types produce five fabric filters', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageFilters(0, { exposure: 10, contrast: 20, clarity: 30, vibrance: 40, saturation: 50 });
      const fi = cm.images[0].fabricImage as any;
      expect(fi.filters.length).toBe(5);
    });
  });

  describe('image effects', () => {
    it('getImageEffects returns defaults for a new image', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      const e = cm.getImageEffects(0);
      expect(e).toEqual({
        borderColor: '#ffffff', borderWidth: 0,
        shadowColor: '#000000', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
      });
    });

    it('setImageEffects applies partial updates', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { borderWidth: 10, borderColor: '#ff0000' });
      const e = cm.getImageEffects(0);
      expect(e.borderWidth).toBe(10);
      expect(e.borderColor).toBe('#ff0000');
      expect(e.shadowBlur).toBe(0);
    });

    it('setImageEffects clamps borderWidth to [0, 50]', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { borderWidth: 999 });
      expect(cm.getImageEffects(0).borderWidth).toBe(50);
      cm.setImageEffects(0, { borderWidth: -5 });
      expect(cm.getImageEffects(0).borderWidth).toBe(0);
    });

    it('setImageEffects clamps shadowBlur to [0, 50]', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { shadowBlur: 100 });
      expect(cm.getImageEffects(0).shadowBlur).toBe(50);
    });

    it('setImageEffects clamps shadowOffset to [-25, 25]', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { shadowOffsetX: 50, shadowOffsetY: -50 });
      expect(cm.getImageEffects(0).shadowOffsetX).toBe(25);
      expect(cm.getImageEffects(0).shadowOffsetY).toBe(-25);
    });

    it('setImageEffects does nothing for invalid index', () => {
      expect(() => cm.setImageEffects(-1, { borderWidth: 5 })).not.toThrow();
      expect(() => cm.setImageEffects(99, { borderWidth: 5 })).not.toThrow();
    });

    it('getImageEffects returns defaults for invalid index', () => {
      const e = cm.getImageEffects(-1);
      expect(e).toEqual({
        borderColor: '#ffffff', borderWidth: 0,
        shadowColor: '#000000', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
      });
    });

    it('setImageEffects does nothing for text layers', () => {
      cm.addText();
      cm.setImageEffects(0, { borderWidth: 10 });
      expect(cm.getImageEffects(0).borderWidth).toBe(0);
    });

    it('setImageEffects skips non-number numeric fields', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { borderWidth: undefined as any });
      expect(cm.getImageEffects(0).borderWidth).toBe(0);
    });

    it('setImageEffects with borderWidth > 0 creates _borderLayer', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { borderWidth: 5, borderColor: '#ff0000' });
      expect(cm.images[0]._borderLayer).toBeDefined();
    });

    it('setImageEffects with borderWidth 0 removes _borderLayer', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { borderWidth: 5 });
      expect(cm.images[0]._borderLayer).toBeDefined();
      cm.setImageEffects(0, { borderWidth: 0 });
      expect(cm.images[0]._borderLayer).toBeUndefined();
    });

    it('setImageEffects with shadowBlur > 0 creates _shadowLayer', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { shadowBlur: 10 });
      expect(cm.images[0]._shadowLayer).toBeDefined();
    });

    it('setImageEffects with shadowBlur 0 removes _shadowLayer', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { shadowBlur: 10 });
      expect(cm.images[0]._shadowLayer).toBeDefined();
      cm.setImageEffects(0, { shadowBlur: 0 });
      expect(cm.images[0]._shadowLayer).toBeUndefined();
    });

    it('removeImage also removes effect layers', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { borderWidth: 5, shadowBlur: 10 });
      cm.removeImage(0);
      expect(cm.images.length).toBe(0);
    });

    it('clearAll removes effect layers', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { borderWidth: 5 });
      cm.clearAll();
      expect(cm.images.length).toBe(0);
    });

    it('effect layer transforms sync on object:moving', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { borderWidth: 5 });
      const borderLayer = cm.images[0]._borderLayer as any;
      expect(borderLayer).toBeDefined();

      const img = cm.images[0].fabricImage;
      img.set({ left: 50, top: 60 });
      (cm as any).canvas.emit('object:moving', { target: img });
      expect(borderLayer.left).toBe(50 - 5 * 1);
      expect(borderLayer.top).toBe(60 - 5 * 1);
    });

    it('effect layer transforms sync on object:scaling', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 20, scaleX: 2, scaleY: 2, angle: 0,
      });
      cm.setImageEffects(0, { borderWidth: 5 });
      const borderLayer = cm.images[0]._borderLayer as any;

      const img = cm.images[0].fabricImage;
      img.set({ scaleX: 3, scaleY: 3 });
      (cm as any).canvas.emit('object:scaling', { target: img });
      expect(borderLayer.scaleX).toBe(3);
      expect(borderLayer.scaleY).toBe(3);
    });

    it('effect layer transforms sync on object:rotating', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { borderWidth: 5 });
      const borderLayer = cm.images[0]._borderLayer as any;

      const img = cm.images[0].fabricImage;
      img.set({ angle: 45 });
      (cm as any).canvas.emit('object:rotating', { target: img });
      expect(borderLayer.angle).toBe(45);
    });

    it('shadow layer has offset applied', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { shadowBlur: 10, shadowOffsetX: 5, shadowOffsetY: -3 });
      const shadowLayer = cm.images[0]._shadowLayer as any;
      expect(shadowLayer).toBeDefined();
      const totalPad = Math.ceil(10) + Math.ceil(10 * 3);
      expect(shadowLayer.left).toBe(10 - totalPad * 1 + 5);
      expect(shadowLayer.top).toBe(20 - totalPad * 1 + (-3));
    });

    it('shadow offset syncs on object:moving', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.setImageEffects(0, { shadowBlur: 10, shadowOffsetX: 5, shadowOffsetY: -3 });
      const shadowLayer = cm.images[0]._shadowLayer as any;

      const img = cm.images[0].fabricImage;
      img.set({ left: 100, top: 200 });
      (cm as any).canvas.emit('object:moving', { target: img });
      const totalPad = Math.ceil(10) + Math.ceil(10 * 3);
      expect(shadowLayer.left).toBe(100 - totalPad * 1 + 5);
      expect(shadowLayer.top).toBe(200 - totalPad * 1 + (-3));
    });

    it('syncEffectLayers ignores non-image targets', () => {
      expect(() => {
        (cm as any).canvas.emit('object:moving', { target: {} });
      }).not.toThrow();
    });

    it('syncEffectLayers ignores events with no target', () => {
      expect(() => {
        (cm as any).canvas.emit('object:moving', {});
      }).not.toThrow();
    });
  });

  describe('snap to grid', () => {
    it('snap is disabled by default', () => {
      expect(cm.getGridSnapEnabled()).toBe(false);
    });

    it('setGridSnapEnabled toggles state', () => {
      cm.setGridSnapEnabled(true);
      expect(cm.getGridSnapEnabled()).toBe(true);
      cm.setGridSnapEnabled(false);
      expect(cm.getGridSnapEnabled()).toBe(false);
    });

    it('snapToGrid returns input unchanged when snap is disabled', () => {
      cm.setGridSnapEnabled(false);
      const result = cm.snapToGrid(123, 456);
      expect(result.left).toBe(123);
      expect(result.top).toBe(456);
    });

    it('snapToGrid snaps to nearest grid point when enabled', () => {
      cm.setGridSnapEnabled(true);
      cm.setGridSizeMm(5);
      const sf = cm.getSubframeBounds()[0];
      const result = cm.snapToGrid(sf.left + 12, sf.top + 13);
      const gridPx = 5 * 0.961 * 5;
      expect(Math.abs(result.left - sf.left) % gridPx).toBeCloseTo(0, 1);
      expect(Math.abs(result.top - sf.top) % gridPx).toBeCloseTo(0, 1);
    });

    it('snapToGrid snaps to right subframe when closer', () => {
      cm.setGridSnapEnabled(true);
      cm.setGridSizeMm(10);
      const sf = cm.getSubframeBounds()[1];
      const result = cm.snapToGrid(sf.left + 3, sf.top + 3);
      expect(result.left).toBeCloseTo(sf.left, 0);
      expect(result.top).toBeCloseTo(sf.top, 0);
    });

    it('object:moving event snaps object when snap is enabled', async () => {
      cm.setGridSnapEnabled(true);
      cm.setGridSizeMm(10);
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 100, top: 200, scaleX: 1, scaleY: 1, angle: 0,
      });
      const fi = cm.images[0].fabricImage;
      fi.set({ left: 103, top: 207 });
      mockCanvas(cm).emit('object:moving', { target: fi });
      const sf = cm.getSubframeBounds()[0];
      const gridPx = 10 * 0.961 * 5;
      const offsetX = (fi.left ?? 0) - sf.left;
      const offsetY = (fi.top ?? 0) - sf.top;
      expect(Math.round(offsetX / gridPx)).toBeCloseTo(offsetX / gridPx, 1);
      expect(Math.round(offsetY / gridPx)).toBeCloseTo(offsetY / gridPx, 1);
    });

    it('object:moving event does nothing when snap is disabled', async () => {
      cm.setGridSnapEnabled(false);
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 100, top: 200, scaleX: 1, scaleY: 1, angle: 0,
      });
      const fi = cm.images[0].fabricImage;
      fi.set({ left: 103, top: 207 });
      mockCanvas(cm).emit('object:moving', { target: fi });
      expect(fi.left).toBe(103);
      expect(fi.top).toBe(207);
    });
  });

  describe('fit/fill to subframe', () => {
    it('fitSelectedToSubframe scales image to fit within closest subframe', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 10, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectImage(0);
      cm.fitSelectedToSubframe();
      const fi = cm.images[0].fabricImage;
      const sf = cm.getSubframeBounds()[0];
      const iw = fi.width ?? 1;
      const ih = fi.height ?? 1;
      const expectedScale = Math.min(sf.width / iw, sf.height / ih);
      expect(fi.scaleX).toBeCloseTo(expectedScale, 5);
      expect(fi.scaleY).toBeCloseTo(expectedScale, 5);
      const cx = (fi.left ?? 0) + iw * expectedScale / 2;
      const cy = (fi.top ?? 0) + ih * expectedScale / 2;
      const sfCx = sf.left + sf.width / 2;
      const sfCy = sf.top + sf.height / 2;
      expect(cx).toBeCloseTo(sfCx, 0);
      expect(cy).toBeCloseTo(sfCy, 0);
    });

    it('fillSelectedToSubframe scales image to cover closest subframe', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 10, top: 10, scaleX: 1, scaleY: 1, angle: 0,
      });
      cm.selectImage(0);
      cm.fillSelectedToSubframe();
      const fi = cm.images[0].fabricImage;
      const sf = cm.getSubframeBounds()[0];
      const iw = fi.width ?? 1;
      const ih = fi.height ?? 1;
      const expectedScale = Math.max(sf.width / iw, sf.height / ih);
      expect(fi.scaleX).toBeCloseTo(expectedScale, 5);
      expect(fi.scaleY).toBeCloseTo(expectedScale, 5);
    });

    it('fitSelectedToSubframe does nothing when no selection', () => {
      expect(() => cm.fitSelectedToSubframe()).not.toThrow();
    });

    it('fillSelectedToSubframe does nothing when no selection', () => {
      expect(() => cm.fillSelectedToSubframe()).not.toThrow();
    });

    it('fitSelectedToSubframe does nothing for text layers', async () => {
      cm.addText();
      cm.selectImage(0);
      const fi = cm.images[0].fabricImage;
      const origScale = fi.scaleX;
      cm.fitSelectedToSubframe();
      expect(fi.scaleX).toBe(origScale);
    });

    it('fillSelectedToSubframe does nothing for text layers', async () => {
      cm.addText();
      cm.selectImage(0);
      const fi = cm.images[0].fabricImage;
      const origScale = fi.scaleX;
      cm.fillSelectedToSubframe();
      expect(fi.scaleX).toBe(origScale);
    });
  });
});
