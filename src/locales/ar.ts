import type { LocaleKey } from './en';

const ar: Record<LocaleKey, string> = {
  'page.title': 'SelphYoto - قالب طباعة ملصقات MYO',
  'page.subtitle': 'لطابعة Canon Selphy CP1500/CP1300 مع ورق <strong>بطاقة بريدية</strong> (طباعة بلا حدود)',

  'toolbar.undo': 'تراجع (Ctrl+Z)',
  'toolbar.redo': 'إعادة (Ctrl+Y)',
  'toolbar.guidelines': 'خطوط إرشادية',
  'toolbar.guidelines.on': 'تشغيل',
  'toolbar.guidelines.off': 'إيقاف',
  'toolbar.background': 'الخلفية',
  'toolbar.cuttingMarks': 'علامات القص',
  'toolbar.corrX': 'تصحيح X',
  'toolbar.corrY': 'تصحيح Y',
  'toolbar.flipH': 'قلب أفقي',
  'toolbar.flipV': 'قلب عمودي',
  'toolbar.opacity': 'الشفافية',
  'toolbar.addText': 'إضافة نص',
  'toolbar.font': 'الخط',
  'toolbar.fontSize': 'الحجم',
  'toolbar.textColor': 'اللون',
  'toolbar.bold': 'عريض',
  'toolbar.italic': 'مائل',
  'toolbar.alignLeft': 'محاذاة لليسار',
  'toolbar.alignCenter': 'محاذاة للوسط',
  'toolbar.alignRight': 'محاذاة لليمين',
  'toolbar.theme.toggle': 'تبديل المظهر',

  'color.white': 'أبيض',
  'color.grey': 'رمادي',
  'color.black': 'أسود',
  'color.red': 'أحمر',
  'color.yellow': 'أصفر',

  'export.button': 'تصدير الصورة',
  'export.asPng': 'تصدير كـ PNG',
  'export.asJpeg': 'تصدير كـ JPEG',

  'sidebar.addImage': 'إضافة صورة',
  'sidebar.addGroup': 'إضافة مجموعة',
  'sidebar.layers': 'الطبقات',
  'sidebar.import': 'استيراد',
  'sidebar.export': 'تصدير',
  'sidebar.clearCanvas': 'مسح اللوحة',
  'sidebar.emptyMsg': 'يتم تصدير لون الخلفية وعلامات القص.<br/>الخطوط الإرشادية الخضراء لا تُصدّر، وتُستخدم كمرجع بصري فقط.',

  'layer.hideLayer': 'إخفاء الطبقة',
  'layer.showLayer': 'إظهار الطبقة',
  'layer.lockLayer': 'قفل الطبقة',
  'layer.unlockLayer': 'فتح قفل الطبقة',
  'layer.removeLayer': 'حذف الطبقة',
  'layer.removeFromGroup': 'إزالة من المجموعة',
  'layer.hideGroup': 'إخفاء المجموعة',
  'layer.showGroup': 'إظهار المجموعة',
  'layer.deleteGroup': 'حذف المجموعة وصورها',

  'group.defaultName': 'مجموعة {{n}}',

  'autosave.none': '-',
  'autosave.justNow': 'تم الحفظ تلقائياً الآن',
  'autosave.secondsAgo': 'تم الحفظ منذ {{seconds}} ثانية',
  'autosave.minutesAgo': 'تم الحفظ منذ {{minutes}} دقيقة',

  'exportModal.title': 'تعليمات',
  'exportModal.content': 'أرسل الصورة المصدّرة إلى هاتفك الذكي وحمّلها في تطبيق Selphy. تأكد من ضبط إعداد الطباعة على "طباعة بلا حدود".<br>طباعة سعيدة!',
  'exportModal.dontShowAgain': 'لا تظهر مرة أخرى',
  'exportModal.ok': 'موافق',

  'confirm.cancel': 'إلغاء',
  'confirm.confirm': 'تأكيد',

  'clearCanvas.title': 'مسح اللوحة',
  'clearCanvas.message': 'سيتم حذف جميع الصور والمجموعات والصفحات. هل أنت متأكد؟',

  'deleteImage.message': 'حذف "{{name}}"؟',

  'project.exporting': 'جارٍ التصدير…',
  'project.exportFailed': 'فشل تصدير المشروع.',
  'project.importing': 'جارٍ الاستيراد…',
  'project.importFailed': 'فشل استيراد المشروع. قد يكون الملف غير صالح.',

  'text.defaultContent': 'نص',
  'text.defaultName': 'نص {{n}}',

  'ctx.addImage': 'إضافة صورة',
  'ctx.addText': 'إضافة نص',
  'ctx.importProject': 'استيراد مشروع',
  'ctx.toggleGuidelines': 'تبديل الخطوط الإرشادية',
  'ctx.backgroundColor': 'لون الخلفية',
  'ctx.cuttingMarksColor': 'لون علامات القص',
  'ctx.duplicate': 'تكرار',
  'ctx.bringForward': 'تقديم',
  'ctx.sendBackward': 'تأخير',
  'ctx.bringToFront': 'نقل للأمام',
  'ctx.sendToBack': 'نقل للخلف',
  'ctx.delete': 'حذف',

  'page.add': 'إضافة صفحة',
  'page.delete': 'حذف الصفحة',
  'page.label': 'صفحة {{n}}',
  'page.deleteConfirm': 'حذف الصفحة {{n}} وكل محتوياتها؟',
  'export.allPages': 'جارٍ تصدير جميع الصفحات…',

  'canvas.dropHere': 'أفلت الصور هنا',
};

export default ar;
