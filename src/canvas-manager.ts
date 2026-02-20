import { Canvas, Rect, Line, FabricImage, FabricObject, Textbox } from 'fabric';
import * as C from './constants';
import { t } from './i18n';

export interface ImageEntry {
  id: string;
  type: 'image' | 'text';
  fabricImage: FabricObject;
  filename: string;
  visible: boolean;
  locked: boolean;
  groupId?: string;
  originalDataUrl: string;
}

export interface GroupEntry {
  id: string;
  name: string;
  visible: boolean;
  position?: number;
}

export class CanvasManager {
  canvas: Canvas;
  private bgRect!: Rect;

  // Exported guide elements (rebuilt when correction changes)
  private dividerLine!: Line;
  private cuttingMarks: Line[] = [];

  // Visual-only guides (rebuilt when correction changes)
  private guideObjects: FabricObject[] = [];

  // Optional guideline lines inside subframes (never exported)
  private guidelineObjects: FabricObject[] = [];
  private guidelinesVisible = true;

  // Static visual guides (dimming + crop border, never change)
  private staticGuides: FabricObject[] = [];

  private _images: ImageEntry[] = [];
  private _groups: GroupEntry[] = [];
  private _groupCounter = 0;
  private _nextImageId = 0;
  private _textCounter = 0;
  private corrX = C.DEFAULT_CORRECTION_X;
  private corrY = C.DEFAULT_CORRECTION_Y;

  onListChange: (() => void) | null = null;
  onSelectionChange: ((index: number | null) => void) | null = null;

  constructor(canvasId: string) {
    this.canvas = new Canvas(canvasId, {
      width: C.CANVAS_W,
      height: C.CANVAS_H,
      backgroundColor: 'transparent',
      selection: true,
      preserveObjectStacking: true,
    });

    this.buildBackground();
    this.buildStaticGuides();
    this.buildCorrectedGuides();
    this.rebuildZOrder();
    this.setupSelectionEvents();
  }

  // ── Coordinate helpers ──
  // Convert "desired paper position" (mm) to "image position" (mm)
  // accounting for the printer's centered borderless zoom.

  private paperToImageX(paperMm: number): number {
    return (paperMm - C.POSTCARD_WIDTH_MM / 2) * this.corrX + C.POSTCARD_WIDTH_MM / 2;
  }

  private paperToImageY(paperMm: number): number {
    return (paperMm - C.POSTCARD_HEIGHT_MM / 2) * this.corrY + C.POSTCARD_HEIGHT_MM / 2;
  }

  private mmToCanvasX(imageMm: number): number {
    return C.CROP_X + imageMm * C.DISPLAY_SCALE;
  }

  private mmToCanvasY(imageMm: number): number {
    return C.CROP_Y + imageMm * C.DISPLAY_SCALE;
  }

  // ── Background ──

  private buildBackground() {
    this.bgRect = new Rect({
      left: C.CROP_X,
      top: C.CROP_Y,
      width: C.CROP_W,
      height: C.CROP_H,
      fill: '#ffffff',
      selectable: false,
      evented: false,
      originX: 'left',
      originY: 'top',
    });
    this.canvas.add(this.bgRect);
  }

  setBackground(color: string) {
    this.bgRect.set('fill', color);
    this.canvas.requestRenderAll();
  }

  getBackgroundColor(): string {
    return (this.bgRect.fill as string) ?? '#ffffff';
  }

  // ── Static guides (none needed — canvas = crop frame) ──

  private buildStaticGuides() {
    this.staticGuides = [];
  }

  // ── Corrected guides (rebuilt when correction factors change) ──

