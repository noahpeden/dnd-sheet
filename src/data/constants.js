/* ─── THEME PRESETS ─── */
export const THEME_PRESETS = {
  forest: { name: "Forest (Default)", primary: "#4a7c59", primaryDark: "#2d4a30", primaryDim: "#3a5a40", primaryLight: "#c8e6c9", primaryMid: "#7a9e7e", bgDark: "#0d1a0d", bgMid: "#111a11", bgLight: "#151f15", bgCard: "#1a2a1a", text: "#e8e0d0", textDim: "#c8c0b0", accent1: "#ce8e6b", accent2: "#6b8cce", accent3: "#c4a96a", accent4: "#c77dff", danger: "#8b2a2a", dangerLight: "#ce6b6b" },
  blood: { name: "Blood Knight", primary: "#8b2a2a", primaryDark: "#4a1515", primaryDim: "#5c2020", primaryLight: "#f0c0c0", primaryMid: "#b05555", bgDark: "#1a0a0a", bgMid: "#1f0e0e", bgLight: "#251414", bgCard: "#2a1818", text: "#f0e0d0", textDim: "#c8b0a0", accent1: "#d4a050", accent2: "#7090c0", accent3: "#c0a060", accent4: "#d070d0", danger: "#cc3333", dangerLight: "#e06060" },
  arcane: { name: "Arcane", primary: "#7b5ea7", primaryDark: "#3d2d55", primaryDim: "#5a4080", primaryLight: "#d4c0f0", primaryMid: "#9a80c0", bgDark: "#0e0a14", bgMid: "#121018", bgLight: "#18141f", bgCard: "#1e1828", text: "#e8e0f0", textDim: "#c0b8d0", accent1: "#d09060", accent2: "#60a0b0", accent3: "#c0a860", accent4: "#e070a0", danger: "#8b2a4a", dangerLight: "#c06080" },
  frost: { name: "Frost", primary: "#4a7a9a", primaryDark: "#1e3a4e", primaryDim: "#2e5a70", primaryLight: "#c0e0f0", primaryMid: "#6a9ab0", bgDark: "#0a1018", bgMid: "#0e1620", bgLight: "#121a28", bgCard: "#162030", text: "#e0e8f0", textDim: "#b0c0d0", accent1: "#c09060", accent2: "#80a0c0", accent3: "#a0c0d0", accent4: "#90d0e0", danger: "#8b3a3a", dangerLight: "#c06060" },
  gold: { name: "Royal Gold", primary: "#a08030", primaryDark: "#504018", primaryDim: "#706020", primaryLight: "#f0e0a0", primaryMid: "#c0a050", bgDark: "#141008", bgMid: "#1a1610", bgLight: "#201c14", bgCard: "#28221a", text: "#f0e8d0", textDim: "#d0c0a0", accent1: "#c08050", accent2: "#6090a0", accent3: "#d0b060", accent4: "#c090d0", danger: "#8b3030", dangerLight: "#c06060" },
  shadow: { name: "Shadow", primary: "#606878", primaryDark: "#2a2e38", primaryDim: "#404850", primaryLight: "#c0c8d8", primaryMid: "#808898", bgDark: "#0c0c10", bgMid: "#101014", bgLight: "#14141a", bgCard: "#1a1a22", text: "#d8d8e0", textDim: "#a0a0b0", accent1: "#b09070", accent2: "#7090b0", accent3: "#a0a080", accent4: "#a080c0", danger: "#803030", dangerLight: "#b06060" },
  ember: { name: "Ember", primary: "#c06030", primaryDark: "#602818", primaryDim: "#804020", primaryLight: "#f0c8a0", primaryMid: "#d08050", bgDark: "#181008", bgMid: "#1e1410", bgLight: "#241a14", bgCard: "#2a2018", text: "#f0e8d8", textDim: "#d0c0a0", accent1: "#d0a050", accent2: "#6090a0", accent3: "#c0a060", accent4: "#d080a0", danger: "#a03030", dangerLight: "#d06050" },
};

