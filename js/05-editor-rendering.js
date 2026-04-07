function buildLegend() {
  const el = document.getElementById("legend");
  const items = [{val:4,label:"4× Double SE"},{val:2,label:"2× Super Effective"},{val:1,label:"1× Neutral"},{val:0.5,label:"½× Not Very Effective"},{val:0.25,label:"¼× Barely Effective"},{val:0,label:"0× Immune"}];
  let html = "";
  items.forEach(({val, label}) => {
    const border = val===1 ? "1px solid #333" : "1px solid transparent";
    html += `<div class="leg-item">
      <div class="leg-swatch" style="background:${EFF_BG[val]};border:${border};color:${EFF_TEXT[val]}">${MULT_LABEL(val) ? MULT_LABEL(val)+'×' : '—'}</div>
      <span class="leg-label">${label}</span>
    </div>`;
  });
  html += `<div class="leg-item" style="margin-left:6px">
    <div class="leg-swatch" style="border:2px solid var(--yellow);background:transparent"></div>
    <span class="leg-label" style="color:var(--yellow)">Modified</span>
  </div>`;
  html += `<div class="leg-item" style="margin-left:auto;gap:3px">
    <span class="leg-label" style="color:var(--dim);font-size:9px">Right-click row/col header or cell to bulk fill</span>
  </div>`;
  el.innerHTML = html;
  requestAnimationFrame(scaleChart);
}

function typePill(t) {
  const fg = typeContrastText(t);
  return `<span class="panel-type-pill" style="background:${typeBg(t)};color:${fg};display:inline-flex;align-items:center;gap:5px" onclick="selectType('${t}')">${typeIcon(t,16)}${t}</span>`;
}
function typeListOrNone(types) {
  if (!types.length) return `<div class="panel-none">None</div>`;
  return `<div class="panel-type-list">${types.map(typePill).join("")}</div>`;
}

let sidePanelTab = 'types'; // 'types' | 'changelog' | 'collection'
let selectedChangeIdx = null;
let changelogFilter = '';

function toggleNoteInput(i) {
  const el = document.getElementById('note-input-' + i);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
  if (el.style.display === 'block') {
    setTimeout(() => document.getElementById('note-text-' + i)?.focus(), 50);
  }
}

function saveNote(i) {
  const ta = document.getElementById('note-text-' + i);
  if (!ta || !changes[i]) return;
  changes[i].note = ta.value.trim();
  autoSave();
  renderSidePanel();
  showToast('Note saved');
}

function clearNote(i) { if (!changes[i]) return; delete changes[i].note; autoSave(); renderSidePanel(); }

const COLLECTION_KEY = 'pokemon_type_chart_collection';

