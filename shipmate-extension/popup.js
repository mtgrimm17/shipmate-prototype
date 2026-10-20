const out = document.getElementById('out');
const statusEl = document.getElementById('status');
function show(x) { out.textContent = (typeof x === 'string') ? x : JSON.stringify(x, null, 2); }

function renderStatus() {
  chrome.storage.local.get(['shipmateExport'], function (st) {
    const d = st.shipmateExport;
    if (d && d.ok !== false) {
      statusEl.textContent = 'From Shipmate: ' + (d.appName || '(no app name)')
        + (d.privacy && d.privacy.collectsData ? ' · App Privacy: collects ' + d.privacy.collectsData : '');
    } else {
      statusEl.textContent = 'No Shipmate data yet — open Shipmate in a tab and click "Refresh from Shipmate".';
    }
  });
}
renderStatus();

async function activeTab() {
  const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
  return t;
}
async function toContent(type) {
  const t = await activeTab();
  try { return await chrome.tabs.sendMessage(t.id, { type }); }
  catch (e) { return { ok: false, error: 'This action needs the matching page open in this tab. (' + e + ')' }; }
}

document.getElementById('refresh').onclick = async () => {
  const r = await toContent('refreshShipmate');
  if (r && r.ok) { setTimeout(() => { renderStatus(); chrome.storage.local.get('shipmateExport', s => show(s.shipmateExport)); }, 300); }
  else show(r && r.error || 'Open Shipmate in this tab, then click Refresh.');
};
document.getElementById('inspect').onclick = async () => show(await toContent('inspect'));
document.getElementById('privacy').onclick = async () => {
  show('Filling App Privacy — this walks every screen, give it a few seconds…');
  show(await toContent('autoPrivacy'));
};
document.getElementById('createApp').onclick = async () => {
  show('Opening the New App dialog and filling it…');
  show(await toContent('createApp'));
};
