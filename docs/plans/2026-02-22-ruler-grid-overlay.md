# Ruler & Grid Overlay Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-subframe design rulers with mm labels, a configurable snap grid inside subframes, and rename existing calibration rulers — all as Fabric.js overlay objects.

**Architecture:** Everything lives in `canvas-manager.ts` following the existing pattern (arrays of non-interactive Fabric objects, rebuilt on correction change, toggled via getter/setter pairs). New UI controls go in the settings sidebar. State persisted via `AutoSaveSettings` and `ProjectSettings`.

**Tech Stack:** TypeScript, Fabric.js v7, Vite, Bun, bun:test

---

### Task 1: Rename calibration rulers in canvas-manager.ts

**Files:**
- Modify: `src/canvas-manager.ts:37-42` (private fields)
- Modify: `src/canvas-manager.ts:228-322` (buildRulers → buildCalibration)
- Modify: `src/canvas-manager.ts:377` (rebuildGuidesForCorrection)
- Modify: `src/canvas-manager.ts:386-395` (rebuildZOrder)
- Modify: `src/canvas-manager.ts:1263-1271` (setRulerVisible/getRulerVisible)
- Modify: `src/canvas-manager.ts:1300-1317` (exportImageDataUrl)

**Step 1: Rename private fields and methods**

In `src/canvas-manager.ts`, rename:
- `rulerObjects` → `calibrationObjects`
- `rulerVisible` → `calibrationVisible`
- `buildRulers()` → `buildCalibration()`
- `setRulerVisible()` → `setCalibrationVisible()`
- `getRulerVisible()` → `getCalibrationVisible()`

Use find-and-replace within the file. Every occurrence of `rulerObjects` becomes `calibrationObjects`, every `rulerVisible` becomes `calibrationVisible`, every `buildRulers` becomes `buildCalibration`, every `setRulerVisible` becomes `setCalibrationVisible`, every `getRulerVisible` becomes `getCalibrationVisible`.

Also rename the comment `// Calibration rulers` to `// Calibration guides` for clarity.

**Step 2: Run tests to verify rename didn't break anything**

Run: `bun test tests/unit/canvas-manager.test.ts`
Expected: Tests that reference `setRulerVisible`/`getRulerVisible` will FAIL because the API changed.

**Step 3: Update canvas-manager test to use new API names**

In `tests/unit/canvas-manager.test.ts`, rename:
- `setRulerVisible` → `setCalibrationVisible`
- `getRulerVisible` → `getCalibrationVisible`

The test block at lines 359-365 becomes:

```typescript
it('setCalibrationVisible toggles state', () => {
  expect(cm.getCalibrationVisible()).toBe(false);
  cm.setCalibrationVisible(true);
  expect(cm.getCalibrationVisible()).toBe(true);
  cm.setCalibrationVisible(false);
  expect(cm.getCalibrationVisible()).toBe(false);
});
```

**Step 4: Run tests to verify**

Run: `bun test tests/unit/canvas-manager.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/canvas-manager.ts tests/unit/canvas-manager.test.ts
git commit -m "refactor: rename ruler to calibration in canvas-manager"
```

---

### Task 2: Rename calibration rulers in main.ts, index.html, auto-save, project-io, and i18n

