/* ============================================================
   AI — Claude-powered questionnaire auto-fill
   ============================================================ */

const CLAUDE_API_KEY  = (typeof CONFIG !== 'undefined' &&
                         CONFIG.CLAUDE_API_KEY &&
                         CONFIG.CLAUDE_API_KEY !== '__CLAUDE_API_KEY__')
                        ? CONFIG.CLAUDE_API_KEY : '';
const CLAUDE_MODEL    = 'claude-haiku-4-5-20251001';
const CLAUDE_ENDPOINT = 'https://api.anthropic.com/v1/messages';

/* ── WHY A FAILED CALL SAID "API 400" AND NOTHING ELSE ────────────────────
   Twenty call sites POST to CLAUDE_ENDPOINT. Three of them read the error
   body; the other SEVENTEEN were `throw new Error('API ' + res.status)`,
   which throws away the one part of the response that says what went wrong.
   Anthropic puts the reason in `error.message` — "image exceeds 5 MB
   maximum: 7340032 bytes", "unsupported media type", "credit balance is too
   low" — so a step could fail for a knowable, fixable reason and report a
   bare number. That is not a thin error message, it is a DISCARDED one, and
   it cost a round trip to answer "what's the 400?" with a shrug.

   The three that got it right were byte-identical copies of each other,
   differing only in their console tag — the shape this file keeps catching
   (`smCheckSVG`, `SM_STEP_CHEVRON`, `setPrivacyMeta`), and the one where
   copies drift. So the block is lifted here once and all twenty read it.

   The status map stays: 429, 401 and 500/529 are conditions a person can act
   on and the API's own wording for them is worse than ours. Everything else
   defers to `error.message`, because we cannot anticipate it and it is
   already written for a developer. It is `async` because reading the body
   is — hence `throw await smClaudeHttpError(res)` at every call site. */
async function smClaudeHttpError(res, tag) {
  let rawBody = {};
  try { rawBody = await res.json(); } catch (_) {}
  console.error(`${tag || '[Claude]'} HTTP`, res.status, JSON.stringify(rawBody, null, 2));
  const raw = rawBody.error?.message || '';
  let msg = `Request failed (${res.status})`;
  if (res.status === 429) msg = 'Rate limit reached — please retry in a moment.';
  else if (res.status === 401) msg = 'API key rejected — check the key is valid.';
  else if (res.status === 500 || res.status === 529) msg = 'Claude is temporarily overloaded — please retry.';
  else msg = raw || msg;
  return new Error(msg);
}

/* ── Screenshot content blocks (shared across all inference calls) ── */
// Returns up to 3 screenshot image content blocks for the Claude API messages array.
// Returns [] if no screenshots are uploaded.
function _buildScreenshotContent() {
  const screenshots = ((state.uploads || {}).screenshots || []).slice(0, 3);
  const blocks = [];
  for (const sc of screenshots) {
    if (sc.dataUrl && sc.dataUrl.includes(',')) {
      const [meta, data] = sc.dataUrl.split(',');
      const mimeType = meta.split(':')[1]?.split(';')[0] || 'image/png';
      blocks.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data } });
    }
  }
  return blocks;
}

/* ── Prompt builder ───────────────────────────────────────── */

function buildGeminiPrompt() {
  const fd  = state.formData;
  const ups = state.uploads;
  const hasScreenshots = (ups.screenshots || []).length > 0;
  const hasIAP = state.questionAnswers.inAppPurchases;

  return `You are an expert Apple App Store submission consultant analyzing a mobile game. Based on the game data below${hasScreenshots ? ' and the provided screenshots' : ''}, return a single JSON object with your best inferences for the App Store questionnaire.

GAME DATA:
Title: ${fd.title || '(untitled)'}
Description: ${fd.description || '(none provided)'}
Price: ${fd.price ? `$${fd.price}` : 'Free'}
Primary Language: ${fd.primaryLanguage || 'en'}
In-App Purchases (from developer): ${hasIAP === 'yes' ? 'Yes' : hasIAP === 'no' ? 'No' : 'Unknown'}
${hasScreenshots ? `Screenshots provided: ${ups.screenshots.length} image(s) — analyze visual content carefully.` : 'No screenshots provided.'}

Return ONLY a valid JSON object — no markdown fences, no explanation outside the JSON.

Each answer must include a "confidence" integer from 0–100 indicating how certain you are based on the available information:
- 90–100: Very certain (strong evidence from description/screenshots)
- 70–89: Reasonably confident (some evidence, plausible inference)
- Below 70: Uncertain (insufficient information — still provide your best guess)

SCHEMA (every field required — no nulls):
{
  "intensityQuestions": {
    "profanity":          { "value": "none|infrequent|frequent", "confidence": 0-100 },
    "horrorFear":         { "value": "none|infrequent|frequent", "confidence": 0-100 },
    "substancesAlcohol":  { "value": "none|infrequent|frequent", "confidence": 0-100 },
    "medicalTreatment":   { "value": "none|infrequent|frequent", "confidence": 0-100 },
    "matureSuggestive":   { "value": "none|infrequent|frequent", "confidence": 0-100 },
    "sexualContent":      { "value": "none|infrequent|frequent", "confidence": 0-100 },
    "graphicSexual":      { "value": "none|infrequent|frequent", "confidence": 0-100 },
    "cartoonViolence":    { "value": "none|infrequent|frequent", "confidence": 0-100 },
    "realisticViolence":  { "value": "none|infrequent|frequent", "confidence": 0-100 },
    "extendedViolence":   { "value": "none|infrequent|frequent", "confidence": 0-100 },
    "gunsWeapons":        { "value": "none|infrequent|frequent", "confidence": 0-100 },
    "simulatedGambling":  { "value": "none|infrequent|frequent", "confidence": 0-100 },
    "contests":           { "value": "none|infrequent|frequent", "confidence": 0-100 }
  },
  "ynQuestions": {
    "parentalControls":     { "value": "yes|no", "confidence": 0-100 },
    "ageAssurance":         { "value": "yes|no", "confidence": 0-100 },
    "unrestrictedInternet": { "value": "yes|no", "confidence": 0-100 },
    "userGenContent":       { "value": "yes|no", "confidence": 0-100 },
    "socialMedia":          { "value": "yes|no", "confidence": 0-100 },
    "socialMediaU13Off":    { "value": "yes|no", "confidence": 0-100 },
    "messagingChat":        { "value": "yes|no", "confidence": 0-100 },
    "advertising":          { "value": "yes|no", "confidence": 0-100 },
    "healthWellness":       { "value": "yes|no", "confidence": 0-100 },
    "realMoneyGambling":    { "value": "yes|no", "confidence": 0-100 },
    "lootBoxes":            { "value": "yes|no", "confidence": 0-100 }
  },
  "privacy": {
    "collectsData": { "value": "yes|no", "confidence": 0-100 },
    "dataTypes": [
      { "id": "crash", "confidence": 0-100, "purposes": ["analytics","app_function"], "identity": "no", "tracking": "no" }
    ]
  },
  "business": {
    "hasIAP": { "value": "yes|no", "confidence": 0-100 },
    "iapTypes": []
  },
  "exportCompliance": {
    "usesEncryption":   { "value": "yes|no", "confidence": 0-100 },
    "encryptionExempt": { "value": "yes|no", "confidence": 0-100 }
  },
  "ageCategory": { "value": "not_applicable|made_for_kids|override_higher", "confidence": 0-100 }
}

VALID IDs — only use these exact strings:
privacy.dataTypes[].id: name, email, phone, address, other_contact, health, fitness, payment_info, credit_info, other_financial, precise_loc, coarse_loc, sensitive, contacts, messages, photos_videos, audio, gameplay, customer_support, other_uc, browsing, search, user_id, device_id, purchases, product_use, ad_data, other_usage, crash, performance, other_diag, env_scan, hands, head, other

privacy.dataTypes[].purposes (array): first_party_ads, third_party_ads, analytics, personalization, app_function, other_purpose

business.iapTypes (array): consumable, non-consumable, auto-renewable, non-renewing

ageCategory: "not_applicable" for most games; "made_for_kids" only if explicitly designed for children under 13; "override_higher" only if a manual rating bump is needed.

INFERENCE GUIDELINES:
- Nearly all networked mobile games use HTTPS → usesEncryption: "yes" (confidence: 95), encryptionExempt: "yes" (confidence: 90)
- Most games collect crash and performance data → include crash + performance with purposes: ["analytics","app_function"], confidence 90
- Games with accounts/login → add user_id
- Games with analytics → add product_use with purposes: ["analytics"]
- Be conservative: default to "no" / "none" for content you cannot confirm
- "infrequent" = present but not central; "frequent" = a primary element of the experience
- Set confidence < 70 for fields where you genuinely cannot determine the answer from the game data`;
}

/* ── API call ─────────────────────────────────────────────── */

async function analyzeGameWithClaude() {
  if (!CLAUDE_API_KEY) throw new Error('NO_KEY');
  const ups = state.uploads;
  console.log('[Claude] Calling model:', CLAUDE_MODEL);

  // Build message content: text prompt + up to 3 screenshots
  const content = [];

  const screenshots = (ups.screenshots || []).slice(0, 3);
  for (const sc of screenshots) {
    if (sc.dataUrl && sc.dataUrl.includes(',')) {
      const [meta, data] = sc.dataUrl.split(',');
      const mimeType = meta.split(':')[1]?.split(';')[0] || 'image/png';
      content.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data } });
    }
  }

  const promptText = buildGeminiPrompt();
  state.claudeLastPrompt = promptText;  // store for "See prompt" debug view
  content.push({ type: 'text', text: promptText });

  const res = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key':                              CLAUDE_API_KEY,
      'anthropic-version':                      '2023-06-01',
      'content-type':                           'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      CLAUDE_MODEL,
      max_tokens: 3000,
      messages:   [{ role: 'user', content }],
    }),
  });

  if (!res.ok) throw await smClaudeHttpError(res, '[Claude]');

  const apiData = await res.json();
  console.log('[Claude] Success — tokens used:', apiData.usage?.input_tokens, '+', apiData.usage?.output_tokens);

  const text = apiData.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Claude');

  // Strip markdown fences if present, then parse
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

/* ── Apply results to state ───────────────────────────────── */

function applyClaudeResults(result) {
  const a    = state.iosSubmitAnswers;
  const meta = state.iosAnswerMeta;
  let filled = 0;
  let total  = 0;

  // Helper: apply a field if valid value, confidence >= 70, and not human-confirmed
  function tryApply(fieldId, entry, validValues) {
    total++;
    if (!entry || typeof entry !== 'object') return;
    const { value, confidence } = entry;
    if (!validValues.includes(value)) return;
    if (typeof confidence !== "number" || confidence < 80) return;
    // Precedence: human answer (direct click or onboarding seed) always wins
    if (meta[fieldId]?.humanConfirmed) { filled++; return; }
    a[fieldId] = value;
    meta[fieldId] = { confidence, humanConfirmed: false };
    filled++;
  }

  // Intensity questions (none / infrequent / frequent)
  if (result.intensityQuestions) {
    IOS_INTENSITY_QUESTIONS.forEach(q => {
      tryApply(q.id, result.intensityQuestions[q.id], ['none', 'infrequent', 'frequent']);
    });
  }

  // Boolean content questions (yes / no)
  if (result.ynQuestions) {
    IOS_CONTENT_YN_QUESTIONS.forEach(q => {
      tryApply(q.id, result.ynQuestions[q.id], ['yes', 'no']);
    });
  }

  // Privacy — not inferred by AI; user must fill manually via the matrix

  // Business
  if (result.business) {
    tryApply('hasIAP', result.business.hasIAP, ['yes', 'no']);
    // Only suggest iapTypes if hasIAP wasn't human-confirmed — avoids overwriting
    // user's explicit IAP type selections when they've already answered this section
    if (Array.isArray(result.business.iapTypes) && !meta.hasIAP?.humanConfirmed) {
      const valid = ['consumable', 'non-consumable', 'auto-renewable', 'non-renewing'];
      a.iapTypes = result.business.iapTypes.filter(t => valid.includes(t));
    }
  }

  // Export compliance
  if (result.exportCompliance) {
    tryApply('usesEncryption',   result.exportCompliance.usesEncryption,   ['yes', 'no']);
    tryApply('encryptionExempt', result.exportCompliance.encryptionExempt, ['yes', 'no']);
  }

  // Age category
  tryApply('ageCategory', result.ageCategory, ['not_applicable', 'made_for_kids', 'override_higher']);

  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  console.log(`[Claude] Applied ${filled}/${total} fields (${pct}%)`);
  return { filled, total, pct };
}


