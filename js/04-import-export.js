function openRefCardModal() { document.getElementById('refCardModal').style.display = 'flex'; renderRefCard(); }
function closeRefCardModal() { document.getElementById('refCardModal').style.display = 'none'; }
function setRefCardGen(gen) {
  refCardGen = gen;
  ['current',1,2,6].forEach(g => {
    const btn = document.getElementById('rcBtn-'+g);
    if (!btn) return;
    const active = g === gen;
    btn.style.borderColor = active ? '#4ade80' : '#555';
    btn.style.color = active ? '#4ade80' : '#999';
    btn.style.background = active ? 'rgba(74,222,128,0.15)' : 'none';
  });
  renderRefCard();
}

let refCardDark = false;

function renderRefCard() {
  const el = document.getElementById('refCardContent');
  if (!el) return;

  const RC_PRESETS = { current:[TYPES,chart], 1:[GEN1_TYPES,GEN1_CHART], 2:[GEN2_5_TYPES,GEN2_5_CHART], 6:[ORIGINAL_18,DEFAULT_CHART] };
  const [rcTypes, rcChart] = RC_PRESETS[refCardGen] || RC_PRESETS.current;

  const dark = refCardDark;
  const BG       = dark ? '#0d0d14' : '#ffffff';
  const TEXT     = dark ? '#e0e0e0' : '#1a1a2e';
  const DIM      = dark ? '#666'    : '#888';
  const NEUTRAL  = dark ? '#1e1e32' : '#e2e4ef';

  // Cell colors — same vivid palette in both modes
  const bg = v => v===0?(dark?'#1a1a4a':'#c0c4dc'):v===0.5?(dark?'#7a1830':'#d44060'):v===2?(dark?'#1a5c3a':'#2e8c58'):v===4?(dark?'#0d4a2e':'#1a7a50'):v===8?(dark?'#003a22':'#0d6640'):NEUTRAL;
  const fg = v => v===0?(dark?'#6070c0':'#8090c0'):v===0.5?'#fff':v===2?'#fff':v===4?'#fff':v===8?'#fff':'transparent';
  const lbl = v => v===0?'0':v===0.5?'½':v===2?'2':v===4?'4':v===8?'8':'';
  const CELL_SIZE = 30;
  const LABEL_W   = 76;
  const COL_HDR_H = 58; // height for column headers (rotated text needs space)
  const TITLE_H   = 44;
  const LEGEND_H  = 28;
  const AXIS_W    = 18;
  const PAD       = 10;
  const gridW = rcTypes.length * CELL_SIZE;
  const gridH = rcTypes.length * CELL_SIZE;
  const totalW = PAD + AXIS_W + LABEL_W + gridW + PAD;
  const totalH = PAD + TITLE_H + COL_HDR_H + gridH + LEGEND_H + PAD;
  const gridX = PAD + AXIS_W + LABEL_W;
  const gridY = PAD + TITLE_H + COL_HDR_H;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="100%" style="font-family:'JetBrains Mono',monospace;display:block;max-height:85vh">`;
  svg += `<rect width="${totalW}" height="${totalH}" fill="${BG}"/>`;

  // Title
  const genLabel = refCardGen==='current'?'Custom Chart':refCardGen===1?'Gen 1 (RBY)':refCardGen===2?'Gen 2–5':'Gen 6+';
  svg += `<text x="${PAD}" y="${PAD+14}" font-size="13" font-weight="800" fill="${TEXT}">Pokémon Type Chart · ${genLabel}</text>`;
  svg += `<text x="${PAD}" y="${PAD+28}" font-size="9" fill="${DIM}">Rows = Attacking type  ·  Columns = Defending type</text>`;

  // DEFENDING → label
  svg += `<text x="${gridX + gridW/2}" y="${PAD + TITLE_H - 2}" font-size="9" font-weight="700" fill="${DIM}" text-anchor="middle">DEFENDING →</text>`;

  // Column headers — dot + rotated label
  rcTypes.forEach((t, ci) => {
    const cx = gridX + ci * CELL_SIZE + CELL_SIZE/2;
    const dotY = PAD + TITLE_H + 10;
    const color = TYPE_COLORS[t] || '#888';
    svg += `<circle cx="${cx}" cy="${dotY}" r="6" fill="${color}"/>`;
    const txtX = cx;
    const txtY = dotY + 14;
    svg += `<text x="${txtX}" y="${txtY + 28}" font-size="8" font-weight="700" fill="${color}" text-anchor="end" transform="rotate(-60,${txtX},${txtY})">${t.slice(0,4).toUpperCase()}</text>`;
  });

  // ATTACKING ↓ label (rotated)
  const axisX = PAD + 8;
  const axisY = gridY + gridH / 2;
  svg += `<text x="${axisX}" y="${axisY}" font-size="9" font-weight="700" fill="${DIM}" text-anchor="middle" transform="rotate(-90,${axisX},${axisY})">ATTACKING ↓</text>`;

  // Rows
  rcTypes.forEach((atk, ri) => {
    const ry = gridY + ri * CELL_SIZE;
    const color = TYPE_COLORS[atk] || '#888';
    const txtFg = TYPE_TEXT[atk] || '#fff';

    // Row label
    svg += `<rect x="${PAD + AXIS_W}" y="${ry + 1}" width="${LABEL_W - 2}" height="${CELL_SIZE - 2}" fill="${color}" rx="3"/>`;
    svg += `<text x="${PAD + AXIS_W + 6}" y="${ry + CELL_SIZE/2 + 4}" font-size="9" font-weight="800" fill="${txtFg}">${atk.toUpperCase()}</text>`;

    // Cells
    rcTypes.forEach((def, ci) => {
      const cx = gridX + ci * CELL_SIZE;
      const v = rcChart[atk]?.[def] ?? 1;
      svg += `<rect x="${cx+1}" y="${ry+1}" width="${CELL_SIZE-2}" height="${CELL_SIZE-2}" fill="${bg(v)}" rx="2"/>`;
      if (lbl(v)) svg += `<text x="${cx + CELL_SIZE/2}" y="${ry + CELL_SIZE/2 + 4}" font-size="10" font-weight="800" fill="${fg(v)}" text-anchor="middle">${lbl(v)}</text>`;
    });
  });

  // Legend
  const ly = gridY + gridH + 8;
  const items = [{v:2,l:'2× Super Effective'},{v:0.5,l:'½× Not Very Effective'},{v:0,l:'0× Immune'},{v:1,l:'1× Neutral'}];
  let lx = PAD;
  items.forEach(({v, l}) => {
    svg += `<rect x="${lx}" y="${ly}" width="${CELL_SIZE-2}" height="${CELL_SIZE-2}" fill="${bg(v)}" rx="2"/>`;
    if (lbl(v)) svg += `<text x="${lx + CELL_SIZE/2 - 1}" y="${ly + CELL_SIZE/2 + 3}" font-size="10" font-weight="800" fill="${fg(v)}" text-anchor="middle">${lbl(v)}</text>`;
    svg += `<text x="${lx + CELL_SIZE + 4}" y="${ly + CELL_SIZE/2 + 3}" font-size="9" fill="${DIM}">${l}</text>`;
    lx += 150;
  });

  svg += `</svg>`;

  el.style.background = BG;
  el.innerHTML = svg;

  // Update dark mode toggle button label
  const dmBtn = document.getElementById('rcDarkBtn');
  if (dmBtn) dmBtn.textContent = dark ? '☀️ Light' : '🌙 Dark';
}

function exportRefCardPNG() {
  exportPNG(document.getElementById('refCardContent'), 'type-chart-reference.png',
    { backgroundColor: refCardDark ? '#0d0d14' : '#ffffff', scale: 2.5 });
}


function openCodeExportModal() { document.getElementById('codeExportModal').style.display = 'flex'; refreshCodeExport(); }
function closeCodeExportModal() { document.getElementById('codeExportModal').style.display = 'none'; }
function generateCode(format) {
  const T = TYPES;
  const toTypeName = t => 'TYPE_' + t.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const mult = (atk, def) => chart[atk]?.[def] ?? 1;
  const effToMacro = v => {
    if (v === 0)   return 'X(0.0)';
    if (v === 0.5) return 'X(0.5)';
    if (v === 2)   return 'X(2.0)';
    if (v === 4)   return 'X(4.0)';
    return '______';
  };

  if (format === 'pokeemerald') {
    const maxLen = Math.max(...T.map(t => toTypeName(t).length));
    const colWidth = 8; // width of each cell including comma+space
    // Header comment line
    const defHeader = T.map(t => t.slice(0,4).padEnd(colWidth)).join('');
    let out = `const uq4_12_t gTypeEffectivenessTable[NUMBER_OF_MON_TYPES][NUMBER_OF_MON_TYPES] =\n`;
    out += `{//                   Defender -->\n`;
    out += ` //  Attacker        `;
    out += T.map(t => t.slice(0,7).padEnd(colWidth)).join('') + '\n';
    T.forEach(atk => {
      const label = `    [${toTypeName(atk)}]`.padEnd(maxLen + 8);
      const cells = T.map(def => {
        const v = mult(atk, def);
        return effToMacro(v).padEnd(colWidth - 2) + ', ';
      }).join('');
      out += `${label} = {${cells.trimEnd().replace(/,$/, '')}},\n`;
    });
    out += `};\n`;
    return out;
  }

  if (format === 'hexmaniac') {
    // GBA type effectiveness table format used by HexManiacAdvance / FireRed / Emerald
    // Each non-neutral entry is 3 bytes: [attacker_id][defender_id][effectiveness]
    // Effectiveness encoding: 0x00 = immune, 0x05 = 0.5x NVE, 0x14 = 2x SE
    // Terminated by: FE FE 00 (foresight separator) then FF FF 00 (end marker)
    // Type IDs follow standard GBA order for base types, then custom types appended

    const GBA_TYPE_ORDER = ["Normal","Fighting","Flying","Poison","Ground","Rock","Bug","Ghost","Steel",
      "Fire","Water","Grass","Electric","Psychic","Ice","Dragon","Dark","Fairy"];
    // Build full type list: GBA order first, then any custom types
    const ORIGINAL_18 = ["Normal","Fire","Water","Electric","Grass","Ice","Fighting","Poison","Ground",
      "Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy"];
    const customTypes = TYPES.filter(t => !ORIGINAL_18.includes(t));
    const orderedTypes = [...GBA_TYPE_ORDER.filter(t => TYPES.includes(t)), ...customTypes];
    const typeId = {};
    orderedTypes.forEach((t, i) => { typeId[t] = i; });

    const effByte = v => {
      if (v === 0)   return 0x00;
      if (v === 0.5) return 0x05;
      if (v === 2)   return 0x14;
      if (v === 4)   return 0x28; // Gen 1 quirk, rare
      return null; // neutral — omit
    };

    const entries = [];
    TYPES.forEach(atk => {
      TYPES.forEach(def => {
        const v = chart[atk]?.[def] ?? 1;
        const b = effByte(v);
        if (b !== null) entries.push([typeId[atk] ?? 0, typeId[def] ?? 0, b]);
      });
    });

    // Build hex dump output (text format readable by HexManiacAdvance table editor)
    let out = `// HexManiacAdvance — GBA Type Effectiveness Table\n`;
    out += `// Paste this into your table at the type chart offset\n`;
    out += `// Format: [Attacker ID] [Defender ID] [Effectiveness]\n`;
    out += `// 0x00=immune  0x05=0.5x(NVE)  0x14=2x(SE)\n\n`;
    out += `// Type ID mapping:\n`;
    orderedTypes.forEach((t, i) => {
      out += `//   0x${i.toString(16).padStart(2,'0').toUpperCase()} = ${t}\n`;
    });
    out += `\n// --- Table entries (omits neutral 1x) ---\n`;
    entries.forEach(([a, d, e]) => {
      out += `${a.toString(16).padStart(2,'0').toUpperCase()} ${d.toString(16).padStart(2,'0').toUpperCase()} ${e.toString(16).padStart(2,'0').toUpperCase()}  // ${orderedTypes[a]} vs ${orderedTypes[d]}: ${e===0?'0x (immune)':e===0x05?'0.5x (NVE)':e===0x14?'2x (SE)':'4x'}\n`;
    });
    out += `FE FE 00  // Foresight/Scrappy separator\n`;
    out += `FF FF 00  // End of table\n\n`;
    out += `// Total non-neutral entries: ${entries.length}\n`;
    out += `// Table size: ${(entries.length + 2) * 3} bytes\n`;
    return out;
  }

  if (format === 'simple') {
    let out = `// Type Effectiveness Table — generated by Pokémon Type Chart\n`;
    out += `// Rows = Attacker, Cols = Defender\n`;
    out += `// Values: 0=immune, 50=NVE, 100=neutral, 200=SE\n\n`;
    out += `const int typeChart[${T.length}][${T.length}] = {\n`;
    T.forEach((atk, ai) => {
      const cells = T.map(def => {
        const v = mult(atk, def);
        return String(Math.round(v * 100)).padStart(4);
      }).join(',');
      out += `    {${cells} }${ai < T.length-1 ? ',' : ''}\n`;
    });
    out += `};\n\n`;
    out += `// Type names in order:\n`;
    out += `// ` + T.map((t,i) => `[${i}]=${t}`).join(', ') + '\n';
    return out;
  }

  if (format === 'csharp') {
    let out = `// Type Effectiveness Table — generated by Pokémon Type Chart\n`;
    out += `public static readonly float[,] TypeChart = new float[${T.length}, ${T.length}] {\n`;
    T.forEach((atk, ai) => {
      const cells = T.map(def => String(mult(atk, def)).padStart(5)).join(',');
      out += `    {${cells} }${ai < T.length-1 ? ',' : ''}\n`;
    });
    out += `};\n\n`;
    out += `public static readonly string[] TypeNames = { ${T.map(t => `"${t}"`).join(', ')} };\n`;
    return out;
  }

  if (format === 'python') {
    let out = `# Type Effectiveness Table — generated by Pokémon Type Chart\n`;
    out += `TYPE_CHART = {\n`;
    T.forEach(atk => {
      out += `    "${atk}": {\n`;
      T.forEach(def => {
        const v = mult(atk, def);
        if (v !== 1) out += `        "${def}": ${v},\n`;
      });
      out += `    },\n`;
    });
    out += `}\n`;
    return out;
  }

  if (format === 'json_flat') {
    const obj = {};
    T.forEach(atk => {
      obj[atk] = {};
      T.forEach(def => { obj[atk][def] = mult(atk, def); });
    });
    return JSON.stringify(obj, null, 2);
  }

  return '';
}