**Files:**
- Modify: `src/main.ts` — `rulerToggleBtn` → `calibrationToggleBtn`, update references to `cm.setCalibrationVisible` / `cm.getCalibrationVisible`
- Modify: `index.html` — `ruler-toggle-btn` → `calibration-toggle-btn`
- Modify: `src/auto-save.ts:37` — `rulerVisible` → `calibrationVisible` in `AutoSaveSettings`
- Modify: `src/auto-save.ts:200` — `rulerVisible` → `calibrationVisible` in `collectState`
- Modify: `src/project-io.ts` — no change needed (project-io doesn't persist rulerVisible currently)
- Modify: `src/locales/en.ts` — rename `settings.guides` to `settings.calibrationGuides`
- Modify: `src/locales/fr.ts`, `zh.ts`, `hi.ts`, `es.ts`, `ar.ts` — same key rename
- Modify: `tests/unit/auto-save.test.ts` — rename `rulerVisible` → `calibrationVisible` in mock and assertions

**Step 1: Rename in index.html**

Change `id="ruler-toggle-btn"` to `id="calibration-toggle-btn"`.

**Step 2: Rename in main.ts**

- `rulerToggleBtn` → `calibrationToggleBtn`
- `getElementById('ruler-toggle-btn')` → `getElementById('calibration-toggle-btn')`
- `cm.getRulerVisible()` → `cm.getCalibrationVisible()`
- `cm.setRulerVisible(...)` → `cm.setCalibrationVisible(...)`
- `rulerVis` → `calVis` (in the restore section)
- `rulerVisible` → `calibrationVisible` (in settings reads)

**Step 3: Rename in auto-save.ts**

- `AutoSaveSettings.rulerVisible` → `AutoSaveSettings.calibrationVisible`
- In `collectState()`: `rulerVisible: cm.getRulerVisible()` → `calibrationVisible: cm.getCalibrationVisible()`

Add backward compat in the settings read path: in `main.ts` where settings are loaded from auto-save, check for old `rulerVisible` key if `calibrationVisible` is undefined:

```typescript
const calVis = (settings as any).calibrationVisible ?? (settings as any).rulerVisible ?? false;
```

**Step 4: Rename in i18n locales**

In `src/locales/en.ts`, change `'settings.guides': 'Guides'` to `'settings.calibrationGuides': 'Calibration guides'`.

In `index.html`, change the label `data-i18n="settings.guides"` to `data-i18n="settings.calibrationGuides"`.

For other locales, add the renamed key:
- `fr.ts`: `'settings.calibrationGuides': 'Guides de calibration'`
- `zh.ts`: `'settings.calibrationGuides': '校准标尺'`
- `hi.ts`: `'settings.calibrationGuides': 'अंशांकन गाइड'`
- `es.ts`: `'settings.calibrationGuides': 'Guías de calibración'`
- `ar.ts`: `'settings.calibrationGuides': 'أدلة المعايرة'`

Remove the old `settings.guides` key from each locale.

**Step 5: Update auto-save test**

In `tests/unit/auto-save.test.ts`:
- In `makeMockCM`: `rulerVisible` → `calibrationVisible`, `getRulerVisible` → `getCalibrationVisible`
- In assertions: `rulerVisible` → `calibrationVisible`

**Step 6: Run all tests**

Run: `bun test tests/unit/`
Expected: ALL PASS

**Step 7: Commit**

```bash
git add src/main.ts index.html src/auto-save.ts src/locales/*.ts tests/unit/auto-save.test.ts
git commit -m "refactor: rename ruler to calibration across UI, auto-save, and i18n"
```

---

### Task 3: Add design ruler state and builder to canvas-manager.ts

**Files:**
- Modify: `src/canvas-manager.ts` — add `designRulerObjects`, `designRulerVisible`, `buildDesignRulers()`, getters/setters
- Test: `tests/unit/canvas-manager.test.ts`

**Step 1: Write the failing test**

Add to `tests/unit/canvas-manager.test.ts` inside the `guidelines and marks` describe block:

```typescript
it('design rulers are hidden by default', () => {
  expect(cm.getDesignRulerVisible()).toBe(false);
});

it('setDesignRulerVisible toggles state', () => {
  cm.setDesignRulerVisible(true);
  expect(cm.getDesignRulerVisible()).toBe(true);
  cm.setDesignRulerVisible(false);
  expect(cm.getDesignRulerVisible()).toBe(false);
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/unit/canvas-manager.test.ts`
Expected: FAIL — `getDesignRulerVisible is not a function`

**Step 3: Implement design rulers in canvas-manager.ts**

Add private fields after the calibration fields (~line 42):

```typescript
// Design rulers (per-subframe mm tick marks + labels)
private designRulerObjects: FabricObject[] = [];
private designRulerVisible = false;
```

Add `buildDesignRulers()` method after `buildCalibration()`. This method draws tick marks along the top and left inside edges of each subframe with mm labels at 10mm intervals:

```typescript
private buildDesignRulers() {
  this.designRulerObjects = [];
  const S = C.DISPLAY_SCALE;
  const halfW = C.POSTCARD_WIDTH_MM / 2;
  const sfW = C.YOTO_WIDTH_MM;
  const sfH = C.YOTO_HEIGHT_MM;
  const sfLeftX = (halfW - sfW) / 2;
  const sfRightX = halfW + (halfW - sfW) / 2;
  const sfY = (C.POSTCARD_HEIGHT_MM - sfH) / 2;

  const TICK_1 = 1.0;
  const TICK_5 = 1.8;
  const TICK_10 = 2.8;
  const TW = 0.08;
  const LABEL_SIZE = 7;
  const LABEL_OFFSET = 0.5;

  const lnOpt = {
    stroke: '#444444',
    strokeWidth: TW * S,
    selectable: false as const,
    evented: false as const,
  };

  const tickLen = (mm: number) =>
    mm % 10 === 0 ? TICK_10 : mm % 5 === 0 ? TICK_5 : TICK_1;

  for (const sfX of [sfLeftX, sfRightX]) {
    const imgX = this.paperToImageX(sfX);
    const imgY = this.paperToImageY(sfY);
    const iW = sfW * this.corrX;
    const iH = sfH * this.corrY;

    // Background strips (semi-transparent white)
    // Top ruler background
    this.designRulerObjects.push(new Rect({
      left: this.mmToCanvasX(imgX),
      top: this.mmToCanvasY(imgY),
      width: iW * S,
      height: TICK_10 * S + LABEL_SIZE + 2,
      fill: 'rgba(255, 255, 255, 0.7)',
      selectable: false, evented: false,
      originX: 'left', originY: 'top',
    }));

    // Left ruler background
    this.designRulerObjects.push(new Rect({
      left: this.mmToCanvasX(imgX),
      top: this.mmToCanvasY(imgY),
      width: TICK_10 * S + LABEL_SIZE + 2,
      height: iH * S,
      fill: 'rgba(255, 255, 255, 0.7)',
      selectable: false, evented: false,
      originX: 'left', originY: 'top',
    }));

    // Top ruler ticks (horizontal, ticks grow downward from top edge)
    const hMmMax = Math.floor(sfW);
    for (let mm = 0; mm <= hMmMax; mm++) {
      const xMm = imgX + mm * this.corrX;
      const x = this.mmToCanvasX(xMm);
      const yTop = this.mmToCanvasY(imgY);
      const len = tickLen(mm) * S;
      this.designRulerObjects.push(new Line([x, yTop, x, yTop + len], lnOpt));
    }

    // Top ruler labels
    for (let mm = 0; mm <= hMmMax; mm += 10) {
      if (mm === 0) continue;
      const xMm = imgX + mm * this.corrX;
      const x = this.mmToCanvasX(xMm);
      const yTop = this.mmToCanvasY(imgY) + TICK_10 * S + LABEL_OFFSET * S;
      this.designRulerObjects.push(new Text(String(mm), {
        left: x,
        top: yTop,
        fontSize: LABEL_SIZE,
        fill: '#444444',
        fontFamily: 'sans-serif',
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'top',
      }));
    }

    // Left ruler ticks (vertical, ticks grow rightward from left edge)
    const vMmMax = Math.floor(sfH);
    for (let mm = 0; mm <= vMmMax; mm++) {
      const yMm = imgY + mm * this.corrY;
      const y = this.mmToCanvasY(yMm);
      const xLeft = this.mmToCanvasX(imgX);
      const len = tickLen(mm) * S;
      this.designRulerObjects.push(new Line([xLeft, y, xLeft + len, y], lnOpt));
    }

    // Left ruler labels
    for (let mm = 0; mm <= vMmMax; mm += 10) {
      if (mm === 0) continue;
      const yMm = imgY + mm * this.corrY;
      const y = this.mmToCanvasY(yMm);
      const xLeft = this.mmToCanvasX(imgX) + TICK_10 * S + LABEL_OFFSET * S;
      this.designRulerObjects.push(new Text(String(mm), {
        left: xLeft,
        top: y,
        fontSize: LABEL_SIZE,
        fill: '#444444',
        fontFamily: 'sans-serif',
        selectable: false,
        evented: false,
        originX: 'left',
        originY: 'center',
      }));
    }
  }

  this.designRulerObjects.forEach((o) => o.set('visible', this.designRulerVisible));
}
```

**Important:** Add `Text` to the Fabric.js import at line 1:

```typescript
import { Canvas, Rect, Line, FabricImage, FabricObject, Textbox, ActiveSelection, Text } from 'fabric';
```

Call `this.buildDesignRulers()` at the end of `buildCorrectedGuides()` (after `this.buildCalibration()`).

Add to `rebuildGuidesForCorrection()`: remove `designRulerObjects` before rebuilding.

Update `rebuildZOrder()` to include `...this.designRulerObjects` after `...this.calibrationObjects`.

Add public API:

```typescript
setDesignRulerVisible(visible: boolean) {
  this.designRulerVisible = visible;
  this.designRulerObjects.forEach((o) => o.set('visible', visible));
  this.canvas.requestRenderAll();
}

getDesignRulerVisible(): boolean {
  return this.designRulerVisible;
}
```

Hide design rulers during export in `exportImageDataUrl()`:

```typescript
this.designRulerObjects.forEach((o) => o.set('visible', false));
// ... after export ...
this.designRulerObjects.forEach((o) => o.set('visible', this.designRulerVisible));
```

**Step 4: Add `Text` to mock in test file**

In `tests/unit/canvas-manager.test.ts`, add a `MockText` class to the fabric mock:

```typescript
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
```

And add `Text: MockText` to the mock module return.

**Step 5: Run tests**

Run: `bun test tests/unit/canvas-manager.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add src/canvas-manager.ts tests/unit/canvas-manager.test.ts
git commit -m "feat: add per-subframe design rulers with mm labels"
```

---

### Task 4: Add grid state and builder to canvas-manager.ts

**Files:**
- Modify: `src/canvas-manager.ts` — add `gridObjects`, `gridVisible`, `gridSizeMm`, builders, getters/setters
- Test: `tests/unit/canvas-manager.test.ts`

**Step 1: Write the failing tests**

Add to `tests/unit/canvas-manager.test.ts`:

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/unit/canvas-manager.test.ts`
Expected: FAIL — `getGridVisible is not a function`

**Step 3: Implement grid in canvas-manager.ts**

Add private fields:

```typescript
// Grid overlay (inside subframes)
private gridObjects: FabricObject[] = [];
private gridVisible = false;
private gridSizeMm = 5;
```

Add `buildGrid()` method:

```typescript
private buildGrid() {
  this.gridObjects = [];
  const S = C.DISPLAY_SCALE;
  const halfW = C.POSTCARD_WIDTH_MM / 2;
  const sfW = C.YOTO_WIDTH_MM;
  const sfH = C.YOTO_HEIGHT_MM;
  const sfLeftX = (halfW - sfW) / 2;
  const sfRightX = halfW + (halfW - sfW) / 2;
  const sfY = (C.POSTCARD_HEIGHT_MM - sfH) / 2;
  const size = this.gridSizeMm;

  const lnOpt = {
    stroke: 'rgba(128, 128, 128, 0.3)',
    strokeWidth: 0.15 * S,
    selectable: false as const,
    evented: false as const,
  };

  for (const sfX of [sfLeftX, sfRightX]) {
    const imgX = this.paperToImageX(sfX);
    const imgY = this.paperToImageY(sfY);
    const iW = sfW * this.corrX;
    const iH = sfH * this.corrY;

    const x0 = this.mmToCanvasX(imgX);
    const y0 = this.mmToCanvasY(imgY);
    const x1 = this.mmToCanvasX(imgX + iW);
    const y1 = this.mmToCanvasY(imgY + iH);

    // Vertical lines
    for (let mm = size; mm < sfW; mm += size) {
      const x = this.mmToCanvasX(imgX + mm * this.corrX);
      this.gridObjects.push(new Line([x, y0, x, y1], lnOpt));
    }

    // Horizontal lines
    for (let mm = size; mm < sfH; mm += size) {
      const y = this.mmToCanvasY(imgY + mm * this.corrY);
      this.gridObjects.push(new Line([x0, y, x1, y], lnOpt));
    }
  }

  this.gridObjects.forEach((o) => o.set('visible', this.gridVisible));
}
```

Call `this.buildGrid()` at the end of `buildCorrectedGuides()`.

Add to `rebuildGuidesForCorrection()`: remove `gridObjects` before rebuilding.

Update `rebuildZOrder()` — insert `...this.gridObjects` after images, before `...this.calibrationObjects`:

```typescript
const ordered: FabricObject[] = [
  this.bgRect,
  ...this._images.slice().reverse().map((e) => e.fabricImage),
  ...this.gridObjects,
  ...this.calibrationObjects,
  ...this.designRulerObjects,
  this.dividerLine,
  ...this.cuttingMarks,
  ...this.staticGuides,
  ...this.guideObjects,
  ...this.guidelineObjects,
];
```

Hide grid during export in `exportImageDataUrl()`:

```typescript
this.gridObjects.forEach((o) => o.set('visible', false));
// ... after export ...
this.gridObjects.forEach((o) => o.set('visible', this.gridVisible));
```

Add public API:

```typescript
setGridVisible(visible: boolean) {
  this.gridVisible = visible;
  this.gridObjects.forEach((o) => o.set('visible', visible));
  this.canvas.requestRenderAll();
}

getGridVisible(): boolean {
  return this.gridVisible;
}

setGridSizeMm(size: number) {
  this.gridSizeMm = Math.max(1, Math.min(50, size));
  this.rebuildGuidesForCorrection();
}

getGridSizeMm(): number {
  return this.gridSizeMm;
}
```

**Step 4: Run tests**

Run: `bun test tests/unit/canvas-manager.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/canvas-manager.ts tests/unit/canvas-manager.test.ts
git commit -m "feat: add configurable grid overlay inside subframes"
```

---

### Task 5: Add snap-to-grid logic

**Files:**
- Modify: `src/canvas-manager.ts` — add snap state, `object:moving` handler
- Test: `tests/unit/canvas-manager.test.ts`

**Step 1: Write the failing tests**

```typescript
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

  it('snapToGrid returns nearest grid point', () => {
    cm.setGridSizeMm(5);
    const snapped = cm.snapToGrid(103, 207);
    // Grid at 5mm intervals = 25px intervals (5 * DISPLAY_SCALE=5)
    // 103 → 100, 207 → 200 (nearest multiples of 25 within subframe)
    expect(snapped.left % (5 * 5)).toBe(0);
    expect(snapped.top % (5 * 5)).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/unit/canvas-manager.test.ts`
Expected: FAIL

**Step 3: Implement snap logic**

Add private field:

```typescript
private gridSnapEnabled = false;
```

Add public API:

```typescript
setGridSnapEnabled(enabled: boolean) {
  this.gridSnapEnabled = enabled;
}

getGridSnapEnabled(): boolean {
  return this.gridSnapEnabled;
}
```

Add a public method `snapToGrid(left: number, top: number)` that computes the nearest grid point relative to the closest subframe:

```typescript
snapToGrid(left: number, top: number): { left: number; top: number } {
  if (!this.gridSnapEnabled) return { left, top };

  const halfW = C.POSTCARD_WIDTH_MM / 2;
  const sfW = C.YOTO_WIDTH_MM;
  const sfH = C.YOTO_HEIGHT_MM;
  const sfLeftX = (halfW - sfW) / 2;
  const sfRightX = halfW + (halfW - sfW) / 2;
  const sfY = (C.POSTCARD_HEIGHT_MM - sfH) / 2;

  const S = C.DISPLAY_SCALE;
  const gridPx = this.gridSizeMm * this.corrX * S;
  const gridPyY = this.gridSizeMm * this.corrY * S;

  // Find closest subframe origin in canvas coords
  let bestOriginX = this.mmToCanvasX(this.paperToImageX(sfLeftX));
  let bestOriginY = this.mmToCanvasY(this.paperToImageY(sfY));

  const rightOriginX = this.mmToCanvasX(this.paperToImageX(sfRightX));
  if (Math.abs(left - rightOriginX) < Math.abs(left - bestOriginX)) {
    bestOriginX = rightOriginX;
  }

  const snappedLeft = bestOriginX + Math.round((left - bestOriginX) / gridPx) * gridPx;
  const snappedTop = bestOriginY + Math.round((top - bestOriginY) / gridPyY) * gridPyY;

  return { left: snappedLeft, top: snappedTop };
}
```

Hook into `object:moving` in `setupSelectionEvents()`:

```typescript
this.canvas.on('object:moving', (e) => {
  if (!this.gridSnapEnabled) return;
  const obj = e.target;
  if (!obj) return;
  const snapped = this.snapToGrid(obj.left ?? 0, obj.top ?? 0);
  obj.set({ left: snapped.left, top: snapped.top });
});
```

**Step 4: Run tests**

Run: `bun test tests/unit/canvas-manager.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add src/canvas-manager.ts tests/unit/canvas-manager.test.ts
git commit -m "feat: add snap-to-grid logic on object:moving"
```

---

### Task 6: Add settings UI in index.html and style.css

**Files:**
- Modify: `index.html` — add ruler toggle, grid toggle, grid size selector, snap toggle
- Modify: `src/style.css` — styling for new controls

**Step 1: Add HTML controls**

In `index.html`, inside the settings panel Guidelines section (after the center-lines row, before the bg-color row), add:

```html
<div class="settings-row">
  <label data-i18n="settings.rulers">Rulers</label>
  <button id="design-ruler-btn" class="toggle-btn" data-i18n="toolbar.guidelines.off">OFF</button>
</div>
<div class="settings-row">
  <label data-i18n="settings.grid">Grid</label>
  <button id="grid-toggle-btn" class="toggle-btn" data-i18n="toolbar.guidelines.off">OFF</button>
</div>
<div id="grid-options" class="settings-subsection hidden">
  <div class="settings-row">
    <label data-i18n="settings.gridSize">Grid size</label>
    <div class="grid-size-selector">
      <button class="grid-size-btn active" data-size="2">2</button>
      <button class="grid-size-btn" data-size="5">5</button>
      <button class="grid-size-btn" data-size="10">10</button>
      <input type="number" id="grid-size-custom" min="1" max="50" step="1" placeholder="mm" class="grid-size-input" />
      <span class="grid-size-unit">mm</span>
    </div>
  </div>
  <div class="settings-row">
    <label data-i18n="settings.gridSnap">Snap</label>
    <button id="grid-snap-btn" class="toggle-btn" data-i18n="toolbar.guidelines.off">OFF</button>
  </div>
</div>
```

**Step 2: Add CSS styles**

In `src/style.css`, add:

```css
.settings-subsection {
  padding-left: 12px;
  border-left: 2px solid var(--border);
  margin-left: 8px;
}

.settings-subsection.hidden {
  display: none;
}

.grid-size-selector {
  display: flex;
  align-items: center;
  gap: 4px;
}

.grid-size-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}

.grid-size-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.grid-size-input {
  width: 40px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text);
  text-align: center;
  font-size: 12px;
  padding: 0 2px;
}

.grid-size-unit {
  font-size: 12px;
  color: var(--text-dim);
}
```

**Step 3: Commit**

```bash
git add index.html src/style.css
git commit -m "feat: add ruler and grid UI controls in settings sidebar"
```

---

### Task 7: Wire UI controls in main.ts

**Files:**
- Modify: `src/main.ts` — wire new toggle buttons and grid size selector

**Step 1: Add DOM references and event handlers**

At the top of `main.ts` (near the other button references), add:

```typescript
const designRulerBtn = document.getElementById('design-ruler-btn')!;
const gridToggleBtn = document.getElementById('grid-toggle-btn')!;
const gridOptions = document.getElementById('grid-options')!;
const gridSizeBtns = document.querySelectorAll<HTMLButtonElement>('.grid-size-btn');
const gridSizeCustom = document.getElementById('grid-size-custom') as HTMLInputElement;
const gridSnapBtn = document.getElementById('grid-snap-btn')!;
```

Add event handlers:

```typescript
// Design ruler toggle
designRulerBtn.addEventListener('click', () => {
  const nowVisible = !cm.getDesignRulerVisible();
  cm.setDesignRulerVisible(nowVisible);
  designRulerBtn.textContent = nowVisible ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
  designRulerBtn.classList.toggle('active', nowVisible);
  scheduleSave();
});

// Grid toggle
gridToggleBtn.addEventListener('click', () => {
  const nowVisible = !cm.getGridVisible();
  cm.setGridVisible(nowVisible);
  gridToggleBtn.textContent = nowVisible ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
  gridToggleBtn.classList.toggle('active', nowVisible);
  gridOptions.classList.toggle('hidden', !nowVisible);
  scheduleSave();
});

// Grid size presets
gridSizeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const size = Number(btn.dataset.size);
    cm.setGridSizeMm(size);
    gridSizeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gridSizeCustom.value = '';
    scheduleSave();
  });
});

