/* @ds-bundle: {"format":4,"namespace":"ShipmateDesignSystem_f314df","components":[{"name":"PLATFORMS","sourcePath":"components/brand/PlatformIcon.jsx"},{"name":"PlatformIcon","sourcePath":"components/brand/PlatformIcon.jsx"},{"name":"Shippy","sourcePath":"components/brand/Shippy.jsx"},{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"ChipButton","sourcePath":"components/core/ChipButton.jsx"},{"name":"CtaButton","sourcePath":"components/core/CtaButton.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Pill","sourcePath":"components/core/Pill.jsx"},{"name":"StatusPill","sourcePath":"components/core/StatusPill.jsx"},{"name":"Toggle","sourcePath":"components/core/Toggle.jsx"},{"name":"YesNoButton","sourcePath":"components/core/YesNoButton.jsx"},{"name":"AlertBox","sourcePath":"components/feedback/AlertBox.jsx"},{"name":"Shimmer","sourcePath":"components/feedback/Shimmer.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"TipBox","sourcePath":"components/feedback/TipBox.jsx"},{"name":"Dropzone","sourcePath":"components/forms/Dropzone.jsx"},{"name":"FormLabel","sourcePath":"components/forms/FormLabel.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"TooltipIcon","sourcePath":"components/forms/TooltipIcon.jsx"},{"name":"ProgressBar","sourcePath":"components/progress/ProgressBar.jsx"},{"name":"StepDots","sourcePath":"components/progress/StepDots.jsx"},{"name":"StepRow","sourcePath":"components/progress/StepRow.jsx"},{"name":"TaskRow","sourcePath":"components/progress/TaskRow.jsx"},{"name":"ActionCard","sourcePath":"components/submission/ActionCard.jsx"},{"name":"ActionCardSection","sourcePath":"components/submission/ActionCard.jsx"},{"name":"SuggestionCompare","sourcePath":"components/submission/ActionCard.jsx"},{"name":"CodeBlock","sourcePath":"components/submission/CodeBlock.jsx"},{"name":"InsightPanel","sourcePath":"components/submission/InsightPanel.jsx"},{"name":"InsightSection","sourcePath":"components/submission/InsightPanel.jsx"},{"name":"FixItButton","sourcePath":"components/submission/InsightPanel.jsx"},{"name":"NoticeBanner","sourcePath":"components/submission/NoticeBanner.jsx"},{"name":"PartnerCard","sourcePath":"components/submission/PartnerCard.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"CardHeader","sourcePath":"components/surfaces/Card.jsx"},{"name":"CardSection","sourcePath":"components/surfaces/Card.jsx"},{"name":"Menu","sourcePath":"components/surfaces/Menu.jsx"},{"name":"MenuItem","sourcePath":"components/surfaces/Menu.jsx"},{"name":"Modal","sourcePath":"components/surfaces/Modal.jsx"},{"name":"ModalScrim","sourcePath":"components/surfaces/Modal.jsx"},{"name":"ModalHeader","sourcePath":"components/surfaces/Modal.jsx"},{"name":"ModalBody","sourcePath":"components/surfaces/Modal.jsx"},{"name":"ModalFooter","sourcePath":"components/surfaces/Modal.jsx"}],"sourceHashes":{"components/brand/PlatformIcon.jsx":"98eba25ed2b6","components/brand/Shippy.jsx":"bca87bb84cfc","components/brand/Wordmark.jsx":"d74b8c26c222","components/core/Button.jsx":"616272cd350d","components/core/ChipButton.jsx":"1757a90d2822","components/core/CtaButton.jsx":"b921cc122ac0","components/core/IconButton.jsx":"b573cfc976c5","components/core/Pill.jsx":"18c94162180a","components/core/StatusPill.jsx":"48af2e27b583","components/core/Toggle.jsx":"31c99bf11b5d","components/core/YesNoButton.jsx":"a358171bdbe8","components/feedback/AlertBox.jsx":"57a232c2e9a9","components/feedback/Shimmer.jsx":"a89c8c5986b6","components/feedback/Spinner.jsx":"425e02109475","components/feedback/TipBox.jsx":"50bde2937b21","components/forms/Dropzone.jsx":"4175e5863c39","components/forms/FormLabel.jsx":"c7bc01b53d51","components/forms/Input.jsx":"565da900cb64","components/forms/TooltipIcon.jsx":"8a4582d35f30","components/progress/ProgressBar.jsx":"cf2181e7806c","components/progress/StepDots.jsx":"a75b339bc403","components/progress/StepRow.jsx":"9425d5e89924","components/progress/TaskRow.jsx":"25764851e2ce","components/submission/ActionCard.jsx":"d09f2835fd50","components/submission/CodeBlock.jsx":"a7d96e13541a","components/submission/InsightPanel.jsx":"7e8d48365edc","components/submission/NoticeBanner.jsx":"ddbb5077ecda","components/submission/PartnerCard.jsx":"82403b74dad7","components/surfaces/Card.jsx":"568cba4e9d67","components/surfaces/Menu.jsx":"18be42f1581e","components/surfaces/Modal.jsx":"120760273bf3","ui_kits/app/Dashboard.jsx":"24bc97138cca","ui_kits/app/Onboarding.jsx":"bf78f4ec2a97","ui_kits/app/ProjectBar.jsx":"b2dd864d7785","ui_kits/app/StepModal.jsx":"2b71d6e24b96","ui_kits/app/Topbar.jsx":"6fc5ce33b217","ui_kits/app/data.js":"df73793d065e","ui_kits/marketing/Splash.jsx":"bd07c0024f52"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ShipmateDesignSystem_f314df = window.ShipmateDesignSystem_f314df || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/PlatformIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Mirrors platformIcon() in the prototype's render.js: iOS, Google Play and Steam
// are inline paths; PlayStation, Xbox and Nintendo are transparent PNGs that the
// brightness/invert filter whitens. Do not filter the first three — their source
// PNGs are opaque and would render as solid white squares.
const ICON_PATHS = {
  ios: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11',
  android: 'M3.18 23.76c.35.2.8.19 1.22-.05l13.32-7.73-3.37-3.47zM.3 1.05C.1 1.39 0 1.8 0 2.24v19.53c0 .44.1.85.3 1.19l.07.07 10.94-10.94v-.26L.37.98zm22.44 9.47l-3.01-1.75-3.71 3.71 3.72 3.72 3.02-1.76c.86-.5.86-1.32-.02-1.92zM4.4.29L17.72 8.02l-3.37 3.47L4.4.29z',
  steam: 'M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.663 0-3.015 1.353-3.015 3.015 0 1.663 1.352 3.015 3.015 3.015 1.663 0 3.015-1.352 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z'
};
const EVENODD = new Set(['android', 'steam']);
const ICON_FILES = {
  psn: 'playstation-white.png',
  xbox: 'xbox.png',
  nintendo: 'nintendo.png'
};
const SCALE = {
  ios: 1.15,
  psn: 1.15
};
const PLATFORMS = {
  ios: {
    label: 'App Store'
  },
  android: {
    label: 'Google Play'
  },
  steam: {
    label: 'Steam Store'
  },
  psn: {
    label: 'PlayStation Store'
  },
  xbox: {
    label: 'Xbox Store'
  },
  nintendo: {
    label: 'Nintendo eShop'
  }
};
function PlatformIcon({
  platform,
  size = 28,
  well = false,
  base = '../../assets',
  style,
  ...rest
}) {
  const p = PLATFORMS[platform];
  const s = Math.round(size * (SCALE[platform] || 1));
  let glyph = null;
  if (ICON_FILES[platform]) {
    glyph = /*#__PURE__*/React.createElement("img", {
      src: base + '/platforms/' + ICON_FILES[platform],
      alt: p ? p.label : '',
      width: s,
      height: s,
      style: {
        objectFit: 'contain',
        display: 'block',
        filter: 'brightness(0) invert(1)'
      }
    });
  } else if (ICON_PATHS[platform]) {
    glyph = /*#__PURE__*/React.createElement("svg", {
      width: s,
      height: s,
      viewBox: "0 0 24 24",
      overflow: "visible",
      fill: "currentColor",
      "aria-label": p.label,
      fillRule: EVENODD.has(platform) ? 'evenodd' : undefined,
      clipRule: EVENODD.has(platform) ? 'evenodd' : undefined,
      style: {
        display: 'block'
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: ICON_PATHS[platform]
    }));
  }
  if (!well) return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      color: 'var(--text)',
      ...style
    }
  }, rest), glyph);
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      width: 40,
      height: 40,
      borderRadius: 'var(--r-xl)',
      background: 'var(--panel-3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      color: 'var(--text)',
      overflow: 'hidden',
      ...style
    }
  }, rest), glyph);
}
Object.assign(__ds_scope, { PLATFORMS, PlatformIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/PlatformIcon.jsx", error: String((e && e.message) || e) }); }

// components/brand/Shippy.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Shippy({
  width = 160,
  glow = false,
  float = true,
  base = '../../assets',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, '@keyframes ds-octo-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'), /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-block',
      width,
      lineHeight: 0,
      ...style
    }
  }, rest), glow ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '-45%',
      top: '-30%',
      width: '190%',
      height: '160%',
      pointerEvents: 'none',
      background: 'radial-gradient(50% 50% at 50% 50%, rgba(159,104,240,0.45) 0%, rgba(159,104,240,0.26) 34%, rgba(159,104,240,0.10) 60%, rgba(159,104,240,0.03) 80%, transparent 100%)'
    }
  }) : null, /*#__PURE__*/React.createElement("img", {
    src: base + '/brand/shippy.svg',
    alt: "Shippy",
    style: {
      position: 'relative',
      width: '100%',
      height: 'auto',
      display: 'block',
      animation: float ? 'ds-octo-float var(--octo-float) var(--ease-inout) infinite' : 'none'
    }
  })));
}
Object.assign(__ds_scope, { Shippy });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Shippy.jsx", error: String((e && e.message) || e) }); }