function getCollection() { try { return JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]'); } catch(e) { return []; } }
function saveCollection(col) { try { localStorage.setItem(COLLECTION_KEY, JSON.stringify(col)); } catch(e) {} }
function collectionSnapshot() {
  const customTypeNames = TYPES.filter(t => !ORIGINAL_18.includes(t));
  return {
    id: Date.now(), name: '', date: new Date().toLocaleString(),
    chart: buildMatrix(), changes: JSON.parse(JSON.stringify(changes)),
    customTypes: customTypeMeta(),
    customGradients: Object.fromEntries(customTypeNames.filter(t=>TYPE_GRADIENTS[t]).map(t=>[t,TYPE_GRADIENTS[t]])),
    customIcons: Object.fromEntries(customTypeNames.filter(t=>TYPE_ICON_IMGS[t]).map(t=>[t,TYPE_ICON_IMGS[t]])),
    activeTypes: [...TYPES], typeCount: TYPES.length, changeCount: changes.length
  };
}

function saveToCollection() {
  const name = prompt('Name this chart:', 'My Chart');
  if (name === null) return;
  const col = getCollection();
  const snap = collectionSnapshot();
  snap.name = name.trim() || 'Unnamed';
  col.push(snap);
  saveCollection(col);
  showToast(`Saved "${snap.name}" to collection`);
  if (sidePanelTab === 'collection') renderSidePanel();
}

function loadFromCollection(id) {
  const slot = getCollection().find(s => s.id === id);
  if (!slot) return;
  TYPES.length = 0;
  (slot.activeTypes || Object.keys(slot.chart)).forEach(t => TYPES.push(t));
  TYPES.filter(t => !ORIGINAL_18.includes(t)).forEach(t => {
    delete TYPE_COLORS[t]; delete TYPE_TEXT[t]; delete TYPE_GRADIENTS[t]; delete TYPE_ICON_IMGS[t];
  });
  (slot.customTypes || []).forEach(ct => { TYPE_COLORS[ct.name] = ct.color; TYPE_TEXT[ct.name] = getContrastText(ct.color); });
  if (slot.customGradients) Object.assign(TYPE_GRADIENTS, slot.customGradients);
  if (slot.customIcons) Object.assign(TYPE_ICON_IMGS, slot.customIcons);
  chart = slot.chart; changes = slot.changes || [];
  const base = deepCopy(slot.chart);
  changes.forEach(c => { if (base[c.atk]) base[c.atk][c.def] = c.from ?? 1; });
  baselineChart = base; selectedType = null;
  commit(); buildChips();
  showToast(`Loaded "${slot.name}"`);
  if (sidePanelTab === 'collection') renderSidePanel();
}

function renameCollectionEntry(id) {
  const col = getCollection(), slot = col.find(s => s.id === id);
  if (!slot) return;
  const name = prompt('Rename:', slot.name);
  if (name === null) return;
  slot.name = name.trim() || slot.name;
  saveCollection(col); renderSidePanel();
}

function overwriteCollectionEntry(id) {
  const col = getCollection(), idx = col.findIndex(s => s.id === id);
  if (idx === -1) return;
  const snap = Object.assign(collectionSnapshot(), { id, name: col[idx].name });
  col[idx] = snap; saveCollection(col);
  showToast(`Updated "${snap.name}"`); renderSidePanel();
}

function deleteCollectionEntry(id) {
  const col = getCollection(), name = col.find(s => s.id === id)?.name || 'entry';
  saveCollection(col.filter(s => s.id !== id));
  showToast(`Deleted "${name}"`); renderSidePanel();
}

function exportCollectionEntry(id) {
  const slot = getCollection().find(s => s.id === id);
  if (!slot) return;
  downloadBlob(JSON.stringify({ _format:'pokemon-type-chart-custom', _version:3, ...slot }, null, 2),
    `${slot.name.replace(/[^a-zA-Z0-9]/g,'-').toLowerCase()}.json`);
  showToast(`Exported "${slot.name}"`);
}

function selectChangeEntry(i) { selectedChangeIdx = selectedChangeIdx === i ? null : i; renderSidePanel(); }
function removeSelectedChange() {
  if (selectedChangeIdx === null) { showToast("Click a change to select it first"); return; }
  const c = changes[selectedChangeIdx];
  if (!c) return;
  pushHistory();
  const revertTo = c.from ?? 1;
  chart[c.atk][c.def] = revertTo;
  changes.splice(selectedChangeIdx, 1);
  selectedChangeIdx = null;
  commit(); showToast(`Reverted: ${c.atk} vs ${c.def} back to ${revertTo}×`);
}

function renderSidePanel() {
  const el = document.getElementById("side-panel");
  const spBtn = (tab, label, onclick) => {
    const a = sidePanelTab === tab;
    return `<button onclick="${onclick}" style="flex:1;padding:7px 4px;font-size:11px;font-weight:700;letter-spacing:.5px;background:none;border:none;border-bottom:2px solid ${a?'var(--yellow)':'transparent'};color:${a?'var(--yellow)':'var(--dim)'};cursor:pointer">${label}</button>`;
  };
  const overlayBox = (active, color, alpha, icon, title, rows, offFn) => active ? `
    <div style="margin-bottom:12px;padding:10px 12px;background:rgba(${alpha},0.06);border:1px solid rgba(${alpha},0.3);border-radius:8px">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.5px;color:${color};margin-bottom:8px">${icon} ${title}</div>
      <div style="display:flex;flex-direction:column;gap:6px">${rows}
        <button onclick="${offFn}()" style="margin-top:4px;width:100%;padding:4px;background:rgba(${alpha},0.1);border:1px solid rgba(${alpha},0.3);color:${color};border-radius:5px;cursor:pointer;font-size:10px;font-weight:700">Turn Off ${title.replace(' ACTIVE','')}</button>
      </div></div>` : '';
  const swatch = (bg, border) => `<div style="width:14px;height:14px;border-radius:3px;background:${bg};flex-shrink:0;border:1px solid ${border}"></div>`;
  const heatmapLegend = overlayBox(heatmapActive,'#f7d02c','247,208,44','🌡','HEATMAP ACTIVE',`
    <div class="row8">${swatch('linear-gradient(90deg,rgba(99,144,240,0.15),rgba(99,144,240,0.6))','rgba(99,144,240,0.4)')}<span style="font-size:10px;color:var(--dim2)"><span style="color:#6390f0;font-weight:700">Blue bar</span> on rows — offensive threat score.</span></div>
    <div class="row8">${swatch('linear-gradient(90deg,rgba(249,85,135,0.15),rgba(249,85,135,0.6))','rgba(249,85,135,0.4)')}<span style="font-size:10px;color:var(--dim2)"><span style="color:#f95587;font-weight:700">Pink bar</span> on columns — defensive vulnerability.</span></div>
    <div class="row8">${swatch('linear-gradient(135deg,rgba(99,144,240,0.3),rgba(249,85,135,0.3))','var(--border)')}<span style="font-size:10px;color:var(--dim2)"><span style="color:#a98fff;font-weight:700">Cell tint</span> — combined threat.</span></div>`,'toggleHeatmap');
  const countLegend = overlayBox(countOverlayActive,'#a98fff','169,143,255','🔢','WEAKNESS COUNTER ACTIVE',`
    <div class="row8"><span style="font-size:9px;font-weight:800;background:#6390f022;color:#6390f0;border:1px solid #6390f055;border-radius:3px;padding:1px 6px;flex-shrink:0">6</span><span style="font-size:10px;color:var(--dim2)"><span style="color:#6390f0;font-weight:700">Blue badge</span> on rows — SE hits. Click to highlight.</span></div>
    <div class="row8"><span style="font-size:9px;font-weight:800;background:#f9558722;color:#f95587;border:1px solid #f9558755;border-radius:3px;padding:1px 6px;flex-shrink:0">4</span><span style="font-size:10px;color:var(--dim2)"><span style="color:#f95587;font-weight:700">Pink badge</span> on columns — weaknesses. Click to highlight.</span></div>
    <div class="row8"><span style="font-size:10px;color:var(--dim2)">👆 Click a badge again to deselect.</span></div>`,'toggleCountOverlay');
  const tabBar = `<div style="display:flex;gap:0;margin-bottom:12px;border-bottom:1px solid var(--border)">
    ${spBtn('types','TYPE INFO',"sidePanelTab='types';changelogFilter='';renderSidePanel()")}
    ${spBtn('changelog',`CHANGELOG${changes.length?` (${changes.length})`:''}`,"sidePanelTab='changelog';renderSidePanel()")}
    ${spBtn('collection','COLLECTION',"sidePanelTab='collection';changelogFilter='';renderSidePanel()")}
  </div>` + heatmapLegend + countLegend;

  if (sidePanelTab === 'changelog') {
    let changelogHtml = `<div style="display:flex;flex-direction:column;gap:8px">`;
    changelogHtml += `<div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="tbtn" style="font-size:10px;padding:4px 10px;flex:1" onclick="removeSelectedChange()">✕ Remove A Change</button>
      <button class="tbtn" style="font-size:10px;padding:4px 10px;flex:1" onclick="saveChangelog()">💾 Save .txt</button>
      <button class="tbtn" style="font-size:10px;padding:4px 10px;flex:1" onclick="saveChangelogMd()">📋 Save .md</button>
      <button class="tbtn" style="font-size:10px;padding:4px 10px;flex:1;color:#f95587" onclick="clearChangelogLog()">🗑 Clear History</button>
    </div>
    <div style="position:relative">
      <input id="changelogSearch" type="text" placeholder="Filter by type name…" value="${changelogFilter.replace(/"/g,'&quot;')}"
        oninput="changelogFilter=this.value;renderSidePanel();const s=document.getElementById('changelogSearch');if(s){s.focus();s.selectionStart=s.selectionEnd=s.value.length;}"
        style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:5px;padding:5px 28px 5px 9px;color:var(--text);font-family:inherit;font-size:11px;outline:none;box-sizing:border-box"/>
      ${changelogFilter ? `<span onclick="changelogFilter='';renderSidePanel()" style="position:absolute;right:7px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--dim);font-size:12px;line-height:1">✕</span>` : ''}
    </div>`;
    if (!changes.length) {
      changelogHtml += `<p style="font-size:11px;color:var(--dim);text-align:center;padding:20px 0">No changes from official chart.<br>Click cells to modify matchups.</p>`;
    } else {
      const q = changelogFilter.trim().toLowerCase();
      const visible = changes
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => !q || c.atk.toLowerCase().includes(q) || c.def.toLowerCase().includes(q));
      if (!visible.length) {
        changelogHtml += `<p style="font-size:11px;color:var(--dim);text-align:center;padding:12px 0">No changes match "${changelogFilter}".</p>`;
      } else {
        changelogHtml += visible.map(({ c, i }) => {
          const isSelected = selectedChangeIdx === i;
          const hasNote = c.note && c.note.trim();
          return `<div onclick="selectChangeEntry(${i})" id="change-entry-${i}"
            style="cursor:pointer;border:1px solid ${isSelected?'var(--yellow)':'transparent'};background:${isSelected?'rgba(247,208,44,0.08)':'transparent'};border-radius:6px;padding:4px 6px;transition:all 0.15s;display:flex;flex-direction:column;gap:4px">
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              <span class="change-badge" style="background:${TYPE_COLORS[c.atk]}22;color:${TYPE_COLORS[c.atk]};display:inline-flex;align-items:center;gap:4px">${typeIcon(c.atk,10)}${c.atk}</span>
              <span style="color:var(--dim)">vs</span>
              <span class="change-badge" style="background:${TYPE_COLORS[c.def]}22;color:${TYPE_COLORS[c.def]};display:inline-flex;align-items:center;gap:4px">${typeIcon(c.def,10)}${c.def}</span>
              <span style="color:#666">:</span>
              <span style="color:${EFF_TEXT[c.from]};font-size:10px">${c.from}× ${effLabel(c.from)}</span>
              <span style="color:var(--dim)">→</span>
              <span style="color:${EFF_TEXT[c.to]};font-weight:700;font-size:10px">${c.to}× ${effLabel(c.to)}</span>
              ${isSelected ? `<button onclick="event.stopPropagation();toggleNoteInput(${i})" style="margin-left:auto;font-size:9px;padding:2px 7px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--dim);cursor:pointer;white-space:nowrap">${hasNote?'✏️ Edit Note':'＋ Add Note'}</button>` : ''}
            </div>
            ${hasNote && !isSelected ? `<div style="font-size:10px;color:var(--dim2);font-style:italic;padding:2px 4px;border-left:2px solid var(--yellow);margin-left:2px">${c.note}</div>` : ''}
            ${isSelected ? `<div id="note-input-${i}" style="display:none;margin-top:2px">
              <textarea id="note-text-${i}" placeholder="Why was this changed? (e.g. Balancing Fire vs Grass for this hack...)"
                style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:5px;padding:5px 7px;color:var(--text);font-family:inherit;font-size:10px;resize:vertical;min-height:52px;outline:none;box-sizing:border-box"
                onclick="event.stopPropagation()">${c.note||''}</textarea>
              <div style="display:flex;gap:5px;margin-top:4px">
                <button onclick="event.stopPropagation();saveNote(${i})" style="flex:1;font-size:10px;padding:3px 8px;background:var(--accent);border:none;color:white;border-radius:4px;cursor:pointer;font-weight:700">Save</button>
                <button onclick="event.stopPropagation();clearNote(${i})" style="font-size:10px;padding:3px 8px;background:var(--surface2);border:1px solid var(--border);color:var(--dim);border-radius:4px;cursor:pointer">Clear</button>
              </div>
            </div>` : ''}
          </div>`;
        }).join('');
      }
    }
    changelogHtml += `</div>`;
    el.innerHTML = tabBar + changelogHtml;
    return;
  }

  if (sidePanelTab === 'collection') {
    const col = getCollection();
    let html = `<div style="display:flex;flex-direction:column;gap:8px">`;
    html += `<button onclick="saveToCollection()" style="width:100%;padding:8px;background:var(--accent);border:none;color:white;border-radius:7px;cursor:pointer;font-size:12px;font-weight:700">＋ Save Current Chart</button>`;
    if (!col.length) {
      html += `<p style="font-size:11px;color:var(--dim);text-align:center;padding:20px 0">No charts saved yet.<br>Click above to add the current chart to your collection.</p>`;
    } else {
      html += `<div style="font-size:10px;color:var(--dim);margin:0 0 2px">${col.length} chart${col.length!==1?'s':''} in collection</div>`;
      col.slice().reverse().forEach(slot => {
        html += `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:9px 11px;display:flex;flex-direction:column;gap:5px">
          <div class="row6">
            <span style="font-size:12px;font-weight:700;color:var(--text);flex:1">${slot.name}</span>
            <span style="font-size:9px;color:var(--dim)">${slot.date}</span>
          </div>
          <div class="f10d">${slot.typeCount} types · ${slot.changeCount} change${slot.changeCount!==1?'s':''}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            <button onclick="loadFromCollection(${slot.id})" style="flex:1;font-size:10px;padding:4px 6px;background:var(--accent);border:none;color:white;border-radius:5px;cursor:pointer;font-weight:700">📂 Load</button>
            <button onclick="overwriteCollectionEntry(${slot.id})" style="flex:1;font-size:10px;padding:4px 6px;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:5px;cursor:pointer">⟳ Update</button>
            <button onclick="renameCollectionEntry(${slot.id})" style="font-size:10px;padding:4px 7px;background:var(--surface);border:1px solid var(--border);color:var(--dim);border-radius:5px;cursor:pointer" title="Rename">✏️</button>
            <button onclick="exportCollectionEntry(${slot.id})" style="font-size:10px;padding:4px 7px;background:var(--surface);border:1px solid var(--border);color:var(--dim);border-radius:5px;cursor:pointer" title="Export JSON">⬇</button>
            <button onclick="deleteCollectionEntry(${slot.id})" style="font-size:10px;padding:4px 7px;background:var(--surface);border:1px solid var(--border);color:#f95587;border-radius:5px;cursor:pointer">✕</button>
          </div>
        </div>`;
      });
    }
    html += `</div>`;
    el.innerHTML = tabBar + html;
    return;
  }

  let gridHtml = `<div class="panel-card"><div class="panel-section-title" style="color:var(--dim);margin-bottom:8px;font-size:13px;letter-spacing:0.5px">SELECT A TYPE</div><div class="type-grid">`;
  TYPES.forEach(t => {
    const active = selectedType === t;
    const fg = typeContrastText(t);
    gridHtml += `<button class="type-grid-btn${active?" active":""}"
      style="background:${typeBg(t)};color:${fg};border-color:${active?'rgba(255,255,255,0.6)':TYPE_COLORS[t]};${active?'box-shadow:0 0 0 2px '+TYPE_COLORS[t]:''};"
      onclick="selectType('${t}')">
      ${typeIcon(t,17)}${t}
    </button>`;
  });
  gridHtml += `</div></div>`;

  if (!selectedType) {
    el.innerHTML = tabBar + gridHtml + `<div class="panel-card panel-empty"><div class="panel-empty-icon">⬡</div><div class="panel-empty-text">Click a type above or on the chart to view its matchup breakdown</div></div>`;
    return;
  }
  const t = selectedType;
  const atkSuper=[], atkNotVery=[], atkImmune=[];
  TYPES.forEach(def => {
    const v = chart[t][def];
    if (v===2) atkSuper.push(def);
    else if (v===0.5) atkNotVery.push(def);
    else if (v===0) atkImmune.push(def);
  });
  const defWeak=[], defResist=[], defImmune=[];
  TYPES.forEach(atk => {
    const v = chart[atk][t];
    if (v===2) defWeak.push(atk);
    else if (v===0.5) defResist.push(atk);
    else if (v===0) defImmune.push(atk);
  });

  el.innerHTML = tabBar + gridHtml + `<div class="panel-card">
    <div class="panel-type-header">
      ${typeIcon(t, 32)}
      <div class="panel-type-name" style="color:${TYPE_COLORS[t]}">${t}</div>
      <button class="panel-close" onclick="selectType('${t}')">✕</button>
    </div>
    <div class="panel-section">
      <div class="panel-section-title" style="color:${TYPE_COLORS[t]}">⚔️ ATTACK</div>
      <div class="panel-matchup-label">${t} is <span style="color:var(--green);font-weight:700">super effective</span> vs:</div>
      ${typeListOrNone(atkSuper)}
      <div class="panel-matchup-label">${t} is <span style="color:var(--red);font-weight:700">not very effective</span> vs:</div>
      ${typeListOrNone(atkNotVery)}
      <div class="panel-matchup-label">${t} has <span style="color:#555;font-weight:700">no effect</span> on:</div>
      ${typeListOrNone(atkImmune)}
    </div>
    <div style="border-top:1px solid var(--border);margin:4px 0 14px"></div>
    <div class="panel-section">
      <div class="panel-section-title" style="color:${TYPE_COLORS[t]}">🛡️ DEFENSE</div>
      <div class="panel-matchup-label">Super effective against ${t}:</div>
      ${typeListOrNone(defWeak)}
      <div class="panel-matchup-label">Not very effective against ${t}:</div>
      ${typeListOrNone(defResist)}
      <div class="panel-matchup-label">${t} is immune to:</div>
      ${typeListOrNone(defImmune)}
    </div>
  </div>`;
}