// Grid size custom
gridSizeCustom.addEventListener('change', () => {
  const val = Number(gridSizeCustom.value);
  if (val >= 1 && val <= 50) {
    cm.setGridSizeMm(val);
    gridSizeBtns.forEach(b => b.classList.remove('active'));
    scheduleSave();
  }
});

// Grid snap toggle
gridSnapBtn.addEventListener('click', () => {
  const nowEnabled = !cm.getGridSnapEnabled();
  cm.setGridSnapEnabled(nowEnabled);
  gridSnapBtn.textContent = nowEnabled ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
  gridSnapBtn.classList.toggle('active', nowEnabled);
  scheduleSave();
});
```

**Step 2: Update applyUIState to restore new settings**

In the `applyUIState` function (or wherever settings are restored from auto-save), add:

```typescript
const designRulerVis = (settings as any).designRulerVisible ?? false;
designRulerBtn.textContent = designRulerVis ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
designRulerBtn.classList.toggle('active', designRulerVis);

const gridVis = (settings as any).gridVisible ?? false;
gridToggleBtn.textContent = gridVis ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
gridToggleBtn.classList.toggle('active', gridVis);
gridOptions.classList.toggle('hidden', !gridVis);

const gridSize = (settings as any).gridSizeMm ?? 5;
gridSizeBtns.forEach(b => b.classList.toggle('active', Number(b.dataset.size) === gridSize));
if (![2, 5, 10].includes(gridSize)) {
  gridSizeCustom.value = String(gridSize);
  gridSizeBtns.forEach(b => b.classList.remove('active'));
}