// components/brand/Wordmark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Wordmark({
  height = 40,
  base = '../../assets',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("img", _extends({
    src: base + '/logos/shipmate-logo.png',
    alt: "Shipmate",
    style: {
      height,
      width: 'auto',
      display: 'block',
      objectFit: 'contain',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  padding: '9px 24px',
  borderRadius: 'var(--r-full)',
  border: 'none',
  cursor: 'pointer',
  fontSize: 'var(--fs-body)',
  fontWeight: 'var(--fw-medium)',
  fontFamily: 'inherit',
  transition: 'all var(--dur-base)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  lineHeight: 1
};
const variants = {
  primary: {
    background: 'var(--text)',
    color: 'var(--bg)',
    fontWeight: 'var(--fw-semibold)'
  },
  ghost: {
    background: 'var(--panel-3)',
    color: 'var(--text-dim)'
  },
  danger: {
    background: 'var(--magenta)',
    color: '#fff',
    fontWeight: 'var(--fw-bold)'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  style,
  ...rest
}) {
  const sz = size === 'sm' ? {
    padding: '6px 14px',
    fontSize: 'var(--fs-small)'
  } : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    style: {
      ...base,
      ...variants[variant],
      ...sz,
      ...(disabled ? {
        opacity: 0.4,
        cursor: 'not-allowed'
      } : null),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/ChipButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ChipButton({
  selected,
  children,
  block,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      flex: block ? 1 : undefined,
      fontSize: 'var(--fs-small)',
      fontWeight: 'var(--fw-medium)',
      padding: block ? '7px 10px' : '7px 13px',
      borderRadius: 'var(--r-md)',
      border: '1px solid ' + (selected ? 'var(--sel-border)' : 'var(--border)'),
      background: selected ? 'var(--sel-bg)' : 'var(--panel-2)',
      color: selected ? 'var(--sel-color)' : h ? 'var(--text)' : 'var(--text-dim)',
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'color var(--dur-base), border-color var(--dur-base), background var(--dur-base)',
      whiteSpace: 'nowrap',
      textAlign: 'center',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { ChipButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ChipButton.jsx", error: String((e && e.message) || e) }); }

// components/core/CtaButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function CtaButton({
  children = 'GET STARTED',
  arrow = '→',
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      boxSizing: 'border-box',
      width: 320,
      height: 68,
      fontFamily: 'var(--font-display-mono)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-mk-cta)',
      letterSpacing: 'var(--ls-cta)',
      color: 'var(--text-on-green)',
      background: 'var(--green-brand)',
      border: 'none',
      borderRadius: 'var(--r-xl)',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      transition: 'transform var(--dur-base) var(--ease), box-shadow var(--dur-base) var(--ease)',
      transform: hover ? 'translateY(-2px)' : 'none',
      boxShadow: hover ? 'var(--glow-cta)' : 'none',
      ...style
    }
  }, rest), children, arrow ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22
    }
  }, arrow) : null);
}
Object.assign(__ds_scope, { CtaButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/CtaButton.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function IconButton({
  children,
  label,
  active,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  const on = h || active;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      width: 40,
      height: 40,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: on ? 'var(--panel-2)' : 'var(--well)',
      border: '1px solid ' + (on ? 'var(--border)' : 'transparent'),
      borderRadius: 'var(--r-lg)',
      cursor: 'pointer',
      color: on ? 'var(--text)' : 'var(--text-dim)',
      transition: 'all var(--dur-base)',
      padding: 0,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Pill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  neutral: {
    border: '1.5px solid rgba(255,255,255,0.3)',
    color: 'var(--text-dim)',
    background: 'transparent'
  },
  ready: {
    border: '1.5px solid rgba(47,220,128,0.5)',
    color: 'rgba(47,220,128,0.9)',
    background: 'rgba(47,220,128,0.08)'
  },
  processing: {
    border: '1.5px solid rgba(255,200,80,0.45)',
    color: 'var(--processing)',
    background: 'rgba(255,200,80,0.07)'
  }
};
function Pill({
  tone = 'neutral',
  icon,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 8px',
      borderRadius: 'var(--r-sm)',
      fontSize: 'var(--fs-tiny)',
      fontWeight: 'var(--fw-medium)',
      cursor: tone === 'processing' ? 'default' : 'pointer',
      transition: 'background var(--dur-base), border-color var(--dur-base)',
      userSelect: 'none',
      flexShrink: 0,
      maxWidth: 160,
      ...tones[tone],
      ...style
    }
  }, rest), icon, /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, children));
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Pill.jsx", error: String((e && e.message) || e) }); }

