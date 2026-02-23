import JSZip from 'jszip';
import type { Textbox } from 'fabric';
import type { CanvasManager, GroupEntry, ImageFilters, ImageEffects } from './canvas-manager';
import type { PageData } from './page-manager';
import type { AutoSaveImage } from './auto-save';
import { timestamp, sanitizeFilename } from './utils';

export interface ProjectImageEntry {
  type?: 'image' | 'text';
  file: string;
  filename: string;
  visible: boolean;
  locked: boolean;
  groupId: string | null;
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  flipX?: boolean;
  flipY?: boolean;
  opacity?: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  width?: number;
  filters?: ImageFilters;
  effects?: ImageEffects;
}

export interface ProjectSettings {
  correctionX: number;
  correctionY: number;
  backgroundColor: string;
  markColor: string;
  outlineVisible: boolean;
  centerLinesVisible: boolean;
  guidelinesVisible?: boolean;
  calibrationVisible?: boolean;
  designRulerVisible?: boolean;
  gridVisible?: boolean;
  gridSizeMm?: number;
  gridSnapEnabled?: boolean;
  exportFormat: 'png' | 'jpeg';
}

export interface ProjectPage {
  images: ProjectImageEntry[];
  groups: GroupEntry[];
  groupCounter: number;
  textCounter: number;
}

export interface ProjectManifest {
  version: 1;
  pages?: ProjectPage[];
  images: ProjectImageEntry[];
  groups: GroupEntry[];
  groupCounter: number;
  textCounter?: number;
  settings: ProjectSettings;
}

function migrateGuideSettings(s: ProjectSettings): void {
  if (s.outlineVisible === undefined && s.guidelinesVisible !== undefined) {
    s.outlineVisible = s.guidelinesVisible;
    s.centerLinesVisible = s.guidelinesVisible;
  }
  if (s.outlineVisible === undefined) s.outlineVisible = true;
  if (s.centerLinesVisible === undefined) s.centerLinesVisible = false;
}

function serializeCanvasPage(
  cm: CanvasManager,
  imagesFolder: JSZip,
  pagePrefix: string,
): { manifestImages: ProjectImageEntry[]; groups: GroupEntry[]; groupCounter: number; textCounter: number } {
  const images = cm.images;
  const manifestImages: ProjectImageEntry[] = [];

  for (let i = 0; i < images.length; i++) {
    const entry = images[i];
    const fi = entry.fabricImage;

    if (entry.type === 'text') {
      const tb = fi as unknown as Textbox;
      manifestImages.push({
        type: 'text',
        file: '',
        filename: entry.filename,
        visible: entry.visible,
        locked: entry.locked ?? false,
        groupId: entry.groupId ?? null,
        left: fi.left ?? 0,
        top: fi.top ?? 0,
        scaleX: fi.scaleX ?? 1,
        scaleY: fi.scaleY ?? 1,
        angle: fi.angle ?? 0,
        flipX: fi.flipX ?? false,
        flipY: fi.flipY ?? false,
        opacity: fi.opacity ?? 1,
        text: tb.text ?? '',
        fontFamily: (tb.fontFamily as string) ?? 'Arial',
        fontSize: tb.fontSize ?? 40,
        fill: (tb.fill as string) ?? '#000000',
        fontWeight: (tb.fontWeight as string) ?? 'normal',
        fontStyle: (tb.fontStyle as string) ?? 'normal',
        textAlign: (tb.textAlign as string) ?? 'center',
        width: tb.width ?? 200,
        filters: entry.filters,
        effects: entry.effects,
      });
      continue;
    }

    const ext = 'png';
    const safeName = sanitizeFilename(entry.filename);
    const zipPath = `${pagePrefix}${i}_${safeName}${safeName.includes('.') ? '' : '.' + ext}`;

    const origSx = fi.scaleX ?? 1;
    const origSy = fi.scaleY ?? 1;
    const origAngle = fi.angle ?? 0;
    fi.set({ scaleX: 1, scaleY: 1, angle: 0 });
    const dataUrl = fi.toDataURL({ format: 'png' as const });
    fi.set({ scaleX: origSx, scaleY: origSy, angle: origAngle });
    const base64 = dataUrl.split(',')[1];
    imagesFolder.file(zipPath, base64, { base64: true });

    manifestImages.push({
      type: 'image',
      file: `images/${zipPath}`,
      filename: entry.filename,
      visible: entry.visible,
      locked: entry.locked ?? false,
      groupId: entry.groupId ?? null,
      left: fi.left ?? 0,
      top: fi.top ?? 0,
      scaleX: fi.scaleX ?? 1,
      scaleY: fi.scaleY ?? 1,
      angle: fi.angle ?? 0,
      flipX: fi.flipX ?? false,
      flipY: fi.flipY ?? false,
      opacity: fi.opacity ?? 1,
      filters: entry.filters,
      effects: entry.effects,
    });
  }

  return {
    manifestImages,
    groups: cm.groups.map(g => ({ ...g })),
    groupCounter: cm.groups.length,
    textCounter: cm.getTextCounter(),
  };
}

