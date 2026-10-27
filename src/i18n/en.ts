/*
 * English interface text for the guest site. Texts written by the couple
 * (the word, dress code, programme titles) live in the database instead,
 * in both languages, and are edited in the studio.
 *
 * {placeholders} are filled in by t('key', { name: '…' }).
 */
export const en = {
  'lang.label': 'Language',

  'nav.label': 'Main',
  'nav.home': 'Home',
  'nav.word': 'A word',
  'nav.schedule': 'Schedule',
  'nav.dress': 'Dress code',
  'nav.gallery': 'Gallery',
  'nav.rsvp': 'RSVP',
  'nav.book': 'Guest book',
  'nav.gifts': 'Gifts',
  'nav.open': 'Open menu',
  'nav.close': 'Close menu',
  'nav.top': 'Back to top',

  'music.play': 'Play music',
  'music.pause': 'Pause music',
  'music.willPlay': 'Music will play — “{title}”',

  'envelope.dear': 'Dear {name}',
  'envelope.invited': 'You are warmly invited to the wedding of',
  'envelope.open': 'Open your invitation',

  'hero.eyebrow': 'Together with their families',
  'hero.and': 'and',
  'hero.scroll': 'Scroll down',
  'hero.photo': 'Landing photo',

  'count.label': 'Countdown to the wedding',
  'count.eyebrow': 'The big day',
  'count.days': 'Days',
  'count.hours': 'Hours',
  'count.minutes': 'Minutes',
  'count.seconds': 'Seconds',
  'count.done': 'The celebration has begun!',

  'word.eyebrow': 'A word from the couple',
  'word.photo': 'Couple photo',

  'sched.days': '{n} days',
  'sched.day': 'One day',
  'sched.moments': '{n} moments',
  'sched.moment': 'One moment',
  'sched.title': 'The Celebration',
  'sched.directions': 'Directions',
  'sched.dressLink': 'View the dress code',

  'dress.eyebrow': 'Dress code',
  'dress.title': 'Dressed in Our Colours',
  'colour.navy': 'Midnight navy',
  'colour.slate': 'Slate blue',
  'colour.forest': 'Forest green',
  'colour.emerald': 'Emerald',
  'colour.gold': 'Gold',

  'gallery.eyebrow': 'Our gallery',
  'gallery.title': 'Moments We’ll Cherish',
  'gallery.enlarge': 'Enlarge photo {n}',
  'gallery.photo': 'Photo {n}',
  'gallery.viewer': 'Photo viewer',
  'gallery.close': 'Close',
  'gallery.prev': 'Previous photo',
  'gallery.next': 'Next photo',

  'rsvp.title': 'Kindly Respond',
  'rsvp.lede': 'Dear {name}, one seat is reserved in your name. Please respond by {date}.',
  'rsvp.ledeNoDate':
    'Dear {name}, one seat is reserved in your name. Please let us know if you can join us.',
  'rsvp.legend': 'Will you attend?',
  'rsvp.yes': 'Joyfully accepts',
  'rsvp.no': 'Regretfully declines',
  'rsvp.diet': 'Dietary notes (optional)',
  'rsvp.dietPlaceholder': 'Vegetarian, allergies…',
  'rsvp.note': 'A note for the couple (optional)',
  'rsvp.submit': 'Submit response',
  'rsvp.choose': 'Please choose “Joyfully accepts” or “Regretfully declines”.',
  'rsvp.thanksYes': 'Thank you, {name}. We have your yes!',
  'rsvp.thanksNo': 'Thank you for letting us know, {name}. You will be missed.',
  'rsvp.change': 'Change my answer',
  'rsvp.passKicker': 'Your entrance pass',
  'rsvp.openPass': 'Open my pass',
  'rsvp.photo': 'Couple photo',

  'book.eyebrow': 'Guest book',
  'book.title': 'Leave Us a Wish',
  'book.label': 'Your message to the couple',
  'book.placeholder': 'Write a few words…',
  'book.postingAs': 'Posting as {name}',
  'book.post': 'Post wish',
  'book.delete': 'Delete',
  'book.deleteConfirm': 'Delete your message from the guest book?',
  'book.justNow': 'just now',
  'book.empty': 'Be the first to leave a wish.',
  'book.noLinks': 'Links are not allowed in messages. Please remove them and try again.',

  'gift.eyebrow': 'Gifts',
  'gift.title': 'A Gift From the Heart',
  'gift.lede':
    'Your presence is already our most beautiful gift. If you would like to bless us further, a cash gift can be sent in any of these ways.',
  'gift.momo': 'MTN Mobile Money',
  'gift.orange': 'Orange Money',
  'gift.cash': 'Cash on the day',
  'gift.cashOption': 'Cash at the reception',
  'gift.accountName': 'Account name: {name}',
  'gift.copy': 'Copy number',
  'gift.copied': 'Copied',
  'gift.box': 'Gift box at the reception',
  'gift.tellTitle': 'Let us know (optional)',
  'gift.tellLede':
    'So we can thank you personally. This does not send money — it only tells the couple.',
  'gift.via': 'Sent via',
  'gift.amount': 'Amount in FCFA (optional)',
  'gift.amountPlaceholder': 'e.g. 25 000',
  'gift.message': 'A message for us (optional)',
  'gift.send': 'Let the couple know',
  'gift.thanks': 'Thank you',
  'gift.thanksBody': '{name}, your kindness means the world to us.',
  'gift.another': 'Tell us about another gift',

  'personal.title': 'This Invitation Is Personal',
  'personal.body':
    'Please open the private link you received on WhatsApp. If it no longer works, ask the couple for a new one.',

  'pass.eyebrow': 'Your entrance pass',
  'pass.title': 'Keep This QR Code',
  'pass.body':
    'Save it to your phone and show it at the entrance. It confirms your name and your reply.',
  'pass.ticket': 'Entrance Pass',
  'pass.seat': '1 seat',
  'pass.download': 'Download QR image',
  'pass.back': 'Back to the invitation',
  'pass.qrAlt': 'Entrance QR code for {name}',
  'pass.notAttending': 'Your reply is “Regretfully declines”, so there is no entrance pass.',

  'door.eyebrow': 'Entrance pass',
  'door.checking': 'Checking this pass…',
  'door.confirmed': 'Confirmed guest',
  'door.notAttending': 'Not attending',
  'door.notFound': 'This pass could not be found.',

  'common.loading': 'Loading…',
}

export type MessageKey = keyof typeof en
