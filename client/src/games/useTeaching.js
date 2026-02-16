/**
 * Voice teaching helper — speaks educational content after every answer.
 * Manages a speech queue so voices NEVER overlap or double-fire.
 */
import { useCallback, useRef } from 'react';
import { useAudio } from '../context/AudioContext';

/* ── Teaching fact banks ─────────────────────────────────────── */
const COUNTING_FACTS = [
  (n) => `${n}! Let's count: ${Array.from({length: Math.min(n, 10)}, (_, i) => i + 1).join(', ')}!`,
  (n) => `That's ${n}! ${n} comes after ${n - 1}.`,
  (n) => `${n}! Can you show ${n} fingers?`,
  (n) => n > 1 ? `${n} things! ${n} is ${n - 1} plus 1.` : `Just 1! One is the first number.`,
];

const LETTER_FACTS = {
  A: 'A is for Apple! Ah sound.', B: 'B is for Ball! Buh sound.',
  C: 'C is for Cat! Kuh sound.', D: 'D is for Dog! Duh sound.',
  E: 'E is for Elephant! Eh sound.', F: 'F is for Fish! Fff sound.',
  G: 'G is for Grape! Guh sound.', H: 'H is for Hat! Huh sound.',
  I: 'I is for Ice cream! Ih sound.', J: 'J is for Juice! Juh sound.',
  K: 'K is for Kite! Kuh sound.', L: 'L is for Lion! Lll sound.',
  M: 'M is for Moon! Mmm sound.', N: 'N is for Nest! Nnn sound.',
  O: 'O is for Orange! Oh sound.', P: 'P is for Penguin! Puh sound.',
  Q: 'Q is for Queen! Kwuh sound.', R: 'R is for Rainbow! Rrr sound.',
  S: 'S is for Sun! Sss sound.', T: 'T is for Tree! Tuh sound.',
  U: 'U is for Umbrella! Uh sound.', V: 'V is for Violin! Vvv sound.',
  W: 'W is for Whale! Wuh sound.', X: 'X is for X-ray! Ks sound.',
  Y: 'Y is for Yellow! Yuh sound.', Z: 'Z is for Zebra! Zzz sound.',
};

const COLOR_FACTS = {
  red: 'Red like apples and fire trucks!',
  blue: 'Blue like the sky and ocean!',
  green: 'Green like grass and leaves!',
  yellow: 'Yellow like the sun and bananas!',
  orange: 'Orange like oranges and pumpkins!',
  purple: 'Purple like grapes!',
  pink: 'Pink like flamingos!',
  brown: 'Brown like chocolate!',
  black: 'Black like night!',
  white: 'White like snow!',
};

const SHAPE_FACTS = {
  circle: 'Circles are round with no corners!',
  square: 'Squares have 4 equal sides!',
  triangle: 'Triangles have 3 sides!',
  rectangle: 'Rectangles have 2 long and 2 short sides!',
  star: 'Stars have 5 points!',
  heart: 'Hearts mean love!',
  diamond: 'Diamonds have 4 sides!',
  oval: 'Ovals are stretched circles!',
  hexagon: 'Hexagons have 6 sides!',
};

const ANIMAL_FACTS = {
  dog: 'Dogs wag their tails when happy!',
  cat: 'Cats purr when happy!',
  rabbit: 'Rabbits hop and love carrots!',
  bear: 'Bears sleep all winter!',
  frog: 'Frogs start as tadpoles!',
  fox: 'Foxes have super hearing!',
  monkey: 'Monkeys use tails to hang from trees!',
  elephant: 'Elephants are the biggest land animals!',
  lion: 'Lions are called the king of the jungle!',
  whale: 'Blue whales are the biggest animals ever!',
  fish: 'Fish breathe through gills!',
  penguin: 'Penguins are great swimmers!',
  owl: 'Owls can turn their heads almost all the way around!',
  dolphin: 'Dolphins talk with clicks!',
  turtle: 'Some turtles live over 100 years!',
  bird: 'Most birds can fly!',
  butterfly: 'Butterflies start as caterpillars!',
  bee: 'Bees make honey!',
  duck: 'Ducks have waterproof feathers!',
  cow: 'Cows give us milk!',
  horse: 'Horses can sleep standing up!',
  tiger: 'No two tigers have the same stripes!',
  panda: 'Pandas love bamboo!',
  koala: 'Koalas sleep 22 hours a day!',
  octopus: 'Octopuses have 8 arms and 3 hearts!',
  crab: 'Crabs walk sideways!',
  dinosaur: 'Dinosaurs lived millions of years ago!',
  mouse: 'Mice have excellent hearing!',
};

