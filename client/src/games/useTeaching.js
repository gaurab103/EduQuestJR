/**
 * Voice teaching — speaks CLEAR educational feedback after every answer.
 * When WRONG: explains the mistake, teaches the correct answer, THEN moves on.
 * When CORRECT: brief praise + fact.
 * Manages speech so there's NEVER overlap or double-fire.
 */
import { useCallback, useRef } from 'react';

/* ── Fact banks (short & punchy) ────────────────────────────── */
const COUNTING_FACTS = [
  (n) => `Let's count: ${Array.from({length: Math.min(n, 8)}, (_, i) => i + 1).join(', ')}!`,
  (n) => `${n} comes after ${n - 1}.`,
  (n) => `Can you show ${n} fingers?`,
];

const LETTER_FACTS = {
  A:'A is for Apple.',B:'B is for Ball.',C:'C is for Cat.',D:'D is for Dog.',
  E:'E is for Elephant.',F:'F is for Fish.',G:'G is for Grape.',H:'H is for Hat.',
  I:'I is for Ice cream.',J:'J is for Juice.',K:'K is for Kite.',L:'L is for Lion.',
  M:'M is for Moon.',N:'N is for Nest.',O:'O is for Orange.',P:'P is for Penguin.',
  Q:'Q is for Queen.',R:'R is for Rainbow.',S:'S is for Sun.',T:'T is for Tree.',
  U:'U is for Umbrella.',V:'V is for Violin.',W:'W is for Whale.',X:'X is for X-ray.',
  Y:'Y is for Yellow.',Z:'Z is for Zebra.',
};

const COLOR_FACTS = {
  red:'Red like apples!',blue:'Blue like the sky!',green:'Green like grass!',
  yellow:'Yellow like the sun!',orange:'Orange like oranges!',purple:'Purple like grapes!',
  pink:'Pink like flamingos!',brown:'Brown like chocolate!',black:'Black like night!',white:'White like snow!',
};

const SHAPE_FACTS = {
  circle:'Circles are round!',square:'Squares have 4 equal sides!',triangle:'Triangles have 3 sides!',
  star:'Stars have 5 points!',heart:'Hearts mean love!',diamond:'Diamonds have 4 sides!',
  rectangle:'Rectangles have 2 long and 2 short sides!',hexagon:'Hexagons have 6 sides!',
};

const ANIMAL_FACTS = {
  dog:'Dogs wag their tails when happy!',cat:'Cats purr when happy!',rabbit:'Rabbits love carrots!',
  bear:'Bears sleep all winter!',frog:'Frogs start as tadpoles!',elephant:'Elephants never forget!',
  lion:'Lions are the king of the jungle!',whale:'Whales are the biggest animals!',
  fish:'Fish breathe through gills!',penguin:'Penguins are great swimmers!',
  owl:'Owls can turn their heads around!',dolphin:'Dolphins talk with clicks!',
  turtle:'Some turtles live over 100 years!',butterfly:'Butterflies start as caterpillars!',
  bee:'Bees make honey!',duck:'Ducks have waterproof feathers!',bird:'Most birds can fly!',
  monkey:'Monkeys are very smart!',fox:'Foxes have super hearing!',cow:'Cows give us milk!',
  horse:'Horses can sleep standing up!',tiger:'No two tigers have the same stripes!',
  panda:'Pandas love bamboo!',koala:'Koalas sleep 22 hours a day!',
  octopus:'Octopuses have 8 arms!',crab:'Crabs walk sideways!',
  dinosaur:'Dinosaurs lived millions of years ago!',mouse:'Mice have excellent hearing!',
};

