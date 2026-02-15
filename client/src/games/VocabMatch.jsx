/**
 * Vocab Match - Match words to their definitions/pictures.
 * Builds vocabulary and comprehension.
 * Progressive: simple objects → actions → concepts.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const VOCAB_EASY = [
  { word: 'Big', def: 'Very large in size', img: 'https://cdn-icons-png.flaticon.com/128/3069/3069172.png' },
  { word: 'Fast', def: 'Moves quickly', img: 'https://cdn-icons-png.flaticon.com/128/2961/2961950.png' },
  { word: 'Happy', def: 'Feeling glad and joyful', img: 'https://cdn-icons-png.flaticon.com/128/742/742751.png' },
  { word: 'Hot', def: 'Very warm temperature', img: 'https://cdn-icons-png.flaticon.com/128/869/869869.png' },
  { word: 'Cold', def: 'Very low temperature', img: 'https://cdn-icons-png.flaticon.com/128/2469/2469350.png' },
  { word: 'Small', def: 'Tiny in size', img: 'https://cdn-icons-png.flaticon.com/128/3069/3069186.png' },
  { word: 'Loud', def: 'Makes a big sound', img: 'https://cdn-icons-png.flaticon.com/128/3039/3039386.png' },
  { word: 'Soft', def: 'Gentle to touch', img: 'https://cdn-icons-png.flaticon.com/128/3159/3159066.png' },
];

const VOCAB_MEDIUM = [
  { word: 'Brave', def: 'Not afraid of danger' },
  { word: 'Curious', def: 'Wanting to learn more' },
  { word: 'Gentle', def: 'Soft and careful' },
  { word: 'Enormous', def: 'Extremely big' },
  { word: 'Delicious', def: 'Tastes very good' },
  { word: 'Ancient', def: 'Very very old' },
  { word: 'Fragile', def: 'Breaks easily' },
  { word: 'Swift', def: 'Moving very fast' },
];

const VOCAB_HARD = [
  { word: 'Nocturnal', def: 'Active at night' },
  { word: 'Herbivore', def: 'Eats only plants' },
  { word: 'Transparent', def: 'Can see through it' },
  { word: 'Camouflage', def: 'Hiding by blending in' },
  { word: 'Migrate', def: 'Move to another place' },
  { word: 'Hibernate', def: 'Sleep through winter' },
  { word: 'Predator', def: 'Hunts other animals' },
  { word: 'Evaporate', def: 'Water turns into gas' },
];

function getPool(level) {
  if (level <= 8) return VOCAB_EASY;
  if (level <= 18) return VOCAB_MEDIUM;
  return VOCAB_HARD;
}

export default function VocabMatch({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration, speak } = useAudio();
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
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
      onComplete(score, ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0);
      return;
    }
    const pool = getPool(level);
    const t = pool[Math.floor(Math.random() * pool.length)];
    const opts = new Set([t.word]);
    while (opts.size < CHOICES) opts.add(pool[Math.floor(Math.random() * pool.length)].word);
    setTarget(t);
    setOptions([...opts].sort(() => Math.random() - 0.5));
    setFeedback(null);
    setSelected(null);
    speak(`Which word means: ${t.def}`);
  }, [round]);

  function handleChoice(word) {
    if (feedback) return;
    playClick();
    setSelected(word);
    const isCorrect = word === target.word;
    if (isCorrect) {
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      setFeedback({ type: 'correct', text: `Correct! "${target.word}" means ${target.def}` });
      playSuccess();
    } else {
      setWrong(w => w + 1);
      setFeedback({ type: 'wrong', text: `Wrong! The answer is "${target.word}".` });
      playWrong();
    }
    setTimeout(() => setRound(r => r + 1), delay);
  }

  if (done) {
    const acc = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>📚</span>
          <h2>Vocab Champion, {childName || 'Word Wizard'}!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '0.5rem 0' }}>
            <span style={{ color: '#22c55e', fontWeight: 800 }}>✅ {correct}</span>
            <span style={{ color: '#ef4444', fontWeight: 800 }}>❌ {wrong}</span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Accuracy: {acc}%</p>
        </div>
      </div>
    );
  }

  if (!target) return null;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ❌ {wrong} · ⭐ {score}</span>
      </div>

      <p className={styles.prompt}>Which word matches?</p>

      {/* Definition display */}
      <div style={{
        background: 'rgba(56,189,248,0.08)', borderRadius: 16, padding: '1rem 1.25rem',
        marginBottom: '1rem', textAlign: 'center',
      }}>
        {target.img && (
          <img src={target.img} alt="" style={{ width: 48, height: 48, marginBottom: '0.3rem' }}
            onError={e => { e.target.style.display = 'none'; }} />
        )}
        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          "{target.def}"
        </p>
      </div>

      <div className={styles.choices}>
        {options.map(w => {
          let bg = 'transparent';
          let border = '3px solid var(--border)';
          if (feedback && selected === w) {
            bg = feedback.type === 'correct' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
            border = feedback.type === 'correct' ? '3px solid #22c55e' : '3px solid #ef4444';
          }
          if (feedback && feedback.type === 'wrong' && w === target.word) {
            bg = 'rgba(34,197,94,0.1)'; border = '3px solid #22c55e';
          }
          return (
            <button key={w} type="button" onClick={() => handleChoice(w)}
              className={styles.choiceBtn}
              disabled={feedback !== null}
              style={{ background: bg, border, fontSize: '1.1rem', fontWeight: 800, minWidth: 100 }}>
              {w}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className={feedback.type === 'correct' ? styles.feedbackOk : styles.feedbackBad}
          style={{ marginTop: '0.5rem' }}>{feedback.text}</div>
      )}
    </div>
  );
}
