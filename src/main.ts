import './style.css';
import JSZip from 'jszip';
import { CanvasManager } from './canvas-manager';
import { LayerManager } from './layer-manager';
import { DEFAULT_CORRECTION_X, DEFAULT_CORRECTION_Y } from './constants';
import { exportProject, importProject, type ProjectSettings } from './project-io';
import { saveAutoState, loadAutoState, clearAutoState, collectState, collectPageData, saveHistoryState, loadHistoryState, clearHistoryState, type AutoSaveSettings, type AutoSaveImage } from './auto-save';
import { HistoryManager, type HistorySnapshot } from './history-manager';
import { PageManager } from './page-manager';
import { t, setLocale, getLocale, detectLocale, applyI18n, registerLocale } from './i18n';
import { populateFontSelect, loadGoogleFont, isSystemFont } from './fonts';
import { ContextMenu, ICONS, type MenuEntry } from './context-menu';
import { loadStickers, getStickers, searchStickers, fetchSvgAsDataUrl, isLoaded, STICKER_CATEGORIES, STICKER_GRID_PAGE_SIZE, type StickerCategory } from './sticker-library';

const stickerLoadPromise = loadStickers().catch((err) => {
  console.error('Failed to prefetch sticker metadata:', err);
  return [] as ReturnType<typeof getStickers>;
});
import fr from './locales/fr';
import zh from './locales/zh';
import hi from './locales/hi';
import es from './locales/es';
import ar from './locales/ar';

// ── i18n setup ──

registerLocale('fr', fr);
registerLocale('zh', zh);
registerLocale('hi', hi);
registerLocale('es', es);
registerLocale('ar', ar);
setLocale(detectLocale());

// ── Init ──

const cm = new CanvasManager('main-canvas');
const history = new HistoryManager();
const pm = new PageManager();

const corrXInput = document.getElementById('correction-x') as HTMLInputElement;
const corrYInput = document.getElementById('correction-y') as HTMLInputElement;
const calibrationToggleBtn = document.getElementById('calibration-toggle-btn')!;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const outlineBtn = document.getElementById('outline-btn')!;
const centerLinesBtn = document.getElementById('center-lines-btn')!;
const newGroupBtn = document.getElementById('new-group-btn')!;
const dupPageBtn = document.getElementById('dup-page-btn') as HTMLButtonElement;
const importBtn = document.getElementById('import-btn')!;
const clearCanvasBtn = document.getElementById('clear-canvas-btn') as HTMLButtonElement;
const saveProjectBtn = document.getElementById('save-project-btn') as HTMLButtonElement;
const loadProjectBtn = document.getElementById('load-project-btn') as HTMLButtonElement;
const projectFileInput = document.getElementById('project-file-input') as HTMLInputElement;
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
const exportDropdownBtn = document.getElementById('export-dropdown-btn') as HTMLButtonElement;
const exportMenu = document.getElementById('export-menu')!;
const toolsDropdownBtn = document.getElementById('tools-dropdown-btn') as HTMLButtonElement;
const toolsDropdownMenu = document.getElementById('tools-dropdown-menu')!;
const toolsDropdownArrow = toolsDropdownBtn.querySelector('.toolbar-dropdown-arrow')!;
const textDropdownBtn = document.getElementById('text-dropdown-btn') as HTMLButtonElement;
const textDropdownMenu = document.getElementById('text-dropdown-menu')!;
const textDropdownArrow = textDropdownBtn.querySelector('.toolbar-dropdown-arrow')!;
const stickerDropdownBtn = document.getElementById('sticker-dropdown-btn') as HTMLButtonElement;
const stickerDropdownMenu = document.getElementById('sticker-dropdown-menu')!;
const stickerDropdownArrow = stickerDropdownBtn.querySelector('.toolbar-dropdown-arrow')!;
const adjustDropdownBtn = document.getElementById('adjust-dropdown-btn') as HTMLButtonElement;
const adjustDropdownMenu = document.getElementById('adjust-dropdown-menu')!;
const adjustDropdownArrow = adjustDropdownBtn.querySelector('.toolbar-dropdown-arrow')!;

const filterExposure = document.getElementById('filter-exposure') as HTMLInputElement;
const filterContrast = document.getElementById('filter-contrast') as HTMLInputElement;
const filterClarity = document.getElementById('filter-clarity') as HTMLInputElement;
const filterVibrance = document.getElementById('filter-vibrance') as HTMLInputElement;
const filterSaturation = document.getElementById('filter-saturation') as HTMLInputElement;

const filterExposureValue = document.getElementById('filter-exposure-value')!;
const filterContrastValue = document.getElementById('filter-contrast-value')!;
const filterClarityValue = document.getElementById('filter-clarity-value')!;
const filterVibranceValue = document.getElementById('filter-vibrance-value')!;
const filterSaturationValue = document.getElementById('filter-saturation-value')!;

const filterResetBtn = document.getElementById('filter-reset-btn') as HTMLButtonElement;
const stickerSearch = document.getElementById('sticker-search') as HTMLInputElement;
const stickerCategoriesEl = document.getElementById('sticker-categories')!;
const stickerGrid = document.getElementById('sticker-grid')!;
const canvasContainer = document.getElementById('canvas-container')!;
const bgButtons = document.querySelectorAll<HTMLButtonElement>('.bg-btn');
const langSelect = document.getElementById('lang-select') as HTMLSelectElement;
const undoBtn = document.getElementById('undo-btn') as HTMLButtonElement;
const redoBtn = document.getElementById('redo-btn') as HTMLButtonElement;
const flipHBtn = document.getElementById('flip-h-btn') as HTMLButtonElement;
const flipVBtn = document.getElementById('flip-v-btn') as HTMLButtonElement;
const fitCardBtn = document.getElementById('fit-card-btn') as HTMLButtonElement;
const fillCardBtn = document.getElementById('fill-card-btn') as HTMLButtonElement;
const opacitySlider = document.getElementById('opacity-slider') as HTMLInputElement;
const opacityValue = document.getElementById('opacity-value') as HTMLSpanElement;
const sfAlignBtns = {
  left: document.getElementById('sf-align-left') as HTMLButtonElement,
  centerH: document.getElementById('sf-align-center-h') as HTMLButtonElement,
  right: document.getElementById('sf-align-right') as HTMLButtonElement,
  top: document.getElementById('sf-align-top') as HTMLButtonElement,
  centerV: document.getElementById('sf-align-center-v') as HTMLButtonElement,
  bottom: document.getElementById('sf-align-bottom') as HTMLButtonElement,
};
const addTextBtn = document.getElementById('add-text-btn') as HTMLButtonElement;
const fontSelect = document.getElementById('font-select') as HTMLSelectElement;
const fontSizeInput = document.getElementById('font-size-input') as HTMLInputElement;
const textColorInput = document.getElementById('text-color-input') as HTMLInputElement;
const boldBtn = document.getElementById('bold-btn') as HTMLButtonElement;
const italicBtn = document.getElementById('italic-btn') as HTMLButtonElement;
const alignLeftBtn = document.getElementById('align-left-btn') as HTMLButtonElement;
const alignCenterBtn = document.getElementById('align-center-btn') as HTMLButtonElement;
const alignRightBtn = document.getElementById('align-right-btn') as HTMLButtonElement;
const designRulerBtn = document.getElementById('design-ruler-btn')!;
const gridToggleBtn = document.getElementById('grid-toggle-btn')!;
const gridOptions = document.getElementById('grid-options')!;
const gridSizeBtns = document.querySelectorAll<HTMLButtonElement>('.grid-size-btn');
const gridSizeCustom = document.getElementById('grid-size-custom') as HTMLInputElement;
const gridSnapBtn = document.getElementById('grid-snap-btn')!;
const pageTabList = document.getElementById('page-tab-list')!;
const addPageBtn = document.getElementById('add-page-btn') as HTMLButtonElement;

populateFontSelect(fontSelect);

// ── Export format state ──

let exportFormat: 'png' | 'jpeg' = 'png';

// ── History (undo/redo) ──

let isRestoring = false;
let lastSnapshotTime = 0;
const COALESCE_MS = 500;

function captureSnapshot(): HistorySnapshot {
  const pageData = collectPageData(cm);
  return {
    images: pageData.images.map((img, i) => {
      const entry = cm.images[i];
      const isText = (img.type ?? 'image') === 'text';
      const key = entry?.id ?? `img-fallback-${Date.now()}-${i}`;
      if (!isText) {
        history.registerImageData(key, img.dataUrl);
      }
      return {
        type: img.type ?? 'image',
        dataKey: key,
        filename: img.filename,
        visible: img.visible,
        locked: img.locked,
        groupId: img.groupId,
        left: img.left,
        top: img.top,
        scaleX: img.scaleX,
        scaleY: img.scaleY,
        angle: img.angle,
        flipX: img.flipX,
        flipY: img.flipY,
        opacity: img.opacity,
        ...(isText ? {
          text: img.text,
          fontFamily: img.fontFamily,
          fontSize: img.fontSize,
          fill: img.fill,
          fontWeight: img.fontWeight,
          fontStyle: img.fontStyle,
          textAlign: img.textAlign,
          width: img.width,
        } : {}),
      };
    }),
    groups: pageData.groups,
    groupCounter: pageData.groupCounter,
  };
}

function pushSnapshot() {
  if (isRestoring) return;
  history.push(captureSnapshot());
  updateUndoRedoButtons();
}

function pushSnapshotCoalesced() {
  if (isRestoring) return;
  const now = Date.now();
  if (now - lastSnapshotTime < COALESCE_MS) return;
  lastSnapshotTime = now;
  pushSnapshot();
}