let chartZoom = 1.0; // user zoom multiplier

function scaleChart() {
  const scroll = document.querySelector('.chart-scroll');
  const wrapper = document.getElementById('chart-scale-wrapper');
  const inner = document.getElementById('chart');
  if (!scroll || !inner || !wrapper) return;

  // Reset to measure natural size
  inner.style.transform = 'none';
  wrapper.style.width = '';
  wrapper.style.height = '';

  const naturalW = inner.scrollWidth;
  const naturalH = inner.scrollHeight;
  const availW = scroll.clientWidth - 16;
  const availH = scroll.clientHeight - 16;
  const autoScale = Math.min(availW / naturalW, availH / naturalH);
  const finalScale = autoScale * chartZoom;
  const scaledW = Math.ceil(naturalW * finalScale);
  const scaledH = Math.ceil(naturalH * finalScale);

  // Use top center origin so it scales outward symmetrically
  inner.style.transformOrigin = 'top center';
  inner.style.transform = `scale(${finalScale})`;

  // Wrapper needs to be at least as wide as scaled content so scroll triggers
  const wrapperW = Math.max(scaledW, availW);
  wrapper.style.minWidth = wrapperW + 'px';
  wrapper.style.minHeight = scaledH + 'px';

  const zoomLabel = document.getElementById('zoom-label');
  if (zoomLabel) zoomLabel.textContent = Math.round(chartZoom * 100) + '%';
}

