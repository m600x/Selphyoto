import { describe, it, expect, mock, spyOn, beforeEach } from 'bun:test';
import JSZip from 'jszip';
import { importProject, exportProject, type ProjectManifest, type ProjectSettings } from '../../src/project-io';
import type { PageData } from '../../src/page-manager';

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
    outlineVisible: true,
    centerLinesVisible: false,
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
    setOutlineVisible: mock((v: boolean) => { state.outlineVisible = v; }),
    setCenterLinesVisible: mock((v: boolean) => { state.centerLinesVisible = v; }),
    setTextCounter: mock((v: number) => { state.textCounter = v; }),
    getTextCounter: mock(() => state.textCounter),
    finalizeRestore: mock(() => {}),
  };
}

function makeFabricImage(overrides: Record<string, unknown> = {}) {
  const props: Record<string, unknown> = {
    left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0,
    flipX: false, flipY: false, opacity: 1,
    width: 100, height: 100,
    ...overrides,
  };
  return {
    ...props,
    set(key: string | Record<string, unknown>, val?: unknown) {
      if (typeof key === 'string') props[key] = val;
      else Object.assign(props, key);
      Object.assign(this, props);
    },
    toDataURL() { return 'data:image/png;base64,TESTDATA'; },
    setCoords() {},
  };
}

