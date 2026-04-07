# Type Chart Editor App

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![Status](https://img.shields.io/badge/status-stable-green)
![Platform](https://img.shields.io/badge/platform-browser-lightgrey)

---

## Overview

**Type Chart Editor App** is a browser-based tool for designing, editing, analyzing, and exporting Pokémon-style type effectiveness systems.

It provides a full workflow:
- build custom type charts
- analyze offensive & defensive coverage
- compare type combinations
- export data for projects and ROM hacking

---

## Features

### Editor
- Grid-based type chart editor
- Supports:
  - 0×, ¼×, ½×, 1×, 2×, 4×
- Keyboard input + fast editing
- Undo / redo
- Mirror mode

---

### Combo Analysis
- Generates:
  - Mono
  - Dual
  - Triple type combinations
- Shows:
  - Coverage
  - Weaknesses
  - Resistances
  - Immunities
- Sort by multiple metrics

---

### Target Defender
- Select up to 3 defender types
- Analyze effectiveness vs targets
- Drives sorting + evaluation

---

### Compare
- Compare two combos side-by-side
- Highlights differences in matchups

---

### Balance Tools
- Weakness distribution
- Coverage spread
- Team analyzer
- Moveset checker

---

### Import / Export

**Import**
- JSON
- CSV
- Code (C / Python / C#)

**Export**
- JSON
- CSV
- C / Python / C# formats
- Reference card (PNG)

---

## Project Structure

```
index.html
styles.css
js/
  06-combo-engine-team.js
  07-combo-ui.js
  08e-ui-actions-combo.js
  08h-app-state-store.js
  08-app-init.js
```

---

## Architecture

The app uses a modular structure with strict ownership:

| File | Responsibility |
|------|----------------|
| 06 | Combo calculations |
| 07 | UI state + rendering |
| 08e | Event routing |
| 08h | Store (read-only mirror) |
| 08-app-init | Startup |

Key rule: **one source of truth for combo state**

---

## State Model

Core runtime state:

- COMBOS
- filtered
- selectedComboIdx
- compareComboA / compareComboB
- targetDefTypes

Rules:
- No duplicate state ownership
- No filtered-index identity
- targetDefTypes = `[null, null, null]`

---

## Setup

1. Download / extract project
2. Ensure structure:
   ```
   /js/ (all scripts inside)
   ```
3. Open `index.html`

---

## Important Notes

- Script order matters
- Files MUST stay in `/js/` or the app will fail to load
- UI actions rely on `data-action` attributes

---

## Stability (v1.2.0)

This version resolves major issues:
- Combo list not rendering
- State desync between store and globals
- Selection breaking on filter/sort
- Target defender corruption
- Broken bundle structure

---

## Planned Future Features

- Lock cell toggle
- Counter-type generator
- Soft rule warnings
- Type banning / format rules
- Resistance stacking caps
- Chart diff viewer
- Export upgrades bundle
- Reorder types
- Full app colorblind mode
- Asymmetry analysis tools
- Type identity scoring
- Constraints engine
- Archetype-based team builder
- Meta simulation pool
- Attack-only type flag
- Alternative game support + radial view
- and more
---

## License

Open for personal and project use.