/* ══════════════════════════════════════════════════════════════
   CONSOLIDATED QUESTIONNAIRE — AI Inference
══════════════════════════════════════════════════════════════ */

/* ── Build a summary of any existing human-confirmed iOS answers ── */
function _summarizeKnownAnswers() {
  const a    = state.iosSubmitAnswers;
  const meta = state.iosAnswerMeta;
  const lines = [];

  // Intensity answers the human has confirmed
  IOS_INTENSITY_QUESTIONS.forEach(q => {
    const m = meta[q.id];
    if (m?.humanConfirmed && a[q.id]) {
      lines.push(`${q.label}: ${a[q.id]}`);
    }
  });

  // Boolean content answers
  IOS_CONTENT_YN_QUESTIONS.forEach(q => {
    const m = meta[q.id];
    if (m?.humanConfirmed && a[q.id]) {
      lines.push(`${q.label}: ${a[q.id]}`);
    }
  });

  // CQ answers already confirmed by human (e.g. from a previous pass)
  Object.entries(state.cqAnswers).forEach(([qid, ans]) => {
    const m = state.cqAnswerMeta[qid];
    if (m?.humanConfirmed) {
      const q = CQ_QUESTIONS.find(x => x.id === qid);
      if (q) lines.push(`${q.text}: ${Array.isArray(ans) ? ans.join(', ') : ans}`);
    }
  });

  return lines.length ? lines.join('\n') : 'None yet.';
}

/* ── Build the CQ prompt ─────────────────────────────────────── */
function buildCQPrompt() {
  const fd = state.formData;

  // Collect visible question IDs and their text/type for the prompt
  const visible = CQ_QUESTIONS.filter(q => {
    // Only include top-level visible questions (skip deep conditionals for brevity)
    if (!q.platforms.some(p => state.activePlatforms.has(p))) return false;
    return !q.parent; // top-level only; Claude can infer children via context
  });

  const questionList = visible.map(q => {
    const typeHint = q.type === 'yn' ? '"yes" or "no"'
      : q.type === 'single' ? `one of: ${(q.options || []).map(o => `"${o}"`).join(', ')}`
      : q.type === 'multi'  ? `array of: ${(q.options || []).map(o => `"${o}"`).join(', ')}`
      : 'free text string';
    return `  "${q.id}": { "value": <${typeHint}>, "confidence": 0-100 }`;
  }).join(',\n');

  return `You are an expert game content classifier. Based on the game data below, answer the consolidated platform content questionnaire used for iOS, Google Play, Steam, and Epic Games Store submissions.

GAME DATA:
Title: ${fd.title || '(untitled)'}
Description: ${fd.description || '(none provided)'}
Price: ${fd.price ? `$${fd.price}` : 'Free'}
Active platforms: ${[...state.activePlatforms].join(', ')}
${state.formData.genre ? `Genre: ${state.formData.genre}` : ''}

PREVIOUSLY CONFIRMED ANSWERS (treat these as ground truth — do not contradict them):
${_summarizeKnownAnswers()}

Return ONLY a valid JSON object — no markdown fences, no explanation. Confidence 0–100:
- 90–100: Very certain (clear evidence from title/description)
- 70–89: Reasonably confident (plausible inference)
- Below 70: Uncertain — still provide your best guess but flag it

SCHEMA (answer every question that appears below; omit unknown questions):
{
${questionList}
}

GUIDELINES:
- Default to "no" / "none" / "None of the above" for content you cannot confirm
- Be conservative — only flag content if it is clearly present or strongly implied
- For multi-select, return an array of the exact option strings
- For yn questions, return "yes" or "no"`;
}

/* ── API call ────────────────────────────────────────────────── */
async function analyzeCQWithClaude() {
  if (!CLAUDE_API_KEY) throw new Error('NO_KEY');
  console.log('[Claude CQ] Running CQ inference...');

  const res = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key':                              CLAUDE_API_KEY,
      'anthropic-version':                      '2023-06-01',
      'content-type':                           'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      CLAUDE_MODEL,
      max_tokens: 4000,
      messages:   [{ role: 'user', content: [{ type: 'text', text: buildCQPrompt() }] }],
    }),
  });

  if (!res.ok) throw await smClaudeHttpError(res, '[Claude CQ]');

  const apiData = await res.json();
  console.log('[Claude CQ] Success — tokens:', apiData.usage?.input_tokens, '+', apiData.usage?.output_tokens);

  const text = apiData.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Claude');

  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleaned);
}

/* ══════════════════════════════════════════════════════════════
   GAME SEARCH — IGDB (Internet Game Database, powered by Twitch)
   Replaces the old iTunes + Steam + Claude-knowledge waterfall.
   IGDB covers Steam, iOS, Android, console, and indie games in
   a single API with cover art and platform metadata.
══════════════════════════════════════════════════════════════ */

const IGDB_CLIENT_ID     = (typeof CONFIG !== 'undefined' &&
                            CONFIG.IGDB_CLIENT_ID &&
                            CONFIG.IGDB_CLIENT_ID !== '__IGDB_CLIENT_ID__')
                           ? CONFIG.IGDB_CLIENT_ID : '';
const IGDB_CLIENT_SECRET = (typeof CONFIG !== 'undefined' &&
                            CONFIG.IGDB_CLIENT_SECRET &&
                            CONFIG.IGDB_CLIENT_SECRET !== '__IGDB_CLIENT_SECRET__')
                           ? CONFIG.IGDB_CLIENT_SECRET : '';
/* corsproxy.io now requires a paid API key for every request (confirmed
   live: it returns 401 "A valid API key is required" even for a bare,
   unrelated GET) — the free anonymous tier it ran on is gone. That broke
   every call in this file that routed through _cors(), not just IGDB's.

   _cors() now points at proxy.cors.sh instead (a Cloudflare Worker-based
   free CORS proxy — no key needed in testing). Verified live against real
   Steam traffic: 6/6 requests succeeded across both appdetails (JSON) and
   store-page (HTML) fetches, ~0.5–0.8s each — and separately confirmed it
   forwards POST + custom headers intact (relevant to IGDB_ENDPOINT below,
   which needs both). allorigins.win/raw was also tested as a candidate and
   does work, but only succeeded on roughly half of repeated live Steam
   requests (random timeouts/408s) — not solid enough to rely on alone, so
   it isn't used, though it — or another provider — would be a reasonable
   second leg if proxy.cors.sh ever needs a fallback.

   The IGDB *search* path has been moved off _cors() entirely onto our own
   backend (IGDB_SEARCH_ENDPOINT) — a real fix rather than a proxy swap,
   since that path also needed an IGDB/Twitch key the browser shouldn't
   hold. _cors()/IGDB_ENDPOINT and the Twitch token flow are still used —
   by the Steam appdetails/store-page fetches further down, by
   _igdbFetchScreenshots' single-item follow-up lookup (also below — the
   results _igdbSearchRaw hands back carry no screenshots, so a title with no
   Steam app id fills its grid this way), and as the fallback wiring if
   IGDB_SEARCH_ENDPOINT itself ever needs to be pointed back at a full
   direct-IGDB search.

   THAT ONE LOOKUP IS NOW THE ONLY LIVE USE OF THE PROXY (v6.62). Everything
   else that went through it has been deleted: Steam's appdetails and
   achievements-stats endpoints, the store page's HTML, and
   _igdbFetchSteamAppId. What is left is a documented JSON API rather than a
   scrape — but it is still a free proxy with no SLA, and the IGDB/Twitch
   client secret travels through it. */
const _cors = (u) => 'https://proxy.cors.sh/' + u;
const IGDB_ENDPOINT      = _cors('https://api.igdb.com/v4/games');
const TWITCH_TOKEN_URL   = 'https://id.twitch.tv/oauth2/token';
// Our own backend (Shipmate infra) — looks up IGDB on the server side and
// hands back a small, pre-shaped JSON result, so the browser never needs an
// IGDB/Twitch key or a third-party CORS proxy for search. Also supports
// looking a single game up directly by Steam or IGDB id (?steamId=<id> /
// ?igdbId=<id>) instead of a text query — not currently used by any caller
// here, but confirmed live to return the same result shape as ?query=
// (?steamId=504230 → Celeste, igdb_id 26226). Two differences worth knowing
// if a caller is ever wired up to it: the top-level echo key is named after
// whichever param was sent (`steamId`/`igdbId` rather than `query`), and the
// results array holds exactly the one match rather than up to five.
// Contract (verified live): GET ?query=<text> → { query, results: [{
// id, igdb_id, steam_id, name, summary, coverUrl, platforms }] }, platforms
// being website-derived slugs like "steam"/"app-store"/"google-play"/"epic"
// — see IGDB_SEARCH_PLATFORM_SLUGS. igdb_id/steam_id come back as numeric
// strings. coverUrl is already an absolute https://images.igdb.com/... URL
// pre-sized at t_cover_small (unlike the old endpoint, which returned a
// protocol-relative t_thumb URL) — see _igdbSearchRaw's size-upgrade regex
// below, which no longer assumes a specific incoming size token.
//
// `id` IS NOT THE IGDB ID — it's a UUID (e.g.
// "31d98a1d-44ef-40d1-88d7-eb61a9bcf5ce"), presumably this backend's own
// row key, and it is NOT interchangeable with igdb_id. _igdbSearchRaw below
// deliberately reads `Number(g.igdb_id)`, never `g.id`; reaching for the
// intuitively-named `g.id` instead yields NaN, which that function's own
// `Number.isFinite(g.id)` filter then drops on the floor — i.e. the title
// silently disappears from the picklist rather than erroring anywhere. If
// this backend ever needs a stable per-row handle, this is the field, but
// don't confuse the two.
//
// summary DOES come back populated (Celeste's full IGDB blurb, verified
// live) — an earlier revision of this comment recorded it as always empty
// based on the results available at the time, which is no longer true and
// was never guaranteed. It feeds the `|| ''` fallback below and, through
// item.summary, Game Details' Description for any title with no Steam app
// id, plus _applySteamAboutData's own fallback when Steam has no
// about_the_game (app.js) — so those paths, which were effectively inert
// while the field came back empty, now actually deliver text. Notably still
// absent vs. the old direct-IGDB response: screenshots — see _igdbSearchRaw
// below for how that's handled. steam_id IS new here (the old endpoint
// never returned one) and is wired straight into each result's `steamAppId`
// (see _igdbSearchRaw below) — note it isn't reliably correlated with
// `platforms` including "steam" (seen present with platforms: [] in live
// testing), so a title can carry a usable steamAppId even when `platforms`
// doesn't list "steam". selectPicklistItem (app.js) now drives all Steam
// enrichment straight off this field instead of the old _igdbFetchSteamAppId
// follow-up lookup (below) — that function still exists (kept as a
// documented fallback should this endpoint's steam_id ever prove
// unreliable) but is no longer called from there.
const IGDB_SEARCH_ENDPOINT = 'https://search.dev.shipmate.gg/search';
// This endpoint's platform slugs → our platform IDs. Derived from IGDB
// website links only (same idea as IGDB_WEBSITE_URL_PATTERNS above), so —
// like that table — it only ever yields storefront platforms, never
// consoles (no psn/xbox/nintendo slug has been observed).
const IGDB_SEARCH_PLATFORM_SLUGS = {
  'steam':       'steam',
  'app-store':   'ios',
  'google-play': 'android',
  'epic':        'egs',
};