async function restoreFromSnapshot(snapshot: HistorySnapshot): Promise<void> {
  isRestoring = true;
  cm.clearAll();
  for (const img of snapshot.images) {
    if ((img.type ?? 'image') === 'text') {
      cm.addTextLayer({
        id: img.dataKey,
        text: img.text ?? 'Text',
        fontFamily: img.fontFamily ?? 'Arial',
        fontSize: img.fontSize ?? 40,
        fill: img.fill ?? '#000000',
        fontWeight: img.fontWeight ?? 'normal',
        fontStyle: img.fontStyle ?? 'normal',
        textAlign: img.textAlign ?? 'center',
        filename: img.filename,
        visible: img.visible,
        locked: img.locked,
        groupId: img.groupId ?? undefined,
        left: img.left,
        top: img.top,
        scaleX: img.scaleX,
        scaleY: img.scaleY,
        angle: img.angle,
        flipX: img.flipX ?? false,
        flipY: img.flipY ?? false,
        opacity: img.opacity ?? 1,
        width: img.width,
      });
      continue;
    }
    const dataUrl = history.resolveDataUrl(img.dataKey);
    if (!dataUrl) continue;
    await cm.addImageFromDataURL(dataUrl, {
      id: img.dataKey,
      filename: img.filename,
      visible: img.visible,
      locked: img.locked,
      groupId: img.groupId ?? undefined,
      left: img.left,
      top: img.top,
      scaleX: img.scaleX,
      scaleY: img.scaleY,
      angle: img.angle,
      flipX: img.flipX ?? false,
      flipY: img.flipY ?? false,
      opacity: img.opacity ?? 1,
    });
  }
  cm.restoreGroups(snapshot.groups, snapshot.groupCounter);
  cm.finalizeRestore();
  refreshLayers();
  scheduleSave();
  isRestoring = false;
}

function updateUndoRedoButtons() {
  undoBtn.disabled = !history.canUndo();
  redoBtn.disabled = !history.canRedo();
}

let historySaveTimer: ReturnType<typeof setTimeout> | null = null;
history.onDirty = () => {
  if (historySaveTimer) clearTimeout(historySaveTimer);
  historySaveTimer = setTimeout(() => {
    saveHistoryState(history.toSerializable()).catch(err =>
      console.warn('History save failed:', err)
    );
  }, 500);
};

undoBtn.addEventListener('click', async () => {
  const snapshot = history.undo(captureSnapshot());
  if (snapshot) await restoreFromSnapshot(snapshot);
  updateUndoRedoButtons();
});

redoBtn.addEventListener('click', async () => {
  const snapshot = history.redo(captureSnapshot());
  if (snapshot) await restoreFromSnapshot(snapshot);
  updateUndoRedoButtons();
});

// ── Flip & Opacity ──

flipHBtn.addEventListener('click', () => {
  pushSnapshot();
  cm.flipSelectedH();
  scheduleSave();
});

flipVBtn.addEventListener('click', () => {
  pushSnapshot();
  cm.flipSelectedV();
  scheduleSave();
});

fitCardBtn.addEventListener('click', () => {
  pushSnapshot();
  cm.fitSelectedToSubframe();
  scheduleSave();
});

fillCardBtn.addEventListener('click', () => {
  pushSnapshot();
  cm.fillSelectedToSubframe();
  scheduleSave();
});

opacitySlider.addEventListener('input', () => {
  const idx = cm.getSelectedIndex();
  if (idx < 0) return;
  const val = parseFloat(opacitySlider.value);
  cm.setImageOpacity(idx, val);
  opacityValue.textContent = `${Math.round(val * 100)}%`;
});

opacitySlider.addEventListener('change', () => {
  scheduleSave();
});

// ── Subframe alignment ──

const alignActions = [
  ['left', 'left'], ['centerH', 'center-h'], ['right', 'right'],
  ['top', 'top'], ['centerV', 'center-v'], ['bottom', 'bottom'],
] as const;

for (const [key, position] of alignActions) {
  sfAlignBtns[key].addEventListener('click', () => {
    pushSnapshot();
    cm.alignSelected(position);
    scheduleSave();
  });
}

// ── Add Text ──

addTextBtn.addEventListener('click', () => {
  pushSnapshot();
  cm.addText();
  refreshLayers();
  updateCanvasToolbar();
});

// ── Text property controls ──

fontSelect.addEventListener('change', async () => {
  const idx = cm.getSelectedIndex();
  if (idx < 0) return;
  const family = fontSelect.value;
  pushSnapshot();
  if (!isSystemFont(family)) {
    await loadGoogleFont(family);
  }
  cm.setTextProp(idx, { fontFamily: family });
  scheduleSave();
});

fontSizeInput.addEventListener('change', () => {
  const idx = cm.getSelectedIndex();
  if (idx < 0) return;
  const val = parseInt(fontSizeInput.value, 10);
  if (isNaN(val) || val < 8) return;
  pushSnapshot();
  cm.setTextProp(idx, { fontSize: val });
  scheduleSave();
});

textColorInput.addEventListener('input', () => {
  const idx = cm.getSelectedIndex();
  if (idx < 0) return;
  cm.setTextProp(idx, { fill: textColorInput.value });
});

textColorInput.addEventListener('change', () => {
  pushSnapshot();
  scheduleSave();
});

boldBtn.addEventListener('click', () => {
  const idx = cm.getSelectedIndex();
  if (idx < 0) return;
  const props = cm.getTextProps(idx);
  if (!props) return;
  pushSnapshot();
  cm.setTextProp(idx, { fontWeight: props.fontWeight === 'bold' ? 'normal' : 'bold' });
  updateCanvasToolbar();
  scheduleSave();
});

italicBtn.addEventListener('click', () => {
  const idx = cm.getSelectedIndex();
  if (idx < 0) return;
  const props = cm.getTextProps(idx);
  if (!props) return;
  pushSnapshot();
  cm.setTextProp(idx, { fontStyle: props.fontStyle === 'italic' ? 'normal' : 'italic' });
  updateCanvasToolbar();
  scheduleSave();
});

function setAlignment(align: string) {
  const idx = cm.getSelectedIndex();
  if (idx < 0) return;
  pushSnapshot();
  cm.setTextProp(idx, { textAlign: align });
  updateCanvasToolbar();
  scheduleSave();
}

alignLeftBtn.addEventListener('click', () => setAlignment('left'));
alignCenterBtn.addEventListener('click', () => setAlignment('center'));
alignRightBtn.addEventListener('click', () => setAlignment('right'));

const filterSliders = [
  { slider: filterExposure, display: filterExposureValue, key: 'exposure' as const },
  { slider: filterContrast, display: filterContrastValue, key: 'contrast' as const },
  { slider: filterClarity, display: filterClarityValue, key: 'clarity' as const },
  { slider: filterVibrance, display: filterVibranceValue, key: 'vibrance' as const },
  { slider: filterSaturation, display: filterSaturationValue, key: 'saturation' as const },
];

for (const { slider, display, key } of filterSliders) {
  slider.addEventListener('input', () => {
    const idx = cm.getSelectedIndex();
    if (idx < 0) return;
    const val = parseInt(slider.value, 10);
    cm.setImageFilters(idx, { [key]: val });
    display.textContent = val > 0 ? `+${val}` : `${val}`;
  });
  slider.addEventListener('change', () => {
    scheduleSave();
  });
}

filterResetBtn.addEventListener('click', () => {
  const idx = cm.getSelectedIndex();
  if (idx < 0) return;
  cm.setImageFilters(idx, { exposure: 0, contrast: 0, clarity: 0, vibrance: 0, saturation: 0 });
  for (const { slider, display } of filterSliders) {
    slider.value = '0';
    display.textContent = '0';
  }
  scheduleSave();
});

function updateCanvasToolbar() {
  const idx = cm.getSelectedIndex();
  const hasSelection = idx >= 0;
  const selType = hasSelection ? cm.getSelectedType() : null;
  const isText = selType === 'text';
  const isImage = selType === 'image';

  toolsDropdownBtn.disabled = !hasSelection;

  if (!hasSelection) {
    toolsDropdownMenu.classList.remove('open');
    toolsDropdownArrow.classList.remove('open');
  }

  adjustDropdownBtn.disabled = !isImage;
  if (!isImage) {
    adjustDropdownMenu.classList.remove('open');
    adjustDropdownArrow.classList.remove('open');
  }

  fontSelect.disabled = !isText;
  fontSizeInput.disabled = !isText;
  textColorInput.disabled = !isText;
  boldBtn.disabled = !isText;
  italicBtn.disabled = !isText;
  alignLeftBtn.disabled = !isText;
  alignCenterBtn.disabled = !isText;
  alignRightBtn.disabled = !isText;

  if (hasSelection) {
    const opacity = cm.getImageOpacity(idx);
    opacitySlider.value = String(opacity);
    opacityValue.textContent = `${Math.round(opacity * 100)}%`;
  } else {
    opacitySlider.value = '1';
    opacityValue.textContent = '100%';
  }

  if (isImage) {
    const f = cm.getImageFilters(idx);
    for (const { slider, display, key } of filterSliders) {
      const val = f[key];
      slider.value = `${val}`;
      display.textContent = val > 0 ? `+${val}` : `${val}`;
    }
  } else {
    for (const { slider, display } of filterSliders) {
      slider.value = '0';
      display.textContent = '0';
    }
  }

  if (isText) {
    const props = cm.getTextProps(idx);
    if (props) {
      if (!isSystemFont(props.fontFamily)) {
        loadGoogleFont(props.fontFamily).then(() => cm.requestRenderAll());
      }
      fontSelect.value = props.fontFamily;
      fontSizeInput.value = String(props.fontSize);
      textColorInput.value = props.fill;
      boldBtn.classList.toggle('active', props.fontWeight === 'bold');
      italicBtn.classList.toggle('active', props.fontStyle === 'italic');
      alignLeftBtn.classList.toggle('active', props.textAlign === 'left');
      alignCenterBtn.classList.toggle('active', props.textAlign === 'center');
      alignRightBtn.classList.toggle('active', props.textAlign === 'right');
    }
  } else {
    boldBtn.classList.remove('active');
    italicBtn.classList.remove('active');
    alignLeftBtn.classList.remove('active');
    alignCenterBtn.classList.remove('active');
    alignRightBtn.classList.remove('active');
  }
}

