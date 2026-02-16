/**
 * Weather Learn - Weather scenes (sunny, rainy, snowy, cloudy, windy).
 * "What do you wear when it rains?" Multiple choice with image answers.
 * Teaches weather concepts. Academic / Free
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const WEATHER_QUESTIONS = [
  { weather: 'rain', emoji: TWEMOJI('1f327'), q: 'What do you wear when it rains?', answer: 'umbrella', options: ['umbrella', 'sunglasses', 'scarf', 'hat'], imgs: { umbrella: TWEMOJI('2602'), sunglasses: TWEMOJI('1f576'), scarf: TWEMOJI('1f9e3'), hat: TWEMOJI('1f3a9') } },
  { weather: 'sunny', emoji: TWEMOJI('2600'), q: 'What protects you from the sun?', answer: 'sunglasses', options: ['umbrella', 'sunglasses', 'boots', 'coat'], imgs: { umbrella: TWEMOJI('2602'), sunglasses: TWEMOJI('1f576'), boots: TWEMOJI('1f462'), coat: TWEMOJI('1f9e5') } },
  { weather: 'snowy', emoji: TWEMOJI('2744'), q: 'What do you wear when it snows?', answer: 'coat', options: ['coat', 'shorts', 'sunglasses', 'sandals'], imgs: { coat: TWEMOJI('1f9e5'), shorts: TWEMOJI('1f455'), sunglasses: TWEMOJI('1f576'), sandals: TWEMOJI('1f461') } },
  { weather: 'windy', emoji: TWEMOJI('1f32c'), q: 'What helps on a windy day?', answer: 'jacket', options: ['jacket', 'swimsuit', 'flip-flops', 'tank top'], imgs: { jacket: TWEMOJI('1f9e5'), swimsuit: TWEMOJI('1f459'), flipflops: TWEMOJI('1f461'), 'tank top': TWEMOJI('1f455') } },
  { weather: 'cloudy', emoji: TWEMOJI('2601'), q: 'What might you bring on a cloudy day?', answer: 'umbrella', options: ['umbrella', 'sun hat', 'sunscreen', 'beach ball'], imgs: { umbrella: TWEMOJI('2602'), 'sun hat': TWEMOJI('1f3a9'), sunscreen: TWEMOJI('1f489'), 'beach ball': TWEMOJI('26f1') } },
  { weather: 'rain', emoji: TWEMOJI('1f327'), q: 'What do you wear on your feet in the rain?', answer: 'boots', options: ['boots', 'sandals', 'flip-flops', 'slippers'], imgs: { boots: TWEMOJI('1f462'), sandals: TWEMOJI('1f461'), flipflops: TWEMOJI('1f461'), slippers: TWEMOJI('1f460') } },
  { weather: 'hot', emoji: TWEMOJI('1f525'), q: 'What do you wear when it is hot?', answer: 'shorts', options: ['shorts', 'coat', 'boots', 'gloves'], imgs: { shorts: TWEMOJI('1f455'), coat: TWEMOJI('1f9e5'), boots: TWEMOJI('1f462'), gloves: TWEMOJI('1f9e4') } },
  { weather: 'cold', emoji: TWEMOJI('1f9ca'), q: 'What keeps your hands warm?', answer: 'gloves', options: ['gloves', 'socks', 'hat', 'scarf'], imgs: { gloves: TWEMOJI('1f9e4'), socks: TWEMOJI('1f9e6'), hat: TWEMOJI('1f3a9'), scarf: TWEMOJI('1f9e3') } },
  { weather: 'sunny', emoji: TWEMOJI('2600'), q: 'What do you put on to swim?', answer: 'swimsuit', options: ['swimsuit', 'sweater', 'boots', 'scarf'], imgs: { swimsuit: TWEMOJI('1f459'), sweater: TWEMOJI('1f9e5'), boots: TWEMOJI('1f462'), scarf: TWEMOJI('1f9e3') } },
  { weather: 'snowy', emoji: TWEMOJI('2744'), q: 'What keeps your head warm in winter?', answer: 'hat', options: ['hat', 'sandals', 'shorts', 'sunglasses'], imgs: { hat: TWEMOJI('1f3a9'), sandals: TWEMOJI('1f461'), shorts: TWEMOJI('1f455'), sunglasses: TWEMOJI('1f576') } },
  { weather: 'rain', emoji: TWEMOJI('1f4a7'), q: 'What keeps you dry in a storm?', answer: 'raincoat', options: ['raincoat', 't-shirt', 'shorts', 'sandals'], imgs: { raincoat: TWEMOJI('1f9e5'), 't-shirt': TWEMOJI('1f455'), shorts: TWEMOJI('1f455'), sandals: TWEMOJI('1f461') } },
  { weather: 'cloudy', emoji: TWEMOJI('2601'), q: 'What wraps around your neck when it is cold?', answer: 'scarf', options: ['scarf', 'socks', 'gloves', 'hat'], imgs: { scarf: TWEMOJI('1f9e3'), socks: TWEMOJI('1f9e6'), gloves: TWEMOJI('1f9e4'), hat: TWEMOJI('1f3a9') } },
  { weather: 'windy', emoji: TWEMOJI('1f32c'), q: 'What keeps your hair from blowing?', answer: 'hat', options: ['hat', 'boots', 'gloves', 'shorts'], imgs: { hat: TWEMOJI('1f3a9'), boots: TWEMOJI('1f462'), gloves: TWEMOJI('1f9e4'), shorts: TWEMOJI('1f455') } },
  { weather: 'sunny', emoji: TWEMOJI('2600'), q: 'What do you wear to the beach?', answer: 'swimsuit', options: ['swimsuit', 'coat', 'boots', 'scarf'], imgs: { swimsuit: TWEMOJI('1f459'), coat: TWEMOJI('1f9e5'), boots: TWEMOJI('1f462'), scarf: TWEMOJI('1f9e3') } },
  { weather: 'cold', emoji: TWEMOJI('1f9ca'), q: 'What keeps your feet warm?', answer: 'socks', options: ['socks', 'sunglasses', 'swimsuit', 'flip-flops'], imgs: { socks: TWEMOJI('1f9e6'), sunglasses: TWEMOJI('1f576'), swimsuit: TWEMOJI('1f459'), 'flip-flops': TWEMOJI('1f461') } },
  { weather: 'snowy', emoji: TWEMOJI('2744'), q: 'What do you wear on your hands in snow?', answer: 'gloves', options: ['gloves', 'shorts', 'sandal', 'tank top'], imgs: { gloves: TWEMOJI('1f9e4'), shorts: TWEMOJI('1f455'), sandal: TWEMOJI('1f461'), 'tank top': TWEMOJI('1f455') } },
];

const WEATHER_FACTS = {
  rain: 'Rain comes from clouds! Plants and animals need rain to grow.',
  sunny: 'The sun gives us light and warmth! We need sunscreen to protect our skin.',
  snowy: 'Snow is frozen water! It falls when it is very cold.',
  windy: 'Wind is moving air! It can make kites fly.',
  cloudy: 'Clouds are made of tiny water droplets! They can bring rain.',
  hot: 'On hot days, wear light clothes and drink lots of water!',
  cold: 'On cold days, layer up to stay warm!',
};

export default function WeatherLearn({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const CHOICES = getChoiceCount(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }
    const q = generate(
      () => WEATHER_QUESTIONS[Math.floor(Math.random() * WEATHER_QUESTIONS.length)],
      (r) => r.q
    );
    let opts = [...q.options];
    if (opts.length > CHOICES) {
      const ansIdx = opts.indexOf(q.answer);
      opts = [q.answer, ...opts.filter((_, i) => i !== ansIdx).sort(() => Math.random() - 0.5).slice(0, CHOICES - 1)];
    }
    setQuestion(q);
    setOptions(opts.sort(() => Math.random() - 0.5));
    setFeedback(null);
    setSelected(null);
  }, [round, ROUNDS, correct, score]);

  useEffect(() => {
    if (question && round < ROUNDS) {
      const cancelRead = readQuestion(question.q);
      return cancelRead;
    }
  }, [question, round, ROUNDS]);

  function handleChoice(item) {
    if (feedback) return;
    playClick();
    setSelected(item);
    const isCorrect = item === question.answer;
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      playSuccess();
      setFeedback('correct');
    } else {
      playWrong();
      setFeedback('wrong');
    }
    teachAfterAnswer(isCorrect, {
      type: 'word',
      answer: item,
      correctAnswer: question.answer,
      extra: WEATHER_FACTS[question.weather] || `On ${question.weather} days, ${question.answer} helps!`,
    });
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <img src={TWEMOJI('1f327')} alt="" style={{ width: 80, height: 80 }} />
          <h2>Weather Expert!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
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
        <img src={question.emoji} alt="" style={{ width: 80, height: 80, marginBottom: '0.5rem' }} />
      </div>
      <div className={styles.choices}>
        {options.map((item) => {
          const isCorrect = item === question.answer;
          const isSelectedWrong = feedback === 'wrong' && selected === item;
          const imgKey = item.replace(/\s/g, '');
          const img = imgs[item] || imgs[imgKey];
          return (
            <button
              key={item}
              type="button"
              onClick={() => handleChoice(item)}
              disabled={!!feedback}
              className={`${styles.choiceBtn} ${feedback && isCorrect ? styles.correct : ''} ${isSelectedWrong ? styles.wrong : ''}`}
              style={{ flexDirection: 'column', gap: '0.35rem' }}
            >
              {img && <img src={img} alt="" style={{ width: 48, height: 48 }} />}
              <span className={styles.choiceNumber} style={{ fontSize: '0.95rem', textTransform: 'capitalize' }}>{item}</span>
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ Correct!' : `The answer was ${question.answer}.`}
        </div>
      )}
    </div>
  );
}