// The Steam appdetails/store-page fetches below go through a free
// third-party CORS proxy (_cors(), currently proxy.cors.sh) with no SLA —
// it can stall or hang rather than cleanly erroring, and a bare fetch() has
// no built-in timeout, so a stalled proxy would otherwise leave a Steam
// import spinning forever with nothing to show for it. This wraps fetch
// with a hard deadline so callers always get a rejection (with a
// clearly-labeled message) within FETCH_TIMEOUT_MS, whether the proxy is
// down, rate-limiting, or just slow. (The IGDB picklist search no longer
// uses this at all — see IGDB_SEARCH_ENDPOINT above — but still benefits
// from the same timeout wrapper against our own backend.)
const FETCH_TIMEOUT_MS = 10000;
function _fetchWithTimeout(url, opts = {}, ms = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal })
    .catch(err => {
      if (err.name === 'AbortError') throw new Error('Request timed out after ' + Math.round(ms / 1000) + 's');
      throw err;
    })
    .finally(() => clearTimeout(timer));
}

// Cached for the page session (token is valid ~60 days)
let _igdbAccessToken = null;

async function _getIgdbToken() {
  if (_igdbAccessToken) return _igdbAccessToken;
  if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) throw new Error('NO_IGDB_KEY');
  // Routed through _cors() (proxy.cors.sh) — id.twitch.tv/oauth2/token is a
  // server-to-server OAuth endpoint and does not send an
  // Access-Control-Allow-Origin header on its response, so a browser fetch()
  // straight to it is blocked by CORS: the request itself goes out (it's a
  // "simple" POST — no custom headers here, so no preflight), but the
  // browser refuses to hand the response back to this code, and fetch()
  // rejects with a generic "Failed to fetch"/TypeError. That's the actual
  // bug behind "IGDB screenshot fallback silently does nothing" — every
  // caller (_igdbFetchScreenshots) starts by
  // awaiting this function, so a broken token fetch here breaks BOTH: Steam
  // App ID resolution never succeeds either, meaning `_applyIgdbScreenshotFallback`
  // itself was ALSO already failing for its own IGDB API call — see
  // IGDB_ENDPOINT's own comment above for why that call already goes
  // through this same proxy. Wrapping the token request the identical way
  // fixes it — proxy.cors.sh already forwards POST intact (see IGDB_ENDPOINT's
  // comment), which is all this request needs (no custom headers).
  const res = await _fetchWithTimeout(
    _cors(`${TWITCH_TOKEN_URL}?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`),
    { method: 'POST' }
  );
  if (!res.ok) throw new Error('IGDB auth failed (' + res.status + ')');
  const data = await res.json();
  _igdbAccessToken = data.access_token;
  return _igdbAccessToken;
}