function setZoom(delta) { chartZoom = Math.max(0.3, Math.min(3.0, chartZoom + delta)); scaleChart(); }
function resetZoom() { chartZoom = 1.0; scaleChart(); }

let heatmapActive = false;
let countOverlayActive = false;
let dualDefMode = false;
let dualDefTypes = {}; // { [primaryType]: [sec1|null, sec2|null] }

function toggleDualDefMode() {
  dualDefMode = !dualDefMode;
  setBtnActive('dualDefBtn', dualDefMode, '#55efc4', 'rgba(85,239,196,0.1)');
  if (!dualDefMode) dualDefTypes = {};
  renderEditor();
}

function setDualDefType(primary, slotIdx, value, event) {
  event && event.stopPropagation();
  if (!dualDefTypes[primary]) dualDefTypes[primary] = [null, null];
  dualDefTypes[primary][slotIdx] = value || null;
  renderEditor();
}

function toggleHeatmap() {
  heatmapActive = !heatmapActive;
  setBtnActive('heatmapBtn', heatmapActive, '#f7d02c', 'rgba(247,208,44,0.1)');
  renderEditor();
  renderSidePanel();
}

function toggleCountOverlay() {
  countOverlayActive = !countOverlayActive;
  setBtnActive('countOverlayBtn', countOverlayActive, '#a98fff', 'rgba(169,143,255,0.1)');
  renderEditor();
  renderSidePanel();
}

