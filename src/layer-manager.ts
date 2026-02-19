import type { ImageEntry, GroupEntry } from './canvas-manager';
import { t } from './i18n';

export interface LayerCallbacks {
  onToggleVisibility: (index: number) => void;
  onToggleLock: (index: number) => void;
  onDelete: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onSelect: (index: number) => void;
  onRename: (index: number, newName: string) => void;
  onCreateGroup: () => void;
  onDeleteGroup: (groupId: string) => void;
  onToggleGroupVisibility: (groupId: string) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onAddToGroup: (imageIndex: number, groupId: string) => void;
  onRemoveFromGroup: (imageIndex: number) => void;
  onReorderGroup: (groupId: string, beforeIndex: number, targetGroupId?: string, above?: boolean) => void;
}

const SVG_EYE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const SVG_EYE_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
const SVG_TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
const SVG_UNGROUP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const SVG_LOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const SVG_UNLOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;

export class LayerManager {
  private container: HTMLElement;
  private emptyMsg: HTMLElement;
  private callbacks: LayerCallbacks;
  private dragFromIndex: number | null = null;
  private dragFromGroupId: string | null = null;
  private selectedIndex: number = -1;
  private _currentImages: ReadonlyArray<ImageEntry> = [];

  constructor(
    containerId: string,
    emptyId: string,
    callbacks: LayerCallbacks,
  ) {
    this.container = document.getElementById(containerId)!;
    this.emptyMsg = document.getElementById(emptyId)!;
    this.callbacks = callbacks;
  }

  render(
    images: ReadonlyArray<ImageEntry>,
    groups: ReadonlyArray<GroupEntry>,
    selectedIndex: number,
  ) {
    this.selectedIndex = selectedIndex;
    this._currentImages = images;
    this.container.innerHTML = '';

    const hasContent = images.length > 0 || groups.length > 0;
    this.emptyMsg.style.display = hasContent ? 'none' : '';
    if (!hasContent) return;

    const renderedGroups = new Set<string>();

    for (let i = 0; i < images.length; i++) {
      const entry = images[i];

      if (entry.groupId && !renderedGroups.has(entry.groupId)) {
        renderedGroups.add(entry.groupId);
        const group = groups.find(g => g.id === entry.groupId);
        if (group) {
          this.appendGroupHeader(group);
          images.forEach((img, idx) => {
            if (img.groupId === group.id) {
              this.appendImageRow(img, idx, selectedIndex, true);
            }
          });
        }
      } else if (!entry.groupId) {
        this.appendImageRow(entry, i, selectedIndex, false);
      }
    }

    for (const group of groups) {
      if (!renderedGroups.has(group.id)) {
        this.appendGroupHeader(group);
      }
    }
  }

  private getGroupImageRange(groupId: string): { first: number; last: number } | null {
    let first = -1;
    let last = -1;
    for (let i = 0; i < this._currentImages.length; i++) {
      if (this._currentImages[i].groupId === groupId) {
        if (first === -1) first = i;
        last = i;
      }
    }
    return first === -1 ? null : { first, last };
  }

  private computeReorderTarget(from: number, targetOrigIdx: number, above: boolean): number {
    let target: number;
    if (above) {
      target = (from < targetOrigIdx) ? targetOrigIdx - 1 : targetOrigIdx;
    } else {
      target = (from < targetOrigIdx) ? targetOrigIdx : targetOrigIdx + 1;
    }
    return Math.max(0, Math.min(target, this._currentImages.length - 1));
  }