const snapEnabled = (settings as any).gridSnapEnabled ?? false;
gridSnapBtn.textContent = snapEnabled ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
gridSnapBtn.classList.toggle('active', snapEnabled);
```

Also in the auto-save restore section, call `cm.setDesignRulerVisible(designRulerVis)`, `cm.setGridVisible(gridVis)`, `cm.setGridSizeMm(gridSize)`, `cm.setGridSnapEnabled(snapEnabled)`.

**Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire ruler, grid, and snap UI controls"
```

---

### Task 8: Update auto-save and project-io persistence

**Files:**
- Modify: `src/auto-save.ts` — add new fields to `AutoSaveSettings` and `collectState()`
- Modify: `src/project-io.ts` — add new fields to `ProjectSettings` and export/import
- Test: `tests/unit/auto-save.test.ts`

**Step 1: Write failing test**

Add to `tests/unit/auto-save.test.ts` in the `collectState` describe:

```typescript
it('includes grid and ruler settings', () => {
  const cm = makeMockCM({});
  const pages = [{ images: [], groups: [], groupCounter: 0, textCounter: 0 }];
  const state = collectState(cm, pages, 0, 'png');
  expect(state.settings).toHaveProperty('designRulerVisible');
  expect(state.settings).toHaveProperty('gridVisible');
  expect(state.settings).toHaveProperty('gridSizeMm');
  expect(state.settings).toHaveProperty('gridSnapEnabled');
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/unit/auto-save.test.ts`
Expected: FAIL

