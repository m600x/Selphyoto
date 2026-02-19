import './style.css';
import { CanvasManager } from './canvas-manager';
import { LayerManager } from './layer-manager';
import { DEFAULT_CORRECTION_X, DEFAULT_CORRECTION_Y } from './constants';
import { exportProject, importProject, type ProjectSettings } from './project-io';
import { saveAutoState, loadAutoState, clearAutoState, collectState, type AutoSaveSettings } from './auto-save';

// ── Init ──

const cm = new CanvasManager('main-canvas');

const corrXInput = document.getElementById('correction-x') as HTMLInputElement;
const corrYInput = document.getElementById('correction-y') as HTMLInputElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const guidelinesBtn = document.getElementById('guidelines-btn')!;
const newGroupBtn = document.getElementById('new-group-btn')!;
const importBtn = document.getElementById('import-btn')!;
const clearCanvasBtn = document.getElementById('clear-canvas-btn') as HTMLButtonElement;
const saveProjectBtn = document.getElementById('save-project-btn') as HTMLButtonElement;
const loadProjectBtn = document.getElementById('load-project-btn') as HTMLButtonElement;
const projectFileInput = document.getElementById('project-file-input') as HTMLInputElement;
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
const exportDropdownBtn = document.getElementById('export-dropdown-btn') as HTMLButtonElement;
const exportMenu = document.getElementById('export-menu')!;
const canvasContainer = document.getElementById('canvas-container')!;
const bgButtons = document.querySelectorAll<HTMLButtonElement>('.bg-btn');

// ── Export format state ──

let exportFormat: 'png' | 'jpeg' = 'png';

// ── Version display ──

const appVersionEl = document.getElementById('app-version')!;
appVersionEl.textContent = `v${__APP_VERSION__} (${__COMMIT_HASH__})`;

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
  const state = collectState(cm, exportFormat);
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
    autosaveStatusEl.textContent = '-';
    return;
  }
  const seconds = Math.floor((Date.now() - lastSaveTime) / 1000);
  if (seconds < 5) autosaveStatusEl.textContent = 'Autosaved just now';
  else if (seconds < 60) autosaveStatusEl.textContent = `Autosaved ${seconds}s ago`;
  else {
    const minutes = Math.floor(seconds / 60);
    autosaveStatusEl.textContent = `Autosaved ${minutes}m ago`;
  }
}

setInterval(updateAutosaveDisplay, 10_000);

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
  onDelete: (i) => {
    const name = cm.images[i]?.filename ?? 'this image';
    if (!confirm(`Delete "${name}"?`)) return;
    cm.removeImage(i);
    refreshLayers();
  },
  onReorder: (from, to) => {
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
    cm.createGroup();
    refreshLayers();
  },
  onDeleteGroup: (groupId) => {
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
  exportBtn.disabled = !hasVisible;
  exportDropdownBtn.disabled = !hasVisible;
  clearCanvasBtn.disabled = !hasImages;
  saveProjectBtn.disabled = !hasImages;
}

// ── Canvas ↔ layer sync ──

cm.onListChange = () => refreshLayers();
cm.onSelectionChange = (index) => {
  lm.highlightRow(index ?? -1);
};

// ── Canvas object transform → auto-save ──

cm.canvas.on('object:modified', () => scheduleSave());

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

// ── Guidelines toggle ──

guidelinesBtn.addEventListener('click', () => {
  const nowVisible = !cm.getGuidelinesVisible();
  cm.setGuidelinesVisible(nowVisible);
  guidelinesBtn.textContent = nowVisible ? 'ON' : 'OFF';
  guidelinesBtn.classList.toggle('active', nowVisible);
  scheduleSave();
});

// ── New Group button ──

newGroupBtn.addEventListener('click', () => {
  cm.createGroup();
  refreshLayers();
});

// ── Background color ──

bgButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    bgButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    cm.setBackground(btn.dataset.bg!);
    scheduleSave();
  });
});

// ── Cutting mark color ──

const markButtons = document.querySelectorAll<HTMLButtonElement>('.mark-btn');

markButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    markButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    cm.setMarkColor(btn.dataset.mark!);
    scheduleSave();
  });
});

// ── Import button ──

importBtn.addEventListener('click', () => fileInput.click());

// ── Clear canvas ──

clearCanvasBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the entire canvas? All images and groups will be removed.')) {
    cm.clearAll();
    refreshLayers();
    clearAutoState().catch(() => {});
    lastSaveTime = null;
    updateAutosaveDisplay();
  }
});

