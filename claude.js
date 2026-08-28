/* ============================================================
   AI — Claude-powered questionnaire auto-fill
   ============================================================ */

const CLAUDE_API_KEY  = (typeof CONFIG !== 'undefined' &&
                         CONFIG.CLAUDE_API_KEY &&
                         CONFIG.CLAUDE_API_KEY !== '__CLAUDE_API_KEY__')
                        ? CONFIG.CLAUDE_API_KEY : '';
const CLAUDE_MODEL    = 'claude-haiku-4-5-20251001';
const CLAUDE_ENDPOINT = 'https://api.anthropic.com/v1/messages';

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

  if (!res.ok) {
    let rawBody = {};
    try { rawBody = await res.json(); } catch (_) {}
    console.error('[Claude] HTTP', res.status, JSON.stringify(rawBody, null, 2));
    const raw = rawBody.error?.message || '';
    let msg = `Request failed (${res.status})`;
    if (res.status === 429) msg = 'Rate limit reached — please retry in a moment.';
    else if (res.status === 401) msg = 'API key rejected — check the key is valid.';
    else if (res.status === 500 || res.status === 529) msg = 'Claude is temporarily overloaded — please retry.';
    else msg = raw || msg;
    throw new Error(msg);
  }

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

  if (!res.ok) {
    let rawBody = {};
    try { rawBody = await res.json(); } catch (_) {}
    console.error('[Claude CQ] HTTP', res.status, JSON.stringify(rawBody, null, 2));
    const raw = rawBody.error?.message || '';
    let msg = `Request failed (${res.status})`;
    if (res.status === 429) msg = 'Rate limit reached — please retry in a moment.';
    else if (res.status === 401) msg = 'API key rejected — check the key is valid.';
    else if (res.status === 500 || res.status === 529) msg = 'Claude is temporarily overloaded — please retry.';
    else msg = raw || msg;
    throw new Error(msg);
  }

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
   _igdbFetchSteamAppId's single-item follow-up lookup (also below — the
   results _igdbSearchRaw hands back don't carry a Steam app ID, so
   selectPicklistItem, app.js, resolves it this way once a title is
   picked), and as the fallback wiring if IGDB_SEARCH_ENDPOINT itself ever
   needs to be pointed back at a full direct-IGDB search. */