// ── Version display ──

const appVersionEl = document.getElementById('app-version')!;
appVersionEl.textContent = `M600 — v${__APP_VERSION__} (${__COMMIT_HASH__})`;

// ── Language selector ──

langSelect.value = getLocale();

langSelect.addEventListener('change', () => {
  setLocale(langSelect.value);
  applyI18n();
  const curTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  applyTheme(curTheme as 'dark' | 'light');
  captureButtonLabels();
  refreshLayers();
  renderPageTabs();
});

// ── Theme toggle ──

const THEME_KEY = 'selphyoto_theme';
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;

function applyTheme(theme: 'dark' | 'light') {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  themeToggle.textContent = theme === 'light' ? t('settings.themeLight') : t('settings.themeDark');
  themeToggle.classList.toggle('active', theme === 'light');
}

const savedTheme = (localStorage.getItem(THEME_KEY) as 'dark' | 'light') ?? 'dark';
applyTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
});

// ── Auto-save (debounced) ──

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSaveTime: number | null = null;
const autosaveStatusEl = document.getElementById('autosave-status')!;

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(performSave, 500);
}

function performSave() {
  saveTimer = null;
  pm.setPageBgColor(pm.currentPage, cm.getBackgroundColor());
  pm.setPageMarkColor(pm.currentPage, cm.getMarkColor());
  pm.setPageData(pm.currentPage, collectPageData(cm, cm.getBackgroundColor(), cm.getMarkColor()));
  const state = collectState(cm, pm.getAllPages(), pm.currentPage, exportFormat);
  saveAutoState(state)
    .then(() => { lastSaveTime = Date.now(); updateAutosaveDisplay(); })
    .catch(err => console.warn('Auto-save failed:', err));
}

function flushSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  performSave();
}

function updateAutosaveDisplay() {
  if (lastSaveTime === null) {
    autosaveStatusEl.textContent = t('autosave.none');
    return;
  }
  const seconds = Math.floor((Date.now() - lastSaveTime) / 1000);
  if (seconds < 5) autosaveStatusEl.textContent = t('autosave.justNow');
  else if (seconds < 60) autosaveStatusEl.textContent = t('autosave.secondsAgo', { seconds });
  else {
    const minutes = Math.floor(seconds / 60);
    autosaveStatusEl.textContent = t('autosave.minutesAgo', { minutes });
  }
}

setInterval(updateAutosaveDisplay, 1_000);

// ── Layer manager ──

const lm = new LayerManager('layer-list', 'layer-empty', {
  onToggleVisibility: (i) => {
    cm.toggleVisibility(i);
    refreshLayers();
  },
  onToggleLock: (i) => {
    cm.toggleLock(i);
    refreshLayers();
  },
  onDelete: async (i) => {
    const name = cm.images[i]?.filename ?? 'this image';
    if (!await showConfirmModal('', t('deleteImage.message', { name }))) return;
    pushSnapshot();
    cm.removeImage(i);
    refreshLayers();
  },
  onReorder: (from, to) => {
    pushSnapshot();
    cm.reorderImages(from, to);
    refreshLayers();
  },
  onSelect: (i) => {
    cm.selectImage(i);
    lm.highlightRow(i);
  },
  onRename: (i, newName) => {
    const entry = cm.images[i];
    if (entry) (entry as { filename: string }).filename = newName;
    scheduleSave();
  },
  onCreateGroup: () => {
    pushSnapshot();
    cm.createGroup();
    refreshLayers();
  },
  onDeleteGroup: (groupId) => {
    pushSnapshot();
    cm.deleteGroup(groupId);
    refreshLayers();
  },
  onToggleGroupVisibility: (groupId) => {
    cm.toggleGroupVisibility(groupId);
    refreshLayers();
  },
  onRenameGroup: (groupId, newName) => {
    cm.renameGroup(groupId, newName);
    scheduleSave();
  },
  onAddToGroup: (imageIndex, groupId) => {
    cm.setImageGroup(imageIndex, groupId);
    refreshLayers();
  },
  onRemoveFromGroup: (imageIndex) => {
    cm.setImageGroup(imageIndex, undefined);
    refreshLayers();
  },
  onReorderGroup: (groupId, beforeIndex, targetGroupId?, above?) => {
    pushSnapshot();
    cm.moveGroupToPosition(groupId, beforeIndex, targetGroupId, above);
    refreshLayers();
  },
});

function refreshLayers() {
  lm.render(cm.images, cm.groups, cm.getSelectedIndex());
  updateExportState();
  scheduleSave();
}

function updateExportState() {
  const hasImages = cm.images.length > 0;
  const hasVisible = hasImages && cm.images.some((e) => e.visible);
  const hasAnyContent = hasVisible || pm.pageCount > 1;
  exportBtn.disabled = !hasAnyContent;
  exportDropdownBtn.disabled = !hasAnyContent;
  clearCanvasBtn.disabled = !hasImages && !history.canUndo() && !history.canRedo();
  saveProjectBtn.disabled = !hasImages && pm.pageCount <= 1;
  dupPageBtn.disabled = !hasImages;
}

// ── Canvas ↔ layer sync ──

cm.onListChange = () => refreshLayers();
cm.onSelectionChange = (index) => {
  lm.highlightRow(index ?? -1);
  updateCanvasToolbar();
};

// ── Canvas object transform → auto-save + history ──

let pendingTransformSnapshot: HistorySnapshot | null = null;

cm.canvas.on('mouse:down', () => {
  if (isRestoring) return;
  pendingTransformSnapshot = captureSnapshot();
});

cm.canvas.on('object:modified', () => {
  if (pendingTransformSnapshot && !isRestoring) {
    history.push(pendingTransformSnapshot);
    updateUndoRedoButtons();
  }
  pendingTransformSnapshot = null;
  scheduleSave();
});

// ── Right-click context menu ──

const ctxMenu = new ContextMenu('context-menu');

cm.canvas.on('mouse:down', (opt) => {
  const e = opt.e as MouseEvent;
  if (e.button !== 2) return;

  const target = opt.target;
  if (target) {
    const idx = cm.images.findIndex(img => img.fabricImage === target);
    if (idx >= 0 && cm.images[idx].visible && !cm.images[idx].locked) {
      cm.canvas.setActiveObject(target);
      cm.canvas.requestRenderAll();
    }
  }

  const idx = cm.getSelectedIndex();

  if (idx < 0) {
    showCanvasContextMenu(e.clientX, e.clientY);
    return;
  }

  const entry = cm.images[idx];
  const isLocked = entry.locked;
  const isFirst = idx === 0;
  const isLast = idx === cm.images.length - 1;

  const items: MenuEntry[] = [
    {
      label: t('ctx.duplicate'),
      icon: ICONS.duplicate,
      action: async () => { pushSnapshot(); await cm.duplicateLayer(idx); refreshLayers(); },
    },
    { separator: true },
    {
      label: t('toolbar.flipH'),
      icon: ICONS.flipH,
      action: () => { pushSnapshot(); cm.flipSelectedH(); scheduleSave(); },
    },
    {
      label: t('toolbar.flipV'),
      icon: ICONS.flipV,
      action: () => { pushSnapshot(); cm.flipSelectedV(); scheduleSave(); },
    },
    { separator: true },
    {
      label: isLocked ? t('layer.unlockLayer') : t('layer.lockLayer'),
      icon: isLocked ? ICONS.unlock : ICONS.lock,
      action: () => { cm.toggleLock(idx); refreshLayers(); },
    },
    { separator: true },
    {
      label: t('ctx.bringForward'),
      icon: ICONS.bringForward,
      action: () => { pushSnapshot(); cm.bringForward(idx); refreshLayers(); },
      disabled: isFirst,
    },
    {
      label: t('ctx.sendBackward'),
      icon: ICONS.sendBackward,
      action: () => { pushSnapshot(); cm.sendBackward(idx); refreshLayers(); },
      disabled: isLast,
    },
    {
      label: t('ctx.bringToFront'),
      icon: ICONS.bringToFront,
      action: () => { pushSnapshot(); cm.bringToFront(idx); refreshLayers(); },
      disabled: isFirst,
    },
    {
      label: t('ctx.sendToBack'),
      icon: ICONS.sendToBack,
      action: () => { pushSnapshot(); cm.sendToBack(idx); refreshLayers(); },
      disabled: isLast,
    },
    { separator: true },
    {
      label: t('ctx.delete'),
      icon: ICONS.delete,
      action: async () => {
        const name = entry.filename ?? 'this layer';
        if (!await showConfirmModal('', t('deleteImage.message', { name }))) return;
        pushSnapshot();
        cm.removeImage(idx);
        refreshLayers();
      },
    },
  ];

  ctxMenu.show(e.clientX, e.clientY, items);
});

