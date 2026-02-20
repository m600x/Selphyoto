import { describe, it, expect } from 'bun:test';
import { PageManager, emptyPage, type PageData } from '../../src/page-manager';

function makePage(images: number = 0, groups: number = 0): PageData {
  const p = emptyPage();
  for (let i = 0; i < images; i++) {
    p.images.push({
      type: 'image',
      dataUrl: `data:image/png;base64,img${i}`,
      filename: `image_${i}.png`,
      visible: true,
      locked: false,
      groupId: null,
      left: 0, top: 0,
      scaleX: 1, scaleY: 1,
      angle: 0,
      flipX: false, flipY: false,
      opacity: 1,
    });
  }
  for (let i = 0; i < groups; i++) {
    p.groups.push({ id: `group-${i + 1}`, name: `Group ${i + 1}`, visible: true });
    p.groupCounter = groups;
  }
  return p;
}

describe('emptyPage', () => {
  it('returns a page with empty arrays and zero counters', () => {
    const page = emptyPage();
    expect(page.images).toEqual([]);
    expect(page.groups).toEqual([]);
    expect(page.groupCounter).toBe(0);
    expect(page.textCounter).toBe(0);
    expect(page.name).toBeUndefined();
    expect(page.backgroundColor).toBeUndefined();
    expect(page.markColor).toBeUndefined();
  });

  it('returns a new object each call', () => {
    const a = emptyPage();
    const b = emptyPage();
    expect(a).not.toBe(b);
    a.images.push({} as never);
    expect(b.images).toHaveLength(0);
  });
});

