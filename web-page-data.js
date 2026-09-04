/* ============================================================
   THE ADAPTER — a submission, read as a marketing page.

   One function, `webPageData(state)`, and one job: turn Shipmate's submission
   state into the exact object shape the page layout already consumes. Nothing
   in here renders, mutates, or fetches. Given a state it returns a plain
   object; given a bare state it returns a plain object too, and that second
   case is the one that matters — a developer opens the Web section long
   before there is anything in it, and the page has to look finished anyway.

   WHY IT IS A SEPARATE FILE. The layout was prototyped standalone, against
   hand-written fixtures with a settled shape. Rather than rewrite the layout
   to read `state.*` in forty places, the fixtures' shape becomes the contract
   and this file is the only thing that knows both sides. If Adam moves a
   field, one file changes. If we change the page, this file does not.

   WHERE EACH VALUE COMES FROM, and it is worth reading once, because the
   answer is not always the obvious field:

     · the hero art is `uploads.steamKeyArtHero` — Steam's library_hero.jpg,
       3840×1240, found by _applySteamHeroBanner. NOT `background_raw`, which
       is the store page's backdrop and looks like one.
     · the hook is `webSite.description`. Adam's name for it is the right one:
       it is not a summary, it is the line that decides whether anybody reads
       the rest, so it leads the page rather than sitting in the hero.
     · screenshots prefer `webSite.screenshots` over `uploads.screenshots`.
       Both exist and are kept in sync by _wsSyncAutoScreenshots; the Web one
       is the richer of the two because it also holds shots added from the Web
       section itself, and honouring it is how a developer's curation for the
       marketing page survives.
     · the About block is `webSite.aboutGame`, then `history`, then
       `aboutDev` — three fields Adam edits separately and the page shows as
       one run of prose, because a reader who got this far wants the story,
       not a form.

   WHAT THIS DELIBERATELY DOES NOT RETURN. There is no `quotes` and no
   `facts`. Press quotes have no field and no honest default — invented praise
   for a real game is the worst thing this page could print — and the
   factsheet lost to the metadata band above it, which reads the same fields
   from the same source in a glance. The scrim is not here either: it is a
   constant in the page (SCRIM = 50), because how dark white type needs its
   ground to be is a typographic fact, not a preference.

   WHAT IS NOT HERE YET, honestly, rather than papered over with a default
   that looks like data:

     · THE LOGOTYPE. There is no field. `webSite.logo` is proposed and read
       below; until it exists this returns null and the page shows the name
       set in type, which is a finished-looking page and not a hole. The
       cheap fix is not a file upload — it is persisting the Steam app id
       (see below), because logo.png is then one probe away.
     · THE STEAM APP ID. _igdbFetchSteamAppId resolves it, hands it to three
       functions, and drops it (app.js:3510-3524). Persisting it as
       `webSite.steamAppId` costs one line and buys the logotype, the
       portrait, and a real store link for the buy button.
     · THE HERO TAGLINE. Distinct from the hook, and Adam has no field for
       it. Returned empty on purpose — the hero tagline is off by default,
       and inventing a line for a real developer's game is worse than none.
   ============================================================ */

/* ── SOURCES ──────────────────────────────────────────────────────────────
   An upload slot is either {name, dataUrl} when a person chose the file or
   {name, url} when Steam or IGDB supplied it. Everything downstream wants a
   src, so normalise once. Mirrors app.js:_screenshotSrc, and defers to it
   when it is loaded, so the IGDB proxy rule lives in exactly one place. */
