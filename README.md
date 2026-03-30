# Type Chart Editor

A powerful desktop application for creating, editing, and analyzing Pokémon type effectiveness charts. Perfect for Pokémon ROM hackers, game designers, and competitive players.

## Features

🎨 **Visual Chart Editor**
- Click cells to cycle through effectiveness values (1×, 2×, ½×, 0×)
- Color-coded grid with instant visual feedback
- Support for all 18 official types + custom types
- Modification tracking with visual markers

📊 **Triple-Type Analysis**
- Browse 4,680+ type combinations (mono, dual, triple)
- Filter by type, combination count, and search
- Grade combos with letter grades (S–F) based on coverage
- Real-time stats and analysis
- Compare any two type combinations side-by-side

📊 Charts & Stats — New Tabs
🗺 Balance & Overall Coverage

A new sub-tab in Charts & Stats with three tools combined:

Overall Coverage Chart
A scoring table showing every type's OFFENSE, DEFENSE, and OVERALL score side by side. Scores are color-coded green (advantage) to red (disadvantage) based on how each type performs across all matchups.

⚠️ Balance Checker
Automatically scans every type and flags potentially broken matchups:
- 🔴 Danger — 11+ types hit SE, 5+ immunities given, 7+ weaknesses, or no type hits it SE (uncounterable)
- 🟡 Warning — 8+ types hit SE, 8+ resisted, 3+ immunities, 5+ weaknesses, 10+ resistances
- Each flagged type shows a full stats card with color-coded issue badges. Updates live as you edit the chart.

⚔️ Offensive Coverage Checker
- Pick up to 3 attack types to see which types are NOT covered (no SE hit). Shows a coverage percentage bar and lists every gap with its actual multiplier.

🫂 Team Weakness Analyzer
 - A dedicated tab for analyzing full team defensive coverage:
    - Set up to 6 Pokémon slots, each with up to 3 types (mono/dual/triple)
    - Dropdowns are color-coded to the selected type
    - Results update live showing:
         🔴 Major Weaknesses — types that hit the majority of your team SE
         🟡 Partial Weaknesses — types that hit some slots
         🟢 Resistances — types some slots resist
         ⚪ Full Team Immune — no slot is hit by these

🔥Heatmap Overlay
- Toggle the 🌡 Heatmap button to reveal a threat score overlay on the editor
- Blue bars on row labels = offensive threat (how many types the attacker hits SE)
- Pink bars on column headers = defensive vulnerability (how many types hit it SE)
- Cell tints show combined danger — pink = high threat matchup, blue = low
- A legend automatically appears in the right side panel explaining each element

🔧 **Full Customization**
- Add custom types with personalized colors
- Load Gen 1, Gen 2–5, or Gen 6+ official charts
- Undo/Redo support
- Save up to 3 chart versions locally
- Create unlimited named saves

💾 **Import/Export**
- Export as JSON (with modification history)
- Export as PNG image
- Export as CSV spreadsheet
- Save presets for easy sharing
- Import custom JSON files
- Export Code

⚡ **Professional UI**
- Dark theme optimized for extended use
- Smooth animations and responsive controls
- Keyboard shortcuts for power users
- Detailed tooltips and guidance
- Fast performance

## Installation

1. **Download** the latest release from the [Releases](../../releases) page
2. **Run** `Type-Chart-Editor-Setup.exe`
4. **Launch** the application from your Desktop shortcut

## Quick Start

1. **Open** Type Chart Editor
2. **Click cells** to modify type matchups
   - Left-click: cycle forward (1× → 2× → ½× → 0× → 1×)
   - Right-click: cycle backward
3. **Export** your chart when done
   - JSON for backup/sharing
   - PNG for documentation
   - CSV for spreadsheets
   - Code for multiple code formats

## User Guide

### Editor Panel

The main grid shows:
- **Rows** = Attacking types
- **Columns** = Defending types
- **Cells** = Effectiveness values

Yellow markers (✦) indicate modifications from the official chart.

**Toolbar buttons:**
- **Clear Chart** - Reset all cells to 1×
- **Undo/Redo** - Navigate edit history
- **Add Type** - Create a custom type
- **Remove Type** - Delete custom types
- **Gen 1/2/5/6+** - Load official generation charts

### Charts & Stats Tab

Browse all type combinations with:
- **Filtering** - By type, combination count, or search
- **Sorting** - Alphabetical, by coverage, by defense
- **Grading** - Automatic letter grades (S–F)
- **Comparison** - Side-by-side analysis of any two combos

**Grade Legend:**
- **S** - Exceptional (strong offense + defense)
- **A** - Great (excellent coverage)
- **B** - Good (solid with minor gaps)
- **C** - Average (workable but limited)
- **D** - Below average (notable weaknesses)
- **F** - Poor (heavily exposed)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo last change |
| `Ctrl+Y` | Redo last change |
| `Right-click` cell | Cycle backward |

### Import/Export

**Export Options:**

1. **JSON Export** - Full chart + modification history
   - Preserves all custom types
   - Includes change notes
   - Perfect for backup/collaboration

