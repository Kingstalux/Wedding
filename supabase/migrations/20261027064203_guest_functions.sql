-- =============================================================================
-- Migration 3: what guests can do, through their private link
--
-- Guests never sign in. Their link contains a secret token, and every action
-- goes through one of these functions, which first looks the token up.
-- An unknown or removed token gets nothing.
--
-- `security definer` = the function runs with its owner's rights, so it can
-- read and write the tables that RLS closes to the public. That's safe
-- because each function only ever touches the rows of the guest whose token
-- was given, and checks its inputs itself.
--
-- Errors are raised with short codes ('rsvp_closed', 'links_not_allowed'…)
-- that the website translates into friendly English/French messages.
-- =============================================================================


-- The active guest for a token, or nothing.
create function private.guest_for_token(p_token text)
returns public.guests
language sql
stable
security definer
set search_path = ''
as $$
  select g.*
  from public.guests g
  where g.token = p_token
    and g.deleted_at is null;
$$;

-- Same "no web addresses" rule as the website (src/lib/validation.ts).
create function private.contains_link(p_text text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_text ~* '(https?://|www\.)|\m[a-z0-9-]+\.(com|net|org|cm|fr|io|me|ly|app|co)\M';
$$;


-- -----------------------------------------------------------------------------
-- get_invitation: everything a guest's page needs, in one call.
-- Also records the visit for the couple's "opened" tracking, unless the
-- couple is previewing (p_preview = true while signed in to the studio).
-- Returns null for an unknown or removed token.
-- -----------------------------------------------------------------------------
create function public.get_invitation(p_token text, p_preview boolean default false)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  g public.guests;
begin
  g := private.guest_for_token(p_token);
  if g.id is null then
    return null;
  end if;

  if not (p_preview and public.is_admin()) then
    update public.guests
       set open_count      = open_count + 1,
           first_opened_at = coalesce(first_opened_at, now()),
           last_opened_at  = now()
     where id = g.id;
  end if;

  return jsonb_build_object(
    'guest', jsonb_build_object(
      'name',      g.name,
      'lang',      g.lang,
      'pass_code', g.pass_code
    ),

    'rsvp', (
      select jsonb_build_object('attending', r.attending, 'diet', r.diet, 'note', r.note)
      from public.rsvps r
      where r.guest_id = g.id
    ),

    -- Guest book: visible messages, author's first name only, newest first.
    'wishes', coalesce((
      select jsonb_agg(w order by w.created_at desc)
      from (
        select wi.id,
               wi.message,
               wi.created_at,
               split_part(trim(author.name), ' ', 1) as author,
               wi.guest_id = g.id as mine
        from public.wishes wi
        join public.guests author on author.id = wi.guest_id
        where not wi.hidden
          and author.deleted_at is null
        order by wi.created_at desc
        limit 300
      ) w
    ), '[]'::jsonb),

    -- The couple's settings, minus what guests don't need to see.
    'settings', (
      select to_jsonb(s) - 'id' - 'wa_template_en' - 'wa_template_fr' - 'updated_at'
      from public.settings s
    ),

    'events', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id', e.id, 'title_en', e.title_en, 'title_fr', e.title_fr,
                 'starts_at', e.starts_at, 'ends_at', e.ends_at,
                 'venue', e.venue, 'maps_url', e.maps_url
               )
               order by e.starts_at, e.sort
             )
      from public.events e
      where e.visible
    ), '[]'::jsonb),

    'gallery', coalesce((
      select jsonb_agg(
               jsonb_build_object('id', p.id, 'path', p.path, 'width', p.width, 'height', p.height)
               order by p.sort, p.created_at
             )
      from public.gallery_photos p
    ), '[]'::jsonb)
  );
end;
$$;


