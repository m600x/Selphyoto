import { describe, it, expect, mock, beforeEach } from 'bun:test';
import type { ImageEntry, GroupEntry } from '../../src/canvas-manager';
import { LayerManager, type LayerCallbacks } from '../../src/layer-manager';

let _fakeId = 0;
function makeFakeImage(overrides: Partial<ImageEntry> = {}): ImageEntry {
  return {
    id: `fake-${++_fakeId}`,
    type: 'image',
    fabricImage: {} as ImageEntry['fabricImage'],
    filename: 'test.png',
    visible: true,
    locked: false,
    originalDataUrl: 'data:image/png;base64,TEST',
    ...overrides,
  };
}

function makeCallbacks(): LayerCallbacks {
  return {
    onToggleVisibility: mock(() => {}),
    onToggleLock: mock(() => {}),
    onDelete: mock(() => {}),
    onReorder: mock(() => {}),
    onSelect: mock(() => {}),
    onRename: mock(() => {}),
    onCreateGroup: mock(() => {}),
    onDeleteGroup: mock(() => {}),
    onToggleGroupVisibility: mock(() => {}),
    onRenameGroup: mock(() => {}),
    onAddToGroup: mock(() => {}),
    onRemoveFromGroup: mock(() => {}),
    onReorderGroup: mock(() => {}),
  };
}