function showCanvasContextMenu(x: number, y: number) {
  const outlineOn = cm.getOutlineVisible();
  const centerOn = cm.getCenterLinesVisible();

  const bgColors: MenuEntry[] = [
    { label: t('color.black'), icon: colorSwatch('#000000'), action: () => { setBgColor('#000000'); } },
    { label: t('color.darkGrey'), icon: colorSwatch('#555555'), action: () => { setBgColor('#555555'); } },
    { label: t('color.lightGrey'), icon: colorSwatch('#aaaaaa'), action: () => { setBgColor('#aaaaaa'); } },
    { label: t('color.white'), icon: colorSwatch('#ffffff'), action: () => { setBgColor('#ffffff'); } },
  ];

  const markColors: MenuEntry[] = [
    { label: t('color.black'), icon: colorSwatch('#000000'), action: () => { setMarkColorCtx('#000000'); } },
    { label: t('color.white'), icon: colorSwatch('#ffffff'), action: () => { setMarkColorCtx('#ffffff'); } },
    { label: t('color.red'), icon: colorSwatch('#cc0000'), action: () => { setMarkColorCtx('#cc0000'); } },
    { label: t('color.yellow'), icon: colorSwatch('#cccc00'), action: () => { setMarkColorCtx('#cccc00'); } },
  ];

  const items: MenuEntry[] = [
    {
      label: t('ctx.addImage'),
      icon: ICONS.addImage,
      action: () => { fileInput.click(); },
    },
    {
      label: t('ctx.addText'),
      icon: ICONS.addText,
      action: () => { pushSnapshot(); cm.addText(); refreshLayers(); updateCanvasToolbar(); },
    },
    {
      label: t('ctx.importProject'),
      icon: ICONS.importProject,
      action: () => { projectFileInput.click(); },
    },
    { separator: true },
    {
      label: `${t('toolbar.outline')} (${outlineOn ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off')})`,
      icon: ICONS.guidelines,
      action: () => {
        const nowVisible = !cm.getOutlineVisible();
        cm.setOutlineVisible(nowVisible);
        outlineBtn.textContent = nowVisible ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
        outlineBtn.classList.toggle('active', nowVisible);
        scheduleSave();
      },
    },
    {
      label: `${t('toolbar.centerLines')} (${centerOn ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off')})`,
      icon: ICONS.guidelines,
      action: () => {
        const nowVisible = !cm.getCenterLinesVisible();
        cm.setCenterLinesVisible(nowVisible);
        centerLinesBtn.textContent = nowVisible ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
        centerLinesBtn.classList.toggle('active', nowVisible);
        scheduleSave();
      },
    },
    { separator: true },
    {
      label: t('ctx.backgroundColor'),
      icon: ICONS.background,
      children: bgColors,
    },
    {
      label: t('ctx.cuttingMarksColor'),
      icon: ICONS.cuttingMarks,
      children: markColors,
    },
  ];

  ctxMenu.show(x, y, items);
}

function colorSwatch(hex: string): string {
  return `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4" fill="${hex}" stroke="${hex === '#ffffff' ? '#999' : hex}" stroke-width="1.5"/></svg>`;
}

function setBgColor(color: string) {
  cm.setBackground(color);
  pm.setPageBgColor(pm.currentPage, color);
  bgButtons.forEach((b) => b.classList.toggle('active', b.dataset.bg === color));
  scheduleSave();
}

function setMarkColorCtx(color: string) {
  cm.setMarkColor(color);
  pm.setPageMarkColor(pm.currentPage, color);
  const markButtons = document.querySelectorAll<HTMLButtonElement>('.mark-btn');
  markButtons.forEach((b) => b.classList.toggle('active', b.dataset.mark === color));
  scheduleSave();
}

// ── Correction factors ──

corrXInput.value = String(DEFAULT_CORRECTION_X);
corrYInput.value = String(DEFAULT_CORRECTION_Y);

corrXInput.addEventListener('change', () => {
  const val = parseFloat(corrXInput.value);
  if (!isNaN(val) && val > 0) {
    cm.setCorrectionX(val);
    scheduleSave();
  }
});

corrYInput.addEventListener('change', () => {
  const val = parseFloat(corrYInput.value);
  if (!isNaN(val) && val > 0) {
    cm.setCorrectionY(val);
    scheduleSave();
  }
});

// ── Calibration toggle ──

calibrationToggleBtn.addEventListener('click', () => {
  const nowVisible = !cm.getCalibrationVisible();
  cm.setCalibrationVisible(nowVisible);
  calibrationToggleBtn.textContent = nowVisible ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
  calibrationToggleBtn.classList.toggle('active', nowVisible);
  scheduleSave();
});

// ── Design ruler toggle ──

designRulerBtn.addEventListener('click', () => {
  const nowVisible = !cm.getDesignRulerVisible();
  cm.setDesignRulerVisible(nowVisible);
  designRulerBtn.textContent = nowVisible ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
  designRulerBtn.classList.toggle('active', nowVisible);
  scheduleSave();
});

// ── Grid toggle ──

gridToggleBtn.addEventListener('click', () => {
  const nowVisible = !cm.getGridVisible();
  cm.setGridVisible(nowVisible);
  gridToggleBtn.textContent = nowVisible ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
  gridToggleBtn.classList.toggle('active', nowVisible);
  gridOptions.classList.toggle('hidden', !nowVisible);
  scheduleSave();
});

// ── Grid size presets ──

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

// ── Grid size custom ──

gridSizeCustom.addEventListener('change', () => {
  const val = Number(gridSizeCustom.value);
  if (val >= 1 && val <= 50) {
    cm.setGridSizeMm(val);
    gridSizeBtns.forEach(b => b.classList.remove('active'));
    scheduleSave();
  }
});

// ── Grid snap toggle ──

gridSnapBtn.addEventListener('click', () => {
  const nowEnabled = !cm.getGridSnapEnabled();
  cm.setGridSnapEnabled(nowEnabled);
  gridSnapBtn.textContent = nowEnabled ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
  gridSnapBtn.classList.toggle('active', nowEnabled);
  scheduleSave();
});

// ── Guidelines toggle ──

outlineBtn.addEventListener('click', () => {
  const nowVisible = !cm.getOutlineVisible();
  cm.setOutlineVisible(nowVisible);
  outlineBtn.textContent = nowVisible ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
  outlineBtn.classList.toggle('active', nowVisible);
  scheduleSave();
});

centerLinesBtn.addEventListener('click', () => {
  const nowVisible = !cm.getCenterLinesVisible();
  cm.setCenterLinesVisible(nowVisible);
  centerLinesBtn.textContent = nowVisible ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
  centerLinesBtn.classList.toggle('active', nowVisible);
  scheduleSave();
});

// ── New Group button ──

newGroupBtn.addEventListener('click', () => {
  pushSnapshot();
  cm.createGroup();
  refreshLayers();
});

dupPageBtn.addEventListener('click', () => {
  if (cm.images.length === 0) return;
  handleDuplicatePage(pm.currentPage);
});

// ── Background color ──

bgButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    bgButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const color = btn.dataset.bg!;
    cm.setBackground(color);
    pm.setPageBgColor(pm.currentPage, color);
    scheduleSave();
  });
});

// ── Cutting mark color ──

const markButtons = document.querySelectorAll<HTMLButtonElement>('.mark-btn');

markButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    markButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const color = btn.dataset.mark!;
    cm.setMarkColor(color);
    pm.setPageMarkColor(pm.currentPage, color);
    scheduleSave();
  });
});

// ── Import button ──

importBtn.addEventListener('click', () => fileInput.click());

// ── Clear canvas ──

clearCanvasBtn.addEventListener('click', async () => {
  if (!await showConfirmModal(t('clearCanvas.title'), t('clearCanvas.message'))) return;
  cm.clearAll();
  pm.reset();
  history.clear();
  if (historySaveTimer) { clearTimeout(historySaveTimer); historySaveTimer = null; }
  updateUndoRedoButtons();
  renderPageTabs();
  refreshLayers();
  clearAutoState().catch(() => {});
  clearHistoryState().catch(() => {});
  indexedDB.deleteDatabase('selphyoto');
  lastSaveTime = null;
  updateAutosaveDisplay();
});

// ── Save / Load Project ──

let saveProjectLabel = '';
let loadProjectLabel = '';

function captureButtonLabels() {
  saveProjectLabel = saveProjectBtn.innerHTML;
  loadProjectLabel = loadProjectBtn.innerHTML;
}

saveProjectBtn.addEventListener('click', async () => {
  saveProjectBtn.disabled = true;
  saveProjectBtn.textContent = t('project.exporting');
  try {
    pm.setPageData(pm.currentPage, collectPageData(cm));
    const allPages = pm.getAllPages();
    await exportProject(cm, { exportFormat }, allPages, pm.currentPage);
  } catch (err) {
    console.error('Failed to export project:', err);
    alert(t('project.exportFailed'));
  } finally {
    saveProjectBtn.disabled = false;
    saveProjectBtn.innerHTML = saveProjectLabel;
  }
});

loadProjectBtn.addEventListener('click', () => projectFileInput.click());

projectFileInput.addEventListener('change', async () => {
  const file = projectFileInput.files?.[0];
  if (!file) return;
  projectFileInput.value = '';

  loadProjectBtn.disabled = true;
  loadProjectBtn.textContent = t('project.importing');
  try {
    const result = await importProject(file, cm, applyUIState);
    pm.restorePages(result.pages, 0);
    const importedBg = result.pages[0]?.backgroundColor ?? '#ffffff';
    cm.setBackground(importedBg);
    bgButtons.forEach((b) => b.classList.toggle('active', b.dataset.bg === importedBg));
    const importedMark = result.pages[0]?.markColor ?? '#cc0000';
    cm.setMarkColor(importedMark);
    markButtons.forEach((b) => b.classList.toggle('active', b.dataset.mark === importedMark));
    history.clear();
    updateUndoRedoButtons();
    pushSnapshot();
    renderPageTabs();
    refreshLayers();
    flushSave();
  } catch (err) {
    console.error('Failed to import project:', err);
    alert(t('project.importFailed'));
  } finally {
    loadProjectBtn.disabled = false;
    loadProjectBtn.innerHTML = loadProjectLabel;
  }
});

