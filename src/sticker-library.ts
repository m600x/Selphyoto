export interface StickerDef {
  id: string;
  name: string;
  category: StickerCategory;
  url: string;
  tags: string;
}

export const STICKER_CATEGORIES = [
  'all', 'emoji', 'animals', 'nature', 'people', 'objects', 'symbols',
] as const;

export type StickerCategory = (typeof STICKER_CATEGORIES)[number];

type OpenMojiRow = {
  hexcode: string;
  annotation: string;
  group: string;
  subgroups: string;
  tags: string;
  skintone: string;
};

const OPENMOJI_VERSION = '15.1.0';
const OPENMOJI_BASE = `https://cdn.jsdelivr.net/npm/openmoji@${OPENMOJI_VERSION}`;

let stickersCache: StickerDef[] | null = null;
let loadingPromise: Promise<StickerDef[]> | null = null;

export const STICKER_GRID_PAGE_SIZE = 200;

function mapGroupToCategory(group: string, subgroup: string): StickerCategory | null {
  switch (group) {
    case 'smileys-emotion':
      return 'emoji';
    case 'animals-nature':
      return subgroup.startsWith('plant-') || subgroup.startsWith('sky-') ? 'nature' : 'animals';
    case 'people-body':
      return 'people';
    case 'food-drink':
    case 'activities':
    case 'objects':
      return 'objects';
    case 'travel-places':
      return 'objects';
    case 'symbols':
      return 'symbols';
    case 'flags':
      return 'symbols';
    case 'component':
      return null;
    default:
      return 'symbols';
  }
}

function toTitleCase(annotation: string): string {
  return annotation
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');
}

export async function loadStickers(): Promise<StickerDef[]> {
  if (stickersCache) return stickersCache;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const res = await fetch(`${OPENMOJI_BASE}/data/openmoji.json`);
    if (!res.ok) throw new Error(`Failed to load OpenMoji metadata: ${res.status}`);
    const data = (await res.json()) as OpenMojiRow[];

    const stickers: StickerDef[] = [];
    for (const row of data) {
      if (row.skintone) continue;
      const cat = mapGroupToCategory(row.group, row.subgroups);
      if (!cat) continue;

      stickers.push({
        id: row.hexcode.toLowerCase(),
        name: toTitleCase(row.annotation),
        category: cat,
        url: `${OPENMOJI_BASE}/color/svg/${row.hexcode}.svg`,
        tags: row.tags ?? '',
      });
    }

    stickersCache = stickers;
    return stickers;
  })();

  return loadingPromise;
}

export function isLoaded(): boolean {
  return stickersCache !== null;
}

export function getStickers(category?: StickerCategory): StickerDef[] {
  if (!stickersCache) return [];
  if (!category || category === 'all') return stickersCache;
  return stickersCache.filter((s) => s.category === category);
}

export function searchStickers(query: string): StickerDef[] {
  if (!stickersCache) return [];
  const q = query.toLowerCase().trim();
  if (!q) return stickersCache;
  return stickersCache.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.category.includes(q) ||
      s.tags.toLowerCase().includes(q),
  );
}

const RASTER_SIZE = 512;

export function fetchSvgAsDataUrl(svgUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = RASTER_SIZE;
      canvas.height = RASTER_SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, RASTER_SIZE, RASTER_SIZE);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`Failed to load SVG: ${svgUrl}`));
    img.src = svgUrl;
  });
}
