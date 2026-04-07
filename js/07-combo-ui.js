function buildChips() {
  const el = document.getElementById('typeChips');
  el.innerHTML = ''; // Clear first to avoid duplicates
  TYPES.forEach(t => {
    const c = document.createElement('span');
    c.className = 'chip'; c.id = 'chip-'+t;
    c.style.background = TYPE_COLORS[t]; c.style.color = TYPE_TEXT[t];
    c.style.display = 'inline-flex'; c.style.alignItems = 'center'; c.style.gap = '4px';
    c.innerHTML = typeIcon(t, 13) + t;
    c.onclick = () => toggleChip(t);
    if (activeTypes.has(t)) c.classList.add('active');
    el.appendChild(c);
  });
  // Build the sticky type column header above the combo list
  const hdr = document.getElementById('comboHeader');
  if (hdr) {
    const spacer = `<div class="type-header-spacer" style="display:flex;align-items:center;gap:6px;padding-left:2px">
      <span style="font-size:0.48rem;font-weight:700;color:#f95587;opacity:0.7;letter-spacing:0.08em">ATK</span>
      <span style="font-size:0.48rem;font-weight:700;color:#6390f0;opacity:0.7;letter-spacing:0.08em">/DEF ↓</span>
    </div>`;
    const cells = `<div class="type-header-cells">${TYPES.map(t =>
      `<div class="type-header-cell" style="color:${TYPE_COLORS[t]}">${t}</div>`
    ).join('')}</div>`;
    hdr.innerHTML = spacer + cells;
  }
  rebuildTargetDefSelects();
}
function toggleChip(t) {
  if (activeTypes.has(t)) activeTypes.delete(t); else activeTypes.add(t);
  document.getElementById('chip-'+t).classList.toggle('active', activeTypes.has(t));
  applyFilters();
}
function clearChips() { activeTypes.clear(); document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); applyFilters(); }
function setMode(m) {
  filterMode = m;
  ['modeAny','modeAll','modeExact'].forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById({any:'modeAny',all:'modeAll',exact:'modeExact'}[m]).classList.add('active');
  applyFilters();
}
function setSort(s) { currentSort = s; document.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b.dataset.sort===s)); applyFilters(); }
function setTargetDef(slotIdx, value) {
  targetDefTypes[slotIdx] = value || null;
  const active = targetDefTypes.some(Boolean);
  const sortBtn = document.getElementById('vsTargetSortBtn');
  if (sortBtn) {
    sortBtn.style.borderColor = active ? 'var(--accent)' : '';
    sortBtn.style.color = active ? 'var(--accent)' : '';
  }
  if (!active && currentSort === 'vs-target') {
    currentSort = 'alpha';
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b.dataset.sort==='alpha'));
  }
  applyFilters();
}

function clearTargetDef() {
  targetDefTypes = [null, null, null];
  rebuildTargetDefSelects();
  if (currentSort === 'vs-target') { currentSort = 'alpha'; document.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b.dataset.sort==='alpha')); }
  const sortBtn = document.getElementById('vsTargetSortBtn');
  if (sortBtn) { sortBtn.style.borderColor = ''; sortBtn.style.color = ''; }
  applyFilters();
}

function rebuildTargetDefSelects() {
  [0,1,2].forEach(i => {
    const sel = document.getElementById(`targetDefSel${i}`);
    if (!sel) return;
    const cur = targetDefTypes[i] || '';
    sel.innerHTML = `<option value="">— Type ${i+1} —</option>` +
      TYPES.map(t => `<option value="${t}"${t===cur?' selected':''}>${t}</option>`).join('');
    sel.value = cur;
  });
}

function setTypeCount(tc) {
  typeCountFilter = tc;
  document.querySelectorAll('[data-tc]').forEach(b => b.classList.toggle('active', b.dataset.tc===tc));
  applyFilters();
}

let mainTab = 'combos';

function setMainTab(tab) {
  mainTab = tab;
  document.getElementById('view-combos').style.display    = tab === 'combos'   ? 'flex'  : 'none';
  document.getElementById('view-overall').style.display   = tab === 'overall'  ? 'block' : 'none';
  document.getElementById('view-team').style.display      = tab === 'team'     ? 'block' : 'none';
  document.getElementById('view-tierlist').style.display  = tab === 'tierlist' ? 'block' : 'none';
  ['combos','overall','team','tierlist'].forEach(t => {
    const btn = document.getElementById('mainTab-'+t);
    if (!btn) return;
    btn.style.borderBottomColor = t === tab ? 'var(--accent)' : 'transparent';
    btn.style.color = t === tab ? 'var(--text)' : 'var(--dim)';
  });
  if (tab === 'overall')  { renderOverallChart(); renderBalanceChecker(); renderSymmetryChecker(); }
  if (tab === 'team')     { renderTeamAnalyzer(); renderMovesetChecker(); }
  if (tab === 'tierlist') { tierListCustom = null; renderTierList(); }
}