function applyUIState(settings: ProjectSettings | AutoSaveSettings) {
  corrXInput.value = String(settings.correctionX);
  corrYInput.value = String(settings.correctionY);

  bgButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.bg === settings.backgroundColor);
  });

  markButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mark === settings.markColor);
  });

  const outlineVis = settings.outlineVisible ?? (settings as unknown as Record<string, unknown>).guidelinesVisible as boolean ?? true;
  const centerVis = settings.centerLinesVisible ?? false;
  outlineBtn.textContent = outlineVis ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
  outlineBtn.classList.toggle('active', outlineVis);
  centerLinesBtn.textContent = centerVis ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
  centerLinesBtn.classList.toggle('active', centerVis);

  const calVis = (settings as AutoSaveSettings).calibrationVisible ?? (settings as unknown as Record<string, unknown>).rulerVisible ?? false;
  calibrationToggleBtn.textContent = calVis ? t('toolbar.guidelines.on') : t('toolbar.guidelines.off');
  calibrationToggleBtn.classList.toggle('active', calVis as boolean);

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

  exportFormat = settings.exportFormat;
}

fileInput.addEventListener('change', () => {
  const files = fileInput.files;
  if (!files) return;
  pushSnapshot();
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      cm.addImage(file);
    }
  }
  fileInput.value = '';
});

// ── Page management ──

function renderPageTabs() {
  pageTabList.innerHTML = '';
  for (let i = 0; i < pm.pageCount; i++) {
    const tab = document.createElement('div');
    tab.className = `page-tab${i === pm.currentPage ? ' active' : ''}`;
    tab.dataset.page = String(i);

    const label = document.createElement('span');
    label.className = 'page-tab-name';
    label.textContent = pm.getPageName(i) || t('page.label', { n: i + 1 });
    tab.appendChild(label);

    label.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      label.contentEditable = 'true';
      label.focus();
      const range = document.createRange();
      range.selectNodeContents(label);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });

    const commitRename = () => {
      label.contentEditable = 'false';
      const name = label.textContent?.trim() || '';
      pm.setPageName(i, name);
      if (!name) label.textContent = t('page.label', { n: i + 1 });
      scheduleSave();
    };

    label.addEventListener('blur', commitRename);
    label.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); label.blur(); }
      if (e.key === 'Escape') {
        label.textContent = pm.getPageName(i) || t('page.label', { n: i + 1 });
        label.blur();
      }
    });

    if (pm.pageCount > 1 && i === pm.currentPage) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'page-tab-close';
      closeBtn.textContent = '×';
      closeBtn.title = t('page.delete');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeletePage(i);
      });
      tab.appendChild(closeBtn);
    }

    tab.addEventListener('click', () => handleSwitchPage(i));
    pageTabList.appendChild(tab);
  }
}

addPageBtn.addEventListener('click', () => {
  pm.setPageBgColor(pm.currentPage, cm.getBackgroundColor());
  pm.setPageMarkColor(pm.currentPage, cm.getMarkColor());
  pm.setPageData(pm.currentPage, collectPageData(cm, cm.getBackgroundColor(), cm.getMarkColor()));
  const newIdx = pm.addPage();
  cm.clearAll();
  cm.setBackground('#ffffff');
  bgButtons.forEach((b) => b.classList.toggle('active', b.dataset.bg === '#ffffff'));
  cm.setMarkColor('#cc0000');
  markButtons.forEach((b) => b.classList.toggle('active', b.dataset.mark === '#cc0000'));
  cm.finalizeRestore();
  pm.switchTo(newIdx);
  history.clear();
  updateUndoRedoButtons();
  pushSnapshot();
  renderPageTabs();
  refreshLayers();
  flushSave();
});

async function handleSwitchPage(targetIndex: number) {
  if (targetIndex === pm.currentPage) return;

  pm.setPageBgColor(pm.currentPage, cm.getBackgroundColor());
  pm.setPageMarkColor(pm.currentPage, cm.getMarkColor());
  pm.setPageData(pm.currentPage, collectPageData(cm, cm.getBackgroundColor(), cm.getMarkColor()));

  const targetData = pm.switchTo(targetIndex);
  if (!targetData) return;

  isRestoring = true;
  cm.clearAll();
  for (const img of targetData.images) {
    try {
      if ((img.type ?? 'image') === 'text') {
        cm.addTextLayer({
          filename: img.filename,
          text: img.text ?? 'Text',
          fontFamily: img.fontFamily ?? 'Arial',
          fontSize: img.fontSize ?? 40,
          fill: img.fill ?? '#000000',
          fontWeight: img.fontWeight ?? 'normal',
          fontStyle: img.fontStyle ?? 'normal',
          textAlign: img.textAlign ?? 'center',
          visible: img.visible,
          locked: img.locked ?? false,
          groupId: img.groupId ?? undefined,
          left: img.left,
          top: img.top,
          scaleX: img.scaleX,
          scaleY: img.scaleY,
          angle: img.angle,
          flipX: img.flipX ?? false,
          flipY: img.flipY ?? false,
          opacity: img.opacity ?? 1,
          width: img.width,
        });
      } else {
        if (!img.dataUrl) continue;
        await cm.addImageFromDataURL(img.dataUrl, {
          filename: img.filename,
          visible: img.visible,
          locked: img.locked ?? false,
          groupId: img.groupId ?? undefined,
          left: img.left,
          top: img.top,
          scaleX: img.scaleX,
          scaleY: img.scaleY,
          angle: img.angle,
          flipX: img.flipX ?? false,
          flipY: img.flipY ?? false,
          opacity: img.opacity ?? 1,
        });
        if (img.filters) {
          cm.setImageFilters(cm.images.length - 1, img.filters);
        }
      }
    } catch (err) {
      console.warn('Skipping corrupt layer on page switch:', img.filename, err);
    }
  }
  cm.restoreGroups(targetData.groups, targetData.groupCounter);
  if (targetData.textCounter) cm.setTextCounter(targetData.textCounter);
    const pageBg = targetData.backgroundColor ?? '#ffffff';
  cm.setBackground(pageBg);
  bgButtons.forEach((b) => b.classList.toggle('active', b.dataset.bg === pageBg));
  const pageMark = targetData.markColor ?? '#cc0000';
  cm.setMarkColor(pageMark);
  markButtons.forEach((b) => b.classList.toggle('active', b.dataset.mark === pageMark));
  cm.finalizeRestore();
  isRestoring = false;

  history.clear();
  updateUndoRedoButtons();
  pushSnapshot();
  renderPageTabs();
  refreshLayers();
  flushSave();
}

async function handleDeletePage(index: number) {
  if (pm.pageCount <= 1) return;
  const pageNum = index + 1;
  if (!await showConfirmModal('', t('page.deleteConfirm', { n: pageNum }))) return;

  if (index === pm.currentPage) {
    const newCurrent = pm.deletePage(index);
    const targetData = pm.getPageData(newCurrent);
    if (targetData) {
      isRestoring = true;
      cm.clearAll();
      for (const img of targetData.images) {
        try {
          if ((img.type ?? 'image') === 'text') {
            cm.addTextLayer({
              filename: img.filename,
              text: img.text ?? 'Text',
              fontFamily: img.fontFamily ?? 'Arial',
              fontSize: img.fontSize ?? 40,
              fill: img.fill ?? '#000000',
              fontWeight: img.fontWeight ?? 'normal',
              fontStyle: img.fontStyle ?? 'normal',
              textAlign: img.textAlign ?? 'center',
              visible: img.visible,
              locked: img.locked ?? false,
              groupId: img.groupId ?? undefined,
              left: img.left,
              top: img.top,
              scaleX: img.scaleX,
              scaleY: img.scaleY,
              angle: img.angle,
              flipX: img.flipX ?? false,
              flipY: img.flipY ?? false,
              opacity: img.opacity ?? 1,
              width: img.width,
            });
          } else {
            if (!img.dataUrl) continue;
            await cm.addImageFromDataURL(img.dataUrl, {
              filename: img.filename,
              visible: img.visible,
              locked: img.locked ?? false,
              groupId: img.groupId ?? undefined,
              left: img.left,
              top: img.top,
              scaleX: img.scaleX,
              scaleY: img.scaleY,
              angle: img.angle,
              flipX: img.flipX ?? false,
              flipY: img.flipY ?? false,
              opacity: img.opacity ?? 1,
            });
            if (img.filters) {
              cm.setImageFilters(cm.images.length - 1, img.filters);
            }
          }
        } catch (err) {
          console.warn('Skipping corrupt layer:', img.filename, err);
        }
      }
      cm.restoreGroups(targetData.groups, targetData.groupCounter);
      if (targetData.textCounter) cm.setTextCounter(targetData.textCounter);
      const pageBg = targetData.backgroundColor ?? '#ffffff';
      cm.setBackground(pageBg);
      bgButtons.forEach((b) => b.classList.toggle('active', b.dataset.bg === pageBg));
      const pageMark = targetData.markColor ?? '#cc0000';
      cm.setMarkColor(pageMark);
      markButtons.forEach((b) => b.classList.toggle('active', b.dataset.mark === pageMark));
      cm.finalizeRestore();
      isRestoring = false;
    }
  } else {
    pm.deletePage(index);
  }

  history.clear();
  updateUndoRedoButtons();
  pushSnapshot();
  renderPageTabs();
  refreshLayers();
  flushSave();
}