function makeExportCM(overrides: Partial<{
  images: Array<{
    type?: 'image' | 'text';
    fabricImage: ReturnType<typeof makeFabricImage>;
    filename: string;
    visible: boolean;
    locked: boolean;
    groupId?: string;
    originalDataUrl: string;
  }>;
  groups: Array<{ id: string; name: string; visible: boolean }>;
  textCounter: number;
  corrX: number;
  corrY: number;
  bgColor: string;
  markColor: string;
  outlineVisible: boolean;
  centerLinesVisible: boolean;
}> = {}) {
  const images = overrides.images ?? [];
  const groups = overrides.groups ?? [];
  return {
    images,
    groups,
    getGroupCounter: mock(() => groups.length),
    getTextCounter: mock(() => overrides.textCounter ?? 0),
    getCorrectionX: mock(() => overrides.corrX ?? 0.961),
    getCorrectionY: mock(() => overrides.corrY ?? 0.961),
    getBackgroundColor: mock(() => overrides.bgColor ?? '#ffffff'),
    getMarkColor: mock(() => overrides.markColor ?? '#cc0000'),
    getOutlineVisible: mock(() => overrides.outlineVisible ?? true),
    getCenterLinesVisible: mock(() => overrides.centerLinesVisible ?? false),
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

async function captureExportedZip(fn: () => Promise<void>): Promise<JSZip> {
  let capturedBlob: Blob | null = null;
  const origCreateObjectURL = URL.createObjectURL;
  URL.createObjectURL = (blob: Blob) => {
    capturedBlob = blob;
    return 'blob:test';
  };
  try {
    await fn();
  } finally {
    URL.createObjectURL = origCreateObjectURL;
  }
  if (!capturedBlob) throw new Error('No blob captured');
  return JSZip.loadAsync(capturedBlob);
}

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
        outlineVisible: false,
        centerLinesVisible: true,
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
    expect(cm.setOutlineVisible).toHaveBeenCalledWith(false);
    expect(cm.setCenterLinesVisible).toHaveBeenCalledWith(true);
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
      settings: { correctionX: 0.961, correctionY: 0.961, backgroundColor: '#ffffff', markColor: '#cc0000', outlineVisible: true, centerLinesVisible: false, exportFormat: 'png' },
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
      settings: { correctionX: 0.961, correctionY: 0.961, backgroundColor: '#ffffff', markColor: '#cc0000', outlineVisible: true, centerLinesVisible: false, exportFormat: 'png' },
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
      settings: { correctionX: 0.961, correctionY: 0.961, backgroundColor: '#ffffff', markColor: '#cc0000', outlineVisible: true, centerLinesVisible: false, exportFormat: 'png' },
    };

    const file = await buildProjectZip(manifest);
    await importProject(file, cm as never, mock(() => {}));

    expect(cm.addImageFromDataURL).not.toHaveBeenCalled();
    expect(cm.restoreGroups).toHaveBeenCalled();
  });

  it('imports multi-page project', async () => {
    const manifest: ProjectManifest = {
      version: 1,
      pages: [
        {
          images: [
            { file: 'images/p0_0_a.png', filename: 'a.png', visible: true, locked: false, groupId: null, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0, flipX: false, flipY: false, opacity: 1 },
          ],
          groups: [{ id: 'group-1', name: 'G1', visible: true }],
          groupCounter: 1,
          textCounter: 0,
        },
        {
          images: [
            { type: 'text', file: '', filename: 'Text 1', visible: true, locked: false, groupId: null, left: 50, top: 60, scaleX: 1, scaleY: 1, angle: 0, text: 'Page 2 text', fontFamily: 'Arial', fontSize: 40, fill: '#000000', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center', width: 200 },
            { file: 'images/p1_0_b.png', filename: 'b.png', visible: true, locked: true, groupId: null, left: 0, top: 0, scaleX: 2, scaleY: 2, angle: 90, flipX: true, flipY: true, opacity: 0.5 },
          ],
          groups: [],
          groupCounter: 0,
          textCounter: 1,
        },
      ],
      images: [
        { file: 'images/p0_0_a.png', filename: 'a.png', visible: true, locked: false, groupId: null, left: 10, top: 20, scaleX: 1, scaleY: 1, angle: 0 },
      ],
      groups: [{ id: 'group-1', name: 'G1', visible: true }],
      groupCounter: 1,
      settings: { correctionX: 0.95, correctionY: 0.96, backgroundColor: '#000000', markColor: '#ffffff', outlineVisible: false, centerLinesVisible: true, exportFormat: 'jpeg' },
    };

    const file = await buildProjectZip(manifest, {
      'p0_0_a.png': TINY_PNG_B64,
      'p1_0_b.png': TINY_PNG_B64,
    });

    let appliedSettings: ProjectSettings | null = null;
    const result = await importProject(file, cm as never, (s) => { appliedSettings = s; });

    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].images).toHaveLength(1);
    expect(result.pages[0].images[0].filename).toBe('a.png');
    expect(result.pages[0].groups).toHaveLength(1);
    expect(result.pages[0].groups[0].name).toBe('G1');

    expect(result.pages[1].images).toHaveLength(2);
    expect(result.pages[1].images[0].type).toBe('text');
    expect(result.pages[1].images[0].text).toBe('Page 2 text');
    expect(result.pages[1].images[1].filename).toBe('b.png');
    expect(result.pages[1].images[1].flipX).toBe(true);
    expect(result.pages[1].images[1].opacity).toBe(0.5);
    expect(result.pages[1].textCounter).toBe(1);

    expect(cm.clearAll).toHaveBeenCalled();
    expect(cm.addImageFromDataURL).toHaveBeenCalledTimes(1);
    expect(cm.state.images[0].filename).toBe('a.png');

    expect(cm.setCorrectionX).toHaveBeenCalledWith(0.95);
    expect(cm.setBackground).toHaveBeenCalledWith('#000000');
    expect(cm.setMarkColor).toHaveBeenCalledWith('#ffffff');
    expect(cm.setOutlineVisible).toHaveBeenCalledWith(false);
    expect(cm.setCenterLinesVisible).toHaveBeenCalledWith(true);
    expect(cm.finalizeRestore).toHaveBeenCalled();

    expect(appliedSettings).not.toBeNull();
    expect(appliedSettings!.exportFormat).toBe('jpeg');
    expect(result.settings.backgroundColor).toBe('#000000');
  });

  it('computes maxCounter from group IDs when groupCounter is missing', async () => {
    const manifest = {
      version: 1 as const,
      images: [] as ProjectManifest['images'],
      groups: [
        { id: 'group-3', name: 'A', visible: true },
        { id: 'group-7', name: 'B', visible: true },
      ],
      settings: { correctionX: 0.961, correctionY: 0.961, backgroundColor: '#ffffff', markColor: '#cc0000', outlineVisible: true, centerLinesVisible: false, exportFormat: 'png' as const },
    };

    const zip = new JSZip();
    zip.file('project.json', JSON.stringify(manifest));
    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'legacy.zip', { type: 'application/zip' });

    await importProject(file, cm as never, mock(() => {}));

    expect(cm.restoreGroups).toHaveBeenCalledWith(
      expect.any(Array),
      7,
    );
  });
});