function getSuggestions(type, typeFlags, atkSE, atkNVE, defWeak, defResist, defImmune) {
  const tips = [];

  typeFlags.forEach(f => {

    if (f.key === 'atkSE') {
      const seTargets = TYPES.filter(def => (chart[type]?.[def] ?? 1) >= 2);
      const targetList = seTargets.map(def =>
        `<span style="color:${TYPE_COLORS[def]};font-weight:700">${def}</span>`
      ).join(', ');
      tips.push(`💡 Hitting ${atkSE} types SE is high. Review these matchups and remove ones that feel least justified for your hack's lore: ${targetList}. Changing any of them to 1× (neutral) will bring the count down without necessarily breaking anything.`);
    }

    if (f.key === 'atkNVE') {
      const nveTargets = TYPES.filter(def => { const v = chart[type]?.[def] ?? 1; return v === 0.5 || v === 0.25; });
      const targetList = nveTargets.map(def =>
        `<span style="color:${TYPE_COLORS[def]};font-weight:700">${def}</span>`
      ).join(', ');
      tips.push(`💡 ${type} is resisted by ${atkNVE} types — its offense is very limited. These types currently resist it: ${targetList}. Consider whether all of those resistances make sense thematically for your hack, and neutralise any that don't.`);
    }

    if (f.key === 'atkImmune') {
      const immuneTargets = TYPES.filter(def => (chart[type]?.[def] ?? 1) === 0);
      const targetList = immuneTargets.map(def =>
        `<span style="color:${TYPE_COLORS[def]};font-weight:700">${def}</span>`
      ).join(', ');
      tips.push(`💡 ${type} has no effect on ${immuneTargets.length} types: ${targetList}. Full immunities are strong — check if all of these feel intentional. Changing any to 0.5× instead still gives a resistance without a complete block.`);
    }

    if (f.key === 'defWeak') {
      const weakAtks = TYPES.filter(atk => (chart[atk]?.[type] ?? 1) >= 2);
      const targetList = weakAtks.map(atk =>
        `<span style="color:${TYPE_COLORS[atk]};font-weight:700">${atk}</span>`
      ).join(', ');
      tips.push(`💡 ${type} is weak to ${defWeak} types: ${targetList}. That's a lot of counters — it may be hard to use defensively. Look for any weaknesses that feel out of place in your hack's context and consider changing them to neutral (1×) or NVE (0.5×).`);
    }

    if (f.key === 'defResist') {
      const resistAtks = TYPES.filter(atk => { const v = chart[atk]?.[type] ?? 1; return v === 0.5 || v === 0.25; });
      const targetList = resistAtks.map(atk =>
        `<span style="color:${TYPE_COLORS[atk]};font-weight:700">${atk}</span>`
      ).join(', ');
      tips.push(`💡 ${type} resists ${defResist} types: ${targetList}. Defensively very strong. Check if every resistance here has a clear conceptual reason — any that feel arbitrary could be bumped to neutral (1×) to make the type more balanced.`);
    }

    if (f.key === 'defImmune') {
      const immuneAtks = TYPES.filter(atk => (chart[atk]?.[type] ?? 1) === 0);
      const targetList = immuneAtks.map(atk =>
        `<span style="color:${TYPE_COLORS[atk]};font-weight:700">${atk}</span>`
      ).join(', ');
      tips.push(`💡 ${type} is fully immune to ${immuneAtks.length} types: ${targetList}. That many immunities can make a type feel untouchable. Consider whether each one is essential — downgrading any to NVE (0.5×) still leaves a strong resistance.`);
    }

    if (f.key === 'noCounter') {
      // List all types and their current effectiveness against this type
      const byEff = {};
      TYPES.forEach(atk => {
        const v = chart[atk]?.[type] ?? 1;
        if (!byEff[v]) byEff[v] = [];
        byEff[v].push(atk);
      });
      const nveList = (byEff[0.5] || []).concat(byEff[0.25] || []);
      const neutralList = byEff[1] || [];
      const hintList = [...nveList.slice(0, 3), ...neutralList.slice(0, 2)];
      const targetList = hintList.map(atk =>
        `<span style="color:${TYPE_COLORS[atk]};font-weight:700">${atk}</span>`
      ).join(', ');
      tips.push(`💡 Nothing hits ${type} super effectively — it has no counters at all. This makes it very hard to check in battle. You need to give at least one type a 2× matchup against it. Some candidates to consider based on your hack's theme: ${targetList}. You know your type lore best — pick whichever makes the most sense.`);
    }
  });

  if (!tips.length) return '';

  return `<div style="margin-top:8px;padding:10px 12px;background:rgba(99,144,240,0.07);border:1px solid rgba(99,144,240,0.25);border-radius:6px;display:flex;flex-direction:column;gap:7px">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.5px;color:#6390f0;margin-bottom:2px">⚙️ SUGGESTIONS</div>
    ${tips.map(t => `<div style="font-size:10px;color:var(--dim2);line-height:1.6">${t}</div>`).join('<div style="height:1px;background:var(--border);margin:2px 0"></div>')}
  </div>`;
}

