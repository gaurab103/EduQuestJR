/**
 * Voice teaching — speaks CLEAR educational feedback after every answer.
 * When WRONG: explains the mistake in detail, teaches the correct answer,
 *   gives a fun fact, and encourages the child.
 * When CORRECT: praise + relevant fun fact.
 *
 * KEY: Voice must finish BEFORE the next round starts.
 * getFeedbackDelay() in levelConfig.js is tuned to match these durations.
 */
import { useCallback, useRef } from 'react';

/* ── Rich fact banks ────────────────────────────────────────── */

const COUNTING_FACTS = [
  (n) => `Let's count together: ${Array.from({ length: Math.min(n, 10) }, (_, i) => i + 1).join(', ')}!`,
  (n) => `${n} comes right after ${n - 1} when we count.`,
  (n) => `Can you show me ${n} fingers? Try it!`,
  (n) => `If you have ${n} toys and get one more, you'll have ${n + 1}!`,
  (n) => n > 2 ? `${n} is ${n - 1} plus one more!` : `${n} is a small number. Great start!`,
];

const MATH_EXPLAIN = {
  addition: (a, b, ans) => `When we add ${a} and ${b}, we get ${ans}. Imagine ${a} apples in one hand and ${b} in the other. Put them together and count: ${ans} apples!`,
  subtraction: (a, b, ans) => `${a} take away ${b} equals ${ans}. If you have ${a} cookies and eat ${b}, you have ${ans} left!`,
  compare: (a, b) => a > b ? `${a} is bigger than ${b}. It has more!` : a < b ? `${b} is bigger than ${a}. It has more!` : `${a} and ${b} are the same!`,
};

const LETTER_FACTS = {
  A: 'A is for Apple. A is the first letter of the alphabet!', B: 'B is for Ball. B makes the buh sound!',
  C: 'C is for Cat. C can make a kuh or sss sound!', D: 'D is for Dog. D makes the duh sound!',
  E: 'E is for Elephant. E is a vowel!', F: 'F is for Fish. F makes the fff sound!',
  G: 'G is for Grape. G can make a guh or juh sound!', H: 'H is for Hat. H makes the huh sound!',
  I: 'I is for Ice cream. I is a vowel!', J: 'J is for Juice. J makes the juh sound!',
  K: 'K is for Kite. K makes the kuh sound!', L: 'L is for Lion. L makes the lll sound!',
  M: 'M is for Moon. M makes the mmm sound!', N: 'N is for Nest. N makes the nnn sound!',
  O: 'O is for Orange. O is a vowel!', P: 'P is for Penguin. P makes the puh sound!',
  Q: 'Q is for Queen. Q almost always has U after it!', R: 'R is for Rainbow. R makes the rrr sound!',
  S: 'S is for Sun. S makes the sss sound!', T: 'T is for Tree. T makes the tuh sound!',
  U: 'U is for Umbrella. U is a vowel!', V: 'V is for Violin. V makes the vvv sound!',
  W: 'W is for Whale. W makes the wuh sound!', X: 'X is for X-ray. X makes the ks sound!',
  Y: 'Y is for Yellow. Y can be a vowel or consonant!', Z: 'Z is for Zebra. Z makes the zzz sound!',
};

const COLOR_FACTS = {
  red: 'Red is the color of apples and fire trucks!', blue: 'Blue is the color of the sky and ocean!',
  green: 'Green is the color of grass and leaves!', yellow: 'Yellow is the color of the sun and bananas!',
  orange: 'Orange is the color of oranges and pumpkins!', purple: 'Purple is the color of grapes and plums!',
  pink: 'Pink is the color of flamingos and cotton candy!', brown: 'Brown is the color of chocolate and bears!',
  black: 'Black is the color of night and crows!', white: 'White is the color of snow and clouds!',
};