// IGDB website URL patterns → our platform IDs. Matches on the URL itself,
// NOT the `category` field IGDB's website objects used to carry (category
// 10/11 = iOS, 12 = Android, 13 = Steam, 16 = Epic). Live testing showed
// IGDB no longer reliably returns `category` on `websites` entries — every
// entry now comes back with category: null, even though the query
// explicitly requests websites.category — so a category-based lookup here
// silently never matches and this whole detection path goes dead. This
// mirrors the fix already applied to steamAppId below (which hit the same
// problem first and switched to matching the URL directly) and generalizes
// it to every storefront, not just Steam.
const IGDB_WEBSITE_URL_PATTERNS = [
  { pid: 'steam',   re: /store\.steampowered\.com\/app\//i },
  { pid: 'ios',     re: /apps\.apple\.com\//i },
  { pid: 'android', re: /play\.google\.com\/store\/apps/i },
  { pid: 'egs',     re: /store\.epicgames\.com\//i },
];

// IGDB platform IDs → our platform IDs (IDs are stable; slugs can vary)
// Source: https://api.igdb.com/v4/platforms
// NOTE: Console IDs can be inaccurate in IGDB (cancelled ports, rumoured releases).
// We mitigate this by cross-referencing release_dates.status — consoles are only
// included when IGDB records a concrete release (status 4 = Released, 7 = Early Access).
const IGDB_PLATFORM_ID_TO_PID = {
  6:   'steam',    // PC (Windows)
  14:  'steam',    // Mac
  3:   'steam',    // Linux
  34:  'android',  // Android
  39:  'ios',      // iOS
  48:  'psn',      // PlayStation 4
  167: 'psn',      // PlayStation 5
  49:  'xbox',     // Xbox One
  169: 'xbox',     // Xbox Series X/S
  130: 'nintendo', // Nintendo Switch
};

// forDisplay=true  → show every platform IGDB lists (for picklist icons)
// forDisplay=false → strict: consoles need a confirmed release status (for auto-activation)
function _igdbPlatforms(platforms, websites, releaseDates, forDisplay = false) {
  const pids = new Set();

  // Primary: website/storefront links (most reliable — real store listings).
  // Matched by URL, not `category` — see IGDB_WEBSITE_URL_PATTERNS above.
  for (const w of (websites || [])) {
    if (!w || !w.url) continue;
    const hit = IGDB_WEBSITE_URL_PATTERNS.find(p => p.re.test(w.url));
    if (hit) pids.add(hit.pid);
  }

  // Build confirmed-released set (status 4 = Released, 7 = Early Access)
  const releasedIds = new Set();
  const hasRdData   = (releaseDates || []).length > 0;
  if (hasRdData) {
    for (const rd of releaseDates) {
      if ((rd.status === 4 || rd.status === 7) && rd.platform) releasedIds.add(rd.platform);
    }
  }

  // Map IGDB platform IDs to our PIDs.
  // For display: include every mapped platform.
  // For activation: require console platforms to have a confirmed release to avoid
  // auto-enabling platforms the developer hasn't shipped on.
  const CONSOLE_PIDS = new Set(['psn', 'xbox', 'nintendo']);
  for (const p of (platforms || [])) {
    const pid = IGDB_PLATFORM_ID_TO_PID[p];
    if (!pid) continue;
    if (!forDisplay && CONSOLE_PIDS.has(pid) && hasRdData && !releasedIds.has(p)) continue;
    pids.add(pid);
  }

  return [...pids].filter(pid => !!PLATFORMS[pid]);
}

/* ── IGDB picklist search — returns up to 5 results ─────────── */

// Cache results per query and de-dupe concurrent identical requests, so repeats
// and backspacing are instant and never re-hit the (slow) client-side proxy.
const _igdbCache = new Map();
const _igdbInflight = new Map();
function igdbSearch(title) {
  const key = (title || '').trim().toLowerCase();
  if (_igdbCache.has(key)) return Promise.resolve(_igdbCache.get(key));
  if (_igdbInflight.has(key)) return _igdbInflight.get(key);
  const p = _igdbSearchRaw(title)
    .then(res => { _igdbCache.set(key, res); _igdbInflight.delete(key); return res; })
    .catch(err => { _igdbInflight.delete(key); throw err; });
  _igdbInflight.set(key, p);
  return p;
}

async function _igdbSearchRaw(title) {
  const res = await _fetchWithTimeout(
    IGDB_SEARCH_ENDPOINT + '?query=' + encodeURIComponent(title)
  );

  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 200); } catch (_) {}
    throw new Error('IGDB search failed (' + res.status + ')' + (detail ? ' — ' + detail : ''));
  }

  const data  = await res.json();
  const games = data.results || [];
  return games.map(g => {
    // Endpoint hands back a cover URL that's already absolute (unlike the
    // old endpoint's protocol-relative URL) but its size token isn't
    // guaranteed — it's currently t_cover_small, was t_thumb on the old
    // endpoint, and could change again. Rather than assume a specific
    // incoming token, match whichever IGDB size segment is actually present
    // (e.g. "t_cover_small/") and swap just that, same upgrade-then-proxy
    // treatment the old direct-IGDB path applied to `cover.url`.
    const IGDB_SIZE_RE = /t_[a-z0-9_]+\//;
    const rawCover = g.coverUrl
      ? (g.coverUrl.startsWith('//') ? 'https:' : '') + g.coverUrl
      : null;
    const coverUrl = rawCover
      ? 'https://wsrv.nl/?url=' + encodeURIComponent(rawCover.replace(IGDB_SIZE_RE, 't_cover_small/').replace(/^https?:\/\//, '')) + '&output=jpg'
      : null;
    // t_cover_big (264×374) for _applySteamCapsuleFromCover (app.js) — same
    // reasoning as the old coverBigUrl: kept as a raw images.igdb.com URL,
    // not pre-proxied, since _screenshotSrc proxies it at render time.
    const coverBigUrl = rawCover ? rawCover.replace(IGDB_SIZE_RE, 't_cover_big/') : null;
    // Website-derived storefronts only (steam/ios/android/egs) — this
    // endpoint doesn't expose IGDB's platform-ID/release-date fields, so
    // there's no console (psn/xbox/nintendo) detection here. Same list
    // used for both display and activation since there's no confirmed-
    // release data to apply the stricter console gate against.
    const platforms = (g.platforms || [])
      .map(slug => IGDB_SEARCH_PLATFORM_SLUGS[slug])
      .filter(pid => pid && !!PLATFORMS[pid]);
    return {
      // FROM g.igdb_id, NOT g.id — the response carries BOTH, and `g.id` is
      // a UUID row key belonging to the search backend rather than anything
      // IGDB knows about (see IGDB_SEARCH_ENDPOINT's own comment). Every
      // consumer of this item — selectPicklistItem's `item.id`,
      // _applyIgdbScreenshotFallback, _igdbFetchScreenshots' `where id =` —
      // needs the numeric IGDB id, and swapping in the similarly-named
      // g.id would produce NaN here, which the Number.isFinite filter at
      // the bottom of this function then drops silently: the title just
      // stops appearing in the picklist, with nothing logged anywhere.
      id:        Number(g.igdb_id),
      name:      g.name || '',
      coverUrl,
      coverBigUrl,
      platforms,
      activationPlatforms: platforms,
      // The endpoint returns a `steam_id` when it has one — wired straight
      // through here. Note it isn't reliably correlated with a "steam"
      // entry in `platforms` (seen present with platforms: [] in live
      // testing — e.g. "Hade: Forbidden Levels", igdb_id 172092, steam_id
      // "875410"), so a title can have a truthy steamAppId here even when
      // `platforms` doesn't list "steam". Kept as a string, matching the
      // type the retired `_igdbFetchSteamAppId` follow-up query used to
      // return (both ultimately trace back to a Steam app id parsed out of
      // a URL). This is the sole source of a title's Steam app id —
      // selectPicklistItem (app.js) drives Steam enrichment straight off
      // this field, which is why that query had no callers left to lose
      // when it was deleted in v6.62.
      steamAppId: g.steam_id ? String(g.steam_id) : null,
      // Real IGDB blurb text, not the empty string an earlier revision of
      // IGDB_SEARCH_ENDPOINT's comment assumed this always was — the `|| ''`
      // is a genuine absent/null guard now rather than a formality. Where it
      // lands: Game Details' Description for a title with no Steam app id,
      // and _applySteamAboutData's fallback when Steam returns no
      // about_the_game (both app.js).
      summary:     g.summary || '',
      // Not returned by this endpoint — _fillScreenshotGridFromIgdb (app.js)
      // gets an empty array and simply has nothing to add.
      screenshots: [],
    };
  }).filter(g => g.id && Number.isFinite(g.id));
}

/* ── THE IGDB APP-ID FOLLOW-UP IS NO LONGER NEEDED (v6.62) ────────────────
   _igdbFetchSteamAppId used to resolve a picked title's Steam app ID with a
   second, single-item query straight to IGDB through the CORS proxy, because
   the old search results carried no Steam id. IGDB_SEARCH_ENDPOINT — our own
   backend — returns `steam_id` on the search result itself now, wired into
   item.steamAppId, so selectPicklistItem has the id before it needs it and
   this has had no callers since. Deleted rather than kept as fallback wiring,
   for the same reason as the Steam endpoints above. */

/* Resolves a single title's screenshots by IGDB id — a small, targeted
   follow-up query used once a title is picked (selectPicklistItem, app.js)
   whenever Steam scraping doesn't produce screenshots for that title: no
   Steam link at all, the Steam app-ID/appdetails lookup itself failed, or
   Steam succeeded but simply has none listed for this game. Same reasoning
   as the app-id lookup that used to sit above: IGDB_SEARCH_ENDPOINT's results never
   carry screenshots (see _igdbSearchRaw), so this goes straight to IGDB
   itself via IGDB_ENDPOINT/_cors() for just this one game. Returns [] for
   "no screenshots" (not an error); only throws for a real fetch/auth
   failure, which every caller already treats as non-fatal. */
async function _igdbFetchScreenshots(igdbId) {
  const token = await _getIgdbToken();
  const res = await _fetchWithTimeout(IGDB_ENDPOINT, {
    method: 'POST',
    headers: {
      'Client-ID':     IGDB_CLIENT_ID,
      'Authorization': 'Bearer ' + token,
      'Content-Type':  'text/plain',
    },
    body: `fields screenshots.url; where id = ${Number(igdbId)};`,
  });

  if (res.status === 401) {
    _igdbAccessToken = null;               // invalidate and let caller retry
    throw new Error('IGDB auth expired — please retry');
  }
  if (!res.ok) throw new Error('IGDB screenshots lookup failed (' + res.status + ')');

  const games = await res.json();
  const game  = games[0];
  if (!game || !Array.isArray(game.screenshots)) return [];

  // Same protocol-relative-URL and size-upgrade treatment _igdbSearchRaw
  // applies to cover art — IGDB hands back a tiny t_thumb URL by default;
  // upgraded here to t_screenshot_huge (1920×1080) for actual screenshot use.
  return game.screenshots
    .map(s => s && s.url)
    .filter(Boolean)
    .map(url => ((url.startsWith('//') ? 'https:' : '') + url).replace('t_thumb', 't_screenshot_huge'));
}

/* ── Steam library_hero direct CDN URL ────────────────────────────────
   Steam's library_hero.jpg is served from a stable, hash-free path keyed
   only by the app ID — no steamdb.info lookup, no proxy, no CORS concern
   (it's just an <img> src). Verified live in-browser (via Claude in
   Chrome, reading the real network requests a live store page makes plus
   direct fetch() checks) against a real app ID (Hades, 1145360). Not
   guaranteed to exist for every app — smaller/older titles sometimes never
   had proper Library art uploaded — so callers (_applySteamHeroBanner in
   app.js) must still handle a 404 gracefully rather than assume success.
   (library_600x900.jpg/logo.png share this same hash-free CDN path and
   were briefly used here too, via steamLibraryCapsuleUrl/steamLogoUrl —
   removed along with the "Library Capsule"/"Logo" Key Art fields by
   request; see git history around v3.02 if reviving that is ever needed.) */
function steamLibraryHeroUrl(appId) {
  return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero.jpg`;
}

/* ── The rest of the hash-free set, and what each one is FOR (v7.09) ─────
   The note above says library_600x900.jpg and logo.png share this path and
   were removed with the Key Art fields they fed. They come back for a
   different job: `_proposeIconFromSteam` (app.js) has to BUILD an app icon,
   and Steam publishes no square art at all — so the two candidates are made
   out of these.

   `logo.png` IS THE ONE THAT MATTERS. It is the wordmark cut out with real
   alpha, which makes it the single most icon-like thing Steam has: measured
   across Hades, Hollow Knight, Vampire Survivors, Spilled! and Mina the
   Hollower, all five carry it and all five have transparency.

   `_2x` FIRST, AND THE FALLBACK IS NOT DECORATION. The plain files are half
   size — library_hero.jpg serves 1920×620 where library_hero_2x.jpg serves
   3840×1240 — and the icon target is 1024 square, so the 2x hero gives a
   1240px crop that is DOWNscaled while the 1x gives a 620px one that has to
   be stretched. Measured, 4 of those 5 games have hero_2x and Hollow Knight
   does not, so both are asked for and the bigger one wins.

   AND THE CANVAS IS CLEAN, which is the fact this whole feature rests on.
   `shared.fastly.steamstatic.com` sends CORS headers: loaded with
   crossOrigin='anonymous' these draw into a canvas that `toDataURL()` can
   still read. That is worth stating because two places in this codebase
   assume the opposite (smMeasure's CORS retry in assets.js, and the
   screenshot editor's "a remote image taints the canvas") — both of those
   are about IGDB THROUGH THE PROXY, a different host. Steam's own CDN does
   not taint. Verified live against all five app ids above. */
function steamLogoUrl(appId, x2) {
  return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/logo${x2 ? '_2x' : ''}.png`;
}
function steamLibraryHeroUrl2x(appId) {
  return `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero_2x.jpg`;
}

/* ══════════════════════════════════════════════════════════════════════
   SHIPMATE'S OWN /game — one first-party call in place of four proxied ones
   ══════════════════════════════════════════════════════════════════════
   Everything below this block that talks to store.steampowered.com or
   steamcommunity.com does so through _cors() — a free third-party CORS proxy
   with no SLA, which has already had to be swapped once when the previous
   one went paid, and which fails by stalling rather than erroring (hence
   FETCH_TIMEOUT_MS). This endpoint is ours, sends its own CORS headers, needs
   no key, and returns IGDB and Steam merged into one record — so the whole
   proxy dependency goes with it.

   ONE SHAPE, TWO KINDS OF CALL, AND THEY ARE NOT INTERCHANGEABLE:

     fetchShipmateGame(appId)            → the BASELINE. Pins lang=english and
                                           is the ONLY source of structural
                                           data (genres, supportedLanguages,
                                           releaseDate.date, developers,
                                           publishers, price, images, movies).
     fetchShipmateGame(appId, 'french')  → PROSE ONLY. name/summary/description
                                           in that language, for the
                                           Localization Review comparison.

   Why the split is a rule and not a preference: `genres`,
   `supportedLanguages` and `releaseDate.date` ARE TRANSLATED by this endpoint
   too. Verified live — ?lang=turkish returns genres ["Aksiyon","Bağımsız
   Yapımcı","RYO"], supportedLanguages ["İngilizce","Fransızca",…] and
   releaseDate.date "17 Eyl 2020". Read those off a localized response and
   _steamSupportsLanguageCandidate (app.js) compares Turkish names against
   STEAM_LANG_DISPLAY_NAMES' English ones, matches nothing, and silently
   refuses every language; webSite.genres meanwhile fills with Turkish words.
   So: structural data comes from the baseline call, always, and a localized
   response is read for prose and nothing else.

   lang takes a Steam API language code ('english', 'french', 'koreana',
   'schinese', 'brazilian', …) — the exact vocabulary
   STEAM_LOCALIZATION_LANG_MAP (app.js) already produces, so callers pass the
   value they were already computing for appdetails' `l=` param. No mapping
   layer; every one of that map's 29 values is a valid code here.

   Steam's own fallback behaviour is unchanged and still the caller's problem:
   asking for a language the game has no translation for returns the DEFAULT
   language's prose rather than an error (confirmed — Hades has no Turkish, so
   ?lang=turkish comes back in English), which is exactly why the localized
   checks compare against a same-language-as-default baseline instead of
   trusting that a response came back at all. */
const SHIPMATE_GAME_ENDPOINT = 'https://search.dev.shipmate.gg/game';

/* IN-FLIGHT DEDUPE ONLY, deliberately not a cache. _applySteamAboutData and
   _applySteamAchievements both want the same record for the same app id and
   are fired together by selectPicklistItem, so without this a single title
   pick issues the identical request twice. Entries are dropped the moment the
   promise settles — the same shape _igdbInflight uses above, and for the same
   reason: a lasting cache would serve a stale record after a re-pick, while
   this only ever collapses requests that genuinely overlap in time. */
const _shipmateGameInflight = new Map();

async function fetchShipmateGame(steamAppId, lang) {
  if (!steamAppId) throw new Error('fetchShipmateGame: no Steam app id');
  const key = `${steamAppId}:${lang || 'english'}`;
  if (_shipmateGameInflight.has(key)) return _shipmateGameInflight.get(key);
  const p = _fetchShipmateGameRaw(steamAppId, lang)
    .finally(() => _shipmateGameInflight.delete(key));
  _shipmateGameInflight.set(key, p);
  return p;
}

async function _fetchShipmateGameRaw(steamAppId, lang) {
  // Explicit english rather than an omitted param: the no-lang branch of this
  // endpoint has been observed returning a stale, partially-enriched record
  // (no isFree/developers/publishers/supportedLanguages, a different currency,
  // prose in an unrelated language) where every lang-bearing request returns
  // the full one. Pinning it also makes the baseline genuinely English rather
  // than whatever the caller's IP geolocates to.
  const code = lang || 'english';
  const url = `${SHIPMATE_GAME_ENDPOINT}?steamId=${encodeURIComponent(steamAppId)}&lang=${encodeURIComponent(code)}`;
  const res = await _fetchWithTimeout(url);
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 200); } catch (_) {}
    throw new Error('Shipmate /game fetch failed (' + res.status + ')' + (detail ? ' — ' + detail : ''));
  }
  const data = await res.json();
  if (!data || !data.steam_id) throw new Error('Shipmate /game: no data for app ' + steamAppId);
  return data;
}

/* images[] carries screenshots AND key art in one array, discriminated by
   `type` ('screenshot' | 'capsule' | 'header' | 'cover'), where appdetails
   had screenshots[] plus capsule_image/header_image as separate top-level
   fields. These two keep every caller out of the filtering. */
function _shipmateImages(game, type) {
  return ((game && game.images) || []).filter(im => im && im.type === type && im.url);
}
function _shipmateImageUrl(game, type) {
  const hit = _shipmateImages(game, type)[0];
  return hit ? hit.url : '';
}

/* Achievements, normalised to what _applySteamAchievements already consumed
   from the community-stats scrape ({ name, description, iconUrl }) plus the
   two things that scrape could never provide:

   `hidden` is now STATED rather than inferred. The HTML page blanks the
   description of a hidden achievement, so `!description` was the only
   available signal — true in practice, but it also meant any achievement
   whose description simply hadn't been written read as hidden.

   `identifier` is the Steamworks API name ('CH1', 'FAREWELL'), and it is a
   stable key. _checkSteamLocalizedAchievements had to pair baseline and
   localized achievements BY ARRAY POSITION because the scrape offered
   nothing else — and this endpoint's array order is NOT stable between
   requests (observed: 'BSIDE5' at index 7 in one response and 15 in
   another), which would have quietly mis-paired every translation. */
function _shipmateAchievements(game) {
  return ((game && game.achievements) || [])
    .filter(a => a && a.name)
    .map(a => ({
      identifier:  a.identifier || '',
      name:        a.name,
      description: a.description || '',
      hidden:      a.hidden === true,
      iconUrl:     a.icon || '',
    }));
}

/* price is { currency, value } in MINOR UNITS (1999 = $19.99), where
   appdetails handed back an already-formatted "$19.99" in
   price_overview.final_formatted. Free-to-play titles omit `price` entirely
   and set isFree — so the two have to be read together: a missing price with
   isFree false means "not populated", not "free", and only isFree === true
   means free. Formatted with Intl so the currency code the endpoint actually
   returned is honoured rather than assuming dollars. */
