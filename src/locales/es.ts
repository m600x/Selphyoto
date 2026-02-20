import type { LocaleKey } from './en';

const es: Record<LocaleKey, string> = {
  'page.title': 'SelphYoto - Plantilla de impresión MYO',
  'page.subtitle': 'para Canon Selphy CP1500/CP1300 con papel <strong>POSTAL</strong> (impresión sin bordes)',

  'toolbar.undo': 'Deshacer (Ctrl+Z)',
  'toolbar.redo': 'Rehacer (Ctrl+Y)',
  'toolbar.guidelines': 'Guías',
  'toolbar.guidelines.on': 'SÍ',
  'toolbar.guidelines.off': 'NO',
  'toolbar.background': 'Fondo',
  'toolbar.cuttingMarks': 'Marcas de corte',
  'toolbar.corrX': 'Corr. X',
  'toolbar.corrY': 'Corr. Y',
  'toolbar.flipH': 'Voltear horizontal',
  'toolbar.flipV': 'Voltear vertical',
  'toolbar.opacity': 'Opacidad',
  'toolbar.addText': 'Añadir texto',
  'toolbar.font': 'Fuente',
  'toolbar.fontSize': 'Tamaño',
  'toolbar.textColor': 'Color',
  'toolbar.bold': 'Negrita',
  'toolbar.italic': 'Cursiva',
  'toolbar.alignLeft': 'Alinear a la izquierda',
  'toolbar.alignCenter': 'Alinear al centro',
  'toolbar.alignRight': 'Alinear a la derecha',

  'color.white': 'Blanco',
  'color.grey': 'Gris',
  'color.black': 'Negro',
  'color.red': 'Rojo',
  'color.yellow': 'Amarillo',

  'export.button': 'Exportar imagen',
  'export.asPng': 'Exportar como PNG',
  'export.asJpeg': 'Exportar como JPEG',

  'sidebar.addImage': 'Añadir imagen',
  'sidebar.addGroup': 'Añadir grupo',
  'sidebar.layers': 'Capas',
  'sidebar.import': 'Importar',
  'sidebar.export': 'Exportar',
  'sidebar.clearCanvas': 'Limpiar lienzo',
  'sidebar.emptyMsg': 'El color de fondo y las marcas de corte se exportan.<br/>Las guías verdes no se exportan, solo sirven como referencia visual.',

  'layer.hideLayer': 'Ocultar capa',
  'layer.showLayer': 'Mostrar capa',
  'layer.lockLayer': 'Bloquear capa',
  'layer.unlockLayer': 'Desbloquear capa',
  'layer.removeLayer': 'Eliminar capa',
  'layer.removeFromGroup': 'Quitar del grupo',
  'layer.hideGroup': 'Ocultar grupo',
  'layer.showGroup': 'Mostrar grupo',
  'layer.deleteGroup': 'Eliminar grupo y sus imágenes',

  'group.defaultName': 'Grupo {{n}}',

  'autosave.none': '-',
  'autosave.justNow': 'Guardado automáticamente',
  'autosave.secondsAgo': 'Guardado hace {{seconds}}s',
  'autosave.minutesAgo': 'Guardado hace {{minutes}}m',

  'exportModal.title': 'Instrucciones',
  'exportModal.content': 'Envía la imagen exportada a tu smartphone y cárgala en la app Selphy. Asegúrate de que la configuración de impresión esté en "impresión sin bordes".<br>¡Feliz impresión!',
  'exportModal.dontShowAgain': 'No mostrar de nuevo',
  'exportModal.ok': 'Aceptar',

  'confirm.cancel': 'Cancelar',
  'confirm.confirm': 'Confirmar',

  'clearCanvas.title': 'Limpiar lienzo',
  'clearCanvas.message': 'Se eliminarán todas las imágenes y grupos. ¿Estás seguro?',

  'deleteImage.message': '¿Eliminar "{{name}}"?',

  'project.exporting': 'Exportando…',
  'project.exportFailed': 'Error al exportar el proyecto.',
  'project.importing': 'Importando…',
  'project.importFailed': 'Error al importar el proyecto. El archivo puede ser inválido.',

  'text.defaultContent': 'Texto',
  'text.defaultName': 'Texto {{n}}',

  'canvas.dropHere': 'Arrastra las imágenes aquí',
};

export default es;