function computeHeatScores() {
  // Offensive score: how many types does this attacker hit SE (higher = more threatening)
  // Defensive score: how many types hit this type SE (higher = more vulnerable)
  const offScore = {}, defScore = {};
  TYPES.forEach(t => {
    offScore[t] = TYPES.reduce((n, def) => n + (chart[t]?.[def] >= 2 ? 1 : 0), 0);
    defScore[t] = TYPES.reduce((n, atk) => n + (chart[atk]?.[t] >= 2 ? 1 : 0), 0);
  });
  const maxOff = Math.max(...Object.values(offScore), 1);
  const maxDef = Math.max(...Object.values(defScore), 1);
  return { offScore, defScore, maxOff, maxDef };
}

function renderEditor() {
  const el = document.getElementById("chart");
  const isLight = document.body.classList.contains('light-mode');
  const effBg   = isLight ? LIGHT_EFF_BG   : DARK_EFF_BG;
  const effText = isLight ? LIGHT_EFF_TEXT  : DARK_EFF_TEXT;
  const multBg  = v => isLight ? LIGHT_MULT_BG(v) : DARK_MULT_BG(v);
  let html = "";
  html += `<div class="axis-label-row"><div class="axis-label-spacer"></div><div class="axis-label-text" style="width:${38*TYPES.length}px">DEFENDING →</div></div>`;
  html += `<div class="col-headers"><div class="axis-label-spacer" style="text-align:right;padding-right:8px;padding-bottom:4px;font-size:10px;color:var(--dim);letter-spacing:2px;font-weight:600">ATK ↓</div>`;

  let heat = null;
  if (heatmapActive) heat = computeHeatScores();

  // O(1) changed-cell lookup — avoids O(n) scan per cell
  const changedSet = new Set(changes.map(c => c.atk + '|' + c.def));

  // Pre-compute counts for badge overlay
  let atkCounts = {}, defCounts = {};
  if (countOverlayActive) {
    TYPES.forEach(t => {
      atkCounts[t] = TYPES.reduce((n, def) => n + (chart[t]?.[def] >= 2 ? 1 : 0), 0);
      defCounts[t] = TYPES.reduce((n, atk) => n + (chart[atk]?.[t] >= 2 ? 1 : 0), 0);
    });
  }

  const badge = (count, color, title) =>
    `<span title="${title}" style="font-size:9px;font-weight:800;background:${color}22;color:${color};border:1px solid ${color}55;border-radius:3px;padding:1px 4px;line-height:1.2;flex-shrink:0">${count}</span>`;

  // Badge focus: which rows/cols are highlighted
  let badgeHighlightRows = null, badgeHighlightCols = null;
  if (badgeFocusType && badgeFocusMode) {
    if (badgeFocusMode === 'atk') {
      // highlight cols where this attacker hits SE
      badgeHighlightCols = new Set(TYPES.filter(def => (chart[badgeFocusType]?.[def] ?? 1) >= 2));
    } else {
      // highlight rows where attacker hits this defender SE
      badgeHighlightRows = new Set(TYPES.filter(atk => (chart[atk]?.[badgeFocusType] ?? 1) >= 2));
    }
  }

  TYPES.forEach(t => {
    const inFocus = badgeHighlightCols ? badgeHighlightCols.has(t) : true;
    const op = (badgeHighlightCols && !inFocus) ? 0.1 : (selectedType && selectedType!==t ? 0.25 : 1);
    const defIntensity = heat ? (heat.defScore[t] / heat.maxDef) : 0;
    const colHeat = heat ? `box-shadow:inset 0 -3px 0 rgba(249,85,135,${(defIntensity*0.9).toFixed(2)})` : '';
    const isBadgeFocused = badgeFocusType === t && badgeFocusMode === 'def';
    const defBadge = countOverlayActive ? `<span title="${t} has ${defCounts[t]} weakness${defCounts[t]!==1?'es':''} — click to highlight" onclick="clickBadge('${t}','def',event)" style="font-size:9px;font-weight:800;background:${isBadgeFocused?'#f95587':'#f9558722'};color:${isBadgeFocused?'#fff':'#f95587'};border:1px solid #f9558755;border-radius:3px;padding:1px 4px;line-height:1.2;flex-shrink:0;cursor:pointer">${defCounts[t]}</span>` : '';

    // Dual/Triple defender: secondary type selector dropdowns
    const secs = dualDefMode ? (dualDefTypes[t] || [null, null]) : null;
    const dualSel = dualDefMode ? [0, 1].map(si => {
      const sv = secs[si] || '';
      return `<select onclick="event.stopPropagation()" onchange="setDualDefType('${t}',${si},this.value,event)"
        style="font-size:8px;width:36px;background:${sv?TYPE_COLORS[sv]+'33':'var(--surface2)'};border:1px solid ${sv?TYPE_COLORS[sv]:'var(--border)'};color:${sv?TYPE_COLORS[sv]:'var(--dim)'};border-radius:3px;padding:1px 2px;font-family:inherit;cursor:pointer;margin-top:1px">
        <option value="">+type</option>
        ${TYPES.filter(x=>x!==t).map(x=>`<option value="${x}" ${sv===x?'selected':''}>${x.slice(0,4)}</option>`).join('')}
      </select>`;
    }).join('') : '';

    html += `<div class="col-header" onclick="selectType('${t}')" oncontextmenu="openBulkFillPopup('${t}','col',event);return false" style="${colHeat}"><div class="col-header-text" style="opacity:${op};display:flex;flex-direction:column;align-items:center;gap:2px">${typeIcon(t, 18)}${defBadge}${dualSel}</div></div>`;
  });
  html += `</div>`;

  TYPES.forEach(atk => {
    const rowInFocus = badgeHighlightRows ? badgeHighlightRows.has(atk) : true;
    const rowOp = (badgeHighlightRows && !rowInFocus) ? 0.1 : (selectedType && selectedType!==atk ? 0.25 : 1);
    const offIntensity = heat ? (heat.offScore[atk] / heat.maxOff) : 0;
    const rowHeat = heat ? `border-left:3px solid rgba(99,144,240,${(offIntensity*0.9).toFixed(2)})` : '';
    const isBadgeFocused = badgeFocusType === atk && badgeFocusMode === 'atk';
    const atkBadge = countOverlayActive ? `<span title="${atk} hits ${atkCounts[atk]} type${atkCounts[atk]!==1?'s':''} SE — click to highlight" onclick="clickBadge('${atk}','atk',event)" style="font-size:9px;font-weight:800;background:${isBadgeFocused?'#6390f0':'#6390f022'};color:${isBadgeFocused?'#fff':'#6390f0'};border:1px solid #6390f055;border-radius:3px;padding:1px 4px;line-height:1.2;flex-shrink:0;cursor:pointer">${atkCounts[atk]}</span>` : '';
    html += `<div class="chart-row"><div class="row-label" style="opacity:${rowOp};${rowHeat}" onclick="selectType('${atk}')" oncontextmenu="openBulkFillPopup('${atk}','row',event);return false"><span class="row-label-text" style="color:${TYPE_COLORS[atk]}">${atk.toUpperCase()}</span>${typeIcon(atk, 18)}${atkBadge}</div>`;
    TYPES.forEach(def => {
      // In dual/triple-def mode, multiply all type multipliers together
      const secPair = dualDefMode ? (dualDefTypes[def] || [null, null]) : [null, null];
      const v1 = chart[atk]?.[def] ?? 1;
      const v2 = secPair[0] ? (chart[atk]?.[secPair[0]] ?? 1) : 1;
      const v3 = secPair[1] ? (chart[atk]?.[secPair[1]] ?? 1) : 1;
      const hasSec = dualDefMode && (secPair[0] || secPair[1]);
      const val = hasSec ? Math.min(v1 * v2 * v3, 8) : v1;
      const changed = !hasSec && changedSet.has(atk + '|' + def);
      const dimmed = (badgeHighlightCols && !badgeHighlightCols.has(def)) ||
                     (badgeHighlightRows && !badgeHighlightRows.has(atk)) ||
                     (!badgeFocusType && selectedType && atk!==selectedType && def!==selectedType);
      const border = changed ? "2px solid var(--yellow)" : hasSec ? `1px solid ${TYPE_COLORS[secPair[0]||secPair[1]]}44` : (atk===def ? "1px solid #2a2a3a" : "1px solid #1a1a28");

      const cellBg   = hasSec ? multBg(val) : effBg[val];
      const cellText = hasSec ? MULT_TEXT(val) : effText[val];
      const cellLabel = hasSec ? ((MULT_LABEL(val)||'1')+'×') : (MULT_LABEL(val) ? MULT_LABEL(val)+'×' : '');

      // Heatmap overlay
      let cellExtra = '';
      if (heat && !dimmed) {
        const offI = heat.offScore[atk] / heat.maxOff;
        const defI = heat.defScore[def] / heat.maxDef;
        const combined = (offI + defI) / 2;
        cellExtra = `box-shadow:inset 0 0 0 38px rgba(${combined > 0.5 ? '249,85,135' : '99,144,240'},${(combined * 0.3).toFixed(2)})`;
      }

      const defLabel = [def, secPair[0], secPair[1]].filter(Boolean).join('/');
      const multLabel = [v1, secPair[0]?v2:null, secPair[1]?v3:null].filter(x=>x!==null).join('× × ')+'×';
      const tooltipAttr = hasSec
        ? `title="${atk} vs ${defLabel}: ${multLabel} = ${val}×"`
        : `onmouseenter="showEditorTooltip('${atk}','${def}',event)" onmouseleave="hideEditorTooltip()"`;

      html += `<div class="cell${(focusedAtk===atk&&focusedDef===def)?' kb-focus':''}" data-atk="${atk}" data-def="${def}" style="background:${cellBg};border:${border};color:${cellText};opacity:${dimmed?0.12:1};${cellExtra}"
        onclick="${hasSec ? '' : `openCellPopup('${atk}','${def}',event)`}"
        oncontextmenu="closeCellPopup();setKbFocus(null,null);return false"
        ${tooltipAttr}>
        ${cellLabel}${changed?'<div class="mod-marker">✦</div>':''}
      </div>`;
    });
    html += `</div>`;
  });
  el.innerHTML = html;
}