const _cors = (u) => 'https://proxy.cors.sh/' + u;
const IGDB_ENDPOINT      = _cors('https://api.igdb.com/v4/games');
const TWITCH_TOKEN_URL   = 'https://id.twitch.tv/oauth2/token';
// Our own backend (Sound Games infra) — looks up IGDB on the server side and
// hands back a small, pre-shaped JSON result, so the browser never needs an
// IGDB/Twitch key or a third-party CORS proxy for search. Contract (verified
// live): GET ?query=<text> → { query, results: [{ igdb_id, name, summary,
// coverUrl, platforms }] }, platforms being website-derived slugs like
// "steam"/"app-store"/"google-play"/"epic" — see IGDB_SEARCH_PLATFORM_SLUGS.
// Notably absent vs. the old direct-IGDB response: a Steam app ID and
// screenshots — see _igdbSearchRaw below for how that's handled.
const IGDB_SEARCH_ENDPOINT = 'https://app.sbwfr.dev.sound.games/search';
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
  const res = await _fetchWithTimeout(
    `${TWITCH_TOKEN_URL}?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
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
    // Endpoint hands back IGDB's raw t_thumb (32px) cover URL, protocol-
    // relative, unproxied — same upgrade-then-proxy treatment the old
    // direct-IGDB path applied to `cover.url`.
    const rawCover = g.coverUrl
      ? (g.coverUrl.startsWith('//') ? 'https:' : '') + g.coverUrl
      : null;
    const coverUrl = rawCover
      ? 'https://wsrv.nl/?url=' + encodeURIComponent(rawCover.replace('t_thumb', 't_cover_small').replace(/^https?:\/\//, '')) + '&output=jpg'
      : null;
    // t_cover_big (264×374) for _applySteamCapsuleFromCover (app.js) — same
    // reasoning as the old coverBigUrl: kept as a raw images.igdb.com URL,
    // not pre-proxied, since _screenshotSrc proxies it at render time.
    const coverBigUrl = rawCover ? rawCover.replace('t_thumb', 't_cover_big') : null;
    // Website-derived storefronts only (steam/ios/android/egs) — this
    // endpoint doesn't expose IGDB's platform-ID/release-date fields, so
    // there's no console (psn/xbox/nintendo) detection here. Same list
    // used for both display and activation since there's no confirmed-
    // release data to apply the stricter console gate against.
    const platforms = (g.platforms || [])
      .map(slug => IGDB_SEARCH_PLATFORM_SLUGS[slug])
      .filter(pid => pid && !!PLATFORMS[pid]);
    return {
      id:        Number(g.igdb_id),
      name:      g.name || '',
      coverUrl,
      coverBigUrl,
      platforms,
      activationPlatforms: platforms,
      // Not returned by this endpoint (no Steam app-page lookup on the
      // backend yet) — selectPicklistItem (app.js) already guards every
      // Steam-enrichment call on `item.steamAppId` being truthy, so this
      // just makes those steps no-op rather than error.
      steamAppId: null,
      summary:     g.summary || '',
      // Not returned by this endpoint — _fillScreenshotGridFromIgdb (app.js)
      // gets an empty array and simply has nothing to add.
      screenshots: [],
    };
  }).filter(g => g.id && Number.isFinite(g.id));
}

/* Resolves a single title's Steam app ID by IGDB id — a small, targeted
   follow-up query used once a title is picked (selectPicklistItem, app.js),
   since IGDB_SEARCH_ENDPOINT's results don't include one (see above). Goes
   straight to IGDB itself via IGDB_ENDPOINT/_cors() — viable again now that
   _cors() points at proxy.cors.sh instead of the dead corsproxy.io — rather
   than the search backend, and only ever asks for one game's websites, so
   it's much lighter than the old full-text search this replaced. Reuses
   IGDB_WEBSITE_URL_PATTERNS, the same URL-matching table _igdbSearchRaw's
   predecessor used, to pull the appid out of the website URL itself (IGDB's
   website `category` field has been unreliable — see that table's comment).
   Returns null for "no linked Steam page" (not an error); only throws for a
   real fetch/auth failure, which the caller already treats as non-fatal. */
async function _igdbFetchSteamAppId(igdbId) {
  const token = await _getIgdbToken();
  const res = await _fetchWithTimeout(IGDB_ENDPOINT, {
    method: 'POST',
    headers: {
      'Client-ID':     IGDB_CLIENT_ID,
      'Authorization': 'Bearer ' + token,
      'Content-Type':  'text/plain',
    },
    body: `fields websites.url; where id = ${Number(igdbId)};`,
  });

  if (res.status === 401) {
    _igdbAccessToken = null;               // invalidate and let caller retry
    throw new Error('IGDB auth expired — please retry');
  }
  if (!res.ok) throw new Error('IGDB website lookup failed (' + res.status + ')');

  const games = await res.json();
  const game  = games[0];
  if (!game) return null;

  const steamPattern = IGDB_WEBSITE_URL_PATTERNS.find(p => p.pid === 'steam').re;
  const steamSite = (game.websites || []).find(w => w.url && steamPattern.test(w.url));
  if (!steamSite) return null;
  const m = steamSite.url.match(/\/app\/(\d+)/);
  return m ? m[1] : null;
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

/* ── Steam appdetails — short description, developer, "About This Game",
   and screenshots ─────────────────────────────────────────────────────
   store.steampowered.com/api/appdetails is undocumented (no official
   Steamworks Web API reference page, no key required) but stable — it's
   the same data backing the store page itself, and is what most
   third-party Steam-library tools rely on. Requires a CORS proxy from the
   browser since store.steampowered.com doesn't send permissive CORS
   headers — see _cors() above for which proxy and why. Used by
   _applySteamAboutData (app.js).

   Optional `lang` (a Steam API language code, e.g. 'french', 'schinese' —
   see STEAM_LOCALIZATION_LANG_MAP, app.js) requests appdetails localized
   into that language via Steam's own `l=` query param, used by
   _checkSteamLocalizedDescription (app.js) to fetch a supporting language's
   localized "About This Game" (about_the_game) copy. Steam does not error
   for a language it has no real translation for — it silently falls back
   to the game's default listing language instead, so a caller requesting a
   specific language must compare the result's about_the_game against the
   default-language baseline itself to tell "genuinely localized" from
   "silently fell back". */
async function fetchSteamAppDetails(appId, lang) {
  const langParam = lang ? `&l=${encodeURIComponent(lang)}` : '';
  const res = await _fetchWithTimeout(_cors(`https://store.steampowered.com/api/appdetails?appids=${appId}${langParam}`));
  if (!res.ok) throw new Error('Steam appdetails fetch failed (' + res.status + ')');
  const json = await res.json();
  const entry = json && json[appId];
  if (!entry || !entry.success || !entry.data) throw new Error('Steam appdetails: no data for app ' + appId);
  return entry.data;
}

