import Game from '../models/Game.js';

const GAMES = [
  // ── Free Cognitive Games ──
  { title: 'Shape Match Quest', slug: 'shape-match-quest', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Pattern Master', slug: 'pattern-master', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Memory Flip Arena', slug: 'memory-flip-arena', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Odd One Out', slug: 'odd-one-out', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Color Basket Sorting', slug: 'color-basket-sorting', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Big vs Small', slug: 'big-vs-small', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Match by Category', slug: 'match-by-category', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Cause & Effect Tap', slug: 'cause-effect-tap', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Shadow Match', slug: 'shadow-match', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Science Sort', slug: 'science-sort', category: 'cognitive', difficulty: 'easy', isPremium: false },

  // ── Free Numeracy Games ──
  { title: 'Counting Adventure', slug: 'counting-adventure', category: 'numeracy', difficulty: 'easy', isPremium: false },
  { title: 'Addition Island', slug: 'addition-island', category: 'numeracy', difficulty: 'easy', isPremium: false },
  { title: 'Missing Number', slug: 'missing-number', category: 'numeracy', difficulty: 'easy', isPremium: false },
  { title: 'More or Less', slug: 'more-or-less', category: 'numeracy', difficulty: 'easy', isPremium: false },
  { title: 'Number Bonds', slug: 'number-bonds', category: 'numeracy', difficulty: 'easy', isPremium: false },
  { title: 'Clock Time', slug: 'clock-time', category: 'numeracy', difficulty: 'medium', isPremium: false },
  { title: 'Money Math', slug: 'money-math', category: 'numeracy', difficulty: 'medium', isPremium: false },

  // ── Free Literacy Games ──
  { title: 'Alphabet Bubble Pop', slug: 'alphabet-bubble-pop', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Letter Sound Match', slug: 'letter-sound-match', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Picture Word Match', slug: 'picture-word-match', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'ABC Order', slug: 'abc-order', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Rhyming Match', slug: 'rhyming-match', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Opposites Match', slug: 'opposites-match', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Fill Missing Letter', slug: 'fill-missing-letter', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Word Scramble', slug: 'word-scramble', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Sight Words', slug: 'sight-words', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Vocab Match', slug: 'vocab-match', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Spelling Bee', slug: 'spelling-bee', category: 'literacy', difficulty: 'medium', isPremium: false },

  // ── Free Motor Games ──
  { title: 'Tap the Color', slug: 'tap-the-color', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Balloon Pop', slug: 'balloon-pop', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Trace Letters', slug: 'trace-letters', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Color Inside Shape', slug: 'color-inside-shape', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Stack the Blocks', slug: 'stack-blocks', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Drawing Canvas', slug: 'drawing-canvas', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Handwriting Hero', slug: 'handwriting-hero', category: 'motor', difficulty: 'easy', isPremium: false },

  // ── Free SEL Games ──
  { title: 'Emotion Detective', slug: 'emotion-detective', category: 'sel', difficulty: 'easy', isPremium: false },
  { title: 'Calm Breathing Bubble', slug: 'calm-breathing-bubble', category: 'sel', difficulty: 'easy', isPremium: false },
  { title: 'Good Behavior Choice', slug: 'good-behavior-choice', category: 'sel', difficulty: 'easy', isPremium: false },

  // ── Free Auditory Games ──
  { title: 'Sound Safari', slug: 'sound-safari', category: 'auditory', difficulty: 'easy', isPremium: false },

  // ── Free New Games ──
  { title: 'Story Sequence', slug: 'story-sequence', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Animal Quiz', slug: 'animal-quiz', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Color Mixing', slug: 'color-mixing', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Body Parts', slug: 'body-parts', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Weather Learn', slug: 'weather-learn', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Dot Connect', slug: 'dot-connect', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Finger Trace Path', slug: 'finger-trace-path', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Drag & Sort', slug: 'drag-sort-game', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Emotion Match', slug: 'emotion-match', category: 'sel', difficulty: 'easy', isPremium: false },
  { title: 'Plant Grower', slug: 'plant-grower', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Compare Weight', slug: 'compare-weight', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Direction Quest', slug: 'direction-quest', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Number Line', slug: 'number-line', category: 'numeracy', difficulty: 'easy', isPremium: false },
  { title: 'Syllable Clap', slug: 'syllable-clap', category: 'literacy', difficulty: 'easy', isPremium: false },

  // ── Premium Games ──
  { title: 'Blockly Coding Lab', slug: 'blockly-coding-lab', category: 'future_skills', difficulty: 'medium', isPremium: true },
  { title: 'Subtraction Safari', slug: 'subtraction-safari', category: 'numeracy', difficulty: 'medium', isPremium: true },
  { title: 'Sequence Builder', slug: 'sequence-builder', category: 'cognitive', difficulty: 'medium', isPremium: true },
  { title: 'Logic Grid Junior', slug: 'logic-grid-junior', category: 'cognitive', difficulty: 'medium', isPremium: true },
  { title: 'Phonics Blending Lab', slug: 'phonics-blending-lab', category: 'literacy', difficulty: 'medium', isPremium: true },
  { title: 'Digital Coloring Book', slug: 'digital-coloring-book', category: 'creativity', difficulty: 'easy', isPremium: true },
  { title: 'Word Builder Pro', slug: 'word-builder-pro', category: 'literacy', difficulty: 'medium', isPremium: true },
  { title: 'Music Rhythm Tap', slug: 'music-rhythm-tap', category: 'auditory', difficulty: 'easy', isPremium: true },
  { title: 'Maze Explorer', slug: 'maze-explorer', category: 'cognitive', difficulty: 'medium', isPremium: true },
  { title: 'Shape Geometry Lab', slug: 'shape-geometry-lab', category: 'numeracy', difficulty: 'medium', isPremium: true },
  { title: 'Story Builder Studio', slug: 'story-builder-studio', category: 'literacy', difficulty: 'medium', isPremium: true },
  { title: 'Fraction Fun Land', slug: 'fraction-fun-land', category: 'numeracy', difficulty: 'medium', isPremium: true },
  { title: 'Multiplication Treasure', slug: 'multiplication-treasure', category: 'numeracy', difficulty: 'medium', isPremium: true },
  { title: 'Maze Runner', slug: 'maze-runner', category: 'motor', difficulty: 'medium', isPremium: true },
  { title: 'Musical Notes', slug: 'musical-notes', category: 'auditory', difficulty: 'medium', isPremium: true },
  { title: 'Time Sorter', slug: 'time-sorter', category: 'cognitive', difficulty: 'medium', isPremium: true },
  { title: 'Sort by Size', slug: 'sort-by-size', category: 'cognitive', difficulty: 'easy', isPremium: true },
  { title: 'Alphabet Tracing World', slug: 'alphabet-tracing-world', category: 'literacy', difficulty: 'easy', isPremium: true },
];

export async function seedGames() {
  const existing = await Game.countDocuments();
  const slugs = GAMES.map((g) => g.slug);
  for (const g of GAMES) {
    await Game.findOneAndUpdate({ slug: g.slug }, g, { upsert: true });
  }
  // Remove games no longer in the list (e.g. duplicates, deprecated)
  const removed = await Game.deleteMany({ slug: { $nin: slugs } });
  if (removed.deletedCount > 0) console.log(`Removed ${removed.deletedCount} deprecated game(s)`);
  if (existing === 0) console.log(`Games seeded (${GAMES.length} total)`);
}
