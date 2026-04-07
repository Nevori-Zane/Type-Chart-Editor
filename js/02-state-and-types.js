function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const d = JSON.parse(s);
      changes = d.changes || [];
      if (d.customTypes && Array.isArray(d.customTypes)) {
        d.customTypes.forEach(ct => {
          if (!TYPES.includes(ct.name)) {
            TYPES.push(ct.name);
            TYPE_COLORS[ct.name] = ct.color || '#888';
            TYPE_TEXT[ct.name] = getContrastText(ct.color || '#888');
          }
        });
      }
      if (d.activeTypes && Array.isArray(d.activeTypes) && d.activeTypes.length > 0) {
        TYPES.length = 0;
        d.activeTypes.forEach(t => TYPES.push(t));
      } else if (d.chart && typeof d.chart === 'object') {
        const chartKeys = Object.keys(d.chart);
        if (chartKeys.length > 0 && chartKeys.length !== TYPES.length) {
          TYPES.length = 0;
          chartKeys.forEach(t => TYPES.push(t));
        }
      }
      if (d.chart && typeof d.chart === 'object') {
        chart = deepCopy(d.chart);
      } else {
        chart = deepCopy(DEFAULT_CHART);
        changes.forEach(c => { chart[c.atk][c.def] = c.to; });
      }
      // Restore custom icons and gradients
      try {
        const icons = localStorage.getItem(STORAGE_KEY + '_icons');
        if (icons) TYPE_ICON_IMGS = JSON.parse(icons);
        const grads = localStorage.getItem(STORAGE_KEY + '_gradients');
        if (grads) TYPE_GRADIENTS = JSON.parse(grads);
      } catch(e) {}
      // Restore original type color overrides
      if (d.origColors && typeof d.origColors === 'object') {
        Object.entries(d.origColors).forEach(([t, c]) => {
          if (ORIGINAL_18.includes(t)) { TYPE_COLORS[t] = c; TYPE_TEXT[t] = getContrastText(c); }
        });
      }
      // Restore baseline
      if (d.baselineChart && typeof d.baselineChart === 'object') {
        baselineChart = d.baselineChart;
      } else {
        // Reconstruct: revert changes from the loaded chart
        const base = deepCopy(chart);
        (d.changes || []).forEach(c => { if (base[c.atk]) base[c.atk][c.def] = c.from ?? 1; });
        baselineChart = base;
      }
      return true;
    }
  } catch(e) {}
  return false;
}
if (!loadState()) { chart = deepCopy(DEFAULT_CHART); changes = []; }
if (!baselineChart) baselineChart = DEFAULT_CHART;

let _autoSaveTimer = null;
function autoSave() { clearTimeout(_autoSaveTimer); _autoSaveTimer = setTimeout(_doAutoSave, 400); }
function _doAutoSave() {
  try {
    const origColors = {};
    ORIGINAL_18.forEach(t => { if (TYPE_COLORS[t] && TYPE_COLORS[t] !== ORIG_DEFAULT_COLORS[t]) origColors[t] = TYPE_COLORS[t]; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ changes, chart:buildMatrix(), customTypes:customTypeMeta(), origColors, activeTypes:[...TYPES], baselineChart }));
    try { localStorage.setItem(STORAGE_KEY + '_icons', JSON.stringify(TYPE_ICON_IMGS)); } catch(e) {}
    try { localStorage.setItem(STORAGE_KEY + '_gradients', JSON.stringify(TYPE_GRADIENTS)); } catch(e) {}
    const el = document.getElementById("autosave-status");
    if (el) el.textContent = "auto-saved " + new Date().toLocaleTimeString();
  } catch(e) {}
}

function isChanged(atk, def) { return changes.some(c => c.atk===atk && c.def===def); }
function getContrastText(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*0.299 + g*0.587 + b*0.114) > 140 ? '#111' : '#fff';
}

let _pendingTypeIcon = null; // data URL for the icon being added
let _pendingIconColor = '#ffffff';
let _pendingTypeIconName = null;