2. **JSON Preset** - Clean chart baseline
   - No modification history
   - Ideal for sharing clean versions
   - Import as starting point

3. **PNG Export** - Visual chart image
   - High resolution
   - Perfect for documentation
   - Share in forums/guides

4. **CSV Export** - Spreadsheet format
   - Open in Excel, Google Sheets, etc.
   - Easy data analysis
   - Import into other tools
5. **Code Export**
   -Export the chart in multiple code formats for direct use in your ROM hack or project:
   - pokeemerald / pokefirered — exact decomp C array format with TYPE_NAME row labels and X(0.5) / X(2.0) macros
   - HexManiacAdvance (GBA Binary Table) — 3-byte hex entries with type ID mapping, ready to paste into the GBA type chart offset
   - Simple C Array — integer values (0/50/100/200) for any C project
   - C# 2D Array — for Unity or MonoGame projects
   - Python Dict — compact nested dictionary, only non-neutral values
   - JSON Flat — full matrix as JSON
   - All formats have a Copy and Download button inside the modal.

### Tips & Tricks

💡 **Save Multiple Versions**
- Use the "Saves" tab to keep 3 named versions
- Switch between them instantly
- Great for A/B testing balance changes

💡 **Track Changes**
- The Changelog tab shows every edit
- Add notes to explain why changes were made
- Export changelog history as .txt

💡 **Coverage Tool**
- Select up to 3 attack types
- See exactly which defenses aren't covered
- Perfect for team building

💡 **Custom Types**
- Add types for ROM hacks (e.g., "Cosmic", "Sound")
- Assign custom colors
- Save in JSON for sharing

## File Formats

### .json (Full Export)
Contains:
- Current chart state
- All modifications with notes
- Custom type definitions
- Modification history

Use when: Backing up work, collaborating, tracking changes

### .json (Preset)
Contains:
- Clean chart baseline
- Custom type definitions
- No modification history

Use when: Sharing a finished chart, creating a starting template

### .csv
Spreadsheet format:
- ATK vs DEF matrix
- Open in Excel/Sheets
- Easy to analyze or import elsewhere

### .png
High-resolution chart image
- Perfect for documentation
- Share in guides/wikis
- Print-friendly

### Code
Export the chart in multiple code formats for direct use in your ROM hack or project:
- pokeemerald / pokefirered — exact decomp C array format with TYPE_NAME row labels and X(0.5) / X(2.0) macros
- HexManiacAdvance (GBA Binary Table) — 3-byte hex entries with type ID mapping, ready to paste into the GBA type chart offset
- Simple C Array — integer values (0/50/100/200) for any C project
- C# 2D Array — for Unity or MonoGame projects
- Python Dict — compact nested dictionary, only non-neutral values
- JSON Flat — full matrix as JSON
All formats have a Copy and Download button inside the modal.


## FAQ

**Q: Will my changes auto-save?**
A: Yes! The app saves your work locally in the browser cache. Reopening preserves your last session.

**Q: Can I share my chart with others?**
A: Yes! Export as JSON or JSON Preset and share the file. Others can import it.

**Q: Can I use this for ROM hacking?**
A: Absolutely! Export to JSON and use the data in your hack. Full customization supported.

**Q: What if I made a mistake?**
A: Use Undo (Ctrl+Z) or revert individual changes in the Changelog tab.

**Q: Can I compare two charts?**
A: Yes! The Charts & Stats tab lets you compare any two type combinations side-by-side.

**Q: Does this work offline?**
A: Yes! The application runs entirely offline. No internet required.

**Q: Can I add more than 18 types?**
A: Yes! Create unlimited custom types with personalized colors.

## Support

Found a bug? Have a feature request? Please create an [issue](../../issues) on GitHub.

## Version History

**v1.1.0** - First Update
- Heatmap Overlay
- Export Code (pokeemerald / pokefirered, GBA Binary Table, Simple C Array, ect..)
- Overall Coverage Chart
- Balance Checker
- Offensive Coverage Checker
- Team Weakness Analyzer
- Changelog Improvements (Cell Notes, Multi-session .txt export)
- Bug Fixes

**v1.0.0** - Initial release
- Full chart editor
- Triple-type analysis
- Import/Export (JSON, PNG, CSV)
- Custom types support
- Save system

## Credits & Attribution

### Free to Use & Edit

I don't accept any form of money at all for any of this. I don't condone that. If you like this stuff then support the community in a different way that honors both the creator of Pokémon and the ROM Hacking community. This is free to use and free to edit.

### Data Sources

**[Pokémon Database](https://pokemondb.net)** – Credit for the original type effectiveness charts

### Special Thanks

**Game Freak, The Pokémon Company, and Nintendo** – All credit for everything. Without them, we wouldn't have Pokémon.

### Legal Notice

Pokémon is a trademark of **Nintendo/Game Freak**. This tool is a fan-made project and is **not affiliated with or endorsed** by Nintendo, Game Freak, or The Pokémon Company. This project is created for educational and modding purposes within the fan community.

---

**Happy editing!** 🎨⚔️
