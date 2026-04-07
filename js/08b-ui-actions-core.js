(() => {
  const R = window.UIActionRegistry;
  if (!R) return;
  const num = v => Number(v);

  R.registerActions({
    'switch-tab': el => switchTab(el.dataset.name),
    'toggle-theme': () => toggleTheme(),
    'toggle-menu': el => toggleToolbarMenu(el.dataset.menu),
    'undo': () => undo(),
    'redo': () => redo(),
    'set-zoom': el => setZoom(num(el.dataset.delta)),
    'reset-zoom': () => resetZoom()
  });
})();
