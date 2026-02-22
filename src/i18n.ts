import en, { type LocaleKey } from './locales/en';

type LocaleMap = Record<string, string>;

const locales: Record<string, LocaleMap> = { en };

let current: LocaleMap = en;
let currentLocale = 'en';

export function t(key: LocaleKey, vars?: Record<string, string | number>): string {
  let str = current[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return str;
}

export function setLocale(locale: string): void {
  const map = locales[locale];
  if (map) {
    current = map;
    currentLocale = locale;
    localStorage.setItem('selphyoto_locale', locale);
  }
}

export function getLocale(): string {
  return currentLocale;
}

export function registerLocale(code: string, map: LocaleMap): void {
  locales[code] = map;
}

export function detectLocale(): string {
  const saved = localStorage.getItem('selphyoto_locale');
  if (saved && locales[saved]) return saved;
  const browser = navigator.language.split('-')[0];
  if (locales[browser]) return browser;
  return 'en';
}

export function applyI18n(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n as LocaleKey;
    const val = t(key);
    if (val.includes('<')) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    const key = el.dataset.i18nTitle as LocaleKey;
    el.title = t(key);
  });
  document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder as LocaleKey;
    el.placeholder = t(key);
  });
  document.documentElement.lang = currentLocale;
}
