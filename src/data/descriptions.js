import raceDescriptions from './raceDescriptions.json';
import classDescriptions from './classDescriptions.json';

/* Merge all descriptions into one lookup */
const ABILITY_DESCRIPTIONS = {
  ...raceDescriptions,
  ...classDescriptions,
};

export default ABILITY_DESCRIPTIONS;

export function getAbilityDescription(name) {
  return ABILITY_DESCRIPTIONS[name] || "";
}