describe('LayerManager', () => {
  let lm: LayerManager;
  let callbacks: LayerCallbacks;
  let container: HTMLElement;
  let emptyMsg: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="layer-list"></div>
      <p id="layer-empty">No layers</p>
    `;
    container = document.getElementById('layer-list')!;
    emptyMsg = document.getElementById('layer-empty')!;
    callbacks = makeCallbacks();
    lm = new LayerManager('layer-list', 'layer-empty', callbacks);
  });

  describe('render', () => {
    it('shows empty message when no images or groups', () => {
      lm.render([], [], -1);
      expect(emptyMsg.style.display).toBe('');
      expect(container.children.length).toBe(0);
    });

    it('hides empty message when images exist', () => {
      const images = [makeFakeImage({ filename: 'photo.png' })];
      lm.render(images, [], -1);
      expect(emptyMsg.style.display).toBe('none');
    });

    it('hides empty message when only groups exist', () => {
      const groups: GroupEntry[] = [{ id: 'group-1', name: 'Group 1', visible: true }];
      lm.render([], groups, -1);
      expect(emptyMsg.style.display).toBe('none');
    });

    it('renders correct number of image rows', () => {
      const images = [
        makeFakeImage({ filename: 'a.png' }),
        makeFakeImage({ filename: 'b.png' }),
        makeFakeImage({ filename: 'c.png' }),
      ];
      lm.render(images, [], -1);
      const rows = container.querySelectorAll('.layer-row');
      expect(rows.length).toBe(3);
    });

    it('renders group header for grouped images', () => {
      const groups: GroupEntry[] = [{ id: 'g1', name: 'My Group', visible: true }];
      const images = [makeFakeImage({ filename: 'a.png', groupId: 'g1' })];
      lm.render(images, groups, -1);
      const headers = container.querySelectorAll('.group-header');
      expect(headers.length).toBe(1);
      expect(headers[0].querySelector('.group-name')!.textContent).toBe('My Group');
    });

    it('grouped images have the .grouped class', () => {
      const groups: GroupEntry[] = [{ id: 'g1', name: 'G1', visible: true }];
      const images = [
        makeFakeImage({ filename: 'grouped.png', groupId: 'g1' }),
        makeFakeImage({ filename: 'ungrouped.png' }),
      ];
      lm.render(images, groups, -1);
      const rows = container.querySelectorAll('.layer-row');
      expect(rows[0].classList.contains('grouped')).toBe(true);
      expect(rows[1].classList.contains('grouped')).toBe(false);
    });

    it('renders empty groups', () => {
      const groups: GroupEntry[] = [{ id: 'g1', name: 'Empty Group', visible: true }];
      lm.render([], groups, -1);
      const headers = container.querySelectorAll('.group-header');
      expect(headers.length).toBe(1);
    });

    it('marks the selected image row', () => {
      const images = [
        makeFakeImage({ filename: 'a.png' }),
        makeFakeImage({ filename: 'b.png' }),
      ];
      lm.render(images, [], 1);
      const rows = container.querySelectorAll('.layer-row');
      expect(rows[0].classList.contains('selected')).toBe(false);
      expect(rows[1].classList.contains('selected')).toBe(true);
    });

    it('displays correct filename in each row', () => {
      const images = [
        makeFakeImage({ filename: 'first.png' }),
        makeFakeImage({ filename: 'second.jpg' }),
      ];
      lm.render(images, [], -1);
      const names = container.querySelectorAll('.layer-name');
      expect(names[0].textContent).toBe('first.png');
      expect(names[1].textContent).toBe('second.jpg');
    });
  });

  describe('type icons', () => {
    it('renders image icon for image layers', () => {
      lm.render([makeFakeImage({ type: 'image' })], [], -1);
      const icon = container.querySelector('.layer-row .layer-type-icon');
      expect(icon).not.toBeNull();
      expect(icon!.innerHTML).toContain('svg');
    });

    it('renders text icon for text layers', () => {
      lm.render([makeFakeImage({ type: 'text', filename: 'Text 1' })], [], -1);
      const icon = container.querySelector('.layer-row .layer-type-icon');
      expect(icon).not.toBeNull();
    });

    it('renders folder icon for group headers', () => {
      const groups: GroupEntry[] = [{ id: 'g1', name: 'Group', visible: true }];
      lm.render([], groups, -1);
      const icon = container.querySelector('.group-header .layer-type-icon');
      expect(icon).not.toBeNull();
    });
  });

  describe('button callbacks', () => {
    it('visibility button calls onToggleVisibility', () => {
      lm.render([makeFakeImage()], [], -1);
      const visBtn = container.querySelector('.vis-btn') as HTMLButtonElement;
      visBtn.click();
      expect(callbacks.onToggleVisibility).toHaveBeenCalledWith(0);
    });

    it('delete button calls onDelete', () => {
      lm.render([makeFakeImage()], [], -1);
      const delBtn = container.querySelector('.del-btn') as HTMLButtonElement;
      delBtn.click();
      expect(callbacks.onDelete).toHaveBeenCalledWith(0);
    });

    it('lock button calls onToggleLock', () => {
      lm.render([makeFakeImage()], [], -1);
      const lockBtn = container.querySelector('.lock-btn') as HTMLButtonElement;
      lockBtn.click();
      expect(callbacks.onToggleLock).toHaveBeenCalledWith(0);
    });

    it('clicking a row calls onSelect', () => {
      lm.render([makeFakeImage()], [], -1);
      const row = container.querySelector('.layer-row') as HTMLElement;
      row.click();
      expect(callbacks.onSelect).toHaveBeenCalledWith(0);
    });

    it('group delete calls onDeleteGroup', () => {
      const groups: GroupEntry[] = [{ id: 'g1', name: 'G', visible: true }];
      lm.render([], groups, -1);
      const delBtn = container.querySelector('.group-header .del-btn') as HTMLButtonElement;
      delBtn.click();
      expect(callbacks.onDeleteGroup).toHaveBeenCalledWith('g1');
    });

    it('group visibility calls onToggleGroupVisibility', () => {
      const groups: GroupEntry[] = [{ id: 'g1', name: 'G', visible: true }];
      lm.render([], groups, -1);
      const visBtn = container.querySelector('.group-header .vis-btn') as HTMLButtonElement;
      visBtn.click();
      expect(callbacks.onToggleGroupVisibility).toHaveBeenCalledWith('g1');
    });

    it('ungroup button calls onRemoveFromGroup', () => {
      const groups: GroupEntry[] = [{ id: 'g1', name: 'G', visible: true }];
      const images = [makeFakeImage({ filename: 'a.png', groupId: 'g1' })];
      lm.render(images, groups, -1);
      const ungroupBtn = container.querySelector('.ungroup-btn') as HTMLButtonElement;
      ungroupBtn.click();
      expect(callbacks.onRemoveFromGroup).toHaveBeenCalledWith(0);
    });
  });

  describe('highlightRow', () => {
    it('updates selected class on rows', () => {
      const images = [
        makeFakeImage({ filename: 'a.png' }),
        makeFakeImage({ filename: 'b.png' }),
      ];
      lm.render(images, [], 0);
      const rows = container.querySelectorAll('.layer-row');
      expect(rows[0].classList.contains('selected')).toBe(true);
      expect(rows[1].classList.contains('selected')).toBe(false);

      lm.highlightRow(1);
      expect(rows[0].classList.contains('selected')).toBe(false);
      expect(rows[1].classList.contains('selected')).toBe(true);
    });

    it('deselects all when index is -1', () => {
      lm.render([makeFakeImage()], [], 0);
      lm.highlightRow(-1);
      const row = container.querySelector('.layer-row') as HTMLElement;
      expect(row.classList.contains('selected')).toBe(false);
    });
  });

  describe('inline rename', () => {
    it('double-click makes name editable', () => {
      lm.render([makeFakeImage({ filename: 'photo.png' })], [], -1);
      const name = container.querySelector('.layer-name') as HTMLElement;
      expect(name.contentEditable).not.toBe('true');
      name.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      expect(name.contentEditable).toBe('true');
    });

    it('Enter key commits rename', () => {
      lm.render([makeFakeImage({ filename: 'old.png' })], [], -1);
      const name = container.querySelector('.layer-name') as HTMLElement;
      name.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      name.textContent = 'new.png';
      name.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(callbacks.onRename).toHaveBeenCalledWith(0, 'new.png');
    });

    it('Escape key reverts rename', () => {
      lm.render([makeFakeImage({ filename: 'orig.png' })], [], -1);
      const name = container.querySelector('.layer-name') as HTMLElement;
      name.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      name.textContent = 'changed.png';
      name.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(name.textContent).toBe('orig.png');
      expect(callbacks.onRename).not.toHaveBeenCalled();
    });
  });

  describe('lock button rendering', () => {
    it('shows unlocked style for unlocked image', () => {
      lm.render([makeFakeImage({ locked: false })], [], -1);
      const lockBtn = container.querySelector('.lock-btn') as HTMLElement;
      expect(lockBtn.classList.contains('locked')).toBe(false);
    });

    it('shows locked style for locked image', () => {
      lm.render([makeFakeImage({ locked: true })], [], -1);
      const lockBtn = container.querySelector('.lock-btn') as HTMLElement;
      expect(lockBtn.classList.contains('locked')).toBe(true);
    });
  });

  describe('visibility button rendering', () => {
    it('visible image does not have hidden class', () => {
      lm.render([makeFakeImage({ visible: true })], [], -1);
      const visBtn = container.querySelector('.vis-btn') as HTMLElement;
      expect(visBtn.classList.contains('hidden')).toBe(false);
    });

    it('hidden image has hidden class', () => {
      lm.render([makeFakeImage({ visible: false })], [], -1);
      const visBtn = container.querySelector('.vis-btn') as HTMLElement;
      expect(visBtn.classList.contains('hidden')).toBe(true);
    });
  });
});