/* ── Steam store page HTML — social media links ───────────────────────
   Steam's appdetails JSON (fetchSteamAppDetails above) has NO field for a
   game's social media links (Discord/X/YouTube/etc.) — confirmed by fetching
   a real appdetails response directly and inspecting every field at every
   nesting level, during this project's own social-links research. Nor does
   any documented Steamworks Web API interface expose them (checked
   IStoreService and ISteamApps specifically — neither has a matching
   method). That data only exists rendered server-side into the store
   page's own HTML, sourced from the developer's Steamworks "Store Page
   Admin" settings — so getting it means fetching and parsing that HTML
   directly, unlike every other Steam-sourced field in this app (all of
   which come from the stable, JSON-shaped appdetails endpoint). This is
   inherently more fragile than the rest of this file: Valve can change the
   store page's markup at any time with no notice and no deprecation
   window, unlike a documented/stable API. Used by _applySteamSocialLinks
   (app.js). */
async function fetchSteamStorePage(appId) {
  const res = await _fetchWithTimeout(_cors(`https://store.steampowered.com/app/${appId}/`));
  if (!res.ok) throw new Error('Steam store page fetch failed (' + res.status + ')');
  return await res.text();
}

/* Parses the store page's "Find Community"-style social-links row out of
   its raw HTML (see fetchSteamStorePage above). Confirmed live against Go
   Ape Ship!'s real store page (appid 4037180, saved and inspected directly
   during this project's own social-links research): each social link is
   an <a class="linkbar" href="..." ... data-tooltip-text="...">, containing
   a <span class="social_account">Name</span> after its icon SVG — e.g.:
     <a class="linkbar" href="https://steamcommunity.com/linkfilter/?u=https%3A%2F%2Fdiscord.gg%2FkGFbw4MtnG"
        target="_blank" rel=" noopener" class="ttip" data-tooltip-text="https://discord.gg/kGFbw4MtnG">
       <svg>...</svg><span class="social_account">Discord</span><img ... alt="External">
     </a>
   The data-tooltip-text + social_account combination is what distinguishes
   a social link from this exact same row's other .linkbar entries ("Visit
   the website", "View privacy policy", "View update history", "Read
   related news") — none of those carry either attribute, so they're
   correctly excluded without needing a separate exclusion list. Most
   social hrefs are wrapped in Steam's own
   https://steamcommunity.com/linkfilter/?u=<url-encoded-target> redirect
   (unwrapped back to the real target URL here) — but not all of them are:
   on the same real page, Reddit and YouTube came through as plain direct
   URLs with no linkfilter wrapper at all, so both forms are handled.
   Returns an array of { name, url } in the same left-to-right order Steam
   itself lists them, or [] if the row is missing/empty/unparseable (a
   malformed-HTML guard, not just "no links configured") rather than
   throwing — again, this markup is NOT a documented API and can change
   without notice. Deliberately a single regex pass, not a real HTML
   parser, matching this file's existing "best-effort, developer can always
   edit the result" philosophy (see _steamHtmlToParagraphLines below). */
