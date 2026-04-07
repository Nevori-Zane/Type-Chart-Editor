function toggleTheme() {
  const light = document.body.classList.toggle('light-mode');
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = light ? '☀️' : '🌙';
  try { localStorage.setItem('pokemon_tcs_theme', light ? 'light' : 'dark'); } catch(e) {}
  renderEditor();
  renderList();
  // Re-render whichever Charts sub-tab is currently open
  if (mainTab === 'overall')  { renderOverallChart(); renderBalanceChecker(); renderSymmetryChecker(); }
  if (mainTab === 'team')     { renderTeamAnalyzer(); renderMovesetChecker(); }
  if (mainTab === 'tierlist') renderTierList();
}

// Apply saved theme and toggle states on load
(function() {
  try {
    if (localStorage.getItem('pokemon_tcs_theme') === 'light') {
      document.body.classList.add('light-mode');
      const btn = document.getElementById('themeToggleBtn');
      if (btn) btn.textContent = '☀️';
    }
    if (localStorage.getItem('pokemon_tcs_symmirror') === '1') {
      symMirror = true;
      setBtnActive('symMirrorBtn', true, 'var(--accent)', 'rgba(99,144,240,0.1)');
    }
  } catch(e) {}
})();

function toggleToolbarMenu(id) {
  const menu = document.getElementById(id);
  if (!menu) return;
  const opening = menu.style.display === 'none';
  ['typesMenu','genMenu','importMenu','exportMenu'].forEach(m => {
    const el = document.getElementById(m);
    if (el) el.style.display = 'none';
  });
  if (opening) menu.style.display = 'block';
}
function toggleExportMenu() { toggleToolbarMenu('exportMenu'); }
document.addEventListener('click', e => {
  const popup = document.getElementById('cellPopup');
  if (popup && popup.style.display !== 'none' && !popup.contains(e.target)) closeCellPopup();
  const bfp = document.getElementById('bulkFillPopup');
  if (bfp && bfp.style.display !== 'none' && !bfp.contains(e.target)) closeBulkFillPopup();
  const chartEl = document.getElementById('chart');
  if (focusedAtk !== null && chartEl && !chartEl.contains(e.target) && !popup?.contains(e.target)) setKbFocus(null, null);
  // Close toolbar dropdown menus
  [['exportMenu','exportMenuBtn'],['importMenu','importMenuBtn'],['typesMenu','typesMenuBtn'],['genMenu','genMenuBtn']].forEach(([menuId, btnId]) => {
    const menu = document.getElementById(menuId), btn = document.getElementById(btnId);
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) menu.style.display = 'none';
  });
  for (let i = 0; i < 6; i++) {
    const dd = document.getElementById(`pkmnDrop${i}`), inp = document.getElementById(`pkmnSearch${i}`);
    if (dd && inp && !dd.contains(e.target) && e.target !== inp) dd.style.display = 'none';
  }
});

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  document.getElementById('panel-'+name).classList.add('active');
}


function closeToolbarMenu(menuId) {
  UI.closeMenu(menuId);
}