function refreshCodeExport() {
  const fmt = document.getElementById('codeFormatSelect').value;
  document.getElementById('codeExportContent').textContent = generateCode(fmt);
}

function copyCodeExport() {
  const txt = document.getElementById('codeExportContent').textContent;
  navigator.clipboard.writeText(txt).then(() => showToast('Copied to clipboard!'));
}

function downloadCodeExport() {
  const fmt = document.getElementById('codeFormatSelect').value;
  const txt = document.getElementById('codeExportContent').textContent;
  const ext = {python:'py', json_flat:'json', csharp:'cs', hexmaniac:'txt'}[fmt] || 'c';
  downloadBlob(txt, `type-chart.${ext}`, 'text/plain');
  showToast(`Downloaded type-chart.${ext}`);
}

function exportCSV() {
  const rows = [['ATK \\ DEF', ...TYPES], ...TYPES.map(atk => [atk, ...TYPES.map(def => chart[atk][def])])];
  downloadBlob(rows.map(r=>r.join(',')).join('\n'), 'type-chart.csv', 'text/csv');
  showToast('CSV exported — ' + TYPES.length + '×' + TYPES.length + ' matrix');
}

function resetState() {
  changes = []; selectedType = null;
  moveSlots = [null, null, null, null];
  targetDefTypes = [null, null, null];
  for (let i = 0; i < 6; i++) { teamSlots[i] = [null, null, null]; teamSlotNames[i] = null; }
}
function closeRandomizeModal() { document.getElementById('randomizeModal').style.display = 'none'; }
function applyRandomize() {
  const g = id => document.getElementById(id);
  const scope      = document.querySelector('input[name="randScope"]:checked')?.value || 'all';
  const neutralPct = Math.max(0,Math.min(100,parseInt(g('randNeutralPct').value)||0)) / 100;
  const immunePct  = Math.max(0,Math.min(100,parseInt(g('randImmunePct').value)||0)) / 100;
  const maxWeakness = g('randMaxWeakness').checked;
  const maxWeak     = parseInt(g('randMaxWeaknessSlider').value);
  const symmetric   = g('randSymmetric').checked;
  const half = Math.max(0, 1 - neutralPct - immunePct) / 2;
  const randVal = () => { const r=Math.random(); return r<neutralPct?1:r<neutralPct+immunePct?0:r<neutralPct+immunePct+half?0.5:2; };

  pushHistory();
  const pool = scope==='custom' ? TYPES.filter(t=>!ORIGINAL_18.includes(t)) : TYPES;
  const changedSet = scope==='changed' ? new Set(changes.map(c=>`${c.atk}|${c.def}`)) : null;

  pool.forEach(atk => pool.forEach(def => {
    if (changedSet && !changedSet.has(`${atk}|${def}`)) return;
    const v = randVal(); chart[atk][def] = v;
    if (symmetric) chart[def][atk] = v;
  }));

  if (maxWeakness) {
    TYPES.forEach(def => {
      const weak = TYPES.filter(atk => chart[atk]?.[def] >= 2);
      while (weak.length > maxWeak) { const pick = weak.splice(Math.floor(Math.random()*weak.length),1)[0]; chart[pick][def]=1; if(symmetric) chart[def][pick]=1; }
    });
  }

  const base = baselineChart || DEFAULT_CHART;
  changes = [];
  TYPES.forEach(atk => TYPES.forEach(def => {
    const orig = base[atk]?.[def] ?? 1;
    if (chart[atk][def] !== orig) changes.push({ atk, def, from:orig, to:chart[atk][def] });
  }));

  closeRandomizeModal(); commit();
  showToast(`🎲 Randomized — ${changes.length} cells changed`);
}

