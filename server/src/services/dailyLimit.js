/**
 * If lastDailyReset is not today (UTC date), reset dailyPlayMinutesUsed to 0.
 * Call this when reading child for play or when submitting progress.
 */
export function ensureDailyReset(child) {
  const now = new Date();
  const reset = new Date(child.lastDailyReset || 0);
  const sameDay =
    now.getUTCFullYear() === reset.getUTCFullYear() &&
    now.getUTCMonth() === reset.getUTCMonth() &&
    now.getUTCDate() === reset.getUTCDate();

  if (!sameDay) {
    child.dailyPlayMinutesUsed = 0;
    child.lastDailyReset = now;
    return true;
  }
  return false;
}
