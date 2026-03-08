// Re-export all data from a single entry point
export { default as ABILITY_DESCRIPTIONS } from './descriptions.js';
export { ABILITY_UPGRADES, ABILITY_SKILL_EFFECTS } from './abilityData.js';
export {
  THEME_PRESETS, THEME_FIELDS, SKILL_GROUPS, ITEM_CATEGORIES, ITEM_CAT_LABELS,
  DEFAULT_SLOT_POSITIONS, BODY_SLOTS, DEFAULT_INVENTORY, DEFAULT_ABILITIES,
  MAX_LEVEL, POINTS_PER_LEVEL, EDITOR_COLORS, fmtMod
} from './constants.js';

// JSON data
import raceData from './raceData.json';
import classData from './classData.json';

export const RACE_DATA = raceData;
export const RACE_NAMES = Object.keys(raceData);
export const CLASS_DATA = classData;
export const CLASS_NAMES = Object.keys(classData);