describe('PageManager', () => {
  describe('initialization', () => {
    it('starts with one empty page', () => {
      const pm = new PageManager();
      expect(pm.pageCount).toBe(1);
      expect(pm.currentPage).toBe(0);
    });

    it('first page is empty', () => {
      const pm = new PageManager();
      const data = pm.getPageData(0);
      expect(data).not.toBeNull();
      expect(data!.images).toHaveLength(0);
      expect(data!.groups).toHaveLength(0);
    });
  });

  describe('addPage', () => {
    it('adds a new empty page and returns its index', () => {
      const pm = new PageManager();
      const idx = pm.addPage();
      expect(idx).toBe(1);
      expect(pm.pageCount).toBe(2);
    });

    it('new page is empty', () => {
      const pm = new PageManager();
      pm.addPage();
      const data = pm.getPageData(1);
      expect(data!.images).toHaveLength(0);
    });
  });

  describe('setPageData / getPageData', () => {
    it('stores and retrieves page data', () => {
      const pm = new PageManager();
      const page = makePage(3);
      pm.setPageData(0, page);
      const result = pm.getPageData(0);
      expect(result!.images).toHaveLength(3);
    });

    it('returns null for invalid index', () => {
      const pm = new PageManager();
      expect(pm.getPageData(5)).toBeNull();
      expect(pm.getPageData(-1)).toBeNull();
    });

    it('ignores set on invalid index', () => {
      const pm = new PageManager();
      pm.setPageData(99, makePage(1));
      expect(pm.pageCount).toBe(1);
    });
  });

  describe('switchTo', () => {
    it('returns target page data', () => {
      const pm = new PageManager();
      const page1 = makePage(2);
      pm.addPage();
      pm.setPageData(1, page1);
      const result = pm.switchTo(1);
      expect(result!.images).toHaveLength(2);
      expect(pm.currentPage).toBe(1);
    });

    it('returns null when switching to same page', () => {
      const pm = new PageManager();
      const result = pm.switchTo(0);
      expect(result).toBeNull();
    });

    it('returns null for invalid index', () => {
      const pm = new PageManager();
      expect(pm.switchTo(-1)).toBeNull();
      expect(pm.switchTo(5)).toBeNull();
    });
  });

  describe('deletePage', () => {
    it('removes a page', () => {
      const pm = new PageManager();
      pm.addPage();
      pm.addPage();
      expect(pm.pageCount).toBe(3);
      pm.deletePage(1);
      expect(pm.pageCount).toBe(2);
    });

    it('does not delete the last page', () => {
      const pm = new PageManager();
      pm.deletePage(0);
      expect(pm.pageCount).toBe(1);
    });

    it('adjusts currentPage when deleting before it', () => {
      const pm = new PageManager();
      pm.addPage();
      pm.addPage();
      pm.switchTo(2);
      pm.deletePage(0);
      expect(pm.currentPage).toBe(1);
    });

    it('adjusts currentPage when deleting the current page', () => {
      const pm = new PageManager();
      pm.addPage();
      pm.addPage();
      pm.switchTo(2);
      const newIdx = pm.deletePage(2);
      expect(newIdx).toBe(1);
      expect(pm.currentPage).toBe(1);
    });

    it('returns current page index', () => {
      const pm = new PageManager();
      pm.addPage();
      const idx = pm.deletePage(1);
      expect(idx).toBe(0);
    });
  });

  describe('duplicatePage', () => {
    it('creates a copy of the page including groups', () => {
      const pm = new PageManager();
      pm.setPageData(0, makePage(2, 1));
      const newIdx = pm.duplicatePage(0);
      expect(newIdx).toBe(1);
      expect(pm.pageCount).toBe(2);
      expect(pm.getPageData(1)!.images).toHaveLength(2);
      expect(pm.getPageData(1)!.groups).toHaveLength(1);
    });

    it('duplicate is independent from original', () => {
      const pm = new PageManager();
      pm.setPageData(0, makePage(1, 1));
      pm.duplicatePage(0);
      pm.getPageData(1)!.images.push(makePage(1).images[0]);
      pm.getPageData(1)!.groups.push({ id: 'group-extra', name: 'Extra', visible: true });
      expect(pm.getPageData(0)!.images).toHaveLength(1);
      expect(pm.getPageData(0)!.groups).toHaveLength(1);
      expect(pm.getPageData(1)!.images).toHaveLength(2);
      expect(pm.getPageData(1)!.groups).toHaveLength(2);
    });
  });

  describe('getAllPages', () => {
    it('returns deep copies of all pages including groups', () => {
      const pm = new PageManager();
      pm.setPageData(0, makePage(1, 1));
      pm.addPage();
      pm.setPageData(1, makePage(2, 2));
      const all = pm.getAllPages();
      expect(all).toHaveLength(2);
      expect(all[0].images).toHaveLength(1);
      expect(all[0].groups).toHaveLength(1);
      expect(all[1].images).toHaveLength(2);
      expect(all[1].groups).toHaveLength(2);
    });
  });

  describe('restorePages', () => {
    it('restores pages from saved data', () => {
      const pm = new PageManager();
      pm.restorePages([makePage(1), makePage(3)], 1);
      expect(pm.pageCount).toBe(2);
      expect(pm.currentPage).toBe(1);
    });

    it('clamps currentPage to valid range', () => {
      const pm = new PageManager();
      pm.restorePages([makePage()], 5);
      expect(pm.currentPage).toBe(0);
    });

    it('creates default page for empty array', () => {
      const pm = new PageManager();
      pm.restorePages([], 0);
      expect(pm.pageCount).toBe(1);
    });
  });

  describe('reset', () => {
    it('resets to single empty page', () => {
      const pm = new PageManager();
      pm.addPage();
      pm.addPage();
      pm.switchTo(2);
      pm.reset();
      expect(pm.pageCount).toBe(1);
      expect(pm.currentPage).toBe(0);
    });
  });

  describe('page name', () => {
    it('getPageName returns undefined by default', () => {
      const pm = new PageManager();
      expect(pm.getPageName(0)).toBeUndefined();
    });

    it('setPageName stores and getPageName retrieves', () => {
      const pm = new PageManager();
      pm.setPageName(0, 'Front');
      expect(pm.getPageName(0)).toBe('Front');
    });

    it('setPageName ignores invalid index', () => {
      const pm = new PageManager();
      pm.setPageName(5, 'Nope');
      expect(pm.getPageName(5)).toBeUndefined();
    });
  });

  describe('page background color', () => {
    it('getPageBgColor returns undefined by default', () => {
      const pm = new PageManager();
      expect(pm.getPageBgColor(0)).toBeUndefined();
    });

    it('setPageBgColor stores and getPageBgColor retrieves', () => {
      const pm = new PageManager();
      pm.setPageBgColor(0, '#000000');
      expect(pm.getPageBgColor(0)).toBe('#000000');
    });

    it('setPageBgColor ignores invalid index', () => {
      const pm = new PageManager();
      pm.setPageBgColor(99, '#ff0000');
      expect(pm.getPageBgColor(99)).toBeUndefined();
    });
  });

  describe('page mark color', () => {
    it('getPageMarkColor returns undefined by default', () => {
      const pm = new PageManager();
      expect(pm.getPageMarkColor(0)).toBeUndefined();
    });

    it('setPageMarkColor stores and getPageMarkColor retrieves', () => {
      const pm = new PageManager();
      pm.setPageMarkColor(0, '#ffffff');
      expect(pm.getPageMarkColor(0)).toBe('#ffffff');
    });

    it('setPageMarkColor ignores invalid index', () => {
      const pm = new PageManager();
      pm.setPageMarkColor(-1, '#cc0000');
      expect(pm.getPageMarkColor(-1)).toBeUndefined();
    });
  });
});
