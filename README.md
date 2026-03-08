# D&D Character Sheet — Hugh Jass PhD

A fully custom, interactive D&D 5e (heavily homebrewed) character sheet built with React + Vite.

## Features

- **Character Bio** — Name, race (dropdown with 20 races), class (dropdown with 31 classes), level (1-30), alignment, and more
- **Racial Stats** — Auto-populated from race selection with stat modifiers
- **Skills Tab** — 6 skill groups with base values, equipment bonuses, and level-up point tracking
- **Abilities Tab** — Active and passive abilities with drag-to-reorder, usage tracking, and battle reset
- **Equipment Loadout** — Freeform canvas with draggable equipment slots, custom background image support, and SVG body figure
- **Inventory Tab** — Folder-based inventory system with equipment, carried items, bag of holding, and custom folders
- **Notes Tab** — Character notes with rich text editor + session notes with search, collapse/expand, and word count
- **Levels Tab** — 30-level planner with skill point allocation, ability selection (class/race/human/upgrade), auto-populated descriptions, and upgrade tier tracking
- **Theme System** — 7 color presets + full custom color editor with 17 color channels
- **HP Bar** — Visual health bar with current/max/temp HP tracking
- **Level-Up Auto-Apply** — Changing your level automatically updates skill points and ability bonuses on the Skills tab

## Data Sources

All race and class ability data is sourced from the game's spreadsheets:
- `src/data/raceData.json` — 20 races with abilities, innate abilities, stat modifiers
- `src/data/raceDescriptions.json` — 123 race ability descriptions (from cell comments)
- `src/data/classData.json` — 31 classes with ability lists
- `src/data/classDescriptions.json` — 1,155 class ability descriptions (from cell comments)
- `src/data/abilityData.js` — Upgrade tiers and skill effect mappings

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

The dev server will open at `http://localhost:3000`.

## Project Structure

```
dnd-sheet/
├── index.html              # Entry point with Tailwind CDN
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Main character sheet component
    ├── components/
    │   └── ui.jsx          # Shared UI components (Field, Section, TabBtn, etc.)
    └── data/
        ├── index.js        # Data re-exports
        ├── constants.js    # Theme presets, skill groups, equipment, abilities
        ├── abilityData.js  # Upgrade tiers and skill effects
        ├── descriptions.js # Description loader (merges race + class)
        ├── raceData.json   # Race definitions
        ├── raceDescriptions.json   # Race ability descriptions
        ├── classData.json  # Class definitions
        └── classDescriptions.json  # Class ability descriptions
```

## Future Improvements

With this modular structure, the app can easily be extended:
- Split `App.jsx` further into individual tab components (SkillsTab, AbilitiesTab, etc.)
- Add localStorage persistence for character data
- Add import/export character as JSON
- Add multiple character support
- Add dice roller integration
