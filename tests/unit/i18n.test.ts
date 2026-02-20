import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { t, setLocale, getLocale, registerLocale, detectLocale, applyI18n } from '../../src/i18n';

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear();
    setLocale('en');
  });

  describe('t', () => {
    it('returns value for known key', () => {
      expect(t('page.title')).toContain('Selph\'Yoto');
    });

    it('returns the key itself for unknown key', () => {
      expect(t('nonexistent.key' as never)).toBe('nonexistent.key');
    });

    it('interpolates variables', () => {
      expect(t('page.label', { n: 3 })).toBe('Page 3');
    });

    it('interpolates multiple variables', () => {
      const result = t('autosave.secondsAgo', { seconds: 15 });
      expect(result).toBe('Autosaved 15s ago');
    });
  });

  describe('setLocale / getLocale', () => {
    it('defaults to en', () => {
      expect(getLocale()).toBe('en');
    });

    it('switches locale and persists to localStorage', () => {
      registerLocale('fr', { 'page.title': 'Titre FR' } as never);
      setLocale('fr');
      expect(getLocale()).toBe('fr');
      expect(localStorage.getItem('selphyoto_locale')).toBe('fr');
    });

    it('t returns value from active locale', () => {
      registerLocale('es', { 'page.title': 'Titulo ES' } as never);
      setLocale('es');
      expect(t('page.title')).toBe('Titulo ES');
    });

    it('t falls back to en for missing keys in non-en locale', () => {
      registerLocale('de', {} as never);
      setLocale('de');
      expect(t('page.title')).toContain('Selph\'Yoto');
    });

    it('ignores unknown locale codes', () => {
      setLocale('xx');
      expect(getLocale()).toBe('en');
    });
  });

  describe('registerLocale', () => {
    it('makes a new locale available', () => {
      registerLocale('ja', { 'page.title': 'ジャパン' } as never);
      setLocale('ja');
      expect(t('page.title')).toBe('ジャパン');
    });
  });

  describe('detectLocale', () => {
    afterEach(() => {
      localStorage.clear();
    });

    it('returns saved locale from localStorage', () => {
      registerLocale('fr', { 'page.title': 'FR' } as never);
      localStorage.setItem('selphyoto_locale', 'fr');
      expect(detectLocale()).toBe('fr');
    });

    it('ignores saved locale if not registered', () => {
      localStorage.setItem('selphyoto_locale', 'zz');
      const result = detectLocale();
      expect(['en', navigator.language.split('-')[0]]).toContain(result);
    });

    it('falls back to en when browser language is not registered', () => {
      expect(detectLocale()).toBeDefined();
    });
  });

  describe('applyI18n', () => {
    beforeEach(() => {
      setLocale('en');
    });

    it('sets textContent on elements with data-i18n', () => {
      document.body.innerHTML = '<span data-i18n="toolbar.undo">placeholder</span>';
      applyI18n();
      const el = document.querySelector('[data-i18n="toolbar.undo"]')!;
      expect(el.textContent).toBe('Undo (Ctrl+Z)');
    });

    it('sets innerHTML when value contains HTML', () => {
      document.body.innerHTML = '<p data-i18n="sidebar.emptyMsg">placeholder</p>';
      applyI18n();
      const el = document.querySelector('[data-i18n="sidebar.emptyMsg"]')!;
      expect(el.innerHTML).toContain('<br');
    });

    it('sets title on elements with data-i18n-title', () => {
      document.body.innerHTML = '<button data-i18n-title="toolbar.flipH" title="">btn</button>';
      applyI18n();
      const el = document.querySelector('[data-i18n-title="toolbar.flipH"]') as HTMLElement;
      expect(el.title).toBe('Flip horizontal');
    });

    it('sets document language', () => {
      applyI18n();
      expect(document.documentElement.lang).toBe('en');
    });

    it('updates language after locale switch', () => {
      registerLocale('fr', { 'toolbar.undo': 'Annuler' } as never);
      setLocale('fr');
      document.body.innerHTML = '<span data-i18n="toolbar.undo">placeholder</span>';
      applyI18n();
      const el = document.querySelector('[data-i18n="toolbar.undo"]')!;
      expect(el.textContent).toBe('Annuler');
      expect(document.documentElement.lang).toBe('fr');
    });
  });
});