-- -----------------------------------------------------------------------------
-- set_language: remember the guest's EN/FR choice (used for WhatsApp texts).
-- -----------------------------------------------------------------------------
create function public.set_language(p_token text, p_lang text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
begin
  if g.id is null then
    raise exception 'invalid_token';
  end if;
  if p_lang not in ('en', 'fr') then
    raise exception 'invalid_language';
  end if;
  update public.guests set lang = p_lang where id = g.id;
end;
$$;


-- -----------------------------------------------------------------------------
-- submit_rsvp: create or change the guest's reply.
-- Replies stay open until the celebration starts (settings.countdown_at); the
-- RSVP deadline shown on the site is a polite request, not a hard cut-off.
-- -----------------------------------------------------------------------------
create function public.submit_rsvp(
  p_token     text,
  p_attending boolean,
  p_diet      text default '',
  p_note      text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
  result public.rsvps;
begin
  if g.id is null then
    raise exception 'invalid_token';
  end if;
  if p_attending is null then
    raise exception 'answer_required';
  end if;
  if now() > (select countdown_at from public.settings) then
    raise exception 'rsvp_closed';
  end if;

  insert into public.rsvps as r (guest_id, attending, diet, note)
  values (
    g.id,
    p_attending,
    left(trim(coalesce(p_diet, '')), 200),
    left(trim(coalesce(p_note, '')), 500)
  )
  on conflict (guest_id) do update
    set attending    = excluded.attending,
        diet         = excluded.diet,
        note         = excluded.note,
        responded_at = now()
  returning r.* into result;

  return jsonb_build_object('attending', result.attending, 'diet', result.diet, 'note', result.note);
end;
$$;


-- -----------------------------------------------------------------------------
-- post_wish / delete_own_wish: the guest book.
-- -----------------------------------------------------------------------------
create function public.post_wish(p_token text, p_message text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
  msg text := trim(coalesce(p_message, ''));
  result public.wishes;
begin
  if g.id is null then
    raise exception 'invalid_token';
  end if;
  if length(msg) not between 1 and 500 then
    raise exception 'message_length';
  end if;
  if private.contains_link(msg) then
    raise exception 'links_not_allowed';
  end if;
  if (select count(*) from public.wishes
      where guest_id = g.id and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited';
  end if;

  insert into public.wishes (guest_id, message)
  values (g.id, msg)
  returning * into result;

  return jsonb_build_object(
    'id', result.id,
    'message', result.message,
    'created_at', result.created_at,
    'author', split_part(trim(g.name), ' ', 1),
    'mine', true
  );
end;
$$;

create function public.delete_own_wish(p_token text, p_wish_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
begin
  if g.id is null then
    raise exception 'invalid_token';
  end if;
  delete from public.wishes where id = p_wish_id and guest_id = g.id;
  return found;
end;
$$;


-- -----------------------------------------------------------------------------
-- announce_gift: "Let us know" from the cash gifts section.
-- -----------------------------------------------------------------------------
create function public.announce_gift(
  p_token   text,
  p_method  public.gift_method,
  p_amount  int default null,
  p_message text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.guests := private.guest_for_token(p_token);
  msg text := left(trim(coalesce(p_message, '')), 300);
begin
  if g.id is null then
    raise exception 'invalid_token';
  end if;
  if p_method is null then
    raise exception 'method_required';
  end if;
  if p_amount is not null and p_amount not between 1 and 100000000 then
    raise exception 'invalid_amount';
  end if;
  if private.contains_link(msg) then
    raise exception 'links_not_allowed';
  end if;
  if (select count(*) from public.gift_announcements
      where guest_id = g.id and created_at > now() - interval '1 day') >= 5 then
    raise exception 'rate_limited';
  end if;

  insert into public.gift_announcements (guest_id, method, amount_fcfa, message)
  values (g.id, p_method, p_amount, msg);
end;
$$;


-- -----------------------------------------------------------------------------
-- read_pass: what anyone scanning a pass's QR code may see. Deliberately
-- minimal: first name, whether they're coming, whether already checked in.
-- -----------------------------------------------------------------------------
create function public.read_pass(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'first_name', split_part(trim(g.name), ' ', 1),
    'attending',  r.attending,          -- true, false, or null (no reply yet)
    'checked_in', exists (select 1 from public.checkins c where c.guest_id = g.id)
  )
  from public.guests g
  left join public.rsvps r on r.guest_id = g.id
  where g.pass_code = upper(trim(p_code))
    and g.deleted_at is null;
$$;


-- Functions are callable by everyone by default; make that explicit for the
-- guest functions, and close the private helpers.
grant execute on function
  public.get_invitation(text, boolean),
  public.set_language(text, text),
  public.submit_rsvp(text, boolean, text, text),
  public.post_wish(text, text),
  public.delete_own_wish(text, uuid),
  public.announce_gift(text, public.gift_method, int, text),
  public.read_pass(text)
to anon, authenticated;

revoke execute on function
  private.guest_for_token(text),
  private.contains_link(text),
  private.random_string(int, text),
  private.new_token(),
  private.new_pass_code()
from public, anon, authenticated;

-- When the couple adds a guest from the studio, the `token` and `pass_code`
-- column defaults run as the couple's role, so it needs the two generators.
-- (The `private` schema is not reachable through the website's API.)
grant usage on schema private to authenticated;
grant execute on function
  private.random_string(int, text),
  private.new_token(),
  private.new_pass_code()
to authenticated;
