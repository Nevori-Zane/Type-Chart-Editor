window.UI = window.UI || {
  byId(id) { return document.getElementById(id); },
  value(id) { const el = this.byId(id); return el ? el.value : ''; },
  trimmedValue(id) { return this.value(id).trim(); },
  text(id, value) { const el = this.byId(id); if (el) el.textContent = value; return el; },
  setValue(id, value) { const el = this.byId(id); if (el) el.value = value; return el; },
  click(idOrEl) {
    const el = typeof idOrEl === 'string' ? this.byId(idOrEl) : idOrEl;
    if (el && typeof el.click === 'function') el.click();
    return el;
  },
  show(idOrEl, display = 'block') {
    const el = typeof idOrEl === 'string' ? this.byId(idOrEl) : idOrEl;
    if (el) el.style.display = display;
    return el;
  },
  hide(idOrEl) {
    const el = typeof idOrEl === 'string' ? this.byId(idOrEl) : idOrEl;
    if (el) el.style.display = 'none';
    return el;
  },
  closeMenu(idOrEl) { return this.hide(idOrEl); }
};