**Step 3: Update AutoSaveSettings**

In `src/auto-save.ts`, add to `AutoSaveSettings`:

```typescript
designRulerVisible?: boolean;
gridVisible?: boolean;
gridSizeMm?: number;
gridSnapEnabled?: boolean;
```

Update `collectState()` to include:

```typescript
designRulerVisible: cm.getDesignRulerVisible(),
gridVisible: cm.getGridVisible(),
gridSizeMm: cm.getGridSizeMm(),
gridSnapEnabled: cm.getGridSnapEnabled(),
```

**Step 4: Update mock in test**

In `tests/unit/auto-save.test.ts`, add to `makeMockCM`:

```typescript
getDesignRulerVisible: mock(() => overrides.designRulerVisible ?? false),
getGridVisible: mock(() => overrides.gridVisible ?? false),
getGridSizeMm: mock(() => overrides.gridSizeMm ?? 5),
getGridSnapEnabled: mock(() => overrides.gridSnapEnabled ?? false),
```

And add corresponding fields to the overrides type.

**Step 5: Update project-io.ts**

In `src/project-io.ts`, add to `ProjectSettings`:

```typescript
calibrationVisible?: boolean;
designRulerVisible?: boolean;
gridVisible?: boolean;
gridSizeMm?: number;
gridSnapEnabled?: boolean;
```

