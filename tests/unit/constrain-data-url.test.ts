import { describe, it, expect, mock, beforeEach } from 'bun:test';

mock.module('fabric', () => {
  class MockCanvas {
    renderOnAddRemove = true;
    private objects: unknown[] = [];
    add(obj: unknown) { this.objects.push(obj); }
    remove(obj: unknown) {
      const i = this.objects.indexOf(obj);
      if (i >= 0) this.objects.splice(i, 1);
    }
    getObjects() { return [...this.objects]; }
    setActiveObject() {}
    discardActiveObject() {}
    getActiveObject() { return null; }
    requestRenderAll() {}
    renderAll() {}
    setDimensions() {}
    getWidth() { return 740; }
    getHeight() { return 500; }
    setZoom() {}
    getZoom() { return 1; }
    on() {}
    toDataURL() { return 'data:image/png;base64,TEST'; }
  }

  class MockRect {
    constructor(opts?: Record<string, unknown>) {
      if (opts) Object.assign(this, opts);
    }
    set(key: string | Record<string, unknown>, val?: unknown) {
      if (typeof key === 'string') (this as Record<string, unknown>)[key] = val;
      else Object.assign(this, key);
    }
  }

  class MockLine {
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
    width = 100; height = 100; visible = true;
    selectable = true; evented = true;
    set(key: string | Record<string, unknown>, val?: unknown) {
      if (typeof key === 'string') (this as Record<string, unknown>)[key] = val;
      else Object.assign(this, key);
    }
    setCoords() {}
    static fromURL = mock().mockImplementation(async () => new MockFabricImage());
  }

  class MockTextbox {
    text = ''; left = 0; top = 0; width = 200; height = 50;
    scaleX = 1; scaleY = 1; angle = 0; visible = true; selectable = true; evented = true;
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

  class MockActiveSelection {
    _objects: unknown[];
    canvas: unknown;
    constructor(objects: unknown[], opts?: Record<string, unknown>) {
      this._objects = objects;
      this.canvas = opts?.canvas;
    }
  }

  return {
    Canvas: MockCanvas,
    Rect: MockRect,
    Line: MockLine,
    FabricImage: MockFabricImage,
    FabricObject: class {},
    Textbox: MockTextbox,
    Text: MockText,
    ActiveSelection: MockActiveSelection,
  };
});

import { CanvasManager } from '../../src/canvas-manager';

describe('CanvasManager.constrainDataUrl', () => {
  beforeEach(() => {
    document.body.innerHTML = '<canvas id="test-canvas"></canvas>';
  });

  it('returns short data URLs unchanged', async () => {
    const small = 'data:image/png;base64,ABC';
    const result = await CanvasManager.constrainDataUrl(small);
    expect(result).toBe(small);
  });

  it('returns unchanged when below threshold', async () => {
    const url = 'data:image/png;base64,' + 'A'.repeat(100);
    const result = await CanvasManager.constrainDataUrl(url, 5 * 1024 * 1024);
    expect(result).toBe(url);
  });
});

describe('CanvasManager image id generation', () => {
  let cm: CanvasManager;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="test-canvas"></canvas>';
    cm = new CanvasManager('test-canvas');
  });

  it('addImageFromDataURL assigns an id to images', async () => {
    await cm.addImageFromDataURL('data:image/png;base64,TEST', {
      filename: 'test.png',
      visible: true,
      left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
    });
    expect(cm.images[0].id).toBeTruthy();
    expect(typeof cm.images[0].id).toBe('string');
  });

  it('generates unique ids for multiple images', async () => {
    for (let i = 0; i < 3; i++) {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: `img${i}.png`,
        visible: true,
        left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
    }
    const ids = cm.images.map(img => img.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(3);
  });

  it('uses provided id when restoring', async () => {
    await cm.addImageFromDataURL('data:image/png;base64,TEST', {
      id: 'custom-id-99',
      filename: 'restored.png',
      visible: true,
      left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
    });
    expect(cm.images[0].id).toBe('custom-id-99');
  });
});
