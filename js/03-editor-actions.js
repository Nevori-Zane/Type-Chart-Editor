function pushHistory() { undoStack.push(_snap()); if (undoStack.length > HISTORY_LIMIT) undoStack.shift(); redoStack = []; }
function _historyOp(from, to, label) {
  if (!from.length) { showToast('Nothing to ' + label); return; }
  to.push(_snap()); const s = from.pop(); chart = s.chart; changes = s.changes;
  commit(); showToast(label.charAt(0).toUpperCase() + label.slice(1));
}
function undo() { _historyOp(undoStack, redoStack, 'undo'); }
function redo() { _historyOp(redoStack, undoStack, 'redo'); }

let focusedAtk = null, focusedDef = null;

function setKbFocus(atk, def) {
  if (focusedAtk !== null) document.querySelector(`.cell[data-atk="${focusedAtk}"][data-def="${focusedDef}"]`)?.classList.remove('kb-focus');
  focusedAtk = atk; focusedDef = def;
  if (atk === null) return;
  const el = document.querySelector(`.cell[data-atk="${atk}"][data-def="${def}"]`);
  if (el) { el.classList.add('kb-focus'); el.scrollIntoView({ block:'nearest', inline:'nearest' }); }
}

document.addEventListener('keydown', e => {
  // Undo / Redo — always active
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return; }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); return; }

  // Skip keyboard nav if focus is inside an input/textarea
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  // Escape — deselect
  if (e.key === 'Escape') {
    closeCellPopup();
    setKbFocus(null, null);
    return;
  }

  // Arrow keys — move focus
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    e.preventDefault();
    const atkIdx = focusedAtk !== null ? TYPES.indexOf(focusedAtk) : -1;
    const defIdx = focusedDef !== null ? TYPES.indexOf(focusedDef) : -1;
    const n = TYPES.length;
    if (n === 0) return;
    let newAtk = atkIdx < 0 ? 0 : atkIdx;
    let newDef = defIdx < 0 ? 0 : defIdx;
    if (e.key === 'ArrowDown')  newAtk = (newAtk + 1) % n;
    if (e.key === 'ArrowUp')    newAtk = (newAtk - 1 + n) % n;
    if (e.key === 'ArrowRight') newDef = (newDef + 1) % n;
    if (e.key === 'ArrowLeft')  newDef = (newDef - 1 + n) % n;
    setKbFocus(TYPES[newAtk], TYPES[newDef]);
    return;
  }

  // Value keys — only if a cell is focused
  if (focusedAtk === null || dualDefMode) return;
  const valMap = { '0': 0, '1': 1, '2': 2, '4': 4, '5': 0.5, '3': 0.25 };
  if (e.key in valMap) {
    e.preventDefault();
    applyCell(focusedAtk, focusedDef, valMap[e.key]);
    return;
  }

  // Enter/Space — open popup on focused cell
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const el = document.querySelector(`.cell[data-atk="${focusedAtk}"][data-def="${focusedDef}"]`);
    if (el) el.click();
  }
});

let _cellPopupAtk = null, _cellPopupDef = null;
let _bulkFillType = null, _bulkFillAxis = null; // 'row' | 'col'

function fillRow(atk, val) { bulkFill('row', atk, val); }
function fillCol(def, val) { bulkFill('col', def, val); }
function bulkFill(axis, type, val) {
  if (!type) return;
  pushHistory();
  TYPES.forEach(t => axis === 'row' ? applyCell(type, t, val, true) : applyCell(t, type, val, true));
  commit(); closeCellPopup(); closeBulkFillPopup();
  showToast(`Filled ${type} ${axis === 'row' ? 'row' : 'col'} → ${val===0.5?'½':val===0.25?'¼':val}×`);
}