In the `exportProject` function, add to both manifest settings objects:

```typescript
calibrationVisible: cm.getCalibrationVisible(),
designRulerVisible: cm.getDesignRulerVisible(),
gridVisible: cm.getGridVisible(),
gridSizeMm: cm.getGridSizeMm(),
gridSnapEnabled: cm.getGridSnapEnabled(),
```

In the `importProject` function, after restoring outline/center-lines visibility, add:

```typescript
if (manifest.settings.designRulerVisible !== undefined)
  cm.setDesignRulerVisible(manifest.settings.designRulerVisible);
if (manifest.settings.gridVisible !== undefined)
  cm.setGridVisible(manifest.settings.gridVisible);
if (manifest.settings.gridSizeMm !== undefined)
  cm.setGridSizeMm(manifest.settings.gridSizeMm);
if (manifest.settings.gridSnapEnabled !== undefined)
  cm.setGridSnapEnabled(manifest.settings.gridSnapEnabled);
if (manifest.settings.calibrationVisible !== undefined)
  cm.setCalibrationVisible(manifest.settings.calibrationVisible);
```

**Step 6: Run tests**

Run: `bun test tests/unit/`
Expected: ALL PASS

**Step 7: Commit**

```bash
git add src/auto-save.ts src/project-io.ts tests/unit/auto-save.test.ts
git commit -m "feat: persist grid and ruler settings in auto-save and project files"
```