function savePreset() {
  const data = { _format:"pokemon-type-chart-preset", _version:1, _exported:new Date().toISOString(), chart:buildMatrix(), customTypes:customTypeMeta() };
  downloadBlob(JSON.stringify(data, null, 2), "type-chart-preset.json");
  showToast("Preset saved — share this file for a clean import");
}

function exportJSON() {
  const data = { _format:"pokemon-type-chart-custom", _version:3, _exported:new Date().toISOString(), changes, chart:buildMatrix(), customTypes:customTypeMeta() };
  downloadBlob(JSON.stringify(data, null, 2), "type-chart-custom.json");
  showToast("Exported " + changes.length + " change(s) to JSON");
}

function importJSON(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.chart && !Array.isArray(data.changes)) { showToast("Invalid file"); return; }
      // Strip then restore custom types
      TYPES.filter(t => !ORIGINAL_18.includes(t)).forEach(t => {
        TYPES.splice(TYPES.indexOf(t), 1); delete TYPE_COLORS[t]; delete TYPE_TEXT[t];
      });
      (data.customTypes || []).forEach(ct => {
        if (ct.name && !TYPES.includes(ct.name)) {
          TYPES.push(ct.name);
          TYPE_COLORS[ct.name] = ct.color || '#888';
          TYPE_TEXT[ct.name] = getContrastText(ct.color || '#888');
        }
      });
      const isPreset = data._format === 'pokemon-type-chart-preset';
      if (isPreset) {
        chart = deepCopy(data.chart); baselineChart = deepCopy(data.chart);
        changes = []; selectedType = null; commit(); buildChips();
        showToast("Preset loaded — chart is now your clean baseline" + (data.customTypes?.length ? ` (${data.customTypes.length} custom type(s))` : ''));
      } else {
        const srcChart = (data.chart && typeof data.chart === 'object') ? data.chart : DEFAULT_CHART;
        chart = deepCopy(srcChart);
        const base = deepCopy(srcChart);
        changes = (data.changes || []).filter(c => c.atk && c.def && c.to !== undefined).map(c => ({
          ...c, from: (c.from != null) ? c.from : (DEFAULT_CHART[c.atk]?.[c.def] ?? 1)
        }));
        changes.forEach(c => { if (base[c.atk]) base[c.atk][c.def] = c.from ?? 1; });
        baselineChart = base;
        if (!data.chart) changes.forEach(c => { if (chart[c.atk]) chart[c.atk][c.def] = c.to; });
        selectedType = null; commit(); buildChips();
        showToast("Imported " + changes.length + " change(s)" + (data.customTypes?.length ? ` + ${data.customTypes.length} custom type(s)` : ''));
      }
    } catch(err) { showToast("Failed to parse file"); }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function applyImportedChart(newChart, newTypes) {
  // Keep existing colors for known types, assign defaults for unknowns
  const DEFAULT_COLORS = {Normal:'#A8A878',Fire:'#EE8130',Water:'#6390F0',Electric:'#F7D02C',Grass:'#7AC74C',Ice:'#96D9D6',Fighting:'#C22E28',Poison:'#A33EA1',Ground:'#E2BF65',Flying:'#A98FF3',Psychic:'#F95587',Bug:'#A6B91A',Rock:'#B6A136',Ghost:'#735797',Dragon:'#6F35FC',Dark:'#705746',Steel:'#B7B7CE',Fairy:'#D685AD'};
  newTypes.forEach(t => {
    if (!TYPE_COLORS[t]) TYPE_COLORS[t] = DEFAULT_COLORS[t] || '#888888';
    if (!TYPE_TEXT[t]) TYPE_TEXT[t] = getContrastText(TYPE_COLORS[t]);
  });
  TYPES.length = 0;
  newTypes.forEach(t => TYPES.push(t));
  chart = newChart;
  baselineChart = deepCopy(newChart);
  resetState();
  commit(); buildChips();
}