export const THEME_FIELDS = [
  { key: "primary", label: "Primary" },
  { key: "primaryDark", label: "Primary Dark" },
  { key: "primaryDim", label: "Primary Dim" },
  { key: "primaryLight", label: "Primary Light" },
  { key: "primaryMid", label: "Primary Mid" },
  { key: "bgDark", label: "Background Dark" },
  { key: "bgMid", label: "Background Mid" },
  { key: "bgLight", label: "Background Light" },
  { key: "bgCard", label: "Card Background" },
  { key: "text", label: "Text" },
  { key: "textDim", label: "Text Dim" },
  { key: "accent1", label: "Accent 1 (Abilities)" },
  { key: "accent2", label: "Accent 2 (Carried)" },
  { key: "accent3", label: "Accent 3 (Equipment)" },
  { key: "accent4", label: "Accent 4 (Mask)" },
  { key: "danger", label: "Danger" },
  { key: "dangerLight", label: "Danger Light" },
];

/* ─── SKILL GROUPS ─── */
export const SKILL_GROUPS = {
  "CHARISMA (2)": { base: 2, skills: [{ name: "Aggression", base: 2 },{ name: "Deception", base: 2 },{ name: "Intimidate", base: 2 },{ name: "Perform", base: 2 },{ name: "Persuasion", base: 2 }] },
  "CONSTITUTION (1)": { base: 1, skills: [{ name: "Health (x4)", base: 13 }] },
  "DEXTERITY (-2)": { base: -2, skills: [{ name: "Acrobatics", base: 1 },{ name: "Finesse Attack", base: -2 },{ name: "Piloting/Driving", base: -2 },{ name: "Ranged Attack", base: -2 },{ name: "Reflex", base: 3 },{ name: "Stealth", base: -2 }] },
  "INTELLIGENCE (1)*": { base: 1, skills: [{ name: "Crafting: Armor/Clothes", base: 20 },{ name: "Crafting: Food/Beverage", base: 2 },{ name: "Crafting: Weapons/Tools", base: 2 },{ name: "Culture", base: 2 },{ name: "Detection", base: 2 },{ name: "Hardware", base: 2 },{ name: "Machinery", base: 2 },{ name: "Vehicles", base: 2 },{ name: "Weaponry", base: 2 },{ name: "Linguistics", base: 2 },{ name: "Medicine", base: 2 },{ name: "Software", base: 2 }] },
  "STRENGTH (2)": { base: 2, skills: [{ name: "Athletics", base: 5 },{ name: "Fortitude", base: 12 },{ name: "Heavy Attack", base: 7 },{ name: "Light Attack", base: 2 }] },
  "WISDOM (-2)": { base: -2, skills: [{ name: "Animal Handling", base: 4 },{ name: "Arcana", base: 15 },{ name: "Enchantments", base: 3 },{ name: "Insight", base: 9 },{ name: "Spirituality", base: 15 },{ name: "Survival", base: 3 },{ name: "Will", base: 4 }] },
};

/* ─── EQUIPMENT ─── */
export const ITEM_CATEGORIES = ["armor", "weapons", "misc"];
export const ITEM_CAT_LABELS = { armor: "🛡 Armor", weapons: "⚔ Weapons", misc: "🎒 Misc" };

export const DEFAULT_SLOT_POSITIONS = [
  { id: "head",     label: "Head",      x: 109, y: 23,  accent: null },
  { id: "mask",     label: "Mask",      x: 207, y: 23,  accent: "#c77dff" },
  { id: "armor",    label: "Armor",     x: 109, y: 96,  accent: null },
  { id: "mainHand", label: "Main Hand", x: 11,  y: 111, accent: null },
  { id: "offHand",  label: "Off Hand",  x: 207, y: 111, accent: null },
  { id: "hands",    label: "Hands",     x: 11,  y: 159, accent: null },
  { id: "belt",     label: "Belt",      x: 109, y: 156, accent: null },
  { id: "feet",     label: "Feet",      x: 109, y: 246, accent: null },
  { id: "other",    label: "Other",     x: 207, y: 159, accent: null },
];

