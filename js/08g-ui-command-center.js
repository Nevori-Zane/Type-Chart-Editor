window.AppActions = window.AppActions || {};
window.APP_STATE = window.APP_STATE || {};

// Backward-compat shim.
// Real command registration now lives in 08h-app-state-store.js.
Object.assign(window.AppActions, window.AppStore?.commands || {});
if (window.AppStore?.state) window.APP_STATE.store = window.AppStore.state;
