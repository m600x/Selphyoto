import type { LocaleKey } from './en';

const zh: Record<LocaleKey, string> = {
  'page.title': 'SelphYoto - MYO 标签打印模板',
  'page.subtitle': '适用于 Canon Selphy CP1500/CP1300 打印机，使用<strong>明信片</strong>纸张（无边框打印）',

  'toolbar.undo': '撤销 (Ctrl+Z)',
  'toolbar.redo': '重做 (Ctrl+Y)',
  'toolbar.guidelines': '参考线',
  'toolbar.guidelines.on': '开',
  'toolbar.guidelines.off': '关',
  'toolbar.background': '背景',
  'toolbar.cuttingMarks': '裁切标记',
  'toolbar.corrX': '校正 X',
  'toolbar.corrY': '校正 Y',
  'toolbar.flipH': '水平翻转',
  'toolbar.flipV': '垂直翻转',
  'toolbar.opacity': '不透明度',
  'toolbar.addText': '添加文字',
  'toolbar.font': '字体',
  'toolbar.fontSize': '大小',
  'toolbar.textColor': '颜色',
  'toolbar.bold': '粗体',
  'toolbar.italic': '斜体',
  'toolbar.alignLeft': '左对齐',
  'toolbar.alignCenter': '居中对齐',
  'toolbar.alignRight': '右对齐',

  'color.white': '白色',
  'color.grey': '灰色',
  'color.black': '黑色',
  'color.red': '红色',
  'color.yellow': '黄色',

  'export.button': '导出图片',
  'export.asPng': '导出为 PNG',
  'export.asJpeg': '导出为 JPEG',

  'sidebar.addImage': '添加图片',
  'sidebar.addGroup': '添加分组',
  'sidebar.layers': '图层',
  'sidebar.import': '导入',
  'sidebar.export': '导出',
  'sidebar.clearCanvas': '清空画布',
  'sidebar.emptyMsg': '背景颜色和裁切标记会被导出。<br/>绿色参考线不会被导出，仅作为视觉参考。',

  'layer.hideLayer': '隐藏图层',
  'layer.showLayer': '显示图层',
  'layer.lockLayer': '锁定图层',
  'layer.unlockLayer': '解锁图层',
  'layer.removeLayer': '删除图层',
  'layer.removeFromGroup': '从分组中移除',
  'layer.hideGroup': '隐藏分组',
  'layer.showGroup': '显示分组',
  'layer.deleteGroup': '删除分组及其图片',

  'group.defaultName': '分组 {{n}}',

  'autosave.none': '-',
  'autosave.justNow': '刚刚自动保存',
  'autosave.secondsAgo': '{{seconds}}秒前自动保存',
  'autosave.minutesAgo': '{{minutes}}分钟前自动保存',

  'exportModal.title': '使用说明',
  'exportModal.content': '将导出的图片发送到您的手机，然后在 Selphy 应用中加载。请确保打印设置为"无边框打印"。<br>祝您打印愉快！',
  'exportModal.dontShowAgain': '不再显示',
  'exportModal.ok': '确定',

  'confirm.cancel': '取消',
  'confirm.confirm': '确认',

  'clearCanvas.title': '清空画布',
  'clearCanvas.message': '所有图片和分组将被删除。确定吗？',

  'deleteImage.message': '删除"{{name}}"？',

  'project.exporting': '导出中…',
  'project.exportFailed': '项目导出失败。',
  'project.importing': '导入中…',
  'project.importFailed': '项目导入失败。文件可能无效。',

  'text.defaultContent': '文字',
  'text.defaultName': '文字 {{n}}',

  'canvas.dropHere': '将图片拖放到此处',
};

export default zh;
