import Game from '../models/Game.js';

const GAMES = [
  // ── Free Cognitive Games ──
  { title: 'Shape Match Quest', slug: 'shape-match-quest', category: 'cognitive', difficulty: 'easy', isPremium: false, description: 'Find matching shapes! Tap the shape that matches the one shown.' },
  { title: 'Pattern Master', slug: 'pattern-master', category: 'cognitive', difficulty: 'easy', isPremium: false, description: 'Complete the pattern! What comes next?' },
  { title: 'Memory Flip Arena', slug: 'memory-flip-arena', category: 'cognitive', difficulty: 'easy', isPremium: false, description: 'Flip cards to find matching pairs. Train your memory!' },
  { title: 'Odd One Out', slug: 'odd-one-out', category: 'cognitive', difficulty: 'easy', isPremium: false, description: 'Which one doesn\'t belong? Find the different one!' },
  { title: 'Color Basket Sorting', slug: 'color-basket-sorting', category: 'cognitive', difficulty: 'easy', isPremium: false, description: 'Sort objects by color into the right baskets!' },
  { title: 'Big vs Small', slug: 'big-vs-small', category: 'cognitive', difficulty: 'easy', isPremium: false, description: 'Which is bigger? Which is smaller? Compare sizes!' },
  { title: 'Match by Category', slug: 'match-by-category', category: 'cognitive', difficulty: 'easy', isPremium: false, description: 'Group things that go together. Fruits, animals, and more!' },
  { title: 'Cause & Effect Tap', slug: 'cause-effect-tap', category: 'cognitive', difficulty: 'easy', isPremium: false, description: 'Tap to see what happens! Learn cause and effect.' },
  { title: 'Shadow Match', slug: 'shadow-match', category: 'cognitive', difficulty: 'easy', isPremium: false, description: 'Match each object to its shadow!' },
  { title: 'Science Sort', slug: 'science-sort', category: 'cognitive', difficulty: 'easy', isPremium: false, description: 'Sort items by type. Living things, objects, and more!' },

  // ── Free Numeracy Games ──
  { title: 'Counting Adventure', slug: 'counting-adventure', category: 'numeracy', difficulty: 'easy', isPremium: false, description: 'Count the objects! Tap the correct number.' },
  { title: 'Addition Island', slug: 'addition-island', category: 'numeracy', difficulty: 'easy', isPremium: false, description: 'Add numbers together! Solve simple addition.' },
  { title: 'Missing Number', slug: 'missing-number', category: 'numeracy', difficulty: 'easy', isPremium: false },
  { title: 'More or Less', slug: 'more-or-less', category: 'numeracy', difficulty: 'easy', isPremium: false },
  { title: 'Number Bonds', slug: 'number-bonds', category: 'numeracy', difficulty: 'easy', isPremium: false },
  { title: 'Clock Time', slug: 'clock-time', category: 'numeracy', difficulty: 'medium', isPremium: false },
  { title: 'Money Math', slug: 'money-math', category: 'numeracy', difficulty: 'medium', isPremium: false },

  // ── Free Literacy Games ──
  { title: 'Alphabet Bubble Pop', slug: 'alphabet-bubble-pop', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Letter Sound Match', slug: 'letter-sound-match', category: 'literacy', difficulty: 'easy', isPremium: false, description: 'Match letters to their sounds. A says ah!' },
  { title: 'Picture Word Match', slug: 'picture-word-match', category: 'literacy', difficulty: 'easy', isPremium: false, description: 'Match the picture to the word! Learn new words.' },
  { title: 'ABC Order', slug: 'abc-order', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Rhyming Match', slug: 'rhyming-match', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Opposites Match', slug: 'opposites-match', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Fill Missing Letter', slug: 'fill-missing-letter', category: 'literacy', difficulty: 'easy', isPremium: false, description: 'Complete the word! Pick the missing letter.' },
  { title: 'Word Scramble', slug: 'word-scramble', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Sight Words', slug: 'sight-words', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Vocab Match', slug: 'vocab-match', category: 'literacy', difficulty: 'easy', isPremium: false },
  { title: 'Spelling Bee', slug: 'spelling-bee', category: 'literacy', difficulty: 'medium', isPremium: false },

  // ── Free Motor Games ──
  { title: 'Tap the Color', slug: 'tap-the-color', category: 'motor', difficulty: 'easy', isPremium: false, description: 'Tap the right color! Fast and fun color matching.' },
  { title: 'Balloon Pop', slug: 'balloon-pop', category: 'motor', difficulty: 'easy', isPremium: false, description: 'Pop the balloons! Tap to burst them all.' },
  { title: 'Trace Letters', slug: 'trace-letters', category: 'motor', difficulty: 'easy', isPremium: false, description: 'Trace the letters with your finger. Learn to write!' },
  { title: 'Color Inside Shape', slug: 'color-inside-shape', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Stack the Blocks', slug: 'stack-blocks', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Drawing Canvas', slug: 'drawing-canvas', category: 'motor', difficulty: 'easy', isPremium: false },
  { title: 'Handwriting Hero', slug: 'handwriting-hero', category: 'motor', difficulty: 'easy', isPremium: false },

  // ── Free SEL Games ──
  { title: 'Emotion Detective', slug: 'emotion-detective', category: 'sel', difficulty: 'easy', isPremium: false, description: 'How do they feel? Match faces to emotions!' },
  { title: 'Calm Breathing Bubble', slug: 'calm-breathing-bubble', category: 'sel', difficulty: 'easy', isPremium: false, description: 'Breathe in and out with the bubble. Feel calm!' },
  { title: 'Good Behavior Choice', slug: 'good-behavior-choice', category: 'sel', difficulty: 'easy', isPremium: false },

  // ── Free Auditory Games ──
  { title: 'Sound Safari', slug: 'sound-safari', category: 'auditory', difficulty: 'easy', isPremium: false, description: 'Listen and match! Find the sound that matches.' },

  // ── Free New Games ──
  { title: 'Story Sequence', slug: 'story-sequence', category: 'cognitive', difficulty: 'easy', isPremium: false },
  { title: 'Animal Quiz', slug: 'animal-quiz', category: 'cognitive', difficulty: 'easy', isPremium: false, description: 'Guess the animal! Learn about creatures big and small.' },
  { title: 'Color Mixing', slug: 'color-mixing', category: 'cognitive', difficulty: 'easy', isPremium: false, description: 'Mix colors to make new ones! Red + Blue = ?' },
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
  { title: 'Logic Grid Junior', slug: 'logic-grid-junior', category: 'cognitive', difficulty: 'medium', isPremium: true, description: 'Solve puzzles using clues. Think like a detective!' },
  { title: 'Phonics Blending Lab', slug: 'phonics-blending-lab', category: 'literacy', difficulty: 'medium', isPremium: true, description: 'Blend sounds to read words. C-A-T = Cat!' },
  { title: 'Digital Coloring Book', slug: 'digital-coloring-book', category: 'creativity', difficulty: 'easy', isPremium: true, description: 'Color beautiful pictures! Tap to fill in.' },
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
