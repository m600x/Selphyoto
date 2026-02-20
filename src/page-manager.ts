import type { AutoSaveImage } from './auto-save';
import type { GroupEntry } from './canvas-manager';

export interface PageData {
  name?: string;
  backgroundColor?: string;
  markColor?: string;
  images: AutoSaveImage[];
  groups: GroupEntry[];
  groupCounter: number;
  textCounter: number;
}

export function emptyPage(): PageData {
  return { images: [], groups: [], groupCounter: 0, textCounter: 0 };
}


export class PageManager {
  private pages: PageData[] = [emptyPage()];
  private _currentPage = 0;

  get currentPage(): number {
    return this._currentPage;
  }

  get pageCount(): number {
    return this.pages.length;
  }

  getPageData(index: number): PageData | null {
    return this.pages[index] ?? null;
  }

  setPageData(index: number, data: PageData): void {
    if (index >= 0 && index < this.pages.length) {
      this.pages[index] = data;
    }
  }

  addPage(): number {
    this.pages.push(emptyPage());
    return this.pages.length - 1;
  }

  deletePage(index: number): number {
    if (this.pages.length <= 1 || index < 0 || index >= this.pages.length) {
      return this._currentPage;
    }
    this.pages.splice(index, 1);
    if (this._currentPage >= this.pages.length) {
      this._currentPage = this.pages.length - 1;
    } else if (this._currentPage > index) {
      this._currentPage--;
    }
    return this._currentPage;
  }

  switchTo(index: number): PageData | null {
    if (index < 0 || index >= this.pages.length || index === this._currentPage) {
      return null;
    }
    this._currentPage = index;
    return this.pages[index];
  }

  getAllPages(): PageData[] {
    return this.pages.map(p => ({
      name: p.name,
      backgroundColor: p.backgroundColor,
      markColor: p.markColor,
      images: p.images.map(i => ({ ...i })),
      groups: p.groups.map(g => ({ ...g })),
      groupCounter: p.groupCounter,
      textCounter: p.textCounter,
    }));
  }

  restorePages(pages: PageData[], currentPage: number): void {
    this.pages = pages.length > 0 ? pages : [emptyPage()];
    this._currentPage = Math.max(0, Math.min(currentPage, this.pages.length - 1));
  }

  getPageName(index: number): string | undefined {
    return this.pages[index]?.name;
  }

  setPageName(index: number, name: string): void {
    if (index >= 0 && index < this.pages.length) {
      this.pages[index].name = name;
    }
  }

  getPageBgColor(index: number): string | undefined {
    return this.pages[index]?.backgroundColor;
  }

  setPageBgColor(index: number, color: string): void {
    if (index >= 0 && index < this.pages.length) {
      this.pages[index].backgroundColor = color;
    }
  }

  getPageMarkColor(index: number): string | undefined {
    return this.pages[index]?.markColor;
  }

  setPageMarkColor(index: number, color: string): void {
    if (index >= 0 && index < this.pages.length) {
      this.pages[index].markColor = color;
    }
  }

  duplicatePage(index: number): number {
    if (index < 0 || index >= this.pages.length) return this._currentPage;
    const source = this.pages[index];
    const copy: PageData = {
      name: source.name,
      backgroundColor: source.backgroundColor,
      markColor: source.markColor,
      images: source.images.map(i => ({ ...i })),
      groups: source.groups.map(g => ({ ...g })),
      groupCounter: source.groupCounter,
      textCounter: source.textCounter,
    };
    this.pages.splice(index + 1, 0, copy);
    return index + 1;
  }

  reset(): void {
    this.pages = [emptyPage()];
    this._currentPage = 0;
  }
}