  private buildCorrectedGuides() {
    const thickness = C.DIVIDER_THICKNESS_MM * C.DISPLAY_SCALE;
    const halfW = C.POSTCARD_WIDTH_MM / 2; // 74

    // Center divider (always at exact center — zoom is centered so this doesn't shift)
    const midX = this.mmToCanvasX(halfW);
    this.dividerLine = new Line(
      [midX, C.CROP_Y, midX, C.CROP_Y + C.CROP_H],
      { stroke: C.GUIDE_LINE_COLOR, strokeWidth: thickness, selectable: false, evented: false },
    );

    // Subframe desired paper positions (mm from crop frame origin)
    const sfLeftX = (halfW - C.YOTO_WIDTH_MM) / 2;           // 10
    const sfRightX = halfW + (halfW - C.YOTO_WIDTH_MM) / 2;  // 84
    const sfY = (C.POSTCARD_HEIGHT_MM - C.YOTO_HEIGHT_MM) / 2; // 7.2

    // Cutting marks for both subframes
    const leftMarks = this.makeCuttingMarks(sfLeftX, sfY);
    const rightMarks = this.makeCuttingMarks(sfRightX, sfY);
    this.cuttingMarks = [...leftMarks, ...rightMarks];

    // Green subframes (visual only)
    const iLeftX = this.paperToImageX(sfLeftX);
    const iRightX = this.paperToImageX(sfRightX);
    const iTopY = this.paperToImageY(sfY);
    const iW = C.YOTO_WIDTH_MM * this.corrX;
    const iH = C.YOTO_HEIGHT_MM * this.corrY;
    const iR = C.YOTO_CORNER_RADIUS_MM * Math.min(this.corrX, this.corrY);

    const sw = 1;

    const sfOpts = {
      fill: 'transparent',
      stroke: C.SUBFRAME_COLOR,
      strokeWidth: sw,
      rx: iR * C.DISPLAY_SCALE + sw,
      ry: iR * C.DISPLAY_SCALE + sw,
      selectable: false as const,
      evented: false as const,
      originX: 'left' as const,
      originY: 'top' as const,
    };

    this.guideObjects = [
      new Rect({
        left: this.mmToCanvasX(iLeftX) - sw,
        top: this.mmToCanvasY(iTopY) - sw,
        width: iW * C.DISPLAY_SCALE + sw * 2,
        height: iH * C.DISPLAY_SCALE + sw * 2,
        ...sfOpts,
      }),
      new Rect({
        left: this.mmToCanvasX(iRightX) - sw,
        top: this.mmToCanvasY(iTopY) - sw,
        width: iW * C.DISPLAY_SCALE + sw * 2,
        height: iH * C.DISPLAY_SCALE + sw * 2,
        ...sfOpts,
      }),
    ];

    // Guidelines inside subframes (optional, never exported)
    const glOpts = {
      stroke: C.SUBFRAME_COLOR,
      strokeWidth: 1,
      strokeDashArray: [6, 4],
      selectable: false as const,
      evented: false as const,
    };

    this.guidelineObjects = [];

    for (const sfX of [sfLeftX, sfRightX]) {
      const imgX = this.paperToImageX(sfX);
      const imgY = this.paperToImageY(sfY);
      const centerX = imgX + iW / 2;

      // Vertical center line
      this.guidelineObjects.push(new Line(
        [this.mmToCanvasX(centerX), this.mmToCanvasY(imgY),
         this.mmToCanvasX(centerX), this.mmToCanvasY(imgY + iH)],
        glOpts,
      ));

      // Horizontal center line
      const centerY = imgY + iH / 2;
      this.guidelineObjects.push(new Line(
        [this.mmToCanvasX(imgX), this.mmToCanvasY(centerY),
         this.mmToCanvasX(imgX + iW), this.mmToCanvasY(centerY)],
        glOpts,
      ));
    }

    this.guidelineObjects.forEach((o) => o.set('visible', this.guidelinesVisible));
  }