const CHANGELOG_LOG_KEY = "pokemon_type_chart_changelog_log";

function getChangelogLog() { try { return JSON.parse(localStorage.getItem(CHANGELOG_LOG_KEY) || '[]'); } catch(e) { return []; } }
function saveChangelog() {
  if (!changes.length) { showToast('No changes to save'); return; }
  const log = getChangelogLog();
  log.push({ date: new Date().toLocaleString(), changes: changes.map(c => ({ atk:c.atk, def:c.def, from:c.from, to:c.to })) });
  try { localStorage.setItem(CHANGELOG_LOG_KEY, JSON.stringify(log)); } catch(e) {}
  const lines = ['POKÉMON TYPE CHART CHANGELOG', '='.repeat(44), ''];
  log.forEach((s, i) => {
    lines.push(`── Session ${i+1} — ${s.date} ${'─'.repeat(Math.max(0,30-s.date.length))}`);
    s.changes.forEach(c => { lines.push(`  ${c.atk} (${TYPE_COLORS[c.atk]||'#888'}) vs ${c.def} (${TYPE_COLORS[c.def]||'#888'}): ${c.from}× → ${c.to}×${c.note?`\n    Note: ${c.note}`:''}`); });
    lines.push('');
  });
  lines.push(`Total sessions: ${log.length}  |  Total changes: ${log.reduce((n,s)=>n+s.changes.length,0)}`);
  downloadBlob(lines.join('\n'), 'type-chart-changelog.txt', 'text/plain');
  showToast(`Saved ${log.length} session(s) to changelog`);
}