---

### Task 9: Add i18n keys for all locales

**Files:**
- Modify: `src/locales/en.ts`
- Modify: `src/locales/fr.ts`
- Modify: `src/locales/zh.ts`
- Modify: `src/locales/hi.ts`
- Modify: `src/locales/es.ts`
- Modify: `src/locales/ar.ts`

**Step 1: Add keys to en.ts**

```typescript
'settings.rulers': 'Rulers',
'settings.grid': 'Grid',
'settings.gridSize': 'Grid size',
'settings.gridSnap': 'Snap',
'settings.gridCustom': 'Custom',
```

(Note: `settings.calibrationGuides` was already added in Task 2.)

**Step 2: Add keys to fr.ts**

```typescript
'settings.rulers': 'Règles',
'settings.grid': 'Grille',
'settings.gridSize': 'Taille de grille',
'settings.gridSnap': 'Aimanter',
'settings.gridCustom': 'Personnalisé',
```

**Step 3: Add keys to zh.ts**

```typescript
'settings.rulers': '标尺',
'settings.grid': '网格',
'settings.gridSize': '网格大小',
'settings.gridSnap': '吸附',
'settings.gridCustom': '自定义',
```

**Step 4: Add keys to hi.ts**

```typescript
'settings.rulers': 'रूलर',
'settings.grid': 'ग्रिड',
'settings.gridSize': 'ग्रिड आकार',
'settings.gridSnap': 'स्नैप',
'settings.gridCustom': 'कस्टम',
```

