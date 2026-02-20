export interface MenuItem {
  label: string;
  icon?: string;
  action: () => void;
  disabled?: boolean;
  separator?: false;
  children?: undefined;
}

export interface MenuSubmenu {
  label: string;
  icon?: string;
  children: MenuEntry[];
  separator?: false;
}

export interface MenuSeparator {
  separator: true;
}

export type MenuEntry = MenuItem | MenuSubmenu | MenuSeparator;

const SVG_DUPLICATE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const SVG_DELETE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const SVG_FLIP_H = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><polyline points="5 9 2 12 5 15"/><polyline points="19 9 22 12 19 15"/><path d="M2 12h6"/><path d="M16 12h6"/></svg>';
const SVG_FLIP_V = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="22" y2="12"/><polyline points="9 5 12 2 15 5"/><polyline points="9 19 12 22 15 19"/><path d="M12 2v6"/><path d="M12 16v6"/></svg>';
const SVG_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const SVG_UNLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';
const SVG_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
const SVG_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
const SVG_TOP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="6" x2="12" y2="18"/><line x1="7" y1="3" x2="17" y2="3"/></svg>';
const SVG_BOTTOM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"/><line x1="12" y1="18" x2="12" y2="6"/><line x1="7" y1="21" x2="17" y2="21"/></svg>';
const SVG_IMAGE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
const SVG_TEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9.5" y1="20" x2="14.5" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>';
const SVG_IMPORT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
const SVG_GUIDES = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>';
const SVG_PALETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2"/><circle cx="17.5" cy="10.5" r="2"/><circle cx="8.5" cy="7.5" r="2"/><circle cx="6.5" cy="12" r="2"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16c3.3 0 6-2.7 6-6 0-5.2-4.5-8.2-10-8.2z"/></svg>';
const SVG_SCISSORS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>';
const SVG_CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

export const ICONS = {
  duplicate: SVG_DUPLICATE,
  delete: SVG_DELETE,
  flipH: SVG_FLIP_H,
  flipV: SVG_FLIP_V,
  lock: SVG_LOCK,
  unlock: SVG_UNLOCK,
  bringForward: SVG_UP,
  sendBackward: SVG_DOWN,
  bringToFront: SVG_TOP,
  sendToBack: SVG_BOTTOM,
  addImage: SVG_IMAGE,
  addText: SVG_TEXT,
  importProject: SVG_IMPORT,
  guidelines: SVG_GUIDES,
  background: SVG_PALETTE,
  cuttingMarks: SVG_SCISSORS,
};

export class ContextMenu {
  private el: HTMLElement;
  private subMenus: HTMLElement[] = [];

  constructor(containerId: string) {
    this.el = document.getElementById(containerId)!;
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  show(x: number, y: number, items: MenuEntry[]) {
    this.clearSubMenus();
    this.el.innerHTML = '';
    this.buildItems(this.el, items, true);

    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
    this.el.classList.remove('hidden');

    this.clampToViewport(this.el, x, y);

    requestAnimationFrame(() => {
      document.addEventListener('click', this.handleClickOutside);
      document.addEventListener('contextmenu', this.handleClickOutside);
      document.addEventListener('keydown', this.handleKeydown);
    });
  }

  hide() {
    this.el.classList.add('hidden');
    this.clearSubMenus();
    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('contextmenu', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleKeydown);
  }

  isVisible(): boolean {
    return !this.el.classList.contains('hidden');
  }

  private buildItems(container: HTMLElement, items: MenuEntry[], isRoot: boolean) {
    for (const entry of items) {
      if (entry.separator) {
        const sep = document.createElement('div');
        sep.className = 'ctx-separator';
        container.appendChild(sep);
        continue;
      }

      if ('children' in entry && entry.children) {
        const sub = entry as MenuSubmenu;
        const row = document.createElement('div');
        row.className = 'ctx-item ctx-submenu-trigger';

        if (sub.icon) {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'ctx-icon';
          iconSpan.innerHTML = sub.icon;
          row.appendChild(iconSpan);
        }

        const label = document.createElement('span');
        label.className = 'ctx-label';
        label.textContent = sub.label;
        row.appendChild(label);

        const arrow = document.createElement('span');
        arrow.className = 'ctx-arrow';
        arrow.innerHTML = SVG_CHEVRON;
        row.appendChild(arrow);

        const subPanel = document.createElement('div');
        subPanel.className = 'ctx-menu ctx-submenu hidden';
        this.buildItems(subPanel, sub.children, false);
        document.body.appendChild(subPanel);
        this.subMenus.push(subPanel);

        row.addEventListener('mouseenter', () => {
          this.subMenus.forEach(s => s.classList.add('hidden'));
          const rect = row.getBoundingClientRect();
          subPanel.style.left = `${rect.right}px`;
          subPanel.style.top = `${rect.top}px`;
          subPanel.classList.remove('hidden');
          this.clampToViewport(subPanel, rect.right, rect.top);
        });

        container.appendChild(row);
        continue;
      }

      const item = entry as MenuItem;
      const row = document.createElement('button');
      row.className = 'ctx-item';
      if (item.disabled) row.disabled = true;

      if (item.icon) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'ctx-icon';
        iconSpan.innerHTML = item.icon;
        row.appendChild(iconSpan);
      }

      const label = document.createElement('span');
      label.className = 'ctx-label';
      label.textContent = item.label;
      row.appendChild(label);

      row.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
        item.action();
      });
      container.appendChild(row);
    }

    if (isRoot) {
      container.addEventListener('mouseleave', () => {
        // keep submenus open — they handle their own hover
      });
    }
  }

  private clampToViewport(el: HTMLElement, x: number, y: number) {
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      el.style.left = `${Math.max(0, x - rect.width)}px`;
    }
    if (rect.bottom > window.innerHeight) {
      el.style.top = `${Math.max(0, y - rect.height)}px`;
    }
  }

  private clearSubMenus() {
    for (const s of this.subMenus) s.remove();
    this.subMenus.length = 0;
  }

  private handleClickOutside() {
    this.hide();
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.hide();
    }
  }
}
