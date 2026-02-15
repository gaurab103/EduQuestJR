/**
 * Voice teaching helper — speaks educational content after every answer.
 * Provides age-appropriate explanations, fun facts, and encouragement.
 */
import { useCallback, useRef } from 'react';
import { useAudio } from '../context/AudioContext';

/* ── Teaching fact banks ─────────────────────────────────────── */
const COUNTING_FACTS = [
  (n) => `${n}! Let's count together: ${Array.from({length: n}, (_, i) => i + 1).join(', ')}!`,
  (n) => `${n} is the answer! ${n} comes after ${n - 1}.`,
  (n) => `That's ${n}! Can you show ${n} fingers?`,
  (n) => n > 1 ? `${n} things! ${n} is ${n - 1} plus 1.` : `Just 1! One is the first number.`,
];

const LETTER_FACTS = {
  A: 'A is for Apple! A makes the "ah" sound.',
  B: 'B is for Ball! B makes the "buh" sound.',
  C: 'C is for Cat! C makes the "kuh" sound.',
  D: 'D is for Dog! D makes the "duh" sound.',
  E: 'E is for Elephant! E makes the "eh" sound.',
  F: 'F is for Fish! F makes the "fff" sound.',
  G: 'G is for Grape! G makes the "guh" sound.',
  H: 'H is for Hat! H makes the "huh" sound.',
  I: 'I is for Ice cream! I makes the "ih" sound.',
  J: 'J is for Juice! J makes the "juh" sound.',
  K: 'K is for Kite! K makes the "kuh" sound.',
  L: 'L is for Lion! L makes the "lll" sound.',
  M: 'M is for Moon! M makes the "mmm" sound.',
  N: 'N is for Nest! N makes the "nnn" sound.',
  O: 'O is for Orange! O makes the "oh" sound.',
  P: 'P is for Penguin! P makes the "puh" sound.',
  Q: 'Q is for Queen! Q makes the "kwuh" sound.',
  R: 'R is for Rainbow! R makes the "rrr" sound.',
  S: 'S is for Sun! S makes the "sss" sound.',
  T: 'T is for Tree! T makes the "tuh" sound.',
  U: 'U is for Umbrella! U makes the "uh" sound.',
  V: 'V is for Violin! V makes the "vvv" sound.',
  W: 'W is for Whale! W makes the "wuh" sound.',
  X: 'X is for X-ray! X makes the "ks" sound.',
  Y: 'Y is for Yellow! Y makes the "yuh" sound.',
  Z: 'Z is for Zebra! Z makes the "zzz" sound.',
};

const COLOR_FACTS = {
  red: 'Red is the color of apples and fire trucks!',
  blue: 'Blue is the color of the sky and the ocean!',
  green: 'Green is the color of grass and leaves!',
  yellow: 'Yellow is the color of the sun and bananas!',
  orange: 'Orange is the color of oranges and pumpkins!',
  purple: 'Purple is the color of grapes and lavender!',
  pink: 'Pink is the color of flamingos and cotton candy!',
  brown: 'Brown is the color of chocolate and tree trunks!',
  black: 'Black is the color of night and space!',
  white: 'White is the color of snow and clouds!',
};

const SHAPE_FACTS = {
  circle: 'A circle is round with no corners! Wheels and balls are circles.',
  square: 'A square has 4 equal sides and 4 corners! Windows are often squares.',
  triangle: 'A triangle has 3 sides and 3 corners! Pizza slices look like triangles.',
  rectangle: 'A rectangle has 4 sides — 2 long and 2 short! Doors are rectangles.',
  star: 'A star has 5 points! Stars twinkle in the night sky.',
  heart: 'A heart shape means love! We see hearts on Valentine\'s Day.',
  diamond: 'A diamond is a tilted square! It has 4 sides.',
  oval: 'An oval is like a stretched circle! Eggs are ovals.',
  hexagon: 'A hexagon has 6 sides! Honeycombs are hexagons.',
};