const CORRECT_PHRASES = [
  'Wonderful!', 'Amazing!', 'Great job!', 'Fantastic!',
  'Brilliant!', 'Superstar!', 'You did it!', 'Awesome!',
  'Perfect!', 'Excellent!', 'Well done!', 'Outstanding!',
];

const WRONG_PHRASES = [
  'Good try!', 'Almost!', 'Keep going!', 'Nice try!',
  'That\'s okay!', 'Let\'s try the next one!',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/**
 * useTeaching hook — manages voice feedback with proper queue to prevent overlap.
 * Uses a ref-based approach so it won't cause re-renders or infinite effect loops.
 */
export function useTeaching() {
  const { speak } = useAudio();
  const speakRef = useRef(speak);
  speakRef.current = speak;

  // Global speech lock — prevents overlapping speech
  const busyUntil = useRef(0);

  const safeSpeakNow = useCallback((text, opts = {}) => {
    const now = Date.now();
    // If speech is busy, skip this utterance to prevent overlap
    if (now < busyUntil.current) return;
    // Estimate speech duration: ~80ms per word
    const words = text.split(/\s+/).length;
    const estimatedMs = Math.max(1500, words * 120);
    busyUntil.current = now + estimatedMs;
    speakRef.current(text, opts);
  }, []);

  /**
   * Call after every answer. Speaks teaching feedback.
   */
  const teachAfterAnswer = useCallback((correct, context = {}) => {
    const { type, answer, correctAnswer, extra } = context;
    let msg = correct ? pick(CORRECT_PHRASES) : pick(WRONG_PHRASES);

    if (!correct && correctAnswer !== undefined) {
      msg += ` The answer was ${correctAnswer}.`;
    }

    // Add a SHORT teaching fact based on game type
    switch (type) {
      case 'counting': {
        const n = correctAnswer || answer;
        if (n) msg += ' ' + pick(COUNTING_FACTS)(Number(n));
        break;
      }
      case 'letter': {
        const letter = String(correctAnswer || answer || '').toUpperCase();
        if (LETTER_FACTS[letter]) msg += ' ' + LETTER_FACTS[letter];
        break;
      }
      case 'color': {
        const c = String(correctAnswer || answer || '').toLowerCase();
        if (COLOR_FACTS[c]) msg += ' ' + COLOR_FACTS[c];
        break;
      }
      case 'shape': {
        const s = String(correctAnswer || answer || '').toLowerCase();
        if (SHAPE_FACTS[s]) msg += ' ' + SHAPE_FACTS[s];
        break;
      }
      case 'animal': {
        const a = String(correctAnswer || answer || '').toLowerCase();
        if (ANIMAL_FACTS[a]) msg += ' ' + ANIMAL_FACTS[a];
        break;
      }
      case 'math':
      case 'word':
      default:
        if (extra) msg += ' ' + extra;
        break;
    }

    safeSpeakNow(msg, { rate: 0.88, pitch: 1.15 });
  }, [safeSpeakNow]);

  /**
   * Read the question aloud. Uses a 1.5s delay to avoid overlapping with teachAfterAnswer.
   * Returns a cleanup function to cancel the timeout.
   */
  const readQuestion = useCallback((text) => {
    const timer = setTimeout(() => {
      safeSpeakNow(text, { rate: 0.82, pitch: 1.2 });
    }, 1600);
    return () => clearTimeout(timer);
  }, [safeSpeakNow]);

  /**
   * Speak a standalone teaching fact.
   */
  const teachFact = useCallback((text) => {
    safeSpeakNow(text, { rate: 0.85, pitch: 1.15 });
  }, [safeSpeakNow]);

  return { teachAfterAnswer, teachFact, readQuestion };
}

export { ANIMAL_FACTS, LETTER_FACTS, COLOR_FACTS, SHAPE_FACTS };