// Preset icon library — simple SVG paths designed for 64×64 circle badges
// Lucide icon names to fetch from CDN (MIT licensed)
// Embedded preset icons — Lucide icons (MIT), paths only, 24×24 viewBox
const PRESET_ICON_DATA = {
  'moon':          '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  'sun':           '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>',
  'star':          '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  'zap':           '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  'flame':         '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  'droplets':      '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
  'snowflake':     '<line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>',
  'leaf':          '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  'wind':          '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',
  'eye':           '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  'skull':         '<path d="m12.5 17-.5-1-.5 1h1z"/><path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="12" r="1"/>',
  'shield':        '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  'sword':         '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>',
  'crown':         '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',
  'gem':           '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  'atom':          '<circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/>',
  'dna':           '<path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m17 6-2.5-2.5"/><path d="m14 8-1-1"/><path d="m7 18 2.5 2.5"/><path d="m3.5 14.5.5.5"/><path d="m20 9 .5.5"/>',
  'bug':           '<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
  'paw-print':     '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10C7.5 9.2 6.5 8.3 6 7c-.7-2 .3-3.7 1.8-4.3 1.5-.6 3.1 0 4.2 1.3"/><path d="M22 22c-3.2-5.4-5.3-7-6.5-7.5-1.5-.6-3 .2-4 1-1 .8-2.5 1.5-4 1-1.5-.5-3.3-3.5-2.5-6.5"/><path d="M4 20c0-2.2 1.5-4 3.5-4.5"/><circle cx="4" cy="8" r="2"/>',
  'feather':       '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>',
  'anchor':        '<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
  'music':         '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  'radio':         '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
  'clock':         '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  'magnet':        '<path d="M6 15A6 6 0 0 0 18 15"/><path d="M6 15V9a6 6 0 0 1 12 0v6"/><line x1="6" y1="5" x2="6" y2="9"/><line x1="18" y1="5" x2="18" y2="9"/>',
  'target':        '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  'compass':       '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  'rocket':        '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  'heart':         '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  'sparkles':      '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
  'tornado':       '<path d="M21 4H3"/><path d="M18 8H6"/><path d="M19 12H9"/><path d="M16 16h-6"/><path d="M11 20H9"/>',
  'waves':         '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  'mountain':      '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  'radiation':     '<circle cx="12" cy="12" r="3"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5"/><path d="M2 12c0 5.5 4.5 10 10 10"/><path d="M22 12c0-5.5-4.5-10-10-10"/>',
};

let _presetGridPreviewId = null;
let _presetGridClearId = null;

function loadPresetIcons(previewId, clearBtnId) {
  _presetGridPreviewId = previewId;
  _presetGridClearId = clearBtnId;
  const container = document.getElementById('presetIconGrid');
  if (!container) return;
  const col = _pendingIconColor || '#ffffff';
  container.innerHTML = '';
  Object.entries(PRESET_ICON_DATA).forEach(([name, paths]) => {
    const url = lucideSvgToDataUrl(name, paths, col);
    const btn = document.createElement('div');
    btn.className = 'preset-icon-btn';
    btn.title = name.replace(/-/g,' ');
    btn.dataset.name = name;
    btn.style.cssText = 'width:34px;height:34px;border-radius:50%;background:#3a3a5a;cursor:pointer;border:2px solid transparent;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:border-color 0.1s';
    btn.innerHTML = `<img src="${url}" style="width:70%;height:70%;object-fit:contain">`;
    btn.onmouseover = () => btn.style.borderColor = 'var(--accent)';
    btn.onmouseout = () => { if (!btn.classList.contains('selected')) btn.style.borderColor = 'transparent'; };
    btn.onclick = () => applyLucideIcon(name, previewId, clearBtnId, btn);
    container.appendChild(btn);
  });
}