function _shipmateFormatPrice(game) {
  if (!game) return '';
  if (game.isFree === true) return 'Free';
  const p = game.price;
  if (!p || typeof p.value !== 'number') return '';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: p.currency || 'USD' })
      .format(p.value / 100);
  } catch (_) {
    // Unknown/absent currency code — Intl throws rather than guessing.
    return (p.value / 100).toFixed(2);
  }
}

/* ── STEAM'S OWN ENDPOINTS ARE NO LONGER CALLED EITHER (v6.62) ────────────
   Deleted from here: fetchSteamAppDetails (store.steampowered.com/api/appdetails)
   and fetchSteamAchievementsPage (steamcommunity.com/stats/<appid>/achievements),
   with _parseSteamAchievements, the regex that read that page's markup.

   All three were superseded in v6.50, when every Steam-sourced field moved onto
   Shipmate's own /game endpoint — the listing, the localized prose, and the
   achievements, which /game returns with a stable `identifier` and a stated
   `hidden` that the scraped page never had. They had sat here with no callers
   since, and they were the last Steam traffic pointed at a free third-party
   CORS proxy.

   Two reasons not to keep them as a fallback. They are not one: appdetails is
   the endpoint whose unreliable `l=` handling the localization code was written
   around in the first place, so falling back to it would mean falling back to
   the bug. And a proxy with no SLA in the path of a retired code path is a
   liability nobody is watching — the first anyone would learn it had broken is
   when someone tried to use it. Recoverable from git history. */

/* ── THE STEAM STORE PAGE'S HTML IS NO LONGER READ (v6.61) ────────────────
   Three functions lived here and all three are gone: fetchSteamStorePage,
   which pulled https://store.steampowered.com/app/<id>/ through a free
   third-party CORS proxy, and the two regex parsers that read its markup —
   _parseSteamSocialLinks (the "Find Community" row) and
   _parseSteamMetaDescription (the og:description meta tag).

   Social links were the last thing that needed them. /game returns `links`
   as [{name, url}] now — the exact shape that regex produced — so
   _applySteamSocialLinks (app.js) reads it off the response it already has,
   instead of a second request against undocumented markup Valve can change
   without notice or deprecation window. _parseSteamMetaDescription had no
   other source of HTML to parse and went with the fetch; the job it existed
   for (a localized short description when appdetails' own came back
   untranslated) is covered by /game's own `summary` on a lang= call.

   Deleted rather than left unreachable: a scraper nothing calls is still a
   scraper the next person has to reason about, and the point of this change
   is that the store page's markup is no longer part of this app's contract
   with Steam. Recoverable from git history if `links` ever leaves the
   endpoint. */

// Steam's "about_the_game" field is a fragment of raw store-page HTML
// (<br>/<p> tags, the occasional list, HTML entities) rather than plain
// text. state.webSite.aboutGame's convention (see state.js) is plain text
// where a blank line marks a paragraph break and consecutive non-blank
// lines are soft line breaks within the same paragraph (rendered with <br>,
// no extra spacing — see _pkParagraphs/aboutGameValue in render.js) — this
// flattens Steam's HTML down to that shape: </p> becomes a real paragraph
// break (a blank line), plain <br> stays a same-paragraph line break, and
// remaining tags are stripped, common entities decoded. Blank lines are
// preserved (collapsing any run of them down to exactly one, since one gap
// is enough to mark a break no matter how many <br>s/</p>s produced it) —
// they're the whole point of this conversion now, not noise to discard, so
// Shipmate's preview reproduces the same two-level spacing Steam's own page
// shows instead of flattening every line to identical spacing.
//
// Headings need their own handling: Steam's rich-text editor emits bare
// <h1>-<h6> tags directly in the content flow, NOT wrapped in their own
// <p> the way a real paragraph is. Confirmed live against Spilled!'s
// actual "About This Game" HTML — its sub-headings ("Clean up and relax",
// "Key features", etc.) came through with zero separation from the text
// or bullet list right after them ("Key features• Around 1 hour of
// playtime...", "...cute animalsThere are 16 animals...") because a
// heading tag, stripped by the old catch-all with no replacement, left
// nothing behind to separate it from whatever followed. Since this field
// is plain text with no bold/heading styling available, a heading is
// treated as its own isolated one-line "paragraph" (a blank line on both
// sides) — the closest approximation of Steam's visual hierarchy this
// two-level (tight line vs. paragraph gap) spacing model can express.
//
// The other, more defensive change: any tag NOT explicitly handled below
// (<img>, <strong>, <span>, <div>, <a>, <ul>/<ol>, ...) is now replaced
// with a single space rather than vanishing with nothing in its place —
// an embedded screenshot in the middle of a paragraph, for instance, used
// to disappear and glue the words on either side of it together (with
// only whatever incidental whitespace happened to exist in the raw source
// leaking through, which is why the old output had inconsistent gluing:
// sometimes a stray double space, sometimes none at all). A real word
// boundary always beats a false one; runs of these inserted spaces are
// collapsed back down to one afterward.
//
// Still deliberately simple (not a full HTML parser) since this is a
// one-way, best-effort conversion for a pre-fill the developer can always
// edit.
function _steamHtmlToParagraphLines(html) {
  if (!html) return '';
  const rawLines = html
    .replace(/<\/?h[1-6][^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/ {2,}/g, ' ')
    .split('\n')
    .map(line => line.trim());

  // Collapse runs of consecutive blank lines to exactly one, then trim
  // leading/trailing blank lines.
  const lines = [];
  for (const line of rawLines) {
    if (line === '' && lines[lines.length - 1] === '') continue;
    lines.push(line);
  }
  while (lines.length && lines[0] === '') lines.shift();
  while (lines.length && lines[lines.length - 1] === '') lines.pop();

  // Consecutive bullet points are a single list, not separate paragraphs —
  // remove the blank line between two bullet lines so they stay
  // single-spaced. This matters because Steam's about_the_game HTML often
  // puts each bullet in its own <p>...</p> (rather than a proper
  // <ul>/<li> list), and </p> above always inserts a blank-line paragraph
  // break; without this pass every bullet in a feature list would end up
  // with a blank line under it, as if each were its own paragraph.
  const isBullet = s => s.startsWith('• ');
  for (let i = lines.length - 2; i >= 1; i--) {
    if (lines[i] === '' && isBullet(lines[i - 1]) && isBullet(lines[i + 1])) {
      lines.splice(i, 1);
    }
  }

  // The reverse case: a bullet line running straight into a non-bullet,
  // non-blank line right after it (the list ended and prose resumes with
  // no paragraph break in between — e.g. Steam's about_the_game HTML often
  // has no </ul>/<p> boundary between a feature list's last <li> and the
  // next line) reads as if that line were still part of the list. Insert a
  // blank line so a finished bullet list always gets its own paragraph
  // break before whatever follows. No need to guard against an existing
  // blank line here — the pass above already collapsed runs of blank lines
  // down to at most one, so lines[i + 1] is either that single blank or
  // genuine next content.
  for (let i = lines.length - 2; i >= 0; i--) {
    if (isBullet(lines[i]) && lines[i + 1] !== '' && !isBullet(lines[i + 1])) {
      lines.splice(i + 1, 0, '');
    }
  }

  return lines.join('\n');
}

/* ── Backward-compat wrapper (used by _triggerScenarioSearch) ── */
// STORE_NAME_TO_PID is kept so confirmGameImport still works if called
// via the old scenario path; IGDB returns our PIDs directly so the
// mapping is an identity pass-through for all known IDs.
const STORE_NAME_TO_PID = {
  ios: 'ios', android: 'android', steam: 'steam', egs: 'egs',
  psn: 'psn', xbox: 'xbox', nintendo: 'nintendo',
};

async function searchGameByTitle(title) {
  if (!title || !title.trim()) throw new Error('NO_TITLE');
  const results = await igdbSearch(title.trim());
  if (!results.length) {
    return { found: false, title: null, description: null, source: null, allStores: [], confidence: 0 };
  }
  const top = results[0];
  return {
    found:       true,
    title:       top.name,
    description: top.summary,
    source:      'IGDB',
    allStores:   top.platforms,
    confidence:  90,
  };
}

/* ── Apply CQ results to state ───────────────────────────────── */
function applyCQResults(result) {
  let applied = 0;
  let skipped = 0;

  CQ_QUESTIONS.forEach(q => {
    const entry = result[q.id];
    if (!entry || typeof entry !== 'object') { skipped++; return; }

    const { value, confidence } = entry;
    if (value === undefined || value === null) { skipped++; return; }
    if (typeof confidence !== 'number' || confidence < 80) { skipped++; return; }

    // Never overwrite a human-confirmed answer
    if (state.cqAnswerMeta[q.id]?.humanConfirmed) { applied++; return; }

    // Validate value type
    if (q.type === 'yn') {
      if (!['yes', 'no'].includes(value)) { skipped++; return; }
    } else if (q.type === 'single') {
      if (!q.options?.includes(value)) { skipped++; return; }
    } else if (q.type === 'multi') {
      if (!Array.isArray(value)) { skipped++; return; }
      const valid = value.filter(v => q.options?.includes(v));
      if (!valid.length) { skipped++; return; }
      state.cqAnswers[q.id]   = valid;
      state.cqAnswerMeta[q.id] = { confidence, humanConfirmed: false };
      applied++;
      return;
    }
    // yn, single, text
    state.cqAnswers[q.id]   = value;
    state.cqAnswerMeta[q.id] = { confidence, humanConfirmed: false };
    applied++;
  });

  console.log(`[Claude CQ] Applied ${applied}, skipped ${skipped}`);
  return { applied, skipped };
}

/* ═══════════════════════════════════════════════════════════════
   ABSTRACTED AI INFERENCE — shared across all platforms/steps
   ═══════════════════════════════════════════════════════════════

   runInference(pid, stepId) is the public entry point.
   It gathers all accumulated game knowledge (onboarding + prior
   platform answers), builds a platform-specific prompt, calls
   Claude, and applies results to the right answer store.
   ═══════════════════════════════════════════════════════════════ */

/* ── Per-platform context extractors ─────────────────────────── */
// Returns a formatted string block for the given platform's filled
// content-rating answers, or null if the platform has no answers yet.
// Add a new case here whenever a platform gets its own answer store.

function _extractPlatformContext(pid) {
  if (pid === 'ios') {
    const ios    = state.iosSubmitAnswers;
    const fields = [...IOS_INTENSITY_QUESTIONS, ...IOS_CONTENT_YN_QUESTIONS];
    const filled = fields.filter(q => ios[q.id] !== null && ios[q.id] !== undefined);
    if (!filled.length) return null;
    const lines  = filled.map(q => `  ${q.label}: ${ios[q.id]}`);
    return `iOS APP STORE CONTENT RATING:\n${lines.join('\n')}`;
  }

  if (pid === 'steam') {
    const sca    = (state.steamSubmitAnswers || {}).steamContentAnswers || {};
    const filled = Object.entries(sca).filter(([, v]) => v === 'yes' || v === 'no');
    if (!filled.length) return null;
    const yesItems = filled.filter(([, v]) => v === 'yes').map(([k]) => k);
    if (!yesItems.length) return null;
    return `STEAM CONTENT SURVEY — categories marked YES: ${yesItems.join(', ')}`;
  }

  // android: content-rating answers live in state.cqAnswers (the shared IARC
  // store), which buildSharedContext() already includes as its own section.
  // egs, psn, xbox, nintendo: coming-soon — no answer stores yet.
  return null;
}

/* ── Natural language game summary ──────────────────────────── */
// Generates a compact prose paragraph from all known game state so
// the LLM has an easy-to-reason-about narrative rather than raw K/V pairs.
// Returns a human-readable list of data sources that went into the prompt.
// Shown at the top of the debug block so it's easy to verify context coverage.
function buildContextSources() {
  const sources = [];

  // Onboarding info — always present if user completed onboarding
  const fd = state.formData;
  const obFields = [fd.title && 'title', fd.description && 'description', fd.genre && 'genre',
                    fd.price && 'price'].filter(Boolean);
  if (obFields.length) {
    sources.push(`Onboarding info entered by the user (${obFields.join(', ')})`);
  }

  // Uploaded screenshots
  const shots = (state.uploads?.screenshots || []).length;
  if (shots > 0) {
    sources.push(`${shots} uploaded gameplay screenshot${shots > 1 ? 's' : ''}`);
  }

  // iOS questionnaire — only count IDs still in the current question lists
  const iosQs = [...(typeof IOS_INTENSITY_QUESTIONS !== 'undefined' ? IOS_INTENSITY_QUESTIONS : []),
                 ...(typeof IOS_CONTENT_YN_QUESTIONS !== 'undefined' ? IOS_CONTENT_YN_QUESTIONS : [])];
  const iosAnswers = state.iosSubmitAnswers || {};
  const iosAnsweredCount = iosQs.filter(q => {
    const v = iosAnswers[q.id];
    return v !== null && v !== undefined;
  }).length;
  if (iosAnsweredCount > 0) {
    const label = iosAnsweredCount >= iosQs.length ? 'completed' : 'partially completed';
    sources.push(`A ${label} iOS questionnaire (${iosAnsweredCount}/${iosQs.length} answers)`);
  }

  // CQ / IARC answers (filled during Android questionnaire step)
  const cqCount = Object.values(state.cqAnswers || {})
    .filter(v => v !== null && v !== undefined && v !== '').length;
  if (cqCount > 0) {
    sources.push(`Android IARC content questionnaire (${cqCount} answer${cqCount > 1 ? 's' : ''})`);
  }

  // Steam questionnaire — only count IDs still present in the current category list
  // (stale keys from removed categories would otherwise inflate the count past the total)
  const steamSCA = (state.steamSubmitAnswers || {}).steamContentAnswers || {};
  const validSteamIds = new Set(
    (typeof STEAM_CONTENT_CATEGORIES !== 'undefined')
      ? STEAM_CONTENT_CATEGORIES.flatMap(g => g.items.map(i => i.id))
      : []
  );
  const totalSteam = validSteamIds.size;
  const steamCount = Object.entries(steamSCA)
    .filter(([id, v]) => validSteamIds.has(id) && (v === 'yes' || v === 'no')).length;
  if (steamCount > 0) {
    const label = totalSteam && steamCount >= totalSteam ? 'completed' : 'partially completed';
    const suffix = totalSteam ? `${steamCount}/${totalSteam} answers` : `${steamCount} answer${steamCount > 1 ? 's' : ''}`;
    sources.push(`A ${label} Steam questionnaire (${suffix})`);
  }

  return sources;
}

// Called at the top of buildSharedContext() and shown in the debug UI.

function buildNaturalLanguageSummary() {
  const fd = state.formData;
  const a  = state.iosSubmitAnswers;

  const parts = [];

  // ── Title + genre + price ─────────────────────────────────────────────────
  const title = fd.title || '(untitled)';
  const genre = fd.genre ? ` ${fd.genre}` : '';
  const price = fd.price ? `$${fd.price}` : 'free';
  parts.push(`"${title}" is a${genre} game priced at ${price}.`);

  // ── Description snippet (up to 300 chars) ────────────────────────────────
  if (fd.description && fd.description.trim()) {
    const d = fd.description.trim();
    parts.push(`Description: ${d.slice(0, 300)}${d.length > 300 ? '…' : ''}`);
  }

  // ── Active platforms ──────────────────────────────────────────────────────
  const pids = [...state.activePlatforms];
  if (pids.length) {
    const names = { ios:'iOS App Store', android:'Google Play', steam:'Steam',
                    egs:'Epic Games Store', psn:'PlayStation', xbox:'Xbox', nintendo:'Nintendo' };
    parts.push(`Targeting: ${pids.map(p => names[p] || p).join(', ')}.`);
  }

  // ── Content profile from iOS questionnaire answers ────────────────────────
  // The iOS intensity questions (none/infrequent/frequent) are the most specific
  // content signals we have. Only emit positive (non-"none") ratings.
  const anyIosAnswered = [...IOS_INTENSITY_QUESTIONS, ...IOS_CONTENT_YN_QUESTIONS]
    .some(q => a[q.id] !== null && a[q.id] !== undefined);

  if (anyIosAnswered) {
    // High-level content flags derived from iOS answers
    const hasViolence = ['cartoonViolence','realisticViolence','extendedViolence','gunsWeapons']
      .some(id => a[id] && a[id] !== 'none');
    const hasSexual   = ['sexualContent','graphicSexual','matureSuggestive']
      .some(id => a[id] && a[id] !== 'none');
    const hasLanguage = a.profanity && a.profanity !== 'none';
    const hasGambling = a.simulatedGambling && a.simulatedGambling !== 'none';
    const hasHorror   = a.horrorFear && a.horrorFear !== 'none';
    const hasDrugs    = a.substancesAlcohol && a.substancesAlcohol !== 'none';

    const contentFlags = [];
    if (hasViolence) contentFlags.push('violence or combat');
    if (hasSexual)   contentFlags.push('sexual or mature content');
    if (hasLanguage) contentFlags.push('strong language or profanity');
    if (hasGambling) contentFlags.push('simulated gambling');
    if (hasHorror)   contentFlags.push('horror or fear themes');
    if (hasDrugs)    contentFlags.push('drug or alcohol references');

    if (contentFlags.length) {
      parts.push(`Content flags (from iOS questionnaire): ${contentFlags.join(', ')}.`);
    } else {
      parts.push('iOS questionnaire: no significant mature content flagged.');
    }

    // Features from iOS yn answers
    const features = [];
    if (a.hasIAP === 'yes')            features.push('in-app purchases');
    if (a.messagingChat === 'yes')      features.push('messaging or chat');
    if (a.userGenContent === 'yes')     features.push('user-generated content');
    if (a.advertising === 'yes')        features.push('advertising');
    if (a.unrestrictedInternet === 'yes') features.push('unrestricted internet access');
    if (features.length) parts.push(`Features: ${features.join(', ')}.`);

    // Specific intensity ratings for any non-"none" items
    const intensityItems = IOS_INTENSITY_QUESTIONS
      .filter(q => a[q.id] && a[q.id] !== 'none')
      .map(q => `${q.label} (${a[q.id]})`);
    if (intensityItems.length) {
      parts.push(`iOS intensity detail: ${intensityItems.join('; ')}.`);
    }
  }

  // Note: full CQ question/answer data is included separately in buildSharedContext()
  // as CONTENT QUESTIONNAIRE ANSWERS — not echoed here to avoid truncation issues.

  return parts.join(' ');
}

/* ── Shared context builder ──────────────────────────────────── */
// Gathers all accumulated game knowledge regardless of which platforms
// the user filled first. Iterates state.activePlatforms so inference
// is always order-agnostic: Steam→Android is identical to Android→Steam.

function buildSharedContext() {
  const fd  = state.formData;
  const cq  = state.cqAnswers;
  const parts = [];

  // ── Natural language content summary (easiest for LLM to reason about) ──
  const nlSummary = buildNaturalLanguageSummary();
  if (nlSummary) parts.push(`CONTENT PROFILE SUMMARY:\n${nlSummary}`);

  // ── Game basics ──────────────────────────────────────────────
  parts.push(`GAME TITLE: ${fd.title || '(not provided)'}`);
  parts.push(`DESCRIPTION: ${fd.description || '(none provided)'}`);
  if (fd.genre) parts.push(`GENRE: ${fd.genre}`);

  // ── CQ/IARC answers (platform-agnostic shared questionnaire) ─
  // These are gathered independently of active-platform iteration because
  // the IARC questionnaire is shared across iOS and Android and has its own store.
  const filledCQ = Object.entries(cq)
    .filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0));
  if (filledCQ.length) {
    const cqLines = filledCQ.slice(0, 40).map(([k, v]) => {
      const q     = CQ_QUESTIONS.find(x => x.id === k);
      const label = q ? q.text.slice(0, 60) : k;
      return `  ${label}: ${Array.isArray(v) ? v.join(', ') : v}`;
    });
    parts.push(`CONTENT QUESTIONNAIRE ANSWERS (IARC/Google):\n${cqLines.join('\n')}`);
  }

  // ── Per-platform content answers (all active platforms) ──────
  // Iterate every active platform so inference always has full context
  // regardless of the order the user filled them in.
  for (const pid of state.activePlatforms) {
    const section = _extractPlatformContext(pid);
    if (section) parts.push(section);
  }

  return parts.join('\n\n');
}