function openBulkFillPopup(type, axis, event) {
  event.preventDefault();
  _bulkFillType = type; _bulkFillAxis = axis;
  const popup = document.getElementById('bulkFillPopup');
  document.getElementById('bfpTitle').textContent = (axis==='row'?'→ FILL ROW: ':'↓ FILL COL: ') + type.toUpperCase();
  popup.style.display = 'block';
  popup.style.left = Math.min(event.clientX, window.innerWidth-180) + 'px';
  popup.style.top = Math.min(event.clientY, window.innerHeight-80) + 'px';
}

function commitBulkFill(val) { (_bulkFillAxis === 'row' ? fillRow : fillCol)(_bulkFillType, val); }
function closeBulkFillPopup() {
  const p = document.getElementById('bulkFillPopup'); if (p) p.style.display = 'none';
  _bulkFillType = null; _bulkFillAxis = null;
}

function openCellPopup(atk, def, event) {
  event.stopPropagation(); hideEditorTooltip(); setKbFocus(atk, def);
  _cellPopupAtk = atk; _cellPopupDef = def;
  const cur = chart[atk][def];
  const popup = document.getElementById('cellPopup');
  const map = {4:'cpBtn4', 2:'cpBtn2', 1:'cpBtn1', 0.5:'cpBtnH', 0.25:'cpBtnQ', 0:'cpBtn0'};
  Object.entries(map).forEach(([v, id]) => { const b = document.getElementById(id); if (b) b.style.background = parseFloat(v)===cur?'var(--accent)':''; });
  ['cpFillRow','cpFillCol','cpFillDivider'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display='block'; });
  const pw=200, ph=220;
  let x = event.clientX+6, y = event.clientY+6;
  if (x+pw > window.innerWidth) x = event.clientX-pw-6;
  if (y+ph > window.innerHeight) y = event.clientY-ph-6;
  popup.style.cssText += `;left:${x}px;top:${y}px;display:flex`;
}

function commitCellPopup(val) { if (_cellPopupAtk !== null) applyCell(_cellPopupAtk, _cellPopupDef, val); closeCellPopup(); }
function closeCellPopup() { document.getElementById('cellPopup').style.display = 'none'; _cellPopupAtk = null; _cellPopupDef = null; }

function applyCell(atk, def, nv, silent=false) {
  if (!silent) pushHistory();
  const base = baselineChart || DEFAULT_CHART;
  const record = (a, d, v) => {
    const orig = base[a]?.[d] ?? 1;
    changes = changes.filter(c => !(c.atk===a && c.def===d));
    if (v !== orig) changes.push({ atk:a, def:d, from:orig, to:v });
  };
  chart[atk][def] = nv; record(atk, def, nv);
  if (symMirror && atk !== def) {
    const inv = {0:0, 0.25:4, 0.5:2, 1:1, 2:0.5, 4:0.25}[nv] ?? nv;
    chart[def][atk] = inv; record(def, atk, inv);
  }
  if (!silent) commit();
}

function loadGenPreset(gen) {
  TYPES.filter(t => !ORIGINAL_18.includes(t)).forEach(t => {
    TYPES.splice(TYPES.indexOf(t), 1);
    delete TYPE_COLORS[t]; delete TYPE_TEXT[t];
  });
  const PRESETS = {
    1: [GEN1_TYPES, GEN1_CHART, 'Gen 1 chart (RBY) — 15 types'],
    2: [GEN2_5_TYPES, GEN2_5_CHART, 'Gen 2–5 chart (GSC–BW) — 17 types'],
    6: [ORIGINAL_18, DEFAULT_CHART, 'Gen 6+ chart (XY–present) — 18 types'],
  };
  const [types, src, msg] = PRESETS[gen] || PRESETS[6];
  TYPES.length = 0; types.forEach(t => TYPES.push(t));
  chart = deepCopy(src); baselineChart = src;
  resetState();
  try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
  commit(); buildChips(); showToast('Loaded ' + msg);
}

let _revertPending = false, _revertTimer = null;
let symMirror = false;

