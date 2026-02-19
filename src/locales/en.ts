const en = {
  'page.title': 'SelphYoto - MYO label printing template',
  'page.subtitle': 'for Canon Selphy CP1500/CP1300 printer with <strong>POSTCARD</strong> paper (borderless printing)',

  'toolbar.guidelines': 'Guidelines',
  'toolbar.guidelines.on': 'ON',
  'toolbar.guidelines.off': 'OFF',
  'toolbar.background': 'Background',
  'toolbar.cuttingMarks': 'Cutting marks',
  'toolbar.corrX': 'Corr. X',
  'toolbar.corrY': 'Corr. Y',

  'color.white': 'White',
  'color.grey': 'Grey',
  'color.black': 'Black',
  'color.red': 'Red',
  'color.yellow': 'Yellow',

  'export.button': 'Export image',
  'export.asPng': 'Export as PNG',
  'export.asJpeg': 'Export as JPEG',

  'sidebar.addImage': 'Add image',
  'sidebar.addGroup': 'Add group',
  'sidebar.layers': 'Layers',
  'sidebar.import': 'Import',
  'sidebar.export': 'Export',
  'sidebar.clearCanvas': 'Clear Canvas',
  'sidebar.emptyMsg': 'Background color and cutting marks are exported.<br/>Green guidelines are not exported, only used as visual reference.',

  'layer.hideLayer': 'Hide layer',
  'layer.showLayer': 'Show layer',
  'layer.lockLayer': 'Lock layer',
  'layer.unlockLayer': 'Unlock layer',
  'layer.removeLayer': 'Remove layer',
  'layer.removeFromGroup': 'Remove from group',
  'layer.hideGroup': 'Hide group',
  'layer.showGroup': 'Show group',
  'layer.deleteGroup': 'Delete group and its images',

  'group.defaultName': 'Group {{n}}',

  'autosave.none': '-',
  'autosave.justNow': 'Autosaved just now',
  'autosave.secondsAgo': 'Autosaved {{seconds}}s ago',
  'autosave.minutesAgo': 'Autosaved {{minutes}}m ago',

  'exportModal.title': 'Instructions',
  'exportModal.content': 'Send the exported image to your smartphone and load it into the Selphy app. Make sure that the printing setting is set to "borderless printing".<br>Happy printing!',
  'exportModal.dontShowAgain': "Don't show again",
  'exportModal.ok': 'OK',

  'confirm.cancel': 'Cancel',
  'confirm.confirm': 'Confirm',

  'clearCanvas.title': 'Clear Canvas',
  'clearCanvas.message': 'All images and groups will be removed. Are you sure?',

  'deleteImage.message': 'Delete "{{name}}"?',

  'project.exporting': 'Exporting…',
  'project.exportFailed': 'Failed to export project.',
  'project.importing': 'Importing…',
  'project.importFailed': 'Failed to import project. The file may be invalid.',

  'canvas.dropHere': 'Drop images here',
} as const;

export type LocaleKey = keyof typeof en;
export default en as Record<LocaleKey, string>;