function openRandomizeModal() { document.getElementById('randomizeModal').style.display = 'flex'; }
function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const lines = e.target.result.trim().split('\n')
        .map(l => l.split(',').map(s => s.trim().replace(/^"|"$/g, '')));
      // First row: corner label + defender type names
      const defTypes = lines[0].slice(1).filter(Boolean);
      if (!defTypes.length) { showToast('Invalid CSV — no type headers found', true); return; }
      const newChart = {};
      const newTypes = [];
      lines.slice(1).forEach(row => {
        const atk = row[0];
        if (!atk) return;
        newTypes.push(atk);
        newChart[atk] = {};
        defTypes.forEach((def, i) => {
          const raw = row[i + 1];
          const v = parseFloat(raw);
          newChart[atk][def] = isNaN(v) ? 1 : v;
        });
      });
      if (!newTypes.length) { showToast('Invalid CSV — no data rows', true); return; }
      // Ensure all types have full rows/cols (fill missing with 1)
      newTypes.forEach(atk => {
        newTypes.forEach(def => { if (newChart[atk][def] === undefined) newChart[atk][def] = 1; });
      });
      applyImportedChart(newChart, newTypes);
      showToast(`CSV imported — ${newTypes.length}×${newTypes.length} matrix`);
    } catch(err) { showToast('Failed to parse CSV', true); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function openCodeImportModal() {
  document.getElementById('codeImportModal').style.display = 'flex';
  document.getElementById('codeImportText').value = '';
  document.getElementById('codeImportDetected').textContent = '';
}
function closeCodeImportModal() { document.getElementById('codeImportModal').style.display = 'none'; }
function detectCodeImportFormat(text) {
  if (!text) return null;
  const t = text.trim();
  if (/TYPE_CHART\s*=\s*\{/.test(t)) return 'python';
  if (/gTypeEffectivenessTable/.test(t) || /X\(0\.0\)|X\(2\.0\)|X\(0\.5\)/.test(t)) return 'pokeemerald';
  if (/HexManiacAdvance|FF FF 00|FE FE 00/.test(t)) return 'hexmaniac';
  if (/TypeChart\s*=\s*new\s*float/.test(t) || /TypeNames/.test(t)) return 'csharp';
  if (/const int typeChart/.test(t)) return 'simple_c';
  if (/^\s*\{/.test(t) && t.includes('"')) return 'json_flat';
  return null;
}

function onCodeImportInput() {
  const text = document.getElementById('codeImportText').value;
  const fmt = detectCodeImportFormat(text);
  const el = document.getElementById('codeImportDetected');
  const labels = { python:'Python dict', pokeemerald:'pokeemerald C', hexmaniac:'HexManiacAdvance', csharp:'C# array', simple_c:'Simple C array', json_flat:'JSON flat' };
  el.textContent = fmt ? `Detected: ${labels[fmt]}` : '';
}

function applyCodeImport() {
  const text = document.getElementById('codeImportText').value.trim();
  if (!text) { showToast('Nothing to import', true); return; }
  const fmt = detectCodeImportFormat(text);
  if (!fmt) { showToast('Could not detect format', true); return; }

  try {
    let newChart = {}, newTypes = [];

    if (fmt === 'json_flat') {
      const obj = JSON.parse(text);
      newTypes = Object.keys(obj);
      newTypes.forEach(atk => {
        newChart[atk] = {};
        newTypes.forEach(def => { newChart[atk][def] = obj[atk]?.[def] ?? 1; });
      });
    }

    else if (fmt === 'python') {
      // Parse: "Atk": { "Def": val, ... }
      const atkBlocks = [...text.matchAll(/"([^"]+)"\s*:\s*\{([^}]*)\}/g)];
      atkBlocks.forEach(([, atk, body]) => {
        if (!newTypes.includes(atk)) newTypes.push(atk);
        newChart[atk] = newChart[atk] || {};
        [...body.matchAll(/"([^"]+)"\s*:\s*([\d.]+)/g)].forEach(([, def, val]) => {
          newChart[atk][def] = parseFloat(val);
        });
      });
      // Fill neutral for missing pairs
      newTypes.forEach(atk => newTypes.forEach(def => {
        if (newChart[atk][def] === undefined) newChart[atk][def] = 1;
      }));
    }

    else if (fmt === 'simple_c') {
      // Extract type name order from comment: // [0]=Normal, [1]=Fire ...
      const nameMatch = text.match(/\/\/\s*(\[0\]=\w.+)$/m);
      if (!nameMatch) { showToast('Cannot find type name list in C export', true); return; }
      newTypes = [...nameMatch[1].matchAll(/\[\d+\]=(\w+)/g)].map(m => m[1]);
      // Parse rows: {v, v, v ...}
      const rows = [...text.matchAll(/\/\*\s*(\w+)\s*\*\/\s*\{([^}]+)\}/g)];
      rows.forEach(([, atk, cells]) => {
        newChart[atk] = {};
        const vals = cells.split(',').map(s => parseInt(s.trim())).filter(v => !isNaN(v));
        newTypes.forEach((def, i) => { newChart[atk][def] = (vals[i] ?? 100) / 100; });
      });
    }

    else if (fmt === 'csharp') {
      // Extract type names: string[] TypeNames = { "Normal", "Fire", ... }
      const nameMatch = text.match(/TypeNames\s*=\s*\{([^}]+)\}/);
      if (!nameMatch) { showToast('Cannot find TypeNames in C# export', true); return; }
      newTypes = [...nameMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
      // Parse rows: {v, v, v ...}
      const rows = [...text.matchAll(/\/\*\s*(\w+)\s*\*\/\s*\{([^}]+)\}/g)];
      rows.forEach(([, atk, cells]) => {
        newChart[atk] = {};
        const vals = cells.split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v));
        newTypes.forEach((def, i) => { newChart[atk][def] = vals[i] ?? 1; });
      });
    }

    else if (fmt === 'pokeemerald') {
      // Extract type order from header comment: // Attacker   Normal  Fire  ...
      const headerMatch = text.match(/\/\/\s*Attacker\s+(.+)/);
      if (!headerMatch) { showToast('Cannot find type header in pokeemerald export', true); return; }
      // Parse rows: [TYPE_FIRE] = {X(2.0), ____,  ...}
      const rows = [...text.matchAll(/\[TYPE_(\w+)\]\s*=\s*\{([^}]+)\}/g)];
      rows.forEach(([, atkRaw]) => {
        const atk = atkRaw.charAt(0) + atkRaw.slice(1).toLowerCase();
        if (!newTypes.includes(atk)) newTypes.push(atk);
      });
      // Use TYPES order if available, otherwise derived order
      if (!newTypes.length) { showToast('No type rows found in pokeemerald export', true); return; }
      rows.forEach(([, atkRaw, cells]) => {
        const atk = atkRaw.charAt(0) + atkRaw.slice(1).toLowerCase();
        newChart[atk] = {};
        const macros = cells.split(',').map(s => s.trim());
        newTypes.forEach((def, i) => {
          const m = macros[i] || '______';
          const v = m.includes('X(0.0)') ? 0 : m.includes('X(0.5)') ? 0.5 : m.includes('X(2.0)') ? 2 : m.includes('X(4.0)') ? 4 : 1;
          newChart[atk][def] = v;
        });
      });
    }

    else if (fmt === 'hexmaniac') {
      // Extract type ID mapping from comments: // 0x00 = Normal
      const typeMap = {};
      [...text.matchAll(/\/\/\s*0x([0-9A-Fa-f]+)\s*=\s*(\w+)/g)].forEach(([, hex, name]) => {
        typeMap[parseInt(hex, 16)] = name;
        if (!newTypes.includes(name)) newTypes.push(name);
      });
      if (!newTypes.length) { showToast('Cannot find type ID mapping in HexManiac export', true); return; }
      // Init all cells to 1
      newTypes.forEach(atk => { newChart[atk] = {}; newTypes.forEach(def => { newChart[atk][def] = 1; }); });
      // Parse triplets: XX YY ZZ
      const effFromByte = b => b === 0x00 ? 0 : b === 0x05 ? 0.5 : b === 0x14 ? 2 : b === 0x28 ? 4 : 1;
      [...text.matchAll(/^([0-9A-Fa-f]{2})\s+([0-9A-Fa-f]{2})\s+([0-9A-Fa-f]{2})/gm)].forEach(([, a, d, e]) => {
        const ai = parseInt(a, 16), di = parseInt(d, 16), ei = parseInt(e, 16);
        if (ai === 0xFE || ai === 0xFF) return; // terminators
        const atk = typeMap[ai], def = typeMap[di];
        if (atk && def) newChart[atk][def] = effFromByte(ei);
      });
    }

    if (!newTypes.length || !Object.keys(newChart).length) {
      showToast('No chart data found', true); return;
    }
    applyImportedChart(newChart, newTypes);
    closeCodeImportModal();
    const fmtLabels = { python:'Python', pokeemerald:'pokeemerald', hexmaniac:'HexManiacAdvance', csharp:'C#', simple_c:'C', json_flat:'JSON' };
    showToast(`${fmtLabels[fmt]} imported — ${newTypes.length} types`);
  } catch(err) { showToast('Parse error: ' + err.message, true); }
}

