/**
 * Encouraging feedback messages for kids.
 * Use for correct/wrong feedback to keep kids engaged.
 */

export const CORRECT_MESSAGES = [
  '✓ Correct!',
  '✓ Yes!',
  '✓ Great job!',
  '✓ Awesome!',
  '✓ You got it!',
  '✓ Perfect!',
  '✓ Well done!',
  '✓ Super!',
];

export const WRONG_PREFIXES = [
  'Almost!',
  'Good try!',
  'Nice effort!',
  'Close!',
  'Not quite!',
  'Almost there!',
];

export function getCorrectMessage(streak = 0) {
  if (streak >= 3) return '🔥 Amazing streak!';
  return CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
}

export function getWrongPrefix() {
  return WRONG_PREFIXES[Math.floor(Math.random() * WRONG_PREFIXES.length)];
}