function serializePageData(
  page: PageData,
  imagesFolder: JSZip,
  pagePrefix: string,
): ProjectPage {
  const manifestImages: ProjectImageEntry[] = [];

  for (let i = 0; i < page.images.length; i++) {
    const img = page.images[i];

    if ((img.type ?? 'image') === 'text') {
      manifestImages.push({
        type: 'text',
        file: '',
        filename: img.filename,
        visible: img.visible,
        locked: img.locked ?? false,
        groupId: img.groupId ?? null,
        left: img.left,
        top: img.top,
        scaleX: img.scaleX,
        scaleY: img.scaleY,
        angle: img.angle,
        flipX: img.flipX ?? false,
        flipY: img.flipY ?? false,
        opacity: img.opacity ?? 1,
        text: img.text ?? '',
        fontFamily: img.fontFamily ?? 'Arial',
        fontSize: img.fontSize ?? 40,
        fill: img.fill ?? '#000000',
        fontWeight: img.fontWeight ?? 'normal',
        fontStyle: img.fontStyle ?? 'normal',
        textAlign: img.textAlign ?? 'center',
        width: img.width ?? 200,
        filters: img.filters,
        effects: img.effects,
      });
      continue;
    }

    const ext = 'png';
    const safeName = sanitizeFilename(img.filename);
    const zipPath = `${pagePrefix}${i}_${safeName}${safeName.includes('.') ? '' : '.' + ext}`;

    const base64 = img.dataUrl.split(',')[1];
    if (base64) {
      imagesFolder.file(zipPath, base64, { base64: true });
    }

    manifestImages.push({
      type: 'image',
      file: `images/${zipPath}`,
      filename: img.filename,
      visible: img.visible,
      locked: img.locked ?? false,
      groupId: img.groupId ?? null,
      left: img.left,
      top: img.top,
      scaleX: img.scaleX,
      scaleY: img.scaleY,
      angle: img.angle,
      flipX: img.flipX ?? false,
      flipY: img.flipY ?? false,
      opacity: img.opacity ?? 1,
      filters: img.filters,
      effects: img.effects,
    });
  }

  return {
    images: manifestImages,
    groups: page.groups.map(g => ({ ...g })),
    groupCounter: page.groupCounter,
    textCounter: page.textCounter,
  };
}