function saveChangelogMd() {
  if (!changes.length) { showToast('No changes to save'); return; }
  const log = getChangelogLog();
  log.push({ date: new Date().toLocaleString(), changes: changes.map(c => ({ atk:c.atk, def:c.def, from:c.from, to:c.to, note:c.note })) });
  try { localStorage.setItem(CHANGELOG_LOG_KEY, JSON.stringify(log)); } catch(e) {}
  const total = log.reduce((n,s)=>n+s.changes.length,0);
  const lines = ['# Pokémon Type Chart Changelog',
    `> Generated by **Pokémon Type Chart** by Nҽʋι Zαɳҽ  `,
    `> ${log.length} session${log.length!==1?'s':''} · ${total} total change${total!==1?'s':''}`, '', '---', ''];
  log.forEach((s, i) => {
    const hasNote = s.changes.some(c=>c.note);
    lines.push(`## Session ${i+1} — ${s.date}`, '');
    lines.push('| Attacker | Defender | Before | After |' + (hasNote?' Note |':''));
    lines.push('|---|---|---|---|' + (hasNote?'---|':''));
    s.changes.forEach(c => {
      const noteCol = hasNote ? ` ${c.note||''} |` : '';
      lines.push(`| ${c.atk} \`${TYPE_COLORS[c.atk]||'#888'}\` | ${c.def} \`${TYPE_COLORS[c.def]||'#888'}\` | ${c.from!==undefined?`${c.from}×`:'1×'} | **${c.to}×** |${noteCol}`);
    });
    lines.push('');
  });
  lines.push('---', `*${log.length} session${log.length!==1?'s':''} · ${total} change${total!==1?'s':''} total*`);
  downloadBlob(lines.join('\n'), 'type-chart-changelog.md', 'text/markdown');
  showToast(`Saved ${log.length} session(s) as Markdown`);
}

