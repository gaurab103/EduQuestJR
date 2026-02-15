/** XP required to reach a given level (cumulative from level 1). Level 1 = 0, L2 = 100, L3 = 250, L4 = 450... */
const XP_PER_LEVEL_BASE = 100;

export const DAILY_FREE_PLAY_MINUTES = 15;
export const MAX_LEVEL = 99;

/**
 * Total XP needed to be at this level (cumulative).
 * level 1: 0, level 2: 100, level 3: 250, level 4: 450
 */
export function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor((level * (level - 1) / 2) * XP_PER_LEVEL_BASE);
}

/**
 * Compute current level from total XP.
 */
export function levelFromXP(totalXP) {
  if (totalXP <= 0) return 1;
  let level = 1;
  while (level < MAX_LEVEL && xpForLevel(level + 1) <= totalXP) {
    level += 1;
  }
  return level;
}

/**
 * XP needed to reach next level from current total XP.
 */
export function xpToNextLevel(totalXP) {
  const current = levelFromXP(totalXP);
  if (current >= MAX_LEVEL) return 0;
  const nextThreshold = xpForLevel(current + 1);
  return nextThreshold - totalXP;
}

/**
 * Progress fraction to next level (0–1).
 */
export function progressToNextLevel(totalXP) {
  const current = levelFromXP(totalXP);
  if (current >= MAX_LEVEL) return 1;
  const currentThreshold = xpForLevel(current);
  const nextThreshold = xpForLevel(current + 1);
  const segment = nextThreshold - currentThreshold;
  const progress = totalXP - currentThreshold;
  return Math.min(1, progress / segment);
}