async function handleDuplicatePage(index: number) {
  pm.setPageBgColor(pm.currentPage, cm.getBackgroundColor());
  pm.setPageMarkColor(pm.currentPage, cm.getMarkColor());
  pm.setPageData(pm.currentPage, collectPageData(cm, cm.getBackgroundColor(), cm.getMarkColor()));

  const newIdx = pm.duplicatePage(index);
  await handleSwitchPage(newIdx);
}

// ── Confirm modal (replaces browser confirm()) ──

const confirmOverlay = document.getElementById('confirm-modal-overlay')!;
const confirmTitle = document.getElementById('confirm-modal-title')!;
const confirmMessage = document.getElementById('confirm-modal-message')!;
const confirmOkBtn = document.getElementById('confirm-modal-ok') as HTMLButtonElement;
const confirmCancelBtn = document.getElementById('confirm-modal-cancel') as HTMLButtonElement;

function showConfirmModal(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    confirmTitle.textContent = title;
    confirmTitle.style.display = title ? '' : 'none';
    confirmMessage.textContent = message;
    confirmOverlay.classList.remove('hidden');
    confirmOkBtn.focus();

    const cleanup = () => {
      confirmOverlay.classList.add('hidden');
      confirmOkBtn.removeEventListener('click', onOk);
      confirmCancelBtn.removeEventListener('click', onCancel);
      confirmOverlay.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
    };

    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    const onBackdrop = (e: Event) => { if (e.target === confirmOverlay) { cleanup(); resolve(false); } };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); onOk(); }
      else if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
    };

    confirmOkBtn.addEventListener('click', onOk);
    confirmCancelBtn.addEventListener('click', onCancel);
    confirmOverlay.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);
  });
}

// ── Export modal ──

const EXPORT_DISMISS_KEY = 'selphyoto_export_modal_dismissed';
const exportModalOverlay = document.getElementById('export-modal-overlay')!;
const exportModalDismiss = document.getElementById('export-modal-dismiss') as HTMLInputElement;
const exportModalOk = document.getElementById('export-modal-ok') as HTMLButtonElement;

async function showExportModal(format: 'png' | 'jpeg') {
  if (pm.pageCount > 1) {
    await exportAllPagesAsZip(format);
  } else {
    cm.exportImage(format);
  }
  if (localStorage.getItem(EXPORT_DISMISS_KEY) === 'true') return;
  exportModalDismiss.checked = false;
  exportModalOverlay.classList.remove('hidden');
}

async function exportAllPagesAsZip(format: 'png' | 'jpeg') {
  const zip = new JSZip();
  const ext = format === 'jpeg' ? 'jpg' : 'png';

  pm.setPageBgColor(pm.currentPage, cm.getBackgroundColor());
  pm.setPageMarkColor(pm.currentPage, cm.getMarkColor());
  pm.setPageData(pm.currentPage, collectPageData(cm, cm.getBackgroundColor(), cm.getMarkColor()));
  const savedCurrent = pm.currentPage;
  const savedBg = cm.getBackgroundColor();
  const savedMark = cm.getMarkColor();

  for (let i = 0; i < pm.pageCount; i++) {
    if (i !== savedCurrent) {
      const pageData = pm.getPageData(i);
      if (!pageData) continue;

      isRestoring = true;
      cm.clearAll();
      cm.setBackground(pageData.backgroundColor ?? '#ffffff');
      cm.setMarkColor(pageData.markColor ?? '#cc0000');
      for (const img of pageData.images) {
        if ((img.type ?? 'image') === 'text') {
          cm.addTextLayer({
            filename: img.filename,
            text: img.text ?? 'Text',
            fontFamily: img.fontFamily ?? 'Arial',
            fontSize: img.fontSize ?? 40,
            fill: img.fill ?? '#000000',
            fontWeight: img.fontWeight ?? 'normal',
            fontStyle: img.fontStyle ?? 'normal',
            textAlign: img.textAlign ?? 'center',
            visible: img.visible,
            locked: img.locked ?? false,
            groupId: img.groupId ?? undefined,
            left: img.left,
            top: img.top,
            scaleX: img.scaleX,
            scaleY: img.scaleY,
            angle: img.angle,
            flipX: img.flipX ?? false,
            flipY: img.flipY ?? false,
            opacity: img.opacity ?? 1,
            width: img.width,
          });
        } else {
          if (!img.dataUrl) continue;
          await cm.addImageFromDataURL(img.dataUrl, {
            filename: img.filename,
            visible: img.visible,
            locked: img.locked ?? false,
            groupId: img.groupId ?? undefined,
            left: img.left,
            top: img.top,
            scaleX: img.scaleX,
            scaleY: img.scaleY,
            angle: img.angle,
            flipX: img.flipX ?? false,
            flipY: img.flipY ?? false,
            opacity: img.opacity ?? 1,
          });
          if (img.filters) {
            cm.setImageFilters(cm.images.length - 1, img.filters);
          }
        }
      }
      cm.restoreGroups(pageData.groups, pageData.groupCounter);
      if (pageData.textCounter) cm.setTextCounter(pageData.textCounter);
      cm.finalizeRestore();
      isRestoring = false;
    }

    const dataUrl = cm.exportImageDataUrl(format);
    const base64 = dataUrl.split(',')[1];
    zip.file(`page_${i + 1}.${ext}`, base64, { base64: true });
  }

  // Restore original page
  if (pm.pageCount > 1) {
    const origData = pm.getPageData(savedCurrent);
    if (origData) {
      isRestoring = true;
      cm.clearAll();
      for (const img of origData.images) {
        if ((img.type ?? 'image') === 'text') {
          cm.addTextLayer({
            filename: img.filename,
            text: img.text ?? 'Text',
            fontFamily: img.fontFamily ?? 'Arial',
            fontSize: img.fontSize ?? 40,
            fill: img.fill ?? '#000000',
            fontWeight: img.fontWeight ?? 'normal',
            fontStyle: img.fontStyle ?? 'normal',
            textAlign: img.textAlign ?? 'center',
            visible: img.visible,
            locked: img.locked ?? false,
            groupId: img.groupId ?? undefined,
            left: img.left,
            top: img.top,
            scaleX: img.scaleX,
            scaleY: img.scaleY,
            angle: img.angle,
            flipX: img.flipX ?? false,
            flipY: img.flipY ?? false,
            opacity: img.opacity ?? 1,
            width: img.width,
          });
        } else {
          if (!img.dataUrl) continue;
          await cm.addImageFromDataURL(img.dataUrl, {
            filename: img.filename,
            visible: img.visible,
            locked: img.locked ?? false,
            groupId: img.groupId ?? undefined,
            left: img.left,
            top: img.top,
            scaleX: img.scaleX,
            scaleY: img.scaleY,
            angle: img.angle,
            flipX: img.flipX ?? false,
            flipY: img.flipY ?? false,
            opacity: img.opacity ?? 1,
          });
          if (img.filters) {
            cm.setImageFilters(cm.images.length - 1, img.filters);
          }
        }
      }
      cm.restoreGroups(origData.groups, origData.groupCounter);
      if (origData.textCounter) cm.setTextCounter(origData.textCounter);
      cm.setBackground(savedBg);
      cm.setMarkColor(savedMark);
      cm.finalizeRestore();
      isRestoring = false;
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const d = new Date();
  const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;

  const link = document.createElement('a');
  link.download = `selphyoto_exported_${ts}.zip`;
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function closeExportModal() {
  if (exportModalDismiss.checked) {
    localStorage.setItem(EXPORT_DISMISS_KEY, 'true');
  }
  exportModalOverlay.classList.add('hidden');
}

exportModalOk.addEventListener('click', closeExportModal);

exportModalOverlay.addEventListener('click', (e) => {
  if (e.target === exportModalOverlay) closeExportModal();
});

document.addEventListener('keydown', (e) => {
  if (exportModalOverlay.classList.contains('hidden')) return;
  if (e.key === 'Enter' || e.key === 'Escape') {
    e.preventDefault();
    closeExportModal();
  }
});

// ── Export split button ──

exportBtn.addEventListener('click', () => showExportModal(exportFormat));

function closeAllDropdowns(except?: Element) {
  const pairs: [Element, Element, Element][] = [
    [toolsDropdownMenu, toolsDropdownArrow, toolsDropdownBtn],
    [textDropdownMenu, textDropdownArrow, textDropdownBtn],
    [stickerDropdownMenu, stickerDropdownArrow, stickerDropdownBtn],
    [adjustDropdownMenu, adjustDropdownArrow, adjustDropdownBtn],
  ];
  for (const [menu, arrow] of pairs) {
    if (menu !== except) {
      menu.classList.remove('open');
      arrow.classList.remove('open');
    }
  }
  if (except !== exportMenu) exportMenu.classList.remove('open');
}

exportDropdownBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllDropdowns(exportMenu);
  exportMenu.classList.toggle('open');
});

exportMenu.querySelectorAll<HTMLButtonElement>('.split-btn-option').forEach((opt) => {
  opt.addEventListener('click', () => {
    exportFormat = opt.dataset.format as 'png' | 'jpeg';
    exportMenu.classList.remove('open');
    showExportModal(exportFormat);
  });
});

function setupDropdownToggle(btn: HTMLButtonElement, menu: Element, arrow: Element) {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (btn.disabled) return;
    closeAllDropdowns(menu);
    menu.classList.toggle('open');
    arrow.classList.toggle('open');
  });
  menu.addEventListener('click', (e) => e.stopPropagation());
}

