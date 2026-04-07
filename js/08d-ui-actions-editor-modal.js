(() => {
  const R = window.UIActionRegistry;
  if (!R) return;
  const num = v => Number(v);

  R.registerActions({
    'clear-all': () => clearAll(),
    'revert-baseline': () => revertToBaseline(),
    'toggle-heatmap': () => toggleHeatmap(),
    'toggle-count-overlay': () => toggleCountOverlay(),
    'toggle-dual-def': () => toggleDualDefMode(),
    'open-type-modal': el => openTypeModal(el.dataset.mode),
    'load-gen': el => loadGenPreset(num(el.dataset.gen)),
    'open-randomize': () => openRandomizeModal(),
    'apply-randomize': () => applyRandomize(),
    'close-randomize': () => closeRandomizeModal(),
    'toggle-sym-mirror': () => toggleSymMirror(),
    'commit-cell-popup': el => commitCellPopup(num(el.dataset.value)),
    'fill-row-popup': el => fillRow(_cellPopupAtk, num(el.dataset.value)),
    'fill-col-popup': el => fillCol(_cellPopupDef, num(el.dataset.value)),
    'commit-bulk-fill': el => commitBulkFill(num(el.dataset.value))
  });

  R.registerInputs({
    'sync-number-to-range': el => {
      const target = document.getElementById(el.dataset.target || '');
      const min = Number(el.dataset.min ?? el.min ?? 0);
      const max = Number(el.dataset.max ?? el.max ?? 100);
      el.value = Math.max(min, Math.min(max, Number(el.value || 0)));
      if (target) target.value = el.value;
    },
    'sync-range-to-number': el => {
      const target = document.getElementById(el.dataset.target || '');
      if (target) target.value = el.value;
    },
    'sync-text': el => {
      const target = document.getElementById(el.dataset.target || '');
      if (target) target.textContent = el.value;
    }
  });
})();