export const BODY_SLOTS = {};
DEFAULT_SLOT_POSITIONS.forEach(s => { BODY_SLOTS[s.id] = { label: s.label, accent: s.accent }; });

export const DEFAULT_INVENTORY = [
  { id: "sword1", name: "Protosteel Longsword", category: "weapons", stats: "Actions: 4 | Damage: 3d12+5", notes: "Only 3 enchant capacity", slot: "mainHand", bonuses: {} },
  { id: "buckler1", name: "Mithril Buckler", category: "armor", stats: "+3 Reflex & Fortitude", notes: "Enchanted: Answerer (4 ench) — truth. Resistance + Upgrade (4 ench) — +8 Will vs magic.", slot: "offHand", bonuses: { Reflex: 3, Fortitude: 3, Will: 8 }, bonusNotes: { Will: "vs magic" } },
  { id: "armor1", name: "Estex Armor", category: "armor", stats: "+6 Armor", notes: "Enchanted: Resistance + Upgrade (4 ench) — +8 Will vs magic.", slot: "armor", bonuses: { _armor: 6, Will: 8 }, bonusNotes: { Will: "vs magic" } },
  { id: "coif1", name: "Chain Coif", category: "armor", stats: "6 Temp HP", notes: "Enchanted: Speed + Upgrade — +2 move actions.", slot: "head", bonuses: { _tempHP: 6, _moveActions: 2 } },
  { id: "gloves1", name: "Chain Gloves", category: "armor", stats: "6 Temp HP", notes: "Enchanted: Speed + Upgrade — +2 move actions.", slot: "hands", bonuses: { _tempHP: 6, _moveActions: 2 } },
  { id: "boots1", name: "Chain Boots", category: "armor", stats: "6 Temp HP", notes: "Enchanted: Speed + Upgrade — +2 move actions.", slot: "feet", bonuses: { _tempHP: 6, _moveActions: 2 } },
  { id: "belt1", name: "Heirloom Belt (Rahr Jass)", category: "misc", stats: "+1/+3/+5 all defenses", notes: "Jewels activated by sonic energy, lasts 10 turns.", slot: "belt", bonuses: {} },
];