function renderBalanceChecker() {
  const el = document.getElementById('balanceChartContent');
  if (!el) return;

  // Thresholds
  const THRESHOLDS = {
    atkSE:    { warn: 8,  danger: 11, label: 'Types hit SE',         mode: 'high' },
    atkNVE:   { warn: 8,  danger: 11, label: 'Types resisted',       mode: 'high' },
    atkImmune:{ warn: 3,  danger: 5,  label: 'Types immune to it',   mode: 'high' },
    defWeak:  { warn: 5,  danger: 7,  label: 'Weaknesses',           mode: 'high' },
    defResist:{ warn: 10, danger: 13, label: 'Resistances',          mode: 'high' },
    defImmune:{ warn: 3,  danger: 5,  label: 'Immunities',           mode: 'high' },
    noCounter:{ warn: 1,  danger: 1,  label: 'No SE counter exists', mode: 'flag' },
  };

  const flags = [];
  const count = (arr, fn) => arr.reduce((n,x) => n + (fn(x)?1:0), 0);

  TYPES.forEach(t => {
    const typeFlags = [];
    const atkSE     = count(TYPES, d => (chart[t]?.[d]??1) >= 2);
    const atkNVE    = count(TYPES, d => { const v=chart[t]?.[d]??1; return v===0.5||v===0.25; });
    const atkImmune = count(TYPES, d => (chart[t]?.[d]??1) === 0);
    const defWeak   = count(TYPES, a => (chart[a]?.[t]??1) >= 2);
    const defResist = count(TYPES, a => { const v=chart[a]?.[t]??1; return v===0.5||v===0.25; });
    const defImmune = count(TYPES, a => (chart[a]?.[t]??1) === 0);
    const noCounter = defWeak === 0;
    const checks = { atkSE, atkNVE, atkImmune, defWeak, defResist, defImmune };
    let severity = 'ok';

    Object.entries(checks).forEach(([key, val]) => {
      const th = THRESHOLDS[key];
      let sev = 'ok';
      if (val >= th.danger) sev = 'danger';
      else if (val >= th.warn) sev = 'warn';
      if (sev !== 'ok') {
        typeFlags.push({ key, val, sev, label: th.label });
        if (sev === 'danger' && severity !== 'danger') severity = 'danger';
        else if (sev === 'warn' && severity === 'ok') severity = 'warn';
      }
    });

    if (noCounter) {
      typeFlags.push({ key: 'noCounter', val: 0, sev: 'danger', label: THRESHOLDS.noCounter.label });
      severity = 'danger';
    }

    if (severity !== 'ok') {
      flags.push({ type: t, severity, typeFlags, atkSE, atkNVE, atkImmune, defWeak, defResist, defImmune });
    }
  });

  // Sort: danger first, then warn
  flags.sort((a,b) => (a.severity === 'danger' ? -1 : 1) - (b.severity === 'danger' ? -1 : 1));

  const sevColor = s => s === 'danger' ? '#f95587' : '#f7d02c';
  const sevBg    = s => s === 'danger' ? 'rgba(249,85,135,0.1)' : 'rgba(247,208,44,0.1)';
  const sevIcon  = s => s === 'danger' ? '🔴' : '🟡';
  let html = `
    <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">Balance Checker</div>
    <div style="font-size:11px;color:var(--dim);margin-bottom:6px">Scans every type and flags potentially broken matchups.</div>
    <div style="display:flex;gap:14px;font-size:10px;color:var(--dim);margin-bottom:16px;flex-wrap:wrap">
      <span>🟡 Warning thresholds: 8+ SE hits · 8+ resisted · 3+ immunities given · 5+ weaknesses · 10+ resistances · 3+ immunities taken</span>
      <span>🔴 Danger thresholds: 11+ SE hits · 5+ immunities given · 7+ weaknesses · no SE counter exists</span>
    </div>`;

  if (!flags.length) {
    html += `<div style="text-align:center;padding:40px;color:var(--green);font-size:14px;font-weight:700">✅ No balance issues detected!</div>`;
  } else {
    html += `<div style="display:flex;flex-direction:column;gap:10px">`;
    flags.forEach(({ type, severity, typeFlags, atkSE, atkNVE, atkImmune, defWeak, defResist, defImmune }) => {
      html += `<div style="border:1px solid ${sevColor(severity)};border-radius:8px;padding:12px 14px;background:${sevBg(severity)}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          ${typeIcon(type, 20)}
          <span style="font-size:13px;font-weight:800;color:${TYPE_COLORS[type]}">${type}</span>
          <span style="font-size:10px;color:${sevColor(severity)};font-weight:700;margin-left:2px">${sevIcon(severity)} ${severity.toUpperCase()}</span>
          <span style="margin-left:auto;font-size:10px;color:var(--dim)">ATK: ${atkSE}SE / ${atkNVE}NVE / ${atkImmune}immune &nbsp;·&nbsp; DEF: ${defWeak}weak / ${defResist}resist / ${defImmune}immune</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          ${typeFlags.map(f => `<span style="font-size:10px;padding:3px 8px;border-radius:4px;background:${sevBg(f.sev)};border:1px solid ${sevColor(f.sev)};color:${sevColor(f.sev)};font-weight:700">${sevIcon(f.sev)} ${f.label}${f.key !== 'noCounter' ? ': ' + f.val : ''}</span>`).join('')}
        </div>
        ${getSuggestions(type, typeFlags, atkSE, atkNVE, defWeak, defResist, defImmune)}
      </div>`;
    });
    html += `</div>`;
    html += `<div style="margin-top:12px;font-size:10px;color:var(--dim)">${flags.length} type${flags.length!==1?'s':''} flagged out of ${TYPES.length} total.</div>`;
  }

  el.innerHTML = html;
}