const ANIMAL_FACTS = {
  dog: 'Dogs are loyal friends! They wag their tails when happy.',
  cat: 'Cats purr when they\'re happy! They love to nap.',
  rabbit: 'Rabbits hop and love carrots! Their ears help them hear far away.',
  bear: 'Bears are big and strong! They sleep all winter.',
  frog: 'Frogs can jump 20 times their body length! They start as tadpoles.',
  fox: 'Foxes are clever! They have super hearing.',
  monkey: 'Monkeys are very smart! They use their tails to hang from trees.',
  elephant: 'Elephants are the biggest land animals! They never forget.',
  lion: 'Lions are called the king of the jungle! They live in groups called prides.',
  whale: 'Whales are the biggest animals ever! Blue whales can be 100 feet long.',
  fish: 'Fish breathe through gills! They live in water.',
  penguin: 'Penguins can\'t fly but they\'re great swimmers!',
  owl: 'Owls can turn their heads almost all the way around!',
  dolphin: 'Dolphins are very smart! They talk to each other with clicks.',
  turtle: 'Turtles carry their house on their back! Some live over 100 years.',
  bird: 'Birds have feathers and most of them can fly!',
  butterfly: 'Butterflies start as caterpillars! They have beautiful wings.',
  bee: 'Bees make honey! They help flowers grow by spreading pollen.',
  duck: 'Ducks have waterproof feathers! Baby ducks follow their mom everywhere.',
  cow: 'Cows give us milk! They spend 8 hours a day eating.',
  horse: 'Horses can sleep standing up! They run very fast.',
  tiger: 'Tigers have stripes! No two tigers have the same pattern.',
  panda: 'Pandas love bamboo! They eat for 12 hours a day.',
  koala: 'Koalas sleep 22 hours a day! They live in trees.',
  octopus: 'Octopuses have 8 arms and 3 hearts!',
  crab: 'Crabs walk sideways! They have hard shells to protect them.',
  shark: 'Sharks have been around longer than dinosaurs!',
  dinosaur: 'Dinosaurs lived millions of years ago! Some were huge and some were tiny.',
  mouse: 'Mice have excellent hearing! They love cheese.',
};

const MATH_ENCOURAGEMENT = [
  'Numbers are like building blocks for your brain!',
  'Math helps us count everything around us!',
  'Every great scientist started by learning to count!',
  'Practice makes perfect with numbers!',
  'You\'re becoming a math superstar!',
];

const CORRECT_PHRASES = [
  'Wonderful!', 'Amazing job!', 'You\'re so smart!', 'Fantastic!',
  'Brilliant!', 'Superstar!', 'You did it!', 'Incredible!',
  'Way to go!', 'Awesome!', 'Perfect!', 'Excellent!',
  'You\'re a genius!', 'Outstanding!', 'Magnificent!',
];

const WRONG_PHRASES = [
  'Not quite, but good try!', 'Almost there!', 'Let\'s learn from this!',
  'Keep going, you\'re doing great!', 'That\'s okay, let\'s try the next one!',
  'Don\'t worry, practice makes perfect!', 'Nice try! Let\'s keep learning!',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/**
 * useTeaching hook — call teachAfterAnswer() after every game answer.
 * It speaks educational voice feedback automatically.
 */
export function useTeaching() {
  const { speak } = useAudio();
  const lastSpoke = useRef(0);

  const teachAfterAnswer = useCallback((correct, context = {}) => {
    // Throttle: don't speak too rapidly
    const now = Date.now();
    if (now - lastSpoke.current < 800) return;
    lastSpoke.current = now;

    const { type, answer, correctAnswer, extra } = context;
    let msg = '';

    if (correct) {
      msg = pick(CORRECT_PHRASES) + ' ';
    } else {
      msg = pick(WRONG_PHRASES) + ' ';
      if (correctAnswer !== undefined) {
        msg += `The answer was ${correctAnswer}. `;
      }
    }

    // Add teaching content based on game type
    switch (type) {
      case 'counting': {
        const n = correctAnswer || answer;
        if (n) msg += pick(COUNTING_FACTS)(Number(n));
        break;
      }
      case 'letter': {
        const letter = String(correctAnswer || answer || '').toUpperCase();
        if (LETTER_FACTS[letter]) msg += LETTER_FACTS[letter];
        break;
      }
      case 'color': {
        const c = String(correctAnswer || answer || '').toLowerCase();
        if (COLOR_FACTS[c]) msg += COLOR_FACTS[c];
        break;
      }
      case 'shape': {
        const s = String(correctAnswer || answer || '').toLowerCase();
        if (SHAPE_FACTS[s]) msg += SHAPE_FACTS[s];
        break;
      }
      case 'animal': {
        const a = String(correctAnswer || answer || '').toLowerCase();
        if (ANIMAL_FACTS[a]) msg += ANIMAL_FACTS[a];
        break;
      }
      case 'math': {
        if (extra) msg += extra;
        else msg += pick(MATH_ENCOURAGEMENT);
        break;
      }
      case 'word': {
        if (extra) msg += extra;
        break;
      }
      default:
        if (extra) msg += extra;
        break;
    }

    speak(msg, { rate: 0.82, pitch: 1.15 });
  }, [speak]);

  // Speak a standalone teaching moment (not tied to correct/wrong)
  const teachFact = useCallback((text) => {
    speak(text, { rate: 0.8, pitch: 1.15 });
  }, [speak]);

  // Speak the question/prompt to the child
  const readQuestion = useCallback((text) => {
    speak(text, { rate: 0.78, pitch: 1.2 });
  }, [speak]);

  return { teachAfterAnswer, teachFact, readQuestion };
}

export { ANIMAL_FACTS, LETTER_FACTS, COLOR_FACTS, SHAPE_FACTS };