const SHAPE_FACTS = {
  circle: 'Circles are perfectly round, like a ball or the sun!',
  square: 'Squares have 4 equal sides and 4 corners!',
  triangle: 'Triangles have 3 sides and 3 corners!',
  star: 'Stars usually have 5 points. Look up at the sky!',
  heart: 'Hearts are the shape of love! We see them everywhere!',
  diamond: 'Diamonds have 4 sides tilted to the side, like a kite!',
  rectangle: 'Rectangles have 2 long sides and 2 short sides!',
  hexagon: 'Hexagons have 6 sides, just like a honeycomb!',
  oval: 'Ovals are like stretched circles, like an egg!',
  pentagon: 'Pentagons have 5 sides!',
};

const ANIMAL_FACTS = {
  dog: 'Dogs wag their tails when they are happy!', cat: 'Cats purr when they feel safe and happy!',
  rabbit: 'Rabbits love to eat carrots and hop around!', bear: 'Bears sleep through the whole winter!',
  frog: 'Frogs start as tiny tadpoles in water!', elephant: 'Elephants have amazing memories. They never forget!',
  lion: 'Lions are called the king of the jungle!', whale: 'Whales are the biggest animals on Earth!',
  fish: 'Fish breathe underwater using gills!', penguin: 'Penguins cannot fly, but they are great swimmers!',
  owl: 'Owls can turn their heads almost all the way around!', dolphin: 'Dolphins talk to each other with clicks and whistles!',
  turtle: 'Some turtles can live to be over 100 years old!', butterfly: 'Butterflies start life as caterpillars!',
  bee: 'Bees work together to make sweet honey!', duck: 'Ducks have special waterproof feathers!',
  bird: 'Most birds can fly, but some like penguins cannot!', monkey: 'Monkeys are very smart and use tools!',
  fox: 'Foxes have super sharp hearing!', cow: 'Cows give us milk to drink!',
  horse: 'Horses can sleep standing up!', tiger: 'Every tiger has unique stripes, like fingerprints!',
  panda: 'Pandas spend most of their day eating bamboo!', koala: 'Koalas sleep up to 22 hours a day!',
  octopus: 'Octopuses have 8 arms and 3 hearts!', crab: 'Crabs walk sideways!',
  dinosaur: 'Dinosaurs lived millions and millions of years ago!', mouse: 'Mice have excellent hearing!',
  giraffe: 'Giraffes are the tallest animals on the planet!', ant: 'Ants can carry 50 times their own weight!',
  pig: 'Pigs are actually very intelligent animals!', chicken: 'Chickens can remember over 100 faces!',
  shark: 'Sharks have been around longer than dinosaurs!', spider: 'Spiders make silk to build webs!',
  snail: 'Snails carry their homes on their backs!', seahorse: 'Seahorses swim upright, unlike other fish!',
};

const EMOTION_FACTS = {
  happy: 'When we feel happy, we smile and our hearts feel warm!',
  sad: 'It is okay to feel sad sometimes. Talking about it helps!',
  angry: 'When we feel angry, taking deep breaths can help us calm down!',
  scared: 'Feeling scared is normal. Being brave means trying even when afraid!',
  surprised: 'Surprises can be fun! Our eyes get big and we say wow!',
  excited: 'When we are excited, we feel full of energy!',
  tired: 'When we feel tired, our body needs rest and sleep!',
  calm: 'Feeling calm is peaceful. Deep breathing helps us feel calm!',
  love: 'Love is a warm, wonderful feeling we share with people we care about!',
  confused: 'When we feel confused, it means we are learning something new!',
};

const SCIENCE_FACTS = [
  'Water can be solid ice, liquid water, or steam!',
  'Plants need sunlight, water, and soil to grow!',
  'The sun gives us light and warmth every day!',
  'Rain comes from clouds in the sky!',
  'Animals need food, water, and air just like us!',
  'Seeds grow into plants when you give them water and sun!',
  'Magnets can push and pull metal things!',
  'Sound is made when things vibrate!',
  'Light helps us see everything around us!',
  'The moon changes shape throughout the month!',
];