describe('project export', () => {
  it('exports a single-page project with images', async () => {
    const cm = makeExportCM({
      images: [
        {
          type: 'image',
          fabricImage: makeFabricImage({ left: 10, top: 20, scaleX: 0.5, scaleY: 0.5, angle: 45 }),
          filename: 'photo.png',
          visible: true,
          locked: false,
          groupId: 'group-1',
          originalDataUrl: 'data:image/png;base64,ABC',
        },
      ],
      groups: [{ id: 'group-1', name: 'My Group', visible: true }],
      corrX: 0.95,
      corrY: 0.96,
      bgColor: '#000000',
      markColor: '#ffffff',
      outlineVisible: false,
      centerLinesVisible: true,
    });

    const zip = await captureExportedZip(() =>
      exportProject(cm as never, { exportFormat: 'jpeg' }),
    );

    const manifestFile = zip.file('project.json');
    expect(manifestFile).not.toBeNull();
    const manifest: ProjectManifest = JSON.parse(await manifestFile!.async('string'));

    expect(manifest.version).toBe(1);
    expect(manifest.images).toHaveLength(1);
    expect(manifest.images[0].filename).toBe('photo.png');
    expect(manifest.images[0].visible).toBe(true);
    expect(manifest.images[0].groupId).toBe('group-1');
    expect(manifest.groups).toHaveLength(1);
    expect(manifest.groups[0].name).toBe('My Group');
    expect(manifest.settings.correctionX).toBe(0.95);
    expect(manifest.settings.backgroundColor).toBe('#000000');
    expect(manifest.settings.markColor).toBe('#ffffff');
    expect(manifest.settings.exportFormat).toBe('jpeg');
    expect(manifest.pages).toBeUndefined();

    const imageFile = zip.file(manifest.images[0].file);
    expect(imageFile).not.toBeNull();
  });

  it('exports a single-page project with text layers', async () => {
    const textFabric = makeFabricImage({
      left: 100, top: 200, scaleX: 1, scaleY: 1, angle: 0,
      text: 'Hello', fontFamily: 'Georgia', fontSize: 60,
      fill: '#ff0000', fontWeight: 'bold', fontStyle: 'italic',
      textAlign: 'right', width: 300,
    });

    const cm = makeExportCM({
      images: [
        {
          type: 'text',
          fabricImage: textFabric,
          filename: 'Text 1',
          visible: true,
          locked: false,
          originalDataUrl: '',
        },
      ],
      textCounter: 1,
    });

    const zip = await captureExportedZip(() =>
      exportProject(cm as never, { exportFormat: 'png' }),
    );

    const manifest: ProjectManifest = JSON.parse(
      await zip.file('project.json')!.async('string'),
    );

    expect(manifest.images).toHaveLength(1);
    expect(manifest.images[0].type).toBe('text');
    expect(manifest.images[0].file).toBe('');
    expect(manifest.images[0].text).toBe('Hello');
    expect(manifest.images[0].fontFamily).toBe('Georgia');
    expect(manifest.images[0].fontSize).toBe(60);
    expect(manifest.images[0].textAlign).toBe('right');
    expect(manifest.textCounter).toBe(1);
  });

  it('exports a multi-page project with pages array', async () => {
    const cm = makeExportCM({
      images: [
        {
          type: 'image',
          fabricImage: makeFabricImage({ left: 5, top: 5 }),
          filename: 'current.png',
          visible: true,
          locked: false,
          originalDataUrl: 'data:image/png;base64,CUR',
        },
      ],
      groups: [{ id: 'group-1', name: 'G1', visible: true }],
    });

    const otherPages: PageData[] = [
      {
        images: [{
          type: 'image',
          dataUrl: 'data:image/png;base64,CUR',
          filename: 'current.png',
          visible: true, locked: false, groupId: null,
          left: 5, top: 5, scaleX: 1, scaleY: 1, angle: 0,
          flipX: false, flipY: false, opacity: 1,
        }],
        groups: [{ id: 'group-1', name: 'G1', visible: true }],
        groupCounter: 1,
        textCounter: 0,
      },
      {
        images: [{
          type: 'text',
          dataUrl: '',
          filename: 'Text 1',
          visible: true, locked: false, groupId: null,
          left: 50, top: 60, scaleX: 1, scaleY: 1, angle: 0,
          flipX: false, flipY: false, opacity: 0.8,
          text: 'Page two', fontFamily: 'Arial', fontSize: 40,
          fill: '#000000', fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'center', width: 200,
        }],
        groups: [],
        groupCounter: 0,
        textCounter: 1,
      },
    ];

    const zip = await captureExportedZip(() =>
      exportProject(cm as never, { exportFormat: 'png' }, otherPages, 0),
    );

    const manifest: ProjectManifest = JSON.parse(
      await zip.file('project.json')!.async('string'),
    );

    expect(manifest.pages).toBeDefined();
    expect(manifest.pages).toHaveLength(2);
    expect(manifest.pages![0].images).toHaveLength(1);
    expect(manifest.pages![0].images[0].filename).toBe('current.png');
    expect(manifest.pages![0].groups).toHaveLength(1);

    expect(manifest.pages![1].images).toHaveLength(1);
    expect(manifest.pages![1].images[0].type).toBe('text');
    expect(manifest.pages![1].images[0].text).toBe('Page two');
    expect(manifest.pages![1].textCounter).toBe(1);
  });

  it('multi-page export serializes non-current pages from PageData', async () => {
    const cm = makeExportCM({
      images: [
        {
          type: 'image',
          fabricImage: makeFabricImage(),
          filename: 'page0.png',
          visible: true,
          locked: false,
          originalDataUrl: 'data:image/png;base64,P0',
        },
      ],
    });

    const otherPages: PageData[] = [
      {
        images: [{ type: 'image', dataUrl: `data:image/png;base64,${TINY_PNG_B64}`, filename: 'page0.png', visible: true, locked: false, groupId: null, left: 0, top: 0, scaleX: 1, scaleY: 1, angle: 0, flipX: false, flipY: false, opacity: 1 }],
        groups: [], groupCounter: 0, textCounter: 0,
      },
      {
        images: [{ type: 'image', dataUrl: `data:image/png;base64,${TINY_PNG_B64}`, filename: 'page1.png', visible: true, locked: false, groupId: null, left: 10, top: 10, scaleX: 1, scaleY: 1, angle: 0, flipX: false, flipY: false, opacity: 1 }],
        groups: [{ id: 'group-1', name: 'G1', visible: true }], groupCounter: 1, textCounter: 0,
      },
    ];

    const zip = await captureExportedZip(() =>
      exportProject(cm as never, { exportFormat: 'png' }, otherPages, 0),
    );

    const manifest: ProjectManifest = JSON.parse(
      await zip.file('project.json')!.async('string'),
    );

    expect(manifest.pages![1].images[0].filename).toBe('page1.png');
    expect(manifest.pages![1].groups).toHaveLength(1);
    expect(manifest.pages![1].groups[0].name).toBe('G1');

    const p1ImageFile = zip.file(manifest.pages![1].images[0].file);
    expect(p1ImageFile).not.toBeNull();
  });

  it('export adds file extension when filename has none', async () => {
    const cm = makeExportCM({
      images: [
        {
          type: 'image',
          fabricImage: makeFabricImage(),
          filename: 'noext',
          visible: true,
          locked: false,
          originalDataUrl: 'data:image/png;base64,X',
        },
      ],
    });

    const zip = await captureExportedZip(() =>
      exportProject(cm as never, { exportFormat: 'png' }),
    );

    const manifest: ProjectManifest = JSON.parse(
      await zip.file('project.json')!.async('string'),
    );

    expect(manifest.images[0].file).toContain('.png');
  });
});
