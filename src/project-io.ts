import JSZip from 'jszip';
import type { Textbox } from 'fabric';
import type { CanvasManager, GroupEntry } from './canvas-manager';
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
}

export interface ProjectSettings {
  correctionX: number;
  correctionY: number;
  backgroundColor: string;
  markColor: string;
  guidelinesVisible: boolean;
  exportFormat: 'png' | 'jpeg';
}

export interface ProjectManifest {
  version: 1;
  images: ProjectImageEntry[];
  groups: GroupEntry[];
  groupCounter: number;
  textCounter?: number;
  settings: ProjectSettings;
}

export async function exportProject(
  cm: CanvasManager,
  uiState: { exportFormat: 'png' | 'jpeg' },
): Promise<void> {
  const zip = new JSZip();
  const imagesFolder = zip.folder('images')!;
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
      });
      continue;
    }

    const ext = 'png';
    const safeName = sanitizeFilename(entry.filename);
    const zipPath = `${i}_${safeName}${safeName.includes('.') ? '' : '.' + ext}`;

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
    });
  }

  const manifest: ProjectManifest = {
    version: 1,
    images: manifestImages,
    groups: cm.groups.map(g => ({ ...g })),
    groupCounter: cm.groups.length,
    textCounter: cm.getTextCounter(),
    settings: {
      correctionX: cm.getCorrectionX(),
      correctionY: cm.getCorrectionY(),
      backgroundColor: cm.getBackgroundColor(),
      markColor: cm.getMarkColor(),
      guidelinesVisible: cm.getGuidelinesVisible(),
      exportFormat: uiState.exportFormat,
    },
  };

  zip.file('project.json', JSON.stringify(manifest, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.download = `selphyoto_project_${timestamp()}.zip`;
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export async function importProject(
  file: File,
  cm: CanvasManager,
  applyUI: (settings: ProjectSettings) => void,
): Promise<void> {
  const zip = await JSZip.loadAsync(file);
  const manifestFile = zip.file('project.json');
  if (!manifestFile) throw new Error('Invalid project: missing project.json');

  const manifestText = await manifestFile.async('string');
  const manifest: ProjectManifest = JSON.parse(manifestText);

  if (manifest.version !== 1) {
    throw new Error(`Unsupported project version: ${manifest.version}`);
  }

  cm.clearAll();

  for (const imgEntry of manifest.images) {
    if ((imgEntry.type ?? 'image') === 'text') {
      cm.addTextLayer({
        filename: imgEntry.filename,
        text: imgEntry.text ?? 'Text',
        fontFamily: imgEntry.fontFamily ?? 'Arial',
        fontSize: imgEntry.fontSize ?? 40,
        fill: imgEntry.fill ?? '#000000',
        fontWeight: imgEntry.fontWeight ?? 'normal',
        fontStyle: imgEntry.fontStyle ?? 'normal',
        textAlign: imgEntry.textAlign ?? 'center',
        visible: imgEntry.visible,
        locked: imgEntry.locked ?? false,
        groupId: imgEntry.groupId ?? undefined,
        left: imgEntry.left,
        top: imgEntry.top,
        scaleX: imgEntry.scaleX,
        scaleY: imgEntry.scaleY,
        angle: imgEntry.angle,
        flipX: imgEntry.flipX ?? false,
        flipY: imgEntry.flipY ?? false,
        opacity: imgEntry.opacity ?? 1,
        width: imgEntry.width,
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

    await cm.addImageFromDataURL(dataUrl, {
      filename: imgEntry.filename,
      visible: imgEntry.visible,
      locked: imgEntry.locked ?? false,
      groupId: imgEntry.groupId ?? undefined,
      left: imgEntry.left,
      top: imgEntry.top,
      scaleX: imgEntry.scaleX,
      scaleY: imgEntry.scaleY,
      angle: imgEntry.angle,
      flipX: imgEntry.flipX ?? false,
      flipY: imgEntry.flipY ?? false,
      opacity: imgEntry.opacity ?? 1,
    });
  }

  if (manifest.textCounter) cm.setTextCounter(manifest.textCounter);

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
  cm.setGuidelinesVisible(manifest.settings.guidelinesVisible);
  cm.finalizeRestore();

  applyUI(manifest.settings);
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