export const DEFAULT_ABILITIES = [
  { name: "Minute Meteors", cost: "3 actions", desc: "Summon 6 tiny meteors that float around you. For 1 action, send one zooming to a space. All targets on and next to that space take 1d8 damage. Unused meteors last 10 turns. Arcana vs Reflex.", used: 0, maxUses: 1, mode: "active" },
  { name: "Ice Storm", cost: "9 actions", desc: "Hit a 4x4 area with a blizzard. Everyone takes 2d4 frost damage and cannot use move actions. Move the blizzard at 1 space/action. Lasts until called off. Arcana vs Fortitude.", used: 0, maxUses: 1, mode: "active" },
  { name: "Lightning Lure", cost: "4 actions", desc: "Imbue a visible target as a lightning rod. Next lightning attack auto-hits and deals extra 1d10 damage. Lasts 5 turns. Arcana vs Will.", used: 0, maxUses: 1, mode: "active" },
  { name: "Lightning Bolt", cost: "6 actions", desc: "Launch a bolt in a 1x20 line. Everyone caught takes 1d10 damage (triple if armor 7+). Arcana vs Fortitude.", used: 0, maxUses: 1, mode: "active" },
  { name: "Immolate", cost: "3 actions", desc: "Set a visible target aflame with magical fire. Cannot be extinguished except by magic for 5 turns. Arcana vs Fortitude.", used: 0, maxUses: 1, mode: "active" },
  { name: "Frost Bolt", cost: "4 actions", desc: "Deals 1d4 Frost damage and reduces target's actions by -2 (stackable) for 2 turns. Arcana vs Reflex. Range 10.", used: 0, maxUses: 1, mode: "active" },
  { name: "Earthshock", cost: "6 actions", desc: "Earth erupts around you, dealing 1d6 impact damage to all enemies within 3 spaces. Spirituality vs Fortitude.", used: 0, maxUses: 1, mode: "active" },
  { name: "Revivify", cost: "9 actions", desc: "Heal yourself or a visible ally for 2d8+4 HP. Unlimited uses per battle. Spirituality vs Will.", used: 0, maxUses: -1, mode: "active" },
  { name: "Wind Wall Nuva Totem", cost: "2 actions", desc: "Creates an impassable 3x3x3 dome of wind. Magical attacks take lower of 2d20. Physical objects may pass if allowed (weakens wall until next turn). Lasts until recalled/destroyed. Spirituality.", used: 0, maxUses: 1, mode: "active" },
  { name: "Wind Blast Totem", cost: "2 actions", desc: "Launches air blast each turn at target within 20 spaces, dealing 1d4 damage and limiting them to 1 Move action. Spirituality vs Fortitude.", used: 0, maxUses: 1, mode: "active" },
  { name: "Catapult Totem Nuva", cost: "2 actions", desc: "Boosts up to 3 targets within 5 spaces to a space up to 10 spaces away. Costs targets 1 action on next turn. Spirituality vs Fortitude.", used: 0, maxUses: 1, mode: "active" },
  { name: "Staunch Totem", cost: "2 actions", desc: "Has 40 HP instead of 5. Uses your Spirituality as Aggression to force enemies within 3 spaces to attack it. Retains current HP on recall/reuse. Spirituality vs Will.", used: 0, maxUses: 1, mode: "active" },
  { name: "Vodou", cost: "600 actions", desc: "Construct a doll tied to someone you know. When they're damaged, the doll is too. Stitch it up: 5 actions, roll 1d6 + Crafting: Armor/Clothes to heal. Crafting vs Will.", used: 0, maxUses: 1, mode: "active" },
  { name: "Kanohi", cost: "600", desc: "Various Masks.", used: 0, maxUses: 1, mode: "active" },
  { name: "Kanohi Nuva", cost: "600", desc: "Various Upgraded Masks.", used: 0, maxUses: 1, mode: "active" },
  { name: "Forest Dweller", cost: "—", desc: "+3 to all Intelligence skills while working with wood and herbs.", used: 0, maxUses: -1, mode: "passive" },
  { name: "Winter Fur", cost: "—", desc: "+1 Fortitude, withstand near-freezing climates.", used: 0, maxUses: -1, mode: "passive" },
  { name: "Totemic Summons", cost: "—", desc: "Totems cost 2 to summon instead of 3.", used: 0, maxUses: -1, mode: "passive" },
  { name: "Totemic Empowerment", cost: "—", desc: "Totems can only take 1 damage per attack (except Staunch Totem).", used: 0, maxUses: -1, mode: "passive" },
  { name: "Tough", cost: "—", desc: "Add your level to your Total HP.", used: 0, maxUses: -1, mode: "passive" },
];

export const MAX_LEVEL = 30;
export const POINTS_PER_LEVEL = 3;

export const EDITOR_COLORS = [
  { label: "Default", value: "#c8c0b0" },
  { label: "Fire", value: "#e85d4a" },
  { label: "Frost", value: "#5dadec" },
  { label: "Lightning", value: "#f0d060" },
  { label: "Nature", value: "#6bce6b" },
  { label: "Arcane", value: "#c77dff" },
  { label: "Holy", value: "#ffe4a0" },
  { label: "Shadow", value: "#8888aa" },
  { label: "White", value: "#ffffff" },
];

export const fmtMod = (v) => (v >= 0 ? `+${v}` : `${v}`);