const UI_ACTIONS = {
  core: {
    'switch-tab': el => switchTab(el.dataset.name),
    'toggle-theme': () => toggleTheme(),
    'toggle-menu': el => toggleToolbarMenu(el.dataset.menu),
    'trigger-file-click': el => document.getElementById(el.dataset.target)?.click(),
  },
  importExport: {
    'trigger-import': el => document.getElementById(el.dataset.target)?.click(),
    'open-code-import': () => openCodeImportModal(),
    'export-json': () => exportJSON(),
    'save-preset': () => savePreset(),
    'export-csv': () => exportCSV(),
    'open-code-export': () => openCodeExportModal(),
    'open-ref-card': () => openRefCardModal(),
    'download-code-export': () => downloadCodeExport(),
    'copy-code-export': () => copyCodeExport(),
    'close-code-export': () => closeCodeExportModal(),
    'apply-code-import': () => applyCodeImport(),
    'close-code-import': () => closeCodeImportModal(),
    'set-ref-card-gen': el => setRefCardGen(el.dataset.gen === 'current' ? 'current' : Number(el.dataset.gen)),
    'toggle-ref-card-theme': () => { refCardDark = !refCardDark; renderRefCard(); },
    'export-ref-card-png': () => exportRefCardPNG(),
    'close-ref-card': () => closeRefCardModal(),
  },
  editor: {
    'clear-all': () => clearAll(),
    'revert-baseline': () => revertToBaseline(),
    'undo': () => undo(),
    'redo': () => redo(),
    'toggle-heatmap': () => toggleHeatmap(),
    'toggle-count-overlay': () => toggleCountOverlay(),
    'toggle-dual-def': () => toggleDualDefMode(),
    'load-gen': el => loadGenPreset(Number(el.dataset.gen)),
    'open-randomize': () => openRandomizeModal(),
    'toggle-sym-mirror': () => toggleSymMirror(),
    'set-zoom': el => setZoom(Number(el.dataset.delta)),
    'reset-zoom': () => resetZoom(),
    'apply-randomize': () => applyRandomize(),
    'close-randomize': () => closeRandomizeModal(),
    'commit-cell-popup': el => commitCellPopup(Number(el.dataset.value)),
    'fill-row-popup': el => fillRow(_cellPopupAtk, Number(el.dataset.value)),
    'fill-col-popup': el => fillCol(_cellPopupDef, Number(el.dataset.value)),
    'commit-bulk-fill': el => commitBulkFill(Number(el.dataset.value)),
  },
  modal: {
    'open-type-modal': el => openTypeModal(el.dataset.mode),
    'close-type-modal': () => closeTypeModal(),
    'add-type-from-modal': () => addType(document.getElementById('newTypeName')?.value, document.getElementById('newTypeColor')?.value),
    'open-rename-editor': el => openRenameEditor(el.dataset.typeName),
    'remove-type-by-name': el => removeType(el.dataset.typeName),
    'back-to-rename-list': () => openTypeModal('rename'),
    'apply-rename-type': el => renameType(el.dataset.oldName, document.getElementById('renameTypeInput')?.value.trim(), document.getElementById('renameTypeColor')?.value),
    'clear-new-type-icon': () => clearNewTypeIcon(),
    'clear-rename-icon': el => clearRenameIcon(el.dataset.typeName),
    'set-icon-color': el => setIconColor(el.dataset.color, el),
    'apply-grad-preset': el => applyGradPreset(el.dataset.from, el.dataset.to, Number(el.dataset.angle)),
  },
  combo: {
    'set-mode': el => setMode(el.dataset.mode),
    'clear-chips': () => clearChips(),
    'set-type-count': el => setTypeCount(el.dataset.typeCount),
    'set-sort': el => setSort(el.dataset.sortValue),
    'clear-target-def': () => clearTargetDef(),
    'sidebar-start-compare': () => sidebarStartCompare(),
    'set-main-tab': el => setMainTab(el.dataset.tab),
    'reset-tier-list': () => { tierListCustom = autoGenerateTiers(); renderTierList(); },
    'export-tier-list-png': () => exportTierListPNG(),
    'select-pokemon-result': el => fillSlotFromPokemon(Number(el.dataset.slot), el.dataset.name.replace(/&#39;/g, "'")),
    'clear-team-slot': el => clearTeamSlot(Number(el.dataset.slot)),
  }
};

const UI_CHANGES = {
  importExport: {
    'import-json': (el, event) => importJSON(event),
    'import-csv': (el, event) => importCSV(event),
    'refresh-code-export': () => refreshCodeExport(),
  },
  modal: {
    'preview-new-type-icon': (el, event) => previewNewTypeIcon(event),
    'preview-rename-icon': (el, event) => previewRenameIcon(event),
    'toggle-grad-ui': () => toggleGradUI(),
  },
  combo: {
    'set-target-def': el => setTargetDef(Number(el.dataset.slot), el.value),
    'set-move-slot': el => setMoveSlot(Number(el.dataset.slot), el.value),
    'set-team-type': el => setTeamType(Number(el.dataset.slot), Number(el.dataset.typeIdx), el.value),
  }
};

const UI_INPUTS = {
  core: {
    'sync-number-to-range': el => {
      const target = document.getElementById(el.dataset.target || '');
      const min = Number(el.dataset.min ?? el.min ?? 0);
      const max = Number(el.dataset.max ?? el.max ?? 100);
      el.value = Math.max(min, Math.min(max, Number(el.value || 0)));
      if (target) target.value = el.value;
    },
    'sync-range-to-number': el => { const target = document.getElementById(el.dataset.target || ''); if (target) target.value = el.value; },
    'sync-text': el => { const target = document.getElementById(el.dataset.target || ''); if (target) target.textContent = el.value; },
  },
  importExport: {
    'code-import-input': () => onCodeImportInput(),
  },
  modal: {
    'update-grad-preview': () => updateGradPreview(),
    'update-grad-angle': el => { updateGradPreview(); const lbl = document.getElementById('gradAngleLbl'); if (lbl) lbl.textContent = el.value + '°'; },
    'set-icon-color': el => setIconColor(el.value),
  },
  combo: {
    'set-combo-bar-width': el => setComboBarWidth(el.value),
    'pokemon-input': el => onPkmnInput(Number(el.dataset.slot), el.value),
  }
};

const ACTION_MAP = Object.assign({}, ...Object.values(UI_ACTIONS));
const CHANGE_MAP = Object.assign({}, ...Object.values(UI_CHANGES));
const INPUT_MAP = Object.assign({}, ...Object.values(UI_INPUTS));

function runMappedHandler(map, key, el, event) {
  const handler = map[key];
  if (!handler) return false;
  handler(el, event);
  return true;
}

function runRegistryHandler(kind, key, el, event) {
  const handler = window.UIActionRegistry?.get(kind, key);
  if (!handler) return false;
  handler(el, event);
  return true;
}

function handleUiAction(el, event) {
  const action = el?.dataset?.action;
  if (!action) return false;
  const handled = runRegistryHandler('action', action, el, event) || runMappedHandler(ACTION_MAP, action, el, event);
  if (handled && el.dataset.closeMenu) UI.closeMenu(el.dataset.closeMenu);
  return handled;
}

function handleUiChange(el, event) {
  const action = el?.dataset?.change;
  return action ? (runRegistryHandler('change', action, el, event) || runMappedHandler(CHANGE_MAP, action, el, event)) : false;
}

function handleUiInput(el) {
  const action = el?.dataset?.input;
  return action ? (runRegistryHandler('input', action, el) || runMappedHandler(INPUT_MAP, action, el)) : false;
}

function bindStaticUiEvents() {
  document.addEventListener('click', e => {
    const overlay = e.target.closest('[data-overlay-close]');
    if (overlay && e.target === overlay) {
      const fn = window[overlay.dataset.overlayClose];
      if (typeof fn === 'function') fn();
      return;
    }
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) handleUiAction(actionEl, e);
  });
  document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el) handleUiChange(el, e); });
  document.addEventListener('input', e => { const el = e.target.closest('[data-input]'); if (el) handleUiInput(el); });
  document.addEventListener('focusin', e => {
    const el = e.target.closest('[data-focus]');
    if (el?.dataset.focus === 'pokemon-input') onPkmnInput(Number(el.dataset.slot), el.value);
  });
  document.addEventListener('dragstart', e => {
    const el = e.target.closest('[data-tier-drag-type]');
    if (el) tierDragStart(el.dataset.tierDragType, e);
  });
  document.addEventListener('dragover', e => {
    if (e.target.closest('[data-tier-dragover]')) e.preventDefault();
  });
  document.addEventListener('drop', e => {
    const el = e.target.closest('[data-tier-drop]');
    if (el) tierDrop(el.dataset.tierDrop, e);
  });
}

function showToast(msg, isErr) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isErr?' err':'');
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.className='toast'; }, 3000);
}

bindStaticUiEvents();

buildLegend();
renderEditor();
renderSidePanel();
buildChips();
buildCombos();
applyFilters();
window.addEventListener('resize', scaleChart);

try {
  if (localStorage.getItem(STORAGE_KEY)) {
    document.getElementById("autosave-status").textContent = "loaded from auto-save";
  }
} catch(e) {}
