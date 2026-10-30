import type { MessageKey } from './en'

/*
 * French interface text. `Record<MessageKey, string>` makes TypeScript
 * report any key that exists in en.ts but is missing here.
 */
export const fr: Record<MessageKey, string> = {
  'lang.label': 'Langue',

  'nav.label': 'Principal',
  'nav.home': 'Accueil',
  'nav.word': 'Un mot',
  'nav.schedule': 'Programme',
  'nav.dress': 'Tenue',
  'nav.gallery': 'Galerie',
  'nav.rsvp': 'RSVP',
  'nav.book': 'Livre d’or',
  'nav.gifts': 'Cadeaux',
  'nav.open': 'Ouvrir le menu',
  'nav.close': 'Fermer le menu',
  'nav.top': 'Retour en haut',

  'music.play': 'Lancer la musique',
  'music.pause': 'Mettre la musique en pause',
  'music.willPlay': 'La musique va jouer — « {title} »',

  'envelope.dear': 'Cher(e) {name}',
  'envelope.invited': 'Vous êtes chaleureusement invité(e) au mariage de',
  'envelope.open': 'Ouvrir votre invitation',

  'hero.eyebrow': 'Avec leurs familles',
  'hero.and': 'et',
  'hero.scroll': 'Descendre',
  'hero.photo': 'Photo d’accueil',

  'count.label': 'Compte à rebours jusqu’au mariage',
  'count.eyebrow': 'Le grand jour',
  'count.days': 'Jours',
  'count.hours': 'Heures',
  'count.minutes': 'Minutes',
  'count.seconds': 'Secondes',
  'count.done': 'La fête a commencé !',

  'word.eyebrow': 'Un mot des mariés',
  'word.photo': 'Photo du couple',

  'sched.days': '{n} jours',
  'sched.day': 'Un jour',
  'sched.moments': '{n} moments',
  'sched.moment': 'Un moment',
  'sched.title': 'La Célébration',
  'sched.directions': 'Itinéraire',
  'sched.dressLink': 'Voir la tenue',

  'dress.eyebrow': 'Code vestimentaire',
  'dress.title': 'Aux Couleurs du Mariage',
  'colour.navy': 'Bleu nuit',
  'colour.slate': 'Bleu ardoise',
  'colour.forest': 'Vert forêt',
  'colour.emerald': 'Émeraude',
  'colour.gold': 'Or',

  'gallery.eyebrow': 'Notre galerie',
  'gallery.title': 'Nos Plus Beaux Moments',
  'gallery.enlarge': 'Agrandir la photo {n}',
  'gallery.photo': 'Photo {n}',
  'gallery.viewer': 'Visionneuse de photos',
  'gallery.close': 'Fermer',
  'gallery.prev': 'Photo précédente',
  'gallery.next': 'Photo suivante',

  'rsvp.title': 'Merci de Répondre',
  'rsvp.lede':
    'Cher(e) {name}, une place est réservée à votre nom. Merci de répondre avant le {date}.',
  'rsvp.ledeNoDate':
    'Cher(e) {name}, une place est réservée à votre nom. Merci de nous dire si vous serez des nôtres.',
  'rsvp.legend': 'Serez-vous présent(e) ?',
  'rsvp.yes': 'Avec joie, oui',
  'rsvp.no': 'Avec regret, non',
  'rsvp.diet': 'Régime alimentaire (facultatif)',
  'rsvp.dietPlaceholder': 'Végétarien, allergies…',
  'rsvp.note': 'Un mot pour les mariés (facultatif)',
  'rsvp.submit': 'Envoyer ma réponse',
  'rsvp.choose': 'Merci de choisir « Avec joie, oui » ou « Avec regret, non ».',
  'rsvp.thanksYes': 'Merci, {name}. Nous avons bien reçu votre oui !',
  'rsvp.thanksNo': 'Merci de nous avoir prévenus, {name}. Vous nous manquerez.',
  'rsvp.change': 'Modifier ma réponse',
  'rsvp.passKicker': 'Votre pass d’entrée',
  'rsvp.openPass': 'Ouvrir mon pass',
  'rsvp.photo': 'Photo du couple',

  'book.eyebrow': 'Livre d’or',
  'book.title': 'Laissez-nous un Mot',
  'book.label': 'Votre message aux mariés',
  'book.placeholder': 'Écrivez quelques mots…',
  'book.postingAs': 'Publié au nom de {name}',
  'book.post': 'Publier',
  'book.delete': 'Supprimer',
  'book.deleteConfirm': 'Supprimer votre message du livre d’or ?',
  'book.empty': 'Soyez le premier à laisser un mot.',
  'book.noLinks': 'Les liens ne sont pas autorisés dans les messages. Merci de les retirer.',

  'wishes.title': 'Mots d’Amour',
  'wishes.label': 'Les messages des invités',
  'wishes.count': '{n} sur {total}',
  'wishes.prev': 'Messages précédents',
  'wishes.next': 'Messages suivants',
  'wishes.write': 'Écrire votre message',
  'gift.eyebrow': 'Cadeaux',
  'gift.title': 'Un Cadeau du Cœur',
  'gift.lede':
    'Votre présence est déjà notre plus beau cadeau. Si vous souhaitez nous bénir davantage, vous pouvez nous offrir un don de l’une de ces façons.',
  'gift.momo': 'MTN Mobile Money',
  'gift.orange': 'Orange Money',
  'gift.cash': 'En espèces le jour J',
  'gift.accountName': 'Nom du compte : {name}',
  'gift.copy': 'Copier le numéro',
  'gift.copied': 'Copié',
  'gift.box': 'Urne à la réception',
  'personal.title': 'Cette Invitation Est Personnelle',
  'personal.body':
    'Merci d’ouvrir le lien privé reçu sur WhatsApp. S’il ne fonctionne plus, demandez-en un nouveau aux mariés.',

  'pass.eyebrow': 'Votre pass d’entrée',
  'pass.title': 'Gardez ce QR Code',
  'pass.body':
    'Enregistrez-le sur votre téléphone et présentez-le à l’entrée. Il confirme votre nom et votre réponse.',
  'pass.ticket': 'Pass d’Entrée',
  'pass.seat': '1 place',
  'pass.download': 'Télécharger le QR code',
  'pass.back': 'Retour à l’invitation',
  'pass.qrAlt': 'QR code d’entrée pour {name}',
  'pass.notAttending':
    'Votre réponse est « Avec regret, non » : il n’y a donc pas de pass d’entrée.',

  'door.eyebrow': 'Pass d’entrée',
  'door.checking': 'Vérification du pass…',
  'door.confirmed': 'Invité(e) confirmé(e)',
  'door.notAttending': 'Ne sera pas présent(e)',
  'door.notFound': 'Ce pass est introuvable.',

  'error.invalid_token':
    'Ce lien d’invitation n’est plus valide. Merci d’en demander un nouveau aux mariés.',
  'error.rsvp_closed': 'Les réponses sont closes : la fête a commencé.',
  'error.answer_required': 'Merci de choisir « Avec joie, oui » ou « Avec regret, non ».',
  'error.links_not_allowed':
    'Les liens ne sont pas autorisés dans les messages. Merci de les retirer.',
  'error.message_length': 'Merci d’écrire un message de 500 caractères au maximum.',
  'error.rate_limited':
    'Vous avez envoyé plusieurs messages en peu de temps. Merci de réessayer un peu plus tard.',
  'error.network': 'Pas de connexion. Vérifiez votre internet et réessayez.',
  'error.generic': 'Un problème est survenu. Merci de réessayer dans un instant.',
  'error.loadTitle': 'Impossible d’Ouvrir Votre Invitation',
  'error.retry': 'Réessayer',
  'error.crashTitle': 'Un Problème Est Survenu',
  'error.crashBody': 'Cette page a rencontré un problème. Recharger la page suffit généralement.',
  'error.reload': 'Recharger la page',
  'offline.banner':
    'Vous êtes hors ligne. Certaines fonctions peuvent ne pas marcher avant la reconnexion.',

  'door.noReply': 'Invité(e) · pas encore de réponse',
  'door.checkedIn': 'déjà enregistré(e)',
  'common.cancel': 'Annuler',
  'common.loading': 'Chargement…',
}
