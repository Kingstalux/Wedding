import type { Invitation, PublicContent } from './types'

/*
 * Sample data used until the guest site is connected to Supabase (Step 6).
 * Open http://localhost:5180/i/demo to see it; any other token shows the
 * "This invitation is personal" page, as an invalid link will.
 */

export const SAMPLE_TOKEN = 'demo'

const searchMaps = (place: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`

export const sampleContent: PublicContent = {
  settings: {
    bride: 'Bride',
    groom: 'Groom',
    city: 'Yaoundé, Cameroon',
    countdown_at: '2026-12-23T11:00:00+01:00',
    rsvp_deadline: '2026-12-10',
    hero_url: null,
    word_photo_url: null,
    word_en:
      'Dear {guest name}, thank you for being part of our story. Every step has been carried by God’s grace, and we want you beside us as we say yes before the law, our families, and the Lord. Your presence is already our most beautiful gift.',
    word_fr:
      'Cher(e) {nom de l’invité}, merci de faire partie de notre histoire. Chaque pas a été porté par la grâce de Dieu, et nous voulons vous avoir à nos côtés pour dire oui devant la loi, nos familles et le Seigneur. Votre présence est déjà notre plus beau cadeau.',
    show_word: true,
    dress_en:
      'Elegant formal attire. We would love to see you in our wedding colours — midnight navy, emerald and gold — with ivory as a soft accent.',
    dress_fr:
      'Tenue de soirée élégante. Nous serions ravis de vous voir dans nos couleurs — bleu nuit, émeraude et or — avec une touche d’ivoire.',
    show_dress: true,
    show_gallery: true,
    show_wishes: true,
    show_gifts: true,
    momo_number: '[MoMo number]',
    momo_name: '[Account name]',
    om_number: '[Orange Money number]',
    om_name: '[Account name]',
    show_gift_box: true,
    gift_box_note_en:
      'Saturday 26 December · Bansoa Hall. An envelope with your name helps us thank you.',
    gift_box_note_fr:
      'Samedi 26 décembre · Salle Bansoa. Une enveloppe à votre nom nous aidera à vous remercier.',
    music_url: null,
    music_title: 'The Best Part of You — Savvy',
  },
  events: [
    {
      id: 'civil',
      title_en: 'Civil wedding',
      title_fr: 'Mariage civil',
      starts_at: '2026-12-23T11:00:00+01:00',
      ends_at: null,
      venue: 'Mairie de Yaoundé 6ème',
      maps_url: searchMaps('Mairie de Yaoundé 6ème'),
    },
    {
      id: 'traditional',
      title_en: 'Traditional wedding',
      title_fr: 'Mariage traditionnel',
      starts_at: '2026-12-23T16:00:00+01:00',
      ends_at: '2026-12-23T20:00:00+01:00',
      venue: 'Behind Dovv, Mendong',
      maps_url: searchMaps('Dovv Mendong Yaoundé'),
    },
    {
      id: 'church',
      title_en: 'Church service',
      title_fr: 'Culte à l’église',
      starts_at: '2026-12-26T12:00:00+01:00',
      ends_at: '2026-12-26T14:00:00+01:00',
      venue: 'Full Gospel Mission, Carrefour Bouba',
      maps_url: searchMaps('Full Gospel Mission Carrefour Bouba Yaoundé'),
    },
    {
      id: 'reception',
      title_en: 'Reception',
      title_fr: 'Réception',
      starts_at: '2026-12-26T16:00:00+01:00',
      ends_at: '2026-12-26T20:00:00+01:00',
      venue: 'Bansoa Hall, Montée Chapelle Simbock',
      maps_url: searchMaps('Montée Chapelle Simbock Yaoundé'),
    },
  ],
  gallery: [1, 2, 3, 4, 5].map((n) => ({ id: `photo-${n}`, url: null })),
}

export const sampleInvitation: Invitation = {
  name: 'Guest Name',
  first_name: 'Guest',
  lang: null,
  pass_code: 'BG-7K2Q',
  rsvp: null,
  wishes: [
    {
      id: 'w1',
      author: 'Sample guest',
      message: 'Wishes left by guests appear here, newest first.',
      created_at: '2026-10-14T19:02:00+01:00',
      mine: false,
    },
    {
      id: 'w2',
      author: 'Sample guest',
      message: 'The couple can hide or delete any message from their studio.',
      created_at: '2026-10-14T08:45:00+01:00',
      mine: false,
    },
  ],
}
