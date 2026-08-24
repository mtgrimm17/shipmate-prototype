/* ============================================================
   RENDER — pure functions that build UI from state
   ============================================================ */

/* ── Shared: HTML escape helper ──────────────────────── */
function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── i18n render helpers ─────────────────────────────── */
// These thin wrappers let render.js call PLATFORMS labels
// through the locale system without hard coupling to locale.js.

/** Platform display label — locale-aware */
function platLabel(pid) {
  if (typeof tPlat === 'function') return tPlat(pid);
  return PLATFORMS[pid]?.label || pid;
}

/** Step display label — locale-aware with PLATFORMS fallback */
function stepLabel(pid, step) {
  if (typeof tStep === 'function') return tStep(pid, step.id, step.label);
  return step.label;
}

/* ── Language menu ───────────────────────────────────── */
function renderLangMenu() {
  const el = document.getElementById('langMenu');
  if (!el || typeof getSupportedLanguages !== 'function') return;
  const current = typeof getCurrentLang === 'function' ? getCurrentLang() : 'en';
  el.innerHTML = getSupportedLanguages().map(l => {
    const isActive    = l.code === current;
    const isAvailable = l.code === 'en' || l.code === 'zh-CN';
    return `
    <button class="lang-menu-item${isActive ? ' is-active' : ''}${!isAvailable ? ' is-unavailable' : ''}"
            ${isAvailable ? `onclick="switchLanguage('${l.code}')"` : 'disabled'}
            ${!isAvailable ? 'title="Coming soon"' : ''}>
      <span class="lang-flag">${l.flag}</span>
      <span class="lang-name">${escHtml(l.label)}</span>
      ${isActive ? '<span class="lang-check">✓</span>' : ''}
      ${!isAvailable ? '<span class="lang-soon">Soon</span>' : ''}
    </button>`;
  }).join('');
}

/* ── Shared: platform icon SVG ───────────────────────── */

// Icons that use multi-subpath "cutout" designs need evenodd winding rule.
// iOS and PSN are solid compound paths — nonzero (default) renders them correctly.
const EVENODD_ICONS = new Set(['android', 'steam', 'egs', 'xbox', 'nintendo']);

// Color and white asset variants — keyed by platform ID.
// Missing entries fall back to the inline SVG from PLATFORM_ICONS.
const PLATFORM_ASSET = {
  ios:      'Assets/Platform_Icons/AppStore.png',
  android:  'Assets/Platform_Icons/GooglePlay.webp',
  steam:    'Assets/Platform_Icons/Steam.png',
  psn:      'Assets/Platform_Icons/PlayStation.jpg',
  xbox:     'Assets/Platform_Icons/Xbox.png',
  nintendo: 'Assets/Platform_Icons/Nintendo.png',
};
// White-variant: user's actual PNG files for platforms where the PNG has a
// transparent background — CSS filter whitens the opaque logo pixels.
// Platforms not listed here (ios, android, steam) fall back to inline SVG paths.
const PLATFORM_ASSET_WHITE = {
  psn:      'Assets/Platform_Icons/PlayStation_white.png', // pre-processed transparent bg
  xbox:     'Assets/Platform_Icons/Xbox.png',              // transparent bg → filter whitens
  nintendo: 'Assets/Platform_Icons/Nintendo.png',          // transparent bg → filter whitens
};

// Per-platform visual scale tweaks (applied on top of the requested size).
const PLATFORM_ICON_SCALE = {
  ios: 1.15,
  psn: 1.15,
};

// variant: 'color' (default) | 'white'
function platformIcon(id, size = 20, variant = 'color') {
  size = Math.round(size * (PLATFORM_ICON_SCALE[id] || 1));
  const map = variant === 'white' ? PLATFORM_ASSET_WHITE : PLATFORM_ASSET;
  if (map[id]) {
    return `<img src="${map[id]}" width="${size}" height="${size}" alt="${id}" class="plat-img" aria-hidden="true">`;
  }
  const fillRule = EVENODD_ICONS.has(id) ? ' fill-rule="evenodd" clip-rule="evenodd"' : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" overflow="visible" fill="currentColor"${fillRule} aria-hidden="true"><path d="${PLATFORM_ICONS[id]}"/></svg>`;
}


/* ── Onboarding ──────────────────────────────────────── */

/* ── Tab icons: dot-grid SVGs (5×5, cell=3px, gap=1.5px, step=4.5) ── */
/* The sub-tabs. Order is the repo's, labels are the prototype's.

   renderOnboardingTabs() draws these as a text-only slash nav and never touches
   `icon`. The closures stay anyway because Mark's buildGdBox() calls def.icon():
   that function is currently unreachable — v3.70 kept the tabbed layout over the
   stacked one — but leaving the property off would turn it into a TypeError the
   moment anyone wires it back up. */
const OB_TAB_DEFS = [
  { labelKey: 'ob.tab.about',        icon: () => `<img src="Assets/Icon_About.png"        class="ob-tab-img" alt="">` },
  { labelKey: 'ob.tab.distribution', icon: () => `<img src="Assets/Icon_Distribution.png" class="ob-tab-img" alt="">` },
  { labelKey: 'ob.tab.assets',       icon: () => `<img src="Assets/Icon_Assets.png"       class="ob-tab-img" alt="">` },
];


/* Returns 0–1 completion fraction for a given tab index */
function getTabProgress(tabIdx) {
  const tabSections = [
    ['about', 'platforms'],   // About
    ['distribution'],         // Distribution (localization defaults to en, always answered)
    ['screenshots'],          // Assets
  ];
  const ids = tabSections[tabIdx] || [];
  if (!ids.length) return 0;
  const answered = ids.filter(id => OB_SECTION_ANSWERED[id]?.()).length;
  return answered / ids.length;
}

function renderOnboarding() {
  // Update static header text from locale
  const headline = document.querySelector('.ob-headline');
  const subline  = document.querySelector('.ob-subline');
  if (headline && typeof t === 'function') headline.textContent = t('ob.headline');
  if (subline  && typeof t === 'function') subline.textContent  = t('ob.subline');
  renderOnboardingTabs();
  renderOnboardingBody();
  renderOnboardingFooter();
  renderLangMenu();
}

function renderOnboardingTabs() {
  const tabsEl = document.getElementById('ob-tabs');
  if (!tabsEl) return;
  /* Slash nav, ported from the prototype: plain uppercase text at 20px, left
     aligned with the nav pill, separated by "/". No icons and no progress
     rail — the rails went out with the modal this used to live in. Completion
     still rides along as .done for whenever we want to show it again;
     right now it reads identically to not-done, on purpose. */
  tabsEl.innerHTML = OB_TAB_DEFS.map((def, i) => {
    const isActive = i === state.onboardingTab;
    const label    = (typeof t === 'function') ? t(def.labelKey) : def.labelKey;
    const done     = getTabProgress(i) >= 1;
    const sep      = i ? '<span class="sl">/</span>' : '';
    return `${sep}<button class="${isActive ? 'on' : ''}${done ? ' done' : ''}"
              onclick="setOnboardingTab(${i})"
              aria-selected="${isActive}">${label}</button>`;
  }).join('');
}

function renderOnboardingBody() {
  const el = document.getElementById('ob-body');
  if (!el) return;
  if (state.onboardingTab === 0) el.innerHTML = buildAboutTab();
  if (state.onboardingTab === 1) { el.innerHTML = buildDistributionTab(); requestAnimationFrame(() => initObDistMap()); }
  if (state.onboardingTab === 2) el.innerHTML = buildAssetsTab();
  // Hydrate form fields from state (each helper is a no-op if its elements aren't in the DOM)
  hydrateGameDetailsTab();
  hydrateUploadAssetsTab();
  renderOnboardingScreenshotGrid();
  renderOnboardingFeaturePreview();
  // Set amber rail state for all sections based on current form values
  updateObSectionStates();
}

function renderOnboardingFooter() {
  const el = document.getElementById('ob-footer');
  if (!el) return;
  const isLast  = state.onboardingTab === 2;
  const isFirst = state.onboardingTab === 0;
  const hasPlat = state.activePlatforms.size > 0;

  // Assets opened via a "Manage" button in the Web platform's Trailers/
  // Screenshots sub-sections (shown in both "Site Details" and the
  // standalone "Media" modal — see _wsMediaFieldsHTML) is a standalone
  // detour, not a step in the linear onboarding flow: no "Launch Dashboard"
  // action here, no ordinary Back either (there's nowhere in the linear
  // flow to go back TO — this wasn't reached by stepping forward through
  // it). Instead the footer's usual Back/Next pair is replaced by a single
  // "Save & Return" button (bottom-right, same presentation as the
  // analogous cross-platform detour's own "Save & Return"/"Save & Return to
  // Web" buttons in the step-modal footer — see renderStepModal) that sends
  // the user back to whichever of Site Details/Media they clicked "Manage"
  // from (state.assetsFromWebEditSource). See openAssetsFromWebEdit /
  // backFromAssetsToWebEdit in app.js.
  const fromWebEdit = state.assetsFromWebEdit && state.onboardingTab === 2;

  /* The prototype has no footer bar: no rule, no progress dots, no Back. The
     only action is Continue, and it lives up on the slash row, pushed to the
     right edge of the content column by `.slashrow #btn-next{margin-left:auto}`.
     #ob-footer is display:contents, so the button is a direct flex child of
     .slashrow and that selector applies verbatim. */
  el.innerHTML = `
    <button class="btn-continue" id="btn-next" onclick="${fromWebEdit ? 'backFromAssetsToWebEdit()' : (isLast ? 'completeOnboarding()' : 'nextOnboardingTab()')}">
      <span class="cta-lbl">${fromWebEdit ? 'Save &amp; Return' : (isLast ? 'Continue to Submit' : t('ob.footer.next'))}</span>
    </button>`;
}

/* Tab 0: About */
function buildAboutTab() {
  const fd = state.formData;
  return `
    <div class="ob-form">

      <!-- ── About your game ── -->
      <div class="ob-section" id="ob-sec-about">
        
        <div class="ob-q" id="ob-q-title" data-answered="${fd.title?.trim() ? '1' : '0'}">
          <div class="gi-head">
            <label class="form-label" for="ob-title">${t('ob.field.title.label') || 'Game Title'}</label>
            <div class="char-count" id="ob-title-count">${(fd.title || '').length}/30</div>
          </div>
          <div class="title-search-wrap">
            <div class="form-group">
              <input class="form-input" id="ob-title" type="text" maxlength="50" required
                     placeholder="${t('ob.field.title.placeholder') || 'e.g., Go Ape Ship!'}"
                     autocomplete="off"
                     oninput="syncField('title', this.value); charCount('ob-title-count', this.value, 30); _onTitleInputScenario(this.value)"
                     onfocus="_onTitleFocus(this.value)"
                     onblur="_onTitleBlur(); _iasPropagateTitle(this.value)">
            </div>
            <div id="ob-title-picklist" class="title-picklist"></div>
          </div>
        </div>

        <div id="ob-scenario-wrap">
          ${buildScenarioWidget()}
        </div>

        <div class="ob-q" id="ob-q-desc" data-answered="${fd.description?.trim() ? '1' : '0'}">
          <div class="gi-head">
            <label class="form-label" for="ob-desc">${t('ob.field.desc.label') || 'Description'}</label>
            <div class="char-count" id="ob-desc-count">${(fd.description || '').length}/4000</div>
          </div>
          <div class="form-group">
            <textarea class="form-input" id="ob-desc" rows="5" required
                      placeholder="${t('ob.field.desc.placeholder') || 'Tell players what makes your game worth their time...'}"
                      oninput="syncField('description', this.value); charCount('ob-desc-count', this.value, 4000)"
                      onblur="_iasTriggerAutoTranslate('description', this.value)"></textarea>
          </div>
        </div>
      </div>

      <!-- ── Platforms ──
           No divider: the prototype runs straight from the description into
           the platform grid. And the label is the same .gi-head/.gi-label as
           every other field, not a separate section header. -->
      <div class="ob-section" id="ob-sec-platforms">
        <div class="ob-q gi-last" id="ob-q-platforms" data-answered="${state.activePlatforms.size > 0 ? '1' : '0'}">
          <div class="gi-head">
            <span class="form-label">${t('ob.section.about.platforms') || 'Select platforms'}</span>
          </div>
          <div id="ob-plat-grid-wrap" class="ob-req-group ${state.activePlatforms.size === 0 ? 'is-req-empty' : ''}">${buildObPlatTilesHTML()}</div>
        </div>
      </div>

    </div>`;
}

/* Tab 1: Distribution */
function buildDistributionTab() {
  const fd = state.formData;
  const knownPresets = ['everywhere','english_only','minimize_regulation','custom'];
  const dPreset = knownPresets.includes(fd.distributionPreset) ? fd.distributionPreset : null;

  const distPresets = [
    { id:'everywhere',          label: t('ob.dist.preset.everywhere') || 'Everywhere' },
    { id:'english_only',        label: t('ob.dist.preset.english_only') || 'English only' },
    { id:'minimize_regulation', label: t('ob.dist.preset.minimize_reg') || 'Minimize regulation' },
    { id:'custom',              label: t('ob.dist.preset.custom') || 'Custom' },
  ];

  return `
    <div class="ob-form">

      <!-- ── Distribution ── -->
      <div class="ob-section" id="ob-sec-distribution">
        <div class="ob-section-hdr">${t('ob.section.distribution') || 'Distribution'}</div>

        <div id="ob-dist-map-container" class="world-map-container" style="margin-bottom:14px;"></div>

        <div class="ob-q" id="ob-q-distribution" data-answered="${dPreset ? '1' : '0'}">
          <span class="ob-dist-question">${t('ob.dist.question') || 'Where do you intend to make the game available?'}</span>

          <div id="ob-dist-preset-group" class="ob-req-group ${!dPreset ? 'is-req-empty' : ''}" style="margin-bottom:10px;">
            <div class="ob-preset-pills">
              ${distPresets.map(p => `
                <button class="ob-preset-pill ${dPreset === p.id ? 'is-active' : ''}"
                        data-preset="${p.id}"
                        onclick="setObDistPreset('${p.id}')">${p.label}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="sw-tip-box" style="margin-bottom:10px;">
          <img src="Assets/SubwooferIcon_Orange.png" class="sw-tip-logo" alt="">
          <span class="sw-tip-text"><strong class="sw-tip-bold">Shipmate Tip:</strong> ${t('tip.distribution.regions') || 'Gamer behavior varies significantly between regions. A successful launch carefully considers localization, culturalization, purchase behavior, and market fit in each region.'}</span>
        </div>

        <div id="ob-country-list-wrap">${buildObCountryChips()}</div>
      </div>

      <div class="ob-sec-divider"></div>

      <!-- ── Localization ── -->
      <div class="ob-section" id="ob-sec-localization">
        <div class="ob-section-hdr">${t('ob.section.localization') || 'Localization'}</div>

        <div class="sw-tip-box" style="margin-bottom:12px;">
          <img src="Assets/SubwooferIcon_Orange.png" class="sw-tip-logo" alt="">
          <span class="sw-tip-text"><strong class="sw-tip-bold">Shipmate Tip:</strong> ${t('tip.distribution.languages') || 'On average, games see 30–50% more revenue in markets where they support the local language vs. English-only releases. The highest-impact localization for your selected markets is highlighted below.'}</span>
        </div>

        <div id="ob-lang-list-wrap">${buildObLangList()}</div>
      </div>

    </div>`;
}

/* ── Release Timing — platform review data & helpers ─── */

const OB_PLATFORM_TIMING = {
  ios:      { days: 2.2, color: '#60a5fa', label: 'App Store'   },
  android:  { days: 4.3, color: '#4ade80', label: 'Google Play' },
  steam:    { days: 7.1, color: '#38bdf8', label: 'Steam Store' },
  egs:      { days: 3.0, color: '#e2e2e2', label: 'Epic Games'  },
  xbox:     { days: 5.0, color: '#22c55e', label: 'Xbox'        },
  nintendo: { days: 5.0, color: '#ef4444', label: 'Nintendo'    },
  psn:      { days: 4.0, color: '#818cf8', label: 'PlayStation' },
};

function fmtDateShort(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Add fractional days to a date (uses floor for display)
function _addDays(base, days) {
  return new Date(base.getTime() + days * 86400000);
}

function buildReleaseTimingContent() {
  const fd = state.formData;
  const rt = fd.releaseTiming || 'manual';

  if (rt === 'manual') {
    return `<div class="ob-timing-manual-msg">Each platform sits at <strong>Ready</strong> after review. You press go per platform.</div>`;
  }

  // Build sorted review data from active platforms
  const reviewData = [...state.activePlatforms]
    .filter(p => OB_PLATFORM_TIMING[p])
    .map(p => ({ id: p, ...OB_PLATFORM_TIMING[p] }))
    .sort((a, b) => a.days - b.days);

  if (!reviewData.length) {
    return `<div class="ob-timing-manual-msg">Select at least one platform above to see your submission timeline.</div>`;
  }

  if (rt === 'as_approved') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const maxDays = Math.max(...reviewData.map(r => r.days));
    const minDays = Math.min(...reviewData.map(r => r.days));
    const stagger = (maxDays - minDays).toFixed(1);

    const rows = reviewData.map(r => {
      const pct      = (r.days / maxDays) * 100;
      const midPct   = pct / 2;
      const liveDate = fmtDateShort(_addDays(today, r.days));
      // Right-align date label for the max-days bar to prevent bleeding past the track edge
      const isMaxBar     = r.days === maxDays;
      const dateLblStyle = isMaxBar
        ? 'right:0;transform:none;text-align:right;'
        : `left:${pct.toFixed(1)}%;transform:translateX(-50%);`;
      return `
        <div class="ob-timing-row">
          <div class="ob-timing-label">
            <span class="ob-timing-plat-dot" style="background:${r.color}"></span>
            <span>${r.label}</span>
          </div>
          <div class="ob-timing-track">
            <div class="ob-timing-bar-line" style="width:${pct.toFixed(1)}%;background:${r.color}"></div>
            <div class="ob-timing-hdot" style="left:0"></div>
            <div class="ob-timing-fdot" style="left:${pct.toFixed(1)}%;background:${r.color};border-color:${r.color}"></div>
            <div class="ob-timing-lead-lbl" style="left:${midPct.toFixed(1)}%">${r.days} day average</div>
            <div class="ob-timing-date-lbl" style="${dateLblStyle}">${liveDate}</div>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="ob-timing-panel">
        ${rows}
        <div class="ob-timing-ruler"><span>Today</span></div>
      </div>
      <div class="ob-timing-footer">For a coordinated launch, pick a specific date.</div>`;
  }

  if (rt === 'specific_date') {
    const dateVal  = fd.releaseDate;
    const liveDate = dateVal ? new Date(dateVal + 'T00:00:00') : null;

    let panelHtml  = '';
    let footerHtml = '';

    if (liveDate && !isNaN(liveDate)) {
      // RECOMMENDED = LIVE − reviewDays × 2  (doubled buffer, matches published platform guidance)
      // SUBMIT BY   = LIVE − reviewDays
      const maxLead = Math.max(...reviewData.map(r => r.days * 2));
      const spanDays = maxLead + 1; // +1d left-side breathing room

      const rows = reviewData.map(r => {
        const recDate    = _addDays(liveDate, -(r.days * 2));
        const subDate    = _addDays(liveDate, -r.days);
        const recPct     = ((spanDays - r.days * 2) / spanDays) * 100;
        const subPct     = ((spanDays - r.days)     / spanDays) * 100;
        const solidW     = 100 - subPct;
        const dashW      = subPct - recPct;
        const leadMidPct = subPct + solidW / 2;

        return `
          <div class="ob-timing-row">
            <div class="ob-timing-label">
              <span class="ob-timing-plat-dot" style="background:${r.color}"></span>
              <span>${r.label}</span>
            </div>
            <div class="ob-timing-track ob-timing-track--sd">
              <!-- 1. Faint gray line: left edge → recommended date -->
              <div class="ob-timing-faint-line" style="width:${recPct.toFixed(1)}%"></div>
              <!-- 2. Dotted line: recommended → submit-by -->
              <div class="ob-timing-dash-line" style="left:${recPct.toFixed(1)}%;width:${dashW.toFixed(1)}%"></div>
              <!-- 3. Solid colored line: submit-by → live -->
              <div class="ob-timing-solid-line" style="left:${subPct.toFixed(1)}%;width:${solidW.toFixed(1)}%;background:${r.color}"></div>
              <!-- Open dot at recommended (dashed border) -->
              <div class="ob-timing-hdot ob-timing-hdot--rec" style="left:${recPct.toFixed(1)}%"></div>
              <!-- Open dot at submit-by -->
              <div class="ob-timing-hdot" style="left:${subPct.toFixed(1)}%"></div>
              <!-- Filled dot at live -->
              <div class="ob-timing-fdot" style="left:100%;background:${r.color};border-color:${r.color}"></div>
              <!-- Label above solid section -->
              <div class="ob-timing-lead-lbl" style="left:${leadMidPct.toFixed(1)}%">${r.days}d lead</div>
              <!-- Labels below line -->
              <div class="ob-timing-rec-lbl" style="left:${recPct.toFixed(1)}%"><span class="ob-timing-rec-tag">RECOMMENDED</span><br>${fmtDateShort(recDate)}</div>
              <div class="ob-timing-date-lbl" style="left:${subPct.toFixed(1)}%">${fmtDateShort(subDate)}</div>
            </div>
          </div>`;
      }).join('');

      // "Minimum submit by" = latest submit-by date (shortest review platform)
      const minSubmitBy = fmtDateShort(_addDays(liveDate, -reviewData[0].days));

      panelHtml = `
        <div class="ob-timing-panel">
          ${rows}
          <div class="ob-timing-live-label">LIVE &middot; ${fmtDateShort(liveDate)}</div>
        </div>`;
      footerHtml = `<div class="ob-timing-footer"><strong>Recommended</strong> dates include each platform&rsquo;s published buffer for re-reviews &amp; propagation.</div>`;
    } else {
      panelHtml = `<div class="ob-timing-manual-msg" style="margin-top:4px;">Enter a launch date to see your submission timeline.</div>`;
    }

    return `
      <div class="ob-timing-launch-row" style="margin-bottom:12px;">
        <span class="ob-timing-launch-tag">Launch</span>
        <input class="form-input ob-timing-date-input" id="ob-date" type="date" value="${escHtml(dateVal || '')}"
               onchange="syncField('releaseDate', this.value); _refreshTimingContent()">
      </div>
      ${panelHtml}
      ${footerHtml}`;
  }

  return '';
}

/* ── Onboarding list helpers ─────────────────────────── */

const OB_LANG_NAMES = {
  en:'English', zh:'Chinese (Simplified)', 'zh-TW':'Chinese (Traditional)',
  ja:'Japanese', ko:'Korean',
  pt:'Portuguese', 'pt-BR':'Portuguese (Brazilian)', es:'Spanish',
  'es-419':'Spanish (Latin America)', de:'German', fr:'French',
  ru:'Russian', ar:'Arabic', tr:'Turkish', id:'Indonesian',
  th:'Thai', nl:'Dutch', pl:'Polish', it:'Italian', sv:'Swedish',
  nb:'Norwegian', da:'Danish', fi:'Finnish', cs:'Czech',
  hu:'Hungarian', ro:'Romanian', uk:'Ukrainian', vi:'Vietnamese',
  ms:'Malay', he:'Hebrew', el:'Greek',
};

function _obFmtGamers(n) { return n >= 1 ? `${n}M` : '<1M'; }

function _obListHeader(leftLabel) {
  return `
    <div class="ob-list-header">
      <span class="ob-list-col-name">${leftLabel}</span>
      <span class="ob-list-col-count">iOS Gamers</span>
    </div>`;
}

/* Regulatory extra-steps tooltip map — countries requiring non-standard compliance */
const OB_REG_TIPS = {
  CN: 'Requires an ISBN game license from China\'s NPPA and a licensed local publishing partner. Foreign companies cannot self-publish.',
  KR: 'Mandatory age rating from Korea\'s Game Rating and Administration Committee (GRAC) before any distribution.',
  JP: 'CERO age rating required. Some content categories (extreme violence, adult themes) may be rejected or require edits.',
  DE: 'USK age rating required. Certain content (hate symbols, excessive gore) is banned. USK-18 titles face advertising restrictions.',
  AU: 'ACB classification required. Games refused classification cannot be sold. Content thresholds differ from US/EU standards.',
  BR: 'CLASSIND age rating required for Brazilian app stores. Content descriptors must match local rating system.',
  SA: 'Content must be approved by the General Authority for Audiovisual Media. Religious and political content is strictly restricted.',
  ID: 'Ministry of Communication and Information Technology registration required. Local content rules apply.',
  VN: 'Ministry of Information and Communications approval required before launch. Foreign games need a licensed local partner.',
  NL: 'Paid loot boxes face gambling-law scrutiny; some mechanics may require modification or legal review.',
  BE: 'Paid loot boxes are classified as illegal gambling. Games with paid randomized rewards risk fines or a sales ban.',
  RU: 'Roskomnadzor content oversight applies. Geopolitical sanctions may complicate payment processing and distribution.',
  ZA: 'Film and Publication Board (FPB) classification required. Unclassified games may not be sold commercially.',
};

/** Regulatory tip: prefers locale key, falls back to OB_REG_TIPS const.
 *  Guards against locale returning the key string itself (meaning "not found"). */
function regTip(code) {
  const key = `reg.tip.${code.toLowerCase()}`;
  const localeVal = typeof t === 'function' ? t(key) : null;
  return (localeVal && localeVal !== key ? localeVal : null) || OB_REG_TIPS[code] || '';
}

const _chevDown = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
const _chevUp   = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`;

/* ── IGDB title picklist ─────────────────────────────── */

// Canonical sort order for platform icons in the picklist
const _PLAT_ORDER = ['steam', 'ios', 'android', 'psn', 'xbox', 'nintendo'];

function buildTitlePicklist() {
  const items = state.titlePicklist || [];
  if (!items.length) return '';
  return items.map(item => {
    const thumb = item.coverUrl
      ? `<img src="${escHtml(item.coverUrl)}" alt="" class="picklist-thumb" loading="lazy">`
      : `<div class="picklist-thumb picklist-thumb-empty"></div>`;
    // Sort found platforms into canonical order, then cap at 6
    const platSet   = new Set(item.platforms);
    const sorted    = _PLAT_ORDER.filter(p => platSet.has(p));
    // Any platforms not in canonical order go at the end
    item.platforms.forEach(p => { if (!_PLAT_ORDER.includes(p)) sorted.push(p); });
    const tiles = sorted.slice(0, 6).map(pid => {
      const label = (PLATFORMS[pid] && PLATFORMS[pid].label) || pid;
      const icon  = platformIcon(pid, 14, 'white');
      return `<div class="plat-tile active" title="${escHtml(label)}">${icon}</div>`;
    }).join('');
    const grid = tiles ? `<div class="picklist-plat-grid">${tiles}</div>` : '';
    const desc = item.summary
      ? (item.summary.length > 90 ? item.summary.slice(0, 90) + '…' : item.summary)
      : '';
    return `
      <div class="picklist-row" onmousedown="_cancelPicklistClose()" onclick="selectPicklistItem(${item.id})">
        ${thumb}
        <div class="picklist-info">
          <div class="picklist-name">${escHtml(item.name)}</div>
          ${desc ? `<div class="picklist-desc">${escHtml(desc)}</div>` : ''}
        </div>
        ${grid}
      </div>`;
  }).join('');
}

/* ── Store search result widget ──────────────────────── */
function buildScenarioWidget() {
  const ls = state.liveSearch;

  // Loading
  if (ls && ls.status === 'loading') {
    const title = state.formData.title || 'your game';
    return `
      <div class="ob-live-loading">
        <div class="ob-live-spinner"></div>
        <span>Searching stores for &ldquo;${escHtml(title)}&rdquo;&hellip;</span>
      </div>`;
  }

  // Confirmed import — compact success note
  if (ls && ls.status === 'done' && ls.confirmed) {
    const storeLabels = { ios: 'App Store', steam: 'Steam', android: 'Google Play', egs: 'Epic', xbox: 'Xbox', nintendo: 'Nintendo', psn: 'PlayStation' };
    const stores = (ls.allStores || []).map(pid => storeLabels[pid] || pid);
    return `
      <div class="ob-search-confirm">
        <svg viewBox="0 0 16 16" fill="none" width="13" height="13" aria-hidden="true" style="flex-shrink:0">
          <path d="M3 8l3.5 3.5L13 5" stroke="var(--green)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Imported from ${escHtml(stores.join(' · '))} — description and platforms filled in.</span>
      </div>`;
  }

  // Found — result card
  if (ls && ls.status === 'done' && ls.found) {
    const storeLabels = { ios: 'App Store', steam: 'Steam', android: 'Google Play', egs: 'Epic', xbox: 'Xbox', nintendo: 'Nintendo', psn: 'PlayStation' };
    const stores = (ls.allStores || []).map(pid => storeLabels[pid] || pid);
    const desc = ls.description
      ? (ls.description.length > 220 ? ls.description.slice(0, 220) + '…' : ls.description)
      : '';
    return `
      <div class="ob-search-result">
        <div class="ob-search-result-name">${escHtml(ls.title || state.formData.title || '')}</div>
        ${desc ? `<div class="ob-search-result-desc">${escHtml(desc)}</div>` : ''}
        ${stores.length ? `
          <div class="ob-search-result-stores">
            ${stores.map(n => `<span class="ob-search-store-chip">${escHtml(n)}</span>`).join('')}
          </div>` : ''}
        <div class="ob-search-result-actions">
          <button class="btn btn-primary" onclick="confirmGameImport()">That&rsquo;s it!</button>
          <button class="btn btn-ghost" onclick="rejectGameImport()">Nope</button>
        </div>
      </div>`;
  }

  // Not found — quiet note
  if (ls && ls.status === 'done' && !ls.found) {
    return `<div class="ob-live-not-found">${t('ob.scenario.not_found') || 'Couldn’t find your game in stores — fill in the description below.'}</div>`;
  }

  // No result yet (null) or error — show nothing
  return '';
}

/* ── Scenario widget (dead code, kept to avoid reference errors) ── */
function _legacyScenarioWidget_unused() {
  const gs = state.formData.gameScenario;
  const ls = state.liveSearch;
  const needsSearch = gs === 'new_platform' || gs === 'update';

  const scenarios = [
    { v: 'new',          label: 'New Game'     },
    { v: 'new_platform', label: 'New Platform' },
    { v: 'update',       label: 'New Update'   },
  ];

  const chips = scenarios.map(s => `
    <button class="ob-scenario-chip${gs === s.v ? ' is-on' : ''}"
            onclick="setGameScenario('${s.v}')">${escHtml(s.label)}</button>
  `).join('');

  let resultHtml = '';
  if (needsSearch) {
    if (!ls || ls.status === 'loading') {
      const title = state.formData.title || 'your game';
      resultHtml = `
        <div class="ob-live-loading">
          <div class="ob-live-spinner"></div>
          <span>Searching stores for &ldquo;${escHtml(title)}&rdquo;&hellip;</span>
        </div>`;
    } else if (ls.status === 'done' && ls.confirmed) {
      const storeMap = { ios: 'iOS App Store', steam: 'Steam', android: 'Google Play' };
      const storeNames = (ls.allStores || []).map(pid => storeMap[pid] || pid);
      const sourceStr  = storeNames.length ? storeNames.join(' & ') : (ls.source || 'store listing');
      const platNote   = storeNames.length ? ' &mdash; platforms pre-selected.' : '.';
      resultHtml = `
        <div class="sw-tip-box" style="margin-bottom:0;align-items:center;">
          <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true" style="flex-shrink:0">
            <path d="M3 8l3.5 3.5L13 5" stroke="#4ade80" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="sw-tip-text"><strong class="sw-tip-bold">Found on ${escHtml(sourceStr)}</strong>${platNote}</span>
        </div>`;
    } else if (ls.status === 'done' && ls.found) {
      resultHtml = `
        <div class="sw-tip-box" style="margin-bottom:0;">
          <img src="Assets/SubwooferIcon_Orange.png" class="sw-tip-logo" alt="">
          <div class="sw-tip-text">
            <div><strong class="sw-tip-bold">Shipmate Tip:</strong> We found this on ${escHtml(ls.source || 'the store')}.</div>
            <div class="ob-live-found-desc" style="margin-top:6px;">${escHtml(ls.description || '')}</div>
            <div class="ob-live-found-actions" style="margin-top:8px;">
              <button class="btn btn-primary" style="font-size:12px;padding:5px 14px;" onclick="confirmGameImport()">That&rsquo;s mine!</button>
              <button class="btn btn-ghost" style="font-size:12px;padding:5px 14px;" onclick="rejectGameImport()">Not me</button>
            </div>
          </div>
        </div>`;
    } else if (ls.status === 'done' && !ls.found) {
      resultHtml = `
        <div class="ob-live-not-found">
          We couldn&rsquo;t find &ldquo;${escHtml(state.formData.title || 'your game')}&rdquo; in our stores database — fill in the description below.
        </div>`;
    } else if (ls.status === 'error') {
      resultHtml = `
        <div class="ob-live-not-found">
          Search unavailable — fill in the description below.
        </div>`;
    }
  }

  return `
    <div class="ob-scenario">
      <div class="ob-scenario-chips">${chips}</div>
      ${resultHtml}
    </div>`;
}

/* ── Country row list ── first 10 always visible, rest collapsible ── */
function buildObCountryChips() {
  const fd         = state.formData;
  const selected   = new Set(fd.selectedCountries || []);
  const maxGamers  = IOS_COUNTRIES[0]?.iosGamers || 1;
  const extraCount = Math.max(0, IOS_COUNTRIES.length - 10);

  const buildRow = (c, i) => {
    const isOn   = selected.has(c.code);
    const barPct = Math.round((c.iosGamers / maxGamers) * 100);
    const regTipText = regTip(c.code);
    const regTipHtml = regTipText
      ? `<span class="tooltip-anchor" data-tip="${regTipText}" onclick="event.stopPropagation()"><span class="tooltip-icon${isOn ? ' is-warned' : ''}">?</span></span>`
      : '';
    return `
      <div class="ob-dist-row${isOn ? ' is-on' : ''}"
           data-code="${c.code}"
           onclick="toggleObCountry('${c.code}')">
        <div class="ob-dist-row-chip${isOn ? ' is-on' : ''}" id="ob-dist-chip-${c.code}">
          ${c.name}${regTipHtml}
        </div>
        <div class="ob-dist-row-bar-wrap">
          <div class="ob-dist-row-bar-fill" style="width:${barPct}%"></div>
        </div>
        <span class="ob-dist-row-count">${_obFmtGamers(c.iosGamers)}</span>
      </div>`;
  };

  const topRows   = IOS_COUNTRIES.slice(0, 10).map(buildRow).join('');
  const extraRows = IOS_COUNTRIES.slice(10).map(buildRow).join('');

  return `
    <div class="ob-dist-table-header">
      <span class="ob-dist-col-market">Market</span>
      <span class="ob-dist-col-count">iOS Gamers (approx)</span>
    </div>
    <div class="ob-dist-country-list" id="ob-dist-country-list">${topRows}</div>
    ${extraCount > 0 ? (() => {
      const hiddenSelected = IOS_COUNTRIES.slice(10).filter(c => selected.has(c.code)).length;
      const badge = hiddenSelected > 0
        ? `<span class="ob-dist-hidden-badge" title="${hiddenSelected} selected market${hiddenSelected > 1 ? 's' : ''} below — expand to review">${hiddenSelected} selected ↓</span>`
        : '';
      return `
    <button class="ob-dist-expand-btn" id="ob-dist-expand-btn" onclick="toggleObDistExpand(this)">
      ${_chevDown} Show ${extraCount} more markets${badge}
    </button>
    <div class="ob-dist-country-list hidden" id="ob-dist-country-list-extra">${extraRows}</div>`;
    })() : ''}`;
}

/* ── Legacy alias ── */
function buildObCountryList() { return buildObCountryChips(); }

/* ── Platform chips (text-only multi-select, same style as lang chips) ── */
/* The icon for a platform tile. The prototype's own mark when it has one,
   otherwise this repo's, wrapped by hand rather than through platformIcon().

   Why not platformIcon(): for ids that appear in PLATFORM_ASSET — psn among
   them — it returns an <img>, and a raster image can't inherit currentColor,
   so the icon would stay grey while its tile turned blue. Wrapping the path
   data directly keeps every tile on one behaviour.

   Note the viewBoxes differ: the prototype's marks are drawn on 64, this
   repo's on 24, so the fallbacks read a little heavier. If you have the real
   Web mark, drop it into platform-icons.js as `web` and this stops firing. */
function protoTileIcon(iconKey, repoId) {
  const own = PROTO_PLATFORM_ICONS[iconKey];
  if (own) return own;
  const d = (typeof PLATFORM_ICONS !== 'undefined') ? PLATFORM_ICONS[repoId] : '';
  if (!d) return '';
  const evenodd = EVENODD_ICONS.has(repoId) ? ' fill-rule="evenodd" clip-rule="evenodd"' : '';
  return `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"${evenodd}`
       + ` aria-hidden="true"><path d="${d}"/></svg>`;
}

function buildObPlatTilesHTML() {
  /* The prototype's PLATFORMS list, its order, its labels:
       [['Steam','steam'],['Web','web'],['App Store','ios'],
        ['Google Play','android'],['Epic','epic'],['PlayStation','playstation']]
     Six, not eight. `iconKey` is the prototype's key into PROTO_PLATFORM_ICONS;
     `id` is this repo's platform id, which drives state.activePlatforms.

     Xbox and Nintendo are not in the prototype's list, so they are not here.
     Adding them back is a two-line change if you want them, locked.

     The prototype's icon set only has ios, android, steam and epic — there is
     no web or playstation mark anywhere in that file, so its own Web and
     PlayStation tiles render an empty box. Those two fall back to this repo's
     own path data via protoTileIcon() below. */
  const PLATFORMS_OB = [
    { id:'steam',   iconKey:'steam',       label:'Steam',       comingSoon: false },
    { id:'web',     iconKey:'web',         label:'Web',         comingSoon: false },
    { id:'ios',     iconKey:'ios',         label:'App Store',   comingSoon: false },
    { id:'android', iconKey:'android',     label:'Google Play', comingSoon: false },
    { id:'egs',     iconKey:'epic',        label:'Epic',        comingSoon: true  },
    { id:'psn',     iconKey:'playstation', label:'PlayStation', comingSoon: true  },
  ];
  const lockSVG = `<svg class="ob-plat-lock" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="8" height="7" rx="1.5" fill="currentColor" opacity="0.5"/><path d="M4 6V4a2 2 0 1 1 4 0v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity="0.5"/></svg>`;
  /* The prototype's tile, markup for markup:
       <button class="platform-tile[ selected]" data-platform="…">
         <span class="platform-tile-icon">…svg…</span>
         <span class="platform-tile-label">…</span>
       </button>
     The icon comes from PROTO_PLATFORM_ICONS and inherits currentColor, so it turns
     blue with the tile. platformIcon() is NOT used here — it returns
     brand-coloured artwork that ignores the tile's state.

     Grid class: the prototype renders `cols===3 ? 'pg-6' : 'pg-3'`, and cols
     is 3, so what it actually draws is pg-6 — six columns, one row. The bare
     .platform-grid's repeat(4,1fr) is only the fallback. */
  const tiles = PLATFORMS_OB.map(({ id, iconKey, label, comingSoon }) => {
    const icon = `<span class="platform-tile-icon">${protoTileIcon(iconKey, id)}</span>`
      + `<span class="platform-tile-label">${label}</span>`;
    if (comingSoon) {
      // Not in the prototype: its list has no locked state. The repo's lock,
      // wearing the prototype's tile.
      return `<button type="button" class="platform-tile" disabled
                      title="${label} — coming soon">${icon}${lockSVG}</button>`;
    }
    const isOn = state.activePlatforms.has(id);
    return `<button type="button" class="platform-tile${isOn ? ' selected' : ''}"
                    onclick="toggleOnboardingPlatform('${id}')"
                    data-platform="${label}" title="${label}">${icon}</button>`;
  }).join('');
  return `<div class="platform-grid pg-6">${tiles}</div>`;
}

/* ── Language picker ── two-row: primary (amber dropdown) + supported (green chips) */
// Industry-standard localization set (EFIGS + CJK + PT) — always shown
const OB_LANG_FEATURED = ['en','zh','ja','ko','es','pt','fr','de','it'];

// Region labels for each language code
const OB_LANG_REGIONS = {
  en:'Global', zh:'CN', 'zh-TW':'TW', ja:'JP', ko:'KR',
  es:'ES', 'es-419':'LATAM', pt:'PT', 'pt-BR':'BR', fr:'FR', de:'DE', it:'IT',
  ru:'RU', ar:'MENA', tr:'TR', id:'ID', th:'TH',
  nl:'NL', pl:'PL', sv:'SE', nb:'NO', da:'DK', fi:'FI',
  cs:'CZ', hu:'HU', ro:'RO', uk:'UA', vi:'VN',
  ms:'MY', he:'IL', el:'GR',
};

/* ── Find highest-impact unselected featured language ── */
function _highestImpactUnselectedLang() {
  const fd = state.formData;
  const primary  = fd.primaryLanguage || 'en';
  const selected = new Set(fd.localizations || []);
  // Use selected countries, or fall back to all countries if none chosen yet
  const countries = new Set(
    (fd.selectedCountries && fd.selectedCountries.length > 0)
      ? fd.selectedCountries
      : IOS_COUNTRIES.map(c => c.code)
  );

  const candidates = OB_LANG_FEATURED.filter(l => l !== primary && !selected.has(l));

  let best = null, bestTotal = 0;
  for (const lang of candidates) {
    const total = IOS_COUNTRIES
      .filter(c => countries.has(c.code) && c.lang === lang)
      .reduce((sum, c) => sum + (c.iosGamers || 0), 0);
    if (total > bestTotal) { bestTotal = total; best = lang; }
  }
  return { lang: best, total: bestTotal };
}

function buildObLangList() {
  const fd       = state.formData;
  const primary  = fd.primaryLanguage || 'en';
  const selected = new Set(fd.localizations || []);
  const count    = selected.size;
  const primaryName = OB_LANG_NAMES[primary] || primary;

  // Find the highest-impact unselected lang for the Shipmate tip
  const { lang: tipLang, total: tipTotal } = _highestImpactUnselectedLang();

  // Primary language dropdown items
  const allLangCodes = Object.keys(OB_LANG_NAMES);
  const ddItems = allLangCodes.map(lang => {
    const isCur = lang === primary;
    return `
      <button class="loc-dd-item${isCur ? ' is-current' : ''}"
              onclick="selectLocPrimary('${lang}')">
        <span class="loc-dd-name">${OB_LANG_NAMES[lang] || lang}</span>
      </button>`;
  }).join('');

  // Featured chips (minus primary)
  const featuredSet = new Set(OB_LANG_FEATURED);
  const chipLangs = OB_LANG_FEATURED.filter(l => l !== primary);

  // Non-featured langs that were added via [+]
  const extraSelected = [...selected].filter(l => !featuredSet.has(l) && l !== primary);

  const buildChip = (lang) => {
    const isOn = selected.has(lang);
    const isTipVisible = lang === tipLang && !isOn && tipTotal > 0;
    const tipBadge = isTipVisible
      ? `<span class="sw-tip-chip-badge tooltip-anchor" data-tip="${t('tip.lang.reach', { lang: OB_LANG_NAMES[lang], total: tipTotal }) || ('Shipmate Tip: adding ' + OB_LANG_NAMES[lang] + ' support could reach ~' + tipTotal + 'M gamers in their native language across your selected countries.')}" onclick="event.stopPropagation()">!</span>`
      : '';
    return `
      <button class="loc-chip${isOn ? ' is-on' : ''}${isTipVisible ? ' has-sw-tip' : ''}"
              onclick="toggleObLang('${lang}')">
        <span class="loc-chip-name">${OB_LANG_NAMES[lang] || lang}</span>${tipBadge}
      </button>`;
  };

  const featuredChips = chipLangs.map(buildChip).join('');
  const extraChips    = extraSelected.map(buildChip).join('');
  const addBtn = `<button class="loc-chip loc-chip-add" onclick="toggleLangSearch(event)" title="Add another language">+</button>`;

  const chevSvg = `<svg class="loc-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

  return `
    <div class="loc-picker">
      <div class="loc-row">
        <div class="loc-label-col">
          <div class="loc-label">${t('ob.loc.primary')}</div>
        </div>
        <div class="loc-control-col">
          <div class="loc-primary-wrap" id="loc-primary-wrap">
            <button class="loc-primary-pill" onclick="toggleLocPrimaryDropdown(event)">
              <span class="loc-primary-name">${primaryName}</span>
              ${chevSvg}
            </button>
            <div class="loc-dropdown" id="loc-dropdown">${ddItems}</div>
          </div>
        </div>
      </div>

      <div class="loc-divider"></div>

      <div class="loc-row">
        <div class="loc-label-col">
          <div class="loc-label">${t('ob.loc.supported')}</div>
        </div>
        <div class="loc-control-col">
          <div class="loc-chips" id="loc-chips">
            ${featuredChips}
            ${extraChips}
            ${addBtn}
          </div>
          <div class="lang-search-wrap hidden" id="lang-search-wrap">
            <input class="lang-search-input" id="lang-search-input" type="text"
                   placeholder="${t('ob.field.lang_search.placeholder')}"
                   oninput="filterLangSearch(this.value)"
                   onclick="event.stopPropagation()">
            <div class="lang-search-list" id="lang-search-list"></div>
          </div>
        </div>
      </div>
    </div>`;
}

/* Tab 2: Assets */
/* Shared by buildAssetsTab (Assets tab's "Trailer" section) and
   buildWebSitePreviewSection (preview website's "Trailers" sub-section) —
   the same compact, clickable Steam trailer preview in both places, so the
   two stay visually and behaviorally identical rather than two hand-copied
   near-duplicates drifting apart. `steamTrailer` is state.uploads.steamTrailer
   ({ name, thumbnail, hlsUrl } — see _steamTrailerFromMovies in app.js) or
   falsy; returns '' when there's nothing to show.
   Sized roughly like an uploaded screenshot thumbnail (see
   .steam-trailer-thumb in style.css, matching .asset-thumb's 160px/16:9
   sizing) rather than a large full-width preview — a compact reference of
   what's already live on the game's Steam page. Clicking the small
   thumbnail "opens up" a larger inline player (playSteamTrailer in app.js,
   via hls.js/Safari's native HLS support) rather than linking out —
   Steam's appdetails only returns adaptive-streaming manifest URLs for
   trailers now (see steamTrailer.hlsUrl/_steamTrailerFromMovies in app.js),
   which a plain <a href> click-through can't play in most browsers. The
   hlsUrl itself lives in a data attribute rather than an href since it's
   never meant to be navigated to directly. */
function _steamTrailerPreviewHTML(steamTrailer) {
  if (!steamTrailer) return '';
  // event.stopPropagation() matters on the preview website, where this sits
  // inside a .pk-mainsection that flips to its own edit modal on click
  // (see mediaHTML/pk-media in buildWebSitePreviewSection) — without it,
  // clicking the thumbnail would both play the trailer AND flip to the
  // Media edit modal underneath it, same reasoning as the existing
  // pk-video-link click-through above. Harmless in the Assets tab, which
  // has no such ancestor click handler to guard against.
  return `
    <div class="steam-trailer-preview" data-hls-url="${escHtml(steamTrailer.hlsUrl)}">
      <div class="steam-trailer-thumb-link" onclick="event.stopPropagation(); playSteamTrailer(this)" role="button" tabindex="0" title="Play trailer">
        <div class="steam-trailer-thumb">
          <img src="${escHtml(steamTrailer.thumbnail)}" alt="${escHtml(steamTrailer.name)}">
          <span class="steam-trailer-play-badge">▶</span>
        </div>
      </div>
      <div class="feature-preview-meta">
        <span class="feature-preview-name">🎬 ${escHtml(steamTrailer.name)} <span class="pk-muted">(from Steam)</span></span>
      </div>
    </div>`;
}

function buildAssetsTab() {
  const hasAndroid = state.activePlatforms.has('android');
  // Auto-filled when the picked title (About section's IGDB picklist) has a
  // linked Steam store page with at least one trailer — see
  // _applySteamAboutData/_steamTrailerFromMovies in app.js, sourced from
  // appdetails' own `movies` array. Shown beneath the manual upload
  // dropzone/YouTube-URL fields below via the shared _steamTrailerPreviewHTML
  // helper above (also used by the preview website's own "Trailers"
  // sub-section, buildWebSitePreviewSection) — purely a compact reference
  // of what's already live on the game's Steam page, it doesn't replace,
  // block, or get overwritten by either of those, since a developer may
  // still want to upload their own file or paste a different URL for
  // Shipmate's own submission flow.
  const steamTrailerHTML = _steamTrailerPreviewHTML(state.uploads.steamTrailer);
  return `
    <div class="ob-form">

      <!-- ── Screenshots ── -->
      <div class="ob-section" id="ob-sec-screenshots">
        <div class="ob-section-hdr">${t('ob.section.screenshots') || 'Screenshots'}</div>
        <div class="asset-guidance">${t('ob.screenshots.guidance')}</div>
        <div class="ob-q ob-q--rail-only" id="ob-q-screenshots" data-answered="${state.uploads.screenshots.length > 0 ? '1' : '0'}">
          <div id="ob-screenshot-req-wrap" class="ob-req-group ${state.uploads.screenshots.length === 0 ? 'is-req-empty' : ''}">
            <div class="asset-dropzone" id="ob-screenshot-dropzone"
                 onclick="document.getElementById('ob-screenshot-input').click()"
                 ondragover="event.preventDefault(); this.classList.add('is-over')"
                 ondragleave="this.classList.remove('is-over')"
                 ondrop="handleScreenshotDrop(event); this.classList.remove('is-over')">
              <div class="asset-dropzone-icon">↑</div>
              <div class="asset-dropzone-label">${t('ob.screenshots.drop_label')}</div>
              <div class="asset-dropzone-hint">${t('ob.screenshots.drop_hint')}</div>
              <input type="file" id="ob-screenshot-input" multiple accept="image/*" style="display:none"
                     onchange="handleScreenshotFiles(this.files); this.value=''">
            </div>
          </div>
          <div class="asset-grid" id="ob-screenshot-grid"></div>
        </div><!-- /ob-q-screenshots -->
      </div>

      <div class="ob-sec-divider"></div>

      <!-- ── Trailer (optional) ── -->
      <div class="ob-section" id="ob-sec-trailer">
        <div class="ob-section-hdr">${t('ob.section.trailer') || 'Trailer'} <span class="form-optional-tag">${t('ob.field.optional_tag') || 'Optional'}</span></div>
        <div class="asset-guidance">${t('ob.trailer.guidance')}</div>
        <div class="asset-dropzone asset-dropzone-sm" id="ob-trailer-dropzone"
             onclick="document.getElementById('ob-trailer-input').click()"
             ondragover="event.preventDefault(); this.classList.add('is-over')"
             ondragleave="this.classList.remove('is-over')"
             ondrop="handleTrailerDrop(event); this.classList.remove('is-over')">
          <div class="asset-dropzone-icon">↑</div>
          <div class="asset-dropzone-label">${t('ob.trailer.drop_label')}</div>
          <div class="asset-dropzone-hint">${t('ob.trailer.drop_hint')}</div>
          <input type="file" id="ob-trailer-input" accept="video/*" style="display:none"
                 onchange="handleTrailerFiles(this.files); this.value=''">
        </div>
        ${steamTrailerHTML}
        <div id="ob-trailer-file-info" style="display:none;"></div>
        <div class="asset-url-row">
          <label class="form-label" style="margin-bottom:6px;">${t('ob.field.trailer_url.label') || 'Or paste a YouTube URL'}</label>
          <input class="form-input" id="ob-trailer-url" type="url" placeholder="${t('ob.field.trailer_url.placeholder') || 'https://youtube.com/watch?v=…'}"
                 oninput="syncField('trailerUrl', this.value)">
        </div>
      </div>

    </div>`;
}

/* Tab 3: Compliance (unchanged) */
function buildComplianceTab() {
  return `
    <div class="ob-form">

      <!-- ── Compliance Questions ── -->
      <div class="ob-section" id="ob-sec-compliance">
        <div class="ob-section-hdr">${t('ob.section.compliance') || 'Compliance Questions'}</div>
        <div class="asset-guidance">${t('ob.compliance.guidance')}</div>
        <div id="ob-questions-list"></div>
      </div>

    </div>`;
}

/* buildPlatformSelectTab() removed — platforms are in buildAboutTab() */

/* Hydration helpers — fill form fields from state after render */
function hydrateGameDetailsTab() {
  const fd = state.formData;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('ob-title', fd.title);
  set('ob-desc',  fd.description);
  if (fd.title)       charCount('ob-title-count', fd.title,       30);
  if (fd.description) charCount('ob-desc-count',  fd.description, 4000);
}

function hydrateUploadAssetsTab() {
  // App icon
  if (state.uploads.appIcon) {
    const preview = document.getElementById('ob-icon-preview');
    if (preview) {
      preview.innerHTML = `<img src="${state.uploads.appIcon.dataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" alt="App Icon">`;
    }
  }
  const el = document.getElementById('ob-trailer-url');
  if (el) el.value = state.formData.trailerUrl || '';
  if (state.uploads.trailer) {
    const info = document.getElementById('ob-trailer-file-info');
    if (info) {
      const mb = (state.uploads.trailer.size / 1024 / 1024).toFixed(1);
      info.style.display = 'block';
      info.innerHTML = trailerFileRowHTML(state.uploads.trailer.name, mb, 'ob-');
    }
  }
}

function hydrateComplianceTab() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('ob-privacy', state.formData.privacyUrl);
  if (state.formData.privacyGenerated) {
    const cb = document.getElementById('ob-privacy-gen-check');
    if (cb) cb.checked = true;
    const note = document.getElementById('ob-privacy-gen-note');
    if (note) note.style.display = 'block';
  }
  renderComplianceQuestions();
}

function renderOnboardingScreenshotGrid() {
  const grid = document.getElementById('ob-screenshot-grid');
  if (!grid) return;
  // Sync required-empty indicator on wrapper, and section rail
  const reqWrap = document.getElementById('ob-screenshot-req-wrap');
  if (reqWrap) reqWrap.classList.toggle('is-req-empty', !state.uploads.screenshots.length);
  updateObSectionStates();
  if (!state.uploads.screenshots.length) { grid.innerHTML = ''; return; }
  // Clicking a thumbnail enlarges it via the same openScreenshotLightbox
  // (app.js) the preview website's own screenshot grid uses — same overlay,
  // same behavior in both places. The Remove button sits inside the same
  // clickable thumbnail, so it needs its own stopPropagation() or clicking
  // it would both remove the screenshot AND open the lightbox on the (now
  // removed) image.
  grid.innerHTML = state.uploads.screenshots.map(shot => `
    <div class="asset-thumb" onclick="openScreenshotLightbox(this)">
      <img src="${_screenshotSrc(shot)}" alt="${escHtml(shot.name)}">
      <button class="asset-remove" onclick="event.stopPropagation(); removeScreenshot('${shot.id}')" title="Remove">×</button>
      <div class="asset-name">${escHtml(shot.name)}</div>
    </div>`).join('');
}

function renderOnboardingFeaturePreview() {
  const preview = document.getElementById('ob-feature-preview');
  if (!preview) return;
  const dz = document.getElementById('ob-feature-dropzone');
  if (!state.uploads.featureGraphic) {
    preview.innerHTML = '';
    if (dz) dz.style.display = '';
    return;
  }
  if (dz) dz.style.display = 'none';
  const fg = state.uploads.featureGraphic;
  preview.innerHTML = `
    <div class="feature-preview-wrap">
      <img src="${fg.dataUrl}" alt="${fg.name}" class="feature-img">
      <div class="feature-preview-meta">
        <span class="feature-preview-name">${fg.name}</span>
        <button class="btn btn-ghost btn-sm" onclick="removeFeatureGraphic()">Replace</button>
      </div>
    </div>`;
}

function renderComplianceQuestions() {
  const container = document.getElementById('ob-questions-list');
  if (!container) return;
  let h = '';
  for (const q of QUESTIONS) {
    const answer = state.questionAnswers[q.id];
    const qLabel = t(`q.${q.id}.label`) || q.label;
    const qDesc  = t(`q.${q.id}.desc`)  || q.desc;
    const qTitle = t(`q.${q.id}.title`) || q.title;
    const tipText = escHtml(qLabel + (qDesc ? ' ' + qDesc : ''));
    const ttHTML = `<span class="tooltip-anchor"><span class="tooltip-icon">?</span><span class="tooltip-body">${tipText}</span></span>`;
    h += `
      <div class="ios-q-row" data-answered="${answer !== null ? '1' : '0'}">
        <div class="ios-q-left">
          <div class="ios-q-label">${escHtml(qTitle)}${ttHTML}</div>
        </div>
        <div class="question-yn">
          <button class="yn-btn yn-yes ${answer === 'yes' ? 'is-selected' : ''}"
                  onclick="answerQuestion('${q.id}','yes')">YES</button>
          <button class="yn-btn yn-no ${answer === 'no' ? 'is-selected' : ''}"
                  onclick="answerQuestion('${q.id}','no')">NO</button>
        </div>
      </div>`;
  }
  container.innerHTML = h;
}

/* re-exported so answerQuestion/changeInferredAnswer can call it */
function renderKeyQuestionsScreen() { renderComplianceQuestions(); }


/* ── Project bar ─────────────────────────────────────── */

function renderProjectBar() {
  const proj = state.projects.find(p => p.id === state.activeProjectId);
  const gameTitle = state.formData.title || proj?.name || 'My Game';

  // Update selector button titles
  const selTitle = document.getElementById('projectSelectorTitle');
  if (selTitle) selTitle.textContent = gameTitle;

  // Cover art in the project chip. Same source as the prototype's gameIcon():
  // the square icon the developer uploaded. Until one lands, the chip shows
  // the .empty hole rather than a placeholder graphic.
  const selIcon = document.getElementById('projectSelectorIcon');
  if (selIcon) {
    const icon = state.uploads?.appIcon;
    selIcon.classList.toggle('empty', !icon);
    selIcon.innerHTML = icon
      ? `<img src="${icon.dataUrl}" alt="">`
      : '';
  }

  // Tab labels come from the locale, not the static markup.
  const NAV_LABELS = {
    'nav-details':     'nav.details',
    'nav-dashboard':   'nav.submit',
    'nav-broadcast':   'nav.spread',
    'nav-performance': 'nav.performance',
  };
  for (const [id, key] of Object.entries(NAV_LABELS)) {
    const lbl = document.getElementById(id)?.querySelector('.lbl');
    if (lbl) lbl.textContent = t(key);
  }
  // Labels changed width, so the news glow has to be re-measured.
  if (typeof paintBarGlow === 'function') paintBarGlow();

  const verTitle = document.getElementById('versionSelectorTitle');
  const activeVer = proj?.versions.find(v => v.id === state.activeVersionId);
  if (verTitle) verTitle.textContent = 'v' + (activeVer?.versionNumber || '1.0');

  // Render project dropdown items
  const projDD = document.getElementById('projectDropdown');
  if (projDD) {
    projDD.innerHTML = state.projects.map(p => `
      <div class="project-item ${p.id === state.activeProjectId ? 'active' : ''}"
           onclick="switchProject('${p.id}')">
        ${p.name || t('bar.untitled_game')}
      </div>`).join('') + `
      <div class="project-dropdown-divider"></div>
      <div class="project-item new-project" onclick="createNewProject()">
        <span>${t('bar.new_project')}</span><span class="plus">+</span>
      </div>
      <div class="project-item danger" onclick="deleteCurrentProject()">
        <span>${t('bar.delete_project')}</span>
      </div>`;
  }

  // Render release dropdown items
  const verDD = document.getElementById('versionDropdown');
  if (verDD && proj) {
    verDD.innerHTML = proj.versions.map(v => {
      const label = v.name ? `v${v.versionNumber} <span class="ver-drop-name">${escHtml(v.name)}</span>` : `v${v.versionNumber}`;
      return `
        <div class="project-item ${v.id === state.activeVersionId ? 'active' : ''}"
             onclick="switchVersion('${v.id}')">
          ${label}
        </div>`;
    }).join('') + `
      <div class="project-item new-project" onclick="openNewReleaseModal()">
        <span>${t('bar.new_release')}</span><span class="plus">+</span>
      </div>`;
  }

  // Update profile name display
  const profName = document.getElementById('profile-name');
  if (profName) profName.textContent = t('bar.developer');
  renderLangMenu();
}


/* ════════════════════════════════════════════════════════════════════
   SHIPPY GUIDE PANEL

   The reserved right-hand column. Ported from the prototype's sm-* markup;
   the checklist predicates are rewritten against this repo's state, since the
   prototype read its own `form` object.

   Submit (the `dashboard` view) deliberately gets no panel: the platform
   cards want the full width, same as the prototype's `bare` mode.
   ════════════════════════════════════════════════════════════════════ */

const SHIPPY_VIEWS = ['details', 'broadcast', 'performance'];

const SM_CHECK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
  + ' stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5.5 5.5L20 6"/></svg>';

let shippyGroupState = {};   // groups the user has opened or closed by hand
let shippyOpen = true;       // false = collapsed to the fab

/* A link only when the target lives somewhere the user can't already see.
   If it's right in front of them it stays plain text — no useless links. */
function smGo(label, tabIdx, sel = '') {
  const here = state.activeView === 'details' && state.onboardingTab === tabIdx;
  return here ? label
    : `<a class="sm-go" data-go="${tabIdx}" data-focus="${sel}">${label}</a>`;
}

const smItem = (done, txt, key, extra) =>
  `<div class="sm-item ${done ? 'done' : 'todo'}${extra ? ' ' + extra : ''}" data-k="${key}">`
  + `<span class="sm-tick">${SM_CHECK}</span><span class="sm-txt">${txt}</span></div>`;

/* Group header. Everything folds; `defOpen` is how it arrives from the factory. */
function smGroup(key, label, ok, total, body, flag, defOpen) {
  const done = ok === total && total > 0;
  const open = key in shippyGroupState ? shippyGroupState[key] : !!defOpen;
  return `<div class="sm-sub${flag ? ' flag' : ''} foldable${open ? ' open' : ''}" data-group="${key}">
      <span>${label}</span>
      <span class="sm-count${done ? (flag ? ' warn' : ' ok') : ''}">${ok}/${total}${CHEV}</span>
    </div>${open ? body : ''}`;
}

/* ── What Shippy writes in each view ─────────────────── */

function shippyGameInfoNotes() {
  const A = OB_SECTION_ANSWERED;
  return `<p class="sm-intro">Tell Shipmate about your game and point it in the right `
    + `direction — these details flow everywhere, from your store listings to your `
    + `launch announcement.</p>`
    + smItem(!!state.formData.title?.trim(),
        state.formData.title?.trim() ? 'Title' : smGo('Add a title', 0, '#ob-title'), 'title')
    + smItem(!!state.formData.description?.trim(),
        state.formData.description?.trim() ? 'Description'
          : smGo('Write a description', 0, '#ob-desc'), 'desc')
    + smItem(A.platforms(),
        A.platforms() ? 'Platforms'
          : smGo('Select at least one platform', 0, '#ob-q-platforms'), 'plat');
}

function shippyDistNotes() {
  const A = OB_SECTION_ANSWERED;
  return smItem(A.distribution(),
        A.distribution() ? 'Market' : smGo('Market', 1, '#ob-q-distribution'), 'mk')
    + smItem(A.localization(),
        A.localization() ? 'Primary language' : smGo('Primary language', 1, '#ob-lang-list-wrap'), 'pl');
}

function shippyAssetsNotes() {
  const shots = state.uploads.screenshots.length;
  return smItem(shots > 0,
        shots ? `Screenshots <i>${shots}</i>` : smGo('Add screenshots', 2, '#ob-q-screenshots'), 'shots')
    + smItem(!!state.uploads.appIcon,
        state.uploads.appIcon ? 'App icon' : smGo('Upload an app icon', 2, '#ob-q-screenshots'), 'icon');
}

/* Broadcast and Performance have no checklist logic in this repo yet, so the
   panel carries the prose intro only. The shell is here so the copy can land
   without touching the layout again. */
function shippyNotes(viewId) {
  if (viewId === 'details') {
    const byTab = [shippyGameInfoNotes, shippyDistNotes, shippyAssetsNotes];
    return (byTab[state.onboardingTab] || byTab[0])();
  }
  if (viewId === 'broadcast') {
    return `<p class="sm-intro">Write the announcement once. Shipmate adapts the wording `
      + `for every channel you switch on, and flags anything a platform will reject.</p>`;
  }
  if (viewId === 'performance') {
    return `<p class="sm-intro">Numbers land here once your stores are connected. `
      + `Until then everything you see is sample data.</p>`;
  }
  return smItem(false, 'Nothing to check here', 'none');
}

/* ── Mount ───────────────────────────────────────────── */

function shippyPanelHTML(viewId) {
  return `<aside class="sm-wrap" data-anchor="${mascot.anchor}">
      <div class="sm-mascot"></div>
      <div class="sm-panel">${SM_HEAD}${shippyNotes(viewId)}</div>
    </aside>`;
}

/* Wraps a view's content into the two-column grid and hangs the panel off the
   right column. Works on views that rebuild their innerHTML wholesale
   (broadcast, performance) and on #details, whose structure is static — the
   .panelgrid guard makes the second case a no-op after the first pass.

   The tab hero and the slash row stay outside the grid, on the full 1200px
   measure; everything after them drops into the 789.333px content column. */
/* The panel grid for a view — the scope for every query below.
   Three views get wrapped, so .sm-panel, .sm-toggle, .sm-fab and .sm-mascot
   each exist up to three times. Nothing here may use getElementById: it would
   always return the copy inside whichever view sits first in the DOM, which is
   how the Performance panel ended up repainting the Details one. */
function shippyGrid(viewId) {
  const view = document.getElementById(viewId || state.activeView);
  return view ? view.querySelector(':scope > .panelgrid') : null;
}

function mountShippyPanel(viewId) {
  if (!SHIPPY_VIEWS.includes(viewId)) return;
  const view = document.getElementById(viewId);
  if (!view) return;
  if (view.querySelector(':scope > .panelgrid')) {
    // Already wrapped. Repaint the body, and re-mount the mascot: OCTO keeps a
    // single SVG node and mount() moves it, so whichever view mounted last
    // holds it and this one's mascot box is empty. That was the octopus
    // vanishing when you came back to a view.
    paintShippyPanel(viewId);
    remountMascot(viewId);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'panelgrid fixed';
  const main = document.createElement('div');
  main.className = 'pg-main';
  grid.appendChild(main);

  const stayOut = n => n.nodeType === 1 &&
    (n.id === 'details-hero' || n.classList.contains('tab-hero') || n.classList.contains('slashrow'));

  let anchor = null;
  for (const node of [...view.childNodes]) {
    if (stayOut(node)) { anchor = node; continue; }
    main.appendChild(node);
  }
  if (anchor) anchor.after(grid); else view.appendChild(grid);

  grid.insertAdjacentHTML('beforeend',
    shippyOpen ? shippyPanelHTML(viewId)
               : `<div class="fabslot">${shippyFabHTML()}</div>`);

  applyMascot();
  if (shippyOpen) OCTO.mount(grid.querySelector('.sm-mascot'));
  wireShippyPanel(viewId);
}

/* Bring the one octopus node back into this view's mascot box. */
function remountMascot(viewId) {
  if (!shippyOpen) return;
  const host = shippyGrid(viewId)?.querySelector('.sm-mascot');
  if (host) OCTO.mount(host);
}

function shippyFabHTML() {
  return `<div class="fabwrap"><div class="sm-bubbles"></div>`
    + `<button class="sm-fab" title="Expand the Shippy guide">`
    + `<span>Shippy guide</span><span class="sm-toggle">${CHEV}</span></button></div>`;
}

/* When the item list is unchanged, update in place instead of rebuilding: the
   nodes survive, so .sm-tick can animate its 0.24s width transition from the
   dot to the checkmark. Blowing away innerHTML would make the tick pop
   instead. Ported from the prototype's syncPanel(). */
function syncShippyPanel(el, html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const cur  = [...el.querySelectorAll('.sm-item')];
  const next = [...tmp.querySelectorAll('.sm-item')];
  const key  = list => list.map(n => n.dataset.k).join('|');
  if (!cur.length || key(cur) !== key(next)) { el.innerHTML = html; return; }

  // Items: class and text, onto the node that's already there.
  cur.forEach((n, i) => {
    n.className = next[i].className;
    n.querySelector('.sm-txt').innerHTML = next[i].querySelector('.sm-txt').innerHTML;
  });
  // Headers and counters carry the tallies, so they need refreshing too.
  ['.sm-score', '.sm-step', '.sm-sub'].forEach(sel => {
    const a = [...el.querySelectorAll(sel)], b = [...tmp.querySelectorAll(sel)];
    if (a.length !== b.length) return;
    a.forEach((n, i) => { n.className = b[i].className; n.innerHTML = b[i].innerHTML; });
  });
}

/* Repaint the panel body without rebuilding the grid, so the mascot keeps
   animating and the checkmarks keep their transition. */
function paintShippyPanel(viewId) {
  const view = viewId || state.activeView;
  const el = shippyGrid(view)?.querySelector('.sm-panel');
  if (!el) return;
  syncShippyPanel(el, SM_HEAD + shippyNotes(view));
  wireShippyPanel(view);
}

function wireShippyPanel(viewId) {
  const grid = shippyGrid(viewId);
  if (!grid) return;
  grid.querySelectorAll('.sm-sub.foldable').forEach(el => el.onclick = e => {
    e.stopPropagation();
    shippyGroupState[el.dataset.group] = !el.classList.contains('open');
    paintShippyPanel(viewId);
  });
  grid.querySelectorAll('.sm-go').forEach(el => el.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    const tab = +el.dataset.go, sel = el.dataset.focus;
    if (state.activeView !== 'details') setView('details');
    setOnboardingTab(tab);
    requestAnimationFrame(() => {
      const target = sel && document.querySelector(sel);
      if (!target) return;
      target.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      if (target.matches('input,textarea,select')) target.focus();
    });
  });
  const collapse = grid.querySelector('.sm-panel .sm-toggle');
  if (collapse) collapse.onclick = () => { shippyOpen = false; reflowShippyPanel(); };
  const fab = grid.querySelector('.sm-fab');
  if (fab) fab.onclick = () => { shippyOpen = true; reflowShippyPanel(); };
}

/* Swap the panel for the fab, or back, without re-rendering the whole view. */
function reflowShippyPanel() {
  const grid = shippyGrid();
  if (!grid) return;
  grid.querySelector('.sm-wrap, .fabslot')?.remove();
  grid.insertAdjacentHTML('beforeend',
    shippyOpen ? shippyPanelHTML(state.activeView)
               : `<div class="fabslot">${shippyFabHTML()}</div>`);
  applyMascot();
  if (shippyOpen) OCTO.mount(grid.querySelector('.sm-mascot'));
  wireShippyPanel(state.activeView);
}


/* ── Dashboard Timeline ──────────────────────────────── */

function buildDashboardTimeline() {
  const fd = state.formData;
  const rt = fd.releaseTiming || 'manual';

  // Short display names for the compact timeline label column
  const DASH_TL_LABEL = {
    ios: 'Apple', android: 'Google', steam: 'Steam',
    egs: 'Epic', xbox: 'Xbox', nintendo: 'Nintendo', psn: 'PSN',
  };

  // Active platforms with timing data, sorted shortest → longest review time
  const reviewData = [...state.activePlatforms]
    .filter(p => OB_PLATFORM_TIMING[p])
    .map(p => ({ id: p, ...OB_PLATFORM_TIMING[p], shortLabel: DASH_TL_LABEL[p] || OB_PLATFORM_TIMING[p].label }))
    .sort((a, b) => a.days - b.days);

  /* ── Mode chips + optional date input ── */
  const modes = [
    { v: 'manual',        label: t('tl.manual')        },
    { v: 'as_approved',   label: t('tl.when_approved') },
    { v: 'specific_date', label: t('tl.on_a_date')     },
  ];
  const modeChips = modes.map(m =>
    `<button class="dash-tl-chip${rt === m.v ? ' is-on' : ''}" onclick="dashPickTiming('${m.v}')">${m.label}</button>`
  ).join('');

  const dateVal   = fd.releaseDate || '';
  const dateInput = rt === 'specific_date'
    ? `<input class="form-input dash-tl-date-input" type="date" value="${escHtml(dateVal)}" onblur="dashSetDate(this.value)">`
    : '';

  /* ── Days-to-launch counter ── */
  let counterHtml = '';
  if (rt === 'specific_date' && dateVal) {
    const live  = new Date(dateVal + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days  = Math.round((live - today) / 86400000);
    if (days >= 0) {
      counterHtml = `
        <div class="dash-tl-counter">
          <span class="dash-tl-days-num">${days}</span>
          <span class="dash-tl-days-lbl">${t('tl.days')}</span>
        </div>`;
    }
  }

  /* ── Right panel: platform track rows ── */
  let rightHtml = '';

  if (rt === 'specific_date' && dateVal && reviewData.length) {
    const liveDate = new Date(dateVal + 'T00:00:00');
    if (!isNaN(liveDate)) {
      const maxLead  = Math.max(...reviewData.map(r => r.days * 2));
      const spanDays = maxLead + 1;

      // Column headers anchored at the FIRST (shortest) platform's dot positions
      const first    = reviewData[0];
      const hdrRec   = ((spanDays - first.days * 2) / spanDays * 100).toFixed(1);
      const hdrSub   = ((spanDays - first.days)     / spanDays * 100).toFixed(1);

      const colHeaders = `
        <div class="dash-tl-col-hdrs">
          <div class="dash-tl-plat-spacer"></div>
          <div class="dash-tl-track-hdrs">
            <span class="dash-tl-col-hdr" style="left:${hdrRec}%">${t('tl.rec')}</span>
            <span class="dash-tl-col-hdr" style="left:${hdrSub}%">${t('tl.submit_by')}</span>
            <span class="dash-tl-col-hdr dash-tl-col-hdr--live" style="left:100%">${t('tl.live')}</span>
          </div>
        </div>`;

      const rows = reviewData.map(r => {
        const recDate = _addDays(liveDate, -(r.days * 2));
        const subDate = _addDays(liveDate, -r.days);
        const recPct  = ((spanDays - r.days * 2) / spanDays * 100).toFixed(1);
        const subPct  = ((spanDays - r.days)     / spanDays * 100).toFixed(1);
        const dashW   = (subPct - recPct).toFixed(1);
        const solidW  = (100 - subPct).toFixed(1);
        return `
          <div class="dash-tl-row">
            <div class="dash-tl-plat-name">${platformIcon(r.id, 18, 'white')}</div>
            <div class="dash-tl-track">
              <div class="dash-tl-faint-line" style="width:${recPct}%"></div>
              <div class="dash-tl-dash-line"  style="left:${recPct}%;width:${dashW}%"></div>
              <div class="dash-tl-solid-line" style="left:${subPct}%;width:${solidW}%;background:${r.color}"></div>
              <div class="dash-tl-dot dash-tl-dot--rec"  style="left:${recPct}%"></div>
              <div class="dash-tl-dot dash-tl-dot--sub"  style="left:${subPct}%;border:2px solid ${r.color}"></div>
              <div class="dash-tl-dot dash-tl-dot--live" style="left:100%;background:${r.color};border-color:${r.color}"></div>
              <div class="dash-tl-date-lbl" style="left:${recPct}%">${fmtDateShort(recDate)}</div>
              <div class="dash-tl-date-lbl" style="left:${subPct}%">${fmtDateShort(subDate)}</div>
            </div>
          </div>`;
      }).join('');

      rightHtml = `<div class="dash-tl-right">${colHeaders}${rows}</div>`;
    }
  } else if (rt === 'as_approved' && reviewData.length) {
    const today   = new Date(); today.setHours(0, 0, 0, 0);
    const maxDays = Math.max(...reviewData.map(r => r.days));

    const colHeaders = `
      <div class="dash-tl-col-hdrs">
        <div class="dash-tl-plat-spacer"></div>
        <div class="dash-tl-track-hdrs">
          <span class="dash-tl-col-hdr" style="left:0%">TODAY</span>
          <span class="dash-tl-col-hdr dash-tl-col-hdr--live" style="left:100%">LIVE</span>
        </div>
      </div>`;

    const rows = reviewData.map(r => {
      const pct        = (r.days / maxDays * 100).toFixed(1);
      const liveDateSt = fmtDateShort(_addDays(today, r.days));
      return `
        <div class="dash-tl-row">
          <div class="dash-tl-plat-name" style="color:${r.color}">${escHtml(r.shortLabel)}</div>
          <div class="dash-tl-track">
            <div class="dash-tl-faint-line" style="width:100%"></div>
            <div class="dash-tl-solid-line" style="width:${pct}%;background:${r.color}"></div>
            <div class="dash-tl-dot dash-tl-dot--rec"  style="left:0%"></div>
            <div class="dash-tl-dot dash-tl-dot--live" style="left:${pct}%;background:${r.color};border-color:${r.color}"></div>
            <div class="dash-tl-date-lbl" style="left:${pct}%">${liveDateSt}</div>
          </div>
        </div>`;
    }).join('');

    rightHtml = `<div class="dash-tl-right">${colHeaders}${rows}</div>`;
  }

  return `
    <div class="dash-timeline" id="dash-timeline">
      <div class="dash-tl-bar">
        <div class="dash-tl-left">
          <span class="dash-tl-launch-lbl">LAUNCH</span>
          <div class="dash-tl-chips">${modeChips}${dateInput}</div>
        </div>
        ${counterHtml}
        ${rightHtml}
      </div>
    </div>`;
}

/* ── Dashboard ───────────────────────────────────────── */

function buildConsolidatedBanner() {
  const hasActive = state.activePlatforms.size > 0;
  const { total, answered } = cqProgress();
  const pct  = total ? Math.round(answered / total * 100) : 0;
  const done = answered === total && total > 0;
  const loading = state.cqInferenceStatus === 'loading';
  const checkSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;

  if (!hasActive) {
    return `
      <div class="cq-banner cq-banner-empty">
        <div class="cq-banner-icon">${checkSvg}</div>
        <div class="cq-banner-content">
          <div class="cq-banner-title">Consolidated Questionnaire</div>
          <div class="cq-banner-sub">Please select platforms to continue.</div>
        </div>
      </div>`;
  }

  if (loading) {
    return `
      <div class="cq-banner cq-banner-loading">
        <div class="cq-banner-icon"><span class="cq-spinner"></span></div>
        <div class="cq-banner-content">
          <div class="cq-banner-title">Consolidated Questionnaire</div>
          <div class="cq-banner-sub">AI is reviewing your game data…</div>
        </div>
        <div class="cq-banner-right">
          <div class="cq-banner-pct" style="color:var(--text-dim)">—</div>
        </div>
      </div>`;
  }

  const aiCount = Object.values(state.cqAnswerMeta).filter(m => !m.humanConfirmed).length;
  const subLabel = done
    ? 'All questions answered ✓'
    : answered > 0
      ? `${answered} of ${total} answered${aiCount > 0 ? ` · ${aiCount} AI-suggested` : ''}`
      : `${total} questions · click to begin`;

  return `
    <div class="cq-banner ${done ? 'cq-banner-done' : ''}" onclick="openCQModal()">
      <div class="cq-banner-icon">${checkSvg}</div>
      <div class="cq-banner-content">
        <div class="cq-banner-title">Consolidated Questionnaire</div>
        <div class="cq-banner-sub">${subLabel}</div>
      </div>
      <div class="cq-banner-right">
        <div class="cq-banner-pct">${pct}%</div>
        <div class="cq-banner-bar"><div class="cq-banner-bar-fill" style="width:${pct}%"></div></div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4;flex-shrink:0;" class="cq-banner-chevron"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>`;
}

// Canonical display order for platform cards (active and inactive sections)
const PLATFORM_ORDER = ['steam', 'ios', 'android', 'web', 'egs', 'psn', 'xbox', 'nintendo'];

// Fake binary findings — platform-specific, each with a "View Fix" payload
const BIN_FINDINGS = {
  ios: [
    {
      title: 'Privacy manifest missing entries',
      body:  'PrivacyInfo.xcprivacy lacks required NSPrivacyAccessedAPITypes entries for UserDefaults (CA92.1) and FileTimestamp (3C8A.1) access. Builds without complete privacy manifests are rejected by App Store Connect.',
      fixLabel: 'Add to PrivacyInfo.xcprivacy',
      fix: `<key>NSPrivacyAccessedAPITypes</key>\n<array>\n  <dict>\n    <key>NSPrivacyAccessedAPIType</key>\n    <string>NSPrivacyAccessedAPICategoryUserDefaults</string>\n    <key>NSPrivacyAccessedAPITypeReasons</key>\n    <array><string>CA92.1</string></array>\n  </dict>\n  <dict>\n    <key>NSPrivacyAccessedAPIType</key>\n    <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>\n    <key>NSPrivacyAccessedAPITypeReasons</key>\n    <array><string>3C8A.1</string></array>\n  </dict>\n</array>`,
      fixIsCode: true,
    },
    {
      title: 'Deprecated UIWebView usage detected',
      body:  '2 references to UIWebView found in an embedded analytics SDK. UIWebView was removed in iOS 15. Replace with WKWebView or update the offending SDK.',
      fixLabel: 'What to update',
      fix:  'UIWebView references are coming from a third-party SDK — not your own code. Check which SDK version you\'re using against these known culprits:\n\n• Unity Analytics ≤ 3.x  →  update to Unity Analytics 4.x\n• Facebook SDK ≤ 6.x  →  update to Facebook SDK 14+\n• Firebase Analytics ≤ 6.x  →  update to Firebase 9+\n\nRun a new build after updating and re-upload to confirm the reference is gone.',
      fixIsCode: false,
    },
    {
      title: 'IDFA accessed without ATT prompt',
      body:  'AdSupport.framework is linked but no ATTrackingManager.requestTrackingAuthorization() call was found. Accessing the IDFA without user permission results in App Store rejection.',
      fixLabel: 'Two-step fix',
      fix: `Step 1 — Add to Info.plist:\n<key>NSUserTrackingUsageDescription</key>\n<string>This identifier helps us show you relevant ads and improve your experience.</string>\n\nStep 2 — Call before any IDFA access:\nATTrackingManager.requestTrackingAuthorization { status in\n    // proceed with or without IDFA based on status\n}`,
      fixIsCode: true,
    },
  ],
  android: [
    {
      title: 'Target SDK below minimum (API 34)',
      body:  'targetSdkVersion is set to 31. Google Play now requires API 34+ for all new submissions and updates.',
      fixLabel: 'Update build.gradle',
      fix: `// app/build.gradle\nandroid {\n    compileSdk 34\n    defaultConfig {\n        targetSdk 34\n        // Test on API 34 emulator before submitting —\n        // foreground service types must now be declared explicitly.\n    }\n}`,
      fixIsCode: true,
    },
    {
      title: 'Cleartext HTTP traffic enabled',
      body:  'android:usesCleartextTraffic="true" in AndroidManifest.xml. This permits unencrypted HTTP traffic and may trigger Google Play policy warnings.',
      fixLabel: 'Update AndroidManifest.xml',
      fix: `<!-- Remove or set to false on the <application> tag -->\n<application\n    android:usesCleartextTraffic="false"\n    ... >\n\n<!-- If specific internal domains need HTTP, use a network security config\n     and reference it with android:networkSecurityConfig="@xml/network_security_config" -->`,
      fixIsCode: true,
    },
    {
      title: 'Legacy storage permission not migrated',
      body:  'READ_EXTERNAL_STORAGE is declared without the Android 13+ replacements. On API 33+ devices this permission is silently ignored.',
      fixLabel: 'Update AndroidManifest.xml',
      fix: `<!-- Replace READ_EXTERNAL_STORAGE with granular permissions -->\n<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />\n<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />\n<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />\n\n<!-- Keep legacy permission for devices running Android 12L or lower -->\n<uses-permission\n    android:name="android.permission.READ_EXTERNAL_STORAGE"\n    android:maxSdkVersion="32" />`,
      fixIsCode: true,
    },
  ],
  steam: [
    {
      title: 'Steamworks SDK out of date (1.55 → 1.61)',
      body:  'Your build links Steamworks SDK 1.55. The current release is 1.61, which includes critical fixes for overlay injection on Windows 11 24H2 and macOS 14.',
      fixLabel: 'How to update',
      fix:  '1. Download Steamworks SDK 1.61 from the Steamworks Partner Portal (partner.steamgames.com → SDK Downloads).\n\n2. Replace the sdk/ folder in your project with the new version.\n\n3. Rebuild and run your game locally with Steam running to verify the overlay still works.\n\n4. Re-upload the new build to Shipmate.',
      fixIsCode: false,
    },
    {
      title: 'No Steam Achievements registered',
      body:  'The Steamworks Stats API is initialized but SetAchievement() is never called. Players expect achievement support, and Steam Discovery factors this into game visibility.',
      fixLabel: 'Implementation steps',
      fix:  '1. Define achievements in Steamworks Partner Portal → App Admin → Stats & Achievements. Publish the changes.\n\n2. After a player earns an achievement, call:\n   SteamUserStats()->SetAchievement("ACH_YOUR_NAME");\n   SteamUserStats()->StoreStats();\n\n3. On game launch, call SteamUserStats()->RequestCurrentStats() to sync the player\'s existing progress before any SetAchievement calls.',
      fixIsCode: false,
    },
    {
      title: 'Steam Cloud save not integrated',
      body:  'ISteamRemoteStorage API is absent from the binary. Cloud saves improve cross-device play and are a key factor in Steam player retention.',
      fixLabel: 'Implementation overview',
      fix:  'Writing a save file to Steam Cloud:\n   SteamRemoteStorage()->FileWrite("save.dat", buffer, bufferSize);\n\nReading it back:\n   int32 fileSize = SteamRemoteStorage()->GetFileSize("save.dat");\n   SteamRemoteStorage()->FileRead("save.dat", buffer, fileSize);\n\nSteam handles sync automatically. The Steamworks SDK ships a CloudEnabled sample app — use it as a reference for the full init/quota-check flow.',
      fixIsCode: false,
    },
  ],
};

/* ── Make Waves: unified launch announcement ─────────────
   Write once; Shipmate reshapes it per channel. Storefront channels are auto-
   synced from the game's distribution plan; social/community/press/video are
   opt-in toggle chips (common ones up front, the rest behind "+ more").
   Credentials are deferred — each active channel has a cog to connect later. */

// Distribution platform id → its storefront channel id.
const BC_STORE_FROM_PLATFORM = {
  ios: 'appstore', android: 'googleplay', steam: 'steam', egs: 'epic',
  xbox: 'msstore', nintendo: 'nintendo', psn: 'psn',
};

const BC_GROUPS = [
  { id: 'storefront', label: 'Storefronts', auto: true,
    hint: 'Synced from your distribution plan — “What’s New” / patch notes on the stores you ship to', dests: [
    { id: 'steam',      name: 'Steam',            sub: 'Announcement + patch notes', mono: 'S',  color: '#1b2838', kind: 'patch' },
    { id: 'appstore',   name: 'App Store',        sub: '“What’s New”',   mono: '',  color: '#0a84ff', kind: 'whatsnew' },
    { id: 'googleplay', name: 'Google Play',      sub: '“What’s new”',   mono: '▶', color: '#34a853', kind: 'whatsnew' },
    { id: 'epic',       name: 'Epic Games Store', sub: 'Store news',     mono: 'E', color: '#2a2a2a', kind: 'whatsnew' },
    { id: 'msstore',    name: 'Microsoft Store',  sub: 'Release notes',  mono: '⊞', color: '#0067b8', kind: 'whatsnew' },
    { id: 'nintendo',   name: 'Nintendo eShop',   sub: 'Update info',    mono: 'N', color: '#e60012', kind: 'whatsnew' },
    { id: 'psn',        name: 'PlayStation Store', sub: 'Patch notes',   mono: 'P', color: '#003791', kind: 'patch' },
  ] },
  { id: 'social', label: 'Social', hint: 'Where players follow along', dests: [
    { id: 'x',        name: 'X / Twitter',  sub: 'Post + media',   mono: '𝕏', color: '#000000', kind: 'social', limit: 280, common: true },
    { id: 'bluesky',  name: 'Bluesky',      sub: 'Post + media',   mono: 'b', color: '#1185fe', kind: 'social', limit: 300, common: true },
    { id: 'instagram',name: 'Instagram',    sub: 'Image / Reel',   mono: '◎', color: '#e1306c', kind: 'caption', common: true },
    { id: 'tiktok',   name: 'TikTok',       sub: 'Short video',    mono: '♪', color: '#010101', kind: 'caption', common: true },
    { id: 'mastodon', name: 'Mastodon',     sub: 'Toot + media',   mono: 'm', color: '#6364ff', kind: 'social', limit: 500 },
    { id: 'threads',  name: 'Threads',      sub: 'Post + media',   mono: '@', color: '#000000', kind: 'social', limit: 500 },
    { id: 'ytcomm',   name: 'YouTube',      sub: 'Community post', mono: '▶', color: '#ff0000', kind: 'social' },
    { id: 'facebook', name: 'Facebook Page', sub: 'Post + media',  mono: 'f', color: '#1877f2', kind: 'social' },
    { id: 'linkedin', name: 'LinkedIn',     sub: 'Studio update',  mono: 'in',color: '#0a66c2', kind: 'social' },
  ] },
  { id: 'community', label: 'Communities & forums', hint: 'Where your most engaged players gather', dests: [
    { id: 'discord',  name: 'Discord',        sub: 'Announcements channel',     mono: '◈', color: '#5865f2', kind: 'markdown', common: true },
    { id: 'reddit',   name: 'Reddit',         sub: 'Your subs + r/IndieGaming', mono: 'r', color: '#ff4500', kind: 'title',    common: true },
    { id: 'steamhub', name: 'Steam Community', sub: 'Hub discussion',           mono: 'S', color: '#1b2838', kind: 'patch' },
    { id: 'tigsource',name: 'TIGSource',      sub: 'Devlog thread',             mono: 'T', color: '#444444', kind: 'devlog' },
  ] },
  { id: 'press', label: 'Discovery & press', hint: 'How new players and journalists find you', dests: [
    { id: 'email',      name: 'Email newsletter', sub: 'Your list (Mailchimp/Substack)', mono: '✉', color: '#ea580c', kind: 'email', common: true },
    { id: 'producthunt',name: 'Product Hunt',    sub: 'Launch post', mono: 'P', color: '#da552f', kind: 'title', common: true },
    { id: 'hackernews', name: 'Hacker News',     sub: 'Show HN',     mono: 'Y', color: '#ff6600', kind: 'title' },
    { id: 'indiedb',    name: 'IndieDB',         sub: 'News article', mono: 'i',color: '#d35400', kind: 'whatsnew' },
    { id: 'gamejolt',   name: 'GameJolt',        sub: 'Post',        mono: 'gj',color: '#cf4b4b', kind: 'markdown' },
    { id: 'presskit',   name: 'Press release',   sub: 'presskit() + media list', mono: '¶', color: '#475569', kind: 'email' },
  ] },
  { id: 'video', label: 'Video & streaming', hint: 'Trailers, devlogs, and go-live moments', dests: [
    { id: 'youtube', name: 'YouTube', sub: 'Trailer / devlog', mono: '▶', color: '#ff0000', kind: 'whatsnew', common: true },
    { id: 'twitch',  name: 'Twitch',  sub: 'Go-live announce', mono: 't', color: '#9146ff', kind: 'social', common: true },
  ] },
];

const BC_KIND_LABEL = { social: 'Social post', whatsnew: 'Store “What’s New”', patch: 'Patch notes',
  devlog: 'Devlog post', markdown: 'Markdown post', title: 'Title + body', email: 'Email', caption: 'Caption + tags', plain: 'Plain text' };
const BC_GEAR = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

function bcAllDests() { return BC_GROUPS.flatMap(g => g.dests); }
function bcDest(id)   { return bcAllDests().find(d => d.id === id); }
function bcIcon(d)    { return `<span class="bc-ico" style="--c:${d.color}">${d.mono || d.name[0]}</span>`; }
function bcMessage()  { return state.broadcast.message || ''; }

// Storefront channels auto-derived from the distribution plan (activePlatforms).
function bcAutoStores() {
  return [...state.activePlatforms].map(p => BC_STORE_FROM_PLATFORM[p]).filter(Boolean);
}
function bcIsActive(id) {
  if (bcAutoStores().includes(id)) return !state.broadcast.storeOff.includes(id); // auto-on unless powered off
  return state.broadcast.active.includes(id);
}
// Ordered list of currently-active channels (stores first, then opted-in).
function bcActiveChannels() {
  const stores = bcAutoStores().filter(id => !state.broadcast.storeOff.includes(id));
  const optIn  = state.broadcast.active.filter(id => bcDest(id) && !bcAutoStores().includes(id));
  return [...new Set([...stores, ...optIn])];
}

function bcAdaptedText(destId) {
  const msg = bcMessage().trim();
  const title = (state.formData.title || 'Your Game');
  const proj = state.projects.find(p => p.id === state.activeProjectId);
  const ver  = proj?.versions.find(v => v.id === state.activeVersionId)?.versionNumber || '1.0';
  const kind = (bcDest(destId) || {}).kind || 'plain';
  const body = msg || `${title} v${ver} is out now! [write your announcement on the left — Shipmate adapts it for each channel]`;
  const tag  = (title || '').replace(/[^a-z0-9]/gi, '');
  switch (kind) {
    case 'patch':    return `[h1]${title} — v${ver}[/h1]\n${body}`;
    case 'whatsnew': return `What’s new in v${ver}\n${body}`;
    case 'devlog':   return `# ${title} v${ver}\n${body}`;
    case 'markdown': return `**${title} v${ver} is live!** 🎉\n${body}`;
    case 'title':    return `${title} v${ver} is out now\n\n${body}`;
    case 'email':    return `Subject: ${title} v${ver} is here\n\n${body}`;
    case 'caption':  return `${body}\n\n#indiegame #gamedev${tag ? ' #' + tag : ''}`;
    default:         return body;
  }
}

function buildBroadcastAdapt() {
  const channels = bcActiveChannels();
  if (!channels.length) {
    return `<div class="bc-adapt bc-adapt--empty">
      <div class="bc-adapt-head"><span class="bc-adapt-title">✨ Adapted automatically</span>
        <span class="bc-adapt-sub">Turn on channels below and Shipmate reshapes your message for each one.</span></div>
    </div>`;
  }
  let active = state.broadcast.previewDest;
  if (!channels.includes(active)) active = channels[0];
  const tabs = channels.map(id => {
    const d = bcDest(id); if (!d) return '';
    return `<button class="bc-adapt-tab${id === active ? ' is-on' : ''}" onclick="bcPreview('${id}')">${bcIcon(d)}<span>${d.name}</span></button>`;
  }).join('');
  const d = bcDest(active) || {};
  const text = bcAdaptedText(active);
  let meter = '';
  if (d.limit) {
    const used = (bcMessage().trim().length || text.length);
    const over = used > d.limit;
    meter = `<div class="bc-adapt-meter${over ? ' is-over' : ''}">${used} / ${d.limit}</div>`;
  }
  return `
    <div class="bc-adapt">
      <div class="bc-adapt-head">
        <span class="bc-adapt-title">✨ Adapted automatically</span>
        <span class="bc-adapt-sub">One message, reshaped for each active channel</span>
      </div>
      <div class="bc-adapt-tabs">${tabs}</div>
      <div class="bc-adapt-frame">
        <div class="bc-adapt-fmt">${d.name || ''} · ${BC_KIND_LABEL[d.kind] || 'Plain text'}${meter}</div>
        <pre class="bc-adapt-body">${escHtml(text)}</pre>
      </div>
    </div>`;
}

// A channel chip: click toggles active; when active, a cog connects it (later).
function buildChannelChip(d) {
  const active = bcIsActive(d.id);
  return `
    <div class="bc-chip${active ? ' is-active' : ''}" role="button" tabindex="0"
         aria-pressed="${active}" title="${d.sub}" onclick="bcToggleChannel('${d.id}')">
      ${bcIcon(d)}
      <span class="bc-chip-name">${d.name}</span>
      ${active
        ? `<span class="bc-chip-cog" role="button" tabindex="0" title="Connect ${d.name}"
             onclick="event.stopPropagation();bcConnect('${d.id}')">${BC_GEAR}</span>`
        : `<span class="bc-chip-add" aria-hidden="true">+</span>`}
    </div>`;
}

function buildChannelSection(g) {
  if (g.auto) {
    const stores = bcAutoStores();
    const body = stores.length
      ? `<div class="bc-chip-row">${stores.map(id => buildChannelChip(bcDest(id))).filter(Boolean).join('')}</div>`
      : `<div class="bc-empty-note">No stores yet — add distribution platforms on the Dashboard and they’ll sync here automatically.</div>`;
    return `<section class="bc-section">
      <div class="bc-section-head"><h3>${g.label} <span class="bc-auto-tag">Auto-synced</span></h3><p>${g.hint}</p></div>
      ${body}
    </section>`;
  }
  const common = g.dests.filter(d => d.common);
  const rest   = g.dests.filter(d => !d.common);
  const expanded = !!state.broadcast.expandedGroups[g.id];
  const moreHtml = rest.length ? `
    <div class="bc-chip-row bc-chip-rest${expanded ? ' is-open' : ''}">${rest.map(buildChannelChip).join('')}</div>
    <button class="bc-more" onclick="bcToggleGroup('${g.id}')">${expanded ? '− Fewer' : `+ ${rest.length} more`}</button>` : '';
  return `<section class="bc-section">
    <div class="bc-section-head"><h3>${g.label}</h3><p>${g.hint}</p></div>
    <div class="bc-chip-row">${common.map(buildChannelChip).join('')}</div>
    ${moreHtml}
  </section>`;
}

/* Shared tab header box — one per top-level tab, tinted to the tab's accent. */
const TAB_HERO = {
  details: { accent: '#60a5fa', soft: 'rgba(96,165,250,.16)',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    title: 'Add your game details once',
    sub: 'Tell Shipmate about your game and point it in the right direction — these details flow everywhere, from your store listings to your launch announcement.' },
  dashboard: { accent: '#4ade80', soft: 'rgba(74,222,128,.15)',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>`,
    title: 'Submit to every platform, the right way',
    sub: 'Shipmate preps your content ratings, data disclosures, and store pages, then walks each store’s submission for you — Apple, Google, Steam, and the consoles.' },
  broadcast: { accent: '#FF3B76', soft: 'rgba(255,59,118,.16)',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M16 8a4 4 0 0 1 0 8"/><path d="M19 5a8 8 0 0 1 0 14"/></svg>`,
    title: 'Announce your game everywhere at once',
    sub: 'Write your update once. Shipmate reshapes it for each channel and posts to all of them together, so players find you wherever they look for indie games.' },
  performance: { accent: '#fb923c', soft: 'rgba(251,146,60,.16)',
    icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l3-4 4 3 5-7"/></svg>`,
    title: 'See how your game is performing',
    sub: 'Wishlists, impressions, reviews, and revenue across every platform in one live view — no logging into each portal. Shipmate flags where numbers are still estimates.' },
};
function buildTabHero(view) {
  const c = TAB_HERO[view];
  if (!c) return '';
  return `<div class="tab-hero" style="--accent:${c.accent};--accent-soft:${c.soft}">
    <div class="tab-hero-icon">${c.icon}</div>
    <div class="tab-hero-text">
      <div class="tab-hero-title">${c.title}</div>
      <div class="tab-hero-sub">${c.sub}</div>
    </div>
  </div>`;
}

/* "Add Game Details" tab — onboarding inlined as three always-visible boxes:
   About (left), Distribution (right), Assets (bottom). No sub-tabs.
   The #ob-modal wrapper is preserved so validation highlighting (.is-validating)
   still cascades to every .ob-q inside. */
function buildGdBox(idx, mod, inner) {
  const def = OB_TAB_DEFS[idx];
  const label = (typeof t === 'function' && t(def.labelKey)) || def.labelKey;
  return `
    <section class="gd-box gd-box--${mod}">
      <div class="gd-box-head">${def.icon()}<h3>${label}</h3></div>
      <div class="gd-box-body">${inner}</div>
    </section>`;
}

function renderDetails() {
  const hero = document.getElementById('details-hero');
  if (hero) hero.innerHTML = buildTabHero('details');
  renderProjectBar();
  renderOnboarding();   // fills #ob-tabs / #ob-body / #ob-footer, now living inside #details
  // Wrap into the panel grid and hang the guide off it. Called here rather
  // than only from setView(), because these renders rebuild innerHTML and are
  // also reached directly from handlers that bypass setView().
  mountShippyPanel('details');
}

function renderBroadcast() {
  const el = document.getElementById('broadcast');
  if (!el) return;
  renderProjectBar();

  const channels = bcActiveChannels();
  const n = channels.length;
  const title = state.formData.title || 'your game';

  el.innerHTML = `
    ${buildTabHero('broadcast')}

    <div class="bc-main">
      <section class="bc-compose">
        <div class="bc-compose-head">
          <label for="bc-msg">Your announcement</label>
          <button class="bc-ai-btn" onclick="bcDraftWithAI()">✨ Draft with AI</button>
        </div>
        <textarea id="bc-msg" class="bc-textarea" rows="7"
          placeholder="What's new? Share the headline of your launch or update — Shipmate handles the rest."
          oninput="bcSetMessage(this.value)">${escHtml(bcMessage())}</textarea>
        ${buildBroadcastAdapt()}
      </section>

      <div class="bc-channels">
        ${BC_GROUPS.map(buildChannelSection).join('')}
      </div>
    </div>

    <div class="bc-actionbar">
      <div class="bc-actionbar-info">${n ? `Posting to <strong>${n}</strong> channel${n === 1 ? '' : 's'}` : 'Turn on channels to post'}</div>
      <div class="bc-actionbar-btns">
        <button class="btn btn-ghost" onclick="bcSchedule()">Schedule…</button>
        <button class="btn btn-primary" ${n ? '' : 'disabled'} onclick="bcBroadcastNow()">Post to all</button>
      </div>
    </div>`;
  // Wrap into the panel grid and hang the guide off it. Called here rather
  // than only from setView(), because these renders rebuild innerHTML and are
  // also reached directly from handlers that bypass setView().
  mountShippyPanel('broadcast');
}

/* ── Performance: live-game analytics (mock data) ─────────
   Concise, scannable KPIs + a cross-platform revenue aggregator that flags
   platform reporting delays, with "open the portal" links for power users. */
const PERF_PERIODS = [ { id: '7d', label: '7 days' }, { id: '30d', label: '30 days' }, { id: 'all', label: 'All time' } ];
const PERF_FACTOR  = { '7d': 0.26, '30d': 1, 'all': 7.4 };   // scales FLOW metrics; rates/stocks stay

const PERF = {
  revenueNet: 48250, units: 3120, impressions: 512000, wishlistAdds: 2150,
  delta: { revenue: 18, units: 12, impressions: 9, wishlistAdds: 24, wishlistsTotal: 8, rating: 2, mau: 6, refund: -0.4 },
  wishlistsTotal: 27400, wishlistConv: 6.8, refundRate: 4.2,
  rating: 4.6, ratingCount: 1462, steamPositive: 92,
  mau: 14200, dau: 3400, retD1: 42, retD7: 19, retD30: 8, sessionMin: 27,
  revByPlatform: {
    steam:    { name: 'Steam',            portal: 'Steamworks',              gross: 34900, cutPct: 30, units: 1780, status: 'estimated', delay: 'Net finalizes ~30 days after month-end; payout at net-45.' },
    ios:      { name: 'App Store',        portal: 'App Store Connect',       gross: 12400, cutPct: 15, units: 640,  status: 'estimated', delay: 'Sales finalize ~35 days after the fiscal month closes.' },
    android:  { name: 'Google Play',      portal: 'Play Console',            gross: 9800,  cutPct: 15, units: 520,  status: 'estimated', delay: 'Daily estimates; figures finalize monthly.' },
    egs:      { name: 'Epic Games Store', portal: 'Epic Dev Portal',         gross: 6200,  cutPct: 12, units: 210,  status: 'finalized', delay: 'Reported monthly; last month finalized.' },
    psn:      { name: 'PlayStation',      portal: 'PartnerNet',              gross: 4100,  cutPct: 30, units: 120,  status: 'delayed',   delay: 'Reported monthly, ~30-day lag.' },
    xbox:     { name: 'Xbox',             portal: 'Partner Center',          gross: 2900,  cutPct: 30, units: 95,   status: 'delayed',   delay: 'Reported monthly.' },
    nintendo: { name: 'Nintendo eShop',   portal: 'Nintendo Dev Portal',     gross: 3500,  cutPct: 30, units: 140,  status: 'delayed',   delay: 'Reported monthly, ~30-day lag.' },
  },
  reviews: [
    { plat: 'Steam',       score: '92%',  unit: 'positive', count: 812, sub: 'Very Positive' },
    { plat: 'App Store',   score: '4.6',  unit: '★',        count: 240, sub: 'iPhone + iPad' },
    { plat: 'Google Play', score: '4.4',  unit: '★',        count: 410, sub: 'All devices' },
  ],
  recentReview: { text: 'Exactly the cozy loop I wanted — the 2.0 update fixed the late-game grind.', meta: 'Steam · ★★★★★ · 2 days ago' },
  regions: [ ['United States', 34], ['Germany', 12], ['United Kingdom', 9], ['China', 8], ['Brazil', 6] ],
  insights: [
    { tone: 'up',   text: 'Steam wishlists up 24% since the 2.0 update' },
    { tone: 'star', text: 'App Store featured in “New Games We Love” (estimated)' },
    { tone: 'warn', text: 'Refund rate ticked up to 4.2% — worth a look' },
  ],
};

const _pNum   = n => Math.round(n).toLocaleString('en-US');
const _pMoney = n => '$' + Math.round(n).toLocaleString('en-US');
const _pK     = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(Math.round(n));
const _pNet   = p => p.gross * (1 - p.cutPct / 100);
const _pDelta = v => `<span class="perf-delta ${v >= 0 ? 'is-up' : 'is-down'}">${v >= 0 ? '▲' : '▼'} ${Math.abs(v)}%</span>`;
// Live platforms from the distribution plan, else a compact default set
// (Steam, App Store, Google Play, Epic — the order they'll sort by revenue).
function _perfPlats() {
  const live = PLATFORM_ORDER.filter(pid => state.activePlatforms.has(pid) && PERF.revByPlatform[pid]);
  return live.length ? live : ['steam', 'ios', 'android', 'egs'];
}
// Combined net + units across shown platforms — keeps the top-line KPI and the
// revenue box in agreement no matter which platforms are live.
function _perfTotals(f) {
  let net = 0, units = 0;
  for (const pid of _perfPlats()) { const p = PERF.revByPlatform[pid]; net += _pNet(p) * f; units += p.units * f; }
  return { net, units };
}

// Each top-line metric maps 1:1 to a detail box below (which echoes it top-right).
function buildPerfKpis(f) {
  const tot = _perfTotals(f);
  const cards = [
    { label: 'Net revenue',     val: _pMoney(tot.net),           d: PERF.delta.revenue,        jump: 'perf-box-revenue' },
    { label: 'Wishlists',       val: _pNum(PERF.wishlistsTotal), d: PERF.delta.wishlistsTotal, jump: 'perf-box-wishlists' },
    { label: 'Avg rating',      val: `${PERF.rating}★`,          d: PERF.delta.rating,         jump: 'perf-box-reviews' },
    { label: 'Monthly players', val: _pNum(PERF.mau),            d: PERF.delta.mau,            jump: 'perf-box-engagement' },
  ];
  return `<div class="perf-kpis">${cards.map(c => `
    <div class="perf-kpi is-link" onclick="perfJump('${c.jump}')">
      <div class="perf-kpi-label">${c.label}</div>
      <div class="perf-kpi-val">${c.val}</div>
      <div class="perf-kpi-foot">${_pDelta(c.d)}</div>
    </div>`).join('')}</div>`;
}

function buildPerfRevenue(f) {
  const rows = _perfPlats().map(pid => ({ pid, ...PERF.revByPlatform[pid], net: _pNet(PERF.revByPlatform[pid]) * f }))
    .sort((a, b) => b.net - a.net);
  const totalNet = rows.reduce((s, r) => s + r.net, 0);
  const maxNet   = Math.max(...rows.map(r => r.net), 1);
  const anyDelayed = rows.some(r => r.status !== 'finalized');
  const body = rows.map(r => `
    <div class="perf-rev-row">
      <div class="perf-rev-name">
        <span class="perf-rev-link" onclick="perfOpen('${r.portal}')" title="Open ${r.portal}">${platformIcon(r.pid, 16, 'white')}<span>${r.name}</span><span class="perf-ext" aria-hidden="true">↗</span></span>
        <span class="perf-fee" title="Platform fee">${r.cutPct}%</span>
      </div>
      <div class="perf-rev-net">${_pMoney(r.net)}</div>
      <div class="perf-rev-bar-wrap"><div class="perf-rev-bar" style="width:${(r.net / maxNet * 100).toFixed(1)}%"></div></div>
      <div class="perf-rev-flag">${r.status !== 'finalized' ? `<span class="perf-badge perf-badge--delayed" title="${r.delay}">delayed</span>` : ''}</div>
    </div>`).join('');
  return `
    <section class="perf-panel perf-panel--wide" id="perf-box-revenue">
      <div class="perf-panel-head">
        <h3>Revenue — all platforms</h3>
        <div class="perf-total">${_pMoney(totalNet)}<span>net, combined</span></div>
      </div>
      <div class="perf-rev-table">${body}</div>
      ${anyDelayed ? `<div class="perf-note">Platforms tagged <b>delayed</b> are still reporting — those figures firm up as each store finalizes. Hover a tag for the timeline.</div>` : ''}
    </section>`;
}

function buildPerfPanel(title, inner, opts = {}) {
  const { id = '', mod = '', metric = '' } = opts;
  return `<section class="perf-panel${mod ? ' ' + mod : ''}"${id ? ` id="${id}"` : ''}>
    <div class="perf-panel-head"><h3>${title}</h3>${metric ? `<div class="perf-total">${metric}</div>` : ''}</div>
    ${inner}
  </section>`;
}

function buildPerfWishlists(f) {
  const regions = PERF.regions.map(([name, pct]) => `
    <div class="perf-region"><span class="perf-region-name">${name}</span>
      <span class="perf-region-bar"><span style="width:${pct * 2.5}%"></span></span>
      <span class="perf-region-pct">${pct}%</span></div>`).join('');
  const inner = `
    <div class="perf-stat-row">
      <div><div class="perf-mini-val">+${_pNum(PERF.wishlistAdds * f)}</div><div class="perf-mini-lbl">net adds</div></div>
      <div><div class="perf-mini-val">${PERF.wishlistConv}%</div><div class="perf-mini-lbl">conversion</div></div>
    </div>
    <div class="perf-sub-head">Top regions</div>${regions}`;
  return buildPerfPanel('Wishlists', inner, { id: 'perf-box-wishlists', metric: `${_pNum(PERF.wishlistsTotal)}<span>total</span>` });
}

function buildPerfReviews() {
  const rows = PERF.reviews.map(r => `
    <div class="perf-rev2-row">
      <span class="perf-rev2-plat">${r.plat}</span>
      <span class="perf-rev2-score">${r.score}<small>${r.unit === '★' ? '★' : ' ' + r.unit}</small></span>
      <span class="perf-rev2-cnt">${_pNum(r.count)}</span>
    </div>`).join('');
  const inner = `<div class="perf-rev2">${rows}</div>
    <div class="perf-recent-review">“${PERF.recentReview.text}”<span class="perf-recent-meta">${PERF.recentReview.meta}</span></div>`;
  return buildPerfPanel('Reviews & rating', inner, { id: 'perf-box-reviews', metric: `${PERF.rating}★<span>avg</span>` });
}

function buildPerfEngagement() {
  const inner = `
    <div class="perf-stat-row">
      <div><div class="perf-mini-val">${_pNum(PERF.dau)}</div><div class="perf-mini-lbl">daily</div></div>
      <div><div class="perf-mini-val">${PERF.sessionMin}m</div><div class="perf-mini-lbl">avg session</div></div>
    </div>
    <div class="perf-sub-head">Retention</div>
    <div class="perf-ret">
      ${[['D1', PERF.retD1], ['D7', PERF.retD7], ['D30', PERF.retD30]].map(([k, v]) => `
        <div class="perf-ret-col"><div class="perf-ret-bar" style="height:${v * 1.6}px"></div><div class="perf-ret-v">${v}%</div><div class="perf-ret-k">${k}</div></div>`).join('')}
    </div>`;
  return buildPerfPanel('Player engagement', inner, { id: 'perf-box-engagement', metric: `${_pNum(PERF.mau)}<span>monthly</span>` });
}

function buildPerfInsights() {
  const chips = PERF.insights.map(i => `<div class="perf-insight perf-insight--${i.tone}">${i.text}</div>`).join('');
  return buildPerfPanel('Insights & alerts', `<div class="perf-insights">${chips}</div>`, { id: 'perf-box-insights', mod: 'perf-panel--insights' });
}

function renderPerformance() {
  const el = document.getElementById('performance');
  if (!el) return;
  renderProjectBar();
  const period = state.performance.period || '30d';
  const f = PERF_FACTOR[period] || 1;
  const chips = PERF_PERIODS.map(p => `<button class="perf-period-chip${p.id === period ? ' is-on' : ''}" onclick="perfSetPeriod('${p.id}')">${p.label}</button>`).join('');

  el.innerHTML = `
    ${buildTabHero('performance')}
    <div class="perf-toolbar">
      <div class="perf-period">${chips}</div>
      <div class="perf-asof">Updated ~1h ago · some platforms delayed</div>
    </div>
    ${buildPerfKpis(f)}
    ${buildPerfRevenue(f)}
    ${buildPerfInsights()}
    <div class="perf-grid-3">
      ${buildPerfWishlists(f)}
      ${buildPerfReviews()}
      ${buildPerfEngagement()}
    </div>
    <div class="perf-soon">
      <span class="perf-soon-tag">Coming soon</span>
      Cohort retention, LTV, platform-specific player analysis, and revenue forecasting.
    </div>`;
  // Wrap into the panel grid and hang the guide off it. Called here rather
  // than only from setView(), because these renders rebuild innerHTML and are
  // also reached directly from handlers that bypass setView().
  mountShippyPanel('performance');
}

// Capstone that reads as the next beat after the timeline's "Live" marker.
function buildDashboardAnnounceCta() {
  const n = bcActiveChannels().length;
  return `
    <button class="dash-announce" onclick="setView('broadcast')" aria-label="Open Make Waves">
      <span class="dash-announce-rail"><span class="dash-announce-node">◈</span></span>
      <span class="dash-announce-text">
        <span class="dash-announce-kicker">After you go live</span>
        <span class="dash-announce-title">Make waves — announce it everywhere</span>
        <span class="dash-announce-sub">Tell every store, social, community, and press outlet in one shot.</span>
      </span>
      <span class="dash-announce-go">${n ? `${n} channel${n === 1 ? '' : 's'} · Open` : 'Open Make Waves'} →</span>
    </button>`;
}

function renderDashboard() {
  const el = document.getElementById('dashboard');
  if (!el) return;

  renderProjectBar();

  const active   = PLATFORM_ORDER.filter(pid => state.activePlatforms.has(pid));
  const inactive = PLATFORM_ORDER.filter(pid => PLATFORMS[pid] && !state.activePlatforms.has(pid));

  let h = buildTabHero('dashboard');

  if (active.length > 0) {
    h += `<div id="dash-timeline-wrap">${buildDashboardTimeline()}</div>`;
    h += buildDashboardAnnounceCta();
  }

  if (active.length === 0) {
    h += `
      <div class="dash-empty">
        <div class="dash-empty-title">${t('dash.empty.title')}</div>
        <div class="dash-empty-desc">${t('dash.empty.desc')}</div>
      </div>`;
  } else {
    h += `<div class="active-cards-grid">`;
    for (const pid of active) {
      h += buildActiveCard(pid);
    }
    h += `</div>`;
  }

  if (inactive.length > 0) {
    h += `
      <div class="inactive-section">
        <div class="inactive-section-label">${active.length > 0 ? t('dash.more_platforms') : t('dash.available_platforms')}</div>
        <div class="inactive-cards-grid">
          ${inactive.map(pid => buildInactiveCard(pid)).join('')}
        </div>
      </div>`;
  }

  el.innerHTML = h;
}

// Track selector + drift-visibility status pills for platforms that support
// pre-release tracks (iOS/Android/Steam — the platforms actually submittable
// today). The dropdown defaults to whatever track this platform last shipped
// to; nothing here is required input, just a visible, overridable default.
// Console platforms don't have an entry in PLATFORM_TRACKS yet, so this
// returns '' for them — the data model already supports it when they're ready.
// Drift pills shown on the platform card — most recent production build + most recent
// pre-release build (if it's ahead of production). Capped at two pills.
// The track selector itself lives in the submit modal, not on the card.
function buildReleasePills(pid) {
  const proj = state.projects.find(p => p.id === state.activeProjectId);
  if (!proj) return '';
  const summary = getPlatformReleaseSummary(proj, pid);
  const pills = [];
  if (summary.production) {
    pills.push(`<span class="release-pill is-prod">${t('pill.prod')} v${escHtml(summary.production.versionNumber)}</span>`);
  }
  if (summary.latest && summary.latest.track !== 'production') {
    pills.push(`<span class="release-pill is-pre">${escHtml(tTrack(pid, summary.latest.track))}: v${escHtml(summary.latest.versionNumber)}</span>`);
  }
  return pills.length ? `<div class="card-release-status">${pills.join('')}</div>` : '';
}

/* ── Platform auth (prototype credentials face) ───────────────────────────────
   Each active platform card has two faces sharing one .active-card /
   id="active-card-<pid>" shell (so the flip animation in app.js can target it):

     • STEPS  — the submission steps (Upload Build …).
     • ACCOUNT — developer-portal credentials. Before sign-in it shows the login
                 form; after sign-in it shows a compact "signed in" summary, and
                 the gear reveals the login boxes again to change credentials.

   Both faces carry a power button (activate/deactivate) and a gear (flip / show
   credentials) in the header; the header body itself is inert. Credentials are
   faked — any non-empty pair is accepted and nothing is stored or transmitted.
   The ACCOUNT face is pinned to the STEPS face height so flips are size-stable. */

// Whether a platform's developer account is connected (Shipmate bot linked).
function isPlatformConnected(pid) { return !!state.platformAuth?.[pid]?.loggedIn; }

// Cards default to the STEPS face whether or not the platform is connected —
// connection is optional up front (you can fill steps first, "local save only").
// The ACCOUNT/connect face only shows when the user flips there via the cog.
// Web has no developer-portal credentials, so it never shows the connect face.
function showAccountFace(pid) {
  if (pid === 'web') return false;
  if (!state.activePlatforms.has(pid)) return false;
  return state.platformFace?.[pid] === 'account';
}

function _powerBtn(pid) {
  return `
    <button class="active-card-power" type="button"
            onclick="event.stopPropagation();deactivatePlatform('${pid}')"
            title="Deactivate ${escHtml(platLabel(pid))}" aria-label="Deactivate platform">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7.5 6.6a7 7 0 1 0 9 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>`;
}

function _gearBtn(onclick, label, active, alert) {
  const cls = 'active-card-settings'
    + (active ? ' active-card-settings--active' : '')
    + (alert ? ' active-card-settings--alert' : '');
  return `
    <button class="${cls}" type="button"
            onclick="event.stopPropagation();${onclick}"
            title="${label}" aria-label="${label}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>`;
}

/* Header actions (power + gear) for a given face/state. The card has THREE states:
     • signed-out  (account face, not logged in) — gear highlights the login fields
     • signed-in   (account face, logged in)     — gear flips to the linked (steps) face
     • linked      (steps face)                  — gear flips to the signed-in face
   Every state also shows a power button that deactivates the platform. */
function _platformHeadActions(pid, face) {
  // Web has no developer-portal login, so its header is power-only (no gear).
  if (pid === 'web') return `<div class="active-card-actions">${_powerBtn(pid)}</div>`;
  const connected = isPlatformConnected(pid);
  let gear;
  if (face === 'steps') {
    // Cog turns alert-red until connected; either way it flips to the account/connect face.
    gear = _gearBtn(`platformGearFromSteps('${pid}')`,
      connected ? 'Account settings' : 'Connect account to publish', false, !connected);
  } else if (connected) {
    // Highlighted to signal you're in a temporary, reversible settings view.
    gear = _gearBtn(`platformGearFromAccount('${pid}')`, 'Back to steps', true);
  } else {
    // On the connect face; cog flips back to steps (connecting is optional up front).
    gear = _gearBtn(`platformGearFromAccount('${pid}')`, 'Back to steps', true);
  }
  // Settings (gear) on the left, power on the right.
  return `<div class="active-card-actions">${gear}${_powerBtn(pid)}</div>`;
}

// Shared header used by all states. Body is inert; only the buttons act.
function platformCardHead(pid, face) {
  return `
    <div class="active-card-head active-card-head--static">
      <div class="active-card-platform">
        <div class="active-card-icon">${platformIcon(pid, 28, 'white')}</div>
        <div class="active-card-name-row">
          <div class="active-card-name">${platLabel(pid)}</div>
        </div>
      </div>
      ${_platformHeadActions(pid, face)}
    </div>`;
}

/* Connect face — the concise, on-card connection flow shown when the user flips
   an unconnected platform card. Three short stages:
     intro   → what the extension does + Install
     signin  → sign in on the real portal (opens the larger ASC modal)
     confirm → confirm the bot's access + Add
   Credentials never touch Shipmate; the extension hands off to the real site. */
function _connectStage(pid) {
  return state.connectStage?.[pid] || (state.extensionInstalled ? 'signin' : 'intro');
}
function _connectFaceHTML(pid, cfg) {
  const f     = connectFlowConfig(pid);
  const stage = _connectStage(pid);
  const bot   = shipmateBotEmail();

  if (stage === 'intro') {
    return `
      <div class="connect-face">
        <div class="connect-face-lead">Link a Shipmate bot to publish to <b>${escHtml(cfg.portal)}</b> for you. You sign in once on the real site — we never see your password.</div>
        <div class="cf-extrow">
          <div class="cf-ext-ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 7V5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2H7a1 1 0 0 0-1 1v3H4a2 2 0 0 0 0 4h2v3a1 1 0 0 0 1 1h3v-2a2 2 0 0 1 4 0v2h3a1 1 0 0 0 1-1v-3h2a2 2 0 0 0 0-4h-2V8a1 1 0 0 0-1-1z"/></svg></div>
          <div class="cf-ext-txt"><b>Shipmate extension</b><span>Links your account, in your browser</span></div>
        </div>
        <button class="platform-login-btn" type="button" onclick="connectInstall('${pid}')">Install extension</button>
      </div>`;
  }
  if (stage === 'signin') {
    return `
      <div class="connect-face">
        <div class="connect-face-lead">Extension ready. Sign in on ${escHtml(cfg.portal)} to link your account.</div>
        <button class="platform-login-btn" type="button" onclick="openAscLogin('${pid}')">Sign in via extension</button>
        <div class="platform-login-hint">Opens the real ${escHtml(cfg.portal)} in your browser.</div>
      </div>`;
  }
  // confirm
  return `
    <div class="connect-face">
      <div class="connect-face-lead">Add Shipmate's bot to your ${escHtml(cfg.portal)} team with <b>${escHtml(f.role)}</b> access:</div>
      <div class="cf-botrow">
        <div class="cf-bot-email">${bot}</div>
        <div class="cf-bot-role">${escHtml(f.role)} &middot; least privilege</div>
      </div>
      <button class="platform-login-btn" type="button" onclick="connectAdd('${pid}')">Add &amp; connect</button>
    </div>`;
}

// URL shown in the simulated browser chrome of the sign-in modal.
function connectPortalUrl(pid) {
  return ({ ios: 'appstoreconnect.apple.com', steam: 'partner.steamgames.com', android: 'play.google.com/console' })[pid]
    || 'developer.portal';
}

/* Larger, browser-framed sign-in modal — simulates signing in on the real portal
   via the extension. Rendered into #connect-modal. */
function buildAscLoginModal() {
  const pid = state.ascLogin;
  if (!pid) return '';
  const cfg = platformLoginConfig(pid);
  return `
    <div class="webview">
      <div class="webview-chrome">
        <div class="wv-dots"><span></span><span></span><span></span></div>
        <div class="wv-url"><svg class="wv-lock" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>${connectPortalUrl(pid)}</div>
        <button class="wv-x" onclick="closeAscLogin()" aria-label="Close">&times;</button>
      </div>
      ${_signinPageHTML(pid, cfg)}
    </div>`;
}

// Platform-themed sign-in page rendered inside the browser frame.
function _signinPageHTML(pid, cfg) {
  if (pid === 'steam')   return _steamSigninPage(cfg);
  if (pid === 'android') return _googleSigninPage(cfg);
  return _appleSigninPage(cfg);
}

function _appleSigninPage(cfg) {
  const logo = `<svg width="34" height="34" viewBox="0 0 24 24" fill="#111"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>`;
  return `
    <div class="signin-page sp-apple">
      <div class="sp-logo">${logo}</div>
      <div class="sp-title">Sign in to ${escHtml(cfg.portal)}</div>
      <form class="sp-form" onsubmit="ascLoginSubmit('ios');return false;">
        <input class="sp-input" id="asc-user" type="text" placeholder="Apple Account" autocomplete="off" spellcheck="false">
        <input class="sp-input" id="asc-pass" type="password" placeholder="Password" autocomplete="off">
        <input class="sp-input" id="asc-2fa" type="text" placeholder="Verification code" autocomplete="off">
        <div class="sp-hint">Enter the 6-digit code sent to your trusted devices.</div>
        <button class="sp-btn" type="submit">Sign In</button>
      </form>
      <div class="sp-foot">Simulated ${escHtml(cfg.portal)} — Shipmate can't read anything you enter here.</div>
    </div>`;
}

function _steamSigninPage(cfg) {
  const logo = `<svg width="42" height="42" viewBox="0 0 24 24" fill="#fff"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/></svg>`;
  return `
    <div class="signin-page sp-steam">
      <div class="sp-logo">${logo}</div>
      <div class="sp-title">Sign in</div>
      <div class="sp-sub">Sign in with account name</div>
      <form class="sp-form" onsubmit="ascLoginSubmit('steam');return false;">
        <input class="sp-input" id="asc-user" type="text" placeholder="Account name" autocomplete="off" spellcheck="false">
        <input class="sp-input" id="asc-pass" type="password" placeholder="Password" autocomplete="off">
        <input class="sp-input" id="asc-2fa" type="text" placeholder="Steam Guard code" autocomplete="off">
        <button class="sp-btn" type="submit">Sign in</button>
      </form>
      <div class="sp-foot">Simulated Steamworks — Shipmate can't read anything you enter here.</div>
    </div>`;
}

const GOOGLE_LOGO = `<svg width="34" height="34" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

// Faked Google accounts shown in the account chooser.
const GOOGLE_ACCOUNTS = [
  { email: 'mark@sound.games',       name: 'Mark Grimm',       initial: 'M', color: '#5b9dff' },
  { email: 'dev@nebuladrift.com',    name: 'Nebula Drift Dev',  initial: 'N', color: '#34a853' },
];

/* Authentic Google OAuth: account chooser → consent. state.googleView drives it. */
function _googleSigninPage(cfg) {
  const view = state.googleView || 'choose';
  if (view === 'add')     return _googleAddAccount();
  if (view === 'consent') return _googleConsent();
  return _googleChooser();
}

function _googleChooser() {
  const rows = GOOGLE_ACCOUNTS.map(a => `
    <button class="gp-acct" type="button" onclick="googleSelectAccount('${a.email}')">
      <span class="gp-ava" style="background:${a.color}">${a.initial}</span>
      <span class="gp-acct-txt"><span class="gp-acct-name">${escHtml(a.name)}</span><span class="gp-acct-email">${escHtml(a.email)}</span></span>
    </button>`).join('');
  return `
    <div class="signin-page sp-google">
      <div class="sp-logo">${GOOGLE_LOGO}</div>
      <div class="sp-title">Choose an account</div>
      <div class="sp-sub">to continue to <b>Shipmate</b></div>
      <div class="gp-accts">
        ${rows}
        <button class="gp-acct" type="button" onclick="googleUseAnother()">
          <span class="gp-ava gp-ava--add"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          <span class="gp-acct-txt"><span class="gp-acct-name">Use another account</span></span>
        </button>
      </div>
      <div class="sp-foot">Simulated Google sign-in — Shipmate can't read anything you enter here.</div>
    </div>`;
}

function _googleAddAccount() {
  return `
    <div class="signin-page sp-google">
      <div class="sp-logo">${GOOGLE_LOGO}</div>
      <div class="sp-title">Sign in</div>
      <div class="sp-sub">to continue to <b>Shipmate</b></div>
      <form class="sp-form" onsubmit="googleAddNext();return false;">
        <input class="sp-input" id="gp-email" type="text" placeholder="Email or phone" autocomplete="off" spellcheck="false">
        <button class="sp-btn" type="submit">Next</button>
      </form>
      <div class="sp-foot">Simulated Google sign-in — Shipmate can't read anything you enter here.</div>
    </div>`;
}

function _googleConsent() {
  const email = state.googleAccount || GOOGLE_ACCOUNTS[0].email;
  const initial = (email[0] || 'S').toUpperCase();
  return `
    <div class="signin-page sp-google gp-consent">
      <div class="sp-logo">${GOOGLE_LOGO}</div>
      <div class="gp-consent-title"><b>Shipmate</b> wants to access your Google Account</div>
      <div class="gp-acct-chip"><span class="gp-ava-sm">${initial}</span>${escHtml(email)}</div>
      <div class="gp-scope-label">This will allow Shipmate to:</div>
      <ul class="gp-scopes">
        <li>Manage your Google Play Console apps</li>
        <li>Edit store listings and releases</li>
        <li>Submit the Data Safety form on your behalf</li>
      </ul>
      <div class="gp-consent-note">Make sure you trust Shipmate. You can remove access anytime in your Google Account.</div>
      <div class="gp-consent-actions">
        <button class="gp-btn-text" type="button" onclick="closeAscLogin()">Cancel</button>
        <button class="sp-btn gp-allow" type="button" onclick="googleAllow('android')">Allow</button>
      </div>
    </div>`;
}

// Faked list of apps "discovered" in the connected developer account.
function _linkedApps(pid) {
  return [
    { id: 'nebula-drift',      label: 'Nebula Drift' },
    { id: 'nebula-drift-test', label: 'Nebula Drift — Playtest' },
    { id: 'pixel-forge',       label: 'Pixel Forge' },
  ];
}

/* STATE 2 — Signed in: account settings (linked app, etc.). Faked for now. */
function _accountSettingsHTML(pid, cfg, savedUser) {
  const checkSVG = `<svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const caretSVG = `<svg class="platform-select-caret" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const apps = _linkedApps(pid);
  const sel  = state.platformLinkedApp?.[pid] || apps[0].id;
  return `
    <div class="platform-account-settings">
      <div class="platform-account-summary">
        <div class="pas-badge">${checkSVG}</div>
        <div class="pas-info">
          <div class="pas-status">Linked to ${escHtml(cfg.portal)}</div>
          <div class="pas-user">${escHtml(savedUser || cfg.userLabel)}</div>
        </div>
      </div>
      <label class="platform-setting-field">
        <span class="platform-login-label">Linked App</span>
        <div class="platform-select-wrap">
          <select class="platform-select" onchange="selectLinkedApp('${pid}', this.value)">
            ${apps.map(a => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${escHtml(a.label)}</option>`).join('')}
          </select>
          ${caretSVG}
        </div>
      </label>
      <button class="platform-unlink" type="button" onclick="platformSignOut('${pid}')">Un-link Account</button>
    </div>`;
}

function buildAccountCard(pid) {
  const cfg       = platformLoginConfig(pid);
  const auth      = state.platformAuth?.[pid];
  const loggedIn  = !!auth?.loggedIn;
  const savedUser = auth?.username || '';
  const h         = state.platformCardHeight?.[pid];
  const styleAttr = h ? ` style="min-height:${h}px;"` : '';
  const body = loggedIn
    ? _accountSettingsHTML(pid, cfg, savedUser)   // connected: account settings
    : _connectFaceHTML(pid, cfg);                 // not connected: on-card connect flow
  return `
    <div class="active-card platform-account-card ${loggedIn ? 'is-signedin' : 'is-connect'}" id="active-card-${pid}"${styleAttr}>
      ${platformCardHead(pid, 'account')}
      <div class="platform-account-body">${body}</div>
    </div>`;
}


function buildActiveCard(pid, force) {
  if (!force && showAccountFace(pid)) return buildAccountCard(pid);
  if (pid === 'ios')     return buildIOSActiveCard(pid, force);
  if (pid === 'android') return buildAndroidActiveCard(pid, force);
  if (pid === 'steam')   return buildSteamActiveCard(pid, force);

  // Deploy/Submit flip: once flipped, show the submitted (post-deploy) card
  if (state.platformFlipped?.[pid]) return buildSubmittedCard(pid, state.platformFlipped[pid]);

  const p      = PLATFORMS[pid];
  const counts = platformStepCount(pid);
  const locked = !counts.allRequired;
  const submitDone = state.platformStepStatus?.[pid]?.['submit'] === 'complete';

  const steps = p.steps.filter(s => !s.isSubmit).map(step => {
    const done = state.platformStepStatus[pid][step.id] === 'complete';
    // Web's "Preview Website" uses the rich step-modal + flip preview (like App Store/Steam);
    // other generic-platform steps use the plain task modal.
    const openFn = (pid === 'web' && step.id === 'storePreview') ? 'openStepModal' : 'openTaskModal';
    return `
      <div class="card-task ${done ? 'is-done' : ''}" onclick="${openFn}('${pid}','${step.id}')">
        <div class="task-dot ${done ? 'is-complete' : ''}" id="dot-${pid}-${step.id}"></div>
        <span class="task-label">${stepLabel(pid, step)}</span>
        <span class="task-arrow">›</span>
      </div>`;
  }).join('');

  // Deploy/Submit badge number = count of non-submit steps + 1 (this platform's
  // steps array includes the submit step, so exclude it from the count).
  const nonSubmitCount = p.steps.filter(s => !s.isSubmit).length;
  const submitStepCard = buildSubmitStepCard(pid, nonSubmitCount, locked, submitDone);

  return `
    <div class="active-card" id="active-card-${pid}">
      ${platformCardHead(pid, 'steps')}
      <div class="card-tasks">${steps}</div>
      <div class="ios-step-cards">${submitStepCard}</div>
    </div>`;
}

/* ── Submit step card (shared across all platform card builders) ─────────────
   Shows as the last step in every platform card.
   • locked=true  → grayed-out row, no track controls
   • locked=false → row is active with inline track dropdown + Submit button
   ─────────────────────────────────────────────────────────────────────────── */
function buildSubmitStepCard(pid, stepCount, locked, submitDone) {
  const checkSVG = `<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const num = stepCount + 1;
  const numClass = 'ios-step-num' + (submitDone ? ' is-done' : '');

  const tracks   = PLATFORM_TRACKS[pid] || [{ id: 'production', label: 'Production' }];
  const selTrack = (state.selectedTracks || {})[pid] ?? null;

  // Web deploys with a single action (no release track); other platforms require a chosen track.
  const isWeb = pid === 'web';
  // Hard rule: Submit is unavailable until the platform account is connected.
  const connected = isWeb ? true : isPlatformConnected(pid);
  const readyToSubmit = connected && (isWeb ? (!locked && !submitDone) : (!locked && !!selTrack && !submitDone));

  // Track picker pill — mirrors buildBuildDropdown style
  // Gray when no track; green check when track selected; whole card clicks submit when ready
  const trackPill = `
    <div class="submit-track-pill ${!selTrack ? 'no-track' : 'has-track'}"
         onclick="event.stopPropagation();_openTrackMenu('${pid}')" title="${selTrack ? 'Change track' : 'Choose a release track'}">
      ${selTrack
        ? `${checkSVG}<span class="submit-track-label">${escHtml(tracks.find(t => t.id === selTrack)?.label || selTrack)}</span>`
        : `<svg width="9" height="9" viewBox="0 0 12 12" fill="none" style="opacity:0.5"><path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
           <span class="submit-track-label">Choose Track</span>`
      }
      <svg width="7" height="5" viewBox="0 0 7 5" fill="none" style="margin-left:2px;opacity:0.5"><path d="M1 1l2.5 2.5L6 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
      <select id="track-sel-${pid}" class="submit-track-select-hidden"
              onchange="selectTrack('${pid}', this.value);this.value=''">
        <option value="" disabled selected></option>
        ${tracks.map(tr => `<option value="${tr.id}">${escHtml(tr.label)}</option>`).join('')}
      </select>
    </div>`;

  // Whole card is clickable to submit when ready
  const cardClick = readyToSubmit ? `onclick="confirmSubmit('${pid}')"` : '';
  const pulseClass = readyToSubmit ? ' submit-step-pulse' : '';
  const stepLocked = locked || !connected;

  // Trailing control: not connected → a "Connect to submit" prompt; else the track pill.
  const trailing = !connected
    ? `<span class="submit-connect-req" onclick="event.stopPropagation();platformGearFromSteps('${pid}')" title="Connect ${escHtml(platLabel(pid))} to submit">Connect to submit</span>`
    : (isWeb ? '' : trackPill);

  return `
    <div class="ios-step-card ios-step-card--inline submit-step-card${pulseClass} ${submitDone ? 'is-complete' : ''} ${stepLocked ? 'submit-step-locked' : 'submit-step-ready'}"
         id="${pid}-step-card-submit" style="${readyToSubmit ? 'cursor:pointer;' : ''}" ${cardClick}>
      <div class="${numClass}">${submitDone ? checkSVG : num}</div>
      <div class="ios-step-info">
        <div class="ios-step-name">${isWeb ? 'Deploy' : 'Submit'}</div>
      </div>
      ${trailing}
    </div>`;
}

// Footer note shown on every step modal while the platform isn't connected —
// signals that edits are saved locally only and can't be published yet.
function _localSaveNote(pid) {
  if (!pid || pid === 'web' || isPlatformConnected(pid)) return '';
  return `<span class="local-save-note"><span class="lsn-dot"></span>Saved locally — connect ${escHtml(platLabel(pid))} in settings to publish</span>`;
}

function _openTrackMenu(pid) {
  const sel = document.getElementById('track-sel-' + pid);
  if (sel) sel.focus();
  // Trigger a real click on the native select to open the picker
  try { sel.size = 1; sel.click(); } catch(e) {}
}

function buildIOSActiveCard(pid, force) {
  if (!force && showAccountFace(pid)) return buildAccountCard(pid);
  if (state.platformFlipped?.[pid]) return buildSubmittedCard(pid, state.platformFlipped[pid]);
  const p      = PLATFORMS[pid];
  const counts = platformStepCount(pid);
  const locked = !counts.allRequired;
  const submitDone = state.platformStepStatus?.[pid]?.['submit'] === 'complete';

  const checkSVG = `<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const binProc = !!(state.platformBuildProcessing?.[pid]);
  const stepCards = p.steps.map((step, i) => {
    const done      = isIOSSectionComplete(step.id);
    const numClass  = 'ios-step-num' + (done ? ' is-done' : '');

    // Upload Build step — inline, no modal
    if (step.id === 'uploadBuild') {
      return `
        <div class="ios-step-card ${done ? 'is-complete' : ''} ios-step-card--inline" id="ios-step-card-${step.id}">
          <div class="${numClass}">${done ? checkSVG : i + 1}</div>
          <div class="ios-step-info">
            <div class="ios-step-name">${stepLabel(pid, step)}</div>
          </div>
          ${buildBuildDropdown(pid)}
        </div>`;
    }

    const risk      = computeIOSSectionRisk(step.id);
    const attempted = state.stepSaveAttempted?.has(`${pid}-${step.id}`);
    // Only show risk dot after the user has attempted to save/close this step at least once
    const riskDot   = (done || !attempted || risk === 'LOW' || risk === 'NONE')
      ? '' : `<span class="ios-step-risk ios-step-risk-${risk.toLowerCase()}"></span>`;
    // Binary processing indicator on the Improve Your Submission step row
    const trailingEl = (step.id === 'improveSubmission' && binProc)
      ? `<span class="build-proc-spin" style="flex-shrink:0;margin-left:auto;"></span>`
      : `<span class="ios-step-arrow">›</span>`;
    return `
      <div class="ios-step-card ${done ? 'is-complete' : ''}" id="ios-step-card-${step.id}"
           onclick="openStepModal('${pid}','${step.id}')">
        <div class="${numClass}">${done ? checkSVG : i + 1}</div>
        <div class="ios-step-info">
          <div class="ios-step-name">${stepLabel(pid, step)}</div>
        </div>
        ${riskDot}
        ${trailingEl}
      </div>`;
  }).join('');

  const submitStepCard = buildSubmitStepCard(pid, p.steps.length, locked, submitDone);

  return `
    <div class="active-card ${!locked ? 'submit-ready' : ''}" id="active-card-${pid}">
      ${platformCardHead(pid, 'steps')}
      ${buildReleasePills(pid)}
      <div class="ios-step-cards">${stepCards}${submitStepCard}</div>
    </div>`;
}

function buildAndroidActiveCard(pid, force) {
  if (!force && showAccountFace(pid)) return buildAccountCard(pid);
  if (state.platformFlipped?.[pid]) return buildSubmittedCard(pid, state.platformFlipped[pid]);
  const p      = PLATFORMS[pid];
  const counts = platformStepCount(pid);
  const locked = !counts.allRequired;
  const submitDone = state.platformStepStatus?.[pid]?.['submit'] === 'complete';

  const checkSVG = `<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const binProcAndroid = !!(state.platformBuildProcessing?.[pid]);
  const stepCards = p.steps.map((step, i) => {
    const done      = isAndroidSectionComplete(step.id);
    const numClass  = 'ios-step-num' + (done ? ' is-done' : '');

    if (step.id === 'uploadBuild') {
      return `
        <div class="ios-step-card ${done ? 'is-complete' : ''} ios-step-card--inline" id="android-step-card-${step.id}">
          <div class="${numClass}">${done ? checkSVG : i + 1}</div>
          <div class="ios-step-info">
            <div class="ios-step-name">${stepLabel(pid, step)}</div>
          </div>
          ${buildBuildDropdown(pid)}
        </div>`;
    }

    const risk      = computeAndroidSectionRisk(step.id);
    const attempted = state.stepSaveAttempted?.has(`${pid}-${step.id}`);
    const riskDot   = (done || !attempted || risk === 'LOW' || risk === 'NONE')
      ? '' : `<span class="ios-step-risk ios-step-risk-${risk.toLowerCase()}"></span>`;
    const trailingEl = (step.id === 'improveSubmission' && binProcAndroid)
      ? `<span class="build-proc-spin" style="flex-shrink:0;margin-left:auto;"></span>`
      : `<span class="ios-step-arrow">›</span>`;
    return `
      <div class="ios-step-card ${done ? 'is-complete' : ''}" id="android-step-card-${step.id}"
           onclick="openStepModal('${pid}','${step.id}')">
        <div class="${numClass}">${done ? checkSVG : i + 1}</div>
        <div class="ios-step-info">
          <div class="ios-step-name">${stepLabel(pid, step)}</div>
        </div>
        ${riskDot}
        ${trailingEl}
      </div>`;
  }).join('');

  const submitStepCard = buildSubmitStepCard(pid, p.steps.length, locked, submitDone);

  return `
    <div class="active-card ${!locked ? 'submit-ready' : ''}" id="active-card-${pid}">
      ${platformCardHead(pid, 'steps')}
      ${buildReleasePills(pid)}
      <div class="ios-step-cards">${stepCards}${submitStepCard}</div>
    </div>`;
}

const COMING_SOON_PLATFORMS = new Set(['egs', 'psn', 'xbox', 'nintendo']);

function buildInactiveCard(pid) {
  const p          = PLATFORMS[pid];
  const counts     = platformStepCount(pid);
  const pct        = counts.total ? Math.round((counts.complete / counts.total) * 100) : 0;
  const label      = counts.complete > 0 ? t('dash.steps_count', {complete: counts.complete, total: counts.total}) : 'Inactive';
  const isCS       = COMING_SOON_PLATFORMS.has(pid);
  const clickAttr  = isCS
    ? `onclick="blinkComingSoon('${pid}')" title="${platLabel(pid)} — coming soon"`
    : `onclick="activatePlatform('${pid}')" role="button" tabindex="0" title="Click to activate ${platLabel(pid)}"`;
  return `
    <div class="inactive-card ${isCS ? 'is-coming-soon' : ''}" ${clickAttr} style="cursor:${isCS ? 'default' : 'pointer'};">
      <div class="inactive-card-head">
        <div class="inactive-card-platform">
          <div class="inactive-card-icon">${platformIcon(pid, 20, 'white')}</div>
          <span class="inactive-card-name">${platLabel(pid)}</span>
        </div>
        ${isCS ? `<span class="coming-soon-badge" id="cs-badge-${pid}">Coming Soon</span>` : ''}
      </div>
      <div class="inactive-bar-wrap">
        <div class="inactive-bar">
          <div class="inactive-bar-fill" style="width:${pct}%;"></div>
        </div>
        <span class="inactive-status-label">${label}</span>
      </div>
    </div>`;
}


/* ── Task Modal ──────────────────────────────────────── */

function renderTaskModal() {
  const modal = document.getElementById('task-modal');
  if (!modal || !state.activeModal) return;

  const { platformId, stepId } = state.activeModal;
  const p      = PLATFORMS[platformId];
  const step   = p.steps.find(s => s.id === stepId);
  const status = state.platformStepStatus[platformId][stepId];
  const done   = status === 'complete';

  modal.innerHTML = `
    <div class="task-modal-header" style="border-top-color:${p.color};">
      <div class="task-modal-context">
        <div class="task-modal-platform-icon">
          ${platformIcon(platformId, 28, 'white')}
        </div>
        <span class="task-modal-platform-name">${platLabel(platformId)}</span>
        <span class="task-modal-sep">›</span>
        <span class="task-modal-step-name">${stepLabel(platformId, step)}</span>
      </div>
      <button class="task-modal-close" onclick="closeTaskModal()">×</button>
    </div>
    <div class="task-modal-body">
      ${buildTaskContent(platformId, stepId, done)}
    </div>
    <div class="task-modal-footer">
      ${done
        ? `<button class="btn btn-ghost" onclick="markTaskUndone('${platformId}','${stepId}')">Mark incomplete</button>
           <button class="btn btn-primary" onclick="closeTaskModal()">Done</button>`
        : `<button class="btn btn-ghost" onclick="closeTaskModal()">Cancel</button>
           <button class="btn btn-primary" onclick="markTaskDone('${platformId}','${stepId}')">Mark complete ✓</button>`
      }
    </div>`;
}

function buildTaskContent(platformId, stepId, done) {
  const p    = PLATFORMS[platformId];
  const step = p.steps.find(s => s.id === stepId);
  const fd   = state.formData;

  // Review Metadata — show their actual content
  if (stepId === 'reviewMetadata' || stepId === 'reviewStorePage' || stepId === 'reviewStoreListing') {
    return `
      <div class="task-content-section">
        <div class="task-content-label">Title</div>
        <div class="task-content-value">${fd.title || '<em style="color:#aaa">Not set</em>'}</div>
      </div>
      <div class="task-content-section">
        <div class="task-content-label">Description</div>
        <div class="task-content-value task-content-desc">${fd.description || '<em style="color:#aaa">Not set</em>'}</div>
      </div>
      <div class="task-content-section">
        <div class="task-content-label">Price</div>
        <div class="task-content-value">${fd.price ? `$${fd.price}` : '<em style="color:#aaa">Not set</em>'}</div>
      </div>
      <p class="task-stub-note">Review the metadata above. Make any edits via <strong>Game Details</strong>, then mark complete.</p>`;
  }

  // Confirm Screenshots — show their thumbnails
  if (stepId === 'confirmScreenshots' || (stepId === 'confirmMedia' && state.uploads.screenshots.length)) {
    const shots = state.uploads.screenshots;
    const thumbs = shots.length
      ? `<div class="task-thumb-row">${shots.slice(0, 6).map(s => `<img src="${_screenshotSrc(s)}" class="task-thumb" alt="${escHtml(s.name)}">`).join('')}${shots.length > 6 ? `<div class="task-thumb-more">+${shots.length - 6}</div>` : ''}</div>`
      : `<p class="task-stub-note">No screenshots uploaded yet. Add them via <strong>Game Details → Upload Assets</strong>.</p>`;
    return `<p style="margin-bottom:14px;color:#555;font-size:13px;">Confirm these screenshots look correct for <strong>${p.label}</strong>.</p>${thumbs}`;
  }

  // Generic stub
  return `
    <p class="task-stub-copy">Complete the <strong>${step.label}</strong> step for ${p.label}.</p>
    <p class="task-stub-note">Full task UI coming in the next iteration. Mark complete to continue.</p>`;
}

/* ── Inference loading messages (per platform + step) ─── */
function _getInferenceMsgs(platformId, stepId) {
  if (stepId === 'questionnaire' && platformId === 'ios')
    return ['Scanning for content signals…','Checking violence, language & mature themes…','Reviewing data collection & business model…','Preparing your questionnaire…'];
  if (stepId === 'questionnaire' && platformId === 'android')
    return ['Scanning for IARC content signals…','Identifying data collection & safety requirements…','Checking Google Play policy compliance…','Preparing your questionnaire…'];
  if (stepId === 'questionnaire' && platformId === 'steam')
    return ['Scanning game content for Steam requirements…','Reviewing genres, features & technical specs…','Checking Steam content policies…','Preparing your questionnaire…'];
  if (stepId === 'distribution')
    return ['Analyzing market selection options…','Checking regional availability…','Applying distribution strategy…','Finalizing territorial availability…'];
  return ['Reading your game details…','Cross-referencing platform requirements…','Inferring answers from your submission…','Preparing recommendations…'];
}

/* ── Inference answer counter ────────────────────────── */
function _countInferenceAnswers(platformId, stepId) {
  if (platformId === 'ios' && stepId === 'questionnaire') {
    const a = state.iosSubmitAnswers;
    const fields = [
      'parentalControls','ageAssurance','unrestrictedInternet','userGenContent',
      'messagingChat','advertising',
      'profanity','horrorFear','substancesAlcohol',
      'matureSuggestive','sexualContent','graphicSexual',
      'cartoonViolence','realisticViolence','extendedViolence','gunsWeapons',
      'simulatedGambling','contests','realMoneyGambling','lootBoxes',
      'ageCategory',
      'hasIAP','usesEncryption',
    ];
    const total    = fields.length;
    const answered = fields.filter(f => a[f] != null).length;
    return { answered, total };
  }
  // Android / Steam — use CQ_QUESTIONS root questions for that platform
  const platKey = platformId === 'steam' ? 'steam' : 'android';
  const rootQs  = CQ_QUESTIONS.filter(q => q.platforms.includes(platKey) && !q.parent);
  const total   = rootQs.length;
  const answered = rootQs.filter(q => {
    const v = state.cqAnswers[q.id];
    if (q.type === 'multi') return Array.isArray(v) && v.length > 0;
    return v != null && v !== '';
  }).length;
  return { answered, total };
}

/* ── Step Modal (iOS per-step) ───────────────────────── */

function renderStepModal() {
  const modal = document.getElementById('submit-modal');
  if (!modal) return;
  const { platformId, stepId, inferenceStatus, inferenceError } = state.stepModal || {};
  // Questionnaire contains privacy matrix — needs extra width for iOS and Android.
  // Preview Website needs extra width for the two-column presskit layout.
  const isWide = (stepId === 'questionnaire' && (platformId === 'ios' || platformId === 'android'))
              || (stepId === 'storePreview' && platformId === 'web');
  modal.className = 'submit-modal' + (isWide ? ' submit-modal-wide' : '') + (state.showHighlights ? ' is-validating' : '');
  if (!platformId || !stepId) return;

  const p    = PLATFORMS[platformId];
  const step = p.steps.find(s => s.id === stepId);

  // Inference banners — success note goes to footer; error stays in scroll area
  let inferenceBanner     = '';
  let inferenceFooterNote = '';
  if (step?.hasInference) {
    const hasRun  = stepId === 'questionnaire'
      ? !!state.platformInferenceCache['unified:questionnaire']
      : !!state.platformInferenceCache[platformId + ':' + stepId];
    const retryFn = `_retryInference('${platformId}','${stepId}')`;
    if (inferenceStatus === 'loading') {
      // loading screen replaces the banner during loading
    } else if (inferenceStatus === 'error') {
      inferenceBanner = `
        <div class="ai-banner ai-banner-error">
          <span class="ai-banner-icon">⚠</span>
          <div class="ai-banner-text"><strong>Analysis failed:</strong> ${inferenceError || 'Unknown error'}</div>
          <button class="ai-autofill-btn" onclick="${retryFn}">Retry</button>
        </div>`;
    } else if (hasRun && stepId === 'questionnaire') {
      const { answered: infAns, total: infTotal } = _countInferenceAnswers(platformId, stepId);
      inferenceFooterNote = `
        <div class="inf-footer-note">
          <span class="inf-footer-icon">✦</span>
          <span>Shipmate pre-filled ${infAns} of ${infTotal} questions —<br>Please review ALL answers before submitting</span>
        </div>`;
    }
  }

  // Store Preview flip — which sub-section is currently showing inside the preview modal
  const flipTarget = stepId === 'storePreview'
    ? (state.storePreviewFlipTarget?.[platformId] || null)
    : null;
  const FLIP_LABELS = {
    content:       'Content Questions',
    business:      'Business Questions',
    data:          'Data Collection Questions',
    screenshots:   'Screenshots',
    siteInfo:      'Site Details',
    webFactsheet:  'Factsheet',
    webDescription:'Description',
    webMedia:      'Media',
    webAbout:      'About',
    webKeyArt:     'Key Art',
    keyArt:        'Select Key Art',
    localization:  'Localization Review',
  };
  const isFlipped = !!flipTarget;
  const displayStepLabel = isFlipped ? (FLIP_LABELS[flipTarget] || step?.label) : step?.label;

  // Step body
  let body = '';
  if (inferenceStatus === 'loading') {
    const msgs = _getInferenceMsgs(platformId, stepId);
    body = `
      <div class="inf-loading-screen">
        <div class="inf-rings-wrap">
          <div class="inf-ring inf-ring-1"></div>
          <div class="inf-ring inf-ring-2"></div>
          <div class="inf-ring inf-ring-3"></div>
          <img src="Assets/SubwooferIcon_Orange.png" class="inf-logo" onerror="this.style.display='none'">
        </div>
        <div class="inf-headline">Shipmate is working…</div>
        <div class="inf-steps">
          ${msgs.map((m, i) => `<div class="inf-step" style="animation-delay:${i * 1.3}s"><div class="inf-dot"></div><span>${m}</span></div>`).join('')}
        </div>
      </div>`;
  } else if (stepId === 'improveSubmission' && (state.storePageInsights?.loading || state.improveSubmissionAnalysis?.loading)) {
    const iaMsgs = [
      'Comparing store page to best in class…',
      'Reviewing assets to maximize conversion…',
      'Analyzing binary to gauge compliance risk…',
      'Preparing your personalized report…',
    ];
    body = `
      <div class="inf-loading-screen">
        <div class="inf-rings-wrap">
          <div class="inf-ring inf-ring-1"></div>
          <div class="inf-ring inf-ring-2"></div>
          <div class="inf-ring inf-ring-3"></div>
          <img src="Assets/SubwooferIcon_Orange.png" class="inf-logo" onerror="this.style.display='none'">
        </div>
        <div class="inf-headline">Shipmate is working…</div>
        <div class="inf-steps">
          ${iaMsgs.map((m, i) => `<div class="inf-step" style="animation-delay:${i * 1.3}s"><div class="inf-dot"></div><span>${m}</span></div>`).join('')}
        </div>
      </div>`;
  } else if (platformId === 'android') {
    if (stepId === 'storePreview')            body = flipTarget ? buildStorePreviewFlipSection(platformId, flipTarget) : buildAndroidStorePreviewSection();
    else if (stepId === 'improveSubmission')  body = buildImproveSubmissionSection(platformId);
    // Legacy / questionnaire kept for backward-compat
    else if (stepId === 'questionnaire')      body = buildQuestionnaireSection(platformId);
    else if (stepId === 'screenshots')        body = buildScreenshotsSection(platformId);
    else if (stepId === 'contentRating')      body = buildAndroidContentRatingSection();
    else if (stepId === 'dataSafety')         body = buildAndroidDataSafetySection();
    else if (stepId === 'business')           body = buildAndroidBusinessSection();
  } else if (platformId === 'steam') {
    if (stepId === 'storePreview')            body = flipTarget ? buildStorePreviewFlipSection(platformId, flipTarget) : buildSteamStorePreviewSection();
    else if (stepId === 'improveSubmission')  body = buildImproveSubmissionSection(platformId);
    // Legacy / questionnaire kept for backward-compat
    else if (stepId === 'questionnaire')      body = buildQuestionnaireSection(platformId);
    else if (stepId === 'screenshots')        body = buildScreenshotsSection(platformId);
    else if (stepId === 'contentRating')      body = buildSteamContentRatingSection();
    else if (stepId === 'storeTags')          body = buildSteamStoreTagsSection();
    else if (stepId === 'technical')          body = buildSteamTechnicalSection();
  } else if (platformId === 'web') {
    if (stepId === 'storePreview')            body = flipTarget ? buildStorePreviewFlipSection('web', flipTarget) : buildWebSitePreviewSection();
  } else if (stepId === 'storePreview')       body = flipTarget ? buildStorePreviewFlipSection(platformId, flipTarget) : buildStorePreviewSection();
  else if (stepId === 'improveSubmission')    body = buildImproveSubmissionSection(platformId);
  else if (stepId === 'distribution')         body = buildDistributionSection();
  // iOS legacy / questionnaire kept for backward-compat
  else if (stepId === 'questionnaire')        body = buildQuestionnaireSection(platformId);
  else if (stepId === 'screenshots')          body = buildScreenshotsSection(platformId);
  else if (stepId === 'contentRating')        body = buildContentRatingSection();
  else if (stepId === 'privacy')              body = buildPrivacySection();
  else if (stepId === 'business')             body = buildBusinessSection() + buildExportComplianceSection();

  const complete = platformId === 'android' ? isAndroidSectionComplete(stepId)
               : platformId === 'steam'   ? isSteamSectionComplete(stepId)
               : platformId === 'web'     ? (state.platformStepStatus?.web?.[stepId] === 'complete')
               : isIOSSectionComplete(stepId);

  modal.innerHTML = `
    <div class="submit-modal-header" style="border-top-color:${p.color};">
      <div class="submit-modal-title-row">
        <div class="submit-modal-hicon">${platformIcon(platformId, 30, 'white')}</div>
        <div>
          <div class="submit-modal-title">${displayStepLabel || ''}</div>
          <div class="submit-modal-subtitle">${p.label}</div>
        </div>
      </div>
      <button class="task-modal-close" onclick="closeStepModal()">×</button>
    </div>
    <div class="submit-modal-scroll" id="step-modal-body">
      ${inferenceBanner}
      <div class="ios-step-body-content">
        ${body}
      </div>
    </div>
    <div class="submit-modal-footer">
      ${_localSaveNote(platformId)}
      ${inferenceFooterNote}
      ${isFlipped
        ? (platformId === 'steam' && flipTarget === 'keyArt' && state.steamKeyArtFromWebEdit)
          ? `<button class="btn btn-primary" onclick="backFromSteamKeyArtToWebEdit()">Save &amp; Return to Web</button>`
          : `<button class="btn btn-primary" onclick="closeStorePreviewSection('${platformId}')">Save &amp; Return</button>`
        : `<button class="btn btn-primary" onclick="closeStepModal()">${complete ? 'Done' : 'Save &amp; Close'}</button>`
      }
    </div>`;

  // Init distribution map after render if this is the distribution step
  if (stepId === 'distribution') requestAnimationFrame(() => initDistributionMap());

  // Doc pane — questionnaire only, desktop only
  _syncDocPane(stepId);
}

/* ── Documentation Pane helpers ─────────────────────────── */

function _syncDocPane(stepId) {
  const overlay       = document.getElementById('submit-overlay');
  const modal         = document.getElementById('submit-modal');
  const existingGroup = document.getElementById('step-modal-group');

  if (stepId === 'questionnaire') {
    if (!existingGroup) {
      const group = document.createElement('div');
      group.id        = 'step-modal-group';
      group.className = 'step-modal-group';
      overlay.insertBefore(group, modal);
      group.appendChild(modal);
      group.insertAdjacentHTML('beforeend', `
        <div class="doc-pane" id="doc-pane">
          <div class="doc-pane-inner">${buildDocPaneContent()}</div>
        </div>
        <button class="doc-pane-tab" id="doc-pane-tab" onclick="toggleDocPane()" aria-label="Toggle documentation pane">
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 1.5L6.5 7L1.5 12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>`);
    }
  } else if (existingGroup) {
    // Leaving questionnaire — restore modal to overlay directly
    overlay.insertBefore(modal, existingGroup);
    existingGroup.remove();
  }
}

/* ── Store Preview flip: content for each sub-section modal ── */
function buildStorePreviewFlipSection(platformId, target) {
  // Mark this sub-section as visited so "done" state is only shown after the user has been here
  if (!state.storePreviewSectionSeen) state.storePreviewSectionSeen = {};
  if (!state.storePreviewSectionSeen[platformId]) state.storePreviewSectionSeen[platformId] = {};
  state.storePreviewSectionSeen[platformId][target] = true;

  if (target === 'siteInfo') {
    return buildWebSiteEditSection();
  }
  // Clicking a glow box around one of the preview website's four main
  // sections flips to a focused modal with just that section's fields,
  // rather than the full "Edit site details" panel.
  if (target === 'webFactsheet')   return buildWebFactsheetEditSection();
  if (target === 'webDescription') return buildWebDescriptionEditSection();
  if (target === 'webMedia')       return buildWebMediaEditSection();
  if (target === 'webAbout')       return buildWebAboutEditSection();
  if (target === 'webKeyArt')      return buildWebKeyArtEditSection();
  if (target === 'content') {
    if (platformId === 'android') return buildAndroidContentRatingSection();
    if (platformId === 'steam')   return buildSteamContentRatingSection();
    return buildContentRatingSection();
  }
  if (target === 'business') {
    if (platformId === 'android') return buildAndroidBusinessSection();
    if (platformId === 'steam') {
      return `<div class="qs-section"><div class="qs-section-header">Store Tags</div>${buildSteamStoreTagsSection()}</div>
              <div class="qs-section qs-section-divided"><div class="qs-section-header">Technical</div>${buildSteamTechnicalSection()}</div>`;
    }
    return buildBusinessSection() + buildExportComplianceSection();
  }
  if (target === 'data') {
    if (platformId === 'android') return buildAndroidDataSafetySection();
    if (platformId === 'steam') return `
      <div class="qs-section">
        <div class="qs-section-header">Privacy</div>
        <p style="padding:8px 0 16px;color:var(--text-muted);font-size:13px;line-height:1.5;">
          Steam privacy data is configured in the Steamworks Partner Portal.
          Add your privacy policy URL here to satisfy the Steam store requirement.
        </p>
        ${buildSteamStorePreviewSection()}
      </div>`;
    return buildPrivacySection();
  }
  if (target === 'screenshots') {
    return buildScreenshotsSection(platformId);
  }
  // Steam-only: the "Select Key Art" section of the Store Page Preview step
  // (see buildSteamStorePreviewSection's spp-sections-list). The Web
  // platform's Key Art modal reads state.uploads.steamKeyArtCapsule/
  // steamKeyArtHero read-only rather than dispatching here — see
  // buildWebKeyArtEditSection.
  if (target === 'keyArt') {
    return buildSteamKeyArtEditSection();
  }
  // iOS-only: the App Store Product Page Preview's "All Locs" button.
  if (target === 'localization') {
    return buildLocalizationReviewSection();
  }
  return '';
}

/* ── Web: self-distribution site preview + edit panel ──────────────
   The "Preview Website" step. Renders a "presskit()"-style press page with
   four always-visible main sections (accented h2 headers, via .pk-h2) —
   Factsheet, Description, Media, About — each containing bold, non-accented
   sub-section headers (via .pk-h3, see the pkSub() helper) that only render
   once the user has put something in them — except Developer, Release
   Date, and Hook, which always show (Developer with a muted dash
   placeholder when empty; Release Date and Hook already have their own
   fallback text):
     Factsheet:    Developer, Location, Official Website, Links, Publisher, Release Date, Platforms, Genres
     Description:  Hook, About This Game, History
     Media:        Trailers, Screenshots
     About:        About the Developer, Website, Contact
   Populated from Shipmate's game data plus the extra fields in
   state.webSite, which "Edit site details" organizes into the same four
   groups (Platforms and Trailers sync read-only from elsewhere in Shipmate
   rather than being their own webSite fields — see the state.js comment
   above the webSite object; Release Date is its own plain text webSite
   field, same as Publisher/Genres). List-type fields are
   stored as plain newline-separated text and parsed here (see _pkLines). Factsheet and
   Description sit side by side in a two-column grid (.pk-fact-desc-grid —
   Factsheet in the narrow column under the capsule, Description in the wide
   column under the hero); Media and About flow full-width below it. Clicking
   "Edit site details" flips (via openStorePreviewSection) to
   buildWebSiteEditSection().
   ─────────────────────────────────────────────────────────────────── */

/* Display labels for the Factsheet's "Platforms" sub-section — synced
   read-only from state.activePlatforms, keyed the same as PLATFORM_ORDER. */
const PK_PLATFORM_LABELS = {
  steam: 'PC (Steam)', ios: 'iOS', android: 'Android', web: 'Web',
  egs: 'PC (Epic Games Store)', psn: 'PlayStation', xbox: 'Xbox', nintendo: 'Nintendo Switch',
};

/* Split a textarea's contents into trimmed, non-empty lines. */
function _pkLines(text) {
  return (text || '').split('\n').map(s => s.trim()).filter(Boolean);
}

/* Splits a textarea's contents into paragraphs on blank-line boundaries —
   a blank line is a paragraph break; consecutive non-blank lines belong to
   the same paragraph (soft line breaks within it). Returns an array of
   paragraphs, each itself an array of trimmed, non-empty lines — callers
   escape and join each paragraph's lines with <br> (see aboutGameValue),
   so a real paragraph gets its own <p> (full CSS spacing) while a
   same-paragraph line break stays tight (no extra margin). Unlike
   _pkLines above (still used by History), this treats blank lines as
   meaningful rather than noise to discard — see aboutGame's comment in
   state.js for why. */
function _pkParagraphs(text) {
  return (text || '')
    .split(/\n\s*\n/)
    .map(block => block.split('\n').map(l => l.trim()).filter(Boolean))
    .filter(lines => lines.length);
}

/* Extracts the 11-char video ID from a YouTube watch/share/embed/shorts URL
   (youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube.com/shorts/,
   with or without extra query params like &t=10s). Returns '' for anything
   else, so non-YouTube trailer URLs fall back to a plain link-out card. */
function _pkYouTubeId(url) {
  if (!url) return '';
  const m = String(url).match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : '';
}

/* Which Steam Key Art asset backs the preview website's capsule box
   (pk-capsule, below) — user-selectable in Web's "Key Art" section (see
   the selector rendered by buildWebKeyArtEditSection, and
   setWebCapsuleSource in app.js). state.webSite.capsuleSource is one of:
     - 'capsuleImage' → state.uploads.steamCapsuleImage (Steam's own
       appdetails.capsule_image, 231×87)
     - 'headerImage'  → state.uploads.steamHeaderImage (Steam's own
       appdetails.header_image, 460×215)
     - 'igdbCoverArt' → state.uploads.steamKeyArtCapsule (IGDB's own cover
       art, 264×374) — the default, matching this preview's original,
       only-ever-had-one-source behavior.
   Falls back to 'igdbCoverArt' for any unrecognized/missing value, so an
   old saved state.webSite without capsuleSource (or a future typo) doesn't
   silently render no capsule at all. */
function _webCapsuleSourceField(source) {
  const map = { capsuleImage: 'steamCapsuleImage', headerImage: 'steamHeaderImage', igdbCoverArt: 'steamKeyArtCapsule' };
  return map[source] || 'steamKeyArtCapsule';
}

/* The preview website's capsule box (.pk-capsule) used to be permanently
   shaped like Steam's own official vertical-capsule spec (748×896,
   portrait) — fine when that was the only possible source, but Capsule
   Image (231×87) and Header Image (460×215) are both wide landscape
   shapes, and object-fit: cover would crop most of either one away to fill
   a tall portrait frame. Instead the box itself is sized to whichever
   source is currently selected (applied as an inline aspect-ratio style
   below, overriding .pk-capsule's default in style.css), and
   .pk-capsule-img uses object-fit: contain (style.css) rather than cover —
   together, the full asset is always shown uncropped, whatever shape it
   is, rather than being forced into a mismatched box.
   igdbCoverArt is 264×374 — IGDB's own "cover_big" image size (see
   buildSteamKeyArtEditSection's doc comment and _applySteamCapsuleFromCover
   in app.js), NOT Steam's 748×896 vertical-capsule spec used above; those
   two numbers describe two different things that happen to occupy the same
   preview-website box. Using 748/896 here (as this box briefly did) leaves
   the real 264×374 image proportionally narrower than the box, and since
   .pk-capsule-img uses object-fit: contain, that mismatch letterboxes with
   thick empty bars on the LEFT and RIGHT (top/bottom fill edge-to-edge,
   since height ends up the constraining dimension) — reported as "thick
   buffers to the left and right" that don't match the top/bottom. Using
   IGDB's actual 264/374 ratio here makes the box match the real image
   exactly, so object-fit: contain fills it edge-to-edge on every side. */
function _webCapsuleAspectRatio(source) {
  const map = { capsuleImage: '231 / 87', headerImage: '460 / 215', igdbCoverArt: '264 / 374' };
  return map[source] || map.igdbCoverArt;
}

// Placeholder-caption size label, matching whichever source is selected —
// kept alongside _webCapsuleAspectRatio so the caption's stated dimensions
// never drift out of sync with the box's actual shape.
function _webCapsuleSizeLabel(source) {
  const map = { capsuleImage: '231 &times; 87', headerImage: '460 &times; 215', igdbCoverArt: '264 &times; 374' };
  return map[source] || map.igdbCoverArt;
}

/* How far below the hero/main boundary the Factsheet section starts (see
   the factsheetHTML div below) — used to be a single fixed 120px
   (.pk-factsheet's CSS default in style.css), tuned only for IGDB Cover
   Art's tall portrait capsule box. Now that the capsule's actual height
   varies with the selected source (Capsule Image/Header Image are both
   far shorter, landscape boxes — see _webCapsuleAspectRatio above),
   leaving that same fixed 120px under a much shorter box would leave a
   big, unbalanced gap above the Factsheet heading instead of the same
   ~10px buffer the portrait case was tuned for. Each value below is that
   same formula worked out per source:
     margin-top = (box height / 2) + 10 (the established buffer)
                  - 22 (.pk-main's own padding-top, since margin-top is
                  measured from inside that padding, so it has to be
                  subtracted back out)
   where box height = 220 (the capsule's fixed width, matching .pk-capsule
   in style.css) × (asset height / asset width). E.g. for igdbCoverArt
   (264×374, IGDB's own cover_big size — see _webCapsuleAspectRatio above):
   220 × 374/264 = 311.67 tall, half = 155.83, + 10 - 22 = 143.83. */
function _webCapsuleFactsheetMarginTop(source) {
  const map = { capsuleImage: 29.43, headerImage: 39.41, igdbCoverArt: 143.83 };
  return map[source] || map.igdbCoverArt;
}

function buildWebSitePreviewSection() {
  const fd  = state.formData || {};
  const ups = state.uploads || {};
  const ws  = state.webSite || {};
  const accent = ws.accent || '#0EA5A4';

  const title = escHtml(fd.title || 'Your Game');
  // "Hook" defaults to (and stays synced with) the linked Steam store
  // page's own short_description (state.steamLocInfo.shortDescription,
  // cached by _applySteamAboutData in app.js) — NOT Game Details'
  // Description field, which is "About This Game"'s job below now; "Hook"
  // in Edit site details overrides it when set. With no Steam-linked
  // short_description available (no linked Steam page, or that page has
  // none), there's no fallback value at all — just the placeholder text.
  const steamShortDescription = (state.steamLocInfo && state.steamLocInfo.shortDescription) || '';
  const descRaw = (ws.description && ws.description.trim()) || steamShortDescription;
  const descFull = descRaw ? escHtml(descRaw).replace(/\n/g, '<br>') : 'Your Steam store page\'s short description will appear here once linked to a Steam page that has one — or set your own in the Hook field.';

  const shots = ups.screenshots || [];

  // Prepended to the hero/capsule placeholder captions below, only once the
  // user has actually typed a title in Game Details' About tab (fd.title —
  // unlike the `title` var above, this has no "Your Game" fallback, since an
  // empty placeholder shouldn't claim a title that hasn't been set yet).
  const placeholderTitleLine = fd.title ? `${escHtml(fd.title)}<br>` : '';

  // Hero banner — shows the uploaded image (state.uploads.steamKeyArtHero)
  // once set via Steam's "Select Key Art" section (Store Page Preview step —
  // see buildSteamKeyArtEditSection); falls back to the placeholder graphic
  // otherwise. Glowing + clickable like the four main sections (see
  // .pk-glowbox / pk-glow-pulse), opening Web's own read-only "Key Art" flip
  // modal (buildWebKeyArtEditSection), which links to Steam to manage it.
  const heroUpload = ups.steamKeyArtHero;
  const heroHTML = heroUpload ? `
    <div class="pk-hero pk-glowbox" id="pk-hero" onclick="openStorePreviewSection('web','webKeyArt')">
      <img src="${_screenshotSrc(heroUpload)}" alt="Hero banner" class="pk-hero-img">
      <div class="pk-hero-scrim"></div>
    </div>` : `
    <div class="pk-hero pk-glowbox" id="pk-hero" onclick="openStorePreviewSection('web','webKeyArt')">
      <span class="pk-hero-badge">Placeholder</span>
      <div class="pk-hero-icon-wrap">
        <svg class="pk-hero-icon" width="42" height="42" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2.5" y="4.5" width="19" height="15" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="8" cy="10" r="1.6" fill="currentColor"/>
          <path d="M21 15.5l-4.8-4.8-4 4-2.7-2.7-5.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="pk-hero-caption">${placeholderTitleLine}Hero<br>3840 &times; 1240</div>
      </div>
      <div class="pk-hero-scrim"></div>
    </div>`;

  // Preview URL is always derived from the game's title — "[gamename].shipmate.games" —
  // not user-editable, so it stays in sync with whatever the title is at the moment.
  const slug = (fd.title || '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'yourgame';
  const siteUrl = `${slug}.shipmate.games`;

  // Vertical capsule — a cover-art slot (748×896, matching Steam's own
  // vertical capsule spec) sized to the Factsheet column's width (matches
  // the accent underline under the "Factsheet" heading). Absolutely
  // positioned over the hero (see .pk-hero-wrap) so roughly half of it
  // overlaps the banner above — via a self-computing translateY(50%)
  // straddle rather than a hardcoded pixel offset (see .pk-capsule in
  // style.css), since the box's own height now varies by source (below);
  // the Factsheet's own top margin (see factsheetHTML/
  // _webCapsuleFactsheetMarginTop below) is computed per source too, so it
  // clears whichever height is currently in play with the same ~10px
  // buffer rather than the fixed gap tuned only for IGDB Cover Art's tall
  // case. Description isn't under the capsule at all, so its margin
  // doesn't need this per-source treatment. Shows whichever
  // of Steam's Key Art assets is currently selected as the capsule source
  // (state.webSite.capsuleSource — Capsule Image, Header Image, or IGDB
  // Cover Art, chosen via the selector in Web's "Key Art" section, see
  // _webCapsuleSourceField above), falling back to the placeholder
  // graphic if that asset hasn't been uploaded/auto-filled — same "Key
  // Art" flip modal as hero. Since this is read fresh from state.uploads
  // on every render (not cached), any change made in Steam's "Select Key
  // Art" section — a new upload, a removal, or a fresh auto-fill — shows
  // up here the next time this section renders, with no extra plumbing
  // needed. The box itself is sized to the selected source's own aspect
  // ratio (inline style below, via _webCapsuleAspectRatio) rather than
  // staying locked to IGDB Cover Art's portrait shape, and the image uses
  // object-fit: contain (style.css) instead of cover — together, the full
  // asset is always shown, never cropped, whichever of the three (very
  // differently-shaped) sources is picked.
  //
  // _webCapsuleAspectRatio's per-source value is only an initial best
  // guess, used for the placeholder box (there's no real image there to
  // measure) and as the first paint before a real image finishes loading.
  // For an actual uploaded/fetched image, onload="_pkSyncCapsuleAspect(this)"
  // (app.js) immediately overrides it with the image's own real
  // naturalWidth/naturalHeight — IGDB's own "cover_big" transform is
  // documented as 264×374, but doesn't reliably deliver that exact ratio
  // for every game's actual cover art (confirmed live: some covers render
  // with thick uneven letterbox bars under a fixed 264/374 box, the
  // opposite bars depending on whether that game's real cover happens to
  // be wider or narrower than the guess). Measuring the real, already-
  // loaded image is the only way to guarantee the box always matches
  // exactly, whatever any individual game's actual proportions turn out to
  // be — no static guess (264/374, 748/896, or otherwise) can cover every
  // case. _pkSyncCapsuleAspect also recomputes the Factsheet's margin-top
  // to match, since that's derived from the same (otherwise-guessed) box
  // height (see _webCapsuleFactsheetMarginTop below).
  const capsuleUpload = ups[_webCapsuleSourceField(ws.capsuleSource)];
  const capsuleAspect = _webCapsuleAspectRatio(ws.capsuleSource);
  const capsuleHTML = capsuleUpload ? `
    <div class="pk-capsule pk-glowbox" id="pk-capsule" style="aspect-ratio:${capsuleAspect};" onclick="openStorePreviewSection('web','webKeyArt')">
      <img src="${_screenshotSrc(capsuleUpload)}" alt="Vertical capsule" class="pk-capsule-img" onload="_pkSyncCapsuleAspect(this)">
    </div>` : `
    <div class="pk-capsule pk-glowbox" id="pk-capsule" style="aspect-ratio:${capsuleAspect};" onclick="openStorePreviewSection('web','webKeyArt')">
      <span class="pk-capsule-badge">Placeholder</span>
      <svg class="pk-capsule-icon" width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.5" y="4.5" width="19" height="15" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="8" cy="10" r="1.6" fill="currentColor"/>
        <path d="M21 15.5l-4.8-4.8-4 4-2.7-2.7-5.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div class="pk-capsule-caption">${placeholderTitleLine}Capsule<br>${_webCapsuleSizeLabel(ws.capsuleSource)}</div>
    </div>`;

  // Sub-section header (bold, no accent) wrapping already-built inner HTML —
  // renders nothing when there's no content, so a main section's own header
  // can still show even when every one of its sub-sections is empty.
  const pkSub = (label, innerHtml) => innerHtml
    ? `<h3 class="pk-h3">${escHtml(label)}</h3>${innerHtml}`
    : '';

  // Developer (+ Location, folded in as a line under the developer name
  // rather than its own sub-section — see devNameValue below), Website and
  // Email (from the "Factsheet" and "About" groups in Edit site details,
  // respectively) — each of these is its own sub-section, independently
  // optional. Developer always shows (with a muted dash placeholder when
  // empty), unlike the other optional sub-sections.
  const devLocationLine = ws.basedIn ? `<p class="pk-p">Based in ${escHtml(ws.basedIn)}</p>` : '';

  // Turns a raw URL-ish string (with or without a scheme) into a safe
  // absolute href, same convention as the existing About "Website" field
  // below (websiteHref) — prepend https:// when the developer typed a bare
  // domain rather than a full URL.
  const _pkLinkHref = raw => /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  // "Links" sub-section (Factsheet > Developer > Links in the edit form —
  // see _wsFactsheetFieldsHTML below): Official Website, a single URL field
  // auto-populated from Steam's appdetails 'website' field when available
  // (see _applySteamAboutData in app.js), plus any number of social-media
  // links (state.webSite.links, each a { id, name, url }) — ALSO
  // auto-populated when available, but scraped from the Steam store page's
  // own HTML rather than the appdetails JSON API (see _applySteamSocialLinks
  // in app.js), since Steam's official API has no field for these at all.
  // Freely add/removed/edited afterward either way, via
  // addWebLink/removeWebLink/setWebLinkField in app.js. Both render as
  // button-style links (.pk-link-btn, style.css)
  // rather than plain inline text, since these read as calls to action
  // rather than incidental info the way the About section's own Website/
  // Contact sub-sections do. Distinct from ws.website (the About group's
  // "Website" field, the studio's own general site) — this is the GAME's
  // own official website. Each is its own <span class="pk-dev-links"> row
  // (display:flex via the CSS class, same convention platformsValue below
  // uses for its own icon wrapper) so Official Website and the social links
  // wrap independently rather than interleaving into one run if both are
  // present — a <span>, not a <div>, for the same reason platformsValue
  // uses one: this whole Factsheet section is itself a <div id="pk-factsheet">
  // and this codebase's own render tests locate a main section by matching
  // to its FIRST same-tag closing tag, so a nested <div> here would close
  // that match early and hide everything rendered after it.
  const officialWebsiteRaw = ws.officialWebsite ? ws.officialWebsite.trim() : '';
  const officialWebsiteBlock = officialWebsiteRaw ? `
    <span class="pk-dev-links"><a href="${escHtml(_pkLinkHref(officialWebsiteRaw))}" target="_blank" rel="noopener" class="pk-link-btn pk-link-btn--official" onclick="event.stopPropagation()">Official Website</a></span>` : '';

  const socialLinks = (ws.links || []).filter(l => l && l.name && l.name.trim() && l.url && l.url.trim());
  const socialLinksBlock = socialLinks.length ? `
    <span class="pk-dev-links">${socialLinks.map(l => `<a href="${escHtml(_pkLinkHref(l.url.trim()))}" target="_blank" rel="noopener" class="pk-link-btn pk-link-btn--social" onclick="event.stopPropagation()">${escHtml(l.name.trim())}</a>`).join('')}</span>` : '';

  const devNameValue = `<p class="pk-p">${ws.developer ? escHtml(ws.developer) : '<span class="pk-muted">—</span>'}</p>${devLocationLine}${officialWebsiteBlock}${socialLinksBlock}`;

  const websiteRaw = ws.website ? ws.website.trim() : '';
  const websiteDomain = websiteRaw
    ? escHtml(websiteRaw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, ''))
    : '';
  const websiteHref = websiteRaw ? (/^https?:\/\//i.test(websiteRaw) ? websiteRaw : `https://${websiteRaw}`) : '';
  const websiteValue = websiteDomain
    ? `<p class="pk-p"><a href="${escHtml(websiteHref)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${websiteDomain}</a></p>`
    : '';

  const emailValue = ws.email ? `<p class="pk-p">${escHtml(ws.email.trim())}</p>` : '';

  // Platforms — synced read-only from the platforms selected elsewhere in
  // Shipmate (state.activePlatforms), not a separate field on state.webSite.
  // Rendered as icons rather than platform-name text, no tooltip — plain,
  // silent icons. Uses platformIcon(pid, size, 'white') — the same
  // monochrome/single-tone icon variant (and small neutral badge treatment:
  // see .pk-platform-icon in style.css, matching .inactive-card-icon's
  // recipe) used for the Dashboard's platform cards elsewhere in Shipmate,
  // rather than the full-color brand-logo variant used everywhere else in
  // this preview website.
  // Note: this wrapper is a <span> (with display:flex), not a <div> — the
  // Factsheet/Description main sections are themselves <div id="pk-...">
  // wrappers, and this codebase's own render tests locate a main section
  // by matching to its FIRST same-tag closing tag; a nested <div> here
  // would close that match early and hide everything after it (Genres).
  // <section>-wrapped main sections (Media/About) don't have this hazard.
  const activePids = PLATFORM_ORDER.filter(pid => state.activePlatforms.has(pid));
  const platformsValue = activePids.length ? `
    <span class="pk-platform-icons" style="display:flex;flex-wrap:wrap;gap:8px;">
      ${activePids.map(pid => `
        <span class="pk-platform-icon">${platformIcon(pid, 18, 'white')}</span>`).join('')}
    </span>` : '';

  const genresValue = (ws.genres && ws.genres.trim()) ? `<p class="pk-p">${escHtml(ws.genres.trim())}</p>` : '';

  // Publisher — a plain optional text field (own sub-section, unlike
  // Location which is folded into Developer above). Auto-populated, when the
  // picked title links to a Steam page, from Steam's appdetails 'publishers'
  // list, joined — see _applySteamAboutData in app.js — the same
  // official-API-sourced treatment as Developer (from 'developers') and
  // Genres (from 'genres') already get. Placed between Developer and Release
  // Date to mirror the edit form's own field order (_wsFactsheetFieldsHTML,
  // where Publisher sits between Location and Release Date).
  const publisherValue = (ws.publisher && ws.publisher.trim()) ? `<p class="pk-p">${escHtml(ws.publisher.trim())}</p>` : '';

  // Plain text field (state.webSite.releaseDate — see its state.js comment
  // for why this is no longer synced from formData.releaseDate). No value
  // set (or cleared) reads as "Coming soon" rather than being left blank —
  // so this sub-section always has content, same fallback as before.
  const releaseDateValue = `<p class="pk-p">${(ws.releaseDate && ws.releaseDate.trim()) ? escHtml(ws.releaseDate.trim()) : 'Coming soon'}</p>`;

  // Gap above Factsheet tightens/loosens per the capsule's actual height
  // (see _webCapsuleFactsheetMarginTop above) — a shorter landscape
  // capsule (Capsule Image/Header Image) no longer leaves the same big
  // gap the tall IGDB Cover Art box needed.
  const factsheetMarginTop = _webCapsuleFactsheetMarginTop(ws.capsuleSource);
  const factsheetHTML = `
    <div class="pk-factsheet pk-mainsection" id="pk-factsheet" style="margin-top:${factsheetMarginTop}px;" onclick="openStorePreviewSection('web','webFactsheet')">
      <h2 class="pk-h2">Factsheet</h2>
      ${pkSub('Developer', devNameValue)}
      ${pkSub('Publisher', publisherValue)}
      ${pkSub('Release Date', releaseDateValue)}
      ${pkSub('Platforms', platformsValue)}
      ${pkSub('Genres', genresValue)}
    </div>`;

  // "Hook" is Steam's own short_description (with its placeholder
  // fallback when unavailable), so it always has content.
  const hookValue = `<p class="pk-p">${descFull}</p>`;

  // "About This Game" defaults to (and stays synced with) Game Details'
  // Description field — the reverse of "Hook" above, which held this exact
  // "default + override" role before switching to Steam's short_description
  // (see state.webSite.description's comment in state.js). Unlike Hook,
  // this has no placeholder fallback — pkSub below renders nothing at all
  // when both this override and Game Details' Description are empty, same
  // as every other optional sub-section on this page.
  const aboutGameRaw = (ws.aboutGame && ws.aboutGame.trim()) || fd.description || '';
  // Blank-line-aware (see _pkParagraphs above), unlike every other
  // multi-line field on this page (Hook is single-line; History still uses
  // the older _pkLines/one-line-per-paragraph treatment) — this is the one
  // field where preserving Steam's own paragraph spacing (and giving manual
  // typing the same two-level spacing) actually matters, per this
  // project's line-spacing discussion.
  const aboutGameParas = _pkParagraphs(aboutGameRaw);
  const aboutGameValue = aboutGameParas.length
    ? aboutGameParas.map(lines => `<p class="pk-p">${lines.map(escHtml).join('<br>')}</p>`).join('')
    : '';

  const historyLines = _pkLines(ws.history);
  const historyValue = historyLines.length
    ? `<p class="pk-p">${historyLines.map(escHtml).join('</p><p class="pk-p">')}</p>`
    : '';

  const descriptionHTML = `
    <div class="pk-description pk-mainsection" id="pk-description" onclick="openStorePreviewSection('web','webDescription')">
      <h2 class="pk-h2">Description</h2>
      ${pkSub('Hook', hookValue)}
      ${pkSub('About This Game', aboutGameValue)}
      ${pkSub('History', historyValue)}
    </div>`;

  // Trailers — sourced from the same "Trailer" asset set in Shipmate's
  // Assets step (Onboarding tab 2), not a separate webSite field: either a
  // pasted video URL (fd.trailerUrl), an uploaded file (ups.trailer, shown
  // as plain text since there's no playable source in this prototype), or
  // an auto-filled Steam trailer (ups.steamTrailer, shown via the same
  // compact clickable thumbnail as the Assets tab — see
  // _steamTrailerPreviewHTML above). fd.trailerUrl takes priority over
  // ups.trailer if both happen to be set, matching the Assets tab's own
  // "manual entry wins the primary slot" convention — but the Steam
  // trailer is purely additive on top of whichever of those (if either) is
  // showing, same as it is in the Assets tab, since it's a separate,
  // independent source rather than a third alternative for the same slot.
  const uploadedTrailer = ups.trailer || null;
  const ytId = _pkYouTubeId(fd.trailerUrl);
  // event.stopPropagation() on both the YouTube embed's wrapper div and the
  // manual link-out matters here too — same reasoning as the Steam trailer
  // preview below: this whole block sits inside #pk-media, which flips to
  // its own edit modal on click, so any click landing on the wrapper itself
  // (rather than passing through to the iframe's separate document, which
  // can't bubble here anyway) must not also trigger that flip.
  const manualTrailerValue = fd.trailerUrl ? (ytId ? `
    <div class="pk-video-frame pk-video-embed" onclick="event.stopPropagation()">
      <iframe src="https://www.youtube.com/embed/${ytId}" title="${title} — Trailer"
              frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen></iframe>
    </div>` : `
    <div class="pk-video-frame">
      <a href="${escHtml(fd.trailerUrl)}" target="_blank" rel="noopener" class="pk-video-link" onclick="event.stopPropagation()">
        <span class="pk-video-play">▶</span>
        <span>${title} — Trailer</span>
      </a>
    </div>`) : uploadedTrailer ? `
    <p class="pk-p">🎬 ${escHtml(uploadedTrailer.name)} <span class="pk-muted">(uploaded — preview not available in this prototype)</span></p>` : '';
  const trailersValue = manualTrailerValue + _steamTrailerPreviewHTML(ups.steamTrailer);

  // Each cell both opens a full-size lightbox (openScreenshotLightbox in
  // app.js) AND stops the click from bubbling to #pk-media's own onclick
  // below — without stopPropagation, clicking a screenshot to enlarge it
  // would also flip the whole Media section into edit mode underneath the
  // lightbox, same reasoning as the trailer previews above/below.
  const screenshotsValue = shots.length ? `
    <div class="pk-image-grid">
      ${shots.map(s => `<div class="pk-image-cell" onclick="event.stopPropagation(); openScreenshotLightbox(this)"><img src="${_screenshotSrc(s)}" alt="${escHtml(s.name || 'Screenshot')}"></div>`).join('')}
    </div>` : '';

  const mediaHTML = `
    <section class="pk-section pk-mainsection" id="pk-media" onclick="openStorePreviewSection('web','webMedia')">
      <h2 class="pk-h2">Media</h2>
      ${pkSub('Screenshots', screenshotsValue)}
      ${pkSub('Trailers', trailersValue)}
    </section>`;

  const aboutDevLines = _pkLines(ws.aboutDev);
  const aboutDevValue = aboutDevLines.length
    ? `<p class="pk-p">${aboutDevLines.map(escHtml).join('</p><p class="pk-p">')}</p>`
    : '';

  const aboutHTML = `
    <section class="pk-section pk-mainsection" id="pk-about" onclick="openStorePreviewSection('web','webAbout')">
      <h2 class="pk-h2">About</h2>
      ${pkSub('About the Developer', aboutDevValue)}
      ${pkSub('Website', websiteValue)}
      ${pkSub('Contact', emailValue)}
    </section>`;

  return `
    <div class="web-preview-wrap" style="padding:4px 2px 8px;">
      <p style="margin:0 0 12px;color:var(--text-muted,#6b7280);font-size:13px;line-height:1.5;">
        A press-kit style page for your game, built from your game details and the fields below. Factsheet, Description, Media, and About always show — fill in more of the optional fields in <strong>Edit site details</strong> to fill out their sub-sections.
      </p>

      <div class="pk-browser-frame">
        <!-- fake browser chrome -->
        <div class="pk-browser-chrome">
          <span style="width:10px;height:10px;border-radius:50%;background:#ff5f57;"></span>
          <span style="width:10px;height:10px;border-radius:50%;background:#febc2e;"></span>
          <span style="width:10px;height:10px;border-radius:50%;background:#28c840;"></span>
          <span class="pk-browser-url">https://${escHtml(siteUrl)}</span>
        </div>

        <div class="pk-page" style="--pk-accent:${accent};">
          <div class="pk-hero-wrap">
            ${heroHTML}
            ${capsuleHTML}
          </div>
          <div class="pk-main">
            <section class="pk-section pk-fact-desc-grid">
              ${factsheetHTML}
              ${descriptionHTML}
            </section>
            ${mediaHTML}
            ${aboutHTML}
          </div>
        </div>
      </div>

      <button class="btn btn-ghost" style="margin-top:14px;width:100%;" onclick="openStorePreviewSection('web','siteInfo')">
        Edit site details ›
      </button>
    </div>`;
}

/* Shared field renderer for the "Edit site details" panel and the four
   focused per-section modals opened by clicking a glow box on the preview
   website (buildWeb{Factsheet,Description,Media,About}EditSection below) —
   both presentations use this exact markup, so a field looks identical
   wherever it's edited. */
function _wsField(ws, labelText, key, placeholder, opts) {
  opts = opts || {};
  const val = escHtml(ws[key] || '');
  if (opts.textarea) {
    return `
      <label class="task-content-label" style="display:block;margin-bottom:6px;">${labelText}</label>
      <textarea class="qs-input" rows="${opts.rows || 3}" style="width:100%;margin-bottom:16px;resize:vertical;"
                placeholder="${escHtml(placeholder)}"
                oninput="setWebSiteField('${key}', this.value)">${val}</textarea>`;
  }
  return `
    <label class="task-content-label" style="display:block;margin-bottom:6px;">${labelText}</label>
    <input type="text" class="qs-input" style="width:100%;margin-bottom:16px;" value="${val}"
           placeholder="${escHtml(placeholder)}" oninput="setWebSiteField('${key}', this.value)">`;
}

/* One row of the Links sub-section's social-link list (state.webSite.links,
   each a { id, name, url } — see addWebLink/removeWebLink/setWebLinkField in
   app.js): a name field and a URL field side by side, plus a delete button.
   Mirrors _wsField's own "mutate on oninput, no re-render" convention (see
   setWebLinkField) so typing in either field doesn't lose focus — only
   Add/Remove (structural changes) re-render the modal. link.id is
   program-generated (generateId('link'), state.js) so it's always a plain
   alnum/underscore string, safe to inline into the onclick attributes
   below without escaping. */
function _wsLinkRowHTML(link) {
  return `
    <div class="pk-link-edit-row" style="display:flex;gap:8px;margin-bottom:8px;">
      <input type="text" class="qs-input" style="flex:1;" value="${escHtml(link.name || '')}"
             placeholder="Social media name" oninput="setWebLinkField('${link.id}', 'name', this.value)">
      <input type="text" class="qs-input" style="flex:2;" value="${escHtml(link.url || '')}"
             placeholder="https://..." oninput="setWebLinkField('${link.id}', 'url', this.value)">
      <button class="btn btn-ghost btn-sm" type="button" style="flex:none;"
              onclick="removeWebLink('${link.id}')" title="Remove" aria-label="Remove link">✕</button>
    </div>`;
}

/* Factsheet fields: Developer, Location, Links (Official Website + any
   number of added social links), Publisher, Release Date, Platforms,
   Genres. Platforms is synced read-only from elsewhere in Shipmate, not
   stored on state.webSite. Publisher/Official Website/Release Date are
   auto-populated (when the picked title links to a Steam page) from
   Steam's appdetails 'publishers' list / 'website' / 'release_date' fields
   respectively — see _applySteamAboutData in app.js — same as
   Developer/Genres above/below them, but the developer can still freely
   edit any of them afterward like any other plain text field (Release Date
   used to be a native date-picker input synced from the shared
   formData.releaseDate field elsewhere in Shipmate — changed to a plain
   text field by request, since a store listing's release date is often
   free text like "Coming Soon" or "Q1 2027", not always an exact date).
   The social links list (state.webSite.links) is ALSO auto-populated when
   a Steam page is linked, but from a different source entirely — the
   store page's own HTML, not the appdetails JSON API, which has no field
   for these at all — see _applySteamSocialLinks in app.js and the state.js
   comment above webSite.links; the developer can still freely
   add/remove/edit rows afterward via addWebLink/removeWebLink/
   setWebLinkField in app.js. */
function _wsFactsheetFieldsHTML(ws) {
  const platformNames = PLATFORM_ORDER.filter(pid => state.activePlatforms.has(pid)).map(pid => PK_PLATFORM_LABELS[pid] || pid);
  const platformsText = platformNames.length ? platformNames.join(', ') : 'No platforms selected yet';
  return `
    ${_wsField(ws, 'Developer', 'developer', 'Your studio name')}
    ${_wsField(ws, 'Location', 'basedIn', 'Your general location')}

    <label class="task-content-label" style="display:block;margin-bottom:6px;">Links</label>
    ${_wsField(ws, 'Official Website', 'officialWebsite', 'Auto-filled from Steam when available')}
    ${(ws.links || []).map(_wsLinkRowHTML).join('')}
    <button class="btn btn-ghost btn-sm" type="button" style="margin-bottom:16px;" onclick="addWebLink()">Add</button>

    ${_wsField(ws, 'Publisher', 'publisher', 'Auto-filled from Steam when available')}

    ${_wsField(ws, 'Release Date', 'releaseDate', 'Auto-filled from Steam when available, e.g. "Feb 18, 2026" or "Coming Soon"')}

    <label class="task-content-label" style="display:block;margin-bottom:6px;">Platforms</label>
    <div class="qs-input" style="width:100%;margin-bottom:2px;background:var(--bg-subtle,#f4f4f5);color:var(--text-muted,#6b7280);cursor:default;">${escHtml(platformsText)}</div>
    <p class="pk-muted" style="margin:4px 0 16px;font-size:12px;">Set via your platform selection elsewhere in Shipmate.</p>

    ${_wsField(ws, 'Genres', 'genres', 'e.g. Roguelike, Deckbuilder')}`;
}

/* Description fields: Hook, About This Game, History (labeled "Studio/Game
   History" until renamed by request — still backs the same 'history' field
   and the same "shown under Description" copy on the preview website). */
function _wsDescriptionFieldsHTML(ws) {
  return `
    ${_wsField(ws, 'Hook', 'description', 'Defaults to your Steam store page\'s short description, when linked to one', { textarea: true, rows: 4 })}
    ${_wsField(ws, 'About This Game', 'aboutGame', 'Defaults to the Description field in Game Details — leave a blank line between paragraphs', { textarea: true, rows: 4 })}
    ${_wsField(ws, 'History', 'history', 'One paragraph per line — shown under Description', { textarea: true, rows: 4 })}`;
}

/* Media fields: Trailers, Screenshots. Both are read-only summaries of the
   same "Trailer"/"Screenshots" assets managed in Shipmate's Assets step
   (Onboarding tab 2) — "Manage" jumps there via openAssetsFromWebEdit.
   `source` is passed straight through to openAssetsFromWebEdit so its
   "Save & Return" button (Assets tab footer) knows which of the two
   places this got called from — this function is shared by both
   buildWebSiteEditSection ('siteInfo', the combined Site Details panel)
   and buildWebMediaEditSection ('webMedia', the standalone Media flip
   modal), so it can't hardcode a single return target itself.
   The Trailers summary reflects every applicable source, not just one —
   fd.trailerUrl/state.uploads.trailer (Shipmate's own manual entry) and
   state.uploads.steamTrailer (auto-filled from the linked Steam page's own
   trailer, see _steamTrailerFromMovies in app.js) are independent and can
   coexist, same as they do in the Assets tab itself, so this joins
   whichever apply rather than treating them as mutually exclusive. */
function _wsMediaFieldsHTML(fd, source) {
  const shotsCount = (state.uploads?.screenshots || []).length;
  const uploadedTrailer = state.uploads?.trailer || null;
  const steamTrailer = state.uploads?.steamTrailer || null;
  const trailerParts = [];
  if (fd.trailerUrl) trailerParts.push('Trailer URL set');
  if (uploadedTrailer) trailerParts.push(`Trailer uploaded: ${uploadedTrailer.name}`);
  if (steamTrailer) trailerParts.push('Steam trailer added');
  const trailerSummary = trailerParts.length ? trailerParts.join(' · ') : 'No trailer added yet';
  return `
    <label class="task-content-label" style="display:block;margin-bottom:6px;">Trailers</label>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px;padding:10px 12px;border:1px solid var(--border-subtle,#e5e7eb);border-radius:8px;">
      <span style="font-size:13px;color:var(--text-muted,#6b7280);">${escHtml(trailerSummary)}</span>
      <button class="btn btn-ghost btn-sm" type="button" onclick="closeStepModal(); openAssetsFromWebEdit('${source}');">Manage ›</button>
    </div>

    <label class="task-content-label" style="display:block;margin-bottom:6px;">Screenshots</label>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px;padding:10px 12px;border:1px solid var(--border-subtle,#e5e7eb);border-radius:8px;">
      <span style="font-size:13px;color:var(--text-muted,#6b7280);">${shotsCount} screenshot${shotsCount === 1 ? '' : 's'} from your uploads shown on the preview.</span>
      <button class="btn btn-ghost btn-sm" type="button" onclick="closeStepModal(); openAssetsFromWebEdit('${source}');">Manage ›</button>
    </div>`;
}

/* About fields: About the Developer, Website, Email. */
function _wsAboutFieldsHTML(ws) {
  return `
    ${_wsField(ws, 'About the Developer', 'aboutDev', 'One paragraph per line — a short bio about your studio', { textarea: true, rows: 4 })}
    ${_wsField(ws, 'Website', 'website', 'yourstudio.com')}
    ${_wsField(ws, 'Email', 'email', 'hello@yourstudio.com')}`;
}

function buildWebSiteEditSection() {
  const fd = state.formData || {};
  const ws = state.webSite || {};
  const accent = ws.accent || '#0EA5A4';
  const swatches = ['#0EA5A4', '#4B7BEC', '#8B5CF6', '#EC4899', '#F59E0B', '#22C55E'];

  return `
    <div class="qs-section" style="padding:4px 2px;">
      <p style="margin:0 0 16px;color:var(--text-muted,#6b7280);font-size:13px;line-height:1.5;">
        Customize the press page. Changes appear in the preview when you return — list fields (one entry per line) only show up once you add something.
      </p>

      <div class="pk-edit-group-label">Basics</div>
      <label class="task-content-label" style="display:block;margin-bottom:8px;">Accent color</label>
      <div style="display:flex;gap:10px;margin-bottom:20px;">
        ${swatches.map(c => `
          <button onclick="setWebAccent('${c}')" title="${c}"
                  style="width:30px;height:30px;border-radius:50%;background:${c};cursor:pointer;
                         border:2px solid ${c.toLowerCase() === accent.toLowerCase() ? '#fff' : 'transparent'};
                         box-shadow:0 0 0 ${c.toLowerCase() === accent.toLowerCase() ? '2px ' + c : '1px rgba(0,0,0,0.15)'};"></button>
        `).join('')}
      </div>

      <div class="pk-edit-group-label">Factsheet</div>
      ${_wsFactsheetFieldsHTML(ws)}

      <div class="pk-edit-group-label">Description</div>
      ${_wsDescriptionFieldsHTML(ws)}

      <div class="pk-edit-group-label">Media</div>
      ${_wsMediaFieldsHTML(fd, 'siteInfo')}

      <div class="pk-edit-group-label">About</div>
      ${_wsAboutFieldsHTML(ws)}
    </div>`;
}

/* Focused edit modals opened by clicking a glow box around one of the
   preview website's four main sections — same field markup as the matching
   group in buildWebSiteEditSection (via the shared _ws*FieldsHTML helpers
   above), just without the other groups. The flip modal's own header shows
   the section name (see FLIP_LABELS), so these don't repeat a group label. */
function buildWebFactsheetEditSection() {
  const ws = state.webSite || {};
  return `
    <div class="qs-section" style="padding:4px 2px;">
      <p style="margin:0 0 16px;color:var(--text-muted,#6b7280);font-size:13px;line-height:1.5;">
        Edit the Factsheet fields shown on your preview website.
      </p>
      ${_wsFactsheetFieldsHTML(ws)}
    </div>`;
}

function buildWebDescriptionEditSection() {
  const ws = state.webSite || {};
  return `
    <div class="qs-section" style="padding:4px 2px;">
      <p style="margin:0 0 16px;color:var(--text-muted,#6b7280);font-size:13px;line-height:1.5;">
        Edit the Description fields shown on your preview website.
      </p>
      ${_wsDescriptionFieldsHTML(ws)}
    </div>`;
}

function buildWebMediaEditSection() {
  const fd = state.formData || {};
  return `
    <div class="qs-section" style="padding:4px 2px;">
      <p style="margin:0 0 16px;color:var(--text-muted,#6b7280);font-size:13px;line-height:1.5;">
        Edit the Media fields shown on your preview website.
      </p>
      ${_wsMediaFieldsHTML(fd, 'webMedia')}
    </div>`;
}

function buildWebAboutEditSection() {
  const ws = state.webSite || {};
  return `
    <div class="qs-section" style="padding:4px 2px;">
      <p style="margin:0 0 16px;color:var(--text-muted,#6b7280);font-size:13px;line-height:1.5;">
        Edit the About fields shown on your preview website.
      </p>
      ${_wsAboutFieldsHTML(ws)}
    </div>`;
}

/* Key Art fields: Capsule Image, Header Image, IGDB Cover Art, Library
   Hero (alphabetical, matching buildSteamKeyArtEditSection's own order) —
   read-only summaries of the same assets managed in Steam's "Select Key
   Art" section (Store Page Preview step, see buildSteamKeyArtEditSection),
   same relationship as _wsMediaFieldsHTML's Trailers/Screenshots rows have
   with Shipmate's Assets step. "Manage" jumps to Steam via
   openSteamKeyArtFromWebEdit. */
function _wsKeyArtFieldsHTML() {
  const ups = state.uploads || {};
  const capsuleImageSummary = ups.steamCapsuleImage ? `Uploaded: ${ups.steamCapsuleImage.name}` : 'No capsule image added yet';
  const headerImageSummary  = ups.steamHeaderImage  ? `Uploaded: ${ups.steamHeaderImage.name}`  : 'No header image added yet';
  const capsuleSummary = ups.steamKeyArtCapsule ? `Uploaded: ${ups.steamKeyArtCapsule.name}` : 'No IGDB cover art added yet';
  const heroSummary    = ups.steamKeyArtHero    ? `Uploaded: ${ups.steamKeyArtHero.name}`    : 'No library hero added yet';
  return `
    <label class="task-content-label" style="display:block;margin-bottom:6px;">Capsule Image</label>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px;padding:10px 12px;border:1px solid var(--border-subtle,#e5e7eb);border-radius:8px;">
      <span style="font-size:13px;color:var(--text-muted,#6b7280);">${escHtml(capsuleImageSummary)}</span>
      <button class="btn btn-ghost btn-sm" type="button" onclick="closeStepModal(); openSteamKeyArtFromWebEdit();">Manage ›</button>
    </div>

    <label class="task-content-label" style="display:block;margin-bottom:6px;">Header Image</label>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px;padding:10px 12px;border:1px solid var(--border-subtle,#e5e7eb);border-radius:8px;">
      <span style="font-size:13px;color:var(--text-muted,#6b7280);">${escHtml(headerImageSummary)}</span>
      <button class="btn btn-ghost btn-sm" type="button" onclick="closeStepModal(); openSteamKeyArtFromWebEdit();">Manage ›</button>
    </div>

    <label class="task-content-label" style="display:block;margin-bottom:6px;">IGDB Cover Art</label>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px;padding:10px 12px;border:1px solid var(--border-subtle,#e5e7eb);border-radius:8px;">
      <span style="font-size:13px;color:var(--text-muted,#6b7280);">${escHtml(capsuleSummary)}</span>
      <button class="btn btn-ghost btn-sm" type="button" onclick="closeStepModal(); openSteamKeyArtFromWebEdit();">Manage ›</button>
    </div>

    <label class="task-content-label" style="display:block;margin-bottom:6px;">Library Hero</label>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px;padding:10px 12px;border:1px solid var(--border-subtle,#e5e7eb);border-radius:8px;">
      <span style="font-size:13px;color:var(--text-muted,#6b7280);">${escHtml(heroSummary)}</span>
      <button class="btn btn-ghost btn-sm" type="button" onclick="closeStepModal(); openSteamKeyArtFromWebEdit();">Manage ›</button>
    </div>`;
}

/* Key Art fields: Capsule Image, Header Image, IGDB Cover Art, Library
   Hero — all four are managed from Steam's Store Page Preview, not here
   (see _wsKeyArtFieldsHTML), and any change made there (upload, removal,
   or auto-fill) is reflected on the preview website the next time it
   renders, since buildWebSitePreviewSection always reads the current
   upload state fresh rather than a cached copy. Library Hero is always
   the preview website's hero placeholder; the capsule placeholder's
   source is a choice among the other three (see the selector below,
   backed by state.webSite.capsuleSource / setWebCapsuleSource in app.js /
   _webCapsuleSourceField above buildWebSitePreviewSection) — defaulting
   to IGDB Cover Art, this section's original sole capsule source, so
   existing games don't see their preview capsule change without an
   explicit choice. */
function buildWebKeyArtEditSection() {
  const source = (state.webSite && state.webSite.capsuleSource) || 'igdbCoverArt';
  const CAPSULE_SOURCE_OPTIONS = [
    { value: 'capsuleImage', label: 'Capsule Image' },
    { value: 'headerImage',  label: 'Header Image'  },
    { value: 'igdbCoverArt', label: 'IGDB Cover Art' },
  ];
  return `
    <div class="qs-section" style="padding:4px 2px;">
      <p style="margin:0 0 16px;color:var(--text-muted,#6b7280);font-size:13px;line-height:1.5;">
        Key art is managed from the Steam Store platform's Store Page Preview — uploading it there also updates this preview website.
      </p>

      <div class="form-group" style="margin-bottom:20px;">
        <label class="task-content-label" style="display:block;margin-bottom:6px;">Preview Website Capsule Image</label>
        <div class="asset-guidance" style="margin-bottom:8px;">Choose which Key Art asset appears as the capsule image on your preview website.</div>
        <select class="form-input" onchange="setWebCapsuleSource(this.value)">
          ${CAPSULE_SOURCE_OPTIONS.map(o => `<option value="${o.value}" ${source === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
        </select>
      </div>

      ${_wsKeyArtFieldsHTML()}
    </div>`;
}

function buildDocPaneContent() {
  return `
    <div class="doc-pane-header">
      <div class="doc-pane-title">Documentation</div>
      <div class="doc-pane-subtitle">Platform guidelines &amp; requirements</div>
    </div>
    <div class="doc-pane-body">

      <div class="doc-section" id="doc-section-parentalControls">
        <div class="doc-section-label">Parental Controls</div>
        <p class="doc-section-text">Tools allowing parents to monitor or restrict a child's in-app access — including content filtering, usage limits, or purchase restrictions.</p>
        <p class="doc-section-text">If your app includes any of these controls, select <strong>Yes</strong>. This may affect your content rating but does not automatically restrict your app to specific age groups.</p>
        <a class="doc-link" href="https://developer.apple.com/documentation/family_controls" target="_blank" rel="noopener">Apple Family Controls API ↗</a>
      </div>

      <div class="doc-section" id="doc-section-ageAssurance">
        <div class="doc-section-label">Age Assurance</div>
        <p class="doc-section-text">Confirms a user's age meets requirements for specific content — including API checks, age estimation, or government ID verification.</p>
        <p class="doc-section-text">The EU Digital Services Act (DSA) now requires platforms serving minors to implement robust age verification. If your app targets DSA-regulated markets, select <strong>Yes</strong> if you perform any form of age verification.</p>
        <a class="doc-link" href="https://developer.apple.com/documentation/devicecheck" target="_blank" rel="noopener">Apple DeviceCheck API ↗</a>
      </div>

      <div class="doc-section" id="doc-section-contentRating">
        <div class="doc-section-label">Content Rating</div>
        <p class="doc-section-text">Apple uses the IARC system to assign age ratings. Your answers determine ratings applied globally across the App Store — they cannot be customized per region.</p>
        <a class="doc-link" href="https://developer.apple.com/help/app-store-connect/reference/age-ratings" target="_blank" rel="noopener">App Store age rating guidelines ↗</a>
      </div>

      <div class="doc-section" id="doc-section-dataPrivacy">
        <div class="doc-section-label">Data Privacy</div>
        <p class="doc-section-text">Apple requires all apps to disclose data collection practices via a privacy nutrition label before each release. Labels cannot be edited while a review is in progress.</p>
        <a class="doc-link" href="https://developer.apple.com/app-store/app-privacy-details/" target="_blank" rel="noopener">App Privacy Details ↗</a>
      </div>

      <div class="doc-section" id="doc-section-exportCompliance">
        <div class="doc-section-label">Export Compliance</div>
        <p class="doc-section-text">Apps using encryption must comply with US export regulations (EAR). Most apps using standard HTTPS or OS-level encryption qualify for an exemption under Section 740.17(b)(1).</p>
        <a class="doc-link" href="https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations" target="_blank" rel="noopener">Encryption export regulations ↗</a>
      </div>

      <div class="doc-section" id="doc-section-iap">
        <div class="doc-section-label">In-App Purchases</div>
        <p class="doc-section-text">Any content, features, or subscriptions unlocked via payment must use Apple's In-App Purchase APIs. Third-party payment processing for digital goods is not permitted on the App Store.</p>
        <a class="doc-link" href="https://developer.apple.com/in-app-purchase/" target="_blank" rel="noopener">In-App Purchase overview ↗</a>
      </div>

      <div class="doc-pane-coming-soon">
        <span class="doc-pane-cs-icon">✦</span>
        More documentation sections coming soon
      </div>

    </div>`;
}

/* ── Store Page AI Insights panel ───────────────────── */
function buildStoreInsightsPanel() {
  const ins = state.storePageInsights;

  // ── Idle ────────────────────────────────────────────
  if (!ins) return `
    <div class="sp-insights-panel sp-insights-idle">
      <div class="sp-insights-badge">
        <img src="Assets/SubwooferIcon_Orange.png" class="sp-ins-logo" onerror="this.style.display='none'">
        <span>Shipmate AI</span>
      </div>
      <p class="sp-insights-prompt">Get an AI-powered evaluation of your store page listing with one-click fixes.</p>
      <button class="btn btn-primary sp-ins-btn" onclick="runStorePageInsights()">Analyze my listing →</button>
    </div>`;

  // ── Loading ─────────────────────────────────────────
  if (ins.loading) return `
    <div class="sp-insights-panel sp-insights-loading">
      <div class="sp-insights-badge">
        <img src="Assets/SubwooferIcon_Orange.png" class="sp-ins-logo" onerror="this.style.display='none'">
        <span>Shipmate AI</span>
      </div>
      <div class="sp-ins-spinner-row"><span class="ai-spinner"></span> Evaluating your listing…</div>
    </div>`;

  // ── Error ───────────────────────────────────────────
  if (ins.error) return `
    <div class="sp-insights-panel sp-insights-error">
      <div class="sp-insights-badge">
        <img src="Assets/SubwooferIcon_Orange.png" class="sp-ins-logo" onerror="this.style.display='none'">
        <span>Shipmate AI</span>
      </div>
      <div class="sp-ins-error-msg">${escHtml(ins.error)}</div>
      <div class="sp-ins-footer-row">
        <button class="btn btn-ghost btn-sm" onclick="runStorePageInsights()">Retry</button>
        <button class="btn btn-ghost btn-sm" onclick="state.storePageInsights=null;renderStepModal()">Dismiss</button>
      </div>
    </div>`;

  // ── All done ────────────────────────────────────────
  if (ins.done) return `
    <div class="sp-insights-panel sp-insights-done">
      <div class="sp-insights-badge">
        <img src="Assets/SubwooferIcon_Orange.png" class="sp-ins-logo" onerror="this.style.display='none'">
        <span>Shipmate AI</span>
      </div>
      <div class="sp-ins-applied">
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><circle cx="8" cy="8" r="7" stroke="var(--green)" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="var(--green)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        All suggestions reviewed.
      </div>
      <div class="sp-ins-footer-row">
        <button class="btn btn-ghost btn-sm" onclick="runStorePageInsights()">Analyze again</button>
        <button class="btn btn-ghost btn-sm" onclick="state.storePageInsights=null;renderStepModal()">Close</button>
      </div>
    </div>`;

  // ── Active issue ────────────────────────────────────
  if (ins.issues && ins.issues.length > 0) {
    const issue  = ins.issues[ins.index];
    const total  = ins.issues.length;
    const current = ins.index + 1;
    const fieldLabel = { subtitle: 'Subtitle', description: 'Description', title: 'Title' }[issue.field] || (issue.field || 'Listing');
    const progress = total > 1 ? `<span class="sp-ins-progress">${current} / ${total}</span>` : '';
    return `
      <div class="sp-insights-panel sp-insights-result">
        <div class="sp-insights-badge">
          <img src="Assets/SubwooferIcon_Orange.png" class="sp-ins-logo" onerror="this.style.display='none'">
          <span>Shipmate AI</span>
          <span class="sp-ins-field-tag">${escHtml(fieldLabel)}</span>
          ${progress}
        </div>
        <div class="sp-ins-issue">${escHtml(issue.issue || '')}</div>
        <div class="sp-ins-suggestion">${escHtml(issue.suggestion || '')}</div>
        ${issue.fixedValue ? `
          <div class="sp-ins-preview">
            <div class="sp-ins-preview-label">Suggested fix</div>
            <div class="sp-ins-preview-text">${escHtml(issue.fixedValue)}</div>
          </div>` : ''}
        <div class="sp-ins-footer-row">
          <button class="btn btn-primary" onclick="applyStorePageFix()" ${!issue.fixedValue ? 'disabled style="opacity:.4"' : ''}>✦ Fix it</button>
          <button class="btn btn-ghost btn-sm" onclick="dismissStorePageInsights()">Dismiss</button>
        </div>
      </div>`;
  }

  return '';
}

/* ── Improve Your Submission ─────────────────────────── */
function buildImproveSubmissionSection(platformId) {
  const isIos     = platformId === 'ios';
  const isAndroid = platformId === 'android';

  // Mark as seen on first render — triggers step completion in dashboard
  if (isIos)          state.iosSubmitAnswers.improveSubmissionSeen     = true;
  else if (isAndroid) state.androidSubmitAnswers.improveSubmissionSeen = true;
  else                state.steamSubmitAnswers.improveSubmissionSeen   = true;

  const spi = state.storePageInsights;
  const ana = state.improveSubmissionAnalysis;
  const idx = state.improveSubmissionIdx || { storePage: 0 };

  // ── Shared helpers ───────────────────────────────────
  function _gradeBadge(grade) {
    const cls = grade && /^[A-D]$/.test(grade)
      ? `iys-grade-badge iys-grade-badge-${grade}`
      : 'iys-grade-badge iys-grade-badge-na';
    return `<span class="${cls}">${escHtml(grade || 'N/A')}</span>`;
  }

  function _filterItems(items, ...keys) {
    const lc = keys.map(k => k.toLowerCase());
    return (items || []).filter(t => lc.some(k => (t.area || '').toLowerCase().includes(k)));
  }

  function _allGood(msg) {
    return `<div class="iys-issue-content iys-all-good-inline">
      <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><circle cx="8" cy="8" r="7" stroke="var(--green)" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="var(--green)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>${msg || 'Looking good'}</span>
    </div>`;
  }

  function _loadingBody() {
    return `<div class="iys-issue-content iys-section-loading">Analyzing…</div>`;
  }

  // Section card: fixed-height card with content area + footer pinned to bottom
  function _section(title, grade, contentHTML, footerHTML) {
    return `
      <div class="iys-section">
        <div class="iys-section-body">
          <div class="iys-section-title">${title}</div>
          ${contentHTML}
          ${footerHTML ? `<div class="iys-section-footer">${footerHTML}</div>` : ''}
        </div>
        <div class="iys-section-grade">${_gradeBadge(grade)}</div>
      </div>`;
  }

  // ── Grade ordering helper ─────────────────────────────
  function _worseGrade(a, b) {
    const ORD = { D:3, C:2, B:1, A:0 };
    if (!a) return b; if (!b) return a;
    return (ORD[a] ?? -1) >= (ORD[b] ?? -1) ? a : b;
  }

  // ── MERGED STORE PAGE SECTION ─────────────────────────
  // Combines: Store Page text issues (spi) + Assets + Metadata (ana) — max 5 total.
  // _getCurrentMergedStoreItems() is defined in app.js and shared with applyStorePageFix().
  const loading  = (spi?.loading || !spi) && (ana?.loading || !ana);
  const hasError = spi?.error || ana?.error;

  // Compute merged items first so the grade reflects fixes already applied
  const mergedItems = (typeof _getCurrentMergedStoreItems === 'function')
    ? _getCurrentMergedStoreItems() : [];
  const remaining = mergedItems.length; // after filtering dismissed/accepted items

  // Total valid suggestions from this AI run (before dismiss/accept filtering)
  // This drives the counter ("1 of 2", not "1 of 5" when 3 lacked fixedValue)
  const allValidFromRun = (!spi?.loading && !spi?.error && spi?.issues)
    ? spi.issues.filter(iss => !!iss.fixedValue).length
    : remaining;
  const totalItems = allValidFromRun || remaining;
  const handledInRun = Math.max(0, totalItems - remaining);
  const currentNum = handledInRun + 1; // 1-indexed position

  // Grade: starts based on total valid suggestions found; each ACCEPTED fix moves up one letter.
  // D(4+) → C(3) → B(2) → A(1 or 0)
  // Dismissed fixes don't improve grade.
  const acceptedCount = Object.keys(state.acceptedFixes || {}).length;
  const GRADE_LETTERS = ['A', 'B', 'C', 'D'];
  function _initialGradeTier(n) {
    if (n <= 1) return 0; // A — nearly or fully perfect
    if (n === 2) return 1; // B
    if (n === 3) return 2; // C
    return 3;              // D — 4 or more suggestions
  }
  const startTier   = _initialGradeTier(totalItems);
  const currentTier = Math.max(0, startTier - acceptedCount);
  const spGrade = (!spi?.loading && !spi?.error) ? GRADE_LETTERS[currentTier] : null;
  const assGrade = ana?.scores?.assets   || null;
  const metGrade = ana?.scores?.metadata || null;
  const mergedGrade = _worseGrade(spGrade, _worseGrade(assGrade, metGrade));

  // For description fields: find the first word where current and fix diverge,
  // then show context around that point so the actual change is visible.
  function _relevantExcerpt(current, fix, maxLen) {
    const words = current.split(' ');
    const fixWords = fix.split(' ');
    let diffWord = 0;
    for (let i = 0; i < Math.min(words.length, fixWords.length); i++) {
      if (words[i] !== fixWords[i]) { diffWord = i; break; }
    }
    // Find char offset of the differing word, back up a few words for context
    const contextWords = Math.max(0, diffWord - 4);
    const charStart = words.slice(0, contextWords).join(' ').length + (contextWords ? 1 : 0);
    const prefix = charStart > 0 ? '…' : '';
    const cExcerpt = prefix + current.slice(charStart);
    const fExcerpt = prefix + fix.slice(charStart);
    // Truncate to maxLen
    const trunc = (s) => s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
    return { current: trunc(cExcerpt), fix: trunc(fExcerpt) };
  }

  // Simple truncate for short fields (title, subtitle)
  function _trunc(s, max) { return s.length > max ? s.slice(0, max) + '…' : s; }

  let spPageContent = '', spPageFooter = '';
  if (loading) {
    spPageContent = _loadingBody();
  } else if (hasError) {
    spPageContent = `<div class="iys-issue-content"><div class="iys-issue-title">Analysis failed</div><div class="iys-issue-body">${escHtml(spi?.error || ana?.error)}</div></div>`;
    spPageFooter  = `<button class="iys-fix-btn" onclick="state.storePageInsights=null;state.improveSubmissionAnalysis=null;_autoRunImproveSubmission('${platformId}')"><img src="Assets/SubwooferIcon_Orange.png" onerror="this.style.display='none'">Retry</button>`;
  } else {
    const n = mergedItems.length;
    if (!n) {
      spPageContent = _allGood('Store page, assets & metadata all look strong');
    } else {
      const cur = mergedItems[0];
      const hasFix = cur.type === 'sp' && !!cur.fixedValue;
      const counterHtml = `<span class="iys-section-counter">${currentNum} of ${totalItems}</span>`;

      if (hasFix) {
        // Get current stored value for this field
        const fieldCurrentValue = cur.field === 'description' ? (state.formData.description || '')
          : cur.field === 'subtitle' ? (state.formData.subtitle || state.formData.description?.slice(0,80) || '')
          : cur.field === 'title'    ? (state.formData.title || '')
          : '';
        // For long description fields, show the excerpt around where the change is
        let currentDisplay, fixDisplay;
        if (cur.field === 'description' && fieldCurrentValue && cur.fixedValue) {
          const ex = _relevantExcerpt(fieldCurrentValue, cur.fixedValue, 180);
          currentDisplay = escHtml(ex.current);
          fixDisplay     = escHtml(ex.fix);
        } else {
          currentDisplay = escHtml(_trunc(fieldCurrentValue || '(empty)', 180));
          fixDisplay     = escHtml(_trunc(cur.fixedValue, 180));
        }

        // Side-by-side choice boxes — clicking selects that option and advances
        spPageContent = `
          <div class="iys-issue-content">
            ${cur.tag ? `<div class="iys-issue-field-tag">${escHtml(cur.tag)}</div>` : ''}
            <div class="iys-issue-body">${escHtml(cur.body)}</div>
            <div class="iys-choice-row">
              <div class="iys-choice-box iys-choice-current" onclick="keepExistingFix()">
                <span class="iys-choice-label">Current</span>
                <div class="iys-choice-value">${currentDisplay}</div>
              </div>
              <div class="iys-choice-box iys-choice-fix" onclick="applyStorePageFix()">
                <span class="iys-choice-label">Shipmate Fix</span>
                <div class="iys-choice-value">${fixDisplay}</div>
              </div>
            </div>
          </div>`;
        spPageFooter = counterHtml; // no buttons needed — boxes ARE the action
      } else {
        // Informational item — no side-by-side fix to offer, just acknowledge
        spPageContent = `
          <div class="iys-issue-content">
            ${cur.tag ? `<div class="iys-issue-field-tag">${escHtml(cur.tag)}</div>` : ''}
            <div class="iys-issue-title">${escHtml(cur.title)}</div>
            <div class="iys-issue-body">${escHtml(cur.body)}</div>
          </div>`;
        spPageFooter = `${counterHtml}<button class="btn btn-ghost btn-sm" onclick="keepExistingFix()">Got it</button>`;
      }
    }
  }
  const spPageSection = _section('Store Page', mergedGrade, spPageContent, spPageFooter);

  // ── LOCALIZATION SECTION ──────────────────────────────
  const langRec  = _highestImpactUnselectedLang();
  const langName = langRec.lang ? (OB_LANG_NAMES[langRec.lang] || langRec.lang) : null;
  const locGrade = langRec.lang ? (langRec.total > 50_000_000 ? 'C' : 'B') : 'A';
  const locContent = langName
    ? `<div class="iys-issue-content">
         <div class="iys-issue-field-tag">${escHtml(langName)}</div>
         <div class="iys-issue-title">Localize into ${escHtml(langName)}</div>
         <div class="iys-issue-body">~${_obFmtGamers(langRec.total)} potential players in your selected markets speak ${escHtml(langName)} as their primary language. Games localized into the local language see 30–50% more revenue on average vs. English-only releases.</div>
       </div>`
    : _allGood('Localization looks strong for your target markets');
  const locSection = _section('Localization', locGrade, locContent, '');

  // ── BINARY SECTION ────────────────────────────────────
  const binBuild      = state.platformBuilds?.[platformId] || null;
  const binProcessing = !!(state.platformBuildProcessing?.[platformId]);
  const binAnalyzed   = binBuild && !binProcessing;

  const findings    = BIN_FINDINGS[platformId] || BIN_FINDINGS.ios;
  const binIdx      = state.binFindingIdx?.[platformId] || 0;
  const binFixOpen  = !!(state.binFindingFixExpanded?.[platformId]);
  const binRemaining = Math.max(0, findings.length - binIdx);

  // Build the binary upload pill (same control as card header, using modal variant)
  const binUploadPill = buildBuildDropdown(platformId, true);

  let binContent, binFooter = '';
  if (!binBuild && !binProcessing) {
    // No binary yet — show upload control + description
    binContent = `
      <div class="iys-bin-row">
        ${binUploadPill}
        <div class="iys-issue-body" style="margin-top:8px;">Upload your build to scan for undeclared SDKs, missing privacy manifests, deprecated APIs, and permission mismatches.</div>
      </div>`;
  } else if (binProcessing) {
    // Currently analyzing
    binContent = `
      <div class="iys-bin-row">
        ${binUploadPill}
        <div class="iys-bin-analyzing">
          <span class="build-proc-spin"></span>
          <span>Analyzing binary… this takes about 10 seconds.</span>
        </div>
      </div>`;
  } else if (binRemaining === 0) {
    // All findings acknowledged
    binContent = `
      <div class="iys-bin-row" style="margin-bottom:8px;">${binUploadPill}</div>
      ${_allGood('No binary issues detected')}`;
  } else {
    // Show one finding at a time
    const cur       = findings[binIdx];
    const total     = findings.length;
    const numShown  = binIdx + 1; // 1-indexed
    const counterHtml = `<span class="iys-section-counter">${numShown} of ${total}</span>`;

    // Fix panel (toggled by "View Fix" button)
    const fixPanel = binFixOpen ? `
      <div class="iys-bin-fix-panel">
        <div class="iys-bin-fix-label">${escHtml(cur.fixLabel)}</div>
        ${cur.fixIsCode
          ? `<pre class="iys-bin-fix-code">${escHtml(cur.fix)}</pre>`
          : `<div class="iys-bin-fix-desc">${escHtml(cur.fix).replace(/\n/g, '<br>')}</div>`
        }
      </div>` : '';

    binContent = `
      <div class="iys-bin-row" style="margin-bottom:10px;">${binUploadPill}</div>
      <div class="iys-issue-content">
        <div class="iys-issue-title">${escHtml(cur.title)}</div>
        <div class="iys-issue-body">${escHtml(cur.body)}</div>
        ${fixPanel}
      </div>`;
    binFooter = `
      ${counterHtml}
      <button class="btn btn-ghost btn-sm iys-bin-fix-btn${binFixOpen ? ' is-active' : ''}"
              onclick="toggleBinFindingFix('${platformId}')">
        ${binFixOpen ? 'Hide Fix' : 'View Fix'}
      </button>
      <button class="btn btn-ghost btn-sm" onclick="acknowledgeBinFinding('${platformId}')">Got it</button>`;
  }

  const binGrade   = !binAnalyzed ? null : binRemaining === 0 ? 'A' : 'B';
  const binSection = _section('Binary', binGrade, binContent, binFooter);

  // ── Re-analyze footer ─────────────────────────────────
  const hasResults = (spi && !spi.loading) || (ana && !ana.loading);
  const reanalyzeRow = hasResults ? `
    <div class="iys-reanalyze-row">
      <button class="btn btn-ghost btn-sm" onclick="state.storePageInsights=null;state.improveSubmissionAnalysis=null;_autoRunImproveSubmission('${platformId}')">Re-analyze all</button>
    </div>` : '';

  // ── Chunk 2: Recommended Partners — 3 columns (QA · Press · Marketing) ──
  // One top pick per category, selected based on platform and game profile.
  const partners = [
    {
      cat: 'QA',
      p: isIos || isAndroid
        ? { name: 'PlaytestCloud', tagline: 'Real-device playtesting with real players — ideal for pre-launch validation.', url: 'https://playtestcloud.com', highlight: true }
        : { name: 'Global App Testing', tagline: 'Professional QA at scale — functional, performance, and compatibility testing.', url: 'https://www.globalapptesting.com' },
    },
    {
      cat: 'Press',
      p: { name: 'Impress', tagline: 'Indie PR with strong outlet relationships — best cost/coverage ratio for small studios.', url: 'https://impress.games', highlight: true },
    },
    {
      cat: 'Marketing',
      p: isIos || isAndroid
        ? { name: 'Chartboost', tagline: 'Mobile-first UA with direct deal network and strong ROAS for casual and mid-core games.', url: 'https://www.chartboost.com' }
        : { name: 'Keymailer', tagline: 'Connect with creators and streamers — efficient key distribution and campaign tracking.', url: 'https://www.keymailer.co' },
    },
  ];

  const partnerHTML = `<div class="iys-partner-row">${partners.map(({ cat, p }) => `
    <div class="iys-partner-cat">
      <div class="iys-partner-cat-label">${escHtml(cat)}</div>
      <div class="iys-partner-cards">
        <a href="${escHtml(p.url)}" target="_blank" rel="noopener" class="iys-partner-card${p.highlight ? ' iys-partner-highlight' : ''}">
          <div style="display:flex;align-items:center;gap:8px;width:100%;margin-bottom:4px;">
            <div class="iys-partner-avatar">${escHtml(p.name[0])}</div>
            <div class="iys-partner-name">${escHtml(p.name)}</div>
          </div>
          <div class="iys-partner-tagline">${escHtml(p.tagline)}</div>
        </a>
      </div>
    </div>`).join('')}</div>`;

  return `
    <div class="iys-wrap">
      <div class="iys-chunk">
        <div class="iys-chunk-label">Shipmate Guidance</div>
        <div class="iys-sections-grid">
          ${spPageSection}
          ${locSection}
          ${binSection}
        </div>
        ${reanalyzeRow}
      </div>
      <div class="iys-chunk">
        <div class="iys-chunk-label">Recommended Partners</div>
        ${partnerHTML}
      </div>
    </div>`;
}

// Every language the App Store Product Page Preview covers — the
// Distribution section's Primary Language always first, followed by its
// selected supported languages (state.formData.localizations) sorted
// alphabetically by display name. Same derivation buildStorePreviewSection
// computes inline for its own language dropdown (kept inline there rather
// than switched over to this helper, to avoid touching that already-covered
// code path); this is the version buildLocalizationReviewSection's
// per-language cards use, so the two sections always agree on exactly which
// languages exist and in what order.
function _iasAllPreviewLangCodes() {
  const fd = state.formData;
  const primary = fd.primaryLanguage || 'en';
  const supporting = (fd.localizations || [])
    .slice()
    .sort((la, lb) => (OB_LANG_NAMES[la] || la).localeCompare(OB_LANG_NAMES[lb] || lb));
  return [primary, ...supporting];
}

function buildStorePreviewSection() {
  const fd    = state.formData;
  const ups   = state.uploads;
  const a     = state.iosSubmitAnswers;
  const icon  = ups.appIcon;
  const pid   = state.stepModal?.platformId || 'ios';

  // Use the screenshots selected in the Select Screenshots step,
  // falling back to all uploaded screenshots if none selected yet.
  const ps = state.platformScreenshots?.[pid] || { selected: [], custom: [] };
  const allUploaded = ups.screenshots || [];
  const selectedIds = new Set(ps.selected);
  const selectedUploaded = allUploaded.filter(s => selectedIds.has(s.id));
  const customShots = ps.custom || [];
  const shots = selectedUploaded.length > 0 || customShots.length > 0
    ? [...selectedUploaded, ...customShots]
    : allUploaded; // fall back to all if none selected yet

  const category  = escHtml(fd.genre || 'Games');
  const isFree    = !fd.price || parseFloat(fd.price) === 0 || fd.price.trim() === '' || fd.price.trim() === '0';
  const price     = isFree ? 'GET' : `$${fd.price}`;
  const priceText = isFree ? 'Free' : `$${fd.price}`;
  const iapNote   = (a.hasIAP === 'yes') ? 'In-App Purchases' : '';
  const langCode  = (fd.primaryLanguage || 'EN').toUpperCase().slice(0, 2);
  const activeProj = state.projects.find(p => p.id === state.activeProjectId);
  const activeVer  = activeProj?.versions.find(v => v.id === state.activeVersionId);
  const version    = escHtml(activeVer?.versionNumber || fd.appVersion || '1.0');

  // Language dropdown (top-right of the preview) — first option is always
  // the Distribution section's Primary Language (state.formData.primaryLanguage);
  // the rest are the Distribution section's selected supported languages
  // (state.formData.localizations), sorted alphabetically by display name.
  // localizations never contains the primary language itself (selectLocPrimary
  // removes it on promotion), so there's no dedup to do here. previewLang is
  // shared with app.js's startIasInlineEdit (_iasEffectivePreviewLang) so the
  // preview's display and its click-to-edit fields never disagree about
  // which language is currently showing.
  const previewPrimaryLang = fd.primaryLanguage || 'en';
  const previewSupportedLangs = (fd.localizations || [])
    .slice()
    .sort((la, lb) => (OB_LANG_NAMES[la] || la).localeCompare(OB_LANG_NAMES[lb] || lb));
  const previewLangCodes = [previewPrimaryLang, ...previewSupportedLangs];
  // warning flags a language that has at least one field (Title/Subtitle/
  // Description/What's New) over its character limit (_iasLangHasOverLimitField,
  // app.js) — swSelect (below) renders a small red warning icon next to that
  // language's name in the dropdown, so an over-limit field on a language
  // you aren't currently previewing doesn't go unnoticed.
  const previewLangOptions = previewLangCodes.map(l => ({
    value: l,
    label: OB_LANG_NAMES[l] || l,
    warning: _iasLangHasOverLimitField(l),
  }));
  const previewLang = _iasEffectivePreviewLang();
  const previewLangName = OB_LANG_NAMES[previewLang] || previewLang;

  // Title/Subtitle/Description/What's New are all clickable-to-edit directly
  // in this preview (startIasInlineEdit, app.js) — each swaps its own
  // element for a plain input/textarea in place, pre-filled with the real
  // value for whichever language the dropdown above is currently showing
  // (never the placeholder text below), and writes straight back to that
  // language's own storage on commit (_iasFieldValue/_iasSetFieldValue,
  // app.js — the Primary Language's copy is the flat state.formData.
  // {title,subtitle,description,releaseNotes} fields, unchanged; every other
  // selected language gets its own copy in
  // state.formData.localizedStoreText[langCode]). ias-placeholder marks the
  // muted/italic style used only while showing the fallback copy, so it's
  // visually obvious which fields are still empty for the language being
  // previewed; ias-editable is the shared hover affordance for all four.
  const titleRaw  = _iasFieldValue('title', previewLang);
  const title     = escHtml(titleRaw || 'Your Game Title');
  // Character-limit highlighting (IAS_FIELD_CHAR_LIMITS, app.js) must
  // persist on the display element itself, not just the temporary
  // input/textarea created while actively editing (startIasInlineEdit,
  // app.js) — a field that's over the limit should stay flagged red even
  // after you click away, until it's actually edited back under the limit.
  const titleOverLimit = titleRaw.length > IAS_FIELD_CHAR_LIMITS.title;

  // Subtitle is its own independent field — it is never derived from
  // Description, for any language. The two are edited and stored completely
  // separately, so typing one never changes the other.
  const subtitleRaw = _iasFieldValue('subtitle', previewLang);
  const subtitle     = escHtml(subtitleRaw || 'Short subtitle');
  const subtitleOverLimit = subtitleRaw.length > IAS_FIELD_CHAR_LIMITS.subtitle;

  const descRaw = _iasFieldValue('description', previewLang);
  const descOverLimit = descRaw.length > IAS_FIELD_CHAR_LIMITS.description;
  // The "fill it in via Game Details" placeholder is only accurate for the
  // Primary Language — translations have no Game Details equivalent at all,
  // this preview is their only editable surface, so they get a placeholder
  // that actually points somewhere real.
  const descPlaceholder = previewLang === previewPrimaryLang
    ? 'Your game description will appear here once you fill in the Description field in Game Details.'
    : `Add a ${previewLangName} description to populate this section.`;
  const descFull  = descRaw ? escHtml(descRaw) : descPlaceholder;
  const descShort = descRaw.length > 240
    ? escHtml(descRaw.slice(0, 240)) + '…'
    : descFull;

  // Subtitle/Description/What's New are auto-translated into every
  // supporting language from the primary language's text
  // (_iasTriggerAutoTranslate, app.js). Only surface the loading/error
  // status for a field here when a non-primary language is being previewed
  // — every supporting language is always a translation target (there's no
  // per-language override that excludes it), so the only thing that would
  // suppress the indicator is previewing the primary language itself.
  const _iasStatusLine = (field, tryAgainLabel) => {
    if (previewLang === previewPrimaryLang) return '';
    const status = state.iasTranslateStatus?.[field];
    if (status === 'loading') {
      return `<div class="prv-nlp-status loading"><span class="ai-spinner"></span> Translating ${tryAgainLabel} to ${previewLangName}…</div>`;
    }
    if (status === 'error') {
      return `<div class="prv-nlp-status error">Translation failed. <button class="btn-inline" onclick="_iasRetryTranslate('${field}')">Try again</button></div>`;
    }
    return '';
  };
  const subtitleStatusHtml = _iasStatusLine('subtitle', 'subtitle');
  const descStatusHtml     = _iasStatusLine('description', 'description');
  const notesStatusHtml    = _iasStatusLine('releaseNotes', "what's new");

  // Age rating from questionnaire
  const ageRating = (function() {
    const cat = a.ageCategory;
    if (cat === 'made_for_kids') return '4+';
    const intense = state.iosSubmitAnswers;
    const hasAdult = intense.graphicSexual === 'frequent' || intense.extendedViolence === 'frequent';
    const hasTeen  = intense.realisticViolence && intense.realisticViolence !== 'none';
    return hasAdult ? '17+' : hasTeen ? '12+' : '4+';
  })();

  // Privacy section content — mirrors Apple's actual Nutrition Label format
  const privacyHtml = (function() {
    if (a.collectsData === 'no') {
      return `
        <div class="ias-privacy-card ias-privacy-clean">
          <svg viewBox="0 0 28 28" fill="none" width="32" height="32">
            <circle cx="14" cy="14" r="13" stroke="#0a84ff" stroke-width="1.5"/>
            <path d="M9 14l3.5 3.5L19 10" stroke="#0a84ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="ias-privacy-clean-title">Data Not Collected</div>
          <div class="ias-privacy-clean-sub">The developer does not collect any data from this app.</div>
        </div>`;
    }

    const dataPerType = a.dataPerType || {};
    const typeEntries = Object.entries(dataPerType);

    if (a.collectsData !== 'yes' || typeEntries.length === 0) {
      return `
        <div class="ias-privacy-card ias-privacy-pending">
          <div class="ias-privacy-pending-msg">Complete the Data Privacy step to populate this section.</div>
        </div>`;
    }

    // Split collected types into Apple's three buckets
    const tracking  = []; // tracking === 'yes'
    const linked    = []; // identity === 'yes' AND tracking !== 'yes'
    const notLinked = []; // neither tracking nor identity linked

    typeEntries.forEach(([id, td]) => {
      if (td.tracking === 'yes')       tracking.push(id);
      else if (td.identity === 'yes')  linked.push(id);
      else                             notLinked.push(id);
    });

    // Get unique Apple group names for a list of typeIds
    function _groups(ids) {
      const seen = new Set();
      return ids.map(id => IOS_DATA_TYPE_LOOKUP[id]?.group || id.replace(/_/g,' ')).filter(g => {
        if (seen.has(g)) return false; seen.add(g); return true;
      });
    }

    // SVG icon per Apple data group (matches App Store icon style)
    function _groupIcon(groupName) {
      const icons = {
        'Purchases':        `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="4" y="7" width="12" height="10" rx="2" stroke="white" stroke-width="1.4"/><path d="M7 7V5.5a3 3 0 0 1 6 0V7" stroke="white" stroke-width="1.4" stroke-linecap="round"/></svg>`,
        'Contact Info':     `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="8.25" stroke="white" stroke-width="1.4"/><path d="M10 9v5" stroke="white" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="6.5" r="0.9" fill="white"/></svg>`,
        'Identifiers':      `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="2.5" y="5.5" width="15" height="9" rx="2" stroke="white" stroke-width="1.4"/><path d="M6 9h2M6 11.5h5" stroke="white" stroke-width="1.2" stroke-linecap="round"/><circle cx="14" cy="10.25" r="1.75" stroke="white" stroke-width="1.2"/></svg>`,
        'Usage Data':       `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M4 14V10M8 14V7M12 14V9M16 14V5" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        'Diagnostics':      `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2z" stroke="white" stroke-width="1.4"/><path d="M10 6v4l2.5 2.5" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        'Location':         `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M10 2a5.5 5.5 0 0 1 5.5 5.5c0 4-5.5 10.5-5.5 10.5S4.5 11.5 4.5 7.5A5.5 5.5 0 0 1 10 2z" stroke="white" stroke-width="1.4"/><circle cx="10" cy="7.5" r="1.8" stroke="white" stroke-width="1.3"/></svg>`,
        'Financial Info':   `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="7.5" stroke="white" stroke-width="1.4"/><path d="M10 6v8M8 7.5h3a1.5 1.5 0 0 1 0 3H9a1.5 1.5 0 0 0 0 3h3" stroke="white" stroke-width="1.3" stroke-linecap="round"/></svg>`,
        'Health & Fitness': `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M10 16s-7-4.5-7-8.5a4 4 0 0 1 7-2.65A4 4 0 0 1 17 7.5C17 11.5 10 16 10 16z" stroke="white" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
        'User Content':     `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M5 3h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="white" stroke-width="1.4"/><path d="M7 8h6M7 11h4" stroke="white" stroke-width="1.3" stroke-linecap="round"/></svg>`,
        'Browsing History': `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="7.5" stroke="white" stroke-width="1.4"/><path d="M2.5 10h15M10 2.5a12 12 0 0 1 0 15M10 2.5a12 12 0 0 0 0 15" stroke="white" stroke-width="1.3"/></svg>`,
        'Search History':   `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="9" cy="9" r="5.5" stroke="white" stroke-width="1.4"/><path d="M13 13l3.5 3.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        'Sensitive Info':   `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M10 2l7 3.5V10c0 4-3.5 7-7 8-3.5-1-7-4-7-8V5.5L10 2z" stroke="white" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
        'Contacts':         `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="8" cy="7.5" r="3" stroke="white" stroke-width="1.4"/><path d="M2 17c0-3.3 2.7-5 6-5" stroke="white" stroke-width="1.4" stroke-linecap="round"/><path d="M14 11v6M11 14h6" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        'Other Data':       `<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="5" cy="10" r="1.5" fill="white"/><circle cx="10" cy="10" r="1.5" fill="white"/><circle cx="15" cy="10" r="1.5" fill="white"/></svg>`,
      };
      return icons[groupName] || icons['Other Data'];
    }

    // Person icon for the card header (blue circle)
    const personIcon = `
      <div class="ias-pp-person-icon">
        <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
          <circle cx="22" cy="22" r="22" fill="#0a84ff"/>
          <circle cx="22" cy="17" r="6" fill="white"/>
          <path d="M8 38c0-7.7 6.3-13 14-13s14 5.3 14 13" fill="white"/>
        </svg>
      </div>`;

    // Render one App Store-style nutrition label card
    function _ppCard(bucketTitle, bucketSubtitle, ids) {
      if (!ids.length) return '';
      const groups = _groups(ids);
      return `
        <div class="ias-pp-card">
          ${personIcon}
          <div class="ias-pp-card-title">${bucketTitle}</div>
          <div class="ias-pp-card-subtitle">${bucketSubtitle}</div>
          <div class="ias-pp-grid">
            ${groups.map(g => `
              <div class="ias-pp-grid-item">
                ${_groupIcon(g)}
                <span>${escHtml(g)}</span>
              </div>`).join('')}
          </div>
        </div>`;
    }

    const cardsHtml = _ppCard('Data Used to Track You',
        'The following data may be used to track you across apps and websites owned by other companies:',
        tracking)
      + _ppCard('Data Linked to You',
        'The following data may be collected and linked to your identity:',
        linked)
      + _ppCard('Data Not Linked to You',
        'The following data may be collected but it is not linked to your identity:',
        notLinked);

    return cardsHtml || `<div class="ias-privacy-card ias-privacy-pending"><div class="ias-privacy-pending-msg">No data types configured.</div></div>`;
  })();

  // What's New section — also click-to-edit in place (startIasInlineEdit,
  // app.js), same mechanism as Title/Subtitle/Description above, and same
  // per-language storage (_iasFieldValue). Editing always reopens the RAW
  // text for the language being previewed (one line per bullet, no leading
  // "- " required), never this bullet-formatted preview markup — the "- "
  // prefix and any stray -/–/• the developer already typed are purely a
  // display transform applied below, not part of the stored value.
  const releaseNotes = _iasFieldValue('releaseNotes', previewLang);
  const notesOverLimit = releaseNotes.length > IAS_FIELD_CHAR_LIMITS.releaseNotes;
  const notesHtml = releaseNotes
    ? releaseNotes.split('\n').filter(l => l.trim()).map(l => `<div class="ias-wn-line">- ${escHtml(l.trim().replace(/^[-–•]\s*/, ''))}</div>`).join('')
    : `<div class="ias-wn-line ias-wn-placeholder">Add release notes to your submission to populate this section.</div>`;

  const iconHtml = icon
    ? `<img src="${icon.dataUrl}" class="ias-icon" alt="App icon">`
    : `<div class="ias-icon ias-icon-empty">
        <svg viewBox="0 0 40 40" fill="none" width="24" height="24">
          <rect x="4" y="14" width="32" height="22" rx="3" fill="#555"/>
          <polygon points="20,3 32,14 8,14" fill="#666"/>
        </svg>
      </div>`;

  // Show all selected shots (no cap) — scroll container handles overflow
  const shotHtml = shots.length > 0
    ? shots.map(s =>
        `<div class="ias-shot-frame"><img src="${_screenshotSrc(s)}" class="ias-shot-img" alt="Screenshot"></div>`
      ).join('')
    : ['Gameplay','Gameplay','Menu'].map(lbl =>
        `<div class="ias-shot-frame ias-shot-empty"><span>${lbl}</span></div>`
      ).join('');

  const infoRows = [
    { label: 'Seller',        value: 'Your Company'      },
    { label: 'Size',          value: '—'                 },
    { label: 'Category',      value: category            },
    { label: 'Compatibility', value: 'iPhone, iPad'      },
    { label: 'Languages',     value: langCode            },
    { label: 'Age Rating',    value: ageRating           },
    { label: 'Copyright',     value: `© ${new Date().getFullYear()}` },
  ].map(r => `
    <div class="ias-info-row">
      <span class="ias-info-label">${r.label}</span>
      <span class="ias-info-value">${r.value}</span>
    </div>`).join('');

  // Section completion status for DocuSign navigation
  // content/business require the user to have actually visited the sub-section
  // (prevents auto-marking done from onboarding data without user review)
  const seenSections    = state.storePreviewSectionSeen?.ios || {};
  const contentDone     = !!(seenSections.content  && isIOSSectionComplete('contentRating'));
  const businessDone    = !!(seenSections.business && isIOSSectionComplete('business'));
  const dataDone        = isIOSSectionComplete('privacy');
  const screenshotsDone = isIOSSectionComplete('screenshots');

  // Section button helper — orange pulsing tab when incomplete, green check when done
  function _sppBtn(target, label, sub, isDone) {
    if (isDone) {
      return `<button class="spp-section-btn spp-section-btn--done" onclick="openStorePreviewSection('${pid}','${target}')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0"><circle cx="7" cy="7" r="6.5" fill="#34c759"/><path d="M4 7l2 2 4-4" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div>
          <div class="spp-section-btn-title">${label}</div>
          <div class="spp-section-btn-sub">Tap to edit</div>
        </div>
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style="flex-shrink:0;margin-left:auto;opacity:0.4"><path d="M1 1l6 5-6 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`;
    }
    return `<button class="spp-section-btn" onclick="openStorePreviewSection('${pid}','${target}')">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0"><path d="M9.5 2a1 1 0 011.4 1.4L4.5 9.9 2.5 10.5l.6-2 6.4-6.5z" stroke="white" stroke-width="1.2"/></svg>
      <div>
        <div class="spp-section-btn-title">${label}</div>
        <div class="spp-section-btn-sub">${sub}</div>
      </div>
      <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style="flex-shrink:0;margin-left:auto"><path d="M1 1l6 5-6 5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>`;
  }

  // DocuSign-style "next required" nav bar
  const SPP_SECTIONS = [
    { target: 'content',     done: contentDone,     label: 'Answer Content Questions'       },
    { target: 'screenshots', done: screenshotsDone, label: 'Select Screenshots'             },
    { target: 'business',    done: businessDone,    label: 'Answer Business Questions'      },
    { target: 'data',        done: dataDone,        label: 'Answer Data Collection Questions'},
  ];
  const nextSection = SPP_SECTIONS.find(s => !s.done);
  const navBar = nextSection ? `
    <div class="spp-nav-bar">
      <span class="spp-nav-label">Next required</span>
      <button class="spp-nav-btn" onclick="openStorePreviewSection('${pid}','${nextSection.target}')">
        ${nextSection.label} →
      </button>
    </div>` : `
    <div class="spp-nav-bar spp-nav-bar--done">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" fill="#34c759"/><path d="M4 7l2 2 4-4" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      All sections complete — ready to save
    </div>`;

  // Age meta cell — always clickable; orange pulse when not done, green hover when done
  const ageCell = contentDone
    ? `<div class="ias-meta-cell ias-meta-cell--action ias-meta-cell--seen" onclick="openStorePreviewSection('${pid}','content')" title="Edit Content Questions">
         <div class="ias-meta-top ias-meta-age">${ageRating}</div>
         <div class="ias-meta-bot">Age</div>
       </div>`
    : `<div class="ias-meta-cell ias-meta-cell--action" onclick="openStorePreviewSection('${pid}','content')" title="Answer Content Questions">
         <div class="ias-meta-top ias-meta-action-icon">
           <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2a1 1 0 011.4 1.4L4.5 9.9 2.5 10.5l.6-2 6.4-6.5z" stroke="currentColor" stroke-width="1.2"/></svg>
         </div>
         <div class="ias-meta-bot ias-meta-bot--action">Content</div>
       </div>`;

  // Price meta cell — always clickable; orange pulse when not done, green hover when done
  const priceCell = businessDone
    ? `<div class="ias-meta-cell ias-meta-cell--action ias-meta-cell--seen" onclick="openStorePreviewSection('${pid}','business')" title="Edit Business Questions">
         <div class="ias-meta-top">${priceText}</div>
         <div class="ias-meta-bot">Price</div>
       </div>`
    : `<div class="ias-meta-cell ias-meta-cell--action" onclick="openStorePreviewSection('${pid}','business')" title="Answer Business Questions">
         <div class="ias-meta-top ias-meta-action-icon">
           <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2a1 1 0 011.4 1.4L4.5 9.9 2.5 10.5l.6-2 6.4-6.5z" stroke="currentColor" stroke-width="1.2"/></svg>
         </div>
         <div class="ias-meta-bot ias-meta-bot--action">Business</div>
       </div>`;

  // Screenshots area — always show shots; full-width Select/Edit button below
  const screenshotsArea = `
    <div class="ias-shots-scroll">${shotHtml}</div>
    <div class="ias-device-compat">
      <svg viewBox="0 0 20 20" fill="none" width="14" height="14"><rect x="2" y="4" width="10" height="13" rx="1.5" stroke="currentColor" stroke-width="1.3"/><rect x="14" y="6" width="4" height="9" rx="1" stroke="currentColor" stroke-width="1.3"/></svg>
      <span>iPhone, iPad</span>
    </div>
    <div style="padding:0 16px 10px;">
      ${_sppBtn('screenshots', 'Select Screenshots', 'Confirm or adjust screenshots for this listing', screenshotsDone)}
    </div>`;

  // Privacy section
  const privacySection = dataDone
    ? `<div class="ias-section-head-row">
         <span class="ias-section-head">App Privacy</span>
         <svg viewBox="0 0 8 14" fill="none" width="5" height="9"><path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
       </div>
       <div class="ias-privacy-desc">The developer indicated that the app's privacy practices may include handling of data as described below.</div>
       ${privacyHtml}
       <div class="ias-privacy-footer">Privacy practices may vary based on features you use. <span class="ias-privacy-link">Learn More</span></div>`
    : _sppBtn('data', 'Answer Data Collection Questions', 'Complete your App Privacy disclosure', false);

  return `
    <div class="ias-device-wrap">
      <div class="ias-label-row">
        <span class="ias-label-badge">
          <svg viewBox="0 0 16 16" fill="none" width="11" height="11" style="margin-right:4px;vertical-align:-1px;"><path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8S4.41 14.5 8 14.5 14.5 11.59 14.5 8 11.59 1.5 8 1.5zm.75 10.25h-1.5v-5h1.5v5zm0-6.5h-1.5v-1.5h1.5v1.5z" fill="currentColor"/></svg>
          App Store Preview
        </span>
        <div class="ias-label-right">
          <span class="ias-label-note">Reflects your submission data</span>
          <div class="ias-locs-lang-group">
            <button class="ias-all-locs-btn" onclick="openStorePreviewSection('${pid}','localization')" title="Review every localized field side by side">All Locs</button>
            ${swSelect('ias-preview-lang', previewLang, previewLangOptions, 'setIasPreviewLang', '150px', 'right')}
          </div>
        </div>
      </div>

      <div class="ias-page">

        <!-- ── Header ── -->
        <div class="ias-header">
          ${iconHtml}
          <div class="ias-header-meta">
            <div class="ias-app-name ias-editable${titleRaw ? '' : ' ias-placeholder'}${titleOverLimit ? ' is-over-limit' : ''}"
                 onclick="startIasInlineEdit('title', this, event)" title="Click to edit">${title}</div>
            <div class="ias-app-subtitle ias-editable${subtitleRaw ? '' : ' ias-placeholder'}${subtitleOverLimit ? ' is-over-limit' : ''}"
                 onclick="startIasInlineEdit('subtitle', this, event)" title="Click to edit">${subtitle}</div>
            ${subtitleStatusHtml}
            ${iapNote ? `<div class="ias-iap-note">${iapNote}</div>` : ''}
          </div>
          <div class="ias-header-cta">
            <button class="ias-get-btn">${price}</button>
          </div>
        </div>

        <!-- ── Meta strip (Age → Content Qs, Price → Business Qs) ── -->
        <div class="ias-meta-strip">
          <div class="ias-meta-cell">
            <div class="ias-meta-top">—</div>
            <div class="ias-meta-bot">Ratings</div>
          </div>
          <div class="ias-meta-divider"></div>
          ${ageCell}
          <div class="ias-meta-divider"></div>
          ${priceCell}
          <div class="ias-meta-divider"></div>
          <div class="ias-meta-cell ias-meta-cell-wide">
            <div class="ias-meta-top">${category}</div>
            <div class="ias-meta-bot">Category</div>
          </div>
        </div>

        <!-- ── Screenshots (or Select Screenshots button) ── -->
        ${screenshotsArea}

        <!-- ── Description ── -->
        <div class="ias-section">
          <div class="ias-desc-text ias-editable${descRaw ? '' : ' ias-placeholder'}${descOverLimit ? ' is-over-limit' : ''}" id="ias-desc-text"
               onclick="startIasInlineEdit('description', this, event)" title="Click to edit"><span class="ias-desc-text-inner">${descShort}</span>${descRaw.length > 240
            ? ` <button type="button" class="ias-more-btn" data-full="${descFull}" data-short="${descShort}" onclick="event.stopPropagation(); toggleIasDescMore(this)">more</button>` : ''}</div>
          ${descStatusHtml}
          <div class="ias-dev-row">
            <span class="ias-dev-name">Developer</span>
            <svg viewBox="0 0 8 14" fill="none" width="5" height="9"><path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <div class="ias-section-divider"></div>

        <!-- ── What's New ── -->
        <div class="ias-section">
          <div class="ias-section-head-row">
            <span class="ias-section-head">What's New</span>
            <svg viewBox="0 0 8 14" fill="none" width="5" height="9"><path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="ias-wn-version">Version ${version}</div>
          <div class="ias-wn-notes ias-editable${releaseNotes ? '' : ' ias-placeholder'}${notesOverLimit ? ' is-over-limit' : ''}"
               onclick="startIasInlineEdit('releaseNotes', this, event)" title="Click to edit">${notesHtml}</div>
          ${notesStatusHtml}
          <div class="ias-wn-edit-hint">
            <svg viewBox="0 0 16 16" fill="none" width="11" height="11"><path d="M11 2.5a1.5 1.5 0 012 2L5.5 12 3 12.5l.5-2.5L11 2.5z" stroke="currentColor" stroke-width="1.3"/></svg>
            Click to edit
          </div>
        </div>

        <div class="ias-section-divider"></div>

        <!-- ── App Privacy (or Data Collection button) ── -->
        <div class="ias-section">
          ${privacySection}
        </div>

        <div class="ias-section-divider"></div>

        <!-- ── Information ── -->
        <div class="ias-section">
          <div class="ias-section-head">Information</div>
          <div class="ias-info-grid">${infoRows}</div>
          <div class="ias-info-link">Developer Website <svg viewBox="0 0 8 14" fill="none" width="5" height="9" style="margin-left:auto;"><path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          <div class="ias-info-link">Privacy Policy <svg viewBox="0 0 8 14" fill="none" width="5" height="9" style="margin-left:auto;"><path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        </div>

      </div><!-- /ias-page -->
    </div><!-- /ias-device-wrap -->

    ${navBar}
  `;
}

/* Localization Review's field dropdown — Title/Subtitle/Description/What's
   New, in the same vertical order they appear in the App Store Product
   Page Preview itself, so the dropdown's own order reads the same way the
   preview above it does. */
const LOC_REVIEW_FIELDS = [
  { value: 'title',        label: 'Title' },
  { value: 'subtitle',     label: 'Subtitle' },
  { value: 'description',  label: 'Description' },
  { value: 'releaseNotes', label: "What's New" },
];

/* ── App Store Product Page Preview flip section: "Localization Review" ──
   Opened via the preview's "All Locs" button (openStorePreviewSection('ios',
   'localization')). One card per language the preview covers
   (_iasAllPreviewLangCodes — Primary Language first, then supported
   languages alphabetically), shown side by side, all displaying the SAME
   field at once (Title/Subtitle/Description/What's New, chosen via the
   top-right field dropdown) — the point being to compare one field across
   every language at a glance, the opposite cut from the main preview
   (every field, one language at a time).

   Each card's field and character counter reuse the exact same classes
   (ias-editable / ias-inline-input / is-over-limit / ias-char-counter-row /
   ias-char-error / ias-char-count) and the same startIasInlineEdit-style
   click-to-edit mechanics (startLocReviewInlineEdit, app.js) as the main
   preview's own Title/Subtitle/Description/What's New fields — both read
   and write through the same _iasFieldValue/_iasSetFieldValue (app.js), so
   editing a field here or in the main preview is instantly reflected in
   the other on next render. The one structural difference: the main
   preview's counter row only exists while a field is actively being
   edited (created fresh by startIasInlineEdit), but here it's always
   rendered — the whole point of a review screen is seeing every card's
   length at a glance, not just the one you're currently typing into — so
   startLocReviewInlineEdit reuses the counter row already in the DOM
   instead of creating one.

   The header's "Review"/"All locs" button (toggleLocReviewMode, app.js)
   flips every SUPPORTING language's card — never the Primary Language's
   own, which has nothing to review against — to a second, two-way layout:
   the language's own text on top (unchanged — same data, same editing, as
   the non-flipped side), and a back-translation of it into the Primary
   Language on the bottom (state.locReviewBackTranslation, app.js), which
   can itself be edited to re-translate forward and overwrite the top half.
   See _locReviewFieldBlock below for the shared field+counter markup used
   by all three surfaces (the non-flipped card, and both flipped halves). */
function buildLocalizationReviewSection() {
  const langCodes = _iasAllPreviewLangCodes();
  const field = state.locReviewField || 'title';
  const limit = IAS_FIELD_CHAR_LIMITS[field];
  const primary = state.formData.primaryLanguage || 'en';
  const primaryName = escHtml(OB_LANG_NAMES[primary] || primary);
  const reviewMode = state.locReviewMode === 'review';
  // Description/What's New can run to 4,000 characters each — when either
  // is the selected field, the Review side's halves fall back to the same
  // fixed-height/scroll treatment as the non-flipped ("All locs") card's
  // own field, instead of expanding to fit (see the CSS for why: letting a
  // half grow to fit a full back-translation would dwarf every other card
  // in the row). Title/Subtitle (30-char limit each) keep expanding to fit.
  const isLongField = field === 'description' || field === 'releaseNotes';

  // warning flags a FIELD that's over limit for at least one language — the
  // transpose of the main preview's per-language warning (_iasLangHasOverLimitField).
  const fieldOptions = LOC_REVIEW_FIELDS.map(f => ({
    value: f.value,
    label: f.label,
    warning: _iasFieldHasOverLimitLang(f.value, langCodes),
  }));

  // Undo/redo — bottom-left of a card's field, in the same row as its
  // character counter (locReviewUndo/locReviewRedo/_locReviewUndoState,
  // app.js). `kind` distinguishes the TWO independent text fields a
  // flipped Review-side card has: 'real' is a language's own actual field
  // value (also what the non-flipped card and a flipped card's TOP half
  // show/edit); 'draft' is a flipped card's BOTTOM half, the Primary-
  // Language back-translation scratch pad. Each (kind, field, lang) triple
  // has its own history, so the non-flipped card, a flipped top half, and
  // a flipped bottom half never share or clobber each other's undo stack.
  const undoIconSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 15L3 9l6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 9h11.5A6.5 6.5 0 1 1 14.5 22H10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const redoIconSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 15l6-6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 9H9.5A6.5 6.5 0 1 0 9.5 22H14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const undoRedoGroup = (kind, forField, lang) => {
    const st = _locReviewUndoState(kind, forField, lang);
    return `
        <span class="loc-review-undo-redo">
          <button type="button" class="loc-review-undo-btn"${st.canUndo ? '' : ' disabled'}
                  onclick="event.stopPropagation(); locReviewUndo('${kind}','${forField}','${lang}')"
                  title="Undo" aria-label="Undo">${undoIconSvg}</button>
          <button type="button" class="loc-review-redo-btn"${st.canRedo ? '' : ' disabled'}
                  onclick="event.stopPropagation(); locReviewRedo('${kind}','${forField}','${lang}')"
                  title="Redo" aria-label="Redo">${redoIconSvg}</button>
        </span>`;
  };

  // A translation actually in progress (either direction) is shown as the
  // same small spinning-rings icon used when the App Store Content
  // Questions section first opens (.inf-rings-wrap/.inf-ring, above) —
  // scaled down to fit inline next to a language name (.loc-review-
  // spinner) — rather than a text message. An actual failure still needs
  // to be read, so that stays text. Shared by all three places a
  // translate-in-progress indicator can appear: a non-flipped card, a
  // flipped card's TOP half, and a flipped card's BOTTOM half (see
  // _iasFieldTranslatePending/_locReviewBackTranslationValue's status/
  // forwardStatus, app.js, for what drives each one).
  const locReviewLoadingSpinnerHtml = `<span class="loc-review-status loc-review-status--loading" title="Translating…"><span class="loc-review-spinner"><span class="inf-ring inf-ring-1"></span><span class="inf-ring inf-ring-2"></span><span class="inf-ring inf-ring-3"></span></span></span>`;
  const locReviewErrorStatusHtml = `<span class="loc-review-status is-error">Translation failed</span>`;
  const locReviewStatusHtml = (status) => status === 'loading' ? locReviewLoadingSpinnerHtml : status === 'error' ? locReviewErrorStatusHtml : '';

  // Shared field+counter markup — identical look/behavior (placeholder,
  // over-limit styling and message) whether it's the non-flipped card or
  // the Review side's top half; only the value shown and the click-to-edit
  // handler differ.
  const fieldBlock = (value, onclickAttr, undoRedoHtml) => {
    const overLimit = value.length > limit;
    const remaining = limit - value.length;
    const display = value ? escHtml(value) : `<span class="loc-review-placeholder">Click to edit</span>`;
    return `
        <div class="loc-review-field ias-editable${value ? '' : ' ias-placeholder'}${overLimit ? ' is-over-limit' : ''}"
             onclick="${onclickAttr}" title="Click to edit">${display}</div>
        <div class="ias-char-counter-row">
          ${undoRedoHtml}
          <span class="ias-char-error">${overLimit ? `Must be less than ${limit} characters.` : ''}</span>
          <span class="ias-char-count${overLimit ? ' is-over' : ''}">${remaining}</span>
        </div>`;
  };

  // The Review side's BOTTOM half (the Primary Language back-translation
  // draft) deliberately has NO character-limit checking at all — no
  // counter row, so no over-limit styling and no "Must be less than N
  // characters." message either, ever, regardless of length. It's a
  // scratch pad used to re-derive the language's real field via
  // translation (startLocReviewBackTranslationEdit, app.js), not itself
  // submission data, so App Store Connect's length limit for the real
  // field doesn't apply to it. It still gets its own undo/redo pair,
  // though — a separate footer row carrying just that (no counter/error
  // spans to sit alongside, since there's no limit to report). */
  const fieldBlockNoLimit = (value, onclickAttr, undoRedoHtml) => {
    const display = value ? escHtml(value) : `<span class="loc-review-placeholder">Click to edit</span>`;
    return `
        <div class="loc-review-field ias-editable${value ? '' : ' ias-placeholder'}"
             onclick="${onclickAttr}" title="Click to edit">${display}</div>
        <div class="ias-char-counter-row loc-review-counter-row--no-count">
          ${undoRedoHtml}
        </div>`;
  };

  const cards = langCodes.map(lang => {
    const isPrimary = lang === primary;
    const langName = escHtml(OB_LANG_NAMES[lang] || lang);
    const raw = _iasFieldValue(field, lang);

    if (reviewMode && !isPrimary) {
      const back = _locReviewBackTranslationValue(field, lang);
      // TOP half: shows a translate-in-progress indicator for EITHER of
      // the two things that can currently be writing into this language's
      // own real field — the Primary Language batch translate
      // (_iasTriggerAutoTranslate, triggered by a primary-field edit,
      // covering potentially every supporting language at once) OR this
      // one card's own bottom-half edit forward-translating back into it
      // (_locReviewCommitPrimaryEdit's forwardStatus) — whichever is
      // actually in flight for this (field, lang) right now; the two are
      // never both active at once for the same language.
      // BOTTOM half: shows a translate-in-progress indicator for the
      // top -> Primary Language back-translation refresh (back.status) —
      // fired either by a direct top-half edit, or by the cascade after
      // the Primary Language batch translate above lands this language's
      // new top text.
      const topStatusHtml = _iasFieldTranslatePending(field, lang)
        ? locReviewLoadingSpinnerHtml
        : locReviewStatusHtml(back.forwardStatus);
      const bottomStatusHtml = locReviewStatusHtml(back.status);

      return `
      <div class="loc-review-card">
        <div class="loc-review-side">
          <div class="loc-review-half loc-review-half--top">
            <div class="loc-review-card-head"><div class="loc-review-card-lang">${langName}</div>${topStatusHtml}</div>
            ${fieldBlock(raw, `startLocReviewInlineEdit('${field}','${lang}',this,event)`, undoRedoGroup('real', field, lang))}
          </div>
          <div class="loc-review-half loc-review-half--bottom">
            <div class="loc-review-card-head"><div class="loc-review-card-lang">${primaryName}</div>${bottomStatusHtml}</div>
            ${fieldBlockNoLimit(back.text, `startLocReviewBackTranslationEdit('${field}','${lang}',this,event)`, undoRedoGroup('draft', field, lang))}
          </div>
        </div>
      </div>`;
    }

    // Source-of-text badge — see _locReviewSourceBadge (app.js) for exactly
    // when each applies. 'steam' reuses platformIcon's monochrome/white
    // variant, the same treatment as the Preview Website Factsheet's
    // Platforms sub-section (.pk-platform-icon); 'ai' reuses the same ✦
    // sparkle used for AI-inferred Content Questions answers (.ai-badge).
    // A card currently awaiting a fresh translation from the Primary
    // Language batch (_iasFieldTranslatePending, app.js — never true for
    // the Primary Language's own card) shows the loading spinner INSTEAD
    // of whatever source badge its current (about-to-be-replaced) text
    // would otherwise carry.
    const isPending = !isPrimary && _iasFieldTranslatePending(field, lang);
    const srcBadge = _locReviewSourceBadge(field, lang);
    const badgeHtml = isPending
      ? locReviewLoadingSpinnerHtml
      : srcBadge === 'steam'
        ? `<span class="loc-review-source-badge loc-review-source-badge--steam" title="Pulled from Steam">${platformIcon('steam', 13, 'white')}</span>`
        : srcBadge === 'ai'
          ? `<span class="loc-review-source-badge loc-review-source-badge--ai" title="Auto-translated">✦</span>`
          : '';

    return `
      <div class="loc-review-card${isPrimary ? ' loc-review-card--primary' : ''}">
        <div class="loc-review-card-head">
          <div class="loc-review-card-lang">${langName}</div>
          ${badgeHtml}
        </div>
        ${fieldBlock(raw, `startLocReviewInlineEdit('${field}','${lang}',this,event)`, undoRedoGroup('real', field, lang))}
      </div>`;
  }).join('');

  // "Automatically translated fields" settings — gear icon + dropdown of
  // checkboxes controlling which fields Shipmate auto-translates (or, for
  // Title, mirrors) from the Primary Language into supporting languages.
  // See _iasFieldAutoTranslateEnabled/_iasToggleAutoTranslateField (app.js)
  // for the behavior this configures, and state.iasAutoTranslateFields for
  // where the selections live. Defaults (Subtitle/Description/What's New on,
  // Title off) match Shipmate's original hardcoded behavior exactly.
  const autoCfg = state.iasAutoTranslateFields
    || { title: false, subtitle: true, description: true, releaseNotes: true };
  const settingsOpen = !!state.iasReviewSettingsOpen;
  const settingsRow = (key, label) => `
        <label class="cq-check-row loc-review-settings-row">
          <input type="checkbox" ${autoCfg[key] ? 'checked' : ''} onchange="_iasToggleAutoTranslateField('${key}')">
          <span>${label}</span>
        </label>`;
  const settingsGearSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
  const settingsMenu = `
      <div class="loc-review-settings-wrap sw-select-wrap${settingsOpen ? ' is-open' : ''}" id="loc-review-settings-wrap">
        <button class="loc-review-settings-btn" type="button" onclick="_iasToggleReviewSettingsMenu(event)" title="Choose which fields are automatically translated" aria-label="Automatic translation settings">${settingsGearSvg}</button>
        <div class="loc-dropdown loc-review-settings-dropdown">
          <div class="loc-review-settings-heading">Automatically translated fields</div>
          ${settingsRow('title', 'Title')}
          ${settingsRow('subtitle', 'Subtitle')}
          ${settingsRow('description', 'Description')}
          ${settingsRow('releaseNotes', "What's New")}
        </div>
      </div>`;

  return `
    <div class="loc-review-header">
      <div class="loc-review-title-group">
        <div class="loc-review-title">Localization Review</div>
        ${settingsMenu}
      </div>
      <div class="loc-review-header-controls">
        <button class="loc-review-toggle-btn" onclick="toggleLocReviewMode()" title="${reviewMode ? 'Flip back to the normal side' : 'Flip supporting languages to review a back-translation'}">${reviewMode ? 'All locs' : 'Review'}</button>
        ${swSelect('loc-review-field', field, fieldOptions, 'setLocReviewField', '160px', 'right')}
      </div>
    </div>
    <div class="loc-review-cards${isLongField ? ' loc-review-cards--long-field' : ''}${reviewMode ? ' loc-review-cards--review-mode' : ''}">${cards}</div>`;
}

/* ── Submit Modal (non-iOS legacy) ──────────────────── */

function renderSubmitModal() {
  const modal = document.getElementById('submit-modal');
  if (!modal) return;
  renderGenericSubmitModal(modal);
}

/* Generic (non-iOS) content-review modal — existing risk-summary approach */
function renderGenericSubmitModal(modal) {
  const { platformId } = state.submitModal;
  const p        = PLATFORMS[platformId];
  const riskData = computeSubmitRisk();

  const RISK_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2, NONE: 3 };
  const sorted = [...RISK_CATEGORIES].sort((a, b) =>
    RISK_ORDER[riskData[a.id]?.risk || 'NONE'] - RISK_ORDER[riskData[b.id]?.risk || 'NONE']
  );

  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  RISK_CATEGORIES.forEach(cat => counts[riskData[cat.id]?.risk || 'LOW']++);

  modal.innerHTML = `
    <div class="submit-modal-header" style="border-top-color:${p.color};">
      <div class="submit-modal-title-row">
        <div class="submit-modal-hicon" style="color:${p.color};">${platformIcon(platformId, 22)}</div>
        <div>
          <div class="submit-modal-title">Content Review</div>
          <div class="submit-modal-subtitle">${p.label} · Before you submit</div>
        </div>
      </div>
      <button class="task-modal-close" onclick="closeSubmitModal()">×</button>
    </div>

    <div class="submit-modal-scroll">
      <div class="submit-modal-intro">
        We've evaluated your game against platform content requirements using your onboarding answers and description. Review each category — expand any row for signals and risk justification.
      </div>
      <div class="submit-risk-summary">
        ${counts.HIGH   > 0 ? `<span class="risk-pill risk-HIGH">${counts.HIGH} HIGH</span>` : ''}
        ${counts.MEDIUM > 0 ? `<span class="risk-pill risk-MEDIUM">${counts.MEDIUM} MEDIUM</span>` : ''}
        ${counts.LOW    > 0 ? `<span class="risk-pill risk-LOW">${counts.LOW} LOW</span>` : ''}
      </div>
      <div class="submit-categories">
        ${sorted.map(cat => buildRiskCategoryRow(cat, riskData[cat.id])).join('')}
      </div>
    </div>

    <div class="submit-modal-footer">
      <button class="btn btn-ghost" onclick="closeSubmitModal()">Save Draft</button>
      <button class="btn btn-primary submit-confirm-btn" onclick="confirmAndSubmit('${platformId}')">
        Confirm & Submit →
      </button>
    </div>`;
}


/* ── Track selection modal (shown before final submit for ios/android/steam) ── */
// Renders into the existing submit-overlay / submit-modal so we don't need a new overlay.
function renderTrackSubmitModal(pid) {
  const modal = document.getElementById('submit-modal');
  if (!modal) return;
  const p        = PLATFORMS[pid];
  const tracks   = PLATFORM_TRACKS[pid] || [];
  const proj     = state.projects.find(pr => pr.id === state.activeProjectId);
  const activeVer = proj?.versions.find(v => v.id === state.activeVersionId);
  const versionNum  = activeVer?.versionNumber || '1.0';
  const releaseName = activeVer?.name ? ` — ${escHtml(activeVer.name)}` : '';
  const defaultTrack = proj ? getLastUsedTrack(proj, pid) : (tracks[0]?.id || 'production');

  const trackRows = tracks.map(tr => {
    const liveVer = proj ? getTrackLiveVersion(proj, pid, tr.id) : null;
    const liveLabel = liveVer ? t('track.submit.live', {ver: liveVer}) : t('track.submit.no_live');
    return `
      <label class="track-opt-row">
        <input type="radio" class="track-opt-radio" name="track-sel-${pid}" value="${escHtml(tr.id)}"
               ${tr.id === defaultTrack ? 'checked' : ''}>
        <div class="track-opt-info">
          <span class="track-opt-label">${escHtml(tTrack(pid, tr.id))}</span>
          <span class="track-opt-live">${liveLabel}</span>
        </div>
      </label>`;
  }).join('');

  modal.innerHTML = `
    <div class="submit-modal-header" style="border-top-color:${p.color};">
      <div class="submit-modal-title-row">
        <div class="submit-modal-hicon" style="color:${p.color};">${platformIcon(pid, 22)}</div>
        <div>
          <div class="submit-modal-title">${t('track.submit.title', {platform: platLabel(pid)})}</div>
          <div class="submit-modal-subtitle">v${escHtml(versionNum)}${releaseName}</div>
        </div>
      </div>
      <button class="task-modal-close" onclick="closeSubmitModal()">×</button>
    </div>
    <div class="submit-modal-scroll track-submit-body">
      <div class="track-submit-prompt">${t('track.submit.prompt')}</div>
      <div class="track-opts">
        ${trackRows}
      </div>
    </div>
    <div class="submit-modal-footer">
      <button class="btn btn-ghost" onclick="closeSubmitModal()">${t('btn.cancel')}</button>
      <button class="btn btn-primary" onclick="_confirmTrackSubmit('${pid}')">${t('track.submit.btn')}</button>
    </div>`;
}

/* ── AI inference badge helper ───────────────────────── */
/* ══════════════════════════════════════════════════════════════
   SHARED AI BADGE HELPERS — used by all platforms
   ══════════════════════════════════════════════════════════════ */

// Get answer metadata for any platform.
function _getAnswerMeta(platformId, qid) {
  if (platformId === 'ios')     return state.iosAnswerMeta[qid];
  if (platformId === 'android') return state.cqAnswerMeta[qid];
  if (platformId === 'steam')   return state.steamAnswerMeta[qid];
  return null;
}

// Get the live (current) answer value for any platform.
function _getLiveAnswer(platformId, qid) {
  if (platformId === 'ios')     return state.iosSubmitAnswers[qid];
  if (platformId === 'android') return state.cqAnswers[qid];
  if (platformId === 'steam')   return (state.steamSubmitAnswers.steamContentAnswers || {})[qid];
  return null;
}

/**
 * Returns ' ai-confident' CSS class suffix when the question was answered by AI
 * and the current value matches `val` (if provided).
 * Pass val=undefined to skip the value check (e.g. Steam caller already checks externally).
 */
function _platformAIClass(platformId, qid, val) {
  const meta = _getAnswerMeta(platformId, qid);
  if (!meta || meta.humanConfirmed) return '';
  if (val !== undefined) {
    const ans   = _getLiveAnswer(platformId, qid);
    const match = Array.isArray(ans) ? ans.includes(val) : ans === val;
    if (!match) return '';
  }
  return ' ai-confident';
}

/** Returns AI badge HTML or empty string. */
function _platformAIBadge(platformId, qid, val) {
  return _platformAIClass(platformId, qid, val) ? '<span class="ai-badge">✦</span>' : '';
}

/* ── Shared toggle pill for Unanswered / All filter ─────── */
// Returns toggle pill HTML if collapseMode is active, empty string otherwise.
// offFn / onFn are onclick strings (e.g. 'toggleContentRatingExpanded(false)')
function buildCRTogglePill(collapseMode, showAll, offFn, onFn) {
  if (!collapseMode) return '';
  return `
    <div class="cr-toggle-bar">
      <button class="cr-toggle-btn${!showAll ? ' cr-toggle-active' : ''}"
              onclick="${offFn}">Unanswered</button>
      <button class="cr-toggle-btn${showAll ? ' cr-toggle-active' : ''}"
              onclick="${onFn}">All</button>
    </div>`;
}

/* ── Snapshot helper — captures answered IDs at filter time ─ */
// Called when inference completes or when user clicks "Unanswered".
// Stores a frozen Set so re-answering questions doesn't auto-disappear them.
function takeFilterSnapshot(platformId) {
  if (platformId === 'ios') {
    const a = state.iosSubmitAnswers;
    const s = new Set();
    IOS_INTENSITY_QUESTIONS.forEach(q => { if (a[q.id] !== null && a[q.id] !== undefined) s.add(q.id); });
    IOS_CONTENT_YN_QUESTIONS.forEach(q => { if (a[q.id] !== null && a[q.id] !== undefined) s.add(q.id); });
    // Also snapshot business / export-compliance fields so they are hidden in Unanswered view
    if (a.hasIAP        !== null && a.hasIAP        !== undefined) s.add('hasIAP');
    if (a.usesEncryption !== null && a.usesEncryption !== undefined) s.add('usesEncryption');
    if (a.encryptionExempt !== null && a.encryptionExempt !== undefined) s.add('encryptionExempt');
    if (a.hasERN        !== null && a.hasERN        !== undefined) s.add('hasERN');
    state.iosAnsweredAtInference = s;
  } else if (platformId === 'android') {
    const androidQs = CQ_QUESTIONS.filter(q => q.platforms.includes('android'));
    state.androidAnswerSnapshot = new Set(
      androidQs.map(q => q.id).filter(id => _isCurrentlyAnswered('android', id))
    );
  } else if (platformId === 'steam') {
    const sca = state.steamSubmitAnswers.steamContentAnswers || {};
    state.steamAnsweredAtInference = new Set(
      Object.keys(sca).filter(id => sca[id] === 'yes' || sca[id] === 'no')
    );
  }
}

/* ══════════════════════════════════════════════════════
   SHARED UI PRIMITIVES
   These are app-level building blocks used by every platform.
   Add new question types here — never per-platform.
   ══════════════════════════════════════════════════════ */

/**
 * ynRow — YES/NO question row.
 * Shared across all platforms. Handles toggle, amber rail, and tooltip.
 *
 * @param {string}  label         Question text (may include HTML)
 * @param {*}       value         Current value: 'yes' | 'no' | null
 * @param {string}  onYes         onclick expression for YES button
 * @param {string}  onNo          onclick expression for NO button
 * @param {string}  [tooltip]     Tooltip body text
 * @param {boolean} [inverted]    Swap yes/no visual styling (NO = safe answer)
 * @param {string}  [yesClassXtra] Extra CSS classes on YES button (e.g. AI confidence)
 * @param {string}  [noClassXtra]  Extra CSS classes on NO button
 * @param {string}  [yesContent]  Full button inner HTML (default: 'YES')
 * @param {string}  [noContent]   Full button inner HTML (default: 'NO')
 */
function ynRow(label, value, onYes, onNo,
               tooltip = '', inverted = false,
               yesClassXtra = '', noClassXtra = '',
               yesContent = 'YES', noContent = 'NO') {
  const ttHTML  = tooltip
    ? `<span class="tooltip-anchor"><span class="tooltip-icon">?</span><span class="tooltip-body">${tooltip}</span></span>`
    : '';
  const yesBase = inverted ? 'yn-btn yn-no' : 'yn-btn yn-yes';
  const noBase  = inverted ? 'yn-btn yn-yes' : 'yn-btn yn-no';
  const yesClass = `${yesBase}${value === 'yes' ? ' is-selected' : ''}${yesClassXtra ? ' ' + yesClassXtra : ''}`;
  const noClass  = `${noBase}${value === 'no'  ? ' is-selected' : ''}${noClassXtra  ? ' ' + noClassXtra  : ''}`;
  const yesBtn = `<button class="${yesClass}" onclick="${onYes}">${yesContent}</button>`;
  const noBtn  = `<button class="${noClass}"  onclick="${onNo}">${noContent}</button>`;
  return `
    <div class="ios-q-row" data-answered="${value !== null && value !== undefined ? '1' : '0'}">
      <div class="ios-q-left">
        <div class="ios-q-label">${label}${ttHTML}</div>
      </div>
      <div class="question-yn">
        ${inverted ? noBtn + yesBtn : yesBtn + noBtn}
      </div>
    </div>`;
}

/**
 * singleSelectRow — horizontal button group, single selection.
 * Shared across all platforms. Handles toggle and amber rail.
 * Use for intensity (None/Infrequent/Frequent), 3-way choices, etc.
 *
 * @param {string} label    Question text
 * @param {*}      value    Current selected value (null = unanswered)
 * @param {Array}  options  [{value, label, selectedClass, onSelect, extraClass, content}]
 *                          - selectedClass: CSS class added when this option is selected
 *                          - onSelect: onclick expression string
 *                          - content: optional override HTML inside button
 * @param {string} [tooltip]
 */
function singleSelectRow(label, value, options, tooltip = '') {
  const ttHTML  = tooltip
    ? `<span class="tooltip-anchor"><span class="tooltip-icon">?</span><span class="tooltip-body">${tooltip}</span></span>`
    : '';
  const answered = value !== null && value !== undefined;
  const btns = options.map(o => {
    const sel = value === o.value;
    const cls = `intensity-btn${sel && o.selectedClass ? ' ' + o.selectedClass : ''}${sel && o.extraClass ? ' ' + o.extraClass : ''}`;
    return `<button class="${cls}" onclick="${o.onSelect}">${o.content || o.label}</button>`;
  }).join('');
  return `
    <div class="ios-q-row ios-q-row-intensity" data-answered="${answered ? '1' : '0'}">
      <div class="ios-q-label ios-q-label-sm">${label}${ttHTML}</div>
      <div class="intensity-group">${btns}</div>
    </div>`;
}

/**
 * _isCurrentlyAnswered — real-time answer check for the Unanswered/All toggle.
 * All three platforms' questionnaire filters funnel through this one function
 * so changes to "what counts as answered" apply everywhere at once.
 */
function _isCurrentlyAnswered(platformId, qid) {
  if (platformId === 'ios') {
    const v = state.iosSubmitAnswers[qid];
    return v !== null && v !== undefined && v !== '';
  }
  if (platformId === 'android') {
    const v = state.cqAnswers[qid];
    if (Array.isArray(v)) return v.length > 0;
    return v !== null && v !== undefined && v !== '';
  }
  if (platformId === 'steam') {
    const sca = state.steamSubmitAnswers.steamContentAnswers || {};
    const v   = sca[qid];
    return v !== null && v !== undefined;
  }
  return false;
}

/* ── iOS wrappers — add AI inference decoration on top of shared primitives ── */

// iOS YES/NO row: injects AI confidence classes and badge content
function iosYNRow(label, fieldId, desc, tooltip, inverted = false) {
  const val    = state.iosSubmitAnswers[fieldId];
  const ttText = tooltip || desc || '';
  return ynRow(
    label, val,
    `answerIOSField('${fieldId}','yes')`,
    `answerIOSField('${fieldId}','no')`,
    ttText, inverted,
    _platformAIClass('ios', fieldId, 'yes').trim(),
    _platformAIClass('ios', fieldId, 'no').trim(),
    'YES' + _platformAIBadge('ios', fieldId, 'yes'),
    'NO'  + _platformAIBadge('ios', fieldId, 'no')
  );
}

// iOS intensity row (None / Infrequent / Frequent): injects AI decoration
function iosIntensityRow(label, fieldId, tooltip) {
  const val  = state.iosSubmitAnswers[fieldId];
  const opts = [
    { value: 'frequent',   label: 'Frequent',   selectedClass: 'is-sel-frequent',
      extraClass: _platformAIClass('ios', fieldId, 'frequent').trim(),
      content: 'Frequent'   + _platformAIBadge('ios', fieldId, 'frequent'),
      onSelect: `answerIOSField('${fieldId}','frequent')` },
    { value: 'infrequent', label: 'Infrequent', selectedClass: 'is-sel-infrequent',
      extraClass: _platformAIClass('ios', fieldId, 'infrequent').trim(),
      content: 'Infrequent' + _platformAIBadge('ios', fieldId, 'infrequent'),
      onSelect: `answerIOSField('${fieldId}','infrequent')` },
    { value: 'none',       label: 'None',       selectedClass: 'is-sel-none',
      extraClass: _platformAIClass('ios', fieldId, 'none').trim(),
      content: 'None'       + _platformAIBadge('ios', fieldId, 'none'),
      onSelect: `answerIOSField('${fieldId}','none')` },
  ];
  return singleSelectRow(label, val, opts, tooltip);
}

/* ── Privacy ─────────────────────────────────────────── */
/* ── Questionnaire: combined Content Rating + Data + Business ─ */
function buildQuestionnaireSection(platformId) {
  const sections = [];

  if (platformId === 'ios') {
    sections.push({ label: 'Content Rating',  body: buildContentRatingSection() });
    sections.push({ label: 'Data Privacy',    body: buildPrivacySection() });
    sections.push({ label: 'Business',        body: buildBusinessSection() + buildExportComplianceSection() });
  } else if (platformId === 'android') {
    sections.push({ label: 'Content Rating',  body: buildAndroidContentRatingSection() });
    sections.push({ label: 'Data Safety',     body: buildAndroidDataSafetySection() });
    sections.push({ label: 'Business',        body: buildAndroidBusinessSection() });
  } else if (platformId === 'steam') {
    sections.push({ label: 'Content Rating',  body: buildSteamContentRatingSection() });
    sections.push({ label: 'Store Tags',      body: buildSteamStoreTagsSection() });
    sections.push({ label: 'Technical',       body: buildSteamTechnicalSection() });
  }

  return sections.map((s, i) => `
    <div class="qs-section${i > 0 ? ' qs-section-divided' : ''}">
      <div class="qs-section-header">${s.label}</div>
      ${s.body}
    </div>`).join('');
}

/* ── Privacy / Data Safety preset chips ─────────────── */
function _buildPrivacyPresetChips() {
  const selected = new Set(state.privacyPresets || []);
  const chips = PRIVACY_PRESETS.map(p => {
    const active = selected.has(p.id);
    return `
      <button class="prv-preset-chip${active ? ' is-active' : ''}"
              onclick="togglePrivacyPreset('${p.id}')">
        <span class="prv-preset-chip-label">${escHtml(p.label)}</span>
        <span class="prv-preset-chip-sub">${escHtml(p.sub)}</span>
      </button>`;
  }).join('');
  return `
    <div class="prv-preset-wrap">
      <div class="prv-preset-heading">Quick setup — select everything that applies:</div>
      <div class="prv-preset-chips">${chips}</div>
    </div>`;
}

/* Returns true once the user has saved/closed this step at least once.
   Used to suppress required-field alerts on first entry. */
function _stepAttempted(stepId) {
  const pid = state.stepModal?.platformId;
  return !!(pid && state.stepSaveAttempted?.has(`${pid}-${stepId}`));
}

function buildPrivacySection() {
  const a = state.iosSubmitAnswers;
  const noUrl = !a.privacyPolicyUrl.trim();

  let collectBlock = '';
  if (a.collectsData === 'yes') {
    const descVal = (a.privacyDescription || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const statusHtml = state.privacyAIStatus === 'loading'
      ? `<div class="prv-nlp-status loading"><span class="ai-spinner"></span> Translating to privacy labels…</div>`
      : state.privacyAIStatus === 'complete'
      ? `<div class="prv-nlp-status done">✓ Privacy labels updated — expand below to review or adjust</div>`
      : state.privacyAIStatus === 'error'
      ? `<div class="prv-nlp-status error">Translation failed. <button class="btn-inline" onclick="_triggerPrivacyAI()">Try again</button></div>`
      : '';
    collectBlock = `
      <div class="prv-nlp-wrap">
        <label class="form-label">${t('ios.privacy.desc.label') || 'Describe your data collection'}
          <span class="tooltip-anchor"><span class="tooltip-icon">?</span><span class="tooltip-body">${t('ios.privacy.desc.tooltip') || 'Describe every data type your app collects and why. Shipmate will translate this into the required Apple privacy label selections.'}</span></span>
        </label>
        <textarea class="form-input prv-nlp-textarea"
                  placeholder="${t('ios.privacy.desc.placeholder') || 'e.g., We collect email addresses for account creation, device crash reports to fix bugs, and advertising IDs to serve relevant ads through our ad network.'}"
                  onblur="updatePrivacyDescription(this.value)">${descVal}</textarea>
        ${statusHtml}
        ${buildPrivacyMatrix(a)}
      </div>`;
  }

  return `
    <div class="form-group">
      <label class="form-label">${t('ios.privacy.url.label') || 'Privacy Policy URL'}
        <span class="tooltip-anchor">
          <span class="tooltip-icon">?</span>
          <span class="tooltip-body">${t('ios.privacy.url.tooltip') || 'Apple requires a live, reachable URL. A missing or broken link is an automatic rejection reason.'}</span>
        </span>
      </label>
      <input class="form-input" type="url" id="ios-privacy-url" value="${a.privacyPolicyUrl}"
             placeholder="${t('ob.field.privacy_url.placeholder') || 'https://yourgame.com/privacy'}"
             oninput="setPrivacyUrl(this.value)"
             onblur="reRenderStepModal()">
      ${(noUrl && _stepAttempted('questionnaire')) ? '<div class="ios-risk-note risk-HIGH">Required. A missing privacy policy URL is an automatic App Review rejection.</div>' : ''}
    </div>
    ${_buildPrivacyPresetChips()}
    ${a.collectsData === null ? iosYNRow(t('ios.privacy.collects.label') || 'Does your app collect any data from users?', 'collectsData',
      t('ios.privacy.collects.tooltip') || 'Includes analytics SDKs, crash reporters, accounts, device IDs, or any third-party SDK that collects data.') : ''}
    ${collectBlock}`;
}

function buildPrivacyMatrix(a) {
  const cols = IOS_PURPOSES;
  const META_COLS = [
    { id: 'linked_identity', label: t('ios.privacy.linked.label') || 'Linked to Identity' },
    { id: 'used_tracking',   label: t('ios.privacy.tracking.label') || 'Used for Tracking' },
  ];
  const META_COL_TIPS = {
    linked_identity: t('ios.privacy.linked.tooltip') || "Data directly linked to the user's identity — such as their account, name, or email address.",
    used_tracking:   t('ios.privacy.tracking.tooltip') || "Data used to track the user across third-party apps or websites for advertising or analytics.",
  };

  const expanded        = state.privacyMatrixExpanded;
  const selectedTypeIds = new Set(Object.keys(a.dataPerType));
  const selectedCount   = Object.keys(a.dataPerType).length;

  // Header row with inline tooltips
  const purposeHeaders = cols.map(c => {
    const cLabel = t(`ios.purpose.${c.id}.label`) || c.label;
    const cDesc  = t(`ios.purpose.${c.id}.desc`)  || c.desc;
    return `<th class="prv-col-hd"><span class="tooltip-anchor" data-tip="${cDesc}">${cLabel} <span class="tooltip-icon">?</span><span class="tooltip-body">${cDesc}</span></span></th>`;
  }).join('');
  const metaHeaders = META_COLS.map(c =>
    `<th class="prv-col-hd prv-meta-col"><span class="tooltip-anchor" data-tip="${META_COL_TIPS[c.id]}">${c.label} <span class="tooltip-icon">?</span><span class="tooltip-body">${META_COL_TIPS[c.id]}</span></span></th>`).join('');

  // Build rows — all types shown when expanded (grouped); none when collapsed
  let bodyHtml = '';
  if (expanded) {
    IOS_DATA_TYPES.forEach(group => {
      bodyHtml += `<tr class="prv-group-row"><td colspan="${1 + cols.length + META_COLS.length}">${group.group}</td></tr>`;
      group.types.forEach(t => {
        const isOn = !!a.dataPerType[t.id];
        const td   = a.dataPerType[t.id] || { purposes: [], identity: null, tracking: null };
        const purposeCells = cols.map(c => {
          const checked = td.purposes.includes(c.id);
          return `<td class="prv-check-cell">
            <input type="checkbox" class="prv-cb" ${isOn ? '' : 'disabled'}
                   data-type="${t.id}" data-col="${c.id}"
                   ${checked ? 'checked' : ''}
                   onclick="event.stopPropagation()"
                   onchange="togglePrivacyPurpose('${t.id}','${c.id}',this.checked)">
          </td>`;
        }).join('');
        const metaCells = META_COLS.map(c => {
          const isChecked = c.id === 'linked_identity' ? td.identity === 'yes' : td.tracking === 'yes';
          const field     = c.id === 'linked_identity' ? 'identity' : 'tracking';
          return `<td class="prv-check-cell prv-meta-col">
            <input type="checkbox" class="prv-cb" ${isOn ? '' : 'disabled'}
                   data-type="${t.id}" data-meta="${field}"
                   ${isChecked ? 'checked' : ''}
                   onclick="event.stopPropagation()"
                   onchange="setPrivacyMeta('${t.id}','${field}',this.checked)">
          </td>`;
        }).join('');
        bodyHtml += `
          <tr class="prv-data-row ${isOn ? 'is-on' : ''}" onclick="togglePrivacyDataType('${t.id}')">
            <td class="prv-type-cell">
              <span class="prv-type-name tooltip-anchor" data-tip="${t.desc}">${t.label}</span>
            </td>
            ${purposeCells}
            ${metaCells}
          </tr>`;
      });
    });
  }

  const tableHtml = expanded ? `
    <div class="prv-matrix-wrap">
      <table class="prv-matrix">
        <thead>
          <tr>
            <th class="prv-type-hd">Data Type</th>
            ${purposeHeaders}
            ${metaHeaders}
          </tr>
        </thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>
    ${Object.values(a.dataPerType).some(t => t.tracking === 'yes') ?
      `<div class="dist-tip-box" style="margin-top:10px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span><strong>Tracking:</strong> You must implement Apple's AppTrackingTransparency framework and request user permission before collecting any data used for tracking.</span>
      </div>` : ''}` : '';

  return `
    <div class="ios-subsection" style="margin-top:10px;">
      <div class="prv-matrix-header">
        ${selectedCount > 0 ? `<span class="prv-count-badge">${selectedCount} type${selectedCount !== 1 ? 's' : ''} selected</span>` : ''}
        <button class="prv-expand-btn" onclick="togglePrivacyMatrix()">
          ${expanded ? `${_chevUp} Hide data types` : `${_chevDown} Show all data types`}
        </button>
      </div>
      ${tableHtml}
    </div>`;
}

/* ── Click-to-pane tooltip rows ───────────────────────── */
// Maps content-rating field IDs to doc pane section IDs.
// Questions without a dedicated section fall back to the general 'contentRating' section.
const QUESTIONNAIRE_DOC_SECTIONS = {
  parentalControls:    'parentalControls',
  ageAssurance:        'ageAssurance',
  unrestrictedInternet:'contentRating',
  userGenContent:      'contentRating',
  messagingChat:       'contentRating',
  advertising:         'contentRating',
  profanity:           'contentRating',
  horrorFear:          'contentRating',
  substancesAlcohol:   'contentRating',
  medicalTreatment:    'contentRating',
  healthWellness:      'contentRating',
  matureSuggestive:    'contentRating',
  sexualContent:       'contentRating',
  graphicSexual:       'contentRating',
  cartoonViolence:     'contentRating',
  realisticViolence:   'contentRating',
  extendedViolence:    'contentRating',
  gunsWeapons:         'contentRating',
  simulatedGambling:   'contentRating',
  contests:            'contentRating',
  realMoneyGambling:   'contentRating',
  lootBoxes:           'contentRating',
};

// Y/N row with click-to-open-pane tooltip and data-doc-section for row-hover highlighting.
function iosYNRowDocPane(label, fieldId, tooltip, docSection) {
  const val    = state.iosSubmitAnswers[fieldId];
  const ttHTML = tooltip
    ? `<span class="tooltip-anchor tooltip-click" data-tip="${tooltip}" onclick="openDocPaneSection('${docSection}',event)"><span class="tooltip-icon">?</span><span class="tooltip-body">${tooltip}</span></span>`
    : '';
  const yesClass = `yn-btn yn-yes${val === 'yes' ? ' is-selected' : ''}${_platformAIClass('ios', fieldId, 'yes').trim() ? ' ' + _platformAIClass('ios', fieldId, 'yes').trim() : ''}`;
  const noClass  = `yn-btn yn-no${val === 'no'   ? ' is-selected' : ''}${_platformAIClass('ios', fieldId, 'no').trim()  ? ' ' + _platformAIClass('ios', fieldId, 'no').trim()  : ''}`;
  return `
    <div class="ios-q-row" data-answered="${val !== null && val !== undefined ? '1' : '0'}" data-doc-section="${docSection}">
      <div class="ios-q-left">
        <div class="ios-q-label">${label}${ttHTML}</div>
      </div>
      <div class="question-yn">
        <button class="${yesClass}" onclick="answerIOSField('${fieldId}','yes')">YES${_platformAIBadge('ios', fieldId, 'yes')}</button>
        <button class="${noClass}"  onclick="answerIOSField('${fieldId}','no')">NO${_platformAIBadge('ios', fieldId, 'no')}</button>
      </div>
    </div>`;
}

// Intensity row (Frequent/Infrequent/None) with same click-to-open-pane tooltip.
function iosIntensityRowDocPane(label, fieldId, tooltip, docSection) {
  const val     = state.iosSubmitAnswers[fieldId];
  const ttHTML  = tooltip
    ? `<span class="tooltip-anchor tooltip-click" data-tip="${tooltip}" onclick="openDocPaneSection('${docSection}',event)"><span class="tooltip-icon">?</span><span class="tooltip-body">${tooltip}</span></span>`
    : '';
  const answered = val !== null && val !== undefined;
  const opts = [
    { value: 'frequent',   cls: 'is-sel-frequent',   label: 'Frequent'   },
    { value: 'infrequent', cls: 'is-sel-infrequent', label: 'Infrequent' },
    { value: 'none',       cls: 'is-sel-none',        label: 'None'       },
  ];
  const btns = opts.map(o => {
    const sel      = val === o.value;
    const aiClass  = _platformAIClass('ios', fieldId, o.value).trim();
    const cls      = `intensity-btn${sel && o.cls ? ' ' + o.cls : ''}${sel && aiClass ? ' ' + aiClass : ''}`;
    return `<button class="${cls}" onclick="answerIOSField('${fieldId}','${o.value}')">${o.label}${_platformAIBadge('ios', fieldId, o.value)}</button>`;
  }).join('');
  return `
    <div class="ios-q-row ios-q-row-intensity" data-answered="${answered ? '1' : '0'}" data-doc-section="${docSection}">
      <div class="ios-q-label ios-q-label-sm">${label}${ttHTML}</div>
      <div class="intensity-group">${btns}</div>
    </div>`;
}

/* ── Content Rating ──────────────────────────────────── */
// Category structure for iOS Content Rating — used by buildContentRatingSection to
// render questions and to separate answered vs unanswered after AI inference.
const IOS_CR_CATEGORIES = [
  { id: 'features',    label: 'Features', questions: [
    { type: 'yn',        id: 'parentalControls' },
    { type: 'yn',        id: 'ageAssurance' },
    { type: 'yn',        id: 'unrestrictedInternet' },
    { type: 'yn',        id: 'userGenContent' },
    { type: 'yn',        id: 'messagingChat' },
    { type: 'yn',        id: 'advertising' },
  ]},
  { id: 'mature',      label: 'Mature Themes', questions: [
    { type: 'intensity', id: 'profanity' },
    { type: 'intensity', id: 'horrorFear' },
    { type: 'intensity', id: 'substancesAlcohol' },
  ]},
  { id: 'medical',     label: 'Medical or Wellness', questions: [
    { type: 'intensity', id: 'medicalTreatment' },
    { type: 'yn',        id: 'healthWellness' },
  ]},
  { id: 'sexuality',   label: 'Sexuality or Nudity', questions: [
    { type: 'intensity', id: 'matureSuggestive' },
    { type: 'intensity', id: 'sexualContent' },
    { type: 'intensity', id: 'graphicSexual' },
  ]},
  { id: 'violence',    label: 'Violence', questions: [
    { type: 'intensity', id: 'cartoonViolence' },
    { type: 'intensity', id: 'realisticViolence' },
    { type: 'intensity', id: 'extendedViolence' },
    { type: 'intensity', id: 'gunsWeapons' },
  ]},
  { id: 'gambling',    label: 'Chance-Based Activities', questions: [
    { type: 'intensity', id: 'simulatedGambling' },
    { type: 'intensity', id: 'contests' },
    { type: 'yn',        id: 'realMoneyGambling' },
    { type: 'yn',        id: 'lootBoxes' },
  ]},
];

// Risk notes that follow specific questions wherever they're rendered
const IOS_CR_RISK_NOTES = {
  realMoneyGambling: a => a.realMoneyGambling === 'yes'
    ? '<div class="ios-risk-note risk-HIGH">Real-money gambling requires a special Apple entitlement and proof of licensing in every territory where it is offered. Apple will ask for documentation during review.</div>'
    : '',
  lootBoxes: a => a.lootBoxes === 'yes'
    ? '<div class="ios-risk-note risk-MEDIUM">Apps with loot boxes must clearly disclose the odds of receiving each item type before a player makes a purchase.</div>'
    : '',
};

function buildContentRatingSection() {
  const a = state.iosSubmitAnswers;

  // Quick lookups
  const iq = id => { const q = IOS_INTENSITY_QUESTIONS.find(q => q.id === id); return { ...q, label: t(`iosint.${q.id}.label`) || q.label, tooltip: t(`iosint.${q.id}.tooltip`) || q.tooltip }; };
  const yq = id => { const q = IOS_CONTENT_YN_QUESTIONS.find(q => q.id === id); return { ...q, label: t(`iosyn.${q.id}.label`) || q.label, tooltip: t(`iosyn.${q.id}.tooltip`) || q.tooltip }; };

  // Render one question row — all content-rating questions use click-to-pane tooltips
  const renderQ = q => {
    const docSection = QUESTIONNAIRE_DOC_SECTIONS[q.id];
    let html;
    if (q.type === 'intensity') {
      const d = iq(q.id);
      html = docSection
        ? iosIntensityRowDocPane(d.label, q.id, d.tooltip, docSection)
        : iosIntensityRow(d.label, d.id, d.tooltip);
    } else {
      const d = yq(q.id);
      html = docSection
        ? iosYNRowDocPane(d.label, q.id, d.tooltip, docSection)
        : iosYNRow(d.label, q.id, '', d.tooltip);
    }
    return html + (IOS_CR_RISK_NOTES[q.id] ? IOS_CR_RISK_NOTES[q.id](a) : '');
  };

  // Whether a question was answered at inference time (determines collapse eligibility)
  const answered     = state.iosAnsweredAtInference; // null = pre-inference, Set = post-inference
  const showAll      = state.iosContentRatingExpanded; // false = "Unanswered", true = "All"
  const collapseMode = answered !== null;

  // "Unanswered / All" toggle pill — shown only after AI inference has run
  const togglePill = buildCRTogglePill(collapseMode, showAll,
    'toggleContentRatingExpanded(false)', 'toggleContentRatingExpanded(true)');

  // Build question rows — filter by answered/unanswered when in collapseMode + "Unanswered" view
  // Uses snapshot (answered) not live state so questions don't vanish mid-session
  let questionsHtml = '';
  for (const cat of IOS_CR_CATEGORIES) {
    const qsToShow = (collapseMode && !showAll)
      ? cat.questions.filter(q => !answered.has(q.id))
      : cat.questions;

    if (qsToShow.length > 0) {
      questionsHtml += `<div class="ios-q-divider"></div>
        <div class="ios-content-step-label">${cat.label}</div>
        ${qsToShow.map(renderQ).join('')}`;
    }
  }

  // Additional Information section — always visible (it's a categorisation choice, not content Q)
  const kidsFollowUp = a.ageCategory === 'made_for_kids' ? `
    <div class="ios-followup">
      <div class="ios-q-label" style="margin-bottom:8px;">Kids age range</div>
      <div class="ios-radio-group">
        ${[['under5','Ages 5 and under'],['6to8','Ages 6–8'],['9to11','Ages 9–11']].map(([val,lbl]) => `
          <label class="ios-radio-label">
            <input type="radio" name="ios-kids-age" value="${val}" ${a.kidsAgeRange === val ? 'checked' : ''}
                   onchange="answerIOSField('kidsAgeRange','${val}')"> ${lbl}
          </label>`).join('')}
      </div>
    </div>` : '';

  const overrideFollowUp = a.ageCategory === 'override_higher' ? `
    <div class="ios-followup">
      <div class="ios-q-label" style="margin-bottom:8px;">Override to rating</div>
      <div class="ios-radio-group">
        ${[['9','Age 9+'],['13','Age 13+'],['16','Age 16+'],['18','Age 18+']].map(([val,lbl]) => `
          <label class="ios-radio-label">
            <input type="radio" name="ios-override-rating" value="${val}" ${a.overrideRating === val ? 'checked' : ''}
                   onchange="answerIOSField('overrideRating','${val}')"> ${lbl}
          </label>`).join('')}
      </div>
    </div>` : '';

  const additionalSection = `
    <div class="ios-q-divider"></div>
    <div class="ios-content-step-label">Additional Information</div>
    <div class="ios-q-row" style="align-items:center;gap:12px;">
      <div class="ios-q-left">
        <div class="ios-q-label">${t('ios.age.category.label') || 'Age Category'}
          <span class="tooltip-anchor"><span class="tooltip-icon">?</span><span class="tooltip-body">${t('ios.age.category.tooltip') || 'Override the calculated rating for apps targeting a specific age group or with EULA age requirements.'}</span></span>
        </div>
      </div>
      <select class="form-input" style="width:auto;min-width:220px;font-size:12px;" onchange="answerIOSField('ageCategory',this.value)">
        <option value="">Select…</option>
        <option value="not_applicable"  ${a.ageCategory==='not_applicable' ?'selected':''}>${t('ios.age.category.not_applicable') || 'Not Applicable'}</option>
        <option value="made_for_kids"   ${a.ageCategory==='made_for_kids'  ?'selected':''}>${t('ios.age.category.made_for_kids') || 'Made for Kids'}</option>
        <option value="override_higher" ${a.ageCategory==='override_higher'?'selected':''}>${t('ios.age.category.override_higher') || 'Override to Higher Rating'}</option>
      </select>
    </div>
    ${kidsFollowUp}
    ${overrideFollowUp}
    ${(collapseMode && !showAll) ? '' : `
    <div class="form-group" style="margin-top:14px;">
      <label class="form-label">${t('ios.age.suitability.label') || 'Age Suitability URL'} <span class="form-section-note">${t('ob.field.optional_tag') || 'Optional'}</span>
        <span class="tooltip-anchor"><span class="tooltip-icon">?</span><span class="tooltip-body">${t('ios.age.suitability.tooltip') || 'A URL with additional age suitability information for Apple reviewers.'}</span></span>
      </label>
      <input class="form-input" type="url" value="${a.ageSuitabilityUrl}"
             placeholder="${t('ios.age.suitability.placeholder') || 'https://yourgame.com/age-suitability'}"
             oninput="updateIOSTextField('ageSuitabilityUrl', this.value)"
             onblur="reRenderStepModal()">
    </div>`}`;

  return togglePill + questionsHtml + additionalSection;
}

function computeIOSAgeRating() {
  const a = state.iosSubmitAnswers;

  // Step 7 override takes precedence
  if (a.ageCategory === 'made_for_kids') {
    const map = { under5: '4+', '6to8': '4+', '9to11': '9+' };
    return a.kidsAgeRange ? map[a.kidsAgeRange] : null;
  }
  if (a.ageCategory === 'override_higher') {
    const map = { '9': '9+', '13': '13+', '16': '16+', '18': '18+' };
    return a.overrideRating ? map[a.overrideRating] : null;
  }

  // Compute from content answers
  if (a.graphicSexual === 'frequent' || a.sexualContent === 'frequent' ||
      a.realisticViolence === 'frequent' || a.extendedViolence === 'frequent' ||
      a.realMoneyGambling === 'yes') return '17+';
  const hasInfrequent = IOS_INTENSITY_QUESTIONS.some(q => a[q.id] === 'infrequent' || a[q.id] === 'frequent');
  if (hasInfrequent || a.userGenContent === 'yes' || a.unrestrictedInternet === 'yes' ||
      a.messagingChat === 'yes') return '12+';
  if (IOS_INTENSITY_QUESTIONS.every(q => a[q.id] !== null)) return '4+';
  return null;
}

/* ── Export Compliance ───────────────────────────────── */
function buildExportComplianceSection() {
  const a = state.iosSubmitAnswers;

  // Respect the Unanswered/All filter — hide this section when usesEncryption is answered
  const answered     = state.iosAnsweredAtInference;
  const collapseMode = answered !== null;
  const showAll      = state.iosContentRatingExpanded;
  if (collapseMode && !showAll && answered.has('usesEncryption')) return '';

  let followUp = '';
  if (a.usesEncryption === 'yes') {
    followUp = `<div class="ios-followup">
      ${iosYNRow('Is the encryption exempt from US export regulations?', 'encryptionExempt',
        'Exempt: standard HTTPS/TLS for data in transit, standard auth only, no custom algorithms.')}
      ${a.encryptionExempt === 'no' ? `
        <div class="ios-followup">
          ${iosYNRow('Do you have an Encryption Registration Number (ERN) from the US Bureau of Industry and Security?', 'hasERN', '')}
          ${a.hasERN === 'yes' ? `
            <div class="form-group" style="margin-top:8px;">
              <label class="form-label">${t('ios.export.ern.label') || 'ERN Number'}</label>
              <input class="form-input" type="text" value="${a.ernNumber}" placeholder="${t('ios.export.ern.placeholder') || 'ENC-XXXXXXXX'}"
                     oninput="updateIOSTextField('ernNumber', this.value)"
                     onblur="reRenderStepModal()">
            </div>` : ''}
          ${a.hasERN === 'no' ? '<div class="ios-risk-note risk-HIGH">An ERN is required before submitting apps with non-exempt encryption. Apply at bis.doc.gov.</div>' : ''}
        </div>` : ''}
    </div>`;
  }

  return `
    ${iosYNRow('Does your app use, contain, or incorporate cryptography or encryption?', 'usesEncryption',
      'Includes HTTPS, SSL/TLS, data-at-rest encryption, and any third-party SDK that uses encryption (AWS, Firebase, etc.).')}
    ${followUp}
    ${a.usesEncryption === 'no' ? '<div class="ios-note">No encryption — your app qualifies as exempt. No ERN required.</div>' : ''}`;
}

/* ── Business ────────────────────────────────────────── */
function buildBusinessSection() {
  const a = state.iosSubmitAnswers;

  // Unanswered/All filter — hide answered rows in Unanswered view
  const bsAnswered    = state.iosAnsweredAtInference;
  const bsCollapse    = bsAnswered !== null;
  const bsShowAll     = state.iosContentRatingExpanded;
  const hideIAP       = bsCollapse && !bsShowAll && bsAnswered?.has('hasIAP');
  // Tax category defaults to 'games' — always hide in Unanswered view if it has a value
  const hideTaxCat    = bsCollapse && !bsShowAll && !!a.taxCategory;

  const IAP_TYPES = [
    { id: 'consumable',     label: 'Consumable',         desc: 'Coins, lives, boosts' },
    { id: 'non-consumable', label: 'Non-consumable',     desc: 'Unlock levels, remove ads' },
    { id: 'auto-renewable', label: 'Auto-renewable sub', desc: 'Monthly/yearly subscription' },
    { id: 'non-renewing',   label: 'Non-renewing sub',   desc: 'Season pass, time-limited' },
  ];
  const TAX_CATS = ['Games', 'Software', 'Books', 'News', 'Music', 'Podcasts', 'Video'];

  const iapFollowUp = a.hasIAP === 'yes' ? `
    <div class="ios-followup">
      <div class="ios-q-label" style="margin-bottom:8px;">Which IAP types does your app include?</div>
      <div class="data-type-chips">
        ${IAP_TYPES.map(t => `
          <button class="data-type-chip ${a.iapTypes.includes(t.id) ? 'is-on' : ''}"
                  onclick="toggleIOSIAPType('${t.id}')" title="${t.desc}">${t.label}</button>`).join('')}
      </div>
      <div style="margin-top:12px;">
        ${iosYNRow('Does any subscription include a free trial?', 'hasFreeTrial', '')}
      </div>
    </div>` : '';

  const fd = state.formData;
  const priceVal = fd.price || '';

  return `
    <div class="form-group">
      <label class="form-label">Price (USD)
        <span class="tooltip-anchor">
          <span class="tooltip-icon">?</span>
          <span class="tooltip-body">Your base price for iOS. Leave blank or enter 0 for free. Shipmate will convert to local currencies across all regions.</span>
        </span>
      </label>
      <input class="form-input" id="ios-price" type="text" placeholder="4.99 (or 0 for free)"
             value="${priceVal}"
             oninput="syncField('price', this.value)"
             onblur="roundPrice(this)">
    </div>
    ${hideIAP ? '' : iosYNRow('Does your app include in-app purchases?', 'hasIAP',
      'Includes any paid upgrades, cosmetics, virtual currency, or subscriptions.')}
    ${hideIAP ? '' : iapFollowUp}
    ${hideTaxCat ? '' : `
    <div class="form-group" style="margin-top:14px;">
      <label class="form-label">Tax Category
        <span class="tooltip-anchor">
          <span class="tooltip-icon">?</span>
          <span class="tooltip-body">Determines how Apple handles VAT and GST in each country. Choose the category that best describes your app.</span>
        </span>
      </label>
      <select class="form-input" onchange="answerIOSField('taxCategory', this.value)">
        <option value="">Select a category</option>
        ${TAX_CATS.map(c => `<option value="${c.toLowerCase()}" ${a.taxCategory === c.toLowerCase() ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>`}`;
}

/* ── Distribution ────────────────────────────────────── */
function buildDistributionSection() {
  const a = state.iosSubmitAnswers;
  const MAX_GAMERS = 140; // China, for bar scaling
  const VISIBLE = 10;

  function fmtGamers(n) {
    if (n >= 100) return n + 'M';
    if (n >= 10)  return n + 'M';
    return n + 'M';
  }

  const extraCount = IOS_COUNTRIES.length - VISIBLE;

  // Build rows; inject the expand button between row VISIBLE-1 and row VISIBLE
  const rows = IOS_COUNTRIES.map((c, i) => {
    const isOn  = a.selectedCountries.includes(c.code);
    const pct   = Math.round((c.iosGamers / MAX_GAMERS) * 100);
    const label = fmtGamers(c.iosGamers);
    const hidden = i >= VISIBLE ? ' dist-row-extra' : '';

    // Inject the expand toggle as a pseudo-row right after the 10th entry
    const expandBtn = i === VISIBLE ? `
      <div class="dist-expand-row" id="dist-expand-btn" onclick="toggleDistExpand()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        ${t('ob.dist.show_more', { count: extraCount })}
      </div>` : '';

    return `${expandBtn}
      <div class="dist-country-row${hidden}">
        <button class="dist-country-chip ${isOn ? 'is-on' : ''}"
                id="dist-chip-${c.code}"
                onclick="toggleIOSCountry('${c.code}')">${c.name}</button>
        <div class="dist-bar-wrap">
          <div class="dist-bar-fill" id="dist-bar-${c.code}" style="width:${pct}%; background:${isOn ? 'rgba(59,130,246,0.5)' : 'var(--border-hover)'}"></div>
        </div>
        <span class="dist-gamer-count">${label}</span>
      </div>`;
  }).join('');

  const preset = a.distPreset || 'custom';

  return `
    <div id="distribution-map-container" class="world-map-container" style="margin-bottom:14px;"></div>
    <div class="ios-q-label" style="margin-bottom:8px;">${t('ob.dist.question') || 'Where do you intend to make the game available?'}</div>
    <div class="dist-preset-row">
      <button class="dist-preset-btn ${preset === 'everywhere' ? 'is-active' : ''}" onclick="setDistPreset('everywhere')">${t('ob.dist.preset.everywhere') || 'Everywhere'}</button>
      <button class="dist-preset-btn ${preset === 'everywhere_except_cn' ? 'is-active' : ''}" onclick="setDistPreset('everywhere_except_cn')">${t('ob.dist.preset.everywhere_except_cn')}</button>
      <button class="dist-preset-btn ${preset === 'english_only' ? 'is-active' : ''}" onclick="setDistPreset('english_only')">${t('ob.dist.preset.english_only') || 'English only'}</button>
      <button class="dist-preset-btn ${preset === 'custom' ? 'is-active' : ''}" onclick="setDistPreset('custom')">${t('ob.dist.preset.custom') || 'Custom'}</button>
    </div>
    <div class="dist-tip-box">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>${t('tip.distribution.regions') || 'Gamer behavior varies significantly between regions. A successful launch carefully considers localization, culturalization, purchase behavior, and market fit in each region.'}</span>
    </div>
    <div class="dist-list-header">
      <span class="dist-list-col-country">Market</span>
      <span class="dist-list-col-bar"></span>
      <span class="dist-list-col-count">iOS Gamers (Approx)</span>
    </div>
    <div class="dist-country-list" id="dist-country-list">
      ${rows}
    </div>`;
}

function buildRiskCategoryRow(cat, data) {
  const risk        = data?.risk || 'NONE';
  const signals     = data?.signals || [];
  const justification = data?.justification || '';
  const expanded    = state.submitModal.expanded.includes(cat.id);

  const signalsHTML = signals.length ? `
    <div class="risk-signals">
      ${signals.map(s => `
        <div class="risk-signal">
          <span class="signal-label">${s.label}</span>
          <span class="signal-value">${s.value}</span>
          <span class="signal-source">${s.source}</span>
        </div>`).join('')}
    </div>` : '';

  return `
    <div class="risk-cat${expanded ? ' is-expanded' : ''}" id="risk-cat-${cat.id}">
      <div class="risk-cat-head" onclick="toggleRiskCategory('${cat.id}')">
        <div class="risk-cat-left">
          <span class="risk-cat-label">${cat.label}</span>
        </div>
        <div class="risk-cat-right">
          <span class="risk-badge risk-badge-${risk}">${risk}</span>
          <span class="risk-cat-chevron">›</span>
        </div>
      </div>
      <div class="risk-cat-body">
        ${signalsHTML}
        <p class="risk-justification">${justification}</p>
      </div>
    </div>`;
}

/* ── Consolidated Questionnaire Modal ────────────────── */

function buildCQQuestion(q) {
  const answer      = state.cqAnswers[q.id];
  const meta        = state.cqAnswerMeta[q.id];
  const isAI        = meta && !meta.humanConfirmed;
  const isAIHigh    = isAI && meta.confidence >= 90;   // auto-confirmed look
  const isAILow     = isAI && meta.confidence < 90;    // badge + dim
  const activePlats = q.platforms.filter(p => state.activePlatforms.has(p));
  const platColors  = { ios:'#007AFF', android:'#34A853', egs:'#888', steam:'#4c6b8a' };
  const platLabels  = { ios:'iOS', android:'Android', egs:'EGS', steam:'Steam' };

  const badges = activePlats.map(p =>
    `<span class="cq-plat-badge" style="color:${platColors[p]};border-color:${platColors[p]}40;background:${platColors[p]}12;">${platLabels[p]}</span>`
  ).join('');

  const aiBadge = isAILow
    ? `<span class="cq-ai-badge" title="AI suggestion — ${meta.confidence}% confidence. Click any answer to confirm.">AI · ${meta.confidence}%</span>`
    : '';

  const indentStyle = q.indent
    ? `margin-left:${q.indent * 22}px;padding-left:12px;border-left:2px solid var(--border);`
    : '';

  // Dim the entire question if AI-suggested at lower confidence
  const dimClass = isAILow ? 'cq-question-ai-unconfirmed' : '';

  let inputHTML = '';

  if (q.type === 'yn') {
    inputHTML = `
      <div class="cq-yn">
        <button class="cq-yn-btn ${answer === 'yes' ? 'is-active' : ''} ${isAIHigh && answer === 'yes' ? 'is-ai-confirmed' : ''}"
                onclick="setCQAnswer('${q.id}','yes')">Yes</button>
        <button class="cq-yn-btn ${answer === 'no' ? 'is-active' : ''} ${isAIHigh && answer === 'no' ? 'is-ai-confirmed' : ''}"
                onclick="setCQAnswer('${q.id}','no')">No</button>
      </div>`;

  } else if (q.type === 'single') {
    inputHTML = `<div class="cq-single">` +
      (q.options || []).map((opt, i) => `
        <button class="cq-single-btn ${answer === opt ? 'is-active' : ''} ${isAIHigh && answer === opt ? 'is-ai-confirmed' : ''}"
                data-qid="${q.id}" data-oidx="${i}"
                onclick="setCQSingle('${q.id}',${i})">${t(`${q.id}.opt.${i}`) || opt}</button>`
      ).join('') +
      `</div>`;

  } else if (q.type === 'multi') {
    const arr = Array.isArray(answer) ? answer : [];
    inputHTML = `<div class="cq-checkboxes">` +
      (q.options || []).map((opt, i) => `
        <label class="cq-check-row ${isAI && arr.includes(opt) ? 'is-ai-checked' : ''}">
          <input type="checkbox" ${arr.includes(opt) ? 'checked' : ''}
                 data-qid="${q.id}" data-oidx="${i}"
                 onchange="handleCQMulti(this)">
          <span>${t(`${q.id}.opt.${i}`) || opt}</span>
        </label>`
      ).join('') +
      `</div>`;

  } else if (q.type === 'text') {
    const val = typeof answer === 'string' ? answer : '';
    const placeholderText = t(`${q.id}.placeholder`) || (q.placeholder || '');
    inputHTML = `<textarea class="cq-textarea" rows="3"
                  placeholder="${placeholderText.replace(/"/g,'&quot;')}"
                  onblur="setCQAnswer('${q.id}',this.value)">${val}</textarea>`;
  }

  return `
    <div class="cq-question ${dimClass}" style="${indentStyle}">
      <div class="cq-question-top">
        <div class="cq-plat-badges">${badges}</div>
        <div class="cq-q-text">${t(`${q.id}.text`) || q.text}</div>
        ${aiBadge}
      </div>
      ${inputHTML}
    </div>`;
}

function renderCQModal() {
  const modal = document.getElementById('cq-modal');
  if (!modal) return;
  modal.classList.toggle('is-validating', !!state.showHighlights);

  const { total, answered } = cqProgress();
  const pct = total ? Math.round(answered / total * 100) : 0;

  // Gather visible questions preserving definition order
  const sectionOrder = [];
  const sectionMap   = {};
  for (const q of CQ_QUESTIONS) {
    if (!cqIsVisible(q)) continue;
    if (!sectionMap[q.section]) {
      sectionMap[q.section] = [];
      sectionOrder.push(q.section);
    }
    sectionMap[q.section].push(q);
  }

  // Active platform names for subtitle
  const platNames = [...state.activePlatforms].map(p => PLATFORMS[p]?.label).join(' · ');

  let body = '';
  if (sectionOrder.length === 0) {
    body = `<div class="cq-empty">Please select platforms to continue.</div>`;
  } else {
    for (const sec of sectionOrder) {
      body += `<div class="cq-section-header">${sec}</div>`;
      let lastSub = null;
      for (const q of sectionMap[sec]) {
        if (q.subsection && q.subsection !== lastSub) {
          body += `<div class="cq-subsection-label">${q.subsection}</div>`;
          lastSub = q.subsection;
        } else if (!q.subsection) {
          lastSub = null;
        }
        body += buildCQQuestion(q);
      }
    }
  }

  modal.innerHTML = `
    <div class="cq-modal-header">
      <div>
        <div class="cq-modal-title">Consolidated Questionnaire</div>
        <div class="cq-modal-subtitle">${platNames || 'No platforms selected'}</div>
      </div>
      <button class="task-modal-close" onclick="closeCQModal()">×</button>
    </div>
    <div class="cq-modal-progress-bar">
      <div class="cq-modal-progress-fill" style="width:${pct}%"></div>
    </div>
    <div class="cq-modal-body" id="cq-modal-body">${body}</div>
    <div class="cq-modal-footer">
      <span class="cq-footer-count">${answered} of ${total} answered</span>
      <button class="btn btn-primary" onclick="closeCQModal()">Save &amp; Close</button>
    </div>`;
}

function trailerFileRowHTML(name, mb, prefix = '') {
  return `
    <div class="trailer-file-row">
      <span class="trailer-file-name">🎬 ${name}</span>
      <span class="trailer-file-size">${mb} MB</span>
      <button class="btn btn-ghost btn-sm" onclick="removeTrailer('${prefix}')">Remove</button>
    </div>`;
}

/* ═══════════════════════════════════════════════════
   ANDROID STEP SECTIONS
   ═══════════════════════════════════════════════════ */

/**
 * swSelect — reusable styled dropdown (matches Primary Language picker aesthetic).
 * @param {string}   id          Unique DOM id suffix — element gets id="swsel-{id}"
 * @param {string}   currentValue  Currently selected value, or null
 * @param {Array}    options      [{value, label, warning}, ...] — warning (optional)
 *                                shows a small red warning icon next to that
 *                                option's name (used by the App Store Product
 *                                Page Preview's language dropdown to flag a
 *                                language with an over-character-limit field).
 *                                The same icon also appears on the closed pill
 *                                itself when the CURRENTLY SELECTED option is
 *                                the one flagged, so the warning is visible
 *                                without opening the dropdown.
 * @param {string}   onChangeFn  Name of a global function called with the chosen value
 * @param {string}   align       'left' (default) anchors the dropdown's left edge to
 *                                the pill's left edge, growing rightward — fine for a
 *                                pill with room to its right. 'right' anchors the
 *                                dropdown's right edge to the pill's right edge instead,
 *                                growing leftward — use this for a pill that sits at the
 *                                right edge of a scrolling container with overflow-x
 *                                hidden (e.g. the App Store Product Page Preview's
 *                                language dropdown, right-aligned via .ias-label-right),
 *                                where a wide dropdown (long label + warning icon) would
 *                                otherwise grow past that container's right edge and get
 *                                silently clipped instead of just wrapping to a new line.
 */
function swSelect(id, currentValue, options, onChangeFn, width = '100%', align = 'left') {
  const chevSvg = `<svg class="loc-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  const warnSvg = `<svg class="loc-dd-warn" width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="var(--magenta)" stroke-width="1.5"/><rect x="7.25" y="4" width="1.5" height="5" rx="0.75" fill="var(--magenta)"/><rect x="7.25" y="10.5" width="1.5" height="1.5" rx="0.75" fill="var(--magenta)"/></svg>`;
  const warnIcon = `<span class="tooltip-anchor" data-tip="One or more fields are over the character limit for this language">${warnSvg}</span>`;
  const isNull  = currentValue === null || currentValue === undefined || currentValue === '';
  const currentOption = options.find(o => o.value === currentValue);
  const currentLabel = isNull ? 'Select…' : (currentOption?.label || 'Select…');

  const ddItems = options.map(o => `
    <button class="loc-dd-item${o.value === currentValue ? ' is-current' : ''}"
            onclick="swSelectChoose('${id}','${o.value}','${onChangeFn}')">
      <span class="loc-dd-name">${escHtml(o.label)}</span>
      ${o.warning ? warnIcon : ''}
    </button>`).join('');

  return `
    <div class="loc-primary-wrap sw-select-wrap${align === 'right' ? ' align-right' : ''}" id="swsel-${id}" style="min-width:0;max-width:100%;width:${width};">
      <button class="loc-primary-pill" onclick="toggleSwSelect(event,'${id}')">
        <span class="loc-primary-name${isNull ? ' is-placeholder' : ''}">${currentLabel}</span>
        ${chevSvg}
        ${!isNull && currentOption?.warning ? warnIcon : ''}
      </button>
      <div class="loc-dropdown">${ddItems}</div>
    </div>`;
}

/* Android YES/NO row — thin wrapper over shared ynRow primitive */
function androidYNRow(label, fieldId, desc) {
  const val = state.androidSubmitAnswers[fieldId];
  return ynRow(label, val,
    `answerAndroidField('${fieldId}','yes')`,
    `answerAndroidField('${fieldId}','no')`,
    desc);
}

/* Android Content Rating — Google Play Content Questions (IARC tree)
   Renders the full 95-question IARC tree (GOOGLE_IARC_QUESTIONS, defined in
   state.js) recursively. A radio question and all of its follow-ups
   collapse into a compact summary row once the whole branch is answered
   (see giarcIsSubtreeComplete); clicking a collapsed row re-expands it.
   picklist_multi ("select all that apply") questions are the exception —
   they never auto-collapse just because one option was checked, since the
   user may still be selecting more; they only collapse via an explicit
   collapse button, and clicking their collapsed row re-expands them the
   same way. */
function buildAndroidContentRatingSection() {

  function giarcTooltip(text) {
    return `<span class="tooltip-anchor" data-tip="${escHtml(text)}"><span class="tooltip-icon">?</span></span>`;
  }

  const CHECK_SVG = `<svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function buildGIARCOption(q, opt, key) {
    const isMulti = q.data_type === 'picklist_multi';
    const current = state.cqAnswers[key];
    const checked = isMulti
      ? Array.isArray(current) && current.includes(opt.index)
      : current === opt.index;
    const onclick = isMulti
      ? `answerGIARCMultiOpt('${key}',${opt.index})`
      : `answerGIARCSingle('${key}',${opt.index})`;
    return `
      <div class="giarc-option${checked ? ' is-checked' : ''}" onclick="${onclick}">
        <span class="giarc-${isMulti ? 'checkbox' : 'radio'}"></span>
        <span class="giarc-option-text">${escHtml(opt.text)}</span>
      </div>`;
  }

  /* Compact single-row view of a fully-answered question (and, implicitly,
     all of its follow-ups). Clicking it re-expands the full question. */
  function buildGIARCCollapsedRow(key, depth, index) {
    const q = GOOGLE_IARC_BY_KEY[key];
    const indexBadge = depth === 1 ? `<span class="giarc-index">${index}</span>` : '';
    const summary = escHtml(giarcAnswerSummaryText(key));
    return `
      <div class="giarc-card giarc-depth-${depth} is-collapsed is-answered" data-key="${key}"
           onclick="toggleGIARCExpand('${key}',true)" tabindex="0" role="button" aria-label="Expand to review this answer">
        <div class="giarc-header giarc-header-collapsed">
          ${indexBadge}
          <span class="giarc-title giarc-title-collapsed">${escHtml(q.title)}</span>
          <span class="giarc-collapsed-summary">${summary}</span>
          <span class="giarc-check is-visible">${CHECK_SVG}</span>
          <span class="giarc-collapse-chevron">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </div>
      </div>`;
  }

  function renderGIARCQuestion(key, depth, index) {
    const q = GOOGLE_IARC_BY_KEY[key];
    if (!q) return '';
    const isMulti  = q.data_type === 'picklist_multi';
    const complete = giarcIsSubtreeComplete(key);

    // radio questions auto-collapse as soon as they're complete, unless the
    // user manually reopened them. picklist_multi ("select all that apply")
    // questions must NOT auto-collapse the moment one option is checked —
    // the user may still be picking more — so they only collapse once the
    // user explicitly collapses them.
    const showCollapsedRow = isMulti
      ? (complete && state.giarcManuallyCollapsed.has(key))
      : (complete && !state.giarcManuallyExpanded.has(key));

    if (showCollapsedRow) {
      return buildGIARCCollapsedRow(key, depth, index);
    }

    const answered    = giarcIsAnswered(key);
    const indexBadge  = depth === 1 ? `<span class="giarc-index">${index}</span>` : '';
    const tooltipHTML = q.tooltip ? giarcTooltip(q.tooltip) : '';
    const checkHTML   = `<span class="giarc-check${answered ? ' is-visible' : ''}">${CHECK_SVG}</span>`;

    // Offer a manual "collapse" affordance once the branch is complete: for
    // radio questions only after the user reopened an auto-collapsed row
    // (so it doesn't instantly collapse again); for picklist_multi
    // questions as soon as it's complete, since it never auto-collapses.
    const showCollapseBtn = isMulti ? complete : (complete && state.giarcManuallyExpanded.has(key));
    const collapseBtnHTML = showCollapseBtn
      ? `<button type="button" class="giarc-collapse-btn" aria-label="Collapse this question"
                 onclick="event.stopPropagation(); toggleGIARCExpand('${key}',false)">
           <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
         </button>`
      : '';

    const noteHTML = q.data_type === 'picklist_multi'
      ? `<div class="giarc-data-type-note">Select all that apply</div>` : '';

    const optsHTML = giarcOptionEntries(q).map(opt => buildGIARCOption(q, opt, key)).join('');

    const kids = giarcActiveChildKeys(key);
    const childrenHTML = kids.length
      ? `<div class="giarc-children is-visible">${kids.map(ck => renderGIARCQuestion(ck, depth + 1)).join('')}</div>`
      : '';

    return `
      <div class="giarc-card giarc-depth-${depth}${answered ? ' is-answered' : ''}" data-key="${key}">
        <div class="giarc-header">
          ${indexBadge}
          <span class="giarc-title">${escHtml(q.title)}</span>
          ${tooltipHTML}
          ${checkHTML}
          ${collapseBtnHTML}
        </div>
        ${noteHTML}
        <div class="giarc-options">${optsHTML}</div>
      </div>
      ${childrenHTML}`;
  }

  return `<div class="giarc-root">${GOOGLE_IARC_TOP_LEVEL_KEYS.map((key, i) => renderGIARCQuestion(key, 1, i + 1)).join('')}</div>`;
}

/* Stub section for steps not yet implemented */
function buildAndroidStubSection(title, note) {
  return `
    <div class="ios-section-head">${title}</div>
    <div class="sw-tip-box" style="margin-bottom:16px;">
      <div class="sw-tip-box-row">
        <img src="Assets/SubwooferIcon_Orange.png" class="sw-tip-logo" alt="">
        <span class="sw-tip-text">${note}</span>
      </div>
    </div>`;
}

/* Android Store Listing — review metadata */
function buildAndroidBusinessSection() {
  const fd      = state.formData;
  const a       = state.androidSubmitAnswers;
  const titleOk = !!(fd.title?.trim());
  const descOk  = !!(fd.description?.trim());
  return `
    <div class="ios-section-head">Business</div>
    <p class="ios-section-desc">Review the metadata that will appear on your Google Play store listing. Additional business details (pricing, in-app purchases) are configured directly in the Google Play Console. Edit via <strong>Game Details</strong> if anything needs to change.</p>
    <div class="form-group" style="margin-bottom:14px;">
      <label class="form-label">Title</label>
      <div class="form-input is-complete" style="background:var(--bg-2);cursor:default;color:var(--text);">${escHtml(fd.title || '')}</div>
      ${(!titleOk && _stepAttempted('questionnaire')) ? '<div class="ios-risk-note risk-HIGH">Title is required — add it in Game Details.</div>' : ''}
    </div>
    <div class="form-group" style="margin-bottom:14px;">
      <label class="form-label">Short description <span style="color:var(--text-faint);font-weight:400;">(first 80 chars of description)</span></label>
      <div class="form-input is-complete" style="background:var(--bg-2);cursor:default;color:var(--text);min-height:36px;">${escHtml((fd.description || '').slice(0, 80))}</div>
    </div>
    <div class="form-group" style="margin-bottom:14px;">
      <label class="form-label">Full description</label>
      <div class="form-input is-complete" style="background:var(--bg-2);cursor:default;color:var(--text);min-height:72px;white-space:pre-wrap;">${escHtml(fd.description || '')}</div>
      ${(!descOk && _stepAttempted('questionnaire')) ? '<div class="ios-risk-note risk-HIGH">Description is required — add it in Game Details.</div>' : ''}
    </div>`;
}

/* Android Store Preview — simple placeholder */
function buildAndroidStorePreviewSection() {
  const pid  = 'android';
  const fd   = state.formData;
  const ups  = state.uploads;
  const icon = ups.appIcon;
  const shots = ups.screenshots || [];
  const title = escHtml(fd.title || 'Your Game Title');
  const descRaw = fd.description || '';
  const descShort = escHtml(descRaw.slice(0, 120) + (descRaw.length > 120 ? '…' : ''));

  const iconHtml = icon
    ? `<img src="${icon.dataUrl}" style="width:60px;height:60px;border-radius:14px;object-fit:cover;">`
    : `<div style="width:60px;height:60px;border-radius:14px;background:var(--bg-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:10px;">Icon</div>`;

  // Mark as seen
  state.androidSubmitAnswers.storePreviewSeen = true;

  // Section completion
  const contentDone     = isAndroidSectionComplete('contentRating');
  const businessDone    = isAndroidSectionComplete('business');
  const dataDone        = isAndroidSectionComplete('dataSafety');
  const screenshotsDone = isAndroidSectionComplete('screenshots');

  function _sppBtn(target, label, sub, isDone) {
    if (isDone) {
      return `<button class="spp-section-btn spp-section-btn--done" onclick="openStorePreviewSection('${pid}','${target}')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0"><circle cx="7" cy="7" r="6.5" fill="#34c759"/><path d="M4 7l2 2 4-4" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div>
          <div class="spp-section-btn-title">${label}</div>
          <div class="spp-section-btn-sub">Tap to edit</div>
        </div>
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style="flex-shrink:0;margin-left:auto;opacity:0.4"><path d="M1 1l6 5-6 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`;
    }
    return `<button class="spp-section-btn" onclick="openStorePreviewSection('${pid}','${target}')">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0"><path d="M9.5 2a1 1 0 011.4 1.4L4.5 9.9 2.5 10.5l.6-2 6.4-6.5z" stroke="white" stroke-width="1.2"/></svg>
      <div>
        <div class="spp-section-btn-title">${label}</div>
        <div class="spp-section-btn-sub">${sub}</div>
      </div>
      <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style="flex-shrink:0;margin-left:auto"><path d="M1 1l6 5-6 5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>`;
  }

  const SPP_SECTIONS = [
    { target: 'content',     done: contentDone,     label: 'Answer Content Questions'        },
    { target: 'screenshots', done: screenshotsDone, label: 'Select Screenshots'              },
    { target: 'business',    done: businessDone,    label: 'Answer Business Questions'       },
    { target: 'data',        done: dataDone,        label: 'Answer Data Collection Questions'},
  ];
  const nextSection = SPP_SECTIONS.find(s => !s.done);
  const navBar = nextSection ? `
    <div class="spp-nav-bar">
      <span class="spp-nav-label">Next required</span>
      <button class="spp-nav-btn" onclick="openStorePreviewSection('${pid}','${nextSection.target}')">
        ${nextSection.label} →
      </button>
    </div>` : `
    <div class="spp-nav-bar spp-nav-bar--done">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" fill="#34c759"/><path d="M4 7l2 2 4-4" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      All sections complete — ready to save
    </div>`;

  const screenshotsArea = screenshotsDone
    ? `<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-top:10px;">${shots.slice(0,5).map(s => `<img src="${_screenshotSrc(s)}" style="height:120px;border-radius:8px;flex-shrink:0;">`).join('')}</div>
       <button class="spp-edit-link" style="margin-top:6px;" onclick="openStorePreviewSection('${pid}','screenshots')">Edit Screenshots</button>`
    : `<div style="margin-top:10px;">${_sppBtn('screenshots','Select Screenshots','Add screenshots for your Google Play listing', false)}</div>`;

  return `
    <div class="ios-section-head">Store Listing Preview</div>
    <p class="ios-section-desc" style="margin-bottom:14px;">This is an approximation of how your game will appear on Google Play.</p>
    <div style="background:var(--bg-2);border:1px solid var(--border);border-radius:10px;padding:14px;">
      <div style="display:flex;gap:12px;align-items:flex-start;">
        ${iconHtml}
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:600;color:var(--text);">${title}</div>
          <div style="font-size:12px;color:var(--text-faint);margin-top:2px;">Games</div>
          <div style="display:flex;gap:6px;margin-top:8px;align-items:center;">
            <button style="background:#01875f;color:#fff;border:none;border-radius:20px;padding:6px 20px;font-size:13px;font-weight:500;cursor:pointer;">Install</button>
            ${contentDone
              ? `<span style="font-size:11px;color:var(--text-faint);margin-left:4px;">Rated ${_androidRatingLabel()}</span>`
              : `<button class="ias-meta-cell--action" style="margin-left:4px;padding:4px 8px;border-radius:6px;border:1px dashed var(--accent);background:transparent;cursor:pointer;font-size:11px;color:var(--accent);" onclick="openStorePreviewSection('${pid}','content')">+ Content Rating</button>`}
          </div>
        </div>
      </div>
      ${screenshotsArea}
      <div style="font-size:12px;color:var(--text-faint);margin-top:12px;line-height:1.5;">${descShort}</div>
    </div>

    <div class="spp-sections-list" style="margin-top:14px;">
      ${_sppBtn('content',     'Answer Content Questions',        'Set your Google Play content rating',          contentDone)}
      ${_sppBtn('business',    'Answer Business Questions',       'Title, description and store listing details', businessDone)}
      ${_sppBtn('data',        'Answer Data Collection Questions','Complete your Data Safety disclosure',         dataDone)}
    </div>

    ${navBar}
  `;
}

function _androidRatingLabel() {
  // Simple helper — returns rating label based on content rating answers
  const a = state.androidSubmitAnswers;
  return a.contentRatingResult || 'Everyone';
}

/* ── Android Data Safety ─────────────────────────────── */
function buildAndroidDataSafetySection() {
  const a = state.androidSubmitAnswers;
  const collectsYes = a.collectsOrSharesData === 'yes';

  const hasAccountCreation = a.accountMethod && a.accountMethod !== 'none';

  const deleteAccountField = hasAccountCreation ? `
    <div class="form-group" style="margin-top:10px;">
      <label class="form-label">Account deletion URL</label>
      <input class="form-input" type="url" id="android-delete-acct-url"
             value="${escHtml(a.deleteAccountUrl)}"
             placeholder="https://yourgame.com/delete-account"
             oninput="answerAndroidTextField('deleteAccountUrl', this.value)">
      ${(!a.deleteAccountUrl.trim() && _stepAttempted('questionnaire')) ? '<div class="ios-risk-note risk-HIGH">Required. Provide a URL where users can request account deletion.</div>' : ''}
    </div>` : '';

  const otherField = a.accountMethod === 'other' ? `
    <div class="form-group" style="margin-top:8px;">
      <label class="form-label">Describe your authentication method</label>
      <input class="form-input" type="text" value="${escHtml(a.accountMethodOther)}"
             placeholder="e.g., Biometric login, SSO"
             oninput="answerAndroidTextField('accountMethodOther', this.value)">
    </div>` : '';

  const delDataField = a.providesDataDeletion === 'yes' ? `
    <div class="form-group" style="margin-top:8px;">
      <label class="form-label">Data deletion URL</label>
      <input class="form-input" type="url" value="${escHtml(a.deleteDataUrl)}"
             placeholder="https://yourgame.com/delete-data"
             oninput="answerAndroidTextField('deleteDataUrl', this.value)">
    </div>` : '';

  const familiesWarning = a.targetsFamilies === 'yes' ? `
    <div class="ios-risk-note risk-HIGH" style="margin-top:8px;">
      <strong>Families Policy applies.</strong> Your app will be subject to strict Google Play Families Policy requirements: no behavioural advertising, no data collection beyond core functionality, content must meet ESRB Everyone or equivalent, and you may need to participate in the Teacher Approved program.
    </div>` : '';

  const aiStatus = state.androidDataAIStatus;
  const descVal  = (a.androidDataDescription || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const statusHtml = aiStatus === 'loading'
    ? `<div class="prv-nlp-status loading"><span class="ai-spinner"></span> Translating to data safety labels…</div>`
    : aiStatus === 'complete'
    ? `<div class="prv-nlp-status done">✓ Data types updated — expand below to review or adjust</div>`
    : aiStatus === 'error'
    ? `<div class="prv-nlp-status error">Translation failed. <button class="btn-inline" onclick="_triggerAndroidDataAI()">Try again</button></div>`
    : '';

  const detailsBlock = collectsYes ? `
    ${androidYNRow('Encrypted in transit', 'encryptedInTransit',
      'All user data transmitted between the app and your servers is encrypted (e.g., HTTPS/TLS).')}
    <div class="form-group" style="margin-top:2px;">
      <label class="form-label">Sign-in method
        <span class="tooltip-anchor"><span class="tooltip-icon">?</span><span class="tooltip-body">The authentication method your app uses when users create an account.</span></span>
      </label>
      <div class="${!a.accountMethod ? 'sw-select-incomplete' : ''}">
        ${swSelect('android-account-method', a.accountMethod,
          ANDROID_ACCOUNT_METHODS.map(m => ({value: m.id, label: m.label})),
          'setAndroidAccountMethod', '280px')}
      </div>
    </div>
    ${otherField}
    ${deleteAccountField}
    ${singleSelectRow(
      'Data deletion without account deletion',
      a.providesDataDeletion,
      [
        { value: 'yes',    label: 'Yes',           selectedClass: 'is-sel-none',
          onSelect: "answerAndroidField('providesDataDeletion','yes')" },
        { value: 'auto90', label: 'Auto (90 days)', selectedClass: 'is-sel-infrequent',
          onSelect: "answerAndroidField('providesDataDeletion','auto90')" },
        { value: 'no',     label: 'No',             selectedClass: 'is-sel-frequent',
          onSelect: "answerAndroidField('providesDataDeletion','no')" },
      ],
      'Do you provide a way for users to request deletion of their data without deleting their account? "Auto" means all data is automatically deleted within 90 days.'
    )}
    ${delDataField}
    ${androidYNRow('Primarily targets children under 13', 'targetsFamilies',
      'Select Yes ONLY if children under 13 are the primary intended audience of your app — not merely because children might also play it. This is a meaningful legal and policy distinction.')}
    <div class="sw-tip-box" style="margin-top:6px;margin-bottom:4px;">
      <div class="sw-tip-box-row">
        <img src="Assets/SubwooferIcon_Orange.png" class="sw-tip-logo" alt="">
        <span class="sw-tip-text"><strong class="sw-tip-bold">Shipmate Tip:</strong> ${t('tip.ios.kids_audience') || 'Many developers select this by mistake — choose Yes only if children under 13 are your primary intended audience.'}</span>
      </div>
    </div>
    ${familiesWarning}
    <div class="prv-nlp-wrap" style="margin-top:2px;">
      <label class="form-label">Describe your data collection and sharing
        <span class="tooltip-anchor"><span class="tooltip-icon">?</span><span class="tooltip-body">Describe every data type your app collects or shares and why. Shipmate will translate this into the required Google Play Data Safety selections.</span></span>
      </label>
      <textarea class="form-input prv-nlp-textarea"
                placeholder="e.g., We collect email addresses for account creation, device crash reports to fix bugs, and advertising IDs to serve relevant ads through our ad network."
                onblur="updateAndroidDataDescription(this.value)">${descVal}</textarea>
      ${statusHtml}
      ${buildAndroidDataMatrix(a)}
    </div>` : '';

  const privUrl = (a.privacyPolicyUrl || state.formData.privacyUrl || '').trim();

  return `
    <div class="form-group" style="margin-bottom:18px;">
      <label class="form-label">Privacy Policy URL
        <span class="tooltip-anchor">
          <span class="tooltip-icon">?</span>
          <span class="tooltip-body">Google Play requires a valid, publicly accessible privacy policy URL. Setting it here syncs across all platforms.</span>
        </span>
      </label>
      <input class="form-input" type="url" id="android-privacy-url"
             value="${escHtml(privUrl)}"
             placeholder="https://yourgame.com/privacy"
             oninput="setPrivacyUrl(this.value)"
             onblur="reRenderStepModal()">
      ${(!privUrl && _stepAttempted('questionnaire')) ? '<div class="ios-risk-note risk-HIGH">Required. A missing privacy policy URL will block your submission.</div>' : ''}
    </div>
    ${_buildPrivacyPresetChips()}
    ${a.collectsOrSharesData === null ? androidYNRow('Collects or shares user data', 'collectsOrSharesData',
      'Includes location, personal info, financial info, health data, messages, files, contacts, app activity, identifiers, and similar required disclosures.') : ''}
    ${detailsBlock}`;
}

function buildAndroidDataMatrix(a) {
  const USAGE_COLS = [
    { id: 'collected', label: 'Collected',  tip: 'Data is collected by your app from the user' },
    { id: 'shared',    label: 'Shared',     tip: 'Data is shared with third parties' },
    { id: 'ephemeral', label: 'Ephemeral',  tip: 'Data is only processed temporarily — never stored' },
    { id: 'required',  label: 'Required',   tip: 'Collection is required; users cannot opt out' },
  ];

  const expanded        = state.androidMatrixExpanded;
  const selectedTypeIds = new Set(Object.keys(a.dataPerType));
  const selectedCount   = selectedTypeIds.size;

  const usageHeaders   = USAGE_COLS.map(c =>
    `<th class="prv-col-hd"><span class="tooltip-anchor" data-tip="${c.tip}">${c.label} <span class="tooltip-icon">?</span><span class="tooltip-body">${c.tip}</span></span></th>`
  ).join('');
  const purposeHeaders = ANDROID_PURPOSES.map(c =>
    `<th class="prv-col-hd"><span class="tooltip-anchor" data-tip="${c.desc}">${c.label} <span class="tooltip-icon">?</span><span class="tooltip-body">${c.desc}</span></span></th>`
  ).join('');

  let bodyHtml = '';
  if (expanded) {
    ANDROID_DATA_TYPES.forEach(group => {
      bodyHtml += `<tr class="prv-group-row"><td colspan="${1 + USAGE_COLS.length + ANDROID_PURPOSES.length}">${group.group}</td></tr>`;
      group.types.forEach(t => {
        const isOn = selectedTypeIds.has(t.id);
        const td   = a.dataPerType[t.id] || {};

        const usageCells = USAGE_COLS.map(col => {
          const epOrReq   = col.id === 'ephemeral' || col.id === 'required';
          const isDisabled = !isOn || (epOrReq && !td.collected);
          const checked = isOn && (
            col.id === 'collected' ? !!td.collected :
            col.id === 'shared'    ? !!td.shared    :
            col.id === 'ephemeral' ? !!td.ephemeral :
            !!td.required
          );
          return `<td class="prv-check-cell${isDisabled ? ' prv-disabled' : ''}">
            <input type="checkbox" class="prv-cb" ${isDisabled ? 'disabled' : ''}
                   ${checked ? 'checked' : ''}
                   onclick="event.stopPropagation()"
                   onchange="setAndroidTypeFlag('${t.id}','${col.id}',this.checked)">
          </td>`;
        }).join('');

        const purposeCells = ANDROID_PURPOSES.map(p => {
          const checked = isOn && (td.purposes || []).includes(p.id);
          return `<td class="prv-check-cell">
            <input type="checkbox" class="prv-cb" ${isOn ? '' : 'disabled'}
                   ${checked ? 'checked' : ''}
                   onclick="event.stopPropagation()"
                   onchange="toggleAndroidPurpose('${t.id}','${p.id}',this.checked)">
          </td>`;
        }).join('');

        bodyHtml += `
          <tr class="prv-data-row ${isOn ? 'is-on' : ''}" onclick="toggleAndroidDataType('${t.id}')">
            <td class="prv-type-cell">
              <span class="prv-type-name tooltip-anchor" data-tip="${t.desc}">${t.label}</span>
            </td>
            ${usageCells}
            ${purposeCells}
          </tr>`;
      });
    });
  }

  const tableHtml = expanded ? `
    <div class="prv-matrix-wrap">
      <table class="prv-matrix">
        <thead>
          <tr>
            <th class="prv-type-hd">Data Type</th>
            ${usageHeaders}
            ${purposeHeaders}
          </tr>
        </thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>` : '';

  return `
    <div class="ios-subsection" style="margin-top:10px;">
      <div class="prv-matrix-header">
        ${selectedCount > 0 ? `<span class="prv-count-badge">${selectedCount} type${selectedCount !== 1 ? 's' : ''} selected</span>` : ''}
        <button class="prv-expand-btn" onclick="toggleAndroidMatrix()">
          ${expanded ? `${_chevUp} Hide data types` : `${_chevDown} Show all data types`}
        </button>
      </div>
      ${tableHtml}
    </div>`;
}

/* ═══════════════════════════════════════════════════
   STEAM STEP SECTIONS
   ═══════════════════════════════════════════════════ */

function buildSteamActiveCard(pid, force) {
  if (!force && showAccountFace(pid)) return buildAccountCard(pid);
  if (state.platformFlipped?.[pid]) return buildSubmittedCard(pid, state.platformFlipped[pid]);
  const p      = PLATFORMS[pid];
  const counts = platformStepCount(pid);
  const locked = !counts.allRequired;
  const submitDone = state.platformStepStatus?.[pid]?.['submit'] === 'complete';
  const checkSVG = `<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const binProcSteam = !!(state.platformBuildProcessing?.[pid]);
  const stepCards = p.steps.map((step, i) => {
    const done      = isSteamSectionComplete(step.id);
    const numClass  = 'ios-step-num' + (done ? ' is-done' : '');

    if (step.id === 'uploadBuild') {
      return `
        <div class="ios-step-card ${done ? 'is-complete' : ''} ios-step-card--inline" id="steam-step-card-${step.id}">
          <div class="${numClass}">${done ? checkSVG : i + 1}</div>
          <div class="ios-step-info">
            <div class="ios-step-name">${stepLabel(pid, step)}</div>
          </div>
          ${buildBuildDropdown(pid)}
        </div>`;
    }

    const risk      = computeSteamSectionRisk(step.id);
    const attempted = state.stepSaveAttempted?.has(`${pid}-${step.id}`);
    const riskDot   = (done || !attempted || risk === 'LOW' || risk === 'NONE')
      ? '' : `<span class="ios-step-risk ios-step-risk-${risk.toLowerCase()}"></span>`;
    const trailingEl = (step.id === 'improveSubmission' && binProcSteam)
      ? `<span class="build-proc-spin" style="flex-shrink:0;margin-left:auto;"></span>`
      : `<span class="ios-step-arrow">›</span>`;
    return `
      <div class="ios-step-card ${done ? 'is-complete' : ''}" id="steam-step-card-${step.id}"
           onclick="openStepModal('${pid}','${step.id}')">
        <div class="${numClass}">${done ? checkSVG : i + 1}</div>
        <div class="ios-step-info">
          <div class="ios-step-name">${stepLabel(pid, step)}</div>
        </div>
        ${riskDot}
        ${trailingEl}
      </div>`;
  }).join('');

  const submitStepCard = buildSubmitStepCard(pid, p.steps.length, locked, submitDone);

  return `
    <div class="active-card ${!locked ? 'submit-ready' : ''}" id="active-card-${pid}">
      ${platformCardHead(pid, 'steps')}
      ${buildReleasePills(pid)}
      <div class="ios-step-cards">${stepCards}${submitStepCard}</div>
    </div>`;
}

/* ── (AI badge helpers moved to shared section above buildContentRatingSection) ── */

/* ── Steam: Content Rating (PDF 7) ──────────────────── */
function buildSteamContentRatingSection() {
  const a   = state.steamSubmitAnswers;
  const sca = a.steamContentAnswers || {};

  // Helper: ynRow for a Steam content item with AI badge support
  function steamItemRow(itemId, label, tooltip) {
    const val  = sca[itemId] || null;
    const yc   = _platformAIClass('steam', itemId, 'yes').trim();
    const nc   = _platformAIClass('steam', itemId, 'no').trim();
    const yb   = 'YES' + _platformAIBadge('steam', itemId, 'yes');
    const nb   = 'NO'  + _platformAIBadge('steam', itemId, 'no');
    // Ensure label fits one line (truncate at 50 chars, rest goes to tooltip)
    const shortLabel = label.length > 50 ? label.slice(0, 50).replace(/[;,]?\s*$/, '') + '…' : label;
    const fullTip    = tooltip && tooltip !== label ? tooltip : (label.length > 50 ? label : '');
    return ynRow(shortLabel, val,
      `answerSteamContentItem('${itemId}','yes')`,
      `answerSteamContentItem('${itemId}','no')`,
      fullTip, false, yc.trim(), nc.trim(), yb, nb);
  }

  // Unanswered/All toggle (shown after AI inference has run)
  const steamShowAll     = state.steamContentRatingExpanded;
  const steamAnsweredSet = state.steamAnsweredAtInference; // snapshot — not updated live
  const steamCollapse    = steamAnsweredSet !== null;
  const steamTogglePill  = buildCRTogglePill(steamCollapse, steamShowAll,
    'toggleSteamContentRatingExpanded(false)', 'toggleSteamContentRatingExpanded(true)');

  // Content categories — each item is a ynRow
  // Filter uses snapshot so questions don't vanish while actively answering
  let catHtml = steamTogglePill;
  STEAM_CONTENT_CATEGORIES.forEach(grp => {
    const items = (steamCollapse && !steamShowAll)
      ? grp.items.filter(item => !steamAnsweredSet?.has(item.id))
      : grp.items;
    if (!items.length) return;
    catHtml += `<div class="ios-content-step-label">${escHtml(grp.group)}</div>`;
    items.forEach(item => {
      catHtml += steamItemRow(item.id, item.label, item.label);
    });
  });

  // Mature declarations — each option is a ynRow with cascade
  const MATURE_OPTS = [
    { id: 'gen_mature',    label: 'General mature content',               tip: 'Content that deals with mature topics and may not be appropriate for all audiences' },
    { id: 'freq_violence', label: 'Frequent violence or gore',            tip: 'Contains extremely violent or gory content that may not be appropriate for all audiences' },
    { id: 'some_nudity',   label: 'Some nudity or sexual content',        tip: 'Contains occasional nudity or sexual content — auto-selects General mature content' },
    { id: 'freq_nudity',   label: 'Frequent nudity or sexual content',    tip: 'Primarily about explicit or frequent nudity/sexual content — auto-selects preceding categories' },
    { id: 'adult_sexual',  label: 'Adult only sexual content',            tip: 'Explicit or graphic sexual content for adults only — auto-selects all preceding categories' },
  ];

  // Apply the same Unanswered/All filter to Mature Content rows
  const filteredMatureOpts = (steamCollapse && !steamShowAll)
    ? MATURE_OPTS.filter(opt => !steamAnsweredSet?.has(opt.id))
    : MATURE_OPTS;
  let matureHtml = filteredMatureOpts.map(opt => steamItemRow(opt.id, opt.label, opt.tip)).join('');

  // Track which mature parent rows are actually visible (not filtered out)
  const freqViolenceVisible = !steamCollapse || steamShowAll || !steamAnsweredSet?.has('freq_violence');
  const freqNudityVisible   = !steamCollapse || steamShowAll || !steamAnsweredSet?.has('freq_nudity');
  const genMatureVisible    = !steamCollapse || steamShowAll || !steamAnsweredSet?.has('gen_mature');

  // Violent tag sub-rows (if freq_violence = yes AND parent row is visible)
  const violentSub = (sca['freq_violence'] === 'yes' && freqViolenceVisible) ? `
    <div class="ios-followup">
      <div style="font-size:12px;color:var(--text-faint);margin-bottom:4px;">Specify for store tags:</div>
      ${steamItemRow('violent_tag', 'Violent', 'Adds the "Violent" store tag to your game')}
      ${steamItemRow('gore_tag',    'Gore',    'Adds the "Gore" store tag to your game')}
    </div>` : '';

  // Nudity tag sub-rows (if freq_nudity = yes AND parent row is visible)
  const nuditySub = (sca['freq_nudity'] === 'yes' && freqNudityVisible) ? `
    <div class="ios-followup">
      <div style="font-size:12px;color:var(--text-faint);margin-bottom:4px;">Specify for store tags:</div>
      ${steamItemRow('nudity_tag',         'Nudity',         'Adds the "Nudity" store tag to your game')}
      ${steamItemRow('sexual_content_tag', 'Sexual Content', 'Adds the "Sexual Content" store tag to your game')}
    </div>` : '';

  // Mature text fields (if gen_mature = yes AND parent row is visible)
  const matureFieldBlock = (sca['gen_mature'] === 'yes' && genMatureVisible) ? `
    <div class="ios-followup">
      <div class="form-group" style="margin-bottom:10px;">
        <label class="form-label">What should customers know about the mature content?
          <span class="tooltip-anchor"><span class="tooltip-icon">?</span><span class="tooltip-body">Visible on your store page. Describe depictions of violence, sexual acts, or other topics players should know about.</span></span>
        </label>
        <textarea class="form-input" rows="3"
                  placeholder="Describe the mature content players will encounter…"
                  oninput="answerSteamTextField('matureDescription', this.value)">${escHtml(a.matureDescription)}</textarea>
        ${!a.matureDescription.trim() ? '<div class="ios-risk-note risk-HIGH">Required when General mature content is selected.</div>' : ''}
      </div>
      <div class="form-group">
        <label class="form-label">How do we access the mature content? <span style="color:var(--text-faint);font-weight:400;">(Review team only)</span>
          <span class="tooltip-anchor"><span class="tooltip-icon">?</span><span class="tooltip-body">Not visible to customers. Is the content on a specific map? Does the player need to reach a certain level?</span></span>
        </label>
        <textarea class="form-input" rows="2"
                  placeholder="e.g., Content is accessible after reaching level 10…"
                  oninput="answerSteamTextField('matureAccess', this.value)">${escHtml(a.matureAccess)}</textarea>
        ${!a.matureAccess.trim() ? '<div class="ios-risk-note risk-HIGH">Required when General mature content is selected.</div>' : ''}
      </div>
    </div>` : '';

  // Generative AI
  const AI_LIVE_TYPES = STEAM_AI_LIVE_TYPES;
  const aiLiveBlock = a.usesAI === 'yes' ? `
    <div style="margin-top:10px;">
      <div class="form-group" style="margin-bottom:10px;">
        <label class="form-label">Describe to players how this game uses generative AI
          <span class="tooltip-anchor"><span class="tooltip-icon">?</span><span class="tooltip-body">Shown under "About This Game" on your store page.</span></span>
        </label>
        <textarea class="form-input" rows="2"
                  placeholder="Describe how AI is used in your game…"
                  oninput="answerSteamTextField('aiDescription', this.value)">${escHtml(a.aiDescription)}</textarea>
      </div>
      ${ynRow('Generates content or code during gameplay', a.aiLiveGenerated,
        "answerSteamField('aiLiveGenerated','yes')",
        "answerSteamField('aiLiveGenerated','no')",
        'Does this game use AI to generate content or code during active gameplay?')}
      ${a.aiLiveGenerated === 'yes' ? `
        <div class="ios-followup">
          <div class="ios-content-step-label" style="margin-top:6px;">Types of live-generated content</div>
          ${AI_LIVE_TYPES.map(t => {
            const id = t.toLowerCase().replace(/[^a-z0-9]/g,'_');
            const val = (a.aiLiveTypes || []).includes(id) ? 'yes' : null;
            return ynRow(t, val,
              `toggleSteamAIType('${id}', true)`,
              `toggleSteamAIType('${id}', false)`);
          }).join('')}
          ${(a.aiLiveTypes||[]).includes('code') ? `<div class="form-group" style="margin-top:8px;"><label class="form-label">Describe code generation and safeguards</label>
            <textarea class="form-input" rows="2" oninput="answerSteamTextField('aiCodeDesc', this.value)">${escHtml(a.aiCodeDesc)}</textarea></div>` : ''}
          <div class="form-group" style="margin-top:8px;"><label class="form-label">Copyright protection measures</label>
            <textarea class="form-input" rows="2"
                      placeholder="What steps ensure users can't generate copyrighted material?"
                      oninput="answerSteamTextField('aiCopyrightDesc', this.value)">${escHtml(a.aiCopyrightDesc)}</textarea></div>
          <div class="form-group" style="margin-top:8px;"><label class="form-label">Content moderation strategy</label>
            <textarea class="form-input" rows="2"
                      placeholder="How do you ensure generated content adheres to Steam's guidelines?"
                      oninput="answerSteamTextField('aiModerationDesc', this.value)">${escHtml(a.aiModerationDesc)}</textarea></div>
          ${sca['adult_sexual'] === 'yes' ? '<div class="ios-risk-note risk-HIGH" style="margin-top:8px;"><strong>Warning:</strong> Steam cannot support Adult Only Sexual Content created with live-generated AI.</div>' : ''}
        </div>` : ''}
      ${ynRow('Connects to external third-party AI service during gameplay', a.aiThirdParty,
        "answerSteamField('aiThirdParty','yes')",
        "answerSteamField('aiThirdParty','no')")}
      ${a.aiThirdParty === 'yes' ? `
        <div class="ios-followup">
          <div class="form-group" style="margin-bottom:8px;"><label class="form-label">Service name <span style="color:var(--text-faint);">(shown on store page)</span></label>
            <input class="form-input" type="text" value="${escHtml(a.aiThirdPartyName)}"
                   placeholder="e.g., OpenAI" oninput="answerSteamTextField('aiThirdPartyName', this.value)"></div>
          <div class="form-group" style="margin-bottom:8px;"><label class="form-label">Service URL <span style="color:var(--text-faint);">(shown on store page)</span></label>
            <input class="form-input" type="url" value="${escHtml(a.aiThirdPartyUrl)}"
                   placeholder="https://" oninput="answerSteamTextField('aiThirdPartyUrl', this.value)"></div>
          <div class="form-group" style="margin-bottom:8px;"><label class="form-label">How is generative content made available to players?</label>
            <textarea class="form-input" rows="2" oninput="answerSteamTextField('aiAvailabilityDesc', this.value)">${escHtml(a.aiAvailabilityDesc)}</textarea></div>
          <div class="form-group"><label class="form-label">Monetization strategy for live AI services</label>
            <textarea class="form-input" rows="2" oninput="answerSteamTextField('aiMonetizationDesc', this.value)">${escHtml(a.aiMonetizationDesc)}</textarea></div>
        </div>` : ''}
    </div>` : '';

  return `
    ${catHtml}
    <div class="ios-q-divider"></div>
    <div class="ios-content-step-label">Mature Content</div>
    ${matureHtml}
    ${violentSub}
    ${nuditySub}
    ${matureFieldBlock}
    <div class="ios-q-divider"></div>
    <div class="ios-content-step-label">Generative AI</div>
    ${ynRow('Uses generative AI', a.usesAI,
      "answerSteamField('usesAI','yes')",
      "answerSteamField('usesAI','no')",
      'Does this game use generative AI to create content — including the game, store page, or marketing materials?')}
    ${aiLiveBlock}`;
}

/* ── Steam: Store Tags (PDF 9) ──────────────────────── */
function buildSteamStoreTagsSection() {
  const a = state.steamSubmitAnswers;

  const topGenreChecks = STEAM_TOP_GENRES.map(g => {
    const checked = a.topGenres.includes(g);
    return `<label class="cq-check-row${checked ? ' is-checked' : ''}">
      <input type="checkbox" ${checked ? 'checked' : ''}
             onchange="toggleSteamTag('topGenres','${g}',this.checked,2)">
      <span>${escHtml(g)}</span></label>`;
  }).join('');

  const genreChecks = STEAM_GENRES.map(g => {
    const checked = a.genres.includes(g);
    return `<label class="cq-check-row${checked ? ' is-checked' : ''}">
      <input type="checkbox" ${checked ? 'checked' : ''}
             onchange="toggleSteamTag('genres','${g}',this.checked,2)">
      <span>${escHtml(g)}</span></label>`;
  }).join('');

  const subGenreChecks = STEAM_SUB_GENRES.map(g => {
    const checked = a.subGenres.includes(g);
    return `<label class="cq-check-row${checked ? ' is-checked' : ''}">
      <input type="checkbox" ${checked ? 'checked' : ''}
             onchange="toggleSteamTag('subGenres','${g}',this.checked,3)">
      <span>${escHtml(g)}</span></label>`;
  }).join('');

  const topCount   = a.topGenres.length;
  const genreCount = a.genres.length;
  const subCount   = a.subGenres.length;

  return `
    <div class="ios-content-step-label" style="margin-top:0;">Top-Level Genre
      <span class="tooltip-anchor"><span class="tooltip-icon">?</span><span class="tooltip-body">Required. Choose one or two top-level genres to categorize your title on Steam.</span></span>
    </div>
    ${(topCount === 0 && _stepAttempted('questionnaire')) ? '<div class="ios-risk-note risk-HIGH" style="margin-bottom:8px;">Required — select at least one.</div>' : ''}
    <div class="cq-check-list">${topGenreChecks}</div>

    <div class="ios-q-divider"></div>
    <div class="ios-content-step-label">Genre <span style="font-weight:400;text-transform:none;font-size:11px;letter-spacing:0;">(Optional — up to 2${genreCount > 0 ? ', ' + genreCount + ' selected' : ''})</span></div>
    <div class="cq-check-list" style="max-height:200px;overflow-y:auto;">${genreChecks}</div>

    <div class="ios-q-divider"></div>
    <div class="ios-content-step-label">Sub-genre <span style="font-weight:400;text-transform:none;font-size:11px;letter-spacing:0;">(Optional — up to 3${subCount > 0 ? ', ' + subCount + ' selected' : ''})</span></div>
    <div class="cq-check-list" style="max-height:200px;overflow-y:auto;">${subGenreChecks}</div>`;
}

/* ── Steam: Technical (PDFs 10 + 11) ───────────────── */
function buildSteamTechnicalSection() {
  const a = state.steamSubmitAnswers;

  const INPUT_OPTS = [
    { id: 'keyboard_only',     label: 'Mouse and keyboard only' },
    { id: 'keyboard_plus',     label: 'Mouse and keyboard, plus gamepads' },
    { id: 'gamepad_preferred', label: 'Mouse and keyboard, but gamepad is preferred' },
    { id: 'gamepad_required',  label: 'Gamepad required; no support for mouse and keyboard' },
  ];

  const inputHtml = singleSelectRow(
    'Input devices',
    a.inputSupport,
    INPUT_OPTS.map(o => ({
      value: o.id, label: o.label,
      selectedClass: 'is-sel-none',
      onSelect: `answerSteamField('inputSupport','${o.id}')`,
    })),
    'What kind of devices can be used to comfortably play your game?'
  );

  const gamepadBlock = a.inputSupport && a.inputSupport !== 'keyboard_only' ? `
    <div class="cond-block">
      <div class="ios-content-step-label" style="margin-top:0;">Controller Support</div>
      ${ynRow('Full Xbox Controller support', a.xboxFullSupport,
        "answerSteamField('xboxFullSupport','yes')",
        "answerSteamField('xboxFullSupport','no')",
        'Player can launch, configure, play, and exit using only an Xbox controller. Game displays correct glyphs and any text prompts open an on-screen keyboard.')}

      <div style="margin-top:12px;">
        <div class="form-label" style="margin-bottom:6px;">PlayStation Controller support <span style="color:var(--text-faint);font-weight:400;">(select all that apply)</span></div>
        <div class="ms-chip-group">${[
          {id:'ps_dualshock_usb',   label:'DualShock (USB)'},
          {id:'ps_dualshock_bt',    label:'DualShock (USB + BT)'},
          {id:'ps_dualsense_usb',   label:'DualSense (USB)'},
          {id:'ps_dualsense_bt',    label:'DualSense (USB + BT)'},
          {id:'ps_none',            label:'No PS support'},
        ].map(c => {
          const on = a.psControllers.includes(c.id);
          return `<button class="ms-chip${on ? ' is-on' : ''}"
                          onclick="toggleSteamPS('${c.id}', ${!on})">${escHtml(c.label)}</button>`;
        }).join('')}</div>
      </div>

      <div style="margin-top:12px;">
        ${ynRow('Full Steam Input API integration', a.steamInputAPI,
          "answerSteamField('steamInputAPI','yes')",
          "answerSteamField('steamInputAPI','no')",
          'Game fully integrates the Steam Input API, implements action bindings, queries action origins for correct glyph display, and allows button remapping through the Steam configurator.')}
      </div>
    </div>
  ` : '';

  const accessChecks = STEAM_ACCESSIBILITY_FEATURES.map(f => {
    const checked = a.accessibilityFeatures.includes(f.id);
    return `<label class="cq-check-row${checked ? ' is-checked' : ''}" title="${escHtml(f.desc)}">
      <input type="checkbox" ${checked ? 'checked' : ''}
             onchange="toggleSteamAccessibility('${f.id}', this.checked)">
      <span>${escHtml(f.label)}</span></label>`;
  }).join('');

  return `
    <div class="ios-content-step-label" style="margin-top:0;">Input Support</div>
    ${inputHtml}
    ${gamepadBlock}
    <div class="ios-q-divider"></div>
    <div class="ios-content-step-label">Accessibility Features <span style="font-weight:400;text-transform:none;font-size:11px;letter-spacing:0;">(Optional — select all that apply)</span></div>
    <div class="cq-check-list">${accessChecks}</div>`;
}

/* ── Steam: Store Page Preview ──────────────────────── */
function buildSteamStorePreviewSection() {
  const pid  = 'steam';
  const fd   = state.formData;
  const ups  = state.uploads;
  const icon = ups.appIcon;
  const shots = ups.screenshots || [];
  const title = escHtml(fd.title || 'Your Game Title');
  const descRaw = fd.description || '';
  const descShort = escHtml(descRaw.slice(0, 160) + (descRaw.length > 160 ? '…' : ''));
  const topGenres = state.steamSubmitAnswers.topGenres.slice(0, 2).join(', ') || 'Game';

  const iconHtml = icon
    ? `<img src="${icon.dataUrl}" style="width:108px;height:50px;border-radius:4px;object-fit:cover;">`
    : `<div style="width:108px;height:50px;border-radius:4px;background:var(--bg-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:9px;">Capsule</div>`;

  state.steamSubmitAnswers.storePreviewSeen = true;

  // Section completion
  const contentDone     = isSteamSectionComplete('contentRating');
  const businessDone    = isSteamSectionComplete('storeTags') && isSteamSectionComplete('technical');
  const privUrl         = (state.steamSubmitAnswers.privacyPolicyUrl || state.formData.privacyUrl || '').trim();
  const dataDone        = !!privUrl;
  const screenshotsDone = isSteamSectionComplete('screenshots');
  // Key Art isn't part of Steam's required-section completeness tracking
  // (isSteamSectionComplete) — it's optional here, same as the rest of this
  // preview's own "done" checkmarks are purely local UI state.
  const keyArtDone      = !!(ups.steamKeyArtCapsule && ups.steamKeyArtHero);

  function _sppBtn(target, label, sub, isDone) {
    if (isDone) {
      return `<button class="spp-section-btn spp-section-btn--done" onclick="openStorePreviewSection('${pid}','${target}')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0"><circle cx="7" cy="7" r="6.5" fill="#34c759"/><path d="M4 7l2 2 4-4" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div>
          <div class="spp-section-btn-title">${label}</div>
          <div class="spp-section-btn-sub">Tap to edit</div>
        </div>
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style="flex-shrink:0;margin-left:auto;opacity:0.4"><path d="M1 1l6 5-6 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>`;
    }
    return `<button class="spp-section-btn" onclick="openStorePreviewSection('${pid}','${target}')">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0"><path d="M9.5 2a1 1 0 011.4 1.4L4.5 9.9 2.5 10.5l.6-2 6.4-6.5z" stroke="white" stroke-width="1.2"/></svg>
      <div>
        <div class="spp-section-btn-title">${label}</div>
        <div class="spp-section-btn-sub">${sub}</div>
      </div>
      <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style="flex-shrink:0;margin-left:auto"><path d="M1 1l6 5-6 5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>`;
  }

  const SPP_SECTIONS = [
    { target: 'content',     done: contentDone,     label: 'Answer Content Questions'        },
    { target: 'screenshots', done: screenshotsDone, label: 'Select Screenshots'              },
    { target: 'keyArt',      done: keyArtDone,      label: 'Select Key Art'                  },
    { target: 'business',    done: businessDone,    label: 'Answer Business Questions'       },
    { target: 'data',        done: dataDone,        label: 'Answer Data Collection Questions'},
  ];
  const nextSection = SPP_SECTIONS.find(s => !s.done);
  const navBar = nextSection ? `
    <div class="spp-nav-bar">
      <span class="spp-nav-label">Next required</span>
      <button class="spp-nav-btn" onclick="openStorePreviewSection('${pid}','${nextSection.target}')">
        ${nextSection.label} →
      </button>
    </div>` : `
    <div class="spp-nav-bar spp-nav-bar--done">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" fill="#34c759"/><path d="M4 7l2 2 4-4" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      All sections complete — ready to save
    </div>`;

  const screenshotsArea = screenshotsDone
    ? `<div style="display:flex;gap:4px;overflow-x:auto;margin-top:10px;">${shots.slice(0,5).map(s => `<img src="${s.url || s.dataUrl}" style="height:90px;border-radius:4px;flex-shrink:0;">`).join('')}</div>
       <button class="spp-edit-link" style="margin-top:6px;color:#8f98a0;" onclick="openStorePreviewSection('${pid}','screenshots')">Edit Screenshots</button>`
    : `<div style="margin-top:10px;">${_sppBtn('screenshots','Select Screenshots','Add screenshots for your Steam store page', false)}</div>`;

  return `
    <p style="font-size:12px;color:var(--text-faint);margin:0 0 14px;">Approximate Steam store listing appearance.</p>
    <div style="background:#1b2838;border-radius:6px;padding:14px;font-family:inherit;">
      <div style="display:flex;gap:12px;align-items:flex-start;">
        ${iconHtml}
        <div>
          <div style="font-size:15px;font-weight:600;color:#c6d4df;">${title}</div>
          <div style="font-size:11px;color:#8f98a0;margin-top:3px;">${escHtml(topGenres)}</div>
          <div style="margin-top:8px;display:flex;gap:6px;">
            <button style="background:#4c7b8a;color:#c6d4df;border:none;border-radius:2px;padding:5px 16px;font-size:12px;cursor:pointer;">Add to Cart</button>
            <button style="background:#5c7e10;color:#fff;border:none;border-radius:2px;padding:5px 16px;font-size:12px;cursor:pointer;">Play Game</button>
          </div>
        </div>
      </div>
      ${screenshotsArea}
      <div style="font-size:12px;color:#8f98a0;margin-top:10px;line-height:1.5;">${descShort}</div>
    </div>

    <div class="spp-sections-list" style="margin-top:14px;">
      ${_sppBtn('keyArt',   'Select Key Art',                  'Upload your store and library key art', keyArtDone)}
      ${_sppBtn('content',  'Answer Content Questions',        'Mature content, AI usage, and IARC rating',    contentDone)}
      ${_sppBtn('business', 'Answer Business Questions',       'Store tags, genre, and technical details',     businessDone)}
      ${_sppBtn('data',     'Answer Data Collection Questions','Add your privacy policy URL',                  dataDone)}
    </div>

    ${navBar}
  `;
}

/* Steam: "Select Key Art" — collects four Key Art images, sorted
   alphabetically by section label:
     - Capsule Image (231×87)     — state.uploads.steamCapsuleImage
     - Header Image  (460×215)    — state.uploads.steamHeaderImage
     - IGDB Cover Art (264×374)   — state.uploads.steamKeyArtCapsule
     - Library Hero   (3840×1240) — state.uploads.steamKeyArtHero
   Capsule Image and Header Image are Steam's own appdetails-sourced
   capsule_image/header_image, fetched (alongside Description/Developer/
   About This Game/Screenshots/Genres) by _applySteamAboutData in app.js
   when the picked title has a linked Steam page. IGDB Cover Art and
   Library Hero are auto-filled from IGDB's cover art / Steam's
   library_hero.jpg respectively — see
   _applySteamCapsuleFromCover/_applySteamHeroBanner in app.js. All four
   are also what the Web platform's "Key Art" flip modal
   (buildWebKeyArtEditSection) reads read-only and links back here via
   "Manage". Uploading calls reRenderStepModal(), so this modal (and, for
   IGDB Cover Art/Library Hero, the Web preview behind it) always reflect
   the latest upload.
   (A "Library Capsule"/"Logo" pair, auto-filled from Steam's own
   library_600x900.jpg/logo.png, briefly lived here as well — removed by
   request; see git history around v3.02 if reviving that is ever needed.) */
function buildSteamKeyArtEditSection() {
  const ups = state.uploads || {};
  return `
    <div class="qs-section" style="padding:4px 2px;">
      <p style="margin:0 0 16px;color:var(--text-muted,#6b7280);font-size:13px;line-height:1.5;">
        Upload the key art for your Steam store page. IGDB Cover Art and Library Hero are also shown on your preview website.
      </p>

      <div class="pk-edit-group-label">Capsule Image</div>
      <div class="asset-guidance">Recommended 231 &times; 87 (landscape).</div>
      ${_steamKeyArtUploadHTML('CapsuleImage', 'PNG or JPG, up to ~5MB', ups.steamCapsuleImage)}

      <div class="pk-edit-group-label">Header Image</div>
      <div class="asset-guidance">Recommended 460 &times; 215 (landscape).</div>
      ${_steamKeyArtUploadHTML('HeaderImage', 'PNG or JPG, up to ~5MB', ups.steamHeaderImage)}

      <div class="pk-edit-group-label">IGDB Cover Art</div>
      <div class="asset-guidance">Recommended 264 &times; 374 (portrait).</div>
      ${_steamKeyArtUploadHTML('Capsule', 'PNG or JPG, up to ~5MB', ups.steamKeyArtCapsule)}

      <div class="pk-edit-group-label">Library Hero</div>
      <div class="asset-guidance">Recommended 3840 &times; 1240 (widescreen).</div>
      ${_steamKeyArtUploadHTML('Hero', 'PNG or JPG, up to ~5MB', ups.steamKeyArtHero)}
    </div>`;
}

/* Key Art upload row — shared by the Capsule Image / Header Image / IGDB
   Cover Art / Library Hero sub-sections above. Presentation mirrors the
   Screenshots/Trailer dropzones in the Assets tab (see buildAssetsTab's
   .asset-dropzone markup), but with a live dataURL preview once uploaded
   (like state.uploads.featureGraphic/appIcon), since this is always an
   image. `kind` is 'CapsuleImage', 'HeaderImage', 'Capsule', or 'Hero',
   matching the handleSteamKeyArt{kind}Drop/Files and removeSteamKeyArt{kind}
   functions in app.js. Each upload sits in a box sized to that asset's
   real aspect ratio (see .pk-keyart-box in
   style.css), so the box shows the actual shape/crop before and after
   uploading — same treatment used for Web's Key Art modal before it became
   a read-only "Manage" link to
   here. */
function _steamKeyArtUploadHTML(kind, hint, upload) {
  const dropId   = `steam-keyart-${kind.toLowerCase()}-dropzone`;
  const inputId  = `steam-keyart-${kind.toLowerCase()}-input`;
  const boxClass = `pk-keyart-box pk-keyart-box--${kind.toLowerCase()}`;
  if (upload) {
    return `
      <div style="margin-bottom:20px;">
        <div class="${boxClass}">
          <img src="${_screenshotSrc(upload)}" alt="${escHtml(upload.name)}" class="pk-keyart-img">
        </div>
        <div class="feature-preview-meta">
          <span class="feature-preview-name">${escHtml(upload.name)}</span>
          <button class="btn btn-ghost btn-sm" type="button" onclick="removeSteamKeyArt${kind}()">Remove</button>
        </div>
      </div>`;
  }
  return `
    <div class="asset-dropzone ${boxClass}" id="${dropId}" style="margin-bottom:20px;"
         onclick="document.getElementById('${inputId}').click()"
         ondragover="event.preventDefault(); this.classList.add('is-over')"
         ondragleave="this.classList.remove('is-over')"
         ondrop="handleSteamKeyArt${kind}Drop(event); this.classList.remove('is-over')">
      <div class="asset-dropzone-icon">↑</div>
      <div class="asset-dropzone-label">Drop an image here or click to upload</div>
      <div class="asset-dropzone-hint">${hint}</div>
      <input type="file" id="${inputId}" accept="image/*" style="display:none"
             onchange="handleSteamKeyArt${kind}Files(this.files); this.value=''">
    </div>`;
}


/* ══════════════════════════════════════════════════════
   BUILD DROPDOWN  (platform card header)
   ══════════════════════════════════════════════════════ */
function buildBuildDropdown(pid, inModal) {
  const build      = state.platformBuilds?.[pid] || null;
  const processing = !!(state.platformBuildProcessing?.[pid]);
  const accept     = pid === 'ios'     ? '.ipa'
                   : pid === 'android' ? '.apk,.aab'
                   :                     '.exe,.zip';
  // Unique file input id — avoid clash between card header and modal instances
  const inputId    = inModal ? `build-file-modal-${pid}` : `build-file-${pid}`;
  const uploadSVG  = `<svg width="11" height="11" viewBox="0 0 16 16" fill="none" style="flex-shrink:0;opacity:0.6"><path d="M8 11V2M4 5l4-4 4 4M2 13v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const checkSVG   = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none" style="flex-shrink:0;color:var(--accent-green,#2FDC80)"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const spinHTML   = `<span class="build-proc-spin" style="flex-shrink:0;"></span>`;

  if (processing) {
    return `
      <div class="build-pill is-processing" title="Analyzing binary…">
        ${spinHTML}
        <span class="build-pill-label">Analyzing…</span>
      </div>`;
  }
  const noBuild = !build;
  return `
    <div class="build-pill ${noBuild ? 'no-build' : 'has-build'}"
         onclick="event.stopPropagation();document.getElementById('${inputId}').click()" title="${noBuild ? 'Upload build' : 'Change build'}">
      <input type="file" id="${inputId}" accept="${accept}" hidden
             onchange="handleBuildUpload('${pid}', this.files)">
      ${noBuild ? uploadSVG : checkSVG}
      <span class="build-pill-label">${noBuild ? 'Upload Build' : escHtml(build.name)}</span>
    </div>`;
}

/* ══════════════════════════════════════════════════════
   SCREENSHOTS STEP  (per-platform, inside step modal)
   ══════════════════════════════════════════════════════ */
function buildScreenshotsSection(pid) {
  const onboardingShots = state.uploads?.screenshots || [];
  const ps = state.platformScreenshots?.[pid] || { selected: [], custom: [] };
  const selectedSet = new Set(ps.selected);

  const checkMark = `<div class="shot-check">✓</div>`;

  // Onboarding screenshots row — thumbnails are draggable into the crop zone
  let onboardingHtml;
  if (onboardingShots.length > 0) {
    onboardingHtml = onboardingShots.map(s => {
      const src = _screenshotSrc(s);
      const sel = selectedSet.has(s.id);
      return `
        <div class="shot-thumb${sel ? ' is-selected' : ''}"
             draggable="true"
             ondragstart="shotDragStart(event,'${pid}','${s.id}')"
             onclick="togglePlatformScreenshot('${pid}','${s.id}')"
             title="${escHtml(s.name)}">
          <img src="${src}" alt="${escHtml(s.name)}">
          ${sel ? checkMark : ''}
          <div class="shot-drag-hint">drag to preview</div>
        </div>`;
    }).join('');
  } else {
    onboardingHtml = `<p class="shot-empty-msg">No screenshots in your uploads yet — add them under Assets during onboarding.</p>`;
  }

  // Platform-specific custom uploads
  let customHtml = '';
  if (ps.custom && ps.custom.length > 0) {
    customHtml = `
      <div class="shot-group-label">Platform-specific uploads</div>
      <div class="shot-grid">
        ${ps.custom.map(s => `
          <div class="shot-thumb is-selected is-custom" title="${escHtml(s.name)}">
            <img src="${s.dataUrl}" alt="${escHtml(s.name)}">
            ${checkMark}
            <button class="shot-remove" onclick="removePlatformScreenshot('${pid}','${s.id}')" title="Remove">×</button>
          </div>`).join('')}
      </div>`;
  }

  const total = ps.selected.length + (ps.custom?.length || 0);

  // Inline crop edit zone (persists crop state across renders via _shotCropState)
  const editZoneHtml = _buildShotEditZoneHtml(pid);

  return `
    <div class="screenshots-step">
      <p class="shot-intro">
        Select screenshots to include with your ${platLabel(pid)} submission.
        ${total > 0 ? `<strong>${total} selected.</strong>` : ''}
        <span class="shot-intro-hint">Click a screenshot to select it, or drag it down to preview the crop.</span>
      </p>

      <div class="shot-group-label">From your uploads</div>
      <div class="shot-grid" id="shot-grid-${pid}">${onboardingHtml}</div>

      ${customHtml}

      <!-- Inline crop preview zone -->
      <div class="shot-edit-zone" id="shot-edit-zone-${pid}"
           ondragover="shotDragOver(event,'${pid}')"
           ondragleave="shotDragLeave(event,'${pid}')"
           ondrop="shotDrop(event,'${pid}')">
        ${editZoneHtml}
      </div>

      <div class="shot-actions">
        <label class="btn btn-ghost btn-sm shot-upload-btn" style="cursor:pointer;">
          <input type="file" accept="image/*" multiple hidden
                 onchange="handlePlatformScreenshotFiles('${pid}', this.files)">
          + Upload New
        </label>
      </div>
    </div>`;
}

/* Build the HTML content of the crop preview zone (called on render and on drag events) */
function _buildShotEditZoneHtml(pid) {
  const cs = (typeof _shotCropState !== 'undefined') ? _shotCropState[pid] : null;
  if (!cs || !cs.shotId) {
    return `
      <div class="shot-edit-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="30" height="30" style="opacity:.4">
          <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 15l4-4 3 3 4-5 7 7"/>
        </svg>
        <span>Drag a screenshot here to preview &amp; crop</span>
      </div>`;
  }

  const aspect = (cs.aspect && cs.aspect !== 'auto') ? cs.aspect : '6.7" iPhone';
  // iOS App Store supported device aspect ratios (portrait dimensions, auto-flipped for landscape images)
  const IOS_AR_OPTIONS = [
    { key: 'original',    label: 'Original' },
    { key: '6.7" iPhone', label: '6.7" iPhone' },
    { key: '5.5" iPhone', label: '5.5" iPhone' },
    { key: 'iPad 13"',    label: 'iPad 13"' },
  ];
  const arBtns = IOS_AR_OPTIONS.map(a =>
    `<button class="shot-ar-btn${a.key === aspect ? ' active' : ''}" onclick="setShotAspect('${pid}','${a.key}')">${a.label}</button>`
  ).join('');

  const isSelected = (() => {
    const ps = state.platformScreenshots?.[pid];
    return ps?.selected?.includes(cs.shotId);
  })();

  const panX = cs.panX || 0;
  const panY = cs.panY || 0;

  return `
    <div class="shot-edit-active">
      <button class="shot-edit-close" onclick="shotEditClose('${pid}')" title="Close preview">×</button>
      <div class="shot-edit-preview-wrap" id="shot-edit-wrap-${pid}"
           style="cursor:grab" onmousedown="shotPanStart(event,'${pid}')">
        <img src="${cs.src}" class="shot-edit-img" id="shot-edit-img-${pid}"
             alt="${escHtml(cs.name || '')}"
             style="transform:translate(${panX}px,${panY}px);pointer-events:none;"
             onload="_updateShotCropFrame('${pid}')">
        <div class="shot-crop-frame" id="shot-crop-frame-${pid}" style="display:none;"></div>
      </div>
      <div class="shot-edit-controls">
        <div class="shot-edit-label">${escHtml(cs.name || 'Screenshot')}</div>
        <div class="shot-ar-btns">${arBtns}</div>
        <button class="btn ${isSelected ? 'btn-ghost' : 'btn-primary'} btn-sm"
                onclick="togglePlatformScreenshot('${pid}','${cs.shotId}');_renderShotEditZone('${pid}')">
          ${isSelected ? '✓ Selected' : '+ Select screenshot'}
        </button>
        <button class="btn btn-ghost btn-sm" onclick="shotEditClose('${pid}')">Close</button>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════
   SUBMITTED CARD  (shown after successful submission — "back" of the platform card)
   ══════════════════════════════════════════════════════ */
function buildSubmittedCard(pid, flipData) {
  const trackId    = (flipData && typeof flipData === 'object') ? flipData.track : (flipData || '');
  const tracks     = PLATFORM_TRACKS[pid] || [];
  const track      = tracks.find(t => t.id === trackId);
  const trackLabel = track ? track.label : trackId;
  const isWeb      = pid === 'web';
  const ts         = (flipData && flipData.time)
    ? new Date(flipData.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  // Lock to the exact pre-flip active card height — prevents CSS Grid from stretching
  // sibling platform cards after submission (min-height alone would allow growth)
  const savedH = state.platformFlippedCardHeight?.[pid];
  const heightStyle = savedH ? ` style="height:${savedH}px;max-height:${savedH}px;overflow:hidden"` : '';

  return `
    <div class="active-card submitted-card" id="active-card-${pid}"${heightStyle}>
      <div class="active-card-head" style="border-bottom:none;">
        <div class="active-card-platform">
          <div class="active-card-icon">${platformIcon(pid, 28, 'white')}</div>
          <div class="active-card-name">${platLabel(pid)}</div>
        </div>
      </div>
      <div class="submitted-body">
        <div class="submitted-status-row">
          <span class="submitted-status-dot"></span>
          <div class="submitted-status-text">
            <div class="submitted-status-label">Current Status</div>
            <div class="submitted-status-value">${isWeb ? 'Live' : 'Waiting for Review'}</div>
          </div>
        </div>
        <div class="submitted-meta">
          ${(!isWeb && trackLabel) ? `<span class="submitted-track-chip">${escHtml(trackLabel)}</span>` : ''}
          ${ts ? `<span class="submitted-ts">${isWeb ? 'Deployed' : 'Submitted'} ${ts}</span>` : ''}
        </div>
        <button class="cancel-submission-btn" onclick="cancelSubmission('${pid}')">${isWeb ? 'Take Down' : 'Cancel Submission'}</button>
      </div>
    </div>`;
}
