import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fabric', () => {
  class MockCanvas {
    renderOnAddRemove = true;
    private objects: unknown[] = [];
    private activeObject: unknown = null;
    private _width = 740;
    private _height = 500;
    private _zoom = 1;

    add(obj: unknown) { this.objects.push(obj); }
    remove(obj: unknown) {
      const i = this.objects.indexOf(obj);
      if (i >= 0) this.objects.splice(i, 1);
    }
    getObjects() { return [...this.objects]; }
    setActiveObject(obj: unknown) { this.activeObject = obj; }
    discardActiveObject() { this.activeObject = null; }
    getActiveObject() { return this.activeObject; }
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
    on() {}
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
    width = 100; height = 100; visible = true;
    selectable = true; evented = true;

    constructor(opts?: Record<string, unknown>) {
      if (opts) Object.assign(this, opts);
    }
    set(key: string | Record<string, unknown>, val?: unknown) {
      if (typeof key === 'string') (this as Record<string, unknown>)[key] = val;
      else Object.assign(this, key);
    }
    setCoords() {}
    toDataURL() { return 'data:image/png;base64,IMGDATA'; }
    static fromURL = vi.fn().mockImplementation(async () => new MockFabricImage());
  }

  return {
    Canvas: MockCanvas,
    Rect: MockRect,
    Line: MockLine,
    FabricImage: MockFabricImage,
    FabricObject: class {},
  };
});

import { CanvasManager } from '../../src/canvas-manager';

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
    it('guidelines are visible by default', () => {
      expect(cm.getGuidelinesVisible()).toBe(true);
    });

    it('setGuidelinesVisible toggles state', () => {
      cm.setGuidelinesVisible(false);
      expect(cm.getGuidelinesVisible()).toBe(false);
      cm.setGuidelinesVisible(true);
      expect(cm.getGuidelinesVisible()).toBe(true);
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

  describe('onListChange callback', () => {
    it('is called on finalizeRestore', async () => {
      const spy = vi.fn();
      cm.onListChange = spy;
      cm.finalizeRestore();
      expect(spy).toHaveBeenCalled();
    });

    it('is called on removeImage', async () => {
      await cm.addImageFromDataURL('data:image/png;base64,TEST', {
        filename: 'img.png', visible: true, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
      });
      const spy = vi.fn();
      cm.onListChange = spy;
      cm.removeImage(0);
      expect(spy).toHaveBeenCalled();
    });

    it('is called on clearAll', () => {
      const spy = vi.fn();
      cm.onListChange = spy;
      cm.clearAll();
      expect(spy).toHaveBeenCalled();
    });

    it('is called on createGroup', () => {
      const spy = vi.fn();
      cm.onListChange = spy;
      cm.createGroup();
      expect(spy).toHaveBeenCalled();
    });
  });
});