function toggleSymMirror() {
  symMirror = !symMirror;
  setBtnActive('symMirrorBtn', symMirror, 'var(--accent)', 'rgba(99,144,240,0.1)');
  try { localStorage.setItem('pokemon_tcs_symmirror', symMirror ? '1' : '0'); } catch(e) {}
  showToast(symMirror ? '⇄ Mirror ON — edits will auto-mirror' : '⇄ Mirror OFF');
}

function revertToBaseline() {
  if (!baselineChart) { showToast('No baseline — use Export Clean first'); return; }
  if (_revertPending) {
    clearTimeout(_revertTimer); _revertPending = false;
    chart = deepCopy(baselineChart); changes = []; selectedType = null;
    commit(); showToast('Reverted to baseline'); return;
  }
  _revertPending = true;
  const toast = document.getElementById('toast');
  toast.textContent = '↺ Click again to confirm revert';
  toast.className = 'toast show err';
  clearTimeout(toast._t);
  _revertTimer = setTimeout(() => { _revertPending = false; toast.className = 'toast'; }, 3000);
}

function clearAll() {
  TYPES.forEach(a => TYPES.forEach(d => { chart[a][d] = 1; }));
  baselineChart = deepCopy(chart); changes = []; selectedType = null;
  commit(); showToast("Cleared — all cells set to 1×");
}

function clickBadge(type, mode, event) {
  event.stopPropagation();
  if (badgeFocusType === type && badgeFocusMode === mode) {
    badgeFocusType = null; badgeFocusMode = null;
  } else {
    badgeFocusType = type; badgeFocusMode = mode;
    selectedType = null; // clear normal type selection
  }
  renderEditor();
  renderSidePanel();
}

function selectType(type) {
  badgeFocusType = null; badgeFocusMode = null; // clear badge focus
  selectedType = selectedType === type ? null : type;
  renderEditor();
  renderSidePanel();
}

function showEditorTooltip(atk, def, event) {
  const tip = document.getElementById('tooltip');
  const val = chart[atk][def];
  const labelMap = { 0:'No Effect', 0.25:'Barely Effective', 0.5:'Not Very Effective', 1:'Neutral', 2:'Super Effective', 4:'Double Super Effective' };
  const $ = id => document.getElementById(id);
  Object.assign($('tip-atk'), {textContent:atk, style:{color:TYPE_COLORS[atk]}});
  Object.assign($('tip-def'), {textContent:def, style:{color:TYPE_COLORS[def]}});
  Object.assign($('tip-eff'), {textContent:val+'×', style:{color:EFF_TEXT[val]==='#555'?'#888':EFF_TEXT[val]}});
  $('tip-label').textContent = labelMap[val] || '';
  const wasEl = $('tip-was');
  if (isChanged(atk, def)) {
    const base = baselineChart || DEFAULT_CHART;
    wasEl.textContent = '(was ' + ((base[atk]?.[def] ?? 1)) + '×)';
    wasEl.style.display = 'block';
  } else { wasEl.style.display = 'none'; }

  tip.style.display = 'flex';

  // Find the row label element for this type to anchor next to it
  const rowLabel = document.querySelector(`.row-label[onclick="selectType('${atk}')"]`);
  const tipW = 180;
  let left, top;

  if (rowLabel) {
    const rect = rowLabel.getBoundingClientRect();
    // Position tip to the LEFT of the row label, vertically centered on it
    left = rect.left - tipW - 8;
    top = rect.top + (rect.height / 2) - 45;
  } else if (event) {
    left = event.clientX - tipW - 12;
    top = event.clientY - 40;
  }

  // Clamp to viewport
  const scroll = document.querySelector('.chart-scroll');
  const scrollRect = scroll.getBoundingClientRect();
  top = Math.max(scrollRect.top, Math.min(top, scrollRect.bottom - 110));

  tip.style.left = Math.max(4, left) + 'px';
  tip.style.top = top + 'px';
  tip.style.width = tipW + 'px';
}
function hideEditorTooltip() { document.getElementById('tooltip').style.display = 'none'; }

let refCardGen = 'current';