function _wpSrc(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  if (typeof _screenshotSrc === 'function') return _screenshotSrc(entry) || null;
  if (entry.dataUrl) return entry.dataUrl;
  if (!entry.url) return null;
  if (entry.url.includes('images.igdb.com')) {
    const clean = entry.url.replace(/^https?:\/\//, '');
    return 'https://wsrv.nl/?url=' + encodeURIComponent(clean) + '&output=jpg';
  }
  return entry.url;
}

const _wpTrim = v => (typeof v === 'string' ? v.trim() : '');

/* ── CONTACT CHANNELS, DEDUCED ────────────────────────────────────────────
   `webSite.links` is a flat list of {id, name, url}: whatever Steam's store
   page listed, plus whatever the developer typed. The page wants typed
   channels instead, so it can draw the right mark.

   Deducing the channel from the URL rather than adding a `channel` field is
   deliberate and it is the cheap answer to a question that looked expensive:
   there is no migration, no new editor, and _applySteamSocialLinks keeps
   writing exactly what it writes today. A link's URL already says what it is;
   asking a developer to also pick from a dropdown would be asking them to
   repeat themselves.

   Order matters. `x.com` must be anchored or it matches every host ending in
   those two characters, and mastodon has no single domain at all — it is a
   federation, so the test is the @user@host shape rather than a hostname. */
const _WP_CHANNELS = [
  ['discord',   /(^|\.)discord\.(gg|com)/i],
  ['instagram', /(^|\.)instagram\.com/i],
  ['bluesky',   /(^|\.)bsky\.(app|social)/i],
  ['x',         /(^|\.)(twitter\.com|x\.com)/i],
  ['reddit',    /(^|\.)reddit\.com/i],
  ['mastodon',  /(^|\.)(mastodon|mstdn|mas)\.[a-z]/i],
];

function _wpChannelOf(url, label) {
  const u = _wpTrim(url);
  if (!u) return null;
  if (/^mailto:/i.test(u) || (!/^https?:/i.test(u) && u.includes('@') && u.includes('.'))) return 'email';
  let host = u;
  try { host = new URL(/^https?:/i.test(u) ? u : 'https://' + u).hostname; } catch (e) { /* keep the raw string */ }
  for (const [channel, re] of _WP_CHANNELS) if (re.test(host)) return channel;
  // A mastodon instance is any host at all, so the handle shape is the tell.
  if (/^@[^@\s]+@[^@\s]+$/.test(u)) return 'mastodon';
  // Everything we cannot name is still a link worth showing: YouTube, TikTok,
  // Facebook, a devlog. 'web' is a real channel, not a failure to classify.
  return 'web';
}

/* The handle, for display. A contact row reads better as @yourstudio than as
   https://www.instagram.com/yourstudio/?hl=en — but only when we are sure we
   have the handle, so anything with a query string or more than one path
   segment keeps its host instead of being truncated into a lie. */
function _wpHandle(url, channel) {
  const u = _wpTrim(url);
  if (!u) return '';
  if (channel === 'email') return u.replace(/^mailto:/i, '');
  let parsed = null;
  try { parsed = new URL(/^https?:/i.test(u) ? u : 'https://' + u); } catch (e) { return u; }
  const segs = parsed.pathname.split('/').filter(Boolean);
  const host = parsed.hostname.replace(/^www\./, '');
  if (channel === 'discord') return segs.length ? 'discord.gg/' + segs[segs.length - 1] : host;
  if (channel === 'reddit')  return segs.length >= 2 ? segs[0] + '/' + segs[1] : host;
  // Some hosts already put the @ in the path (mastodon, youtube), some do not
  // (instagram, x). Prefixing blindly gives @@studio, so ask first.
  const at = seg => (seg.startsWith('@') ? seg : '@' + seg);
  if (channel === 'bluesky') return segs.length ? at(segs[segs.length - 1]) : host;
  if (channel === 'web')     return host;
  if (segs.length === 1 && !parsed.search) return at(segs[0]);
  return host;
}

/* The contact row the footer draws: every deduced channel, in the page's own
   order rather than the order Steam happened to list them, with the email
   first because it is the one every studio has. A channel with no link is
   simply absent — the footer is not a checklist. */
function _wpContact(ws) {
  const rows = [];
  const seen = new Set();
  const push = (channel, handle) => {
    const h = _wpTrim(handle);
    if (!h || seen.has(channel)) return;
    seen.add(channel);
    rows.push([channel, h, true]);
  };
  push('email', ws.email);
  for (const link of (ws.links || [])) {
    const channel = _wpChannelOf(link && link.url, link && link.name);
    if (channel) push(channel, _wpHandle(link.url, channel));
  }
  if (_wpTrim(ws.officialWebsite)) push('web', _wpHandle(ws.officialWebsite, 'web'));
  return rows;
}

/* ── PLATFORMS ────────────────────────────────────────────────────────────
   The availability marks. state.activePlatforms is a Set of Shipmate's own
   platform ids, and the page can draw all seven — four as line art from
   PROTO_PLATFORM_ICONS, the three consoles as white PNGs (see STORE_ICONS).
   Listed explicitly rather than passed through so the row's order is the
   page's own, stable whatever order the platforms were ticked in, and so an
   id we have no mark for can never reach the row as a blank square. */
const _WP_MARKS = ['steam', 'epic', 'ios', 'android', 'psn', 'xbox', 'switch'];

function _wpStores(state) {
  const active = state.activePlatforms;
  const list = active instanceof Set ? [...active] : Array.isArray(active) ? active : [];
  const has = id => list.includes(id);
  const out = _WP_MARKS.filter(has);
  // macOS ships inside the same Apple submission, so it earns the iOS mark
  // rather than disappearing; without this a Mac-only game shows no marks.
  if (!out.includes('ios') && has('macos')) out.push('ios');
  return out;
}

/* ── PROSE ────────────────────────────────────────────────────────────────
   THE PAGE HAS EXACTLY TWO BLOCKS OF TEXT, AND EACH ONE IS A FIELD.

     the lead, above the trailer  ←→  webSite.description   (the Hook)
     About, below the trailer     ←→  webSite.aboutGame

   One to one, in both directions. That is the whole rule, and keeping it that
   simple is what makes editing the page on the page possible at all: a block
   of prose you can click into is a VIEW of a submission field, never a copy
   of one, so there is never a question of which of the two is authoritative
   or when they get reconciled.

   THE ABOUT AREA IS A LIST OF PARTS, NOT ONE STRING, and that is the whole
   trick. It renders today as one continuous run of prose below the trailer —
   About This Game, then History, then About the Developer, no headings, so it
   reads as a single piece of writing. But it is structurally three blocks,
   each carrying the name of the field it came from, so each one is still a
   view of exactly one field and can still be typed into.

   The alternative was to fold the three fields into one at the source. It was
   briefly implemented and then thrown away, because it is a one-way door:
   emptying `history` and `aboutDev` destroys the very thing we would need to
   promote them into their own scroll sections later. Composing at render
   costs nothing and keeps that door open — the day they get their own
   headings, only `label` starts being drawn, and no data has to be recovered
   from anywhere.

   Blank parts are dropped rather than rendered as gaps, so a submission with
   only About This Game is one block, not one block and two empty ones. */
const _WP_ABOUT_PARTS = [
  ['aboutGame', 'About this game'],
  ['history',   'History'],
  ['aboutDev',  'About the developer'],
];

function _wpAboutParts(ws, fd) {
  return _WP_ABOUT_PARTS.map(([field, label]) => ({
    field,
    label,
    // Only About This Game has a fallback: Game Details' own description is
    // the same text about the same game. Nothing stands in for the other two.
    text: field === 'aboutGame' ? (_wpTrim(ws[field]) || _wpTrim(fd.description)) : _wpTrim(ws[field]),
  })).filter(p => p.text);
}

/* THE METADATA BAND. Six rows, two clean lines of three, and ALL SIX ARE
   ALWAYS RETURNED — an empty one carries an empty value rather than being
   dropped.

   This reverses an earlier decision, and the reason is worth keeping. Dropping
   empty rows is right for a PUBLISHED page: a band full of dashes advertises
   how little is known about the game. But this band is first seen inside the
   submission, where the developer is filling the fields in, and there the
   opposite is true — a row that appears out of nowhere when you type into a
   form you cannot see is a page that changes shape under you. Showing all six
   from the start means the layout settles once, and every field you fill has
   a visible place waiting for it.

   The empty value stays an empty STRING here rather than a dash: this file
   reads content and says what is true, and "unknown" is not the character
   '—'. The band's renderer is what decides to draw a dash, because that is a
   presentation decision, and the footer — which reads the same rows — uses
   the same emptiness to skip a line rather than print a dash in a sentence.

   'stores' is a sentinel the layout replaces with the availability marks. */
function _wpStrip(ws, fd, stores) {
  return [
    ['Developed by', _wpTrim(ws.developer)],
    ['Published by', _wpTrim(ws.publisher)],
    ['Release date', _wpTrim(ws.releaseDate)],
    ['Available on', stores.length ? 'stores' : ''],
    ['Genres',       _wpTrim(ws.genres)],
    ['Contact',      _wpTrim(ws.email)],
  ];
}

/* ── THE HERO ART ─────────────────────────────────────────────────────────
   Key Art has four uploaders and they are all real answers to "what does this
   game look like". Reading only the first meant that uploading a Header — a
   perfectly good wide banner — left the page showing generated placeholder
   art, which reads as the upload having failed.

   THE DEVELOPER'S OWN CHOICE COMES FIRST. `webSite.capsuleSource` is the
   dropdown in the Key Art panel, and in Adam's design it picks which artwork
   fills the capsule that overlaps his hero. Our design has no capsule — the
   art runs full bleed — so that dropdown has nowhere to point unless we point
   it here. Ignoring it meant picking "Header Image" changed nothing on the
   page, which is worse than the dropdown not existing.

   The exception is the IGDB cover, which is the dropdown's default: 264×374
   is a portrait, and a portrait stretched across a 2.18:1 hero is a smear.
   Choosing it is not a request to ruin the page, so it falls through to the
   chain — and the chain runs widest first, because the hero is a wide box:
   the library hero (3840×1240) is made for exactly this, the header (460×215)
   is the next best shape, the small capsule (231×87) is coarse stretched but
   is still the developer's own artwork. Past that, the generated scene, which
   is a better answer than mangling real art. */
const _WP_SOURCE_FIELD = {
  headerImage:  'steamHeaderImage',
  capsuleImage: 'steamCapsuleImage',
  // igdbCoverArt intentionally absent: see above.
};

function _wpHero(ws, ups) {
  const picked = _WP_SOURCE_FIELD[_wpTrim(ws.capsuleSource)];
  return (picked && _wpSrc(ups[picked])) ||
         _wpSrc(ups.steamKeyArtHero) ||
         _wpSrc(ups.steamHeaderImage) ||
         _wpSrc(ups.steamCapsuleImage);
}

/* ── THE TRAILER ──────────────────────────────────────────────────────────
   Three possible sources and a firm order of precedence: a YouTube URL the
   developer typed wins, because typing it is a decision; then Steam's own
   trailer, which arrives with a thumbnail and an HLS stream; then a file
   they uploaded, which we can name but not show a frame of.

   A game with no trailer at all is normal, and it crashed the importer
   yesterday — hence the null rather than a half-built object. */
/* A YouTube link carries its own poster, and it is worth digging out: without
   it the trailer block fell back to the key art with a play button over it,
   which looks like the trailer failed to load rather than like a trailer.

   hqdefault rather than maxresdefault: maxres only exists for videos uploaded
   above 720p and 404s silently for the rest, and a missing poster here is the
   exact bug being fixed. hq is always present. */
function _wpYouTubeId(url) {
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function _wpTrailer(ws, fd, ups) {
  const typed = _wpTrim(fd.trailerUrl) || _wpTrim(ws.trailerUrl);
  if (typed) {
    const id = _wpYouTubeId(typed);
    return {
      poster: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null,
      label: 'Trailer', url: typed, youtube: id,
    };
  }
  const st = ups.steamTrailer;
  if (st && (st.thumbnail || st.hlsUrl)) {
    return { poster: st.thumbnail || null, label: 'Trailer', hls: st.hlsUrl || null };
  }
  const file = ups.trailer || ws.trailerFile;
  if (file && file.name) return { poster: null, label: file.name };
  return null;
}

/* ── THE PAGE ─────────────────────────────────────────────────────────────
   Everything above, assembled. Every field of the layout's contract is
   present whatever the state contains, because a missing key and an empty
   one fail differently and only one of them fails quietly. */
function webPageData(state) {
  const s   = state || {};
  const fd  = s.formData || {};
  const ups = s.uploads  || {};
  const ws  = s.webSite  || {};
  const loc = s.steamLocInfo || {};

  const title  = _wpTrim(fd.title);
  const stores = _wpStores(s);
  // The same slug rule the preview already uses, so the URL a developer sees
  // in the fake browser chrome never changes under them.
  const slug   = title.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yourgame';
  const hook   = _wpTrim(ws.description) || _wpTrim(loc.shortDescription);
  const accent = _wpTrim(ws.accent) || '#0EA5A4';

  const shots = (ws.screenshots && ws.screenshots.length ? ws.screenshots : (ups.screenshots || []))
    .map(_wpSrc).filter(Boolean);

  return {
    name:  title || 'Your Game',
    slug,
    real:  !!title,
    appid: ws.steamAppId || null,       // not persisted yet — see the note above

    title: title || 'Your Game',
    tagline: '',

    accent,
    cta: accent,
    ctaLabel: 'Buy now',
    // The buy button needs no field of its own: the label is fixed, the price
    // is Adam's, and the destination is the official site, falling back to the
    // Steam page when there is one. A field would be a question with an
    // obvious answer.
    price: _wpTrim(ws.price),
    ctaHref: _wpTrim(ws.officialWebsite) ||
             (ws.steamAppId ? 'https://store.steampowered.com/app/' + ws.steamAppId : ''),

    logo:     _wpSrc(ws.logo),                    // no field yet — null today

    // The hero art, chosen by _wpHero below.
    hero:     _wpHero(ws, ups),
    // What the <img> falls back to if the first choice 404s: the next link in
    // the same chain, never the same URL twice.
    header:   _wpSrc(ups.steamHeaderImage) || _wpSrc(ups.steamCapsuleImage),
    portrait: _wpSrc(ups.steamKeyArtCapsule),
    icon:     _wpSrc(ups.appIcon),

    trailer: _wpTrailer(ws, fd, ups),
    shots,

    studio: _wpTrim(ws.developer),
    line:   '',                                   // hero tagline — no field
    stores,
    strip:  _wpStrip(ws, fd, stores),

    about: _wpAboutParts(ws, fd),
    // The layout cycles alternative hooks; a submission has exactly one, and
    // one is a valid cycle.
    minis: hook ? [hook] : [],
    contact: _wpContact(ws),
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { webPageData, _wpAboutParts,
                     _wpChannelOf, _wpHandle, _wpContact, _wpStores, _wpSrc };
}
