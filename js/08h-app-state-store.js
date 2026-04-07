window.AppStore = window.AppStore || (function () {
  const state = {};
  const bind = (name, getter, setter) => Object.defineProperty(state, name, {
    enumerable: true,
    get: getter,
    set: setter || (() => {}),
  });

  const bindDirect = name => bind(name, () => window[name], value => { window[name] = value; });
  const bindReadOnly = (name, getter) => bind(name, getter, undefined);

  bind('types', () => TYPES, value => { TYPES = value; });
  bind('chart', () => chart, value => { chart = value; });
  bind('changes', () => changes, value => { changes = value; });
  bind('baselineChart', () => baselineChart, value => { baselineChart = value; });
  bind('selectedType', () => selectedType, value => { selectedType = value; });
  bind('badgeFocusType', () => badgeFocusType, value => { badgeFocusType = value; });
  bind('badgeFocusMode', () => badgeFocusMode, value => { badgeFocusMode = value; });
  bind('typeColors', () => TYPE_COLORS, value => { TYPE_COLORS = value; });
  bind('typeText', () => TYPE_TEXT, value => { TYPE_TEXT = value; });
  bind('typeGradients', () => TYPE_GRADIENTS, value => { TYPE_GRADIENTS = value; });
  bind('typeIconImages', () => TYPE_ICON_IMGS, value => { TYPE_ICON_IMGS = value; });
  bind('pendingTypeIcon', () => _pendingTypeIcon, value => { _pendingTypeIcon = value; });
  bind('pendingIconColor', () => _pendingIconColor, value => { _pendingIconColor = value; });
  bind('pendingTypeIconName', () => _pendingTypeIconName, value => { _pendingTypeIconName = value; });
  bind('focusedAtk', () => focusedAtk, value => { focusedAtk = value; });
  bind('focusedDef', () => focusedDef, value => { focusedDef = value; });
  bind('cellPopupAtk', () => _cellPopupAtk, value => { _cellPopupAtk = value; });
  bind('cellPopupDef', () => _cellPopupDef, value => { _cellPopupDef = value; });
  bind('bulkFillType', () => _bulkFillType, value => { _bulkFillType = value; });
  bind('bulkFillAxis', () => _bulkFillAxis, value => { _bulkFillAxis = value; });
  bind('revertPending', () => _revertPending, value => { _revertPending = value; });
  bind('revertTimer', () => _revertTimer, value => { _revertTimer = value; });
  bind('symMirror', () => symMirror, value => { symMirror = value; });
  bind('refCardGen', () => refCardGen, value => { refCardGen = value; });
  bind('refCardDark', () => refCardDark, value => { refCardDark = value; });
  bindDirect('sidePanelTab');
  bindDirect('selectedChangeIdx');
  bindDirect('changelogFilter');
  bindDirect('chartZoom');
  bindDirect('heatmapActive');
  bindDirect('countOverlayActive');
  bindDirect('dualDefMode');
  bindDirect('dualDefTypes');
  bindDirect('activeTypes');
  bindReadOnly('COMBOS', () => window.COMBOS);
  bindReadOnly('filtered', () => window.filtered);
  bindReadOnly('pinnedCombos', () => window.pinnedCombos);
  bindReadOnly('filterMode', () => window.filterMode);
  bindReadOnly('currentSort', () => window.currentSort);
  bindReadOnly('typeCountFilter', () => window.typeCountFilter);
  bindReadOnly('selectedComboIdx', () => window.selectedComboIdx);
  bindReadOnly('comboBarWidth', () => window.comboBarWidth);
  bindReadOnly('targetDefTypes', () => window.targetDefTypes);
  bindReadOnly('compareComboB', () => window.compareComboB);
  bindReadOnly('detActiveTab', () => window.detActiveTab);
  bindReadOnly('cmpSubtab', () => window.cmpSubtab);

  bind('moveSlots', () => moveSlots, value => { moveSlots = value; });
  bind('teamSlots', () => teamSlots, value => { if (Array.isArray(value)) { teamSlots.length = 0; value.forEach(v => teamSlots.push(v)); } });
  bind('teamSlotNames', () => teamSlotNames, value => { if (Array.isArray(value)) { teamSlotNames.length = 0; value.forEach(v => teamSlotNames.push(v)); } });
  bind('tierListCustom', () => tierListCustom, value => { tierListCustom = value; });
  bind('tierDragging', () => _tierDragging, value => { _tierDragging = value; });
  bindReadOnly('mainTab', () => window.mainTab);

  const snapshot = () => ({
    types: [...TYPES],
    chart: deepCopy(chart),
    changes: JSON.parse(JSON.stringify(changes)),
    baselineChart: deepCopy(baselineChart),
    selectedType,
    symMirror,
    refCardGen,
    refCardDark,
    chartZoom: typeof chartZoom === 'undefined' ? undefined : chartZoom,
    currentSort: typeof currentSort === 'undefined' ? undefined : currentSort,
    typeCountFilter: typeof typeCountFilter === 'undefined' ? undefined : typeCountFilter,
    mainTab: typeof mainTab === 'undefined' ? undefined : mainTab,
    targetDefTypes: Array.isArray(window.targetDefTypes) ? [...window.targetDefTypes] : undefined,
    moveSlots: [...moveSlots],
    teamSlots: teamSlots.map(slot => [...slot]),
    teamSlotNames: [...teamSlotNames],
    tierListCustom: tierListCustom ? JSON.parse(JSON.stringify(tierListCustom)) : null,
  });

  const commands = {
    core: {
      switchTab: name => switchTab(name),
      toggleTheme: () => toggleTheme(),
      toggleMenu: id => toggleToolbarMenu(id),
      triggerFileClick: target => UI.click(target),
    },
    importExport: {
      triggerImport: target => UI.click(target),
      openCodeImport: () => openCodeImportModal(),
      importJSON: event => importJSON(event),
      importCSV: event => importCSV(event),
      exportJSON: () => exportJSON(),
      savePreset: () => savePreset(),
      exportCSV: () => exportCSV(),
      openCodeExport: () => openCodeExportModal(),
      refreshCodeExport: () => refreshCodeExport(),
      downloadCodeExport: () => downloadCodeExport(),
      copyCodeExport: () => copyCodeExport(),
      closeCodeExport: () => closeCodeExportModal(),
      applyCodeImport: () => applyCodeImport(),
      closeCodeImport: () => closeCodeImportModal(),
      onCodeImportInput: () => onCodeImportInput(),
      openRefCard: () => openRefCardModal(),
      setRefCardGen: gen => setRefCardGen(gen),
      toggleRefCardTheme: () => { state.refCardDark = !state.refCardDark; renderRefCard(); },
      exportRefCardPNG: () => exportRefCardPNG(),
      closeRefCard: () => closeRefCardModal(),
    },
    editor: {
      clearAll: () => clearAll(),
      revertBaseline: () => revertToBaseline(),
      undo: () => undo(),
      redo: () => redo(),
      toggleHeatmap: () => toggleHeatmap(),
      toggleCountOverlay: () => toggleCountOverlay(),
      toggleDualDef: () => toggleDualDefMode(),
      loadGen: gen => loadGenPreset(gen),
      openRandomize: () => openRandomizeModal(),
      toggleSymMirror: () => toggleSymMirror(),
      setZoom: delta => setZoom(delta),
      resetZoom: () => resetZoom(),
      applyRandomize: () => applyRandomize(),
      closeRandomize: () => closeRandomizeModal(),
      commitCellPopup: value => commitCellPopup(value),
      fillRowPopup: value => fillRow(state.cellPopupAtk, value),
      fillColPopup: value => fillCol(state.cellPopupDef, value),
      commitBulkFill: value => commitBulkFill(value),
    },
    modal: {
      openTypeModal: mode => openTypeModal(mode),
      closeTypeModal: () => closeTypeModal(),
      addTypeFromModal: () => addType(UI.value('newTypeName'), UI.value('newTypeColor')), 
      openRenameEditor: typeName => openRenameEditor(typeName),
      removeTypeByName: typeName => removeType(typeName),
      backToRenameList: () => openTypeModal('rename'),
      applyRenameType: oldName => renameType(oldName, UI.trimmedValue('renameTypeInput'), UI.value('renameTypeColor')),
      previewNewTypeIcon: event => previewNewTypeIcon(event),
      previewRenameIcon: event => previewRenameIcon(event),
      clearNewTypeIcon: () => clearNewTypeIcon(),
      clearRenameIcon: typeName => clearRenameIcon(typeName),
      setIconColor: (color, btn) => setIconColor(color, btn),
      toggleGradUI: () => toggleGradUI(),
      applyGradPreset: (from, to, angle) => applyGradPreset(from, to, angle),
      updateGradPreview: () => updateGradPreview(),
      updateGradAngle: value => { updateGradPreview(); UI.text('gradAngleLbl', value + '°'); },
    },
    combo: {
      setMode: mode => setMode(mode),
      clearChips: () => clearChips(),
      setTypeCount: value => setTypeCount(value),
      setSort: value => setSort(value),
      clearTargetDef: () => clearTargetDef(),
      sidebarStartCompare: () => sidebarStartCompare(),
      setMainTab: tab => setMainTab(tab),
      resetTierList: () => { state.tierListCustom = autoGenerateTiers(); renderTierList(); },
      exportTierListPNG: () => exportTierListPNG(),
      selectPokemonResult: (slot, name) => fillSlotFromPokemon(slot, name),
      clearTeamSlot: slot => clearTeamSlot(slot),
      setTargetDef: (slot, value) => setTargetDef(slot, value),
      setMoveSlot: (slot, value) => setMoveSlot(slot, value),
      setTeamType: (slot, typeIdx, value) => setTeamType(slot, typeIdx, value),
      setComboBarWidth: value => setComboBarWidth(value),
      pokemonInput: (slot, value) => onPkmnInput(slot, value),
    },
  };

  return {
    state,
    commands,
    get: key => state[key],
    set: (key, value) => (state[key] = value),
    snapshot,
  };
})();

window.AppActions = window.AppStore.commands;
window.APP_STATE = window.APP_STATE || {};
window.APP_STATE.store = window.AppStore.state;
window.APP_STATE.actions = window.AppStore.commands;