setupDropdownToggle(toolsDropdownBtn, toolsDropdownMenu, toolsDropdownArrow);
setupDropdownToggle(textDropdownBtn, textDropdownMenu, textDropdownArrow);
setupDropdownToggle(stickerDropdownBtn, stickerDropdownMenu, stickerDropdownArrow);
setupDropdownToggle(adjustDropdownBtn, adjustDropdownMenu, adjustDropdownArrow);

document.addEventListener('click', () => {
  closeAllDropdowns();
});

// ── Sticker panel ──

let activeStickerCategory: StickerCategory = 'all';

function renderStickerCategories() {
  stickerCategoriesEl.innerHTML = '';
  for (const cat of STICKER_CATEGORIES) {
    const btn = document.createElement('button');
    btn.className = 'sticker-cat-btn' + (cat === activeStickerCategory ? ' active' : '');
    btn.textContent = t(`sticker.cat.${cat}`);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      activeStickerCategory = cat;
      stickerSearch.value = '';
      renderStickerCategories();
      renderStickerGrid(getStickers(cat));
    });
    stickerCategoriesEl.appendChild(btn);
  }
}

let stickerGridOffset = 0;

function renderStickerGrid(stickers: ReturnType<typeof getStickers>, append = false) {
  if (!append) {
    stickerGrid.innerHTML = '';
    stickerGridOffset = 0;
  }
  if (!isLoaded()) {
    const loading = document.createElement('div');
    loading.className = 'sticker-empty';
    loading.textContent = t('sticker.loading');
    stickerGrid.appendChild(loading);
    return;
  }
  if (stickers.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sticker-empty';
    empty.textContent = t('sticker.empty');
    stickerGrid.appendChild(empty);
    return;
  }

  const batch = stickers.slice(stickerGridOffset, stickerGridOffset + STICKER_GRID_PAGE_SIZE);
  stickerGridOffset += batch.length;

  for (const sticker of batch) {
    const item = document.createElement('button');
    item.className = 'sticker-item';
    item.title = sticker.name;
    const img = document.createElement('img');
    img.src = sticker.url;
    img.alt = sticker.name;
    img.loading = 'lazy';
    img.draggable = false;
    item.appendChild(img);
    item.addEventListener('click', async (e) => {
      e.stopPropagation();
      item.disabled = true;
      try {
        pushSnapshot();
        const dataUrl = await fetchSvgAsDataUrl(sticker.url);
        await cm.addSticker(dataUrl, sticker.name);
        refreshLayers();
        scheduleSave();
      } catch (err) {
        console.error('Failed to add sticker:', err);
      } finally {
        item.disabled = false;
      }
    });
    stickerGrid.appendChild(item);
  }

  const existingMore = stickerGrid.querySelector('.sticker-load-more');
  if (existingMore) existingMore.remove();

  if (stickerGridOffset < stickers.length) {
    const moreBtn = document.createElement('button');
    moreBtn.className = 'sticker-load-more action-btn';
    moreBtn.textContent = t('sticker.loadMore', { remaining: stickers.length - stickerGridOffset });
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderStickerGrid(stickers, true);
    });
    stickerGrid.appendChild(moreBtn);
  }
}

stickerSearch.addEventListener('input', () => {
  const query = stickerSearch.value;
  if (query.trim()) {
    activeStickerCategory = 'all';
    renderStickerCategories();
    renderStickerGrid(searchStickers(query));
  } else {
    renderStickerGrid(getStickers(activeStickerCategory));
  }
});

renderStickerCategories();
renderStickerGrid(getStickers('all'));
stickerLoadPromise.then(() => {
  renderStickerGrid(getStickers(activeStickerCategory));
});

// ── Drag & drop on canvas ──

window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

canvasContainer.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  canvasContainer.classList.add('drag-over');
});

canvasContainer.addEventListener('dragleave', (e) => {
  e.preventDefault();
  canvasContainer.classList.remove('drag-over');
});

canvasContainer.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  canvasContainer.classList.remove('drag-over');

  const files = e.dataTransfer?.files;
  if (!files) return;
  pushSnapshot();
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      cm.addImage(file);
    }
  }
});

// ── Paste from clipboard (image, text, or internal layer) ──

let pasteCounter = 0;
let layerClipboard: AutoSaveImage[] | null = null;
const PASTE_OFFSET = 10;
const LAYER_CLIPBOARD_MARKER = '###SELPHYOTO_LAYER###';

async function pasteLayerData(data: AutoSaveImage): Promise<void> {
  if ((data.type ?? 'image') === 'text') {
    cm.addTextLayer({
      text: data.text ?? 'Text',
      fontFamily: data.fontFamily ?? 'Arial',
      fontSize: data.fontSize ?? 40,
      fill: data.fill ?? '#000000',
      fontWeight: data.fontWeight ?? 'normal',
      fontStyle: data.fontStyle ?? 'normal',
      textAlign: data.textAlign ?? 'center',
      filename: data.filename,
      visible: true,
      locked: false,
      left: data.left,
      top: data.top,
      scaleX: data.scaleX,
      scaleY: data.scaleY,
      angle: data.angle,
      flipX: data.flipX,
      flipY: data.flipY,
      opacity: data.opacity,
      width: data.width,
    });
  } else {
    if (!data.dataUrl) return;
    await cm.addImageFromDataURL(data.dataUrl, {
      filename: data.filename,
      visible: true,
      locked: false,
      left: data.left,
      top: data.top,
      scaleX: data.scaleX,
      scaleY: data.scaleY,
      angle: data.angle,
      flipX: data.flipX,
      flipY: data.flipY,
      opacity: data.opacity,
    });
  }
}

document.addEventListener('copy', (e: ClipboardEvent) => {
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) return;
  if ((cm.canvas.getActiveObject() as any)?.isEditing) return;

  const serialized = cm.serializeAllSelected();
  if (serialized.length > 0) {
    e.preventDefault();
    e.clipboardData?.setData('text/plain', LAYER_CLIPBOARD_MARKER);
    layerClipboard = serialized;
  }
});

document.addEventListener('paste', (e: ClipboardEvent) => {
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) return;
  if ((cm.canvas.getActiveObject() as any)?.isEditing) return;

  const clipText = e.clipboardData?.getData('text/plain') ?? '';

  if (clipText === LAYER_CLIPBOARD_MARKER && layerClipboard && layerClipboard.length > 0) {
    e.preventDefault();
    pushSnapshot();
    (async () => {
      for (const item of layerClipboard!) {
        await pasteLayerData({ ...item, left: item.left + PASTE_OFFSET, top: item.top + PASTE_OFFSET });
      }
      refreshLayers();
    })();
    return;
  }

  const items = e.clipboardData?.items;
  if (items) {
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (!blob) continue;
        e.preventDefault();
        pasteCounter++;
        const ext = blob.type.split('/')[1] || 'png';
        const file = new File([blob], `pasted_${pasteCounter}.${ext}`, { type: blob.type });
        pushSnapshot();
        cm.addImage(file);
        refreshLayers();
        return;
      }
    }
  }

  const text = clipText.trim();
  if (text) {
    e.preventDefault();
    pushSnapshot();
    cm.addText(text);
    refreshLayers();
  }
});

// ── Scroll-to-zoom selected image ──

cm.canvas.on('mouse:wheel', (opt) => {
  const e = opt.e as WheelEvent;
  if (cm.getSelectedIndex() < 0) return;
  e.preventDefault();
  e.stopPropagation();
  pushSnapshotCoalesced();
  const delta = e.deltaY;
  const factor = delta < 0 ? 1.02 : 1 / 1.02;
  cm.scaleSelected(factor);
  scheduleSave();
});

// ── Keyboard shortcuts (only when not typing in an input) ──

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).contentEditable === 'true') return true;
  return false;
}

const NUDGE_PX = 1;

document.addEventListener('keydown', (e) => {
  if (isInputFocused()) return;

  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
    e.preventDefault();
    undoBtn.click();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
    e.preventDefault();
    redoBtn.click();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    if ((cm.canvas.getActiveObject() as any)?.isEditing) return;
    e.preventDefault();
    cm.selectAll();
    return;
  }

  switch (e.key) {
    case 'Delete':
    case 'Backspace': {
      e.preventDefault();
      const idx = cm.getSelectedIndex();
      if (idx < 0) break;
      const name = cm.images[idx]?.filename ?? 'this image';
      showConfirmModal('', t('deleteImage.message', { name })).then((ok) => {
        if (!ok) return;
        pushSnapshot();
        cm.deleteSelected();
        refreshLayers();
      });
      break;
    }
    case 'ArrowUp':
      e.preventDefault();
      pushSnapshotCoalesced();
      cm.nudgeSelected(0, -NUDGE_PX);
      scheduleSave();
      break;
    case 'ArrowDown':
      e.preventDefault();
      pushSnapshotCoalesced();
      cm.nudgeSelected(0, NUDGE_PX);
      scheduleSave();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      pushSnapshotCoalesced();
      cm.nudgeSelected(-NUDGE_PX, 0);
      scheduleSave();
      break;
    case 'ArrowRight':
      e.preventDefault();
      pushSnapshotCoalesced();
      cm.nudgeSelected(NUDGE_PX, 0);
      scheduleSave();
      break;
  }
});

// ── Sidebar drawer toggle ──

const SIDEBAR_KEY = 'selphyoto_sidebar';
const layerPanel = document.getElementById('layer-panel')!;
const drawerToggle = document.getElementById('sidebar-drawer-toggle')!;
let savedPanelWidth = '';