function lucideSvgToDataUrl(name, paths, color) {
  const col = color || _pendingIconColor || '#ffffff';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function applyLucideIcon(name, previewId, clearBtnId, btn) {
  const paths = PRESET_ICON_DATA[name];
  if (!paths) return;
  const col = _pendingIconColor || '#ffffff';
  const url = lucideSvgToDataUrl(name, paths, col);
  _pendingTypeIcon = url;
  _pendingTypeIconName = name;

  document.querySelectorAll('.preset-icon-btn').forEach(b => { b.style.borderColor = 'transparent'; b.classList.remove('selected'); });
  if (btn) { btn.style.borderColor = 'var(--accent)'; btn.classList.add('selected'); }

  const preview = document.getElementById(previewId);
  if (preview) {
    const gradEnabled = document.getElementById('gradToggle')?.checked;
    let bg;
    if (gradEnabled) {
      const from = document.getElementById('newTypeColorFrom')?.value || '#9b59b6';
      const to = document.getElementById('newTypeColorTo')?.value || '#9b59b6';
      const angle = document.getElementById('newTypeGradAngle')?.value || 135;
      bg = `linear-gradient(${angle}deg,${from},${to})`;
    } else {
      bg = document.getElementById('newTypeColor')?.value || document.getElementById('renameTypeColor')?.value || '#9b59b6';
    }
    preview.style.background = bg;
    preview.innerHTML = `<img src="${url}" style="width:70%;height:70%;object-fit:contain;display:block;margin:auto">`;
  }
  const clearBtn = document.getElementById(clearBtnId);
  if (clearBtn) clearBtn.style.display = 'block';
}

function refreshPresetGrid() {
  const col = _pendingIconColor || '#ffffff';
  document.querySelectorAll('.preset-icon-btn').forEach(btn => {
    const name = btn.dataset.name;
    const paths = PRESET_ICON_DATA[name];
    if (!name || !paths) return;
    const url = lucideSvgToDataUrl(name, paths, col);
    const img = btn.querySelector('img');
    if (img) img.src = url;
    if (btn.classList.contains('selected') && _pendingTypeIconName === name) {
      _pendingTypeIcon = url;
    }
  });
}

function setIconColor(color, btn) {
  _pendingIconColor = color;
  if (btn) {
    document.querySelectorAll('[onclick*="setIconColor"]').forEach(b => b.style.border = '1px solid var(--border)');
    btn.style.border = '2px solid var(--accent)';
  }
  const picker = document.getElementById('iconColorPicker');
  if (picker) picker.value = color;
  refreshPresetGrid();
}

function toggleGradUI() {
  const enabled = document.getElementById('gradToggle')?.checked;
  const ui = document.getElementById('gradUI');
  if (ui) ui.style.display = enabled ? 'flex' : 'none';
  if (enabled) updateGradPreview();
}

function updateGradPreview() {
  const from = document.getElementById('newTypeColorFrom')?.value || '#ff6b6b';
  const to = document.getElementById('newTypeColorTo')?.value || '#6b6bff';
  const angle = document.getElementById('newTypeGradAngle')?.value || 135;
  const swatch = document.getElementById('gradSwatch');
  if (swatch) swatch.style.background = `linear-gradient(${angle}deg,${from},${to})`;
  const hexEl = document.getElementById('newTypeColorHex');
  if (hexEl) hexEl.textContent = `${from} → ${to}`;
  const preview = document.getElementById('newTypeIconPreview');
  const gradBg = `linear-gradient(${angle}deg,${from},${to})`;
  if (preview) preview.style.background = gradBg;
}

function applyGradPreset(from, to, angle) {
  const fromEl = document.getElementById('newTypeColorFrom');
  const toEl = document.getElementById('newTypeColorTo');
  const angleEl = document.getElementById('newTypeGradAngle');
  const lbl = document.getElementById('gradAngleLbl');
  if (fromEl) fromEl.value = from;
  if (toEl) toEl.value = to;
  if (angleEl) { angleEl.value = angle; }
  if (lbl) lbl.textContent = angle + '°';
  updateGradPreview();
}

function previewNewTypeIcon(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _pendingTypeIcon = e.target.result;
    const preview = document.getElementById('newTypeIconPreview');
    const color = document.getElementById('newTypeColor')?.value || '#9b59b6';
    if (preview) {
      preview.style.background = color;
      preview.innerHTML = `<img src="${_pendingTypeIcon}" style="width:70%;height:70%;object-fit:contain;display:block;margin:auto">`;
    }
    const clearBtn = document.getElementById('clearIconBtn');
    if (clearBtn) clearBtn.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function clearNewTypeIcon() {
  _pendingTypeIcon = null;
  const preview = document.getElementById('newTypeIconPreview');
  if (preview) { preview.innerHTML = 'none'; }
  const clearBtn = document.getElementById('clearIconBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  const fileInput = document.getElementById('newTypeIconFile');
  if (fileInput) fileInput.value = '';
}

function addType(name, color) {
  name = name.trim();
  if (!name) { showToast('Please enter a type name'); return; }
  if (name.length > 12) { showToast('Name too long (max 12 chars)'); return; }
  const cap = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  if (TYPES.includes(cap)) { showToast(cap + ' already exists'); return; }
  TYPES.push(cap);
  TYPE_COLORS[cap] = color;
  TYPE_TEXT[cap] = getContrastText(color);
  const gradEnabled = document.getElementById('gradToggle')?.checked;
  const fromEl = document.getElementById('newTypeColorFrom');
  const toEl = document.getElementById('newTypeColorTo');
  if (gradEnabled && fromEl && toEl) {
    TYPE_GRADIENTS[cap] = { from: fromEl.value, to: toEl.value, angle: parseInt(document.getElementById('newTypeGradAngle')?.value||135) };
    TYPE_COLORS[cap] = hexMidpoint(fromEl.value, toEl.value);
    TYPE_TEXT[cap] = getContrastText(TYPE_COLORS[cap]);
  } else delete TYPE_GRADIENTS[cap];
  if (_pendingTypeIcon) { TYPE_ICON_IMGS[cap] = _pendingTypeIcon; _pendingTypeIcon = null; }
  chart[cap] = {};
  TYPES.forEach(t => { chart[cap][t] = 1; chart[t][cap] = 1; });
  if (baselineChart) {
    baselineChart[cap] = {};
    TYPES.forEach(t => { baselineChart[cap][t] = 1; if (baselineChart[t]) baselineChart[t][cap] = 1; });
  }
  commit(); buildChips();
  showToast(cap + ' type added!');
  closeTypeModal();
}

function removeType(name) {
  const idx = TYPES.indexOf(name);
  if (idx === -1) return;
  if (ORIGINAL_18.includes(name)) { showToast("Can't remove original types"); return; }
  TYPES.splice(idx, 1);
  [TYPE_COLORS, TYPE_TEXT, TYPE_ICON_IMGS, chart].forEach(o => delete o[name]);
  TYPES.forEach(t => { delete chart[t][name]; });
  changes = changes.filter(c => c.atk !== name && c.def !== name);
  moveSlots = moveSlots.map(s => s === name ? null : s);
  targetDefTypes = targetDefTypes.map(t => t === name ? null : t);
  if (baselineChart) { delete baselineChart[name]; TYPES.forEach(t => { if (baselineChart[t]) delete baselineChart[t][name]; }); }
  if (selectedType === name) selectedType = null;
  commit(); buildChips();
  showToast(name + ' type removed');
}

let typeModalMode = 'add';
function openTypeModal(mode='add', typeName='') {
  typeModalMode = mode;
  const modal = document.getElementById('typeModal');
  const title = document.getElementById('typeModalTitle');
  const body = document.getElementById('typeModalBody');
  if (mode === 'add') {
    title.textContent = '+ Add New Type';
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label class="mlbl" style="margin-bottom:4px">TYPE NAME</label>
          <input id="newTypeName" type="text" maxlength="12" placeholder="e.g. Cosmic"
            style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:13px;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label class="mlbl" style="margin-bottom:6px">TYPE COLOR</label>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <input id="newTypeColor" type="color" value="#9b59b6"
              style="width:44px;height:36px;border:1px solid var(--border);border-radius:6px;cursor:pointer;background:none;padding:2px"/>
            <span id="newTypeColorHex" style="font-size:12px;color:var(--dim);font-family:monospace">#9b59b6</span>
            <label style="display:flex;align-items:center;gap:5px;margin-left:auto;font-size:11px;cursor:pointer;color:var(--dim)">
              <input type="checkbox" id="gradToggle" data-change="toggle-grad-ui" style="accent-color:var(--accent)"> Gradient
            </label>
          </div>
          <div id="gradUI" style="display:none;flex-direction:column;gap:6px;padding:8px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:6px">
            <div class="row8">
              <span style="font-size:10px;color:var(--dim);width:32px">From</span>
              <input type="color" id="newTypeColorFrom" value="#ff6b6b" data-input="update-grad-preview"
                style="width:36px;height:28px;border:1px solid var(--border);border-radius:4px;cursor:pointer;padding:1px"/>
              <span style="font-size:10px;color:var(--dim);width:14px">To</span>
              <input type="color" id="newTypeColorTo" value="#6b6bff" data-input="update-grad-preview"
                style="width:36px;height:28px;border:1px solid var(--border);border-radius:4px;cursor:pointer;padding:1px"/>
              <div id="gradSwatch" style="flex:1;height:28px;border-radius:4px;background:linear-gradient(135deg,#ff6b6b,#6b6bff)"></div>
            </div>
            <div class="row8">
              <span style="font-size:10px;color:var(--dim);width:32px">Angle</span>
              <input type="range" id="newTypeGradAngle" min="0" max="360" value="135" step="15" data-input="update-grad-angle"
                style="flex:1;accent-color:var(--accent)"/>
              <span id="gradAngleLbl" style="font-size:10px;color:var(--dim);width:30px">135°</span>
            </div>
            <div style="display:flex;gap:5px;flex-wrap:wrap">
              ${[['🌈 Rainbow','#ff0000','#8b00ff',45],['🌅 Sunset','#ff6b6b','#ffd93d',120],['🌊 Ocean','#00c6ff','#0072ff',135],['🌿 Forest','#56ab2f','#a8e063',160],['🔥 Fire','#f7971e','#f72311',90],['💜 Dusk','#b621fe','#1fd1f9',135],['🌸 Cherry','#fd79a8','#f0d9e2',45],['🌙 Night','#2c3e50','#4a00e0',135]].map(([n,f,t,a])=>
                `<button type="button" data-action="apply-grad-preset" data-from="${f}" data-to="${t}" data-angle="${a}" style="font-size:9px;padding:3px 7px;background:linear-gradient(${a}deg,${f},${t});border:none;color:white;border-radius:4px;cursor:pointer;text-shadow:0 1px 2px rgba(0,0,0,0.5)">${n}</button>`
              ).join('')}
            </div>
          </div>
        </div>
        <div>
          <label class="mlbl" style="margin-bottom:6px">ICON <span style="font-weight:400;color:var(--dim)">(optional — PNG, JPG or SVG · recommended 64×64px square)</span></label>
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
            <div id="newTypeIconPreview" style="width:44px;height:44px;border-radius:50%;background:#9b59b6;display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(255,255,255,0.5);flex-shrink:0;overflow:hidden;border:1px solid var(--border)">none</div>
            <div style="display:flex;flex-direction:column;gap:5px;flex:1">
              <button data-action="trigger-file-click" data-target="newTypeIconFile" style="padding:6px 10px;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:5px;cursor:pointer;font-size:11px;font-family:inherit">📁 Upload Image</button>
              <button id="clearIconBtn" data-action="clear-new-type-icon" style="display:none;padding:4px 10px;background:none;border:1px solid var(--border);color:var(--dim);border-radius:5px;cursor:pointer;font-size:10px;font-family:inherit">✕ Remove Icon</button>
            </div>
            <input type="file" id="newTypeIconFile" accept="image/*,.svg" style="display:none" data-change="preview-new-type-icon">
          </div>
          <div style="font-size:10px;font-weight:700;color:var(--dim);letter-spacing:0.5px;margin-bottom:5px">OR CHOOSE A PRESET</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span class="f10d">Symbol color:</span>
            <button data-action="set-icon-color" data-color="#ffffff" style="width:22px;height:22px;border-radius:50%;background:#ffffff;border:2px solid var(--accent);cursor:pointer" title="White"></button>
            <button data-action="set-icon-color" data-color="#000000" style="width:22px;height:22px;border-radius:50%;background:#000000;border:1px solid var(--border);cursor:pointer" title="Black"></button>
            <input type="color" id="iconColorPicker" value="#ffffff" data-input="set-icon-color"
              style="width:28px;height:22px;border:1px solid var(--border);border-radius:4px;cursor:pointer;padding:1px;background:none" title="Custom color"/>
            <span class="f10d">Custom</span>
          </div>
          <div id="presetIconGrid" style="display:flex;flex-wrap:wrap;gap:5px;max-height:120px;overflow-y:auto;padding:2px">
            <div style="font-size:10px;color:var(--dim);padding:4px">Loading icons...</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:4px">
          <button data-action="close-type-modal" style="flex:1;padding:8px;background:var(--surface2);border:1px solid var(--border);color:var(--dim);border-radius:6px;cursor:pointer;font-size:12px">Cancel</button>
          <button data-action="add-type-from-modal"
            style="flex:2;padding:8px;background:var(--accent);border:none;color:white;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700">Add Type</button>
        </div>
      </div>`;
    setTimeout(() => {
      _pendingTypeIcon = null;
      _pendingIconColor = '#ffffff'; // reset to white default
      const colorInput = document.getElementById('newTypeColor');
      if (colorInput) colorInput.addEventListener('input', e => {
        document.getElementById('newTypeColorHex').textContent = e.target.value;
        const preview = document.getElementById('newTypeIconPreview');
        if (preview) preview.style.background = e.target.value;
        // If gradient is on, uncheck it when user manually picks a solid color
        const gradToggle = document.getElementById('gradToggle');
        if (gradToggle?.checked) { gradToggle.checked = false; toggleGradUI(); }
      });
      document.getElementById('newTypeName').focus();
      loadPresetIcons('newTypeIconPreview', 'clearIconBtn');
    }, 50);
  } else if (mode === 'rename') {
    title.textContent = '✏️ Rename Type';
    body.innerHTML = `
      <p style="font-size:11px;color:var(--dim);margin-bottom:10px">Select a type to rename. Updates the chart, changelog, and all exports.</p>
      <div style="display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto;margin-bottom:10px" id="renameTypeList">
        ${TYPES.map(t => `
          <button data-action="open-rename-editor" data-type-name="${t}" style="display:flex;align-items:center;gap:8px;padding:7px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;cursor:pointer;color:var(--text);font-size:12px;font-weight:700;text-align:left">
            ${typeIcon(t, 14)}
            <span style="color:${TYPE_COLORS[t]}">${t}</span>
            <span style="margin-left:auto;color:var(--dim);font-size:10px">✏️ Edit</span>
          </button>`).join('')}
      </div>
      <button data-action="close-type-modal" style="width:100%;padding:7px;background:var(--surface2);border:1px solid var(--border);color:var(--dim);border-radius:6px;cursor:pointer;font-size:12px">Cancel</button>`;
    modal.style.display = 'flex';
    return;
  } else {
    const custom = TYPES.filter(t => !ORIGINAL_18.includes(t));
    title.textContent = '− Remove Type';
    if (!custom.length) {
      body.innerHTML = `<p style="color:var(--dim);font-size:13px;text-align:center;padding:20px 0">No custom types to remove.</p>
        <button data-action="close-type-modal" style="width:100%;padding:8px;background:var(--surface2);border:1px solid var(--border);color:var(--dim);border-radius:6px;cursor:pointer;font-size:12px">Close</button>`;
    } else {
      body.innerHTML = `
        <p style="font-size:11px;color:var(--dim);margin-bottom:10px">Select a custom type to remove:</p>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto">
          ${custom.map(t => `
            <button data-action="remove-type-by-name" data-type-name="${t}" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;cursor:pointer;color:var(--text);font-size:13px;font-weight:700;text-align:left">
              <span style="width:16px;height:16px;border-radius:50%;background:${TYPE_COLORS[t]};flex-shrink:0"></span>
              ${t}
              <span style="margin-left:auto;color:#f95587;font-size:11px">Remove</span>
            </button>`).join('')}
        </div>
        <button data-action="close-type-modal" style="width:100%;margin-top:10px;padding:8px;background:var(--surface2);border:1px solid var(--border);color:var(--dim);border-radius:6px;cursor:pointer;font-size:12px">Cancel</button>`;
    }
  }
  modal.style.display = 'flex';
}

function openRenameEditor(oldName) {
  const body = document.getElementById('typeModalBody');
  const currentColor = TYPE_COLORS[oldName] || '#888888';
  const hasIcon = !!TYPE_ICON_IMGS[oldName];
  document.getElementById('typeModalTitle').textContent = `✏️ Rename: ${oldName}`;
  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div>
        <label class="mlbl" style="margin-bottom:4px">NEW NAME</label>
        <input id="renameTypeInput" type="text" maxlength="12" value="${oldName}"
          style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:var(--text);font-family:inherit;font-size:13px;outline:none;box-sizing:border-box"/>
      </div>
      <div>
        <label class="mlbl" style="margin-bottom:4px">COLOR</label>
        <div style="display:flex;align-items:center;gap:10px">
          <input id="renameTypeColor" type="color" value="${currentColor}"
            style="width:44px;height:36px;border:1px solid var(--border);border-radius:6px;cursor:pointer;background:none;padding:2px"/>
          <span id="renameTypeColorHex" style="font-size:12px;color:var(--dim);font-family:monospace">${currentColor}</span>
        </div>
      </div>
      <div>
        <label class="mlbl" style="margin-bottom:6px">ICON <span style="font-weight:400;color:var(--dim)">(optional — PNG, JPG or SVG · recommended 64×64px square)</span></label>
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:6px">
          <div id="renameIconPreview" style="width:44px;height:44px;border-radius:50%;background:${currentColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:1px solid var(--border)">
            ${hasIcon ? `<img src="${TYPE_ICON_IMGS[oldName]}" style="width:70%;height:70%;object-fit:contain">` : '<span style="font-size:10px;color:rgba(255,255,255,0.5)">none</span>'}
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;flex:1">
            <button data-action="trigger-file-click" data-target="renameIconFile" style="padding:6px 10px;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:5px;cursor:pointer;font-size:11px;font-family:inherit">📁 Upload Image</button>
            <button id="renameIconClearBtn" data-action="clear-rename-icon" data-type-name="${oldName}" style="${hasIcon?'':'display:none;'}padding:4px 10px;background:none;border:1px solid var(--border);color:var(--dim);border-radius:5px;cursor:pointer;font-size:10px;font-family:inherit">✕ Remove Icon</button>
          </div>
          <input type="file" id="renameIconFile" accept="image/*,.svg" style="display:none" data-change="preview-rename-icon">
        </div>
        <div style="font-size:10px;font-weight:700;color:var(--dim);letter-spacing:0.5px;margin-bottom:5px">OR CHOOSE A PRESET</div>
        <div id="presetIconGrid" style="display:flex;flex-wrap:wrap;gap:5px;max-height:110px;overflow-y:auto;padding:2px">
          <div style="font-size:10px;color:var(--dim);padding:4px">Loading icons...</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button data-action="back-to-rename-list" style="flex:1;padding:8px;background:var(--surface2);border:1px solid var(--border);color:var(--dim);border-radius:6px;cursor:pointer;font-size:12px">← Back</button>
        <button data-action="apply-rename-type" data-old-name="${oldName}"
          style="flex:2;padding:8px;background:var(--accent);border:none;color:white;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700">Apply</button>
      </div>
    </div>`;
  setTimeout(() => {
    const colorInput = document.getElementById('renameTypeColor');
    if (colorInput) colorInput.addEventListener('input', e => {
      document.getElementById('renameTypeColorHex').textContent = e.target.value;
      const preview = document.getElementById('renameIconPreview');
      if (preview) preview.style.background = e.target.value;
    });
    const nameInput = document.getElementById('renameTypeInput');
    if (nameInput) { nameInput.focus(); nameInput.select(); }
    loadPresetIcons('renameIconPreview', 'renameIconClearBtn');
  }, 50);
}

function previewRenameIcon(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _pendingTypeIcon = e.target.result;
    const preview = document.getElementById('renameIconPreview');
    if (preview) preview.innerHTML = `<img src="${_pendingTypeIcon}" style="width:70%;height:70%;object-fit:contain">`;
    const clearBtn = document.getElementById('renameIconClearBtn');
    if (clearBtn) clearBtn.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function clearRenameIcon(typeName) {
  _pendingTypeIcon = 'CLEAR';
  const preview = document.getElementById('renameIconPreview');
  if (preview) preview.innerHTML = '<span style="font-size:10px;color:rgba(255,255,255,0.5)">none</span>';
  const clearBtn = document.getElementById('renameIconClearBtn');
  if (clearBtn) clearBtn.style.display = 'none';
}

function renameType(oldName, newName, newColor) {
  if (!newName) { showToast('Name cannot be empty'); return; }
  if (newName !== oldName && TYPES.includes(newName)) { showToast(`"${newName}" already exists`); return; }

  const idx = TYPES.indexOf(oldName);
  if (idx === -1) { showToast('Type not found'); return; }

  TYPES[idx] = newName;
  TYPE_COLORS[newName] = newColor;
  TYPE_TEXT[newName] = getContrastText(newColor);
  if (newName !== oldName) {
    delete TYPE_COLORS[oldName];
    delete TYPE_TEXT[oldName];
    // Migrate gradient
    if (TYPE_GRADIENTS[oldName]) { TYPE_GRADIENTS[newName] = TYPE_GRADIENTS[oldName]; delete TYPE_GRADIENTS[oldName]; }
  }

  // Handle icon: migrate key, apply pending upload, or clear
  if (_pendingTypeIcon === 'CLEAR') {
    delete TYPE_ICON_IMGS[oldName];
    delete TYPE_ICON_IMGS[newName];
    _pendingTypeIcon = null;
  } else if (_pendingTypeIcon) {
    if (newName !== oldName) delete TYPE_ICON_IMGS[oldName];
    TYPE_ICON_IMGS[newName] = _pendingTypeIcon;
    _pendingTypeIcon = null;
  } else if (newName !== oldName && TYPE_ICON_IMGS[oldName]) {
    TYPE_ICON_IMGS[newName] = TYPE_ICON_IMGS[oldName];
    delete TYPE_ICON_IMGS[oldName];
  }

  const newChart = {};
  TYPES.forEach(atk => {
    const oldAtk = atk === newName ? oldName : atk;
    newChart[atk] = {};
    TYPES.forEach(def => {
      const oldDef = def === newName ? oldName : def;
      newChart[atk][def] = chart[oldAtk]?.[oldDef] ?? 1;
    });
  });
  chart = newChart;

  changes.forEach(c => {
    if (c.atk === oldName) c.atk = newName;
    if (c.def === oldName) c.def = newName;
  });

  teamSlots.forEach(slot => {
    slot.forEach((t, i) => { if (t === oldName) slot[i] = newName; });
  });

  // Update selectedType if it was the renamed type
  if (selectedType === oldName) selectedType = newName;
  targetDefTypes = targetDefTypes.map(t => t === oldName ? newName : t);

  // Migrate baselineChart keys
  if (baselineChart && newName !== oldName) {
    const newBase = {};
    TYPES.forEach(atk => {
      const oldAtk = atk === newName ? oldName : atk;
      newBase[atk] = {};
      TYPES.forEach(def => {
        const oldDef = def === newName ? oldName : def;
        newBase[atk][def] = baselineChart[oldAtk]?.[oldDef] ?? 1;
      });
    });
    baselineChart = newBase;
  }

  closeTypeModal();
  commit(); buildChips();
  showToast(newName !== oldName ? `Renamed "${oldName}" → "${newName}"` : `Updated ${newName}`);
}

function closeTypeModal() { document.getElementById('typeModal').style.display = 'none'; }

const HISTORY_LIMIT = 100;
let undoStack = [], redoStack = [];
const _snap = () => ({ chart: deepCopy(chart), changes: JSON.parse(JSON.stringify(changes)) });