  private makeCuttingMarks(sfPaperX: number, sfPaperY: number): Line[] {
    const marks: Line[] = [];
    const thickness = C.MARK_THICKNESS_MM * C.DISPLAY_SCALE;
    const gap = C.MARK_GAP_MM;
    const len = C.MARK_LENGTH_MM;

    // Subframe corners in paper-space (mm)
    const corners = [
      { px: sfPaperX,                    py: sfPaperY,                     dx: -1, dy: -1 },
      { px: sfPaperX + C.YOTO_WIDTH_MM,  py: sfPaperY,                     dx:  1, dy: -1 },
      { px: sfPaperX,                    py: sfPaperY + C.YOTO_HEIGHT_MM,  dx: -1, dy:  1 },
      { px: sfPaperX + C.YOTO_WIDTH_MM,  py: sfPaperY + C.YOTO_HEIGHT_MM,  dx:  1, dy:  1 },
    ];

    for (const c of corners) {
      // Horizontal mark: same Y as corner, extending outward in X
      const hx1Paper = c.px + c.dx * gap;
      const hx2Paper = c.px + c.dx * (gap + len);
      const hYPaper = c.py;

      const hx1 = this.mmToCanvasX(this.paperToImageX(hx1Paper));
      const hx2 = this.mmToCanvasX(this.paperToImageX(hx2Paper));
      const hy = this.mmToCanvasY(this.paperToImageY(hYPaper));

      marks.push(new Line([hx1, hy, hx2, hy], {
        stroke: C.GUIDE_LINE_COLOR, strokeWidth: thickness,
        selectable: false, evented: false,
      }));

      // Vertical mark: same X as corner, extending outward in Y
      const vXPaper = c.px;
      const vy1Paper = c.py + c.dy * gap;
      const vy2Paper = c.py + c.dy * (gap + len);

      const vx = this.mmToCanvasX(this.paperToImageX(vXPaper));
      const vy1 = this.mmToCanvasY(this.paperToImageY(vy1Paper));
      const vy2 = this.mmToCanvasY(this.paperToImageY(vy2Paper));

      marks.push(new Line([vx, vy1, vx, vy2], {
        stroke: C.GUIDE_LINE_COLOR, strokeWidth: thickness,
        selectable: false, evented: false,
      }));
    }
    return marks;
  }

  // ── Rebuild corrected guides (called when user changes correction) ──

  rebuildGuidesForCorrection() {
    this.canvas.remove(this.dividerLine);
    this.cuttingMarks.forEach((m) => this.canvas.remove(m));
    this.guideObjects.forEach((o) => this.canvas.remove(o));
    this.guidelineObjects.forEach((o) => this.canvas.remove(o));

    this.buildCorrectedGuides();
    this.rebuildZOrder();
  }

  // ── Z-order management ──

  private rebuildZOrder() {
    const ordered: FabricObject[] = [
      this.bgRect,
      ...this._images.slice().reverse().map((e) => e.fabricImage),
      this.dividerLine,
      ...this.cuttingMarks,
      ...this.staticGuides,
      ...this.guideObjects,
      ...this.guidelineObjects,
    ];

    const prev = this.canvas.renderOnAddRemove;
    this.canvas.renderOnAddRemove = false;

    const existing = [...this.canvas.getObjects()];
    existing.forEach((obj) => this.canvas.remove(obj));
    ordered.forEach((obj) => this.canvas.add(obj));

    this.canvas.renderOnAddRemove = prev;
    this.canvas.requestRenderAll();
  }

  // ── Image management ──

  get images(): ReadonlyArray<ImageEntry> {
    return this._images;
  }

  private generateImageId(): string {
    return `img-${++this._nextImageId}`;
  }