/* ── Android Content Rating inference ───────────────────────── */

async function inferAndroidCR() {
  const ctx = buildSharedContext();
  // Build the question list for android-visible CQ questions (top-level only for brevity)
  const visibleQ = CQ_QUESTIONS.filter(q =>
    q.platforms.includes('android') && !q.parent && cqIsVisible(q)
  );

  const qLines = visibleQ.map(q => {
    const opts = q.type === 'multi' ? `Options: ${(q.options||[]).slice(0,6).join(' | ')}` : '';
    return `id: ${q.id} | type: ${q.type} | question: ${q.text.slice(0,100)}${opts ? ' | ' + opts : ''}`;
  }).join('\n');

  const prompt = `You are an expert game content analyst helping pre-fill a Google Play IARC content questionnaire.

${ctx}

Based on ALL of the above information, answer these Google Play content questions. Be conservative — only mark "yes" if clearly supported by the game data.

QUESTIONS TO ANSWER:
${qLines}

Return ONLY valid JSON — no markdown, no explanation:
{
  "answers": {
    "<question_id>": {
      "value": "<yes|no|option_text|[\"option1\",\"option2\"]>",
      "confidence": <0-100>
    }
  }
}

Rules:
- For yn: value is "yes" or "no"
- For single: value is the exact option text
- For multi: value is an array of matching option strings (empty array [] if none apply)
- Only include questions where confidence >= 80
- Be conservative — prefer "no" or empty arrays when uncertain`;

  const res = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key':                                 CLAUDE_API_KEY,
      'anthropic-version':                         '2023-06-01',
      'content-type':                              'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL, max_tokens: 2000,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
    }),
  });
  if (!res.ok) throw await smClaudeHttpError(res);
  const data    = await res.json();
  const text    = (data.content?.[0]?.text || '').trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed  = JSON.parse(cleaned);

  const validQIds    = new Set(CQ_QUESTIONS.map(q => q.id));
  const answers      = parsed.answers || {};
  let applied = 0;

  for (const [qid, entry] of Object.entries(answers)) {
    if (!validQIds.has(qid)) continue;
    if (state.cqAnswerMeta[qid]?.humanConfirmed) continue;
    const { value, confidence } = entry;
    if (typeof confidence !== 'number' || confidence < 80) continue;
    const q = CQ_QUESTIONS.find(x => x.id === qid);
    if (!q) continue;

    if (q.type === 'yn' && (value === 'yes' || value === 'no')) {
      state.cqAnswers[qid] = value;
      state.cqAnswerMeta[qid] = { confidence, humanConfirmed: false };
      applied++;
    } else if (q.type === 'single' && typeof value === 'string' && q.options.includes(value)) {
      state.cqAnswers[qid] = value;
      state.cqAnswerMeta[qid] = { confidence, humanConfirmed: false };
      applied++;
    } else if (q.type === 'multi' && Array.isArray(value)) {
      const valid = value.filter(v => q.options.includes(v));
      if (valid.length > 0 || value.length === 0) {
        state.cqAnswers[qid] = valid;
        state.cqAnswerMeta[qid] = { confidence, humanConfirmed: false };
        applied++;
      }
    }
  }
  console.log(`[Android CR inference] Applied ${applied} answers`);
}