function isCanvasEmpty(): boolean {
  const allPages = pm.getAllPages();
  const pagesEmpty = allPages.every(p => p.images.length === 0 && p.groups.length === 0);
  return pagesEmpty && cm.images.length === 0;
}

function setSidebarCollapsed(collapsed: boolean) {
  panelTransitioning = true;
  if (collapsed) {
    savedPanelWidth = layerPanel.style.width || '';
    layerPanel.classList.add('collapsed');
  } else {
    layerPanel.classList.remove('collapsed');
    if (savedPanelWidth) layerPanel.style.width = savedPanelWidth;
  }
  localStorage.setItem(SIDEBAR_KEY, collapsed ? 'collapsed' : 'expanded');
}

function toggleSidebar() {
  setSidebarCollapsed(!layerPanel.classList.contains('collapsed'));
}

function restoreSidebarState() {
  if (localStorage.getItem(SIDEBAR_KEY) === 'expanded' && !isCanvasEmpty()) {
    layerPanel.classList.remove('collapsed');
    if (savedPanelWidth) layerPanel.style.width = savedPanelWidth;
  }
}

drawerToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleSidebar();
});

layerPanel.addEventListener('click', (e) => {
  if (layerPanel.classList.contains('collapsed')) {
    e.stopPropagation();
    toggleSidebar();
  }
});

// ── Layer panel resize handle ──

const panelHandle = document.getElementById('layer-panel-handle')!;

panelHandle.addEventListener('mousedown', (e) => {
  e.preventDefault();
  panelHandle.classList.add('active');
  const startX = e.clientX;
  const startW = layerPanel.offsetWidth;

  const onMove = (ev: MouseEvent) => {
    const newW = Math.max(150, startW + (ev.clientX - startX));
    layerPanel.style.width = `${newW}px`;
  };

  const onUp = () => {
    panelHandle.classList.remove('active');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

// ── Settings panel (right sidebar) toggle ──

const SETTINGS_SIDEBAR_KEY = 'selphyoto_settings_sidebar';
const settingsPanel = document.getElementById('settings-panel')!;
const settingsDrawerToggle = document.getElementById('settings-drawer-toggle')!;
let savedSettingsWidth = '';

function setSettingsCollapsed(collapsed: boolean) {
  panelTransitioning = true;
  if (collapsed) {
    savedSettingsWidth = settingsPanel.style.width || '';
    settingsPanel.classList.add('collapsed');
  } else {
    settingsPanel.classList.remove('collapsed');
    if (savedSettingsWidth) settingsPanel.style.width = savedSettingsWidth;
  }
  localStorage.setItem(SETTINGS_SIDEBAR_KEY, collapsed ? 'collapsed' : 'expanded');
}

function toggleSettings() {
  setSettingsCollapsed(!settingsPanel.classList.contains('collapsed'));
}

function restoreSettingsState() {
  if (localStorage.getItem(SETTINGS_SIDEBAR_KEY) === 'expanded') {
    settingsPanel.classList.remove('collapsed');
    if (savedSettingsWidth) settingsPanel.style.width = savedSettingsWidth;
  }
}

settingsDrawerToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleSettings();
});

settingsPanel.addEventListener('click', (e) => {
  if (settingsPanel.classList.contains('collapsed')) {
    e.stopPropagation();
    toggleSettings();
  }
});

// ── Settings panel resize handle ──

const settingsHandle = document.getElementById('settings-panel-handle')!;

settingsHandle.addEventListener('mousedown', (e) => {
  e.preventDefault();
  settingsHandle.classList.add('active');
  const startX = e.clientX;
  const startW = settingsPanel.offsetWidth;

  const onMove = (ev: MouseEvent) => {
    const newW = Math.max(150, startW - (ev.clientX - startX));
    settingsPanel.style.width = `${newW}px`;
  };

  const onUp = () => {
    settingsHandle.classList.remove('active');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

// ── Responsive canvas sizing ──

const canvasWrapper = document.getElementById('canvas-wrapper')!;
let fitCanvasTimer: ReturnType<typeof setTimeout> | null = null;
let panelTransitioning = false;

function fitCanvas() {
  cm.fitToContainer(canvasWrapper);
}

function fitCanvasDebounced() {
  if (panelTransitioning) return;
  if (fitCanvasTimer !== null) clearTimeout(fitCanvasTimer);
  fitCanvasTimer = setTimeout(() => {
    fitCanvasTimer = null;
    fitCanvas();
  }, 150);
}

const resizeObserver = new ResizeObserver(fitCanvasDebounced);
resizeObserver.observe(canvasWrapper);
fitCanvas();

for (const panel of [layerPanel, settingsPanel]) {
  panel.addEventListener('transitionend', (e) => {
    if ((e as TransitionEvent).propertyName !== 'width') return;
    panelTransitioning = false;
    if (fitCanvasTimer !== null) clearTimeout(fitCanvasTimer);
    fitCanvasTimer = null;
    fitCanvas();
  });
}

// ── Restore from auto-save, then initial render ──

async function restoreAutoSave() {
  try {
    const state = await loadAutoState();
    if (!state) return;

    pm.restorePages(state.pages, state.currentPage);
    const currentPageData = pm.getPageData(pm.currentPage);
    if (!currentPageData) return;

    const validImages = currentPageData.images.filter(img =>
      (img.type ?? 'image') === 'text' || (img.dataUrl && typeof img.dataUrl === 'string'),
    );
    if (validImages.length === 0 && currentPageData.groups.length === 0 && pm.pageCount <= 1) return;

    for (const img of validImages) {
      try {
        if ((img.type ?? 'image') === 'text') {
          cm.addTextLayer({
            filename: img.filename,
            text: img.text ?? 'Text',
            fontFamily: img.fontFamily ?? 'Arial',
            fontSize: img.fontSize ?? 40,
            fill: img.fill ?? '#000000',
            fontWeight: img.fontWeight ?? 'normal',
            fontStyle: img.fontStyle ?? 'normal',
            textAlign: img.textAlign ?? 'center',
            visible: img.visible,
            locked: img.locked ?? false,
            groupId: img.groupId ?? undefined,
            left: img.left,
            top: img.top,
            scaleX: img.scaleX,
            scaleY: img.scaleY,
            angle: img.angle,
            flipX: img.flipX ?? false,
            flipY: img.flipY ?? false,
            opacity: img.opacity ?? 1,
            width: img.width,
          });
        } else {
          await cm.addImageFromDataURL(img.dataUrl, {
            filename: img.filename,
            visible: img.visible,
            locked: img.locked ?? false,
            groupId: img.groupId ?? undefined,
            left: img.left,
            top: img.top,
            scaleX: img.scaleX,
            scaleY: img.scaleY,
            angle: img.angle,
            flipX: img.flipX ?? false,
            flipY: img.flipY ?? false,
            opacity: img.opacity ?? 1,
          });
        }
        if (img.filters) {
          cm.setImageFilters(cm.images.length - 1, img.filters);
        }
      } catch (imgErr) {
        console.warn('Skipping corrupt auto-saved layer:', img.filename, imgErr);
      }
    }

    cm.restoreGroups(currentPageData.groups, currentPageData.groupCounter);
    if (currentPageData.textCounter) cm.setTextCounter(currentPageData.textCounter);
    if (state.settings) {
      cm.setCorrectionX(state.settings.correctionX);
      cm.setCorrectionY(state.settings.correctionY);
      const pageBg = currentPageData.backgroundColor ?? state.settings.backgroundColor;
      cm.setBackground(pageBg);
      const pageMark = currentPageData.markColor ?? state.settings.markColor;
      cm.setMarkColor(pageMark);
      const outVis = state.settings.outlineVisible ?? (state.settings as unknown as Record<string, unknown>).guidelinesVisible as boolean ?? true;
      const cenVis = state.settings.centerLinesVisible ?? false;
      cm.setOutlineVisible(outVis);
      cm.setCenterLinesVisible(cenVis);
      const calVis = (state.settings as AutoSaveSettings).calibrationVisible ?? (state.settings as unknown as Record<string, unknown>).rulerVisible ?? false;
      cm.setCalibrationVisible(calVis as boolean);
      const designRulerVis = state.settings.designRulerVisible ?? false;
      cm.setDesignRulerVisible(designRulerVis);
      const gridVis = state.settings.gridVisible ?? false;
      cm.setGridVisible(gridVis);
      const gridSize = state.settings.gridSizeMm ?? 5;
      cm.setGridSizeMm(gridSize);
      const snapEnabled = state.settings.gridSnapEnabled ?? false;
      cm.setGridSnapEnabled(snapEnabled);
      applyUIState({ ...state.settings, calibrationVisible: calVis as boolean, outlineVisible: outVis, centerLinesVisible: cenVis, backgroundColor: pageBg, markColor: pageMark, designRulerVisible: designRulerVis, gridVisible: gridVis, gridSizeMm: gridSize, gridSnapEnabled: snapEnabled });
    }
    cm.finalizeRestore();
  } catch (err) {
    console.warn('Failed to restore auto-save:', err);
  }
}

restoreAutoSave().then(async () => {
  try {
    const histData = await loadHistoryState();
    if (histData) {
      history.restoreFrom(histData);
    }
  } catch (err) {
    console.warn('Failed to restore history:', err);
  }
  if (!history.canUndo() && cm.images.length > 0) {
    history.push(captureSnapshot());
  }
  updateUndoRedoButtons();
  applyI18n();
  captureButtonLabels();
  renderPageTabs();
  refreshLayers();
  restoreSidebarState();
  restoreSettingsState();
  fitCanvas();
});
