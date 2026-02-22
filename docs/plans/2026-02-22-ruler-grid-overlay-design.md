# Ruler & Grid Overlay — Design Document

**Date**: 2026-02-22
**Feature**: #16 from suggestion2.md
**Approach**: Fabric.js canvas-rendered overlay (non-interactive objects)

---

## Scope

1. **Rename** existing calibration rulers to avoid naming collision
2. **Design rulers** — per-subframe tick marks with mm labels (top + left edges)
3. **Grid overlay** — configurable grid lines inside subframes
4. **Snap-to-grid** — objects snap to nearest grid intersection when dragged

---

## 1. Rename Calibration Rulers

The existing `buildRulers()` / `rulerObjects` / `rulerVisible` system is a calibration aid (50mm tick marks for measuring printed output), not a design ruler. Rename to avoid confusion:

| Before | After |
|---|---|
| `rulerObjects` | `calibrationObjects` |
| `rulerVisible` | `calibrationVisible` |
| `buildRulers()` | `buildCalibration()` |
| `setRulerVisible()` / `getRulerVisible()` | `setCalibrationVisible()` / `getCalibrationVisible()` |
| `rulerToggleBtn` (main.ts) | `calibrationToggleBtn` |
| `ruler-toggle-btn` (index.html) | `calibration-toggle-btn` |
| `rulerVisible` (AutoSaveSettings) | `calibrationVisible` (backward compat: read old key on load) |
| `settings.guides` (i18n) | `settings.calibrationGuides` |

---

## 2. Design Rulers (Per-Subframe)

Tick marks along the **top and left edges** of each subframe showing physical mm relative to the card origin (0 at top-left corner, up to 54mm horizontal / 85.6mm vertical).

- **Tick sizes**: small (1mm), medium (5mm), tall (10mm) — same visual language as calibration rulers
- **Numeric labels**: `0`, `10`, `20`, `30`, `40`, `50` at 10mm ticks, small `Text` objects (~7px), non-selectable/non-evented
- **Position**: just inside the top and left edges of each subframe
- **Background**: semi-transparent white strip behind ticks for readability over images
- **Color**: dark grey (`#444`)
- **Correction-aware**: uses `paperToImageX/Y` + `mmToCanvasX/Y`; rebuilt in `rebuildGuidesForCorrection()`
- **Only top + left** to avoid clutter

### State

- `designRulerObjects: FabricObject[]`
- `designRulerVisible: boolean` (default `false`)
- Builder: `buildDesignRulers()`
- API: `setDesignRulerVisible(boolean)` / `getDesignRulerVisible()`

---

## 3. Grid Overlay

Evenly spaced horizontal + vertical lines inside each subframe at the user-chosen interval.

- **Presets**: 2mm, 5mm, 10mm + custom input (min=1, max=50)
- **Style**: thin lines (`strokeWidth: 0.15 * DISPLAY_SCALE`), semi-transparent grey (`rgba(128, 128, 128, 0.3)`)
- **Clipped** to subframe bounds
- **Not exported** — hidden during `exportImageDataUrl()` like all guide elements
- **Object count**: worst case (2mm) ≈ 140 lines total, well within Fabric.js limits
- **Correction-aware**: same pipeline as rulers; rebuilt on correction change or grid size change

### State

- `gridObjects: FabricObject[]`
- `gridVisible: boolean` (default `false`)
- `gridSizeMm: number` (default `5`)
- Builder: `buildGrid()`
- API: `setGridVisible(boolean)` / `getGridVisible()` / `setGridSizeMm(number)` / `getGridSizeMm()`

---

## 4. Snap-to-Grid

When enabled, dragged objects snap to the nearest grid intersection.

- **Hook**: Fabric.js `object:moving` event
- **Logic**: round object `left`/`top` to nearest grid line position (canvas pixels)
- **Scope**: only snaps when object is inside or near a subframe; no snapping in margin areas
- **Arrow-key nudge**: unaffected (always 1px), giving users fine control with snap on
- **Snap toggle**: only visible in UI when grid is ON

### State

- `gridSnapEnabled: boolean` (default `false`)
- API: `setGridSnapEnabled(boolean)` / `getGridSnapEnabled()`

---

## 5. Z-Order

Bottom to top:

1. Background (`bgRect`)
2. Images (reversed)
3. **Grid lines** (new)
4. Calibration rulers (renamed from `rulerObjects`)
5. **Design rulers** (new)
6. Divider line
7. Cutting marks
8. Static guides
9. Outline guides
10. Center lines

---

## 6. Settings UI

Under the existing "Guidelines" section in the settings sidebar:

```
Outlines          [ON/OFF]       (existing)
Center lines      [ON/OFF]       (existing)
Rulers            [ON/OFF]       (new — design rulers)
Grid              [ON/OFF]       (new)
  Grid size       [2] [5] [10] [__] mm    (visible when Grid ON)
  Snap            [ON/OFF]                 (visible when Grid ON)
Background color  ...            (existing)
Cutting marks     ...            (existing)
Scaling           ...            (existing)
Calibration guides [ON/OFF]      (renamed from "Guides")
```

Grid size presets act as radio buttons; custom input deselects all presets.

---

## 7. Persistence

### AutoSaveSettings additions (all optional, backward compatible)

| Field | Type | Default |
|---|---|---|
| `calibrationVisible` | `boolean` | `false` |
| `designRulerVisible` | `boolean` | `false` |
| `gridVisible` | `boolean` | `false` |
| `gridSizeMm` | `number` | `5` |
| `gridSnapEnabled` | `boolean` | `false` |

Backward compat: on load, if `rulerVisible` exists but `calibrationVisible` does not, map the old key.

### Project I/O

Same fields in project settings. All optional for backward compatibility.

---

## 8. i18n

6 new keys:

| Key | English |
|---|---|
| `settings.rulers` | Rulers |
| `settings.grid` | Grid |
| `settings.gridSize` | Grid size |
| `settings.gridSnap` | Snap |
| `settings.gridCustom` | Custom |
| `settings.calibrationGuides` | Calibration guides |

---

## 9. Testing

- **Unit**: toggle grid/rulers → verify object arrays populated and visibility set
- **Unit**: snap logic → move object, verify it lands on grid point
- **Unit**: `collectState()` includes new settings fields
- **Roundtrip**: save/load project with grid settings, verify persistence
- **E2E**: toggle grid in settings sidebar, verify lines appear visually

---

## Files Changed

| File | Changes |
|---|---|
| `src/canvas-manager.ts` | Rename calibration; add grid + design ruler builders, snap logic, new API |
| `src/main.ts` | New toggle buttons, grid size selector, snap toggle; wiring to CanvasManager |
| `src/auto-save.ts` | New settings fields, backward compat mapping |
| `src/project-io.ts` | New settings fields in save/load |
| `index.html` | New UI elements in settings sidebar; rename calibration button ID |
| `src/style.css` | Grid size selector styling, conditional visibility |
| `src/locales/en.ts` | 6 new keys |
| `src/locales/fr.ts` | 6 new keys |
| `src/locales/zh.ts` | 6 new keys |
| `src/locales/hi.ts` | 6 new keys |
| `src/locales/es.ts` | 6 new keys |
| `src/locales/ar.ts` | 6 new keys |
| `tests/unit/canvas-manager.test.ts` | Grid/ruler toggle tests, snap tests |
| `tests/unit/auto-save.test.ts` | New settings fields in collectState |

No new files.