// components/core/StatusPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  prod: {
    color: 'var(--green)',
    background: 'var(--green-soft)'
  },
  pre: {
    color: 'var(--blue)',
    background: 'var(--blue-soft)'
  }
};
function StatusPill({
  tone = 'prod',
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      fontSize: 'var(--fs-micro)',
      fontWeight: 'var(--fw-semibold)',
      letterSpacing: '0.2px',
      padding: '3px 8px',
      borderRadius: 'var(--r-full)',
      whiteSpace: 'nowrap',
      ...tones[tone],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { StatusPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatusPill.jsx", error: String((e && e.message) || e) }); }

// components/core/Toggle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Toggle({
  checked = false,
  onChange,
  disabled,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    role: "switch",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => onChange && onChange(!checked),
    style: {
      width: 30,
      height: 17,
      borderRadius: 'var(--r-full)',
      border: 'none',
      background: checked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
      position: 'relative',
      cursor: disabled ? 'not-allowed' : 'pointer',
      flexShrink: 0,
      transition: 'background var(--dur-medium)',
      outline: 'none',
      opacity: disabled ? 0.4 : 1,
      padding: 0,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      width: 13,
      height: 13,
      background: checked ? 'var(--text)' : 'rgba(255,255,255,0.6)',
      borderRadius: '50%',
      top: 2,
      left: checked ? 15 : 2,
      transition: 'left var(--dur-medium) var(--ease-standard), background var(--dur-medium)'
    }
  }));
}
Object.assign(__ds_scope, { Toggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Toggle.jsx", error: String((e && e.message) || e) }); }

// components/core/YesNoButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function YesNoButton({
  selected,
  inferred,
  children,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      position: 'relative',
      padding: '5px 14px',
      borderRadius: 'var(--r-md)',
      border: '1px solid ' + (selected ? 'var(--sel-color)' : h ? 'var(--border-hover)' : 'var(--border)'),
      background: selected ? h ? 'var(--sel-bg-strong)' : 'var(--sel-bg)' : 'var(--panel-3)',
      fontSize: 'var(--fs-micro)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: '0.8px',
      cursor: 'pointer',
      transition: 'all var(--dur-base)',
      fontFamily: 'inherit',
      color: selected ? 'var(--sel-color)' : h ? 'var(--text-dim)' : 'var(--text-faint)',
      textAlign: 'center',
      minWidth: 52,
      opacity: selected && inferred ? 0.5 : 1,
      ...style
    }
  }, rest), children, inferred ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -6,
      right: -5,
      fontSize: 9,
      lineHeight: 1,
      color: 'var(--shipmate-glyph)',
      pointerEvents: 'none',
      textShadow: '0 0 3px rgba(0,0,0,0.45)'
    }
  }, "\u2726") : null);
}
Object.assign(__ds_scope, { YesNoButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/YesNoButton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/AlertBox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function AlertBox({
  title,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 9,
      background: 'var(--alert-bg)',
      border: '1px solid var(--alert-border)',
      borderRadius: 'var(--r-lg)',
      padding: '10px 12px',
      fontSize: 'var(--fs-small)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'var(--alert-color)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 17,
      height: 17,
      borderRadius: '50%',
      background: 'rgba(255,59,118,0.12)',
      border: '1px solid var(--alert-color)',
      color: 'var(--alert-color)',
      fontSize: 10,
      fontWeight: 'var(--fw-bold)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1
    }
  }, "!"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, title ? /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 'var(--fw-bold)'
    }
  }, title, " ") : null, children));
}
Object.assign(__ds_scope, { AlertBox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/AlertBox.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Shimmer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Shimmer({
  short,
  height,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, '@keyframes ds-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'), /*#__PURE__*/React.createElement("div", _extends({
    style: {
      height: height || (short ? 36 : 52),
      width: short ? '65%' : '100%',
      borderRadius: 'var(--r-lg)',
      background: 'linear-gradient(90deg,var(--panel-2) 25%,var(--panel-3) 50%,var(--panel-2) 75%)',
      backgroundSize: '200% 100%',
      animation: 'ds-shimmer 1.4s infinite',
      ...style
    }
  }, rest)));
}
Object.assign(__ds_scope, { Shimmer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Shimmer.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Spinner({
  size = 13,
  tone = 'selection',
  style,
  ...rest
}) {
  const color = tone === 'processing' ? 'rgba(255,200,80,0.85)' : 'var(--sel-color)';
  const track = tone === 'processing' ? 'rgba(255,200,80,0.25)' : 'var(--border)';
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, '@keyframes ds-spin{to{transform:rotate(360deg)}}'), /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-block',
      width: size,
      height: size,
      border: '2px solid ' + track,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'ds-spin 0.7s linear infinite',
      flexShrink: 0,
      ...style
    }
  }, rest)));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/TipBox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TipBox({
  icon = '✦',
  title,
  wash = true,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 9,
      background: wash ? 'var(--shipmate-wash), var(--panel)' : 'var(--shipmate-bg)',
      border: '1px solid var(--shipmate-border)',
      borderRadius: 'var(--r-lg)',
      padding: '10px 12px',
      fontSize: 'var(--fs-small)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'var(--text-dim)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: 17,
      height: 17,
      borderRadius: '50%',
      background: 'rgba(159,104,240,0.14)',
      border: '1px solid var(--shipmate-glyph)',
      color: 'var(--shipmate-glyph)',
      fontSize: 10,
      fontWeight: 'var(--fw-bold)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, title ? /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--shipmate-glyph)',
      fontWeight: 'var(--fw-bold)'
    }
  }, title, " ") : null, children));
}
Object.assign(__ds_scope, { TipBox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/TipBox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Dropzone.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Dropzone({
  label = 'Drop files here',
  hint,
  compact,
  required,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      border: '1.5px dashed ' + (required ? 'rgba(251,146,60,0.5)' : 'var(--border-hover)'),
      borderRadius: 'var(--r-xl)',
      padding: compact ? '16px 20px' : '24px 20px',
      textAlign: 'center',
      background: 'var(--panel-2)',
      cursor: 'pointer',
      transition: 'all var(--dur-medium)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      color: h ? 'var(--text)' : 'var(--text-faint)',
      marginBottom: 6,
      fontWeight: 'var(--fw-light)'
    }
  }, "+"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body)',
      fontWeight: 'var(--fw-semibold)',
      color: h ? 'var(--text)' : 'var(--text-dim)',
      marginBottom: 4
    }
  }, label), hint ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-tiny)',
      color: 'var(--text-faint)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Dropzone });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Dropzone.jsx", error: String((e && e.message) || e) }); }

// components/forms/FormLabel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function FormLabel({
  required,
  children,
  hint,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: 'block',
      fontSize: 'var(--fs-micro)',
      fontWeight: 'var(--fw-bold)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-label)',
      color: 'var(--text-dim)',
      marginBottom: 6,
      ...style
    }
  }, rest), required ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--orange)',
      marginRight: 6,
      verticalAlign: 'middle',
      position: 'relative',
      top: -1
    }
  }) : null, children, hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 8,
      fontSize: 'var(--fs-micro)',
      fontWeight: 'var(--fw-medium)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: 'var(--text-faint)',
      background: 'var(--panel-3)',
      border: 'var(--border-line)',
      borderRadius: 'var(--r-xs)',
      padding: '2px 6px'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { FormLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FormLabel.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  as = 'input',
  required,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const s = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid ' + (focus ? 'var(--text-faint)' : required ? 'rgba(251,146,60,0.4)' : 'var(--border)'),
    borderRadius: 'var(--r-md)',
    fontSize: 'var(--fs-body)',
    fontFamily: 'inherit',
    color: 'var(--text)',
    background: required && !focus ? 'rgba(251,146,60,0.03)' : 'var(--bg)',
    transition: 'border-color var(--dur-slow), background var(--dur-slow), box-shadow var(--dur-slow)',
    outline: 'none',
    boxShadow: focus && required ? 'var(--ring-required)' : 'none',
    ...style
  };
  const handlers = {
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  };
  if (as === 'textarea') return /*#__PURE__*/React.createElement("textarea", _extends({}, handlers, {
    style: {
      ...s,
      resize: 'vertical',
      lineHeight: 'var(--lh-normal)',
      minHeight: 72
    }
  }, rest));
  if (as === 'select') return /*#__PURE__*/React.createElement("select", _extends({}, handlers, {
    style: {
      ...s,
      appearance: 'none',
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 11px center',
      paddingRight: 30,
      cursor: 'pointer'
    }
  }, rest));
  return /*#__PURE__*/React.createElement("input", _extends({}, handlers, {
    style: s
  }, rest));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/TooltipIcon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TooltipIcon({
  warned,
  glyph = '?',
  title,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", _extends({
    title: title,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      width: 15,
      height: 15,
      borderRadius: '50%',
      background: 'var(--panel-3)',
      border: '1px solid ' + (warned ? 'var(--orange)' : h ? 'var(--text-faint)' : 'var(--border-hover)'),
      color: warned ? 'var(--orange)' : h ? 'var(--text-dim)' : 'var(--text-faint)',
      fontSize: 9,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'default',
      marginLeft: 6,
      fontWeight: 'var(--fw-bold)',
      transition: 'border-color var(--dur-base), color var(--dur-base)',
      verticalAlign: 'middle',
      ...style
    }
  }, rest), glyph);
}
Object.assign(__ds_scope, { TooltipIcon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TooltipIcon.jsx", error: String((e && e.message) || e) }); }

// components/progress/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ProgressBar({
  value = 0,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      flex: 1,
      height: 3,
      borderRadius: 2,
      overflow: 'hidden',
      background: 'rgba(74,222,128,0.15)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: Math.max(0, Math.min(100, value)) + '%',
      borderRadius: 2,
      transition: 'width var(--dur-bar) var(--ease-standard)',
      background: 'var(--green)'
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/progress/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/progress/StepDots.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function StepDots({
  count = 4,
  active = 0,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 7,
      alignItems: 'center',
      ...style
    }
  }, rest), Array.from({
    length: count
  }, (_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: i === active ? 18 : 6,
      height: 6,
      borderRadius: i === active ? 3 : '50%',
      background: i === active ? 'var(--green)' : i < active ? 'rgba(74,222,128,0.4)' : 'var(--panel-3)',
      transition: 'all var(--dur-medium)'
    }
  })));
}
Object.assign(__ds_scope, { StepDots });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/progress/StepDots.jsx", error: String((e && e.message) || e) }); }

// components/progress/StepRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const check = /*#__PURE__*/React.createElement("svg", {
  width: "10",
  height: "10",
  viewBox: "0 0 12 12",
  fill: "none"
}, /*#__PURE__*/React.createElement("path", {
  d: "M2 6l3 3 5-5",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}));