const TIME_FACTS = [
  'There are 60 seconds in one minute!',
  'There are 60 minutes in one hour!',
  'A day has 24 hours, from morning to night!',
  'The short hand on a clock shows the hour!',
  'The long hand on a clock shows the minutes!',
  'When the long hand points to 12, it is exactly on the hour!',
];

const MUSIC_FACTS = [
  'Music is made of different sounds and rhythms!',
  'Every song has a beat, like a heartbeat!',
  'Instruments make different sounds based on their shape!',
  'Singing is one of the oldest forms of music!',
  'Listening to patterns in music helps your brain grow!',
];

const SPATIAL_FACTS = [
  'Finding your way through a maze is like solving a puzzle!',
  'When you plan a path, you are using your brain like a map!',
  'Directions like left, right, up, and down help us navigate!',
];

/* ── Response templates ─────────────────────────────────────── */

const CORRECT_SHORT = [
  'Great job!', 'Awesome!', 'Perfect!', 'Well done!', 'Fantastic!',
  'Brilliant!', 'Superstar!', 'Amazing!', 'Wonderful!', 'Nailed it!',
  'You got it!', 'Excellent!', 'Spot on!', 'Impressive!', 'Magnificent!',
];
const CORRECT_NAMED = [
  '{name}, great job!', '{name}, you\'re amazing!', 'Way to go, {name}!',
  'Fantastic, {name}!', '{name}, you\'re a superstar!', 'Brilliant, {name}!',
  '{name}, that\'s perfect!', '{name}, you nailed it!', 'Incredible, {name}!',
  '{name}, you\'re so smart!',
];
const WRONG_EXPLAIN = [
  'Oops, not quite!', 'Almost there!', 'Let me explain.',
  'Let\'s learn this together!', 'Good try! Here\'s what happened.',
  'That\'s okay! Let me teach you.', 'No worries! Let\'s figure this out.',
  'Nice try! Let me show you.',
];
const WRONG_TAKE_TIME = [
  'Take your time! Let me teach you carefully.',
  'Not so fast! Let\'s slow down and learn this together.',
  'No rush! Here\'s what you need to know.',
  'It\'s okay to take your time. Let me explain.',
];
const WRONG_NAMED = [
  'Almost, {name}! Let me help.', 'Good try, {name}! Here\'s what happened.',
  '{name}, let me explain!', 'Not quite, {name}. Let me teach you!',
  'That\'s okay, {name}! Let\'s learn this.',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/**
 * Build a QUESTION-BASED explanation — tied to what was actually asked.
 * Prefer contextual teaching over random facts.
 */
function buildExplanation(type, context) {
  const { answer, correctAnswer, extra, a, b, question, word, blank, object, sides, mix, corners } = context;
  const ca = correctAnswer;

  switch (type) {
    case 'counting':
      if (ca !== undefined) return pick(COUNTING_FACTS)(Number(ca));
      return '';

    case 'addition':
      if (a !== undefined && b !== undefined && ca !== undefined)
        return MATH_EXPLAIN.addition(a, b, ca);
      return ca !== undefined ? `The answer is ${ca}.` : '';

    case 'subtraction':
      if (a !== undefined && b !== undefined && ca !== undefined)
        return MATH_EXPLAIN.subtraction(a, b, ca);
      return ca !== undefined ? `The answer is ${ca}.` : '';

    case 'math':
      if (a !== undefined && b !== undefined && ca !== undefined) {
        return Number(ca) === Number(a) + Number(b)
          ? MATH_EXPLAIN.addition(a, b, ca)
          : MATH_EXPLAIN.subtraction(a, b, ca);
      }
      return ca !== undefined ? `The correct answer is ${ca}.` : '';

    case 'compare':
      if (a !== undefined && b !== undefined)
        return MATH_EXPLAIN.compare(Number(a), Number(b));
      return ca !== undefined ? `The correct answer is ${ca}.` : '';

    case 'letter':
      if (word && ca !== undefined) {
        const w = String(word).toLowerCase();
        const letter = String(ca).toUpperCase();
        const pos = blank === 0 ? 'first' : blank === w.length - 1 ? 'last' : 'middle';
        return `The letter ${letter} goes in the ${pos} of ${w.toUpperCase()} to make ${w}!`;
      }
      return LETTER_FACTS[String(ca || answer || '').toUpperCase()] || '';

    case 'color':
      if (mix && mix.a && mix.b && mix.result)
        return `When we mix ${mix.a} and ${mix.b}, we get ${mix.result}!`;
      if (object && ca !== undefined) {
        const obj = String(object).charAt(0).toUpperCase() + String(object).slice(1).toLowerCase();
        return `${obj} is ${ca}!`;
      }
      return COLOR_FACTS[String(ca || '').toLowerCase()] || '';

    case 'shape':
      if (extra && typeof extra === 'string' && extra.trim()) return extra;
      if (sides !== undefined && ca !== undefined) {
        const attr = corners ? 'corners' : 'sides';
        return `A ${String(ca).toLowerCase()} has ${sides} ${attr}!`;
      }
      return SHAPE_FACTS[String(ca || '').toLowerCase()] || '';

    case 'animal':
      if (question && ca !== undefined) {
        const q = String(question).toLowerCase();
        const animal = String(ca).toLowerCase();
        const cap = animal.charAt(0).toUpperCase() + animal.slice(1);
        if (q.includes('find') || q.includes('tap') || q.includes('match'))
          return `That's the ${cap}!`;
        if (q.includes('says') || q.includes('woof') || q.includes('meow') || q.includes('quack'))
          return `Yes! ${cap} ${q.includes('woof') ? 'says Woof!' : q.includes('meow') ? 'says Meow!' : q.includes('quack') ? 'says Quack!' : 'makes that sound!'}`;
        if (q.includes('lives') || q.includes('ocean') || q.includes('water'))
          return `Yes! ${cap} ${q.includes('ocean') || q.includes('water') ? 'lives in the water!' : 'lives there!'}`;
        if (q.includes('has') || q.includes('trunk') || q.includes('stripes') || q.includes('neck'))
          return `Yes! ${cap} ${q.includes('trunk') ? 'has a trunk!' : q.includes('stripes') ? 'has stripes!' : q.includes('neck') ? 'has a long neck!' : 'has that!'}`;
        if (q.includes('hops') || q.includes('flies') || q.includes('swims'))
          return `Yes! ${cap} ${q.includes('hops') ? 'hops!' : q.includes('flies') ? 'flies!' : 'swims!'}`;
      }
      return ANIMAL_FACTS[String(ca || '').toLowerCase()] || '';

    case 'emotion':
      if (question && ca !== undefined) {
        const q = String(question).toLowerCase();
        if (q.includes('feel') || q.includes('would'))
          return `Yes! In that situation, they would feel ${ca}!`;
      }
      return EMOTION_FACTS[String(ca || '').toLowerCase()] || '';

    case 'science':
      return extra || pick(SCIENCE_FACTS);

    case 'time':
      return extra || pick(TIME_FACTS);

    case 'music':
      return extra || pick(MUSIC_FACTS);

    case 'spatial':
      return extra || pick(SPATIAL_FACTS);

    case 'sequence':
      return extra || 'Sequences follow a pattern. Look for what repeats or changes!';

    case 'word':
      return extra || '';

    default:
      return extra || '';
  }
}

/* ── Speech engine ──────────────────────────────────────────── */

let speechBusyUntil = 0;

function speakText(text, opts = {}) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate ?? 0.82;
  u.pitch = opts.pitch ?? 1.15;
  u.volume = opts.volume ?? 0.9;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Female')
  );
  if (preferred) u.voice = preferred;

  const words = text.split(/\s+/).length;
  const rate = u.rate || 1;
  const wordsPerSec = 2.0 * rate;
  const estimatedMs = Math.ceil((words / wordsPerSec) * 1000) + 800;
  speechBusyUntil = Date.now() + estimatedMs;

  window.speechSynthesis.speak(u);
}

