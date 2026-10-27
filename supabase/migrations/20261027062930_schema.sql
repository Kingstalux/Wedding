-- =============================================================================
-- Migration 1: the tables
--
-- Creates every table the wedding site needs. Security rules (who may read or
-- write what) come in the next migration; until then RLS is switched ON with
-- no policies, which means: nobody using the public key can touch anything.
--
-- Run with:  supabase db push
-- Never edit this file after it has been pushed: add a new migration instead.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- A private schema for helper functions.
-- Supabase's API only exposes the `public` schema, so nothing in `private`
-- can be called from the browser.
-- -----------------------------------------------------------------------------
create schema if not exists private;

-- Random text from a given alphabet, using cryptographically secure bytes.
-- Used for guests' secret link tokens and their pass codes.
create function private.random_string(len int, alphabet text)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  bytes bytea := extensions.gen_random_bytes(len);
  result text := '';
begin
  for i in 0 .. len - 1 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return result;
end;
$$;

-- 16 characters from 62 letters/digits ≈ 95 bits: impossible to guess.
create function private.new_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select private.random_string(16, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
$$;

-- 6 characters without look-alikes (no 0/O, 1/I/L), easy to read out at the door.
create function private.new_pass_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select private.random_string(6, 'ABCDEFGHJKMNPQRSTUVWXYZ23456789');
$$;

-- Keeps an `updated_at` column current on every UPDATE.
create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- settings: one single row holding everything the couple edits in
-- "Site & texts". `id boolean ... check (id)` allows only the value true,
-- so a second row can never be inserted.
-- -----------------------------------------------------------------------------
create table public.settings (
  id               boolean primary key default true check (id),

  bride            text not null default 'Bride',
  groom            text not null default 'Groom',
  city             text not null default 'Yaoundé, Cameroon',
  countdown_at     timestamptz not null default '2026-12-23 11:00:00+01',
  rsvp_deadline    date,

  -- Photos and music are files in Storage; these columns hold their paths.
  hero_path        text,
  word_photo_path  text,
  music_path       text,
  music_title      text,

  word_en          text not null default '',
  word_fr          text not null default '',
  show_word        boolean not null default true,

  dress_en         text not null default '',
  dress_fr         text not null default '',
  show_dress       boolean not null default true,

  show_gallery     boolean not null default true,
  show_wishes      boolean not null default true,
  show_gifts       boolean not null default true,

  momo_number      text,
  momo_name        text,
  om_number        text,
  om_name          text,
  show_gift_box    boolean not null default true,
  gift_box_note_en text not null default '',
  gift_box_note_fr text not null default '',

  wa_template_en   text not null default '',
  wa_template_fr   text not null default '',

  updated_at       timestamptz not null default now()
);

create trigger settings_touch before update on public.settings
  for each row execute function private.touch_updated_at();

-- The one row, with default values. Texts are filled in by seed data.
insert into public.settings default values;


-- -----------------------------------------------------------------------------
-- events: the programme (civil wedding, traditional wedding, church, reception)
-- -----------------------------------------------------------------------------
create table public.events (
  id         uuid primary key default gen_random_uuid(),
  title_en   text not null check (length(trim(title_en)) > 0),
  title_fr   text not null default '',
  starts_at  timestamptz not null,
  ends_at    timestamptz check (ends_at is null or ends_at > starts_at),
  venue      text not null default '',
  maps_url   text check (maps_url is null or maps_url ~* '^https://'),
  sort       int not null default 0,
  visible    boolean not null default true,
  created_at timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- gallery_photos: one row per photo in "Moments We'll Cherish"
-- -----------------------------------------------------------------------------
create table public.gallery_photos (
  id         uuid primary key default gen_random_uuid(),
  path       text not null unique,   -- file path in the "media" storage bucket
  width      int check (width > 0),
  height     int check (height > 0),
  sort       int not null default 0,
  created_at timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- guests: one row per invitation (one person each)
-- -----------------------------------------------------------------------------
create table public.guests (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (length(trim(name)) between 1 and 120),
  -- Digits only, with country code, e.g. 237677123456 (what wa.me expects).
  phone           text check (phone is null or phone ~ '^[0-9]{8,15}$'),
  lang            text check (lang in ('en', 'fr')),

  -- The secret in the guest's link: /i/<token>
  token           text not null unique default private.new_token(),
  -- Printed on the entrance pass and encoded in its QR code.
  pass_code       text not null unique default private.new_pass_code(),

  -- Tracking shown in the studio
  invite_sent_at  timestamptz,
  first_opened_at timestamptz,
  last_opened_at  timestamptz,
  open_count      int not null default 0,

  -- "Removed" guests are hidden, not deleted, so they can be restored.
  deleted_at      timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index guests_phone_idx on public.guests (phone) where phone is not null;
create index guests_active_idx on public.guests (created_at) where deleted_at is null;

create trigger guests_touch before update on public.guests
  for each row execute function private.touch_updated_at();


-- -----------------------------------------------------------------------------
-- rsvps: a guest's reply. At most one per guest (guest_id is the primary key).
-- `on delete cascade`: if a guest row is ever really deleted, so is the reply.
-- -----------------------------------------------------------------------------
create table public.rsvps (
  guest_id     uuid primary key references public.guests (id) on delete cascade,
  attending    boolean not null,
  diet         text not null default '' check (length(diet) <= 200),
  note         text not null default '' check (length(note) <= 500),
  responded_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger rsvps_touch before update on public.rsvps
  for each row execute function private.touch_updated_at();


-- -----------------------------------------------------------------------------
-- checkins: who came through the door, per event (a guest may attend several)
-- -----------------------------------------------------------------------------
create table public.checkins (
  guest_id      uuid not null references public.guests (id) on delete cascade,
  event_id      uuid not null references public.events (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  primary key (guest_id, event_id)
);


-- -----------------------------------------------------------------------------
-- wishes: the guest book
-- -----------------------------------------------------------------------------
create table public.wishes (
  id         uuid primary key default gen_random_uuid(),
  guest_id   uuid not null references public.guests (id) on delete cascade,
  message    text not null check (length(trim(message)) between 1 and 500),
  hidden     boolean not null default false,   -- hidden by the couple
  created_at timestamptz not null default now()
);

create index wishes_recent_idx on public.wishes (created_at desc);
create index wishes_guest_idx on public.wishes (guest_id, created_at desc);


-- -----------------------------------------------------------------------------
-- gift_announcements: "Let us know" messages from the cash gifts section.
-- Guests only *announce* a gift; the couple ticks `received` after checking
-- their MoMo / Orange Money account.
-- -----------------------------------------------------------------------------
create type public.gift_method as enum ('momo', 'orange', 'cash');

create table public.gift_announcements (
  id          uuid primary key default gen_random_uuid(),
  guest_id    uuid not null references public.guests (id) on delete cascade,
  method      public.gift_method not null,
  amount_fcfa int check (amount_fcfa is null or amount_fcfa between 1 and 100000000),
  message     text not null default '' check (length(message) <= 300),
  received    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index gift_announcements_guest_idx on public.gift_announcements (guest_id, created_at desc);


-- -----------------------------------------------------------------------------
-- admins: which signed-in accounts are the couple. Signing in is not enough:
-- the account must also be listed here (checked by is_admin() in migration 2).
-- -----------------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- Row Level Security ON for every table, with no policies yet = deny all
-- requests made with the public key. Migration 2 opens exactly what's needed.
-- -----------------------------------------------------------------------------
alter table public.settings           enable row level security;
alter table public.events             enable row level security;
alter table public.gallery_photos     enable row level security;
alter table public.guests             enable row level security;
alter table public.rsvps              enable row level security;
alter table public.checkins           enable row level security;
alter table public.wishes             enable row level security;
alter table public.gift_announcements enable row level security;
alter table public.admins             enable row level security;