const riskColor = {
  high: 'var(--magenta)',
  medium: 'var(--orange)',
  low: 'var(--green)',
  none: 'var(--text-faint)'
};
function StepRow({
  index,
  name,
  done,
  state = 'default',
  risk,
  right,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  const numColor = done ? '#fff' : state === 'risk-high' ? 'var(--magenta)' : state === 'risk-warn' ? 'var(--orange)' : 'var(--text-faint)';
  const numBorder = done ? 'var(--green)' : state === 'risk-high' ? 'var(--magenta)' : state === 'risk-warn' ? 'var(--orange)' : 'var(--text-faint)';
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: 'var(--pad-row)',
      cursor: 'pointer',
      transition: 'background var(--dur-fast)',
      borderBottom: 'var(--border-line)',
      background: h ? 'var(--panel-2)' : 'transparent',
      opacity: done ? h ? 0.8 : 0.6 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      border: '1.5px solid ' + numBorder,
      background: done ? 'var(--green)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 'var(--fw-bold)',
      color: numColor,
      flexShrink: 0,
      transition: 'all var(--dur-base)'
    }
  }, done ? check : index), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 'var(--fs-body)',
      fontWeight: 'var(--fw-semibold)',
      color: 'var(--text)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, name), risk ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      flexShrink: 0,
      background: riskColor[risk],
      opacity: risk === 'none' ? 0.5 : 1
    }
  }) : null, right);
}
Object.assign(__ds_scope, { StepRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/progress/StepRow.jsx", error: String((e && e.message) || e) }); }

// components/progress/TaskRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TaskRow({
  label,
  done,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: 'var(--pad-row)',
      cursor: 'pointer',
      transition: 'background var(--dur-fast)',
      background: h ? 'var(--panel-2)' : 'transparent',
      opacity: done ? 0.55 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 14,
      borderRadius: '50%',
      border: '1.5px solid ' + (done ? 'var(--green)' : 'var(--text-faint)'),
      background: done ? 'var(--green)' : 'transparent',
      flexShrink: 0,
      position: 'relative'
    }
  }, done ? /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "8",
    viewBox: "0 0 12 12",
    fill: "none",
    style: {
      position: 'absolute',
      top: 1,
      left: 1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 6l3 3 5-5",
    stroke: "#0a0a0a",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-body)',
      color: 'inherit',
      flex: 1
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-body)',
      color: 'var(--text-faint)',
      transition: 'color var(--dur-fast)'
    }
  }, "\u203A"));
}
Object.assign(__ds_scope, { TaskRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/progress/TaskRow.jsx", error: String((e && e.message) || e) }); }

// components/submission/ActionCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const BARS = {
  high: {
    bg: 'var(--impact-high)',
    ink: 'var(--impact-high-ink)'
  },
  medium: {
    bg: 'var(--impact-medium)',
    ink: 'var(--impact-medium-ink)'
  },
  notice: {
    bg: 'var(--impact-notice)',
    ink: 'var(--impact-notice-ink)'
  },
  done: {
    bg: 'var(--impact-done)',
    ink: 'var(--impact-done-ink)'
  }
};
const CHECK = /*#__PURE__*/React.createElement("svg", {
  width: "20",
  height: "20",
  viewBox: "0 0 20 20",
  fill: "none"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "10",
  cy: "10",
  r: "10",
  fill: "#10380c"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5.5 10.2l3 3 6-6.4",
  stroke: "#92FE85",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}));
function ActionCard({
  title,
  impact = 'medium',
  impactLabel,
  resolved,
  page,
  pages,
  onPrev,
  onNext,
  children,
  style,
  ...rest
}) {
  const bar = BARS[resolved ? 'done' : impact];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      border: '1px solid ' + bar.bg,
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      background: 'var(--panel)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '11px 16px',
      background: bar.bg,
      color: bar.ink
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-base)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: '0.02em',
      textTransform: 'uppercase'
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 'var(--fs-body)',
      fontWeight: 'var(--fw-medium)'
    }
  }, impactLabel || 'Impact: ' + impact.charAt(0).toUpperCase() + impact.slice(1), resolved ? CHECK : null)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 18px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, children), pages ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '12px 16px',
      borderTop: 'var(--border-line)'
    }
  }, /*#__PURE__*/React.createElement(PagerButton, {
    onClick: onPrev
  }, "Previous"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-body)',
      color: 'var(--text-dim)'
    }
  }, page, " / ", pages), /*#__PURE__*/React.createElement(PagerButton, {
    onClick: onNext
  }, "Next")) : null);
}
function PagerButton({
  children,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      minWidth: 128,
      padding: '7px 16px',
      borderRadius: 'var(--r-md)',
      border: '1px solid ' + (h ? 'var(--border-hover)' : 'var(--border)'),
      background: h ? 'var(--panel-2)' : 'transparent',
      color: h ? 'var(--text)' : 'var(--text-dim)',
      fontFamily: 'inherit',
      fontSize: 'var(--fs-body)',
      cursor: 'pointer',
      transition: 'all var(--dur-base)'
    }
  }, rest), children);
}
function ActionCardSection({
  label,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), label ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-tiny)',
      fontWeight: 'var(--fw-semibold)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-label)',
      color: 'var(--text-dim)',
      marginBottom: 8
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'var(--text)'
    }
  }, children));
}
function SuggestionCompare({
  current,
  suggestion,
  caveat,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 14,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      border: 'var(--border-line)',
      borderRadius: 'var(--r-lg)',
      padding: '12px 14px',
      background: 'var(--panel-2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-tiny)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-label)',
      color: 'var(--text-faint)',
      marginBottom: 8
    }
  }, "Current"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'var(--text-dim)'
    }
  }, current)), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--suggest-border)',
      borderRadius: 'var(--r-lg)',
      padding: '12px 14px',
      background: 'var(--suggest-bg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-tiny)',
      color: 'var(--suggest-label)',
      marginBottom: 8
    }
  }, "ShipMate Suggestion"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'var(--text)'
    }
  }, suggestion), caveat ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body)',
      color: 'var(--magenta)',
      marginTop: 10
    }
  }, caveat) : null));
}
Object.assign(__ds_scope, { ActionCard, ActionCardSection, SuggestionCompare });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/submission/ActionCard.jsx", error: String((e && e.message) || e) }); }

