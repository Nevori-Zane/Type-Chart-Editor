(() => {
  const R = window.UIActionRegistry;
  if (!R) return;
  const num = v => Number(v);

  R.registerActions({
    'toggle-chip': el => toggleChip(el.dataset.type),
    'set-mode': el => setMode(el.dataset.mode),
    'clear-chips': () => clearChips(),
    'set-type-count': el => setTypeCount(el.dataset.typeCount),
    'set-sort': el => setSort(el.dataset.sortValue),
    'clear-target-def': () => clearTargetDef(),
    'sidebar-start-compare': () => sidebarStartCompare(),
    'set-main-tab': el => setMainTab(el.dataset.tab),
    'select-combo': el => selectCombo(num(el.dataset.gi)),
    'toggle-pin': (el, event) => togglePin(num(el.dataset.gi), event),
    'set-det-tab': el => setDetTab(el.dataset.tab),
    'close-detail': () => closeDetail(),
    'clear-compare': () => clearCompare(),
    'set-cmp-subtab': el => setCmpSubtab(el.dataset.tab),
    'select-type': el => selectType(el.dataset.type)
  });

  R.registerChanges({
    'set-target-def': el => setTargetDef(Number(el.dataset.slot), el.value)
  });

  R.registerInputs({
    'set-combo-bar-width': el => setComboBarWidth(el.value)
  });
})();