/* ── Hook ───────────────────────────────────────────────────── */

export function useTeaching() {
  const isMutedRef = useRef(false);
  try { isMutedRef.current = localStorage.getItem('eduquest_muted') === 'true'; } catch {}

  const childNameRef = useRef('');
  const setChildName = useCallback((name) => { childNameRef.current = name || ''; }, []);

  /**
   * teachAfterAnswer — call immediately when kid answers.
   *
   * context shape:
   *   { type, answer, correctAnswer, extra, a, b, answeredTooFast }
   *   - answeredTooFast: true if kid answered wrong very quickly → "Take your time"
   *   - type, answer, correctAnswer, extra, a, b as before
   */
  const teachAfterAnswer = useCallback((correct, context = {}) => {
    if (isMutedRef.current) return;
    const { type, answer, correctAnswer, answeredTooFast } = context;
    const name = childNameRef.current;

    let msg;
    if (correct) {
      msg = name ? pick(CORRECT_NAMED).replace('{name}', name) : pick(CORRECT_SHORT);
      const fact = buildExplanation(type, context);
      if (fact) msg += ' ' + fact;
    } else {
      if (answeredTooFast) {
        msg = pick(WRONG_TAKE_TIME);
      } else {
        msg = name ? pick(WRONG_NAMED).replace('{name}', name) : pick(WRONG_EXPLAIN);
      }

      if (answer !== undefined && correctAnswer !== undefined) {
        msg += ` You picked ${answer}, but the correct answer is ${correctAnswer}.`;
      } else if (correctAnswer !== undefined) {
        msg += ` The correct answer is ${correctAnswer}.`;
      }

      const explanation = buildExplanation(type, context);
      if (explanation) msg += ' ' + explanation;

      msg += ' You\'re learning so well! Let\'s keep going!';
    }

    speakText(msg, {
      rate: correct ? 0.85 : 0.72,
      pitch: correct ? 1.15 : 1.02,
    });
  }, []);

  /**
   * readQuestion — read the question aloud. Waits for previous speech to end.
   */
  const readQuestion = useCallback((text) => {
    if (isMutedRef.current || !text) return () => {};

    const now = Date.now();
    const waitMs = Math.max(900, speechBusyUntil - now + 500);

    const timer = setTimeout(() => {
      speakText(text, { rate: 0.8, pitch: 1.2 });
    }, waitMs);
    return () => clearTimeout(timer);
  }, []);

  /**
   * teachFact — speak a standalone fact.
   */
  const teachFact = useCallback((text) => {
    if (isMutedRef.current || !text) return;
    speakText(text, { rate: 0.82, pitch: 1.15 });
  }, []);

  /**
   * getRecommendedDelayBeforeNext — call AFTER teachAfterAnswer.
   * Returns delay (ms) so voice finishes before next question. Use:
   *   teachAfterAnswer(correct, context);
   *   const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, correct, answeredTooFast));
   *   setTimeout(() => setRound(r => r + 1), delay);
   */
  const getRecommendedDelayBeforeNext = useCallback((minDelay) => {
    const remaining = speechBusyUntil - Date.now();
    return Math.max(minDelay, Math.max(0, remaining));
  }, []);

  return { teachAfterAnswer, readQuestion, teachFact, setChildName, getRecommendedDelayBeforeNext };
}

export { ANIMAL_FACTS, LETTER_FACTS, COLOR_FACTS, SHAPE_FACTS, EMOTION_FACTS, SCIENCE_FACTS, TIME_FACTS, MUSIC_FACTS };