  private static readonly MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  static async constrainDataUrl(
    dataUrl: string,
    maxBytes: number = CanvasManager.MAX_IMAGE_BYTES,
  ): Promise<string> {
    if (dataUrl.length <= maxBytes) return dataUrl;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        for (;;) {
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          const result = canvas.toDataURL('image/jpeg', 0.92);
          if (result.length <= maxBytes || w < 100) {
            resolve(result);
            return;
          }
          w = Math.round(w * 0.75);
          h = Math.round(h * 0.75);
        }
      };
      img.src = dataUrl;
    });
  }

  async addImage(file: File): Promise<void> {
    const blobUrl = URL.createObjectURL(file);
    let dataUrl = await CanvasManager.fileToDataURL(file);
    dataUrl = await CanvasManager.constrainDataUrl(dataUrl);
    try {
      const img = await FabricImage.fromURL(blobUrl);
      URL.revokeObjectURL(blobUrl);

      const iw = img.width ?? 1;
      const ih = img.height ?? 1;
      const scale = Math.min(C.CROP_W / iw, C.CROP_H / ih);

      img.set({
        scaleX: scale,
        scaleY: scale,
        left: C.CROP_X + (C.CROP_W - iw * scale) / 2,
        top: C.CROP_Y + (C.CROP_H - ih * scale) / 2,
        originX: 'left',
        originY: 'top',
      });

      this._images.unshift({ id: this.generateImageId(), type: 'image', fabricImage: img, filename: file.name, visible: true, locked: false, originalDataUrl: dataUrl });
      this.canvas.add(img);
      this.rebuildZOrder();
      this.canvas.setActiveObject(img);
      this.onListChange?.();
    } catch (err) {
      URL.revokeObjectURL(blobUrl);
      console.error('Failed to load image:', err);
    }
  }

  private static fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    if (index < 0 || index >= this._images.length) return;
    const entry = this._images[index];
    if (this.canvas.getActiveObject() === entry.fabricImage) {
      this.canvas.discardActiveObject();
    }
    this.canvas.remove(entry.fabricImage);
    this._images.splice(index, 1);
    this.rebuildZOrder();
    this.onListChange?.();
  }

  deleteSelected() {
    const idx = this.getSelectedIndex();
    if (idx >= 0) this.removeImage(idx);
  }

  scaleSelected(factor: number) {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    const sx = (active.scaleX ?? 1) * factor;
    const sy = (active.scaleY ?? 1) * factor;
    active.set({ scaleX: sx, scaleY: sy });
    active.setCoords();
    this.canvas.requestRenderAll();
  }

  nudgeSelected(dx: number, dy: number) {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set({ left: (active.left ?? 0) + dx, top: (active.top ?? 0) + dy });
    active.setCoords();
    this.canvas.requestRenderAll();
  }

  toggleVisibility(index: number) {
    if (index < 0 || index >= this._images.length) return;
    const entry = this._images[index];
    entry.visible = !entry.visible;
    entry.fabricImage.set('visible', entry.visible);
    if (!entry.visible && this.canvas.getActiveObject() === entry.fabricImage) {
      this.canvas.discardActiveObject();
    }
    this.canvas.requestRenderAll();
    this.onListChange?.();
  }

  toggleLock(index: number) {
    if (index < 0 || index >= this._images.length) return;
    const entry = this._images[index];
    entry.locked = !entry.locked;
    entry.fabricImage.set({
      selectable: !entry.locked,
      evented: !entry.locked,
    });
    if (entry.locked && this.canvas.getActiveObject() === entry.fabricImage) {
      this.canvas.discardActiveObject();
    }
    this.canvas.requestRenderAll();
    this.onListChange?.();
  }

  reorderImages(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 ||
        fromIndex >= this._images.length || toIndex >= this._images.length) return;
    const [item] = this._images.splice(fromIndex, 1);
    this._images.splice(toIndex, 0, item);
    this.rebuildZOrder();
    this.onListChange?.();
  }

  selectImage(index: number) {
    if (index < 0 || index >= this._images.length) return;
    const entry = this._images[index];
    if (entry.visible && !entry.locked) {
      this.canvas.setActiveObject(entry.fabricImage);
      this.canvas.requestRenderAll();
    }
  }

  getSelectedIndex(): number {
    const active = this.canvas.getActiveObject();
    if (!active) return -1;
    return this._images.findIndex((e) => e.fabricImage === active);
  }

  // ── Group management ──

  get groups(): ReadonlyArray<GroupEntry> {
    return this._groups;
  }

  getGroupCounter(): number {
    return this._groupCounter;
  }

  createGroup(): string {
    this._groupCounter++;
    const id = `group-${this._groupCounter}`;
    this._groups.push({ id, name: t('group.defaultName', { n: this._groupCounter }), visible: true });
    this.onListChange?.();
    return id;
  }

  deleteGroup(groupId: string) {
    const indices: number[] = [];
    this._images.forEach((e, i) => { if (e.groupId === groupId) indices.push(i); });
    for (const idx of indices.reverse()) {
      const entry = this._images[idx];
      if (this.canvas.getActiveObject() === entry.fabricImage) this.canvas.discardActiveObject();
      this.canvas.remove(entry.fabricImage);
      this._images.splice(idx, 1);
    }
    this._groups = this._groups.filter(g => g.id !== groupId);
    this.rebuildZOrder();
    this.onListChange?.();
  }

  toggleGroupVisibility(groupId: string) {
    const group = this._groups.find(g => g.id === groupId);
    if (!group) return;
    group.visible = !group.visible;
    for (const entry of this._images) {
      if (entry.groupId === groupId) {
        entry.visible = group.visible;
        entry.fabricImage.set('visible', group.visible);
        if (!group.visible && this.canvas.getActiveObject() === entry.fabricImage) {
          this.canvas.discardActiveObject();
        }
      }
    }
    this.canvas.requestRenderAll();
    this.onListChange?.();
  }

  renameGroup(groupId: string, name: string) {
    const group = this._groups.find(g => g.id === groupId);
    if (group) group.name = name;
  }

  setImageGroup(imageIndex: number, groupId: string | undefined) {
    if (imageIndex < 0 || imageIndex >= this._images.length) return;
    this._images[imageIndex].groupId = groupId;
    if (groupId) this.ensureGroupContiguous(groupId);
    this.rebuildZOrder();
    this.onListChange?.();
  }

  moveGroupToPosition(groupId: string, beforeIndex: number, targetGroupId?: string, above?: boolean) {
    const group = this._groups.find(g => g.id === groupId);
    const members: ImageEntry[] = [];
    const memberIndices: number[] = [];

    for (let i = 0; i < this._images.length; i++) {
      if (this._images[i].groupId === groupId) {
        members.push(this._images[i]);
        memberIndices.push(i);
      }
    }

    if (members.length > 0) {
      for (let i = memberIndices.length - 1; i >= 0; i--) {
        this._images.splice(memberIndices[i], 1);
      }

      let adjusted = beforeIndex;
      for (const idx of memberIndices) {
        if (idx < beforeIndex) adjusted--;
      }
      adjusted = Math.max(0, Math.min(adjusted, this._images.length));
      this._images.splice(adjusted, 0, ...members);
      if (group) group.position = undefined;
    } else if (group) {
      if (targetGroupId) {
        const target = this._groups.find(g => g.id === targetGroupId);
        const targetHasMembers = this._images.some(img => img.groupId === targetGroupId);
        if (target && !targetHasMembers && target.position !== undefined) {
          group.position = target.position;
        } else {
          group.position = beforeIndex;
        }
      } else {
        group.position = beforeIndex;
      }
    }

    if (targetGroupId) {
      const srcIdx = this._groups.findIndex(g => g.id === groupId);
      const tgtIdx = this._groups.findIndex(g => g.id === targetGroupId);
      if (srcIdx !== -1 && tgtIdx !== -1 && srcIdx !== tgtIdx) {
        const [src] = this._groups.splice(srcIdx, 1);
        const newTgtIdx = this._groups.findIndex(g => g.id === targetGroupId);
        this._groups.splice(above ? newTgtIdx : newTgtIdx + 1, 0, src);
      }
    }

    this.rebuildZOrder();
    this.onListChange?.();
  }

  private ensureGroupContiguous(groupId: string) {
    const members: ImageEntry[] = [];
    const rest: ImageEntry[] = [];
    let insertPos = -1;

    for (const entry of this._images) {
      if (entry.groupId === groupId) {
        if (insertPos === -1) insertPos = rest.length;
        members.push(entry);
      } else {
        rest.push(entry);
      }
    }

    if (members.length <= 1 || insertPos === -1) return;
    rest.splice(insertPos, 0, ...members);
    this._images.length = 0;
    this._images.push(...rest);
  }

  clearAll() {
    this.canvas.discardActiveObject();
    for (const entry of this._images) {
      this.canvas.remove(entry.fabricImage);
    }
    this._images.length = 0;
    this._groups.length = 0;
    this._groupCounter = 0;
    this._textCounter = 0;
    this.rebuildZOrder();
    this.onListChange?.();
  }

  async addImageFromDataURL(
    dataUrl: string,
    props: {
      id?: string;
      filename: string;
      visible: boolean;
      locked?: boolean;
      groupId?: string;
      left: number;
      top: number;
      scaleX: number;
      scaleY: number;
      angle: number;
      flipX?: boolean;
      flipY?: boolean;
      opacity?: number;
    },
  ): Promise<void> {
    dataUrl = await CanvasManager.constrainDataUrl(dataUrl);
    const locked = props.locked ?? false;
    const img = await FabricImage.fromURL(dataUrl);
    img.set({
      left: props.left,
      top: props.top,
      scaleX: props.scaleX,
      scaleY: props.scaleY,
      angle: props.angle,
      flipX: props.flipX ?? false,
      flipY: props.flipY ?? false,
      opacity: props.opacity ?? 1,
      visible: props.visible,
      selectable: !locked,
      evented: !locked,
      originX: 'left',
      originY: 'top',
    });

    this._images.push({
      id: props.id ?? this.generateImageId(),
      type: 'image',
      fabricImage: img,
      filename: props.filename,
      visible: props.visible,
      locked,
      groupId: props.groupId,
      originalDataUrl: dataUrl,
    });
    this.canvas.add(img);
  }

  restoreGroups(groups: GroupEntry[], counter: number) {
    this._groups = groups.map(g => ({ ...g }));
    this._groupCounter = counter;
  }

  finalizeRestore() {
    this.rebuildZOrder();
    this.onListChange?.();
  }

  // ── Rotation ──

  setRotation(degrees: number) {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set('angle', degrees);
    active.setCoords();
    this.canvas.requestRenderAll();
  }

  getRotation(): number {
    const active = this.canvas.getActiveObject();
    return active ? active.angle ?? 0 : 0;
  }

  // ── Flip ──

  flipSelectedH() {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set('flipX', !active.flipX);
    active.setCoords();
    this.canvas.requestRenderAll();
  }

  flipSelectedV() {
    const active = this.canvas.getActiveObject();
    if (!active) return;
    active.set('flipY', !active.flipY);
    active.setCoords();
    this.canvas.requestRenderAll();
  }

  // ── Opacity ──

  setImageOpacity(index: number, opacity: number) {
    if (index < 0 || index >= this._images.length) return;
    const clamped = Math.max(0, Math.min(1, opacity));
    this._images[index].fabricImage.set('opacity', clamped);
    this.canvas.requestRenderAll();
  }

  getImageOpacity(index: number): number {
    if (index < 0 || index >= this._images.length) return 1;
    return this._images[index].fabricImage.opacity ?? 1;
  }

  // ── Text layers ──

  getTextCounter(): number { return this._textCounter; }
  setTextCounter(value: number) { this._textCounter = value; }

  addText(): void {
    this._textCounter++;
    const displayName = t('text.defaultName', { n: this._textCounter });
    const textContent = t('text.defaultContent');

    const tb = new Textbox(textContent, {
      fontFamily: 'Arial',
      fontSize: 40,
      fill: '#000000',
      textAlign: 'center',
      originX: 'left',
      originY: 'top',
    });

    tb.set('width', Math.ceil(tb.calcTextWidth()) + 4);
    const tbWidth = tb.width ?? 100;
    const tbHeight = tb.height ?? 50;
    tb.set({
      left: C.CROP_X + (C.CROP_W - tbWidth) / 2,
      top: C.CROP_Y + (C.CROP_H - tbHeight) / 2,
    });

    this._images.unshift({
      id: `text-${this._textCounter}`,
      type: 'text',
      fabricImage: tb,
      filename: displayName,
      visible: true,
      locked: false,
      originalDataUrl: '',
    });

    this.canvas.add(tb);
    this.rebuildZOrder();
    this.canvas.setActiveObject(tb);
    this.onListChange?.();
  }

  addTextLayer(props: {
    id?: string;
    text: string;
    fontFamily: string;
    fontSize: number;
    fill: string;
    fontWeight: string;
    fontStyle: string;
    textAlign?: string;
    filename: string;
    visible: boolean;
    locked?: boolean;
    groupId?: string;
    left: number;
    top: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    flipX?: boolean;
    flipY?: boolean;
    opacity?: number;
    width?: number;
  }): void {
    const locked = props.locked ?? false;
    const tb = new Textbox(props.text, {
      left: props.left,
      top: props.top,
      scaleX: props.scaleX,
      scaleY: props.scaleY,
      angle: props.angle,
      flipX: props.flipX ?? false,
      flipY: props.flipY ?? false,
      opacity: props.opacity ?? 1,
      visible: props.visible,
      selectable: !locked,
      evented: !locked,
      originX: 'left',
      originY: 'top',
      fontFamily: props.fontFamily,
      fontSize: props.fontSize,
      fill: props.fill,
      fontWeight: props.fontWeight as string,
      fontStyle: props.fontStyle as '' | 'normal' | 'italic' | 'oblique',
      textAlign: (props.textAlign ?? 'center') as 'left' | 'center' | 'right' | 'justify',
      width: props.width ?? 200,
    });

    this._images.push({
      id: props.id ?? `text-${++this._textCounter}`,
      type: 'text',
      fabricImage: tb,
      filename: props.filename,
      visible: props.visible,
      locked,
      groupId: props.groupId,
      originalDataUrl: '',
    });
    this.canvas.add(tb);
  }

  getSelectedType(): 'image' | 'text' | null {
    const idx = this.getSelectedIndex();
    if (idx < 0) return null;
    return this._images[idx].type;
  }

  getTextProps(index: number): { text: string; fontFamily: string; fontSize: number; fill: string; fontWeight: string; fontStyle: string; textAlign: string; width: number } | null {
    if (index < 0 || index >= this._images.length) return null;
    const entry = this._images[index];
    if (entry.type !== 'text') return null;
    const tb = entry.fabricImage as Textbox;
    return {
      text: tb.text ?? '',
      fontFamily: (tb.fontFamily as string) ?? 'Arial',
      fontSize: tb.fontSize ?? 40,
      fill: (tb.fill as string) ?? '#000000',
      fontWeight: (tb.fontWeight as string) ?? 'normal',
      fontStyle: (tb.fontStyle as string) ?? 'normal',
      textAlign: (tb.textAlign as string) ?? 'center',
      width: tb.width ?? 200,
    };
  }

  setTextProp(index: number, props: Record<string, unknown>): void {
    if (index < 0 || index >= this._images.length || this._images[index].type !== 'text') return;
    const tb = this._images[index].fabricImage as unknown as Textbox;
    tb.set(props);
    tb.initDimensions();
    tb.dirty = true;
    tb.setCoords();
    this.canvas.requestRenderAll();
  }

  requestRenderAll(): void {
    this.canvas.requestRenderAll();
  }

  // ── Cutting mark color ──

  setMarkColor(color: string) {
    this.dividerLine.set('stroke', color);
    this.cuttingMarks.forEach((m) => m.set('stroke', color));
    this.canvas.requestRenderAll();
  }

  getMarkColor(): string {
    return (this.dividerLine.stroke as string) ?? C.GUIDE_LINE_COLOR;
  }

  // ── Guidelines toggle ──

  setGuidelinesVisible(visible: boolean) {
    this.guidelinesVisible = visible;
    this.guideObjects.forEach((o) => o.set('visible', visible));
    this.guidelineObjects.forEach((o) => o.set('visible', visible));
    this.canvas.requestRenderAll();
  }

  getGuidelinesVisible(): boolean {
    return this.guidelinesVisible;
  }

  // ── Correction factors ──

  setCorrectionX(value: number) {
    this.corrX = Math.max(0.5, Math.min(1.5, value));
    this.rebuildGuidesForCorrection();
  }

  setCorrectionY(value: number) {
    this.corrY = Math.max(0.5, Math.min(1.5, value));
    this.rebuildGuidesForCorrection();
  }

  getCorrectionX(): number { return this.corrX; }
  getCorrectionY(): number { return this.corrY; }

  // ── Export ──

  exportImage(format: 'png' | 'jpeg') {
    const mult = C.PX_PER_MM / C.DISPLAY_SCALE;

    // Save display state
    const displayZoom = this.canvas.getZoom();
    const displayW = this.canvas.getWidth();
    const displayH = this.canvas.getHeight();

    // Reset to logical 1:1 so toDataURL coordinates are in object space
    this.canvas.setZoom(1);
    this.canvas.setDimensions({ width: C.CANVAS_W, height: C.CANVAS_H });

    // Hide visual-only guides
    this.guideObjects.forEach((o) => o.set('visible', false));
    this.staticGuides.forEach((o) => o.set('visible', false));
    this.guidelineObjects.forEach((o) => o.set('visible', false));

    const dataUrl = this.canvas.toDataURL({
      format,
      quality: format === 'jpeg' ? 0.92 : 1,
      left: C.CROP_X,
      top: C.CROP_Y,
      width: C.CROP_W,
      height: C.CROP_H,
      multiplier: mult,
      enableRetinaScaling: false,
    });

    // Restore guides
    this.guideObjects.forEach((o) => o.set('visible', this.guidelinesVisible));
    this.staticGuides.forEach((o) => o.set('visible', true));
    this.guidelineObjects.forEach((o) => o.set('visible', this.guidelinesVisible));

    // Restore display state
    this.canvas.setDimensions({ width: displayW, height: displayH });
    this.canvas.setZoom(displayZoom);
    this.canvas.renderAll();

    const d = new Date();
    const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
    const ext = format === 'jpeg' ? 'jpg' : 'png';

    const link = document.createElement('a');
    link.download = `selphyoto_exported_${ts}.${ext}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ── Responsive resize ──
  // Resizes the actual backing store and applies Fabric zoom so the canvas
  // renders sharply at any display size. All object coordinates stay in the
  // logical CANVAS_W × CANVAS_H space.

  fitToContainer(container: HTMLElement) {
    const pad = 16;
    const availW = container.clientWidth - pad * 2;
    const availH = container.clientHeight - pad * 2;
    if (availW <= 0 || availH <= 0) return;

    const aspect = C.CANVAS_W / C.CANVAS_H;
    let w = Math.round(availW);
    let h = Math.round(w / aspect);

    if (h > availH) {
      h = Math.round(availH);
      w = Math.round(h * aspect);
    }

    const zoom = w / C.CANVAS_W;
    this.canvas.setDimensions({ width: w, height: h });
    this.canvas.setZoom(zoom);
    this.canvas.renderAll();
  }

  // ── Selection events ──

  private setupSelectionEvents() {
    const notify = () => {
      this.onSelectionChange?.(this.getSelectedIndex());
    };
    this.canvas.on('selection:created', notify);
    this.canvas.on('selection:updated', notify);
    this.canvas.on('selection:cleared', notify);

    this.canvas.on('text:editing:exited', () => {
      const active = this.canvas.getActiveObject();
      if (!active) return;
      const entry = this._images.find(e => e.fabricImage === active);
      if (entry && entry.type === 'text') {
        const tb = active as Textbox;
        const text = (tb.text ?? '').trim();
        if (text) {
          entry.filename = text.length > 30 ? text.substring(0, 30) + '…' : text;
        }
        this.onListChange?.();
      }
    });
  }
}