function _parseSteamSocialLinks(html) {
  const re = /<a class="linkbar" href="([^"]+)"[^>]*data-tooltip-text="[^"]*"[^>]*>[\s\S]*?<span class="social_account">([^<]+)<\/span>/g;
  const links = [];
  let m;
  while ((m = re.exec(html || ''))) {
    let url = m[1];
    const wrapped = url.match(/^https:\/\/steamcommunity\.com\/linkfilter\/\?u=(.+)$/);
    if (wrapped) {
      try { url = decodeURIComponent(wrapped[1]); } catch (e) { /* malformed encoding — fall back to the wrapped URL as-is */ }
    }
    const name = (m[2] || '').trim();
    if (name && url) links.push({ name, url });
  }
  return links;
}

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
  if (!res.ok) throw new Error('API ' + res.status);
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
  if (!res.ok) throw new Error('API ' + res.status);
  const data    = await res.json();
  const text    = (data.content?.[0]?.text || '').trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed  = JSON.parse(cleaned);
  applySteamResults(parsed);
}

/* ── Unified inference prompt (all active platforms in one call) ── */

function buildUnifiedInferencePrompt() {
  const activePids = [...state.activePlatforms].filter(p => ['ios','android','steam'].includes(p));
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
  const activePids = [...state.activePlatforms].filter(p => ['ios','android','steam'].includes(p));
  if (!activePids.length) return;

  // Guard: skip inference entirely if there is no meaningful game data to reason about.
  // Without title, description, or screenshots the model defaults to generic heuristics
  // (e.g. "all apps use HTTPS") which produces confident but baseless answers.
  const fd = state.formData;
  const hasData = !!(fd.title?.trim()) || !!(fd.description?.trim())
               || (state.uploads.screenshots || []).length > 0;
  if (!hasData) {
    console.log('[Unified] Skipping inference — no game data available yet.');
    return;
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

  if (!res.ok) {
    let rawBody = {};
    try { rawBody = await res.json(); } catch (_) {}
    console.error('[Unified] HTTP', res.status, JSON.stringify(rawBody, null, 2));
    const raw = rawBody.error?.message || '';
    let msg = `Request failed (${res.status})`;
    if (res.status === 429) msg = 'Rate limit reached — please retry in a moment.';
    else if (res.status === 401) msg = 'API key rejected — check the key is valid.';
    else if (res.status === 500 || res.status === 529) msg = 'Claude is temporarily overloaded — please retry.';
    else msg = raw || msg;
    throw new Error(msg);
  }

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
}

/* ── Public dispatcher ───────────────────────────────────────── */

async function runInference(pid, stepId) {
  if (!CLAUDE_API_KEY) throw new Error('NO_KEY');

  // Questionnaire: one unified call answers all active platforms
  if (stepId === 'questionnaire') {
    const uKey = 'unified:questionnaire';
    if (state.platformInferenceCache[uKey]) return; // already ran
    await inferAllQuestionnaires();
    state.platformInferenceCache[uKey] = true;
    return;
  }

  // Legacy per-platform steps (contentRating etc.)
  const key = pid + ':' + stepId;
  if (state.platformInferenceCache[key]) return;
  if (pid === 'android') await inferAndroidCR();
  else if (pid === 'steam') await inferSteamCR();
  state.platformInferenceCache[key] = true;
}