const CORRECT_SHORT = ['Great job!','Awesome!','Perfect!','Well done!','Fantastic!','Brilliant!','Superstar!','Amazing!','Wonderful!','Nailed it!'];
const CORRECT_NAMED = ['{name}, great job!','{name}, you\'re amazing!','Way to go, {name}!','Fantastic, {name}!','{name}, you\'re a superstar!'];
const WRONG_EXPLAIN = ['Oops!','Not quite!','Almost!','Let me explain.','Let\'s learn this!','Good try!'];
const WRONG_NAMED = ['Almost, {name}!','Good try, {name}!','{name}, let me help!','Not quite, {name}!'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getFact(type, key) {
  if (!key) return '';
  const k = String(key);
  switch (type) {
    case 'counting': return pick(COUNTING_FACTS)(Number(k));
    case 'letter': return LETTER_FACTS[k.toUpperCase()] || '';
    case 'color': return COLOR_FACTS[k.toLowerCase()] || '';
    case 'shape': return SHAPE_FACTS[k.toLowerCase()] || '';
    case 'animal': return ANIMAL_FACTS[k.toLowerCase()] || '';
    default: return '';
  }
}

/**
 * Core speech function — cancels previous, speaks new.
 */
function speakText(text, opts = {}) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate ?? 0.88;
  u.pitch = opts.pitch ?? 1.15;
  u.volume = opts.volume ?? 0.8;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Female')
  );
  if (preferred) u.voice = preferred;
  window.speechSynthesis.speak(u);
}

/**
 * useTeaching hook.
 *
 * The answer flow in every game should be:
 *   1. Kid answers → playSuccess/playWrong
 *   2. Call teachAfterAnswer() → voice explains
 *   3. After feedbackDelay, call advanceRound() → new question state
 *   4. readQuestion() is called ONCE in the round-setup useEffect (NOT in deps)
 *
 * readQuestion waits 500ms then speaks (the feedbackDelay already gave
 * enough time for the teaching voice to finish before the round advanced).
 */
export function useTeaching() {
  const isMutedRef = useRef(false);

  // Check mute once
  try {
    isMutedRef.current = localStorage.getItem('eduquest_muted') === 'true';
  } catch {}

  /**
   * teachAfterAnswer — call immediately when kid answers.
   * If WRONG: clearly explains the correct answer and teaches why.
   * If CORRECT: brief praise + a fun fact.
   */
  const childNameRef = useRef('');

  const setChildName = useCallback((name) => {
    childNameRef.current = name || '';
  }, []);

  const teachAfterAnswer = useCallback((correct, context = {}) => {
    if (isMutedRef.current) return;
    const { type, answer, correctAnswer, extra } = context;
    const name = childNameRef.current;

    let msg;
    if (correct) {
      msg = name ? pick(CORRECT_NAMED).replace('{name}', name) : pick(CORRECT_SHORT);
      const fact = getFact(type, correctAnswer || answer) || extra || '';
      if (fact) msg += ' ' + fact;
    } else {
      msg = name ? pick(WRONG_NAMED).replace('{name}', name) : pick(WRONG_EXPLAIN);
      if (answer !== undefined && correctAnswer !== undefined) {
        msg += ` You picked ${answer}, but the right answer is ${correctAnswer}.`;
      } else if (correctAnswer !== undefined) {
        msg += ` The correct answer is ${correctAnswer}.`;
      }
      const fact = getFact(type, correctAnswer) || extra || '';
      if (fact) msg += ' ' + fact;
      msg += ' Let\'s keep going!';
    }

    speakText(msg, { rate: correct ? 0.92 : 0.85, pitch: 1.1 });
  }, []);

  /**
   * readQuestion — call in the round-setup useEffect to read the question aloud.
   * Has a 600ms delay so the previous round's speech is done.
   * Returns cleanup function.
   * DO NOT put in useEffect dependency arrays.
   */
  const readQuestion = useCallback((text) => {
    if (isMutedRef.current || !text) return () => {};
    const timer = setTimeout(() => {
      speakText(text, { rate: 0.82, pitch: 1.2 });
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  /**
   * teachFact — speak a standalone fact.
   */
  const teachFact = useCallback((text) => {
    if (isMutedRef.current || !text) return;
    speakText(text, { rate: 0.85, pitch: 1.15 });
  }, []);

  return { teachAfterAnswer, readQuestion, teachFact, setChildName };
}

export { ANIMAL_FACTS, LETTER_FACTS, COLOR_FACTS, SHAPE_FACTS };
