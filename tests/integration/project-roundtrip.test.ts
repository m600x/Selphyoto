import { describe, it, expect, mock, spyOn, beforeEach } from 'bun:test';
import JSZip from 'jszip';
import { importProject, type ProjectManifest, type ProjectSettings } from '../../src/project-io';

function makeMockCM() {
  const state = {
    images: [] as Array<{
      type: string; filename: string; visible: boolean; locked: boolean; groupId?: string;
      left: number; top: number; scaleX: number; scaleY: number; angle: number;
      flipX: boolean; flipY: boolean; opacity: number;
      text?: string; fontFamily?: string; fontSize?: number; fill?: string;
      fontWeight?: string; fontStyle?: string; width?: number;
    }>,
    groups: [] as Array<{ id: string; name: string; visible: boolean }>,
    correctionX: 0.961,
    correctionY: 0.961,
    backgroundColor: '#ffffff',
    markColor: '#cc0000',
    guidelinesVisible: true,
    textCounter: 0,
  };

  return {
    state,
    clearAll: mock(() => {
      state.images = [];
      state.groups = [];
    }),
    addImageFromDataURL: mock(async (_dataUrl: string, props: Record<string, unknown>) => {
      state.images.push({
        type: 'image',
        filename: props.filename as string,
        visible: props.visible as boolean,
        locked: (props.locked ?? false) as boolean,
        groupId: props.groupId as string | undefined,
        left: props.left as number,
        top: props.top as number,
        scaleX: props.scaleX as number,
        scaleY: props.scaleY as number,
        angle: props.angle as number,
        flipX: (props.flipX ?? false) as boolean,
        flipY: (props.flipY ?? false) as boolean,
        opacity: (props.opacity ?? 1) as number,
      });
    }),
    addTextLayer: mock((props: Record<string, unknown>) => {
      state.images.push({
        type: 'text',
        filename: props.filename as string,
        visible: props.visible as boolean,
        locked: (props.locked ?? false) as boolean,
        groupId: props.groupId as string | undefined,
        left: props.left as number,
        top: props.top as number,
        scaleX: props.scaleX as number,
        scaleY: props.scaleY as number,
        angle: props.angle as number,
        flipX: (props.flipX ?? false) as boolean,
        flipY: (props.flipY ?? false) as boolean,
        opacity: (props.opacity ?? 1) as number,
        text: props.text as string,
        fontFamily: props.fontFamily as string,
        fontSize: props.fontSize as number,
        fill: props.fill as string,
        fontWeight: props.fontWeight as string,
        fontStyle: props.fontStyle as string,
        width: props.width as number | undefined,
      });
    }),
    restoreGroups: mock((groups: Array<{ id: string; name: string; visible: boolean }>, _counter: number) => {
      state.groups = groups.map(g => ({ ...g }));
    }),
    setCorrectionX: mock((v: number) => { state.correctionX = v; }),
    setCorrectionY: mock((v: number) => { state.correctionY = v; }),
    setBackground: mock((c: string) => { state.backgroundColor = c; }),
    setMarkColor: mock((c: string) => { state.markColor = c; }),
    setGuidelinesVisible: mock((v: boolean) => { state.guidelinesVisible = v; }),
    setTextCounter: mock((v: number) => { state.textCounter = v; }),
    getTextCounter: mock(() => state.textCounter),
    finalizeRestore: mock(() => {}),
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
          flipX: true, flipY: false, opacity: 0.8,
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
    expect(cm.state.images[0].flipX).toBe(true);
    expect(cm.state.images[0].flipY).toBe(false);
    expect(cm.state.images[0].opacity).toBe(0.8);

    expect(cm.state.images[1].filename).toBe('bg.png');
    expect(cm.state.images[1].locked).toBe(true);
    expect(cm.state.images[1].visible).toBe(false);
    expect(cm.state.images[1].flipX).toBe(false);
    expect(cm.state.images[1].flipY).toBe(false);
    expect(cm.state.images[1].opacity).toBe(1);

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

    await expect(importProject(file, cm as never, mock(() => {}))).rejects.toThrow('Invalid project: missing project.json');
  });

  it('throws on unsupported version', async () => {
    const manifest = { version: 99, images: [], groups: [], groupCounter: 0, settings: {} };
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify(manifest));
    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'future.zip', { type: 'application/zip' });

    await expect(importProject(file, cm as never, mock(() => {}))).rejects.toThrow('Unsupported project version: 99');
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

    const consoleSpy = spyOn(console, 'warn').mockImplementation(() => {});
    const file = await buildProjectZip(manifest, { 'exists.png': TINY_PNG_B64 });
    await importProject(file, cm as never, mock(() => {}));

    expect(cm.addImageFromDataURL).toHaveBeenCalledTimes(1);
    expect(cm.state.images[0].filename).toBe('exists.png');
    consoleSpy.mockRestore();
  });

  it('imports text layers from project', async () => {
    const manifest: ProjectManifest = {
      version: 1,
      images: [
        {
          type: 'text',
          file: '',
          filename: 'Text 1',
          visible: true,
          locked: false,
          groupId: null,
          left: 100, top: 200, scaleX: 1, scaleY: 1, angle: 0,
          flipX: false, flipY: false, opacity: 0.9,
          text: 'Hello World',
          fontFamily: 'Georgia',
          fontSize: 60,
          fill: '#ff0000',
          fontWeight: 'bold',
          fontStyle: 'italic',
          textAlign: 'right',
          width: 300,
        },
        {
          file: 'images/0_bg.png',
          filename: 'bg.png',
          visible: true,
          locked: false,
          groupId: null,
          left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
        },
      ],
      groups: [],
      groupCounter: 0,
      textCounter: 1,
      settings: { correctionX: 0.961, correctionY: 0.961, backgroundColor: '#ffffff', markColor: '#cc0000', guidelinesVisible: true, exportFormat: 'png' },
    };

    const file = await buildProjectZip(manifest, { '0_bg.png': TINY_PNG_B64 });
    await importProject(file, cm as never, mock(() => {}));

    expect(cm.addTextLayer).toHaveBeenCalledTimes(1);
    expect(cm.addImageFromDataURL).toHaveBeenCalledTimes(1);
    expect(cm.state.images[0].type).toBe('text');
    expect(cm.state.images[0].text).toBe('Hello World');
    expect(cm.state.images[0].fontFamily).toBe('Georgia');
    expect(cm.state.images[1].type).toBe('image');
    expect(cm.setTextCounter).toHaveBeenCalledWith(1);
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
    await importProject(file, cm as never, mock(() => {}));

    expect(cm.addImageFromDataURL).not.toHaveBeenCalled();
    expect(cm.restoreGroups).toHaveBeenCalled();
  });
});