// components/submission/CodeBlock.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function CodeBlock({
  label,
  code,
  maxHeight = 190,
  style,
  ...rest
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    try {
      navigator.clipboard.writeText(code);
    } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), label ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-tiny)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-label)',
      color: 'var(--text-faint)',
      marginBottom: 6
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      background: 'rgba(0,0,0,0.35)',
      border: 'var(--border-line)',
      borderRadius: 'var(--r-md)',
      padding: '10px 12px',
      maxHeight,
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: copy,
    style: {
      position: 'absolute',
      top: 8,
      right: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: 'transparent',
      border: 'none',
      color: copied ? 'var(--green)' : 'var(--text-dim)',
      fontFamily: 'inherit',
      fontSize: 'var(--fs-small)',
      cursor: 'pointer'
    }
  }, copied ? 'Copied' : 'Copy Code', /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.4"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "5.5",
    y: "5.5",
    width: "8",
    height: "8",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10.5 3.5v-1a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h1"
  }))), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-code)',
      fontSize: 'var(--fs-tiny)',
      lineHeight: 'var(--lh-normal)',
      color: 'var(--text)',
      whiteSpace: 'pre'
    }
  }, code)));
}
Object.assign(__ds_scope, { CodeBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/submission/CodeBlock.jsx", error: String((e && e.message) || e) }); }

// components/submission/InsightPanel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function InsightPanel({
  title = 'Insights',
  onBack,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("aside", _extends({
    style: {
      width: 258,
      background: 'var(--panel)',
      border: 'var(--border-line)',
      borderRadius: 'var(--r-2xl)',
      padding: '14px 16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onBack,
    "aria-label": "Back",
    style: {
      width: 26,
      height: 26,
      borderRadius: 'var(--r-md)',
      border: 'var(--border-line)',
      background: 'var(--panel-2)',
      color: 'var(--text-dim)',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: 12,
      lineHeight: 1
    }
  }, "\u2039"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-tiny)',
      fontWeight: 'var(--fw-bold)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-header)',
      color: 'var(--text)'
    }
  }, title)), children);
}
function InsightSection({
  label,
  shipmate,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body)',
      fontWeight: 'var(--fw-semibold)',
      color: shipmate ? 'var(--shipmate-glyph)' : 'var(--text)',
      marginBottom: 6
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-small)',
      lineHeight: 'var(--lh-relaxed)',
      color: shipmate ? 'var(--shipmate-glyph)' : 'var(--text-dim)'
    }
  }, children));
}
function FixItButton({
  children = 'Fix it ship mate!',
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: 'var(--r-lg)',
      border: '1px solid var(--suggest-border)',
      background: h ? 'rgba(122,86,174,0.30)' : 'var(--suggest-bg)',
      color: 'var(--text)',
      fontFamily: 'inherit',
      fontSize: 'var(--fs-body)',
      cursor: 'pointer',
      transition: 'background var(--dur-base)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { InsightPanel, InsightSection, FixItButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/submission/InsightPanel.jsx", error: String((e && e.message) || e) }); }

// components/submission/NoticeBanner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function NoticeBanner({
  children,
  onDismiss,
  dismissLabel = 'Dismiss',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      background: 'var(--impact-notice)',
      color: 'var(--impact-notice-ink)',
      borderRadius: 'var(--r-lg)',
      padding: '12px 14px',
      fontSize: 'var(--fs-body)',
      lineHeight: 'var(--lh-normal)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, children), onDismiss ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onDismiss,
    style: {
      flexShrink: 0,
      padding: '6px 14px',
      borderRadius: 'var(--r-md)',
      border: 'none',
      background: 'rgba(0,0,0,0.14)',
      color: 'rgba(36,27,6,0.65)',
      fontFamily: 'inherit',
      fontSize: 'var(--fs-body)',
      cursor: 'pointer'
    }
  }, dismissLabel) : null);
}
Object.assign(__ds_scope, { NoticeBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/submission/NoticeBanner.jsx", error: String((e && e.message) || e) }); }

// components/submission/PartnerCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function PartnerCard({
  name,
  description,
  href = '#',
  logo,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      border: '1px solid ' + (h ? 'var(--border-hover)' : 'var(--border)'),
      borderRadius: 'var(--r-xl)',
      background: 'var(--panel)',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'border-color var(--dur-base)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 'var(--r-md)',
      background: logo ? 'transparent' : 'var(--link)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'var(--fs-body)',
      fontWeight: 'var(--fw-bold)',
      flexShrink: 0,
      overflow: 'hidden'
    }
  }, logo || (name || '?').charAt(0)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-body)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--text)'
    }
  }, name)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--fs-body)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'var(--text-dim)',
      margin: 0
    }
  }, description), /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      alignSelf: 'flex-end',
      fontSize: 'var(--fs-body)',
      color: 'var(--link)',
      textDecoration: 'none'
    }
  }, "Partner Website \u2197"));
}
Object.assign(__ds_scope, { PartnerCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/submission/PartnerCard.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  ready,
  children,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      background: 'var(--panel)',
      border: '1px solid ' + (ready ? h ? 'rgba(47,220,128,0.75)' : 'rgba(47,220,128,0.55)' : h ? 'var(--border-hover)' : 'var(--border)'),
      borderRadius: 'var(--r-2xl)',
      overflow: 'hidden',
      transition: 'border-color var(--dur-base)',
      boxShadow: ready ? 'var(--ring-ready)' : 'none',
      ...style
    }
  }, rest), children);
}
function CardHeader({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 18px 12px',
      gap: 12,
      borderRadius: 'var(--r-3xl) var(--r-3xl) 0 0',
      transition: 'background var(--dur-base)',
      ...style
    }
  }, rest), children);
}
function CardSection({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderTop: 'var(--border-line)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card, CardHeader, CardSection });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Menu.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Menu({
  children,
  width = 180,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, '@keyframes ds-fade-down{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}'), /*#__PURE__*/React.createElement("div", _extends({
    style: {
      minWidth: width,
      background: 'var(--panel)',
      border: 'var(--border-line)',
      borderRadius: 'var(--r-xl)',
      padding: 6,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      boxShadow: 'var(--shadow-dropdown)',
      animation: 'ds-fade-down var(--dur-base) var(--ease)',
      ...style
    }
  }, rest), children));
}
function MenuItem({
  danger,
  active,
  children,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  const on = h || active;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 14px',
      borderRadius: 'var(--r-md)',
      cursor: 'pointer',
      fontSize: 'var(--fs-body)',
      fontFamily: 'inherit',
      background: on ? danger ? 'var(--magenta-soft)' : 'var(--panel-2)' : 'transparent',
      border: 'none',
      textAlign: 'left',
      color: danger ? 'var(--magenta)' : 'var(--text)',
      transition: 'background var(--dur-fast)',
      width: '100%',
      fontWeight: active ? 'var(--fw-semibold)' : 'var(--fw-regular)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Menu, MenuItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Menu.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Modal.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Modal({
  width = 640,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, '@keyframes ds-modal-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}'), /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--panel)',
      border: 'var(--border-line)',
      borderRadius: 'var(--r-3xl)',
      width: '100%',
      maxWidth: width,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-modal)',
      overflow: 'hidden',
      animation: 'ds-modal-in 0.25s var(--ease-modal)',
      ...style
    }
  }, rest), children));
}
function ModalScrim({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--scrim)',
      backdropFilter: 'var(--scrim-blur)',
      WebkitBackdropFilter: 'var(--scrim-blur)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 24,
      ...style
    }
  }, rest), children);
}
function ModalHeader({
  title,
  subtitle,
  eyebrow,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: '24px 28px 18px',
      borderBottom: 'var(--border-line)',
      flexShrink: 0,
      ...style
    }
  }, rest), eyebrow ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-lg)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: 'var(--ls-wordmark)',
      color: 'var(--text)',
      marginBottom: 14,
      textTransform: 'uppercase'
    }
  }, eyebrow) : null, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--fs-headline)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--text)',
      marginBottom: 4,
      letterSpacing: 'var(--ls-title)'
    }
  }, title) : null, subtitle ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-body)',
      color: 'var(--text-dim)',
      lineHeight: 'var(--lh-normal)'
    }
  }, subtitle) : null, children);
}
function ModalBody({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--pad-modal-body)',
      ...style
    }
  }, rest), children);
}
function ModalFooter({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderTop: 'var(--border-line)',
      padding: 'var(--pad-modal-foot)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Modal, ModalScrim, ModalHeader, ModalBody, ModalFooter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Modal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Dashboard.jsx
try { (() => {
const {
  Card,
  CardHeader,
  CardSection,
  StepRow,
  Toggle,
  Pill,
  StatusPill,
  ProgressBar,
  PlatformIcon,
  PLATFORMS
} = window.ShipmateDesignSystem_f314df;
const Check = () => /*#__PURE__*/React.createElement("svg", {
  width: "10",
  height: "10",
  viewBox: "0 0 12 12",
  fill: "none"
}, /*#__PURE__*/React.createElement("path", {
  d: "M2 6l3 3 5-5",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}));
const Plus = () => /*#__PURE__*/React.createElement("svg", {
  width: "9",
  height: "9",
  viewBox: "0 0 12 12",
  fill: "none",
  style: {
    opacity: 0.5
  }
}, /*#__PURE__*/React.createElement("path", {
  d: "M6 1v10M1 6h10",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round"
}));
function PlatformCard({
  id,
  cfg,
  done,
  track,
  onStep,
  onTrack,
  onSubmit
}) {
  const total = cfg.steps.length;
  const ready = done.length === total;
  const canSubmit = ready && !!track;
  return /*#__PURE__*/React.createElement(Card, {
    ready: ready
  }, /*#__PURE__*/React.createElement(CardHeader, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(PlatformIcon, {
    platform: id,
    well: true,
    base: "../../assets"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-base)',
      fontWeight: 600
    }
  }, PLATFORMS[id].label), /*#__PURE__*/React.createElement(Pill, {
    tone: ready ? 'ready' : 'neutral',
    icon: ready ? /*#__PURE__*/React.createElement(Check, null) : /*#__PURE__*/React.createElement(Plus, null)
  }, ready ? 'GoApeShip-1.4' : 'Upload build')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-tiny)',
      color: 'var(--text-faint)',
      marginTop: 3
    }
  }, done.length, " / ", total, " steps"))), /*#__PURE__*/React.createElement(Toggle, {
    checked: true,
    onChange: () => {}
  })), cfg.live && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px 10px',
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(StatusPill, {
    tone: "prod"
  }, "Prod: ", cfg.live)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: done.length / total * 100
  })), /*#__PURE__*/React.createElement(CardSection, null, cfg.steps.map((s, i) => /*#__PURE__*/React.createElement(StepRow, {
    key: s,
    index: i + 1,
    name: s,
    done: done.includes(s),
    state: !done.includes(s) && i === done.length ? 'risk-warn' : 'default',
    onClick: () => onStep(id, s)
  })), /*#__PURE__*/React.createElement("div", {
    onClick: canSubmit ? () => onSubmit(id) : undefined,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 11,
      padding: 'var(--pad-row)',
      opacity: ready ? 1 : 0.45,
      cursor: canSubmit ? 'pointer' : 'default',
      background: ready ? 'rgba(47,220,128,0.04)' : 'transparent',
      borderTop: ready ? '1px solid rgba(47,220,128,0.25)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      border: '1.5px solid var(--text-faint)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--text-faint)',
      flexShrink: 0
    }
  }, total + 1), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 'var(--fs-body)',
      fontWeight: 600
    }
  }, "Submit"), /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      onTrack(id);
    }
  }, /*#__PURE__*/React.createElement(Pill, {
    tone: track ? 'ready' : 'neutral',
    icon: track ? /*#__PURE__*/React.createElement(Check, null) : /*#__PURE__*/React.createElement(Plus, null)
  }, track || 'Choose Track')))));
}
function Dashboard({
  data,
  active,
  done,
  tracks,
  onStep,
  onTrack,
  onSubmit,
  onActivate
}) {
  const inactive = Object.keys(data.platforms).filter(p => !active.includes(p));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--pad-dashboard)',
      maxWidth: 'var(--w-dashboard)',
      margin: '0 auto',
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: 16,
      marginBottom: 32
    }
  }, active.map(id => /*#__PURE__*/React.createElement(PlatformCard, {
    key: id,
    id: id,
    cfg: data.platforms[id],
    done: done[id] || [],
    track: tracks[id],
    onStep: onStep,
    onTrack: onTrack,
    onSubmit: onSubmit
  }))), inactive.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-micro)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-section)',
      color: 'var(--text-faint)',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottom: 'var(--border-line)'
    }
  }, "Available platforms"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, inactive.map(id => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => onActivate(id),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 14px',
      borderRadius: 'var(--r-lg)',
      border: 'var(--border-line)',
      background: 'var(--panel)',
      color: 'var(--text-dim)',
      fontFamily: 'inherit',
      fontSize: 'var(--fs-body)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(PlatformIcon, {
    platform: id,
    size: 18,
    base: "../../assets"
  }), PLATFORMS[id].label, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-faint)'
    }
  }, "+"))))));
}
Object.assign(window, {
  Dashboard,
  PlatformCard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Onboarding.jsx
try { (() => {
const {
  ModalScrim,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  StepDots,
  FormLabel,
  Input,
  Dropzone,
  ChipButton,
  TipBox,
  PlatformIcon,
  PLATFORMS
} = window.ShipmateDesignSystem_f314df;
const TABS = ['About', 'Distribution', 'Assets', 'Compliance'];
function Tabs({
  index,
  onPick,
  progress
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      borderBottom: 'var(--border-line)',
      flexShrink: 0
    }
  }, TABS.map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => onPick(i),
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 7,
      padding: '16px 8px 13px',
      fontSize: 'var(--fs-micro)',
      fontWeight: 600,
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: i === index ? 'var(--text)' : 'var(--text-faint)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'inherit',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: '../../assets/icons/icon-' + ['about', 'distribution', 'assets', 'compliance'][i] + '.png',
    alt: "",
    width: "18",
    height: "18",
    style: {
      opacity: i === index ? 1 : 0.35,
      transition: 'opacity var(--dur-base)'
    }
  }), t, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      background: i === index ? 'var(--blue-soft)' : 'rgba(255,255,255,0.05)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: 2,
      width: (i < index ? 100 : i === index ? progress : 0) + '%',
      background: 'var(--blue)',
      transition: 'width 0.5s var(--ease-overshoot)'
    }
  }))));
}
function Onboarding({
  onDone,
  onClose
}) {
  const [tab, setTab] = React.useState(0);
  const [preset, setPreset] = React.useState('Everywhere');
  const [picked, setPicked] = React.useState(['ios', 'android', 'steam']);
  const toggle = id => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  return /*#__PURE__*/React.createElement(ModalScrim, {
    style: {
      paddingTop: 80,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Modal, {
    style: {
      height: 'min(760px, calc(100vh - 104px))'
    }
  }, /*#__PURE__*/React.createElement(ModalHeader, {
    eyebrow: "Shipmate",
    title: "Let's get your game ready",
    subtitle: "We'll collect the essentials once \u2014 then you focus on each platform."
  }), /*#__PURE__*/React.createElement(Tabs, {
    index: tab,
    onPick: setTab,
    progress: 60
  }), /*#__PURE__*/React.createElement(ModalBody, {
    style: {
      overflowX: 'hidden'
    }
  }, tab === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(TipBox, {
    title: "Shipmate tip"
  }, "We found Go Ape Ship! on IGDB and pre-filled six fields. Review anything marked \u2726 before you submit."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FormLabel, {
    required: true
  }, "Game Title"), /*#__PURE__*/React.createElement(Input, {
    defaultValue: "Go Ape Ship!"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FormLabel, {
    required: true
  }, "Description"), /*#__PURE__*/React.createElement(Input, {
    as: "textarea",
    defaultValue: "A four-player couch brawler about primates, physics and very bad decisions.",
    style: {
      minHeight: 88
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-micro)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-section)',
      color: 'var(--text-faint)',
      marginBottom: 12
    }
  }, "Target Platforms"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, Object.keys(PLATFORMS).map(id => /*#__PURE__*/React.createElement(ChipButton, {
    key: id,
    selected: picked.includes(id),
    onClick: () => toggle(id)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(PlatformIcon, {
    platform: id,
    size: 14,
    base: "../../assets"
  }), PLATFORMS[id].label)))))), tab === 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-micro)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-section)',
      color: 'var(--text-faint)',
      marginBottom: 12
    }
  }, "Distribution"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-small)',
      color: 'var(--text-dim)',
      marginBottom: 10
    }
  }, "Where do you intend to make the game available?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, ['Everywhere', 'English only', 'Minimize regulation', 'Custom'].map(p => /*#__PURE__*/React.createElement(ChipButton, {
    key: p,
    selected: preset === p,
    onClick: () => setPreset(p)
  }, p)))), /*#__PURE__*/React.createElement(TipBox, {
    icon: "!",
    title: "Heads up"
  }, "Shipping to Brazil and South Korea adds two local rating boards on top of IARC."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FormLabel, null, "Primary language"), /*#__PURE__*/React.createElement(Input, {
    as: "select",
    defaultValue: "en"
  }, /*#__PURE__*/React.createElement("option", {
    value: "en"
  }, "English"), /*#__PURE__*/React.createElement("option", null, "\u7B80\u4F53\u4E2D\u6587")))), tab === 2 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FormLabel, {
    required: true
  }, "Screenshots"), /*#__PURE__*/React.createElement(Dropzone, {
    label: "Drop screenshots",
    hint: "PNG or JPG \xB7 at least 3 per device size",
    required: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FormLabel, {
    hint: "Optional"
  }, "Trailer"), /*#__PURE__*/React.createElement(Input, {
    placeholder: "https://youtube.com/watch?v=\u2026"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FormLabel, {
    required: true
  }, "App icon"), /*#__PURE__*/React.createElement(Dropzone, {
    compact: true,
    label: "Drop a 1024\xD71024 icon",
    hint: "No alpha channel, no rounded corners"
  }))), tab === 3 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FormLabel, {
    required: true
  }, "Privacy Policy URL"), /*#__PURE__*/React.createElement(Input, {
    defaultValue: "https://goapeship.com/privacy"
  })), /*#__PURE__*/React.createElement(TipBox, {
    title: "Shipmate tip"
  }, "Every storefront you picked requires a reachable privacy policy. We check the URL resolves before you submit."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(FormLabel, null, "Publisher entity"), /*#__PURE__*/React.createElement(Input, {
    as: "select",
    defaultValue: "1"
  }, /*#__PURE__*/React.createElement("option", {
    value: "1"
  }, "Simian Softworks Ltd."))))), /*#__PURE__*/React.createElement(ModalFooter, null, /*#__PURE__*/React.createElement(StepDots, {
    count: 4,
    active: tab
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, tab > 0 && /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: () => setTab(tab - 1)
  }, "\u2190 Back"), tab < 3 ? /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => setTab(tab + 1)
  }, "Next \u2192") : /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: onDone
  }, "Launch Dashboard \u2192")))));
}
Object.assign(window, {
  Onboarding
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Onboarding.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/ProjectBar.jsx
try { (() => {
const {
  IconButton
} = window.ShipmateDesignSystem_f314df;
function Selector({
  title,
  bold,
  width,
  onClick
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      background: h ? 'var(--panel-2)' : 'var(--well)',
      border: '1px solid ' + (h ? 'var(--border)' : 'transparent'),
      borderRadius: 'var(--r-lg)',
      height: 40,
      padding: '0 16px',
      minWidth: width,
      cursor: 'pointer',
      transition: 'border-color var(--dur-base), background var(--dur-base)',
      fontFamily: 'inherit',
      color: 'var(--text)',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontWeight: bold ? 700 : 400,
      fontSize: 'var(--fs-base)'
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-dim)',
      fontSize: 'var(--fs-base)'
    }
  }, "\u2304"));
}
function ProjectBar({
  project,
  version,
  onEdit
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 10px',
      margin: '0 24px 16px',
      gap: 8,
      background: 'var(--panel)',
      border: 'var(--border-line)',
      borderRadius: 'var(--r-2xl)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Selector, {
    title: project,
    bold: true,
    width: 200
  }), /*#__PURE__*/React.createElement(IconButton, {
    label: "Edit game details",
    onClick: onEdit
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    width: "16",
    height: "16"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 20h9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Selector, {
    title: version,
    width: 180
  }), /*#__PURE__*/React.createElement(IconButton, {
    label: "Version options"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    width: "16",
    height: "16"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "5",
    cy: "12",
    r: "1.6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1.6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "12",
    r: "1.6"
  })))));
}
Object.assign(window, {
  ProjectBar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/ProjectBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/StepModal.jsx
try { (() => {
const {
  ModalScrim,
  Modal,
  ModalBody,
  ModalFooter,
  Button,
  YesNoButton,
  TipBox,
  AlertBox,
  Shimmer,
  Spinner,
  PlatformIcon,
  PLATFORMS
} = window.ShipmateDesignSystem_f314df;
function StepModal({
  platform,
  step,
  questions,
  onClose,
  onComplete
}) {
  const [loading, setLoading] = React.useState(true);
  const [answers, setAnswers] = React.useState({});
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);
  const seeded = React.useMemo(() => Object.fromEntries(questions.map((q, i) => [i, q.a])), [questions]);
  const all = {
    ...seeded,
    ...answers
  };
  const answered = questions.every((_, i) => all[i]);
  const risky = all[2] === 'YES';
  return /*#__PURE__*/React.createElement(ModalScrim, {
    style: {
      paddingTop: 80,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Modal, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '16px 20px',
      borderBottom: 'var(--border-line)'
    }
  }, /*#__PURE__*/React.createElement(PlatformIcon, {
    platform: platform,
    size: 18,
    base: "../../assets"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-body)',
      fontWeight: 600
    }
  }, PLATFORMS[platform].label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-small)',
      color: 'var(--text-faint)'
    }
  }, "/"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-body)',
      fontWeight: 600,
      flex: 1
    }
  }, step), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      width: 28,
      height: 28,
      borderRadius: 'var(--r-md)',
      border: 'none',
      background: 'transparent',
      color: 'var(--text-faint)',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: 16
    }
  }, "\xD7")), /*#__PURE__*/React.createElement(ModalBody, {
    style: {
      maxHeight: 'min(420px, calc(100vh - 240px))',
      overflowX: 'hidden'
    }
  }, loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 'var(--fs-small)',
      color: 'var(--text-dim)',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement(Spinner, null), " Reading your build and description\u2026"), /*#__PURE__*/React.createElement(Shimmer, {
    short: true
  }), /*#__PURE__*/React.createElement(Shimmer, null), /*#__PURE__*/React.createElement(Shimmer, null), /*#__PURE__*/React.createElement(Shimmer, {
    short: true
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(TipBox, {
    title: "Shipmate tip"
  }, "We answered two of these from your description. Anything marked \u2726 is our inference \u2014 you own the final answer."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-micro)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-header)',
      color: 'var(--text-faint)',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 3,
      height: 12,
      borderRadius: 2,
      background: 'var(--orange)'
    }
  }), "Content descriptors"), questions.map((q, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 20,
      padding: '10px 0',
      borderBottom: i < questions.length - 1 ? 'var(--border-line)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-small)',
      color: 'var(--text)',
      lineHeight: 'var(--lh-normal)',
      flex: 1
    }
  }, q.q), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 6,
      flexShrink: 0
    }
  }, ['YES', 'NO'].map(v => /*#__PURE__*/React.createElement(YesNoButton, {
    key: v,
    selected: all[i] === v,
    inferred: q.inferred && all[i] === v && answers[i] === undefined,
    onClick: () => setAnswers(a => ({
      ...a,
      [i]: v
    }))
  }, v))))), risky && /*#__PURE__*/React.createElement(AlertBox, {
    title: "Rejection risk"
  }, "Loot boxes require a paid-random-item disclosure on every storefront you selected, and are restricted in Belgium and the Netherlands."))), /*#__PURE__*/React.createElement(ModalFooter, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-tiny)',
      color: 'var(--text-faint)'
    }
  }, answered ? 'All questions answered' : 'Answer every question to complete this step'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    disabled: !answered,
    onClick: onComplete
  }, "Save & close")))));
}
Object.assign(window, {
  StepModal
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/StepModal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Topbar.jsx
try { (() => {
const {
  Wordmark,
  IconButton,
  Menu,
  MenuItem
} = window.ShipmateDesignSystem_f314df;
function Globe() {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    width: "16",
    height: "16"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "2",
    y1: "12",
    x2: "22",
    y2: "12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
  }));
}
function Topbar({
  signedIn,
  onSignIn
}) {
  const [menu, setMenu] = React.useState(null);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--pad-app-gutter)',
      gap: 20,
      flexShrink: 0,
      position: 'relative',
      zIndex: 200,
      background: 'var(--bg)',
      borderBottom: 'var(--border-line)'
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    height: 40,
    base: "../../assets"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, !signedIn && /*#__PURE__*/React.createElement("button", {
    onClick: onSignIn,
    style: {
      background: 'none',
      border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: 'var(--r-lg)',
      padding: '6px 16px',
      color: 'rgba(255,255,255,0.7)',
      fontSize: 'var(--fs-body)',
      fontWeight: 600,
      letterSpacing: '0.04em',
      fontFamily: 'inherit',
      cursor: 'pointer'
    }
  }, "Sign In"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Change language",
    active: menu === 'lang',
    onClick: () => setMenu(menu === 'lang' ? null : 'lang')
  }, /*#__PURE__*/React.createElement(Globe, null)), menu === 'lang' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      zIndex: 60
    }
  }, /*#__PURE__*/React.createElement(Menu, {
    width: 190
  }, /*#__PURE__*/React.createElement(MenuItem, {
    active: true
  }, "English"), /*#__PURE__*/React.createElement(MenuItem, null, "\u7B80\u4F53\u4E2D\u6587")))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMenu(menu === 'profile' ? null : 'profile'),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      color: 'var(--text)',
      background: 'none',
      border: 'none',
      padding: 0,
      fontFamily: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: 'var(--green)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-body)',
      fontWeight: 500,
      color: 'var(--text-dim)'
    }
  }, "Developer")), menu === 'profile' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      zIndex: 60
    }
  }, /*#__PURE__*/React.createElement(Menu, null, /*#__PURE__*/React.createElement(MenuItem, null, "Profile settings"), /*#__PURE__*/React.createElement(MenuItem, {
    danger: true
  }, "Sign out"))))));
}
Object.assign(window, {
  Topbar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Topbar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/data.js
try { (() => {
window.SHIPMATE_DATA = {
  project: 'Go Ape Ship!',
  version: 'v1.4',
  platforms: {
    ios: {
      steps: ['Content Rating', 'Data Privacy', 'Business', 'Product Page Preview', 'Age Ratings', 'Review Submission'],
      tracks: ['TestFlight — Internal', 'TestFlight — External', 'App Store'],
      live: 'v1.3'
    },
    android: {
      steps: ['Content Rating', 'Data Safety', 'Store Listing Preview', 'Store Tags', 'Review Store Listing'],
      tracks: ['Internal testing', 'Closed testing', 'Open testing', 'Production'],
      live: 'v1.3'
    },
    steam: {
      steps: ['Store Page Preview', 'Store Tags', 'Technical', 'Age Ratings', 'Review Submission'],
      tracks: ['Beta branch', 'Default branch'],
      live: null
    },
    psn: {
      steps: ['Certification Requirements', 'Confirm Media & Key Art', 'Ratings (IARC)', 'Release Settings'],
      tracks: ['Production'],
      live: null
    },
    xbox: {
      steps: ['Certification Requirements', 'Confirm Media', 'Age Ratings (IARC)', 'Release Settings'],
      tracks: ['Production'],
      live: null
    },
    nintendo: {
      steps: ['Certification Requirements', 'Confirm Media & Key Art', 'Ratings (IARC)', 'Release Settings'],
      tracks: ['Production'],
      live: null
    }
  },
  questions: [{
    q: 'Does your game contain depictions of violence against human-like characters?',
    a: 'NO',
    inferred: true
  }, {
    q: 'Can players communicate with each other in-game (text, voice or emotes)?',
    a: 'YES',
    inferred: true
  }, {
    q: 'Does your game include simulated gambling or loot boxes?',
    a: null,
    inferred: false
  }, {
    q: 'Does your game display user-generated content to other players?',
    a: null,
    inferred: false
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Splash.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  CtaButton,
  Wordmark
} = window.ShipmateDesignSystem_f314df;
const CARDS = [{
  title: 'Upload\nEssentials',
  icon: 'mk-upload-essentials.svg',
  body: 'Add your binary, description and screenshots a single time — no per-store re-entry.'
}, {
  title: 'Unleash\nShipmate',
  icon: 'mk-answer-once.svg',
  body: 'Shipmate fills routine fields and builds a clear checklist for each store you target.'
}, {
  title: 'Ship with\nConfidence',
  icon: 'mk-ship-everywhere.svg',
  body: 'Compliance is pre-checked in real time, so you catch issues before the platform does.'
}];
const TENTACLES = [{
  part: 'left',
  left: 115.8,
  top: 153.7,
  w: 85,
  h: 66,
  dur: '6.1s',
  delay: '-1.8s',
  origin: '50% 15%'
}, {
  part: 'centre',
  left: 194.2,
  top: 145.9,
  w: 85,
  h: 114,
  dur: '5.2s',
  delay: '0s',
  origin: '75% 8%'
}, {
  part: 'right',
  left: 405.8,
  top: 150.4,
  w: 73,
  h: 74,
  dur: '6.6s',
  delay: '-3.1s',
  origin: '35% 8%'
}, {
  part: 'rightmost',
  left: 493.8,
  top: 233.5,
  w: 70,
  h: 85,
  dur: '5.8s',
  delay: '-4.2s',
  origin: '40% 8%'
}];
function Octo() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -180,
      right: 30,
      width: 500,
      height: 320,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 266.5,
      top: 49.1,
      width: 151,
      height: 176,
      zIndex: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      animation: 'octo-float 4.2s ease-in-out infinite'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/brand/shippy-body.png",
    alt: "Shippy",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%'
    }
  }))), TENTACLES.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.part,
    style: {
      position: 'absolute',
      left: t.left,
      top: t.top,
      width: t.w,
      height: t.h,
      zIndex: 2,
      transformOrigin: t.origin,
      animation: `octo-sway ${t.dur} ease-in-out ${t.delay} infinite`
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: '../../assets/brand/shippy-tentacle-' + t.part + '.png',
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%'
    }
  }))));
}
function Card({
  title,
  body,
  icon,
  green
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      boxSizing: 'border-box',
      width: 450,
      height: 300,
      background: '#000',
      borderRadius: 22,
      padding: '40px 34px',
      overflow: 'hidden',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      background: 'rgba(255,255,255,0.1)',
      opacity: h ? 1 : 0,
      pointerEvents: 'none',
      transition: h ? 'opacity .3s ease' : 'opacity .12s ease-out'
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: '../../assets/icons/' + icon,
    alt: "",
    style: {
      position: 'absolute',
      top: 39.5,
      right: 34,
      width: 86,
      height: 86,
      color: green ? 'var(--green-brand)' : '#fff'
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display-mono)',
      fontWeight: 500,
      fontSize: 32,
      letterSpacing: '0.02em',
      lineHeight: '42.5px',
      height: 85,
      textTransform: 'uppercase',
      whiteSpace: 'pre-line',
      margin: 0
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 22.5,
      fontSize: 25,
      fontWeight: 300,
      lineHeight: 1.6,
      color: 'rgba(255,255,255,0.5)'
    }
  }, body));
}
function Splash({
  onStart
}) {
  return /*#__PURE__*/React.createElement("main", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      position: 'relative',
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("section", {
    style: {
      textAlign: 'center',
      marginTop: 40,
      padding: '0 24px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 118,
      fontWeight: 500,
      lineHeight: '132.75px',
      letterSpacing: '-0.02em',
      margin: 0
    }
  }, "Everything you", /*#__PURE__*/React.createElement("br", null), "need to ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--green-brand)'
    }
  }, "ship.")), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 35.25,
      fontSize: 48.2,
      lineHeight: '62.4px',
      color: 'rgba(255,255,255,0.5)',
      fontWeight: 300
    }
  }, "Get your game on every storefront,", /*#__PURE__*/React.createElement("br", null), "in three simple steps.")), /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      width: 'fit-content',
      margin: '100.6px auto 0'
    }
  }, /*#__PURE__*/React.createElement(Octo, null), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      overflow: 'hidden',
      boxSizing: 'border-box',
      background: '#343434',
      border: '2px solid rgba(255,255,255,0.25)',
      borderRadius: 48,
      padding: 30,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 450px)',
      gap: 25
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      pointerEvents: 'none',
      background: 'radial-gradient(340px 280px at 88% -4%, rgba(114,123,240,0.65), rgba(114,123,240,0.35) 55%, transparent 74%)'
    }
  }), CARDS.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.title,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Card, _extends({}, c, {
    green: i === 2
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: 100
    }
  }, /*#__PURE__*/React.createElement(CtaButton, {
    onClick: onStart
  }, "GET STARTED")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 26,
      marginTop: 44
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      color: 'rgba(255,255,255,0.45)'
    }
  }, "Available for"), ['mk-appstore', 'mk-googleplay', 'mk-steam'].map(n => /*#__PURE__*/React.createElement("img", {
    key: n,
    src: '../../assets/icons/' + n + '.svg',
    alt: "",
    style: {
      height: 32,
      width: 'auto',
      opacity: 0.95
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      color: 'rgba(255,255,255,0.45)'
    }
  }, "More soon.")), /*#__PURE__*/React.createElement("footer", {
    style: {
      margin: 'auto 0 40px',
      paddingTop: 60,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: 500,
      color: '#eef0f1'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/icons/mk-heart.svg",
    alt: "",
    style: {
      height: 20,
      verticalAlign: -4,
      marginRight: 8
    }
  }), "Built by indie devs and game industry veterans to empower the indie game community."));
}
Object.assign(window, {
  Splash
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Splash.jsx", error: String((e && e.message) || e) }); }

__ds_ns.PLATFORMS = __ds_scope.PLATFORMS;

__ds_ns.PlatformIcon = __ds_scope.PlatformIcon;

__ds_ns.Shippy = __ds_scope.Shippy;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.ChipButton = __ds_scope.ChipButton;

__ds_ns.CtaButton = __ds_scope.CtaButton;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.StatusPill = __ds_scope.StatusPill;

__ds_ns.Toggle = __ds_scope.Toggle;

__ds_ns.YesNoButton = __ds_scope.YesNoButton;

__ds_ns.AlertBox = __ds_scope.AlertBox;

__ds_ns.Shimmer = __ds_scope.Shimmer;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.TipBox = __ds_scope.TipBox;

__ds_ns.Dropzone = __ds_scope.Dropzone;

__ds_ns.FormLabel = __ds_scope.FormLabel;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.TooltipIcon = __ds_scope.TooltipIcon;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.StepDots = __ds_scope.StepDots;

__ds_ns.StepRow = __ds_scope.StepRow;

__ds_ns.TaskRow = __ds_scope.TaskRow;

__ds_ns.ActionCard = __ds_scope.ActionCard;

__ds_ns.ActionCardSection = __ds_scope.ActionCardSection;

__ds_ns.SuggestionCompare = __ds_scope.SuggestionCompare;

__ds_ns.CodeBlock = __ds_scope.CodeBlock;

__ds_ns.InsightPanel = __ds_scope.InsightPanel;

__ds_ns.InsightSection = __ds_scope.InsightSection;

__ds_ns.FixItButton = __ds_scope.FixItButton;

__ds_ns.NoticeBanner = __ds_scope.NoticeBanner;

__ds_ns.PartnerCard = __ds_scope.PartnerCard;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardHeader = __ds_scope.CardHeader;

__ds_ns.CardSection = __ds_scope.CardSection;

__ds_ns.Menu = __ds_scope.Menu;

__ds_ns.MenuItem = __ds_scope.MenuItem;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.ModalScrim = __ds_scope.ModalScrim;

__ds_ns.ModalHeader = __ds_scope.ModalHeader;

__ds_ns.ModalBody = __ds_scope.ModalBody;

__ds_ns.ModalFooter = __ds_scope.ModalFooter;

})();