**Step 5: Add keys to es.ts**

```typescript
'settings.rulers': 'Reglas',
'settings.grid': 'Cuadrícula',
'settings.gridSize': 'Tamaño de cuadrícula',
'settings.gridSnap': 'Ajustar',
'settings.gridCustom': 'Personalizado',
```

**Step 6: Add keys to ar.ts**

```typescript
'settings.rulers': 'المساطر',
'settings.grid': 'الشبكة',
'settings.gridSize': 'حجم الشبكة',
'settings.gridSnap': 'محاذاة',
'settings.gridCustom': 'مخصص',
```

**Step 7: Run tests**

Run: `bun test tests/unit/i18n.test.ts`
Expected: ALL PASS (i18n tests check key consistency across locales)

**Step 8: Commit**

```bash
git add src/locales/*.ts
git commit -m "feat: add i18n keys for ruler and grid feature"
```

---

### Task 10: Run full test suite and verify

**Step 1: Run all unit and integration tests**

Run: `bun test tests/unit/ tests/integration/`
Expected: ALL PASS

**Step 2: Run lint**

Run: `bunx eslint src/ --ext .ts`
Expected: No new errors

**Step 3: Build**

Run: `bun run build`
Expected: Build succeeds

**Step 4: Manual smoke test**

Run: `bunx vite`
Open `http://localhost:5173`
Verify:
1. Settings sidebar shows Rulers, Grid toggles under Guidelines
2. Toggling Rulers ON shows tick marks with mm labels on top/left of each card
3. Toggling Grid ON shows grid lines inside each card; grid options appear
4. Changing grid size (2/5/10/custom) updates grid immediately
5. Toggling Snap ON + dragging an image → it snaps to grid points
6. Calibration guides still work (renamed toggle at bottom of section)
7. Export image → no grid/ruler lines in the exported image
8. Auto-save persists all settings on reload

**Step 5: Commit any fixes, then final commit if needed**

```bash
git add -A
git commit -m "feat: ruler and grid overlay feature complete"
```