/* ── Apply Steam inference results to state ──────────────────── */
// Extracted so both inferSteamCR() and inferAllQuestionnaires() can reuse it.
// steamData = { items: { <id>: { value, confidence } }, mature: { <id>: { value, confidence } } }

function applySteamResults(steamData) {
  const validItems = new Set(STEAM_CONTENT_CATEGORIES.flatMap(g => g.items.map(i => i.id)));
  const MATURE_SET = new Set(['gen_mature','freq_violence','some_nudity','freq_nudity','adult_sexual']);
  if (!state.steamSubmitAnswers.steamContentAnswers) state.steamSubmitAnswers.steamContentAnswers = {};
  const sca  = state.steamSubmitAnswers.steamContentAnswers;
  const meta = state.steamAnswerMeta;
  let applied = 0;

  for (const [id, entry] of Object.entries(steamData.items || {})) {
    if (!validItems.has(id)) continue;
    if (meta[id]?.humanConfirmed) continue;
    const { value, confidence } = entry;
    if (typeof confidence !== 'number' || confidence < 65) continue;
    if (value === 'yes' || value === 'no') {
      sca[id]  = value;
      meta[id] = { confidence, humanConfirmed: false };
      applied++;
    }
  }
  for (const [id, entry] of Object.entries(steamData.mature || {})) {
    if (!MATURE_SET.has(id)) continue;
    if (meta[id]?.humanConfirmed) continue;
    const { value, confidence } = entry;
    if (typeof confidence !== 'number' || confidence < 65) continue;
    if (value === 'yes' || value === 'no') {
      sca[id]  = value;
      meta[id] = { confidence, humanConfirmed: false };
      applied++;
    }
  }
  console.log(`[Steam] Applied ${applied} answers`);
  return applied;
}

/* ── Steam Content Rating inference ─────────────────────────── */

async function inferSteamCR() {
  const ctx = buildSharedContext();
  const allItems = STEAM_CONTENT_CATEGORIES.flatMap(g => g.items.map(i => ({...i, group: g.group})));
  const itemLines = allItems.map(i => `  ${i.id}: ${i.label}`).join('\n');

  const MATURE_OPTS = ['gen_mature','freq_violence','some_nudity','freq_nudity','adult_sexual'];
  const matureLines = [
    'gen_mature: General mature content',
    'freq_violence: Frequent violence or gore',
    'some_nudity: Some nudity or sexual content',
    'freq_nudity: Frequent nudity or sexual content',
    'adult_sexual: Adult only sexual content',
  ].join('\n  ');

  const prompt = `You are an expert game content analyst helping pre-fill a Steam content questionnaire.

${ctx}

CROSS-PLATFORM INFERENCE RULES (apply these first using the context above):
When the context contains iOS App Store Content Rating answers, use them as direct evidence:
- "Realistic Violence: none" → rv_blood=no, rv_killing=no, rv_minorities=no (confidence ≥90)
- "Realistic Violence: infrequent" → rv_blood=yes, rv_killing=no (confidence ≥85)
- "Realistic Violence: frequent" → rv_blood=yes, rv_killing=yes (confidence ≥85)
- "Cartoon or Fantasy Violence: none" → fmv_cartoon=no, fmv_fights=no (confidence ≥90)
- "Cartoon or Fantasy Violence: infrequent/frequent" → fmv_cartoon=yes (confidence ≥85)
- "Extended Graphic or Sadistic Violence: infrequent/frequent" → hiv_extreme=yes, hiv_gratuitous=yes (confidence ≥85)
- "Profanity or Crude Humor: none" → lang_mild=no, lang_moderate=no (confidence ≥90)
- "Profanity or Crude Humor: infrequent" → lang_mild=yes (confidence ≥85)
- "Profanity or Crude Humor: frequent" → lang_moderate=yes (confidence ≥85)
- "Horror/Fear Themes: none" → hor_bleak=no, hor_frightening=no (confidence ≥90)
- "Horror/Fear Themes: infrequent" → hor_bleak=yes (confidence ≥85)
- "Horror/Fear Themes: frequent" → hor_frightening=yes (confidence ≥85)
- "Alcohol, Tobacco, or Drug Use: infrequent/frequent" → drug_legal=yes (confidence ≥85)
- "Sexual Content or Nudity: infrequent" → sex_nonexplicit=yes (confidence ≥85)
- "Sexual Content or Nudity: frequent" → sex_nonexplicit=yes, some_nudity (confidence ≥85)
- "Simulated Gambling: infrequent/frequent" → gamb_interaction=yes, gamb_refs=yes (confidence ≥85)
- "In-App Purchases: yes" OR onboarding "In-app purchases: yes" → int_purchases=yes (confidence ≥95)
- "Messaging and Chat: yes" → int_chat=yes (confidence ≥90)

Answer each Steam content survey item with yes or no, and provide a confidence score.

CONTENT CATEGORY ITEMS (answer yes if it applies to this game):
${itemLines}

MATURE CONTENT DECLARATIONS (answer yes if applicable):
  ${matureLines}

Return ONLY valid JSON — no markdown, no explanation:
{
  "items": {
    "<item_id>": { "value": "yes|no", "confidence": <0-100> }
  },
  "mature": {
    "<mature_id>": { "value": "yes|no", "confidence": <0-100> }
  }
}

Rules:
- Include items where confidence >= 65 (be willing to answer based on iOS/Android cross-references above)
- Be conservative for items with no prior-platform evidence — prefer "no" when uncertain
- IMPORTANT: When iOS/Android context clearly answers an equivalent question, use it with high confidence
- Cascade: if adult_sexual=yes → freq_nudity, some_nudity, gen_mature also yes
- If freq_violence=yes → gen_mature also yes`;

  const res = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key':                                 CLAUDE_API_KEY,
      'anthropic-version':                         '2023-06-01',
      'content-type':                              'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL, max_tokens: 2000,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
    }),
  });
  if (!res.ok) throw await smClaudeHttpError(res);
  const data    = await res.json();
  const text    = (data.content?.[0]?.text || '').trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed  = JSON.parse(cleaned);
  applySteamResults(parsed);
}

/* ── WHICH PLATFORMS THIS CALL ANSWERS FOR — ONE LIST, TWO READERS ────────
   This expression existed TWICE, and the two copies decide different halves of
   one call: buildUnifiedInferencePrompt uses it to choose which schemas go in
   the prompt, and inferAllQuestionnaires uses it to decide whether to call at
   all and which results to apply. They are only correct while they agree, and
   nothing made them.

   That is not hypothetical — it is how the first attempt at the Mac fix broke.
   The alias was added to inferAllQuestionnaires alone, so a Mac-only project
   passed the gate and then built a prompt containing NO schema at all:
   measured, 3,863 characters with no "ios", "android" or "steam" block in it.
   A real request, real tokens, and nothing applicable in the reply — worse than
   the silent skip it replaced, because it looks identical and costs money.

   MAC APP STORE IS THE APP STORE HERE. The list named ios, android and steam,
   and `macos` appeared nowhere else in this file, so a Mac-only project came
   out empty and the whole inference returned in silence. The alias is right
   rather than a fourth branch because Mac's Content Rating answers ARE the
   App Store's — every intensity and yes/no question, plus ageCategory and the
   privacy fields, is in IOS_MAC_SHARED_ANSWER_FIELDS (state.js), and
   applyClaudeResults writes to state.iosSubmitAnswers, which is the bucket
   _appStoreAnswers routes Mac's shared fields to. So one `ios` in this list
   makes the call happen AND lands the answers where Mac reads them. Same shape
   as OB_PLATFORM_TIMING's and SM_TILE_MARK_ALIAS's own macos→ios.

   De-duped, so Mac beside a real App Store submission does not ask twice.

   NOT COVERED, and named rather than left to be discovered: web and the four
   consoles have questionnaires this prompt does not answer, so they still
   produce an empty list — which is now honest, because a no-op no longer
   caches itself as done (see runInference). */
function _inferencePids() {
  return [...new Set([...state.activePlatforms]
    .map(p => (p === 'macos' || p === 'macos_full') ? 'ios' : p)
    .filter(p => ['ios','android','steam'].includes(p)))];
}

/* ── Unified inference prompt (all active platforms in one call) ── */