  private appendGroupHeader(group: GroupEntry) {
    const row = document.createElement('div');
    row.className = 'group-header';
    row.dataset.groupId = group.id;
    row.draggable = true;

    const visBtn = document.createElement('button');
    visBtn.className = 'vis-btn' + (group.visible ? '' : ' hidden');
    visBtn.innerHTML = group.visible ? SVG_EYE : SVG_EYE_OFF;
    visBtn.title = group.visible ? t('layer.hideGroup') : t('layer.showGroup');
    visBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onToggleGroupVisibility(group.id);
    });

    const name = document.createElement('span');
    name.className = 'group-name';
    name.textContent = group.name;
    name.draggable = false;

    name.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (name.contentEditable === 'true') return;
      name.contentEditable = 'true';
      name.focus();
      const range = document.createRange();
      range.selectNodeContents(name);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });

    const commitGroupRename = () => {
      name.contentEditable = 'false';
      const newName = (name.textContent ?? '').trim();
      if (newName && newName !== group.name) {
        this.callbacks.onRenameGroup(group.id, newName);
      } else {
        name.textContent = group.name;
      }
    };

    name.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commitGroupRename(); name.blur(); }
      else if (e.key === 'Escape') { name.textContent = group.name; name.contentEditable = 'false'; name.blur(); }
    });
    name.addEventListener('blur', commitGroupRename);

    const delBtn = document.createElement('button');
    delBtn.className = 'del-btn';
    delBtn.innerHTML = SVG_TRASH;
    delBtn.title = t('layer.deleteGroup');
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onDeleteGroup(group.id);
    });

    row.addEventListener('dragstart', (e) => {
      this.dragFromGroupId = group.id;
      this.dragFromIndex = null;
      row.classList.add('dragging');
      e.dataTransfer!.effectAllowed = 'move';
    });

    row.addEventListener('dragend', () => {
      this.dragFromGroupId = null;
      row.classList.remove('dragging');
      this.clearDragIndicators();
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';

      if (this.dragFromIndex === null && this.dragFromGroupId === null) return;
      if (this.dragFromGroupId === group.id) return;

      this.clearDragIndicators();

      const rect = row.getBoundingClientRect();
      const relY = (e.clientY - rect.top) / rect.height;
      const range = this.getGroupImageRange(group.id);

      if (this.dragFromGroupId !== null) {
        if (relY < 0.5) {
          row.classList.add('drag-over-above');
        } else {
          row.classList.add('drag-over-below');
        }
      } else {
        if (!range) {
          row.classList.add('drag-over-group');
        } else if (relY < 0.25) {
          row.classList.add('drag-over-above');
        } else if (relY > 0.75) {
          row.classList.add('drag-over-below');
        } else {
          row.classList.add('drag-over-group');
        }
      }
    });

    row.addEventListener('dragleave', () => {
      row.classList.remove('drag-over-above', 'drag-over-below', 'drag-over-group');
    });

    row.addEventListener('drop', (e) => {
      e.preventDefault();
      const wasAbove = row.classList.contains('drag-over-above');
      const wasBelow = row.classList.contains('drag-over-below');
      const wasGroup = row.classList.contains('drag-over-group');
      this.clearDragIndicators();

      const range = this.getGroupImageRange(group.id);

      if (this.dragFromIndex !== null) {
        const from = this.dragFromIndex;
        this.dragFromIndex = null;

        if (wasGroup) {
          this.callbacks.onAddToGroup(from, group.id);
        } else if (wasAbove && range) {
          this.callbacks.onReorder(from, this.computeReorderTarget(from, range.first, true));
        } else if (wasBelow && range) {
          this.callbacks.onReorder(from, this.computeReorderTarget(from, range.last, false));
        }
      } else if (this.dragFromGroupId !== null) {
        const gid = this.dragFromGroupId;
        this.dragFromGroupId = null;

        if (range) {
          const beforeIdx = wasAbove ? range.first : range.last + 1;
          this.callbacks.onReorderGroup(gid, beforeIdx, group.id, wasAbove);
        } else {
          this.callbacks.onReorderGroup(gid, this._currentImages.length, group.id, wasAbove);
        }
      }
    });

    row.append(visBtn, name, delBtn);
    this.container.appendChild(row);
  }

  private appendImageRow(
    entry: ImageEntry,
    index: number,
    selectedIndex: number,
    grouped: boolean,
  ) {
    const row = document.createElement('div');
    row.className = 'layer-row' + (grouped ? ' grouped' : '');
    if (index === selectedIndex) row.classList.add('selected');
    row.draggable = true;
    row.dataset.index = String(index);

    const visBtn = document.createElement('button');
    visBtn.className = 'vis-btn' + (entry.visible ? '' : ' hidden');
    visBtn.innerHTML = entry.visible ? SVG_EYE : SVG_EYE_OFF;
    visBtn.title = entry.visible ? t('layer.hideLayer') : t('layer.showLayer');
    visBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onToggleVisibility(index);
    });

    const name = document.createElement('span');
    name.className = 'layer-name';
    name.textContent = entry.filename;
    name.draggable = false;

    name.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (name.contentEditable === 'true') return;
      name.contentEditable = 'true';
      name.focus();
      const range = document.createRange();
      range.selectNodeContents(name);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });

    const commitRename = () => {
      name.contentEditable = 'false';
      const newName = (name.textContent ?? '').trim();
      if (newName && newName !== entry.filename) {
        this.callbacks.onRename(index, newName);
      } else {
        name.textContent = entry.filename;
      }
    };

    name.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commitRename(); name.blur(); }
      else if (e.key === 'Escape') { name.textContent = entry.filename; name.contentEditable = 'false'; name.blur(); }
    });
    name.addEventListener('blur', commitRename);

    const buttons: HTMLElement[] = [];

    if (grouped) {
      const ungroupBtn = document.createElement('button');
      ungroupBtn.className = 'ungroup-btn';
      ungroupBtn.innerHTML = SVG_UNGROUP;
      ungroupBtn.title = t('layer.removeFromGroup');
      ungroupBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.callbacks.onRemoveFromGroup(index);
      });
      buttons.push(ungroupBtn);
    }

    const lockBtn = document.createElement('button');
    lockBtn.className = 'lock-btn' + (entry.locked ? ' locked' : '');
    lockBtn.innerHTML = entry.locked ? SVG_LOCK : SVG_UNLOCK;
    lockBtn.title = entry.locked ? t('layer.unlockLayer') : t('layer.lockLayer');
    lockBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onToggleLock(index);
    });
    buttons.push(lockBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'del-btn';
    delBtn.innerHTML = SVG_TRASH;
    delBtn.title = t('layer.removeLayer');
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.callbacks.onDelete(index);
    });
    buttons.push(delBtn);

    row.addEventListener('click', () => {
      this.callbacks.onSelect(index);
    });

    row.addEventListener('dragstart', (e) => {
      this.dragFromIndex = index;
      this.dragFromGroupId = null;
      row.classList.add('dragging');
      e.dataTransfer!.effectAllowed = 'move';
    });

    row.addEventListener('dragend', () => {
      this.dragFromIndex = null;
      row.classList.remove('dragging');
      this.clearDragIndicators();
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';

      if (this.dragFromIndex === null && this.dragFromGroupId === null) return;
      if (this.dragFromIndex === index) return;

      this.clearDragIndicators();
      const rect = row.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        row.classList.add('drag-over-above');
      } else {
        row.classList.add('drag-over-below');
      }
    });

    row.addEventListener('dragleave', () => {
      row.classList.remove('drag-over-above', 'drag-over-below');
    });

    row.addEventListener('drop', (e) => {
      e.preventDefault();
      const wasAbove = row.classList.contains('drag-over-above');
      this.clearDragIndicators();

      if (this.dragFromIndex !== null) {
        const from = this.dragFromIndex;
        this.dragFromIndex = null;
        if (from === index) return;
        this.callbacks.onReorder(from, this.computeReorderTarget(from, index, wasAbove));
      } else if (this.dragFromGroupId !== null) {
        const gid = this.dragFromGroupId;
        this.dragFromGroupId = null;
        const beforeIdx = wasAbove ? index : index + 1;
        this.callbacks.onReorderGroup(gid, beforeIdx);
      }
    });

    row.append(visBtn, name, ...buttons);
    this.container.appendChild(row);
  }

  highlightRow(index: number) {
    if (index === this.selectedIndex) return;
    this.selectedIndex = index;
    const rows = this.container.querySelectorAll('.layer-row');
    rows.forEach((row) => {
      const rowIndex = parseInt((row as HTMLElement).dataset.index ?? '-1');
      row.classList.toggle('selected', rowIndex === index);
    });
  }

  private clearDragIndicators() {
    this.container
      .querySelectorAll('.drag-over-above, .drag-over-below, .drag-over-group')
      .forEach((el) =>
        el.classList.remove('drag-over-above', 'drag-over-below', 'drag-over-group'),
      );
  }
}