// ── Save / Load Project ──

const saveProjectLabel = saveProjectBtn.innerHTML;
const loadProjectLabel = loadProjectBtn.innerHTML;

saveProjectBtn.addEventListener('click', async () => {
  saveProjectBtn.disabled = true;
  saveProjectBtn.textContent = 'Exporting…';
  try {
    await exportProject(cm, { exportFormat });
  } catch (err) {
    console.error('Failed to export project:', err);
    alert('Failed to export project.');
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
  loadProjectBtn.textContent = 'Importing…';
  try {
    await importProject(file, cm, applyUIState);
    refreshLayers();
    flushSave();
  } catch (err) {
    console.error('Failed to import project:', err);
    alert('Failed to import project. The file may be invalid.');
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

  guidelinesBtn.textContent = settings.guidelinesVisible ? 'ON' : 'OFF';
  guidelinesBtn.classList.toggle('active', settings.guidelinesVisible);

  exportFormat = settings.exportFormat;
}

fileInput.addEventListener('change', () => {
  const files = fileInput.files;
  if (!files) return;
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      cm.addImage(file);
    }
  }
  fileInput.value = '';
});

// ── Export split button ──

exportBtn.addEventListener('click', () => cm.exportImage(exportFormat));

exportDropdownBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  exportMenu.classList.toggle('open');
});

exportMenu.querySelectorAll<HTMLButtonElement>('.split-btn-option').forEach((opt) => {
  opt.addEventListener('click', () => {
    exportFormat = opt.dataset.format as 'png' | 'jpeg';
    exportMenu.classList.remove('open');
    cm.exportImage(exportFormat);
  });
});

document.addEventListener('click', () => exportMenu.classList.remove('open'));

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
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      cm.addImage(file);
    }
  }
});

// ── Scroll-to-zoom selected image ──

cm.canvas.on('mouse:wheel', (opt) => {
  const e = opt.e as WheelEvent;
  if (cm.getSelectedIndex() < 0) return;
  e.preventDefault();
  e.stopPropagation();
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

  switch (e.key) {
    case 'Delete':
    case 'Backspace': {
      e.preventDefault();
      const idx = cm.getSelectedIndex();
      if (idx < 0) break;
      const name = cm.images[idx]?.filename ?? 'this image';
      if (!confirm(`Delete "${name}"?`)) break;
      cm.deleteSelected();
      refreshLayers();
      break;
    }
    case 'ArrowUp':
      e.preventDefault();
      cm.nudgeSelected(0, -NUDGE_PX);
      scheduleSave();
      break;
    case 'ArrowDown':
      e.preventDefault();
      cm.nudgeSelected(0, NUDGE_PX);
      scheduleSave();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      cm.nudgeSelected(-NUDGE_PX, 0);
      scheduleSave();
      break;
    case 'ArrowRight':
      e.preventDefault();
      cm.nudgeSelected(NUDGE_PX, 0);
      scheduleSave();
      break;
  }
});

// ── Layer panel resize handle ──

const layerPanel = document.getElementById('layer-panel')!;
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

// ── Responsive canvas sizing ──

const canvasWrapper = document.getElementById('canvas-wrapper')!;

function fitCanvas() {
  cm.fitToContainer(canvasWrapper);
}

const resizeObserver = new ResizeObserver(fitCanvas);
resizeObserver.observe(canvasWrapper);
fitCanvas();

// ── Restore from auto-save, then initial render ──

async function restoreAutoSave() {
  try {
    const state = await loadAutoState();
    if (!state) return;

    const validImages = state.images.filter(img => img.dataUrl && typeof img.dataUrl === 'string');
    if (validImages.length === 0 && state.groups.length === 0) return;

    for (const img of validImages) {
      try {
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
        });
      } catch (imgErr) {
        console.warn('Skipping corrupt auto-saved image:', img.filename, imgErr);
      }
    }

    cm.restoreGroups(state.groups, state.groupCounter);
    if (state.settings) {
      cm.setCorrectionX(state.settings.correctionX);
      cm.setCorrectionY(state.settings.correctionY);
      cm.setBackground(state.settings.backgroundColor);
      cm.setMarkColor(state.settings.markColor);
      cm.setGuidelinesVisible(state.settings.guidelinesVisible);
      applyUIState(state.settings);
    }
    cm.finalizeRestore();
  } catch (err) {
    console.warn('Failed to restore auto-save:', err);
  }
}

restoreAutoSave().then(() => {
  refreshLayers();
  fitCanvas();
});
