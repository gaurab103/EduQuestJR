/**
 * Plant Grower - Stages of plant growth: seed → sprout → plant → flower → fruit.
 * Kid puts stages in order. Also asks what plants need (water, sun, soil).
 * Teaches biology basics. Science / Free
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const GROWTH_STAGES = [
  { id: 'seed', label: 'Seed', emoji: TWEMOJI('1f331'), order: 1 },
  { id: 'sprout', label: 'Sprout', emoji: TWEMOJI('1f331'), order: 2 },
  { id: 'plant', label: 'Plant', emoji: TWEMOJI('1f331'), order: 3 },
  { id: 'flower', label: 'Flower', emoji: TWEMOJI('1f337'), order: 4 },
  { id: 'fruit', label: 'Fruit', emoji: TWEMOJI('1f34e'), order: 5 },
];

// Sprout emoji alternative - 1f331 has variants; use herb for sprout
const STAGE_EMOJIS = {
  seed: TWEMOJI('1f331'),
  sprout: TWEMOJI('1f33f'),
  plant: TWEMOJI('1f331'),
  flower: TWEMOJI('1f337'),
  fruit: TWEMOJI('1f34e'),
};

const PLANT_NEEDS_QUESTIONS = [
  { q: 'What do plants need to grow?', answer: 'sun', options: ['sun', 'ice', 'snow', 'wind'], imgs: { sun: TWEMOJI('2600'), ice: TWEMOJI('1f9ca'), snow: TWEMOJI('2744'), wind: TWEMOJI('1f32c') } },
  { q: 'What do we give plants to drink?', answer: 'water', options: ['water', 'juice', 'milk', 'soda'], imgs: { water: TWEMOJI('1f4a7'), juice: TWEMOJI('1f965'), milk: TWEMOJI('1f95b'), soda: TWEMOJI('1f964') } },
  { q: 'Where do plants grow?', answer: 'soil', options: ['soil', 'sand', 'rocks', 'water'], imgs: { soil: TWEMOJI('1f33f'), sand: TWEMOJI('26c5'), rocks: TWEMOJI('1faa8'), water: TWEMOJI('1f4a7') } },
  { q: 'What do plants need from the sky?', answer: 'sun', options: ['sun', 'rain', 'cloud', 'snow'], imgs: { sun: TWEMOJI('2600'), rain: TWEMOJI('1f327'), cloud: TWEMOJI('2601'), snow: TWEMOJI('2744') } },
  { q: 'What helps plants make food?', answer: 'sun', options: ['sun', 'moon', 'stars', 'clouds'], imgs: { sun: TWEMOJI('2600'), moon: TWEMOJI('1f319'), stars: TWEMOJI('2b50'), clouds: TWEMOJI('2601') } },
  { q: 'What do roots grow in?', answer: 'soil', options: ['soil', 'air', 'ice', 'fire'], imgs: { soil: TWEMOJI('1f33f'), air: TWEMOJI('1f32c'), ice: TWEMOJI('1f9ca'), fire: TWEMOJI('1f525') } },
  { q: 'What falls from clouds to water plants?', answer: 'rain', options: ['rain', 'snow', 'hail', 'fog'], imgs: { rain: TWEMOJI('1f327'), snow: TWEMOJI('2744'), hail: TWEMOJI('2602'), fog: TWEMOJI('1f32b') } },
  { q: 'Which is NOT something plants need?', answer: 'candy', options: ['candy', 'water', 'sun', 'soil'], imgs: { candy: TWEMOJI('1f36c'), water: TWEMOJI('1f4a7'), sun: TWEMOJI('2600'), soil: TWEMOJI('1f33f') } },
  { q: 'What do leaves use sunlight for?', answer: 'food', options: ['food', 'play', 'sleep', 'run'], imgs: { food: TWEMOJI('1f34e'), play: TWEMOJI('26bd'), sleep: TWEMOJI('1f4a4'), run: TWEMOJI('1f3c3') } },
  { q: 'What do bees help plants make?', answer: 'seeds', options: ['seeds', 'roots', 'stones', 'sand'], imgs: { seeds: TWEMOJI('1f331'), roots: TWEMOJI('1f33f'), stones: TWEMOJI('1faa8'), sand: TWEMOJI('26c5') } },
  { q: 'What color are most plant leaves?', answer: 'green', options: ['green', 'red', 'blue', 'purple'], imgs: null },
  { q: 'What part of a plant is underground?', answer: 'roots', options: ['roots', 'flowers', 'leaves', 'fruit'], imgs: { roots: TWEMOJI('1f33f'), flowers: TWEMOJI('1f337'), leaves: TWEMOJI('1f331'), fruit: TWEMOJI('1f34e') } },
  { q: 'What do flowers turn into?', answer: 'fruit', options: ['fruit', 'rocks', 'water', 'fire'], imgs: { fruit: TWEMOJI('1f34e'), rocks: TWEMOJI('1faa8'), water: TWEMOJI('1f4a7'), fire: TWEMOJI('1f525') } },
  { q: 'What do seeds need to sprout?', answer: 'water', options: ['water', 'wind', 'snow', 'ice'], imgs: { water: TWEMOJI('1f4a7'), wind: TWEMOJI('1f32c'), snow: TWEMOJI('2744'), ice: TWEMOJI('1f9ca') } },
  { q: 'Which plant part grows first?', answer: 'seed', options: ['seed', 'flower', 'fruit', 'leaves'], imgs: { seed: TWEMOJI('1f331'), flower: TWEMOJI('1f337'), fruit: TWEMOJI('1f34e'), leaves: TWEMOJI('1f331') } },
];

const GROWTH_SEQUENCES = [
  ['seed', 'sprout', 'plant'],
  ['seed', 'sprout', 'flower'],
  ['sprout', 'plant', 'flower'],
  ['seed', 'sprout', 'plant', 'flower'],
  ['seed', 'sprout', 'plant', 'flower', 'fruit'],
  ['sprout', 'plant', 'flower', 'fruit'],
];

const PLANT_FACTS = {
  seed: 'Seeds are baby plants! They need water and sun to grow.',
  sprout: 'A sprout is when the seed starts to grow. The roots go down!',
  plant: 'Plants grow leaves and stems. Leaves make food from sunlight.',
  flower: 'Flowers are pretty! Bees visit flowers and help make fruit.',
  fruit: 'Fruit has seeds inside! Apples and oranges are fruits.',
  sun: 'The sun gives plants light. Plants use light to make food!',
  water: 'Plants need water to drink, just like us!',
  soil: 'Soil holds the roots and gives plants nutrients.',
  rain: 'Rain waters plants naturally! Plants love rain.',
  food: 'Leaves use sunlight to make food. This is called photosynthesis!',
  seeds: 'Bees spread pollen. Then flowers make seeds!',
  green: 'Leaves are green because of chlorophyll. It helps them make food.',
  roots: 'Roots grow underground. They take in water and hold the plant.',
};

export default function PlantGrower({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [mode, setMode] = useState('order');
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [correctOrder, setCorrectOrder] = useState([]);
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICES = getChoiceCount(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }
    const isOrder = round % 2 === 0 || level <= 5;
    setMode(isOrder ? 'order' : 'needs');
    setFeedback(null);
    setSelected([]);
    if (isOrder) {
      const seqs = GROWTH_SEQUENCES.filter(s => s.length >= 3 && s.length <= Math.min(5, 3 + Math.floor(level / 5)));
      const ids = generate(
        () => seqs.length ? seqs[Math.floor(Math.random() * seqs.length)] : ['seed', 'sprout', 'plant', 'flower'],
        (r) => r.join('-')
      );
      const ordered = ids.map(id => GROWTH_STAGES.find(s => s.id === id)).filter(Boolean);
      const shuffled = [...ordered].sort(() => Math.random() - 0.5);
      setCorrectOrder(ordered);
      setCards(shuffled);
      setQuestion(null);
      setOptions([]);
    } else {
      const q = generate(
        () => PLANT_NEEDS_QUESTIONS[Math.floor(Math.random() * PLANT_NEEDS_QUESTIONS.length)],
        (r) => r.q
      );
      let opts = q.options.slice();
      if (opts.length > CHOICES) opts = opts.slice(0, CHOICES);
      setQuestion(q);
      setOptions(opts.sort(() => Math.random() - 0.5));
      setCorrectOrder([]);
      setCards([]);
    }
  }, [round, ROUNDS, correct, score, level]);

  useEffect(() => {
    if (round < ROUNDS) {
      let cancelRead;
      if (mode === 'order') {
        cancelRead = readQuestion('Put the plant stages in the correct order! Seed first, then sprout, then plant, flower, fruit.');
      } else if (question) {
        cancelRead = readQuestion(question.q);
      }
      return cancelRead;
    }
  }, [mode, question, round, ROUNDS]);

  function handleOrderClick(stage) {
    if (feedback || !correctOrder.length) return;
    if (selected.includes(stage)) return;
    playClick();
    const newSelected = [...selected, stage];
    setSelected(newSelected);
    if (newSelected.length === correctOrder.length) {
      const isCorrect = newSelected.every((s, i) => s.id === correctOrder[i].id);
      if (isCorrect) {
        setScore(s => s + 10);
        setCorrect(c => c + 1);
        playSuccess();
        setFeedback('correct');
      } else {
        playWrong();
        setFeedback('wrong');
      }
      const key = correctOrder[correctOrder.length - 1]?.id;
      teachAfterAnswer(isCorrect, { type: 'word', answer: 'order', correctAnswer: 'order', extra: PLANT_FACTS[key] || PLANT_FACTS.plant });
      const delay = getFeedbackDelay(level, isCorrect);
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }

  function handleNeedsClick(ans) {
    if (feedback) return;
    playClick();
    setSelected(ans);
    const isCorrect = ans === question.answer;
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      playSuccess();
      setFeedback('correct');
    } else {
      playWrong();
      setFeedback('wrong');
    }
    teachAfterAnswer(isCorrect, { type: 'word', answer: ans, correctAnswer: question.answer, extra: PLANT_FACTS[question.answer] || 'Plants need sun, water, and soil to grow!' });
    const delay = getFeedbackDelay(level, isCorrect);
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <img src={TWEMOJI('1f331')} alt="" style={{ width: 80, height: 80 }} />
          <h2>Plant Expert!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
      </div>
    );
  }

  if (mode === 'order') {
    if (!cards.length) return null;
    const CARD_COLORS = ['#d4a574', '#8B7355', '#6B8E23', '#FFB7C5', '#FF7F50'];
    return (
      <div className={styles.container}>
        <div className={styles.hud}>
          <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ⭐ {score}</span>
        </div>
        <p className={styles.prompt}>Put the plant stages in order!</p>
        {selected.length > 0 && (
          <div className={styles.sequenceArea} style={{ marginBottom: '1rem', minHeight: 70 }}>
            {selected.map((s, i) => (
              <div key={s.id} className={styles.sequenceItem} style={{ background: CARD_COLORS[i % CARD_COLORS.length], padding: '0.5rem 0.75rem', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>
                <span style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{i + 1}</span>
                <img src={STAGE_EMOJIS[s.id] || s.emoji} alt="" style={{ width: 28, height: 28 }} />
                {s.label}
              </div>
            ))}
          </div>
        )}
        <div className={styles.choices} style={{ flexDirection: 'column', gap: '0.6rem' }}>
          {cards.map((stage) => {
            const isSelected = selected.includes(stage);
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleOrderClick(stage)}
                disabled={!!feedback || isSelected}
                className={`${styles.choiceBtn} ${feedback === 'wrong' && selected[selected.length - 1] === stage ? styles.wrong : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-start', opacity: isSelected ? 0.5 : 1 }}
              >
                <img src={STAGE_EMOJIS[stage.id] || stage.emoji} alt="" style={{ width: 40, height: 40 }} />
                <span className={styles.choiceNumber} style={{ fontSize: '1rem' }}>{stage.label}</span>
              </button>
            );
          })}
        </div>
        {feedback && (
          <div className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
            {feedback === 'correct' ? '✓ Correct order!' : `The correct order is: ${correctOrder.map(s => s.label).join(' → ')}`}
          </div>
        )}
      </div>
    );
  }

  if (!question) return null;
  const imgs = question.imgs || {};

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ⭐ {score}</span>
      </div>
      <p className={styles.prompt}>{question.q}</p>
      <div className={styles.targetArea}>
        <img src={TWEMOJI('1f331')} alt="" style={{ width: 64, height: 64, marginBottom: '0.5rem' }} />
      </div>
      <div className={styles.choices}>
        {options.map((ans) => {
          const isCorrect = ans === question.answer;
          const isSelectedWrong = feedback === 'wrong' && selected === ans;
          const img = imgs[ans];
          return (
            <button
              key={ans}
              type="button"
              onClick={() => handleNeedsClick(ans)}
              disabled={!!feedback}
              className={`${styles.choiceBtn} ${feedback && isCorrect ? styles.correct : ''} ${isSelectedWrong ? styles.wrong : ''}`}
              style={{ flexDirection: 'column', gap: '0.35rem' }}
            >
              {img && <img src={img} alt="" style={{ width: 48, height: 48 }} />}
              <span className={styles.choiceNumber} style={{ fontSize: '1rem', textTransform: 'capitalize' }}>{ans}</span>
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ Correct!' : `Not quite! The correct answer is ${question.answer}.`}
        </div>
      )}
    </div>
  );
}
