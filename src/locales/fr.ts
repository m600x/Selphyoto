import type { LocaleKey } from './en';

const fr: Record<LocaleKey, string> = {
  'page.title': 'SelphYoto - Gabarit d\'impression MYO',
  'page.subtitle': 'pour Canon Selphy CP1500/CP1300 avec papier <strong>CARTE POSTALE</strong> (impression sans marge)',

  'toolbar.undo': 'Annuler (Ctrl+Z)',
  'toolbar.redo': 'Rétablir (Ctrl+Y)',
  'toolbar.guidelines': 'Repères',
  'toolbar.guidelines.on': 'OUI',
  'toolbar.guidelines.off': 'NON',
  'toolbar.background': 'Arrière-plan',
  'toolbar.cuttingMarks': 'Marques de coupe',
  'toolbar.corrX': 'Corr. X',
  'toolbar.corrY': 'Corr. Y',
  'toolbar.flipH': 'Retourner horizontalement',
  'toolbar.flipV': 'Retourner verticalement',
  'toolbar.opacity': 'Opacité',

  'color.white': 'Blanc',
  'color.grey': 'Gris',
  'color.black': 'Noir',
  'color.red': 'Rouge',
  'color.yellow': 'Jaune',

  'export.button': 'Exporter l\'image',
  'export.asPng': 'Exporter en PNG',
  'export.asJpeg': 'Exporter en JPEG',

  'sidebar.addImage': 'Ajouter une image',
  'sidebar.addGroup': 'Ajouter un groupe',
  'sidebar.layers': 'Calques',
  'sidebar.import': 'Importer',
  'sidebar.export': 'Exporter',
  'sidebar.clearCanvas': 'Tout effacer',
  'sidebar.emptyMsg': 'La couleur de fond et les marques de coupe sont exportées.<br/>Les repères verts ne sont pas exportés, uniquement utilisés comme référence visuelle.',

  'layer.hideLayer': 'Masquer le calque',
  'layer.showLayer': 'Afficher le calque',
  'layer.lockLayer': 'Verrouiller le calque',
  'layer.unlockLayer': 'Déverrouiller le calque',
  'layer.removeLayer': 'Supprimer le calque',
  'layer.removeFromGroup': 'Retirer du groupe',
  'layer.hideGroup': 'Masquer le groupe',
  'layer.showGroup': 'Afficher le groupe',
  'layer.deleteGroup': 'Supprimer le groupe et ses images',

  'group.defaultName': 'Groupe {{n}}',

  'autosave.none': '-',
  'autosave.justNow': 'Sauvegardé à l\'instant',
  'autosave.secondsAgo': 'Sauvegardé il y a {{seconds}}s',
  'autosave.minutesAgo': 'Sauvegardé il y a {{minutes}}m',

  'exportModal.title': 'Instructions',
  'exportModal.content': 'Envoyez l\'image exportée sur votre smartphone et chargez-la dans l\'application Selphy. Assurez-vous que le paramètre d\'impression est réglé sur « impression sans marge ».<br>Bonne impression !',
  'exportModal.dontShowAgain': 'Ne plus afficher',
  'exportModal.ok': 'OK',

  'confirm.cancel': 'Annuler',
  'confirm.confirm': 'Confirmer',

  'clearCanvas.title': 'Tout effacer',
  'clearCanvas.message': 'Toutes les images et groupes seront supprimés. Êtes-vous sûr ?',

  'deleteImage.message': 'Supprimer "{{name}}" ?',

  'project.exporting': 'Export en cours…',
  'project.exportFailed': 'Échec de l\'export du projet.',
  'project.importing': 'Import en cours…',
  'project.importFailed': 'Échec de l\'import du projet. Le fichier est peut-être invalide.',

  'canvas.dropHere': 'Déposez les images ici',
};

export default fr;