function renderSymmetryChecker() {
  const el = document.getElementById('symmetryChartContent');
  if (!el) return;

  const pairs = [];
  // Only check each pair once (i < j)
  for (let i = 0; i < TYPES.length; i++) {
    for (let j = i + 1; j < TYPES.length; j++) {
      const a = TYPES[i], b = TYPES[j];
      const ab = chart[a]?.[b] ?? 1;
      const ba = chart[b]?.[a] ?? 1;
      if (ab !== ba) pairs.push({ a, b, ab, ba });
    }
  }

  const multLabel = v => v === 0 ? '0×' : v === 0.5 ? '½×' : v === 2 ? '2×' : v + '×';
  const multColor = v => v === 0 ? 'var(--dim)' : v === 0.5 ? 'var(--red)' : v === 2 ? 'var(--green)' : 'var(--text)';

  let html = `
    <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">Symmetry Checker</div>
    <div style="font-size:11px;color:var(--dim);margin-bottom:16px">Shows type pairs where A→B ≠ B→A. Asymmetry is normal and intentional in many cases — this is a QA tool to catch accidents.</div>`;

  if (!pairs.length) {
    html += `<div style="text-align:center;padding:32px;color:var(--green);font-size:14px;font-weight:700">✅ Chart is fully symmetric!</div>`;
  } else {
    html += `<div style="display:flex;flex-direction:column;gap:4px">`;
    pairs.forEach(({ a, b, ab, ba }) => {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;flex-wrap:wrap">
        <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:${TYPE_COLORS[a]}">${typeIcon(a,13)}${a}</span>
        <span class="f10d">⇄</span>
        <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:${TYPE_COLORS[b]}">${typeIcon(b,13)}${b}</span>
        <span style="margin-left:auto;display:flex;gap:12px;align-items:center">
          <span style="font-size:10px;color:var(--dim2)">${a}→${b}: <span style="font-weight:700;color:${multColor(ab)}">${multLabel(ab)}</span></span>
          <span style="font-size:10px;color:var(--dim2)">${b}→${a}: <span style="font-weight:700;color:${multColor(ba)}">${multLabel(ba)}</span></span>
        </span>
      </div>`;
    });
    html += `</div>`;
    html += `<div style="margin-top:10px;font-size:10px;color:var(--dim)">${pairs.length} asymmetric pair${pairs.length!==1?'s':''} out of ${TYPES.length * (TYPES.length-1) / 2} total pairs.</div>`;
  }

  el.innerHTML = html;
}

function renderOverallChart() {
  const el = document.getElementById('overallChartContent');
  if (!el) return;

  const typeScores = TYPES.map(t => {
    const off = TYPES.reduce((s,d) => s + scoreVal(chart[t]?.[d]??1, 1), 0);
    const def = TYPES.reduce((s,a) => s + scoreVal(chart[a]?.[t]??1, -1), 0);
    return { type:t, off, def, overall:off+def };
  });

  // Find min/max for color scaling
  const allVals = typeScores.flatMap(s => [s.off, s.def, s.overall]);
  const maxAbs = Math.max(...allVals.map(Math.abs), 1);
  const scoreColor = v => {
    const norm = Math.max(-1, Math.min(1, v / maxAbs));
    if (norm > 0) {
      const g = Math.round(80 + norm * 80);
      return `background:rgba(26,${g+50},58,0.9);color:#4ade80`;
    } else if (norm < 0) {
      const r = Math.round(80 + (-norm) * 80);
      return `background:rgba(${r+50},20,30,0.9);color:#f95587`;
    }
    return `background:var(--surface2);color:var(--dim)`;
  };

  const cellStyle = `padding:6px 4px;text-align:center;font-size:11px;font-weight:700;border-radius:4px;min-width:52px`;
  const hdrStyle = `padding:6px 8px;text-align:center;font-size:10px;font-weight:700;color:var(--dim);letter-spacing:0.5px;white-space:nowrap`;
  const rowLblStyle = `padding:6px 10px;font-size:10px;font-weight:700;letter-spacing:0.5px;color:var(--dim);background:var(--surface2);border-radius:4px;white-space:nowrap`;

  const sortedByOverall = [...typeScores].sort((a,b) => b.overall - a.overall);
  const bestType = sortedByOverall[0].type;
  const worstType = sortedByOverall[sortedByOverall.length-1].type;
  let html = `
    <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">Overall Type Coverage</div>
    <div style="font-size:11px;color:var(--dim);margin-bottom:14px">How each type performs across all matchups. Green = advantage, Red = disadvantage.</div>
    <div style="overflow-x:auto">
    <table style="border-collapse:separate;border-spacing:3px;min-width:max-content">
      <thead><tr>
        <th style="${hdrStyle};text-align:left">TYPE →<br>STAT ↓</th>
        ${typeScores.map(s => `<th style="${hdrStyle}">
          <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
            ${typeIcon(s.type, 16)}
            <span style="color:${TYPE_COLORS[s.type]};font-size:9px">${s.type.slice(0,4).toUpperCase()}</span>
          </div>
        </th>`).join('')}
      </tr></thead>
      <tbody>
        <tr>
          <td style="${rowLblStyle}">OFFENSE</td>
          ${typeScores.map(s => `<td style="${cellStyle};${scoreColor(s.off)}">${s.off > 0 ? '+' : ''}${s.off}</td>`).join('')}
        </tr>
        <tr>
          <td style="${rowLblStyle}">DEFENSE</td>
          ${typeScores.map(s => `<td style="${cellStyle};${scoreColor(s.def)}">${s.def > 0 ? '+' : ''}${s.def}</td>`).join('')}
        </tr>
        <tr>
          <td style="${rowLblStyle};color:var(--yellow);border:1px solid var(--yellow)">OVERALL</td>
          ${typeScores.map(s => `<td style="${cellStyle};${scoreColor(s.overall)};${s.type===bestType?'outline:2px solid #4ade80':s.type===worstType?'outline:2px solid #f95587':''}">${s.overall > 0 ? '+' : ''}${s.overall}</td>`).join('')}
        </tr>
      </tbody>
    </table>
    </div>
    <div style="margin-top:14px;font-size:10px;color:var(--dim)">
      Scoring: SE hit = +1 pt &nbsp;|&nbsp; NVE = −1 pt &nbsp;|&nbsp; Immune = −3 pt &nbsp;|&nbsp; Defense scores are inverted (being resisted = good).<br>
      Best overall: <span style="color:#4ade80;font-weight:700">${bestType}</span> &nbsp;·&nbsp;
      Worst overall: <span style="color:#f95587;font-weight:700">${worstType}</span>
    </div>`;

  el.innerHTML = html;
}

function setComboBarWidth(val) {
  comboBarWidth = parseInt(val);
  document.querySelectorAll('.bars-col').forEach(el => {
    el.style.minWidth = comboBarWidth + 'px';
    el.style.maxWidth = comboBarWidth + 'px';
  });
  const lbl = document.getElementById('comboZoomLabel');
  if (lbl) lbl.textContent = comboBarWidth;
}

function applyFilters() {
  filtered = COMBOS.filter(c => {
    if (typeCountFilter !== 'all' && c.t.length !== parseInt(typeCountFilter)) return false;
    if (activeTypes.size > 0) {
      if (filterMode==='any') return c.t.some(t => activeTypes.has(t));
      if (filterMode==='all') return [...activeTypes].every(t => c.t.includes(t));
      if (filterMode==='exact') return c.t.length === activeTypes.size && [...activeTypes].every(t => c.t.includes(t));
    }
    return true;
  });
  filtered.sort((a,b) => {
    if (currentSort==='alpha')      return a.key.localeCompare(b.key);
    if (currentSort==='wk-asc')     return a.se-b.se   || a.key.localeCompare(b.key);
    if (currentSort==='wk-desc')    return b.se-a.se   || a.key.localeCompare(b.key);
    if (currentSort==='res-desc')   return b.nve-a.nve || a.key.localeCompare(b.key);
    if (currentSort==='imm-desc')   return b.noEff-a.noEff || a.key.localeCompare(b.key);
    if (currentSort==='def-wk-asc')  return a.defWk-b.defWk || a.key.localeCompare(b.key);
    if (currentSort==='def-res-desc') return b.defRes-a.defRes || a.key.localeCompare(b.key);
    if (currentSort==='def-imm-desc') return b.defImm-a.defImm || a.key.localeCompare(b.key);
    if (currentSort==='vs-target') {
      const va = computeVsTarget(a, targetDefTypes) ?? 0;
      const vb = computeVsTarget(b, targetDefTypes) ?? 0;
      return vb - va || a.key.localeCompare(b.key);
    }    return 0;
  });
  updateStats();
  renderList();
}

function updateStats() {
  const n = filtered.length;
  document.getElementById('sCount').textContent = n;
  document.getElementById('resultCount').textContent = n + ' combination' + (n===1?'':'s');
  if (!n) { ['sWk','sRes','sImm'].forEach(id => document.getElementById(id).textContent='—'); return; }
  const avg = key => (filtered.reduce((s,c)=>s+c[key],0)/n).toFixed(1);
  document.getElementById('sWk').textContent = avg('se');
  document.getElementById('sRes').textContent = avg('nve');
  document.getElementById('sImm').textContent = avg('noEff');
}

function badges(types) {
  return types.map(t => `<span class="badge" style="background:${TYPE_COLORS[t]};color:${TYPE_TEXT[t]};display:inline-flex;align-items:center;gap:4px">${typeIcon(t,17)}${t}</span>`).join('');
}
function defBar(d) {
  return TYPES.map((t,i) => {
    const v=d[i], bg=MULT_BG(v), lbl=MULT_LABEL(v);
    return `<div class="def-cell" style="background:${bg}" title="${t}: ${v}×">${lbl}</div>`;
  }).join('');
}

function computeVsTarget(combo, defSlots) {
  const defTypes = defSlots.filter(Boolean);
  if (!defTypes.length) return null;
  return Math.max(...combo.t.map(atk =>
    Math.min(defTypes.reduce((mult, def) => mult * (chart[atk]?.[def] ?? 1), 1), 8)
  ));
}

const GRADES = [
  { g:'S', bg:'#2a1f50', color:'#c084fc', threshold:7,   desc:'Exceptional — strong offense AND defense' },
  { g:'A', bg:'#1a3a20', color:'#4ade80', threshold:3,   desc:'Great — excellent overall coverage' },
  { g:'B', bg:'#1a2e4a', color:'#6390f0', threshold:0.5, desc:'Good — solid with minor gaps' },
  { g:'C', bg:'#2a2a10', color:'#f7d02c', threshold:-4,  desc:'Average — workable but limited' },
  { g:'D', bg:'#3a2010', color:'#f97316', threshold:-7,  desc:'Below average — notable weaknesses' },
  { g:'F', bg:'#3a1010', color:'#f95587', threshold:-Infinity, desc:'Poor — heavily exposed or near-useless offense' },
];

function computeGrade(c) {
  let score = 0;
  c.d.forEach(v => { if(v>=2) score+=2; else if(v===0.5||v===0.25) score-=1; else if(v===0) score-=1.5; });
  c.dd.forEach(v => { if(v>=2) score-=2; else if(v===0.5||v===0.25) score+=1; else if(v===0) score+=2; });
  const n = TYPES.length / 18;
  return GRADES.find(gr => score >= gr.threshold * n);
}

function bestWorst(vals, mode) {
  // offense: find highest val types; defense: find lowest val (best resist) and highest (worst weak)
  if (mode === 'atk') {
    const maxV = Math.max(...vals);
    if (maxV <= 1) return null;
    return { label: 'Best', val: maxV+'×', types: TYPES.filter((_,i) => vals[i] === maxV) };
  } else {
    const minV = Math.min(...vals.filter(v => v > 0));
    const maxV = Math.max(...vals);
    return {
      best: minV < 1 ? { val: MULT_LABEL(minV)+'×', types: TYPES.filter((_,i) => vals[i] === minV) } : null,
      worst: maxV > 1 ? { val: MULT_LABEL(maxV)+'×', types: TYPES.filter((_,i) => vals[i] === maxV) } : null,
    };
  }
}

function renderList() {
  const el = document.getElementById('comboList');
  if (!filtered.length) { el.innerHTML='<div class="no-results">No combinations match your filters.</div>'; return; }

  // Pinned combos float to top, rest preserve filter order
  const sorted = [...filtered].sort((a, b) => {
    const ap = pinnedCombos.has(a.key) ? -1 : 0;
    const bp = pinnedCombos.has(b.key) ? -1 : 0;
    return ap - bp;
  });
  const firstUnpinnedIdx = sorted.findIndex(c => !pinnedCombos.has(c.key));

  el.innerHTML = sorted.map((c, listIdx) => {
      const gi = c.gi;
      const sel = selectedComboIdx===gi ? 'selected' : '';
      const isPinned = pinnedCombos.has(c.key);
      const tcLabel = c.t.length===1?'1T':c.t.length===2?'2T':'3T';
      const tcColor = c.t.length===1?'#6390F0':c.t.length===2?'#7AC74C':'#F95587';
      const isCompareB = compareComboB === gi;
      const compareMode = detActiveTab === 'compare' && selectedComboIdx !== null;
      const grade = computeGrade(c);
      const vsTarget = targetDefTypes.some(Boolean) ? computeVsTarget(c, targetDefTypes) : null;
      const vsTargetBg = vsTarget !== null ? MULT_BG(vsTarget) : '';
      const vsTargetLbl = vsTarget !== null ? (MULT_LABEL(vsTarget) || '1') + '×' : '';
      const divider = (pinnedCombos.size > 0 && listIdx === firstUnpinnedIdx)
        ? `<div style="height:1px;background:rgba(247,208,44,0.35);margin:2px 10px;"></div>` : '';

      return divider + `<div class="combo-row ${sel}${isPinned?' pinned':''}${isCompareB&&!isPinned?' pinned':''}${compareMode&&gi!==selectedComboIdx?' compare-selectable':''}" onclick="selectCombo(${gi})">
        <div class="left-col">
          <div class="left-top">
            <div class="grade-pip" style="background:${grade.bg};color:${grade.color}">${grade.g}</div>
            <span class="tc-pip" style="background:${tcColor}22;color:${tcColor}">${tcLabel}</span>
            <span onclick="togglePin(${gi},event)" title="${isPinned?'Unpin':'Pin to top'}" style="font-size:11px;cursor:pointer;opacity:${isPinned?1:0.35};transition:opacity 0.15s;margin-left:auto;line-height:1" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=${isPinned?1:0.35}">📌</span>
          </div>
          <div class="badges">${badges(c.t)}</div>
        </div>
        <div class="bars-col" style="min-width:${comboBarWidth}px;max-width:${comboBarWidth}px">
          <div class="bar-row">
            <span class="bar-lbl"></span>
            <div class="def-bar type-header-row">${TYPES.map(t=>`<div class="def-cell type-header-cell" style="background:transparent;color:${TYPE_COLORS[t]}">${t.slice(0,3)}</div>`).join('')}</div>
          </div>
          <div class="bar-row">
            <span class="bar-lbl" style="color:#f95587">ATK</span>
            <div class="def-bar">${defBar(c.d)}</div>
          </div>
          <div class="bar-row">
            <span class="bar-lbl" style="color:#6390f0">DEF</span>
            <div class="def-bar">${defBar(c.dd)}</div>
          </div>
          ${vsTarget !== null ? `<div class="bar-row" style="margin-top:2px;border-top:1px solid var(--border);padding-top:2px">
            <span class="bar-lbl" style="color:#f7d02c;font-size:0.55rem">🎯</span>
            <div style="flex:1;display:flex;align-items:center;gap:6px">
              <span style="font-size:10px;font-weight:800;padding:2px 10px;border-radius:3px;background:${vsTargetBg};color:${vsTarget===1?'var(--dim2)':'#fff'};min-width:32px;text-align:center">${vsTargetLbl}</span>
              <span style="font-size:9px;color:var(--dim);font-weight:600">vs ${targetDefTypes.filter(Boolean).map(t=>`<span style="color:${TYPE_COLORS[t]};font-weight:700">${t}</span>`).join('<span style="color:var(--dim)"> / </span>')}</span>
            </div>
          </div>` : ''}
        </div>
      </div>`;
    }).join('');
}

function selectCombo(gi, silent) {
  if (!silent) {
    // If in compare mode and clicking a different row, set it as combo B
    if (detActiveTab === 'compare' && selectedComboIdx !== null && gi !== selectedComboIdx) {
      selectComboB(gi);
      return;
    }
    if (selectedComboIdx === gi) { closeDetail(); return; }
    selectedComboIdx = gi;
    compareComboB = null; // reset compare when selecting new primary
    if (detActiveTab === 'compare') detActiveTab = 'offense';
  }
  renderList();
  document.getElementById('ttDetail').classList.add('open');
  renderDetailPanel();

}

function closeDetail() { selectedComboIdx = null; document.getElementById('ttDetail').classList.remove('open'); renderList(); }
function sidebarStartCompare() { // If already in compare mode, cancel it if (detActiveTab === 'compare') { clearCompare(); return; }
  // If no combo is selected, prompt user to pick one first
  if (selectedComboIdx === null) {
    showToast('Click a combo first to start comparing');
    return;
  }
  startCompare();
}

function updateSideCompareBtn() {
  const btn = document.getElementById('sideCompareBtn');
  if (!btn) return;
  if (detActiveTab === 'compare') {
    btn.style.borderColor = 'var(--accent)';
    btn.style.color = 'var(--accent)';
    btn.style.background = 'rgba(99,144,240,0.1)';
    btn.textContent = compareComboB !== null
      ? '⚡ Comparing — click to cancel'
      : '⚡ Now click a combo to compare…';
  } else {
    btn.style.borderColor = '';
    btn.style.color = '';
    btn.style.background = '';
    btn.textContent = '⚡ Select two combos to compare';
  }
}

function startCompare() {
  compareComboB = null;
  detActiveTab = 'compare';
  renderDetailPanel();
  renderList();
  updateSideCompareBtn();
}

function clearCompare() {
  compareComboB = null;
  detActiveTab = 'offense';
  renderDetailPanel();
  renderList();
  updateSideCompareBtn();
}

function selectComboB(gi) { compareComboB = gi; renderDetailPanel(); renderList(); updateSideCompareBtn(); }
function setDetTab(tab) { detActiveTab = tab; renderDetailPanel();  }
function setCmpSubtab(tab) { cmpSubtab = tab; renderDetailPanel(); }
function renderDetailPanel() {
  const el = document.getElementById('ttDetail');
  if (selectedComboIdx === null) return;
  const c = COMBOS[selectedComboIdx];
  const hasCompare = compareComboB !== null;
  if (detActiveTab === 'compare' && !hasCompare && compareComboB === null) {
    // stay on compare tab showing the "select B" prompt
  }

  const typeBadges = c.t.map(t => `<span class="badge" style="background:${TYPE_COLORS[t]};color:${TYPE_TEXT[t]};font-size:0.7rem;padding:4px 9px;display:inline-flex;align-items:center;gap:5px">${typeIcon(t,17)}${t}</span>`).join('');
  const tcLabel = c.t.length===1?'Mono':c.t.length===2?'Dual':'Triple';
  const tcColor = c.t.length===1?'#6390F0':c.t.length===2?'#7AC74C':'#F95587';
  const tabHtml = `<div class="det-tabs">
    <button class="det-tab${detActiveTab==='offense'?' active':''}" onclick="setDetTab('offense')">⚔️ ATTACK</button>
    <button class="det-tab${detActiveTab==='defense'?' active':''}" onclick="setDetTab('defense')">🛡 DEFENSE</button>
    <button class="det-tab${detActiveTab==='stats'?' active':''}" onclick="setDetTab('stats')">📊 STATS</button>
    <button class="det-tab${detActiveTab==='compare'?' active':''}" onclick="setDetTab('compare')" style="position:relative">
      ⚡ COMPARE${hasCompare?` <span style="position:absolute;top:4px;right:4px;width:6px;height:6px;background:#4ade80;border-radius:50%"></span>`:''}
    </button>
  </div>`;

  let bodyHtml = '';
  if (detActiveTab === 'offense') {
    bodyHtml += `<div class="det-quick-stats">
      <div class="det-stat"><div class="det-stat-val" style="color:#4ade80">${c.se}</div><div class="det-stat-lbl">Hits SE</div></div>
      <div class="det-stat"><div class="det-stat-val" style="color:#f95587">${c.nve}</div><div class="det-stat-lbl">NVE</div></div>
      <div class="det-stat"><div class="det-stat-val" style="color:#a98fff">${c.noEff}</div><div class="det-stat-lbl">No Effect</div></div>
    </div>`;
    bodyHtml += renderCovSections(c.d, 'offense');
  } else if (detActiveTab === 'defense') {
    bodyHtml += `<div class="det-quick-stats">
      <div class="det-stat"><div class="det-stat-val" style="color:#f95587">${c.defWk}</div><div class="det-stat-lbl">Weak To</div></div>
      <div class="det-stat"><div class="det-stat-val" style="color:#4ade80">${c.defRes}</div><div class="det-stat-lbl">Resists</div></div>
      <div class="det-stat"><div class="det-stat-val" style="color:#a98fff">${c.defImm}</div><div class="det-stat-lbl">Immune</div></div>
    </div>`;
    bodyHtml += renderCovSections(c.dd, 'defense');
  } else if (detActiveTab === 'stats') {
    bodyHtml += renderStatsTab(c);
  } else if (detActiveTab === 'compare') {
    bodyHtml += renderCompare(selectedComboIdx, compareComboB);
  }

  el.innerHTML = `
    <div class="det-header">
      <div class="det-type-badges">
        ${typeBadges}
        <span style="font-size:0.55rem;padding:3px 6px;border-radius:3px;background:${tcColor}22;color:${tcColor};font-weight:700;align-self:center">${tcLabel}</span>
      </div>
      <div class="det-actions">
        <button class="det-btn close-btn" onclick="closeDetail()" title="Close">✕</button>
      </div>
    </div>
    ${tabHtml}
    <div class="det-body">${bodyHtml}</div>
  `;
}

function renderStatsTab(c) {
  const grade = computeGrade(c);
  const atkBest = bestWorst(c.d, 'atk');
  const defInfo = bestWorst(c.dd, 'def');
  const pillRow = (types, max) => types.slice(0, max).map(t =>
    `<span class="callout-pill" style="background:${TYPE_COLORS[t]};color:${TYPE_TEXT[t]};display:inline-flex;align-items:center;gap:4px">${typeIcon(t,17)}${t}</span>`
  ).join('') + (types.length > max ? `<span style="color:var(--dim);font-size:0.5rem"> +${types.length-max}</span>` : '');

  const atkBestHtml = atkBest
    ? `<div class="callout"><span class="callout-icon" style="color:#4ade80">⚡ Best ATK</span><span style="color:#4ade80;font-weight:700;margin:0 4px">${atkBest.val}</span><div class="callout-types">${pillRow(atkBest.types, 6)}</div></div>`
    : `<div class="callout" style="color:#555">⚡ No SE coverage</div>`;

  const defBestHtml = defInfo && defInfo.best
    ? `<div class="callout"><span class="callout-icon" style="color:#4ade80">🛡 Best DEF</span><span style="color:#4ade80;font-weight:700;margin:0 4px">${defInfo.best.val}</span><div class="callout-types">${pillRow(defInfo.best.types, 6)}</div></div>`
    : '';

  const defWorstHtml = defInfo && defInfo.worst
    ? `<div class="callout"><span class="callout-icon" style="color:#f95587">⚠ Worst DEF</span><span style="color:#f95587;font-weight:700;margin:0 4px">${defInfo.worst.val}</span><div class="callout-types">${pillRow(defInfo.worst.types, 6)}</div></div>`
    : '';

  const gradeLegend = GRADES.map(gr => `
    <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
      <div style="background:${gr.bg};color:${gr.color};font-family:'Outfit',sans-serif;font-size:1.2rem;font-weight:800;width:40px;height:40px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${gr.g}</div>
      <div style="font-size:0.76rem;color:var(--dim2);line-height:1.6">${gr.desc}</div>
    </div>`).join('');

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;padding:12px;background:${grade.bg};border-radius:10px;border:1px solid ${grade.color}44">
      <div style="background:${grade.bg};color:${grade.color};font-family:'Outfit',sans-serif;font-size:2.6rem;font-weight:800;width:66px;height:66px;border-radius:14px;display:flex;align-items:center;justify-content:center;border:2px solid ${grade.color}66;flex-shrink:0">${grade.g}</div>
      <div>
        <div style="font-family:'Outfit',sans-serif;font-size:1.2rem;font-weight:800;color:${grade.color}">Grade ${grade.g}</div>
        <div style="font-size:0.76rem;color:var(--dim2);margin-top:4px">${GRADES.find(x=>x.g===grade.g).desc}</div>
      </div>
    </div>

    <div style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;color:var(--dim);margin-bottom:10px">Stats</div>
    <div class="stat-mini-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">
      <div class="stat-mini"><div class="stat-mini-val" style="color:#4ade80">${c.se}</div><div class="stat-mini-lbl">ATK SE</div></div>
      <div class="stat-mini"><div class="stat-mini-val" style="color:#f95587">${c.nve}</div><div class="stat-mini-lbl">ATK NVE</div></div>
      <div class="stat-mini"><div class="stat-mini-val" style="color:#a98fff">${c.noEff}</div><div class="stat-mini-lbl">ATK 0×</div></div>
      <div class="stat-mini"><div class="stat-mini-val" style="color:#f95587">${c.defWk}</div><div class="stat-mini-lbl">DEF Weak</div></div>
      <div class="stat-mini"><div class="stat-mini-val" style="color:#4ade80">${c.defRes}</div><div class="stat-mini-lbl">DEF Resist</div></div>
      <div class="stat-mini"><div class="stat-mini-val" style="color:#a98fff">${c.defImm}</div><div class="stat-mini-lbl">DEF Immune</div></div>
    </div>

    <div style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;color:var(--dim);margin-bottom:10px">Matchup Highlights</div>
    <div class="callouts" style="margin-bottom:16px;gap:7px">
      ${atkBestHtml}
      ${defBestHtml}
      ${defWorstHtml}
    </div>

    <div style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;color:var(--dim);margin-bottom:8px">Grade Legend</div>
    ${gradeLegend}
  `;
}

function renderCovSections(vals, mode) {
  const groups = {};
  TYPES.forEach((t, i) => { const v = vals[i]; (groups[v] = groups[v]||[]).push(t); });

  const labels = {
    offense: { 8:'💥 8× Super Effective', 4:'💥 4× Super Effective', 2:'⬆ 2× Super Effective', 0.5:'⬇ ½× Not Very Effective', 0.25:'⬇⬇ ¼× Barely Effective', 0.125:'⬇⬇⬇ ⅛× Almost Nothing', 0:'✕ No Effect' },
    defense: { 8:'💀 8× Weakness!', 4:'💀 4× Weakness', 2:'⚠ 2× Weak', 0.5:'✅ ½× Resists', 0.25:'✅ ¼× Strongly Resists', 0.125:'✅ ⅛× Near Immune', 0:'🛡 Immune' }
  };
  const colors = {
    offense: { 8:'#1aaa66', 4:'#4ade80', 2:'#f7d02c', 0.5:'#f95587', 0.25:'#c44', 0.125:'#922', 0:'#555' },
    defense: { 8:'#ff4444', 4:'#f95587', 2:'#f7d02c', 0.5:'#4ade80', 0.25:'#4ade80', 0.125:'#4ade80', 0:'#a98fff' }
  };
  const covSection = (types, col, lbl, alpha='28') => `<div class="cov-section">
    <div class="cov-section-hdr" style="color:${col}">${lbl}</div>
    <div class="cov-type-list">${types.map(t=>`<span class="cov-pill" style="background:${TYPE_COLORS[t]}${alpha};color:${alpha==='28'?TYPE_COLORS[t]:TYPE_COLORS[t]+'88'};display:inline-flex;align-items:center;gap:5px"${alpha==='28'?` onclick="selectType('${t}')"`:''}>${typeIcon(t,16)}${t}</span>`).join('')}</div>
  </div>`;

  let html = [8, 4, 2, 0.5, 0.25, 0.125, 0].filter(v => groups[v]?.length)
    .map(v => covSection(groups[v], colors[mode][v], labels[mode][v])).join('');
  if (groups[1]?.length) html += covSection(groups[1], '#444', '— Neutral (1×)', '18');
  return html;
}

function renderCompare(idxA, idxB) {
  const comboBadges = combo => combo.t.map(t=>`<span class="badge" style="background:${TYPE_COLORS[t]};color:${TYPE_TEXT[t]};display:inline-flex;align-items:center;gap:4px">${typeIcon(t,17)}${t}</span>`).join('');
  const a = COMBOS[idxA];
  const slotA = `<div style="flex:1;background:var(--surface2);border:1px solid var(--accent);border-radius:8px;padding:8px 10px">
    <div style="font-size:0.5rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:5px">SLOT A</div>
    <div style="display:flex;gap:4px;flex-wrap:wrap">${comboBadges(a)}</div>
  </div>`;

  if (idxB === null) {
    return `
      <div style="display:flex;gap:8px;margin-bottom:16px">
        ${slotA}
        <div style="flex:1;background:var(--surface2);border:2px dashed #333;border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px">
          <div style="font-size:0.5rem;letter-spacing:0.1em;text-transform:uppercase;color:#555;font-weight:700">SLOT B</div>
          <div style="font-size:1.4rem;opacity:0.3">👆</div>
          <div style="font-size:0.62rem;color:#555;text-align:center;line-height:1.6">Click any combo<br>from the list</div>
        </div>
      </div>
      <div style="font-size:0.62rem;color:#444;text-align:center;padding:20px;border:1px solid var(--border);border-radius:8px;line-height:1.8">
        The list is now in <span style="color:var(--accent);font-weight:700">compare mode</span>.<br>
        Click a second type combination to compare it against <span style="color:var(--accent);font-weight:700">${a.t.join('/')}</span>.
      </div>`;
  }

  const b = COMBOS[idxB];
  const slotB = `<div style="flex:1;background:var(--surface2);border:1px solid var(--yellow);border-radius:8px;padding:8px 10px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
      <div style="font-size:0.5rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--yellow);font-weight:700">SLOT B</div>
      <span onclick="clearCompare()" style="font-size:0.5rem;color:#555;cursor:pointer;padding:1px 5px;border:1px solid #333;border-radius:3px;font-family:inherit">✕ clear</span>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap">${comboBadges(b)}</div>
  </div>`;

  const subtabHtml = `<div class="compare-subtabs" style="margin-bottom:10px">
    <button class="cmp-subtab${cmpSubtab==="offense"?" active":""}" onclick="setCmpSubtab('offense')">⚔️ Attack</button>
    <button class="cmp-subtab${cmpSubtab==="defense"?" active":""}" onclick="setCmpSubtab('defense')">🛡 Defense</button>
  </div>`;

  const valsA = cmpSubtab==='offense' ? a.d : a.dd;
  const valsB = cmpSubtab==='offense' ? b.d : b.dd;
  const rows = TYPES.map((t, i) => {
    const va = valsA[i], vb = valsB[i];
    const la = MULT_LABEL(va)||'1', lb = MULT_LABEL(vb)||'1';
    const bgA = MULT_BG(va), bgB = MULT_BG(vb);
    const txtA = MULT_TEXT(va)==='transparent'?'#666':'#fff';
    const txtB = MULT_TEXT(vb)==='transparent'?'#666':'#fff';
    let clsA = 'cmp-same', clsB = 'cmp-same';
    if (cmpSubtab==='offense') {
      if (va > vb) clsA = 'cmp-better'; else if (vb > va) clsB = 'cmp-better';
    } else {
      if (va < vb) clsA = 'cmp-better'; else if (vb < va) clsB = 'cmp-better';
    }
    return `<tr>
      <td class="type-col" style="color:${TYPE_COLORS[t]}">${t}</td>
      <td><span class="cmp-val ${clsA}" style="background:${bgA};color:${txtA}">${la}×</span></td>
      <td><span class="cmp-val ${clsB}" style="background:${bgB};color:${txtB}">${lb}×</span></td>
    </tr>`;
  }).join('');

  return `
    <div style="display:flex;gap:8px;margin-bottom:12px">${slotA}${slotB}</div>
    ${subtabHtml}
    <div style="overflow-y:auto">
      <table class="cmp-table">
        <thead><tr>
          <th class="type-col">Type</th>
          <th style="color:var(--accent)">A</th>
          <th style="color:var(--yellow)">B</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

