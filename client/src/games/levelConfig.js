/**
 * Shared level configuration for ALL games.
 * 30 levels grouped into 6 worlds, each with 5 levels.
 * Difficulty scales progressively and noticeably.
 */

export const MAX_GAME_LEVEL = 30;

export const WORLDS = [
  { id: 1, name: 'Meadow', emoji: '🌿', levels: [1, 2, 3, 4, 5], color: '#4ade80' },
  { id: 2, name: 'Forest', emoji: '🌲', levels: [6, 7, 8, 9, 10], color: '#38bdf8' },
  { id: 3, name: 'Mountain', emoji: '⛰️', levels: [11, 12, 13, 14, 15], color: '#a78bfa' },
  { id: 4, name: 'Sky', emoji: '☁️', levels: [16, 17, 18, 19, 20], color: '#fbbf24' },
  { id: 5, name: 'Stars', emoji: '⭐', levels: [21, 22, 23, 24, 25], color: '#f472b6' },
  { id: 6, name: 'Cosmos', emoji: '🌌', levels: [26, 27, 28, 29, 30], color: '#818cf8' },
];

export function getWorldForLevel(level) {
  return WORLDS.find(w => level >= w.levels[0] && level <= w.levels[w.levels.length - 1]) || WORLDS[0];
}

/**
 * Get number of rounds for a given level.
 * Every level has at least 10 questions so kids get enough practice.
 */
export function getRounds(level) {
  if (level <= 5) return 10;
  if (level <= 10) return 12;
  if (level <= 15) return 14;
  if (level <= 20) return 16;
  if (level <= 25) return 18;
  return 20;
}

/**
 * Get number of answer choices for a given level.
 * More choices = harder. Scales more aggressively now.
 */
export function getChoiceCount(level) {
  if (level <= 3) return 2;
  if (level <= 7) return 3;
  if (level <= 15) return 4;
  if (level <= 22) return 5;
  return 6;
}

/**
 * Get max number range for counting/math games.
 * Scales more aggressively for real difficulty progression.
 */
export function getMaxNumber(level) {
  if (level <= 2) return 3;
  if (level <= 4) return 5;
  if (level <= 6) return 7;
  if (level <= 8) return 10;
  if (level <= 10) return 12;
  if (level <= 13) return 15;
  if (level <= 16) return 20;
  if (level <= 20) return 30;
  if (level <= 25) return 50;
  return 100;
}

/**
 * Get time allowed for answer (in ms) - decreases with level.
 * Returns 0 for no time limit (levels 1-5).
 */
export function getTimeLimit(level) {
  if (level <= 5) return 0;
  if (level <= 10) return 15000;
  if (level <= 15) return 12000;
  if (level <= 20) return 10000;
  if (level <= 25) return 8000;
  return 6000;
}

/**
 * Get feedback delay (ms) before next round.
 * IMPORTANT: Must be long enough for the voice to finish teaching!
 *
 * When WRONG: extra time for careful teaching. If answeredTooFast (< 2s),
 * add more delay so voice can say "Take your time" and teach fully.
 */
export function getFeedbackDelay(level, isCorrect = true, answeredTooFast = false) {
  if (isCorrect) {
    // Must allow voice to finish praise + fact. Slightly snappier for engagement.
    if (level <= 5) return 5000;
    if (level <= 10) return 4600;
    if (level <= 20) return 4200;
    return 3800;
  }
  // Wrong: longer for careful teaching. ECD kids need time to process.
  let base = level <= 5 ? 10000 : level <= 10 ? 9500 : level <= 20 ? 9000 : 8000;
  if (answeredTooFast) base += 2500; // "Take your time" + full teaching
  return base;
}

/**
 * Progressive difficulty within a level: Q1 easier, last question slightly harder.
 * Returns 0 (easiest) to 1 (hardest) for round index.
 * Games can use this to pick content: pool[Math.min(floor(t * pool.length), pool.length-1)]
 */
export function getRoundDifficultyFactor(level, round, totalRounds) {
  if (totalRounds <= 1) return 0;
  const progress = round / (totalRounds - 1);
  const levelScale = Math.min(1, (level - 1) / 10);
  return Math.min(1, progress * (0.6 + 0.4 * levelScale));
}

/**
 * Get difficulty label for display.
 */
export function getDifficultyLabel(level) {
  if (level <= 5) return 'Easy';
  if (level <= 10) return 'Medium';
  if (level <= 15) return 'Hard';
  if (level <= 20) return 'Expert';
  if (level <= 25) return 'Master';
  return 'Legend';
}

/**
 * Get difficulty color.
 */
export function getDifficultyColor(level) {
  if (level <= 5) return '#4ade80';
  if (level <= 10) return '#38bdf8';
  if (level <= 15) return '#fbbf24';
  if (level <= 20) return '#fb923c';
  if (level <= 25) return '#f472b6';
  return '#a78bfa';
}

/**
 * Get speed multiplier for timed/reaction games.
 * Higher levels = faster animations, shorter windows.
 */
export function getSpeedMultiplier(level) {
  if (level <= 5) return 1.0;
  if (level <= 10) return 1.2;
  if (level <= 15) return 1.4;
  if (level <= 20) return 1.6;
  if (level <= 25) return 1.8;
  return 2.0;
}

/**
 * Get complexity tier (1-6) for games that need to unlock
 * new question types or mechanics at higher levels.
 */
export function getComplexityTier(level) {
  if (level <= 5) return 1;
  if (level <= 10) return 2;
  if (level <= 15) return 3;
  if (level <= 20) return 4;
  if (level <= 25) return 5;
  return 6;
}

/**
 * Filter pool to exclude level-1-only content when level >= 2.
 * Use: pool.filter((_, i) => i >= getLevelMinPoolIndex(level, pool.length))
 * Ensures no "beginner" content appears at higher levels.
 */
export function getLevelMinPoolIndex(level, poolLength) {
  if (level <= 1) return 0;
  const skip = Math.min(Math.floor(poolLength * 0.15), Math.floor(poolLength / 3));
  return skip;
}
