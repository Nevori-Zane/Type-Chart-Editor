window.UIActionRegistry = window.UIActionRegistry || (() => {
  const actions = Object.create(null);
  const changes = Object.create(null);
  const inputs = Object.create(null);

  function register(map, entries) {
    Object.entries(entries || {}).forEach(([key, fn]) => { if (typeof fn === 'function') map[key] = fn; });
  }

  return {
    actions,
    changes,
    inputs,
    registerActions(entries) { register(actions, entries); },
    registerChanges(entries) { register(changes, entries); },
    registerInputs(entries) { register(inputs, entries); },
    get(kind, key) {
      const map = kind === 'action' ? actions : kind === 'change' ? changes : inputs;
      return map[key] || null;
    }
  };
})();