function buildUnifiedInferencePrompt() {
  const activePids = _inferencePids();
  const ctx        = buildSharedContext();   // includes natural-language summary at top

  // ── iOS schema ───────────────────────────────────────────────────────────────
  const iosSchema = activePids.includes('ios') ? `
  "ios": {
    "intensityQuestions": {
      "profanity":          { "value": "none|infrequent|frequent", "confidence": 0-100 },
      "horrorFear":         { "value": "none|infrequent|frequent", "confidence": 0-100 },
      "substancesAlcohol":  { "value": "none|infrequent|frequent", "confidence": 0-100 },
      "medicalTreatment":   { "value": "none|infrequent|frequent", "confidence": 0-100 },
      "matureSuggestive":   { "value": "none|infrequent|frequent", "confidence": 0-100 },
      "sexualContent":      { "value": "none|infrequent|frequent", "confidence": 0-100 },
      "graphicSexual":      { "value": "none|infrequent|frequent", "confidence": 0-100 },
      "cartoonViolence":    { "value": "none|infrequent|frequent", "confidence": 0-100 },
      "realisticViolence":  { "value": "none|infrequent|frequent", "confidence": 0-100 },
      "extendedViolence":   { "value": "none|infrequent|frequent", "confidence": 0-100 },
      "gunsWeapons":        { "value": "none|infrequent|frequent", "confidence": 0-100 },
      "simulatedGambling":  { "value": "none|infrequent|frequent", "confidence": 0-100 },
      "contests":           { "value": "none|infrequent|frequent", "confidence": 0-100 }
    },
    "ynQuestions": {
      "parentalControls":     { "value": "yes|no", "confidence": 0-100 },
      "ageAssurance":         { "value": "yes|no", "confidence": 0-100 },
      "unrestrictedInternet": { "value": "yes|no", "confidence": 0-100 },
      "userGenContent":       { "value": "yes|no", "confidence": 0-100 },
      "socialMedia":          { "value": "yes|no", "confidence": 0-100 },
      "socialMediaU13Off":    { "value": "yes|no", "confidence": 0-100 },
      "messagingChat":        { "value": "yes|no", "confidence": 0-100 },
      "advertising":          { "value": "yes|no", "confidence": 0-100 },
      "healthWellness":       { "value": "yes|no", "confidence": 0-100 },
      "realMoneyGambling":    { "value": "yes|no", "confidence": 0-100 },
      "lootBoxes":            { "value": "yes|no", "confidence": 0-100 }
    },
    "business":        { "hasIAP": { "value": "yes|no", "confidence": 0-100 }, "iapTypes": [] },
    "exportCompliance": {
      "usesEncryption":   { "value": "yes|no", "confidence": 0-100 },
      "encryptionExempt": { "value": "yes|no", "confidence": 0-100 }
    },
    "ageCategory": { "value": "not_applicable|made_for_kids|override_higher", "confidence": 0-100 }
  }` : '';

  // ── Android schema ───────────────────────────────────────────────────────────
  let androidSchema = '';
  if (activePids.includes('android')) {
    const visibleQ = CQ_QUESTIONS.filter(q =>
      q.platforms.includes('android') && !q.parent && cqIsVisible(q)
    );
    const qLines = visibleQ.map(q => {
      const typeHint = q.type === 'yn'     ? '"yes" or "no"'
                     : q.type === 'single' ? `one of: ${(q.options||[]).map(o=>`"${o}"`).join(', ')}`
                     : q.type === 'multi'  ? `array of: ${(q.options||[]).map(o=>`"${o}"`).join(', ')}`
                     : 'string';
      return `      "${q.id}": { "value": <${typeHint}>, "confidence": 0-100 }`;
    }).join(',\n');
    androidSchema = `
  "android": {
    "answers": {
${qLines}
    }
  }`;
  }

  // ── Steam schema ─────────────────────────────────────────────────────────────
  let steamSchema = '';
  if (activePids.includes('steam')) {
    const allItems  = STEAM_CONTENT_CATEGORIES.flatMap(g => g.items.map(i => `      "${i.id}": { "value": "yes|no", "confidence": 0-100 }`));
    const matureIds = ['gen_mature','freq_violence','some_nudity','freq_nudity','adult_sexual']
      .map(id => `      "${id}": { "value": "yes|no", "confidence": 0-100 }`);
    steamSchema = `
  "steam": {
    "items": {
${allItems.join(',\n')}
    },
    "mature": {
${matureIds.join(',\n')}
    }
  }`;
  }

  const schemaSections = [iosSchema, androidSchema, steamSchema].filter(Boolean).join(',\n');

  return `You are an expert game content analyst pre-filling platform questionnaires for a game submission tool.

${ctx}

Using ALL of the above information, fill out the content questionnaires for the active platforms: ${activePids.join(', ')}.

CROSS-PLATFORM INFERENCE RULES — when iOS answers are present, use them as direct evidence for equivalent Android/Steam fields:
- iOS "Realistic Violence: none"       → Steam rv_blood=no, rv_killing=no, rv_minorities=no (confidence ≥90); Android violence questions: no
- iOS "Realistic Violence: infrequent" → Steam rv_blood=yes (confidence ≥85)
- iOS "Realistic Violence: frequent"   → Steam rv_blood=yes, rv_killing=yes (confidence ≥85)
- iOS "Cartoon or Fantasy Violence: none" → Steam fmv_cartoon=no, fmv_fights=no (confidence ≥90)
- iOS "Cartoon or Fantasy Violence: infrequent|frequent" → Steam fmv_cartoon=yes (confidence ≥85)
- iOS "Extended Graphic Violence: infrequent|frequent" → Steam hiv_extreme=yes, hiv_gratuitous=yes (confidence ≥85)
- iOS "Profanity: none" → Steam lang_mild=no, lang_moderate=no (confidence ≥90)
- iOS "Profanity: infrequent" → Steam lang_mild=yes (confidence ≥85); iOS "Profanity: frequent" → Steam lang_moderate=yes (confidence ≥85)
- iOS "Horror/Fear Themes: none" → Steam hor_bleak=no, hor_frightening=no (confidence ≥90)
- iOS "Horror/Fear Themes: infrequent|frequent" → Steam hor_bleak=yes (confidence ≥85)
- iOS "Alcohol/Drugs: infrequent|frequent" → Steam drug_legal=yes (confidence ≥85)
- iOS "Sexual Content: infrequent" → Steam sex_nonexplicit=yes (confidence ≥85)
- iOS "Simulated Gambling: infrequent|frequent" → Steam gamb_interaction=yes, gamb_refs=yes (confidence ≥85)
- iOS "hasIAP: yes" OR onboarding "In-app purchases: yes" → Steam int_purchases=yes (confidence ≥95); Android in-app-purchase questions: yes
- iOS "messagingChat: yes" → Steam int_chat=yes (confidence ≥90)

iOS INFERENCE GUIDELINES:
- Nearly all networked mobile games use HTTPS → usesEncryption: "yes" (confidence 95), encryptionExempt: "yes" (confidence 90)
- Default intensity to "none" and yn to "no" for content not confirmed
- "infrequent" = present but not central; "frequent" = a primary element
- ageCategory "not_applicable" for most games; "made_for_kids" only if explicitly child-targeted
- business.iapTypes: array from [consumable, non-consumable, auto-renewable, non-renewing]

ANDROID/STEAM CONFIDENCE THRESHOLDS:
- Answer Android questions when confidence >= 80
- Answer Steam questions when confidence >= 65 (cross-platform evidence lowers uncertainty)
- Include empty arrays [] for Android multi-select when no options apply

Return ONLY a valid JSON object — no markdown fences, no explanation:
{
${schemaSections}
}`;
}

/* ── Single unified API call for all questionnaire platforms ─── */

async function inferAllQuestionnaires() {
  if (!CLAUDE_API_KEY) throw new Error('NO_KEY');
  /* The SAME list the prompt is built from — see _inferencePids, which is also
     where the macos→ios alias and the reason for it are written. These two
     readers have to agree: this one decides whether to call and which results
     to apply, that one decides which schemas are asked for. */
  const activePids = _inferencePids();
  if (!activePids.length) return false;

  // Guard: skip inference entirely if there is no meaningful game data to reason about.
  // Without title, description, or screenshots the model defaults to generic heuristics
  // (e.g. "all apps use HTTPS") which produces confident but baseless answers.
  const fd = state.formData;
  const hasData = !!(fd.title?.trim()) || !!(fd.description?.trim())
               || (state.uploads.screenshots || []).length > 0;
  if (!hasData) {
    console.log('[Unified] Skipping inference — no game data available yet.');
    return false;
  }

  // Clear stale AI-inferred meta (preserve human-confirmed answers)
  state.iosAnswerMeta   = Object.fromEntries(Object.entries(state.iosAnswerMeta).filter(([,v])   => v.humanConfirmed));
  state.cqAnswerMeta    = Object.fromEntries(Object.entries(state.cqAnswerMeta).filter(([,v])    => v.humanConfirmed));
  state.steamAnswerMeta = Object.fromEntries(Object.entries(state.steamAnswerMeta).filter(([,v]) => v.humanConfirmed));

  const prompt     = buildUnifiedInferencePrompt();
  const scrshots   = _buildScreenshotContent();

  // Snapshot context sources NOW — before the API call mutates state with answers.
  // The debug block displays this snapshot so it reflects actual inference inputs,
  // not the post-inference state (which would falsely show its own outputs as sources).
  state.lastInferenceSources = buildContextSources();

  // Store full prompt for "See Prompt" debug button
  state.lastInferencePrompt = (scrshots.length
    ? `[${scrshots.length} screenshot(s) included in API call]\n\n`
    : '') + prompt;

  const content = [...scrshots, { type: 'text', text: prompt }];

  console.log('[Unified] Calling Claude for platforms:', activePids.join(', '));
  const res = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key':                                 CLAUDE_API_KEY,
      'anthropic-version':                         '2023-06-01',
      'content-type':                              'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      CLAUDE_MODEL,
      max_tokens: 8000,
      messages:   [{ role: 'user', content }],
    }),
  });

  if (!res.ok) throw await smClaudeHttpError(res, '[Unified]');

  const apiData = await res.json();
  console.log('[Unified] Success — tokens:', apiData.usage?.input_tokens, '+', apiData.usage?.output_tokens);

  const text    = apiData.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Claude');

  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed  = JSON.parse(cleaned);

  // Apply iOS results
  if (activePids.includes('ios') && parsed.ios) {
    applyClaudeResults(parsed.ios);
    state.claudeCache = { result: parsed.ios }; // backward compat
  }

  // Apply Android results
  if (activePids.includes('android') && parsed.android?.answers) {
    applyCQResults(parsed.android.answers);
  }

  // Apply Steam results
  if (activePids.includes('steam') && parsed.steam) {
    applySteamResults(parsed.steam);
  }

  /* The one path that really called Claude and applied an answer. Every exit
     above returns false, so `runInference` can tell "done" from "declined to
     do anything" — see the cache write there. */
  return true;
}

/* ── Public dispatcher ───────────────────────────────────────── */

/* WHAT THE CACHE STORES IS THE INPUT, NOT A BOOLEAN.

   It held `true`, which can only answer "has this ever run" — and the honest
   answer to "should it run again" is "only if the prompt would differ". Every
   caller papered over that by DELETING the key immediately before calling, on
   a comment about re-running "to use latest accumulated knowledge". So the
   guard never once fired: collapsing Content Rating and reopening it sat you
   through the full loading screen again for a call whose input had not changed
   by one character.

   The signature IS the prompt's own shared half — `buildSharedContext()`,
   the exact string every questionnaire request is built on — plus the two
   things outside it that change the request: which platforms are being asked
   for (they select the schemas, see buildUnifiedInferencePrompt) and how many
   screenshots go in the payload. Comparing the real input beats maintaining a
   list of fields that invalidate it; a new field added to the context is
   covered the day it is added, where a hand-kept list would silently miss it.

   That also answers "what if another platform's questionnaire was filled in":
   per-platform answers are IN buildSharedContext (`_extractPlatformContext`
   over activePlatforms), so answering one platform changes the signature for
   every other one and the next open really does re-infer. */
function _inferenceSignature() {
  try {
    /* THE SIGNATURE MUST NOT CONTAIN THIS CALL'S OWN OUTPUT, and the first
       version did — which made it self-invalidating and left the symptom
       exactly where it started.

       It was `buildSharedContext()`, the whole shared half of the prompt. That
       string EMBEDS the questionnaire answers (`state.cqAnswers` and
       `_extractPlatformContext` over every active platform) — and answers are
       what this inference WRITES. So finishing Content Rating changed the
       signature away from the one just stored, and the next open saw a miss and
       re-ran. Answering the questions by hand did it too. A cache keyed on
       something the cached operation modifies can never hit twice.

       So the key is the DEVELOPER-SUPPLIED input only: what the game is, and
       which stores are being asked. Those are the things that genuinely change
       what the model should say, and none of them is written by the model.

       The cost, stated: filling ANOTHER platform's questionnaire by hand no
       longer re-triggers, even though it does slightly change the prompt. That
       is a second-order effect, and buying it back costs the whole guard.
       Adding a platform still re-triggers — activePlatforms is in here, and
       that is the case that actually matters. */
    const fd    = state.formData || {};
    const plats = [...state.activePlatforms].sort().join(',');
    const shots = (state.uploads?.screenshots || []).length;
    return [plats, shots, fd.title || '', fd.genre || '', fd.description || ''].join('|');
  } catch (_) {
    // Never let a signature failure BLOCK inference — fall back to a value that
    // can never match, so the call runs rather than being wrongly skipped.
    return 'sig-error:' + Date.now();
  }
}

async function runInference(pid, stepId) {
  if (!CLAUDE_API_KEY) throw new Error('NO_KEY');

  // Questionnaire — and the standalone Content Rating step, which now lives on
  // each platform card. Both run the one unified call that answers every active
  // platform's content/data/business questionnaires at once (cached + deduped,
  // so opening Content Rating and later Improve Your Submission never re-runs it).
  if (stepId === 'questionnaire' || stepId === 'contentRating') {
    const uKey = 'unified:questionnaire';
    const sig  = _inferenceSignature();
    if (state.platformInferenceCache[uKey] === sig) return;   // same input, same answers
    const ran = await inferAllQuestionnaires();
    /* Written only on success — a throw leaves the key alone, so a failed call
       stays retryable rather than caching itself as done.

       AND A NO-OP IS NOT A SUCCESS, which is the half this was missing and the
       reason the Mac bug could never recover on its own. inferAllQuestionnaires
       has three silent exits — no supported platform active, no game data yet,
       and (until today) any Mac-only project — and every one of them landed here
       and stamped the cache. So the first open recorded "done" for a call that
       had never happened, and every later open matched that key and skipped,
       even once a title, a description and screenshots had arrived. A cache that
       records intentions rather than outcomes can only ever be wrong in the
       direction of doing nothing. */
    if (ran) state.platformInferenceCache[uKey] = sig;
    return;
  }

  // Legacy per-platform steps (contentRating etc.)
  const key = pid + ':' + stepId;
  if (state.platformInferenceCache[key]) return;
  if (pid === 'android') await inferAndroidCR();
  else if (pid === 'steam') await inferSteamCR();
  state.platformInferenceCache[key] = true;
}
