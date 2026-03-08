import {
  SKILL_GROUPS, DEFAULT_SLOT_POSITIONS, DEFAULT_ABILITIES,
  DEFAULT_INVENTORY, MAX_LEVEL, THEME_PRESETS,
} from "./data";

export function makeBlankSkills() {
  const s = {};
  Object.entries(SKILL_GROUPS).forEach(([, data]) => {
    data.skills.forEach((sk) => {
      s[sk.name] = { base: sk.base, bonus: "", temp: 0, tempNote: "" };
    });
  });
  return s;
}

export function makeBlankLevelLog() {
  const log = [];
  for (let i = 1; i <= MAX_LEVEL; i++) {
    log.push({
      level: i,
      points: [{ skill: "", amount: 1 }, { skill: "", amount: 1 }, { skill: "", amount: 1 }],
      abilityType: "",
      abilityName: "",
      abilityDesc: "",
      abilityNotes: "",
      locked: false,
    });
  }
  return log;
}

export const DEFAULT_TEXT_STYLES = {
  heading: { size: 0.70, color: "" },
  label: { size: 0.60, color: "" },
  body: { size: 0.85, color: "" },
  value: { size: 0.90, color: "" },
  meta: { size: 0.55, color: "" },
};

export const BLANK_CHARACTER = {
  info: {
    name: "", player: "", race: "Human", class_: "Fighter", level: 1,
    alignment: "", age: "", height: "", weight: "", sex: "",
  },
  racialStats: {},
  initialTotal: 16,
  skills: makeBlankSkills(),
  hp: { max: 0, current: 0, temp: 0 },
  inventory: [],
  slotPositions: DEFAULT_SLOT_POSITIONS,
  bodySlots: {
    head: null, mask: null, armor: null, mainHand: null,
    offHand: null, hands: null, feet: null, belt: null, other: null,
  },
  inventoryFolders: [
    { id: "equipment", name: "Equipment", icon: "⚔", locked: true, items: [] },
    { id: "carried", name: "Carried", icon: "🧳", locked: false, items: [] },
    { id: "bag_of_holding", name: "Bag of Holding", icon: "👜", locked: false, items: [] },
  ],
  currency: { cp: 0, sp: 0, gp: 0, pp: 0 },
  abilities: DEFAULT_ABILITIES,
  customAbilities: [],
  charNotes: "",
  sessionNotes: [],
  levelLog: makeBlankLevelLog(),
  theme: THEME_PRESETS.forest,
  textStyles: DEFAULT_TEXT_STYLES,
};

/* Hugh Jass PhD seed data — the original hardcoded character */
export const HUGH_JASS_SEED = {
  info: {
    name: "Hugh Jass PhD", player: "Ian Cox", race: "Wookie", class_: "Shaman",
    level: 21, alignment: "Chaotic Slightly Evil", age: "128", height: "7'4\"",
    weight: "300lbs", sex: "M",
  },
  racialStats: { Charisma: 1, Intelligence: 1 },
  initialTotal: 16,
  skills: (() => {
    const s = {};
    Object.entries(SKILL_GROUPS).forEach(([, data]) => {
      data.skills.forEach((sk) => {
        s[sk.name] = { base: sk.base, bonus: "", temp: 0, tempNote: "" };
      });
    });
    return s;
  })(),
  hp: { max: 73, current: 73, temp: 18 },
  inventory: DEFAULT_INVENTORY,
  slotPositions: DEFAULT_SLOT_POSITIONS,
  bodySlots: {
    head: "coif1", mask: null, armor: "armor1", mainHand: "sword1",
    offHand: "buckler1", hands: "gloves1", feet: "boots1", belt: "belt1", other: null,
  },
  inventoryFolders: [
    { id: "equipment", name: "Equipment", icon: "⚔", locked: true, items: [] },
    { id: "carried", name: "Carried", icon: "🧳", locked: false, items: [
      { id: "ci_1", name: "Chloroplasts", notes: "1 hour sun/day: no eat/sleep, heal 1 hp/turn in sun", qty: 1 },
      { id: "ci_2", name: "Injectors (x3)", notes: "3 liquids (vial each), 1 action to inject, 4 actions to refill", qty: 1 },
      { id: "ci_3", name: "TempWeave", notes: "+5 Armor, max 5 enchants", qty: 1 },
    ]},
    { id: "bag_of_holding", name: "Bag of Holding", icon: "👜", locked: false, items: [] },
  ],
  currency: { cp: 0, sp: 0, gp: 0, pp: 0 },
  abilities: DEFAULT_ABILITIES,
  customAbilities: [],
  charNotes: "Original roll: 16 points\nTotal added: 60 points (level 20, 3x20) + 8 from Ironass\nYOU GET 3 POINTS PER LEVEL\nMax net 15 points per skill (start at -3 → can put 18 to reach +15)\nMinor grammatical knowledge in Demonic\n\nSpellcatching Upgraded: x4 enchant levels, armor stores 2 spells instead of 1, casting costs 1 action",
  sessionNotes: [
    { id: 1, title: "Session 0 — Character Creation", date: "", content: "Built Hugh Jass PhD. Rolled 16 initial points. Wookie Shaman." },
  ],
  levelLog: (() => {
    const log = [];
    for (let i = 1; i <= MAX_LEVEL; i++) {
      log.push({
        level: i,
        points: [{ skill: "", amount: 1 }, { skill: "", amount: 1 }, { skill: "", amount: 1 }],
        abilityType: "",
        abilityName: "",
        abilityDesc: "",
        abilityNotes: "",
        locked: i <= 21,
      });
    }
    return log;
  })(),
  theme: THEME_PRESETS.forest,
  textStyles: {
    heading: { size: 0.70, color: "" },
    label: { size: 0.60, color: "" },
    body: { size: 0.85, color: "" },
    value: { size: 0.90, color: "" },
    meta: { size: 0.55, color: "" },
  },
};
