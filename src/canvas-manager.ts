import { Canvas, Rect, Line, FabricImage, FabricObject } from 'fabric';
import * as C from './constants';

export interface ImageEntry {
  fabricImage: FabricImage;
  filename: string;
  visible: boolean;
  groupId?: string;
}

export interface GroupEntry {
  id: string;
  name: string;
  visible: boolean;
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

  async addImage(file: File): Promise<void> {
    const url = URL.createObjectURL(file);
    try {
      const img = await FabricImage.fromURL(url);
      URL.revokeObjectURL(url);

      const iw = img.width ?? 1;
      const ih = img.height ?? 1;
      const scale = Math.min(C.CROP_W / iw, C.CROP_H / ih, 1);

      img.set({
        scaleX: scale,
        scaleY: scale,
        left: C.CROP_X + (C.CROP_W - iw * scale) / 2,
        top: C.CROP_Y + (C.CROP_H - ih * scale) / 2,
        originX: 'left',
        originY: 'top',
      });

      this._images.unshift({ fabricImage: img, filename: file.name, visible: true });
      this.canvas.add(img);
      this.rebuildZOrder();
      this.canvas.setActiveObject(img);
      this.onListChange?.();
    } catch (err) {
      URL.revokeObjectURL(url);
      console.error('Failed to load image:', err);
    }
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
    if (entry.visible) {
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

  createGroup(): string {
    this._groupCounter++;
    const id = `group-${this._groupCounter}`;
    this._groups.push({ id, name: `Group ${this._groupCounter}`, visible: true });
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

  moveGroupToPosition(groupId: string, beforeIndex: number) {
    const members: ImageEntry[] = [];
    const memberIndices: number[] = [];

    for (let i = 0; i < this._images.length; i++) {
      if (this._images[i].groupId === groupId) {
        members.push(this._images[i]);
        memberIndices.push(i);
      }
    }
    if (members.length === 0) return;

    for (let i = memberIndices.length - 1; i >= 0; i--) {
      this._images.splice(memberIndices[i], 1);
    }

    let adjusted = beforeIndex;
    for (const idx of memberIndices) {
      if (idx < beforeIndex) adjusted--;
    }
    adjusted = Math.max(0, Math.min(adjusted, this._images.length));

    this._images.splice(adjusted, 0, ...members);
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
    this.rebuildZOrder();
    this.onListChange?.();
  }

  async addImageFromDataURL(
    dataUrl: string,
    props: {
      filename: string;
      visible: boolean;
      groupId?: string;
      left: number;
      top: number;
      scaleX: number;
      scaleY: number;
      angle: number;
    },
  ): Promise<void> {
    const img = await FabricImage.fromURL(dataUrl);
    img.set({
      left: props.left,
      top: props.top,
      scaleX: props.scaleX,
      scaleY: props.scaleY,
      angle: props.angle,
      visible: props.visible,
      originX: 'left',
      originY: 'top',
    });

    this._images.push({
      fabricImage: img,
      filename: props.filename,
      visible: props.visible,
      groupId: props.groupId,
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
    link.download = `exported_image_${ts}.${ext}`;
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
  }
}