export async function exportProject(
  cm: CanvasManager,
  uiState: { exportFormat: 'png' | 'jpeg' },
  otherPages?: PageData[],
  currentPageIndex?: number,
): Promise<void> {
  const zip = new JSZip();
  const imagesFolder = zip.folder('images')!;

  const totalPages = otherPages ? otherPages.length : 1;
  const isMultiPage = totalPages > 1;

  if (isMultiPage && otherPages) {
    const pages: ProjectPage[] = [];
    for (let p = 0; p < otherPages.length; p++) {
      if (p === (currentPageIndex ?? 0)) {
        const result = serializeCanvasPage(cm, imagesFolder, `p${p}_`);
        pages.push({
          images: result.manifestImages,
          groups: result.groups,
          groupCounter: result.groupCounter,
          textCounter: result.textCounter,
        });
      } else {
        pages.push(serializePageData(otherPages[p], imagesFolder, `p${p}_`));
      }
    }

    const page0 = pages[0];
    const manifest: ProjectManifest = {
      version: 1,
      pages,
      images: page0.images,
      groups: page0.groups,
      groupCounter: page0.groupCounter,
      textCounter: page0.textCounter,
      settings: {
        correctionX: cm.getCorrectionX(),
        correctionY: cm.getCorrectionY(),
        backgroundColor: cm.getBackgroundColor(),
        markColor: cm.getMarkColor(),
        outlineVisible: cm.getOutlineVisible(),
        centerLinesVisible: cm.getCenterLinesVisible(),
        calibrationVisible: cm.getCalibrationVisible(),
        designRulerVisible: cm.getDesignRulerVisible(),
        gridVisible: cm.getGridVisible(),
        gridSizeMm: cm.getGridSizeMm(),
        gridSnapEnabled: cm.getGridSnapEnabled(),
        exportFormat: uiState.exportFormat,
      },
    };

    zip.file('project.json', JSON.stringify(manifest, null, 2));
  } else {
    const result = serializeCanvasPage(cm, imagesFolder, '');
    const manifest: ProjectManifest = {
      version: 1,
      images: result.manifestImages,
      groups: result.groups,
      groupCounter: result.groupCounter,
      textCounter: result.textCounter,
      settings: {
        correctionX: cm.getCorrectionX(),
        correctionY: cm.getCorrectionY(),
        backgroundColor: cm.getBackgroundColor(),
        markColor: cm.getMarkColor(),
        outlineVisible: cm.getOutlineVisible(),
        centerLinesVisible: cm.getCenterLinesVisible(),
        calibrationVisible: cm.getCalibrationVisible(),
        designRulerVisible: cm.getDesignRulerVisible(),
        gridVisible: cm.getGridVisible(),
        gridSizeMm: cm.getGridSizeMm(),
        gridSnapEnabled: cm.getGridSnapEnabled(),
        exportFormat: uiState.exportFormat,
      },
    };

    zip.file('project.json', JSON.stringify(manifest, null, 2));
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.download = `selphyoto_project_${timestamp()}.zip`;
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export interface ImportResult {
  pages: PageData[];
  settings: ProjectSettings;
}

export async function importProject(
  file: File,
  cm: CanvasManager,
  applyUI: (settings: ProjectSettings) => void,
): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(file);
  const manifestFile = zip.file('project.json');
  if (!manifestFile) throw new Error('Invalid project: missing project.json');

  const manifestText = await manifestFile.async('string');
  const manifest: ProjectManifest = JSON.parse(manifestText);

  if (manifest.version !== 1) {
    throw new Error(`Unsupported project version: ${manifest.version}`);
  }

  const isMultiPage = manifest.pages && manifest.pages.length > 0;

  if (isMultiPage) {
    const resultPages: PageData[] = [];
    for (let p = 0; p < manifest.pages!.length; p++) {
      const page = manifest.pages![p];
      const pageData = await loadPageFromManifest(page.images, zip);
      resultPages.push({
        images: pageData,
        groups: page.groups,
        groupCounter: page.groupCounter,
        textCounter: page.textCounter ?? 0,
      });
    }

    // Load first page into canvas
    cm.clearAll();
    await loadImagesIntoCanvas(cm, resultPages[0]);

    cm.setCorrectionX(manifest.settings.correctionX);
    cm.setCorrectionY(manifest.settings.correctionY);
    cm.setBackground(manifest.settings.backgroundColor);
    cm.setMarkColor(manifest.settings.markColor);
    migrateGuideSettings(manifest.settings);
    cm.setOutlineVisible(manifest.settings.outlineVisible);
    cm.setCenterLinesVisible(manifest.settings.centerLinesVisible);
    if (manifest.settings.calibrationVisible !== undefined)
      cm.setCalibrationVisible(manifest.settings.calibrationVisible);
    if (manifest.settings.designRulerVisible !== undefined)
      cm.setDesignRulerVisible(manifest.settings.designRulerVisible);
    if (manifest.settings.gridVisible !== undefined)
      cm.setGridVisible(manifest.settings.gridVisible);
    if (manifest.settings.gridSizeMm !== undefined)
      cm.setGridSizeMm(manifest.settings.gridSizeMm);
    if (manifest.settings.gridSnapEnabled !== undefined)
      cm.setGridSnapEnabled(manifest.settings.gridSnapEnabled);
    cm.finalizeRestore();
    applyUI(manifest.settings);

    return { pages: resultPages, settings: manifest.settings };
  }

  // Single-page legacy
  cm.clearAll();
  const pageData = await loadPageFromManifest(manifest.images, zip);
  const singlePage: PageData = {
    images: pageData,
    groups: manifest.groups,
    groupCounter: manifest.groupCounter,
    textCounter: manifest.textCounter ?? 0,
  };

  await loadImagesIntoCanvas(cm, singlePage);

  const maxCounter = manifest.groupCounter ??
    manifest.groups.reduce((max, g) => {
      const num = parseInt(g.id.replace('group-', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);

  cm.restoreGroups(manifest.groups, maxCounter);
  cm.setCorrectionX(manifest.settings.correctionX);
  cm.setCorrectionY(manifest.settings.correctionY);
  cm.setBackground(manifest.settings.backgroundColor);
  cm.setMarkColor(manifest.settings.markColor);
  migrateGuideSettings(manifest.settings);
  cm.setOutlineVisible(manifest.settings.outlineVisible);
  cm.setCenterLinesVisible(manifest.settings.centerLinesVisible);
  if (manifest.settings.calibrationVisible !== undefined)
    cm.setCalibrationVisible(manifest.settings.calibrationVisible);
  if (manifest.settings.designRulerVisible !== undefined)
    cm.setDesignRulerVisible(manifest.settings.designRulerVisible);
  if (manifest.settings.gridVisible !== undefined)
    cm.setGridVisible(manifest.settings.gridVisible);
  if (manifest.settings.gridSizeMm !== undefined)
    cm.setGridSizeMm(manifest.settings.gridSizeMm);
  if (manifest.settings.gridSnapEnabled !== undefined)
    cm.setGridSnapEnabled(manifest.settings.gridSnapEnabled);
  cm.finalizeRestore();
  applyUI(manifest.settings);

  return { pages: [singlePage], settings: manifest.settings };
}

async function loadPageFromManifest(
  entries: ProjectImageEntry[],
  zip: JSZip,
): Promise<AutoSaveImage[]> {
  const result: AutoSaveImage[] = [];

  for (const imgEntry of entries) {
    if ((imgEntry.type ?? 'image') === 'text') {
      result.push({
        type: 'text',
        dataUrl: '',
        filename: imgEntry.filename,
        visible: imgEntry.visible,
        locked: imgEntry.locked ?? false,
        groupId: imgEntry.groupId ?? null,
        left: imgEntry.left,
        top: imgEntry.top,
        scaleX: imgEntry.scaleX,
        scaleY: imgEntry.scaleY,
        angle: imgEntry.angle,
        flipX: imgEntry.flipX ?? false,
        flipY: imgEntry.flipY ?? false,
        opacity: imgEntry.opacity ?? 1,
        text: imgEntry.text ?? 'Text',
        fontFamily: imgEntry.fontFamily ?? 'Arial',
        fontSize: imgEntry.fontSize ?? 40,
        fill: imgEntry.fill ?? '#000000',
        fontWeight: imgEntry.fontWeight ?? 'normal',
        fontStyle: imgEntry.fontStyle ?? 'normal',
        textAlign: imgEntry.textAlign ?? 'center',
        width: imgEntry.width ?? 200,
        filters: imgEntry.filters,
        effects: imgEntry.effects,
      });
      continue;
    }

    const imgFile = zip.file(imgEntry.file);
    if (!imgFile) {
      console.warn(`Missing image in zip: ${imgEntry.file}`);
      continue;
    }

    const imgBlob = await imgFile.async('blob');
    const dataUrl = await blobToDataURL(imgBlob);

    result.push({
      type: 'image',
      dataUrl,
      filename: imgEntry.filename,
      visible: imgEntry.visible,
      locked: imgEntry.locked ?? false,
      groupId: imgEntry.groupId ?? null,
      left: imgEntry.left,
      top: imgEntry.top,
      scaleX: imgEntry.scaleX,
      scaleY: imgEntry.scaleY,
      angle: imgEntry.angle,
      flipX: imgEntry.flipX ?? false,
      flipY: imgEntry.flipY ?? false,
      opacity: imgEntry.opacity ?? 1,
      filters: imgEntry.filters,
      effects: imgEntry.effects,
    });
  }

  return result;
}

async function loadImagesIntoCanvas(cm: CanvasManager, page: PageData): Promise<void> {
  for (const img of page.images) {
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
      if (img.filters) {
        cm.setImageFilters(cm.images.length - 1, img.filters);
      }
      if (img.effects) {
        cm.setImageEffects(cm.images.length - 1, img.effects);
      }
      continue;
    }

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
    if (img.effects) {
      cm.setImageEffects(cm.images.length - 1, img.effects);
    }
  }

  cm.restoreGroups(page.groups, page.groupCounter);
  if (page.textCounter) cm.setTextCounter(page.textCounter);
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