function clearChangelogLog() { try { localStorage.removeItem(CHANGELOG_LOG_KEY); } catch(e) {} showToast('Changelog history cleared'); }

//  TRIPLE-TYPE STATE
let COMBOS = [];
let filtered = [];
let activeTypes = new Set();
let pinnedCombos = new Set(); // stores combo keys like "Fire/Water"

function comboKey(types) { return [...types].sort().join('/'); }
function togglePin(gi, event) {
  event.stopPropagation();
  const key = COMBOS[gi].key;
  if (pinnedCombos.has(key)) pinnedCombos.delete(key);
  else pinnedCombos.add(key);
  renderList();
}
let filterMode = 'any';
let currentSort = 'alpha';
let typeCountFilter = 'all';
let selectedComboIdx = null;
let comboBarWidth = 600;
let targetDefTypes = [null, null, null]; // vs-target defender slots (0–2)
let compareComboB = null;  // the second combo chosen for compare
let detActiveTab = 'offense'; // 'offense' | 'defense' | 'stats' | 'compare'
let cmpSubtab = 'offense';    // for compare: 'offense' | 'defense'
const DARK_MULT_BG = v =>
  v===0?'#1a1a4a':v===0.125?'#4a1020':v===0.25?'#6b2038':v===0.5?'#8a2020':v===1?'#2a2a3e':v===2?'#1a5c3a':v===4?'#1a8050':v===8?'#1aaa66':'#2a2a3e';
const LIGHT_MULT_BG = v =>
  v===0?'#c0c8e8':v===0.125?'#f0ccd4':v===0.25?'#e8aab4':v===0.5?'#dba0a8':v===1?'#dde3f0':v===2?'#a8dfc0':v===4?'#70c8a0':v===8?'#40b888':'#dde3f0';
const MULT_BG = v => document.body.classList.contains('light-mode') ? LIGHT_MULT_BG(v) : DARK_MULT_BG(v);
const MULT_LABEL = v =>
  v===0?'0':v===0.125?'⅛':v===0.25?'¼':v===0.5?'½':v===1?'':v===2?'2':v===4?'4':v===8?'8':v+'';
const MULT_TEXT = v => v===1 ? 'transparent' : '#fff';

