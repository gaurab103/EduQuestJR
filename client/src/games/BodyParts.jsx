/**
 * Body Parts - "Where is the [nose/hand/knee]?"
 * Kid taps the correct body part label from choices.
 * Teaches body awareness. Academic / Free
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useTeaching } from './useTeaching';
import styles from './GameCommon.module.css';

const TWEMOJI = (cp) => `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${cp}.svg`;

const BODY_PARTS = [
  { part: 'nose', emoji: TWEMOJI('1f443'), label: 'Nose' },
  { part: 'hand', emoji: TWEMOJI('1f91a'), label: 'Hand' },
  { part: 'knee', emoji: TWEMOJI('1f9b5'), label: 'Knee' },
  { part: 'head', emoji: TWEMOJI('1f9e0'), label: 'Head' },
  { part: 'eye', emoji: TWEMOJI('1f441'), label: 'Eye' },
  { part: 'ear', emoji: TWEMOJI('1f442'), label: 'Ear' },
  { part: 'mouth', emoji: TWEMOJI('1f444'), label: 'Mouth' },
  { part: 'foot', emoji: TWEMOJI('1f9b6'), label: 'Foot' },
  { part: 'arm', emoji: TWEMOJI('1f4aa'), label: 'Arm' },
  { part: 'belly', emoji: TWEMOJI('1f97d'), label: 'Belly' },
  { part: 'hair', emoji: TWEMOJI('1f9b0'), label: 'Hair' },
  { part: 'tooth', emoji: TWEMOJI('1f9b7'), label: 'Tooth' },
  { part: 'finger', emoji: TWEMOJI('1faf0'), label: 'Finger' },
  { part: 'elbow', emoji: TWEMOJI('1f9b5'), label: 'Elbow' },
  { part: 'shoulder', emoji: TWEMOJI('1f9ae'), label: 'Shoulder' },
  { part: 'chin', emoji: TWEMOJI('1f976'), label: 'Chin' },
  { part: 'cheek', emoji: TWEMOJI('1f97a'), label: 'Cheek' },
];

const BODY_FACTS = {
  nose: 'Your nose helps you smell! It also warms the air you breathe.',
  hand: 'Your hands have 5 fingers each! They help you grab and hold things.',
  knee: 'Your knee is a joint that lets your leg bend! We have two knees.',
  head: 'Your head holds your brain! The brain helps you think.',
  eye: 'Your eyes help you see! We have two eyes to see in 3D.',
  ear: 'Your ears help you hear! Sounds travel into your ears.',
  mouth: 'Your mouth helps you eat and talk! Your teeth chew food.',
  foot: 'Your feet help you walk and run! We have two feet.',
  arm: 'Your arms help you hug and reach! Arms connect to your hands.',
  belly: 'Your belly is where your stomach is! It holds the food you eat.',
  hair: 'Hair grows on your head! It helps keep you warm.',
  tooth: 'Teeth help you chew food! Baby teeth fall out and new ones grow.',
  finger: 'Fingers help you pick things up! Each hand has 5 fingers.',
  elbow: 'Your elbow lets your arm bend! Try bending it!',
  shoulder: 'Shoulders connect your arms to your body!',
  chin: 'Your chin is below your mouth!',
  cheek: 'Cheeks are on the sides of your face! They puff out when you smile.',
};

export default function BodyParts({ onComplete, level = 1, childAge }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
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
    const pool = [...BODY_PARTS];
    const t = pool[Math.floor(Math.random() * pool.length)];
    const opts = new Set([t]);
    while (opts.size < Math.min(CHOICES, pool.length)) {
      opts.add(pool[Math.floor(Math.random() * pool.length)]);
    }
    setTarget(t);
    setOptions([...opts].sort(() => Math.random() - 0.5));
    setFeedback(null);
    setSelected(null);
  }, [round, ROUNDS, correct, score]);

  useEffect(() => {
    if (target && round < ROUNDS) {
      const cancelRead = readQuestion(`Where is the ${target.part}?`);
      return cancelRead;
    }
  }, [target, round, ROUNDS]);

  function handleChoice(item) {
    if (feedback) return;
    playClick();
    setSelected(item.part);
    const isCorrect = item.part === target.part;
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
      answer: item.label,
      correctAnswer: target.label,
      extra: BODY_FACTS[target.part],
    });
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <img src={TWEMOJI('1f9b4')} alt="" style={{ width: 80, height: 80 }} />
          <h2>Body Expert!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '0.5rem 0' }}>
            <span style={{ color: '#22c55e', fontWeight: 800 }}>✅ {correct}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
          </div>
        </div>
      </div>
    );
  }

  if (!target) return null;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ⭐ {score}</span>
      </div>
      <p className={styles.prompt}>Where is the {target.part}?</p>
      <div className={styles.targetArea}>
        <img src={TWEMOJI('1f476')} alt="Body" style={{ width: 100, height: 100, marginBottom: '0.5rem' }} />
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tap the correct label</p>
      </div>
      <div className={styles.choices}>
        {options.map((item) => {
          const isCorrect = item.part === target.part;
          const isSelectedWrong = feedback === 'wrong' && selected === item.part;
          return (
            <button
              key={item.part}
              type="button"
              onClick={() => handleChoice(item)}
              disabled={!!feedback}
              className={`${styles.choiceBtn} ${feedback && isCorrect ? styles.correct : ''} ${isSelectedWrong ? styles.wrong : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <img src={item.emoji} alt="" style={{ width: 40, height: 40 }} />
              <span className={styles.choiceNumber} style={{ fontSize: '1rem' }}>{item.label}</span>
            </button>
          );
        })}
      </div>
      {feedback && (
        <div className={feedback === 'correct' ? styles.feedbackOk : styles.feedbackBad}>
          {feedback === 'correct' ? '✓ Correct!' : `The answer was ${target.label}.`}
        </div>
      )}
    </div>
  );
}
