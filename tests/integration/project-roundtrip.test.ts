import { describe, it, expect, vi, beforeEach } from 'vitest';
import JSZip from 'jszip';
import { importProject, type ProjectManifest, type ProjectSettings } from '../../src/project-io';

function makeMockCM() {
  const state = {
    images: [] as Array<{
      filename: string; visible: boolean; locked: boolean; groupId?: string;
      left: number; top: number; scaleX: number; scaleY: number; angle: number;
    }>,
    groups: [] as Array<{ id: string; name: string; visible: boolean }>,
    correctionX: 0.961,
    correctionY: 0.961,
    backgroundColor: '#ffffff',
    markColor: '#cc0000',
    guidelinesVisible: true,
  };

  return {
    state,
    clearAll: vi.fn(() => {
      state.images = [];
      state.groups = [];
    }),
    addImageFromDataURL: vi.fn(async (_dataUrl: string, props: Record<string, unknown>) => {
      state.images.push({
        filename: props.filename as string,
        visible: props.visible as boolean,
        locked: (props.locked ?? false) as boolean,
        groupId: props.groupId as string | undefined,
        left: props.left as number,
        top: props.top as number,
        scaleX: props.scaleX as number,
        scaleY: props.scaleY as number,
        angle: props.angle as number,
      });
    }),
    restoreGroups: vi.fn((groups: Array<{ id: string; name: string; visible: boolean }>, _counter: number) => {
      state.groups = groups.map(g => ({ ...g }));
    }),
    setCorrectionX: vi.fn((v: number) => { state.correctionX = v; }),
    setCorrectionY: vi.fn((v: number) => { state.correctionY = v; }),
    setBackground: vi.fn((c: string) => { state.backgroundColor = c; }),
    setMarkColor: vi.fn((c: string) => { state.markColor = c; }),
    setGuidelinesVisible: vi.fn((v: boolean) => { state.guidelinesVisible = v; }),
    finalizeRestore: vi.fn(),
  };
}

async function buildProjectZip(manifest: ProjectManifest, imageData?: Record<string, string>): Promise<File> {
  const zip = new JSZip();
  zip.file('project.json', JSON.stringify(manifest));

  if (imageData) {
    const folder = zip.folder('images')!;
    for (const [name, base64] of Object.entries(imageData)) {
      folder.file(name, base64, { base64: true });
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return new File([blob], 'test_project.zip', { type: 'application/zip' });
}

const TINY_PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('project import', () => {
  let cm: ReturnType<typeof makeMockCM>;

  beforeEach(() => {
    cm = makeMockCM();
  });

  it('imports a valid project with images and groups', async () => {
    const manifest: ProjectManifest = {
      version: 1,
      images: [
        {
          file: 'images/0_photo.png',
          filename: 'photo.png',
          visible: true,
          locked: false,
          groupId: 'group-1',
          left: 10, top: 20, scaleX: 0.5, scaleY: 0.5, angle: 45,
        },
        {
          file: 'images/1_bg.png',
          filename: 'bg.png',
          visible: false,
          locked: true,
          groupId: null,
          left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
        },
      ],
      groups: [{ id: 'group-1', name: 'Layer Group', visible: true }],
      groupCounter: 1,
      settings: {
        correctionX: 0.95,
        correctionY: 0.96,
        backgroundColor: '#000000',
        markColor: '#ffffff',
        guidelinesVisible: false,
        exportFormat: 'jpeg',
      },
    };

    const file = await buildProjectZip(manifest, {
      '0_photo.png': TINY_PNG_B64,
      '1_bg.png': TINY_PNG_B64,
    });

    let appliedSettings: ProjectSettings | null = null;
    await importProject(file, cm as never, (s) => { appliedSettings = s; });

    expect(cm.clearAll).toHaveBeenCalled();
    expect(cm.addImageFromDataURL).toHaveBeenCalledTimes(2);

    expect(cm.state.images[0].filename).toBe('photo.png');
    expect(cm.state.images[0].scaleX).toBe(0.5);
    expect(cm.state.images[0].angle).toBe(45);
    expect(cm.state.images[0].groupId).toBe('group-1');

    expect(cm.state.images[1].filename).toBe('bg.png');
    expect(cm.state.images[1].locked).toBe(true);
    expect(cm.state.images[1].visible).toBe(false);

    expect(cm.restoreGroups).toHaveBeenCalledWith(
      [{ id: 'group-1', name: 'Layer Group', visible: true }],
      1,
    );

    expect(cm.setCorrectionX).toHaveBeenCalledWith(0.95);
    expect(cm.setCorrectionY).toHaveBeenCalledWith(0.96);
    expect(cm.setBackground).toHaveBeenCalledWith('#000000');
    expect(cm.setMarkColor).toHaveBeenCalledWith('#ffffff');
    expect(cm.setGuidelinesVisible).toHaveBeenCalledWith(false);
    expect(cm.finalizeRestore).toHaveBeenCalled();

    expect(appliedSettings).not.toBeNull();
    expect(appliedSettings!.exportFormat).toBe('jpeg');
  });

  it('throws on missing project.json', async () => {
    const zip = new JSZip();
    zip.file('random.txt', 'hello');
    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'bad.zip', { type: 'application/zip' });

    await expect(importProject(file, cm as never, vi.fn())).rejects.toThrow('Invalid project: missing project.json');
  });

  it('throws on unsupported version', async () => {
    const manifest = { version: 99, images: [], groups: [], groupCounter: 0, settings: {} };
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify(manifest));
    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'future.zip', { type: 'application/zip' });

    await expect(importProject(file, cm as never, vi.fn())).rejects.toThrow('Unsupported project version: 99');
  });

  it('skips missing images gracefully', async () => {
    const manifest: ProjectManifest = {
      version: 1,
      images: [
        { file: 'images/missing.png', filename: 'missing.png', visible: true, locked: false, groupId: null, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0 },
        { file: 'images/exists.png', filename: 'exists.png', visible: true, locked: false, groupId: null, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0 },
      ],
      groups: [],
      groupCounter: 0,
      settings: { correctionX: 0.961, correctionY: 0.961, backgroundColor: '#ffffff', markColor: '#cc0000', guidelinesVisible: true, exportFormat: 'png' },
    };

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const file = await buildProjectZip(manifest, { 'exists.png': TINY_PNG_B64 });
    await importProject(file, cm as never, vi.fn());

    expect(cm.addImageFromDataURL).toHaveBeenCalledTimes(1);
    expect(cm.state.images[0].filename).toBe('exists.png');
    consoleSpy.mockRestore();
  });

  it('handles project with no images', async () => {
    const manifest: ProjectManifest = {
      version: 1,
      images: [],
      groups: [{ id: 'group-1', name: 'Empty', visible: true }],
      groupCounter: 1,
      settings: { correctionX: 0.961, correctionY: 0.961, backgroundColor: '#ffffff', markColor: '#cc0000', guidelinesVisible: true, exportFormat: 'png' },
    };

    const file = await buildProjectZip(manifest);
    await importProject(file, cm as never, vi.fn());

    expect(cm.addImageFromDataURL).not.toHaveBeenCalled();
    expect(cm.restoreGroups).toHaveBeenCalled();
  });
});
