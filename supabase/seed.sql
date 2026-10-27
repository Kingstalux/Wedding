-- =============================================================================
-- Seed data: DEV ONLY (wedding-dev). Never run this on production.
--
-- Fills in the real programme and texts, plus three test guests with fixed,
-- easy links:
--   http://localhost:5180/i/demo       Guest Name   (no reply yet)
--   http://localhost:5180/i/demo-yes   Ama Test     (attending)
--   http://localhost:5180/i/demo-no    Paul Test    (declined)
--
-- Safe to run more than once: every statement updates or skips existing rows.
-- Apply with:  supabase db push --linked --include-seed
-- =============================================================================

-- ---------- Settings: names, texts, gift options ----------------------------
update public.settings set
  bride            = 'Bride',
  groom            = 'Groom',
  city             = 'Yaoundé, Cameroon',
  countdown_at     = '2026-12-23 11:00:00+01',
  rsvp_deadline    = '2026-12-10',
  word_en          = 'Dear {guest name}, thank you for being part of our story. Every step has been carried by God’s grace, and we want you beside us as we say yes before the law, our families, and the Lord. Your presence is already our most beautiful gift.',
  word_fr          = 'Cher(e) {nom de l’invité}, merci de faire partie de notre histoire. Chaque pas a été porté par la grâce de Dieu, et nous voulons vous avoir à nos côtés pour dire oui devant la loi, nos familles et le Seigneur. Votre présence est déjà notre plus beau cadeau.',
  dress_en         = 'Elegant formal attire. We would love to see you in our wedding colours — midnight navy, emerald and gold — with ivory as a soft accent.',
  dress_fr         = 'Tenue de soirée élégante. Nous serions ravis de vous voir dans nos couleurs — bleu nuit, émeraude et or — avec une touche d’ivoire.',
  momo_number      = '[MoMo number]',
  momo_name        = '[Account name]',
  om_number        = '[Orange Money number]',
  om_name          = '[Account name]',
  gift_box_note_en = 'Saturday 26 December · Bansoa Hall. An envelope with your name helps us thank you.',
  gift_box_note_fr = 'Samedi 26 décembre · Salle Bansoa. Une enveloppe à votre nom nous aidera à vous remercier.',
  music_title      = 'The Best Part of You — Savvy',
  wa_template_en   = 'Dear {name}, {bride} & {groom} joyfully invite you to their wedding on 23 & 26 December 2026 in Yaoundé. Open your personal invitation here: {link}',
  wa_template_fr   = 'Cher(e) {name}, {bride} & {groom} ont la joie de vous inviter à leur mariage les 23 et 26 décembre 2026 à Yaoundé. Ouvrez votre invitation personnelle ici : {link}';

-- ---------- The programme (fixed ids so re-running updates instead of duplicating)
insert into public.events (id, title_en, title_fr, starts_at, ends_at, venue, maps_url, sort) values
  ('00000000-0000-4000-8000-000000000001', 'Civil wedding', 'Mariage civil',
   '2026-12-23 11:00:00+01', null, 'Mairie de Yaoundé 6ème',
   'https://www.google.com/maps/search/?api=1&query=Mairie+de+Yaound%C3%A9+6%C3%A8me', 1),
  ('00000000-0000-4000-8000-000000000002', 'Traditional wedding', 'Mariage traditionnel',
   '2026-12-23 16:00:00+01', '2026-12-23 20:00:00+01', 'Behind Dovv, Mendong',
   'https://www.google.com/maps/search/?api=1&query=Dovv+Mendong+Yaound%C3%A9', 2),
  ('00000000-0000-4000-8000-000000000003', 'Church service', 'Culte à l’église',
   '2026-12-26 12:00:00+01', '2026-12-26 14:00:00+01', 'Full Gospel Mission, Carrefour Bouba',
   'https://www.google.com/maps/search/?api=1&query=Full+Gospel+Mission+Carrefour+Bouba+Yaound%C3%A9', 3),
  ('00000000-0000-4000-8000-000000000004', 'Reception', 'Réception',
   '2026-12-26 16:00:00+01', '2026-12-26 20:00:00+01', 'Bansoa Hall, Montée Chapelle Simbock',
   'https://www.google.com/maps/search/?api=1&query=Mont%C3%A9e+Chapelle+Simbock+Yaound%C3%A9', 4)
on conflict (id) do update set
  title_en = excluded.title_en, title_fr = excluded.title_fr,
  starts_at = excluded.starts_at, ends_at = excluded.ends_at,
  venue = excluded.venue, maps_url = excluded.maps_url, sort = excluded.sort;

-- ---------- Test guests with fixed links and pass codes ---------------------
insert into public.guests (id, name, phone, token, pass_code) values
  ('00000000-0000-4000-9000-000000000001', 'Guest Name', null,           'demo',     'DEMOAA'),
  ('00000000-0000-4000-9000-000000000002', 'Ama Test',   '237600000002', 'demo-yes', 'DEMOBB'),
  ('00000000-0000-4000-9000-000000000003', 'Paul Test',  '237600000003', 'demo-no',  'DEMOCC')
on conflict (id) do nothing;

insert into public.rsvps (guest_id, attending, diet, note) values
  ('00000000-0000-4000-9000-000000000002', true,  'Vegetarian', 'Can’t wait!'),
  ('00000000-0000-4000-9000-000000000003', false, '',           'So sorry to miss it.')
on conflict (guest_id) do nothing;

insert into public.wishes (id, guest_id, message, created_at) values
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-9000-000000000002',
   'Wishing you a lifetime of love and laughter. See you in Yaoundé!', now() - interval '2 days'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-9000-000000000003',
   'Congratulations to you both — sending all my love from afar.', now() - interval '1 day')
on conflict (id) do nothing;

-- ---------- The couple's studio account (dev) -------------------------------
-- The account must already exist in Authentication → Users.
insert into public.admins (user_id)
select id from auth.users where email = 'kingsleyngu25@gmail.com'
on conflict (user_id) do nothing;
