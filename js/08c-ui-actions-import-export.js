(() => {
  const R = window.UIActionRegistry;
  if (!R) return;

  R.registerActions({
    'trigger-import': el => document.getElementById(el.dataset.target)?.click(),
    'open-code-import': () => openCodeImportModal(),
    'apply-code-import': () => applyCodeImport(),
    'close-code-import': () => closeCodeImportModal(),
    'export-json': () => exportJSON(),
    'save-preset': () => savePreset(),
    'export-csv': () => exportCSV(),
    'open-code-export': () => openCodeExportModal(),
    'download-code-export': () => downloadCodeExport(),
    'copy-code-export': () => copyCodeExport(),
    'close-code-export': () => closeCodeExportModal(),
    'open-ref-card': () => openRefCardModal(),
    'set-ref-card-gen': el => setRefCardGen(el.dataset.gen === 'current' ? 'current' : Number(el.dataset.gen)),
    'toggle-ref-card-theme': () => { refCardDark = !refCardDark; renderRefCard(); },
    'export-ref-card-png': () => exportRefCardPNG(),
    'close-ref-card': () => closeRefCardModal()
  });

  R.registerChanges({
    'import-json': (el, event) => importJSON(event),
    'import-csv': (el, event) => importCSV(event),
    'refresh-code-export': () => refreshCodeExport()
  });

  R.registerInputs({
    'code-import-input': () => onCodeImportInput()
  });
})();
