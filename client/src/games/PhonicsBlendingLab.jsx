/**
 * Phonics Blending Lab - PREMIUM
 * Unique mechanic: Kid sees individual phoneme cards, taps them in order to
 * blend sounds into a word. Phonemes light up and merge visually.
 * Levels: CVC -> CCVC -> blends -> digraphs -> multi-syllable
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay, getChoiceCount } from './levelConfig';
import styles from './GameCommon.module.css';

const CVC = [
  { word: 'cat', phonemes: ['c', 'a', 't'] },
  { word: 'dog', phonemes: ['d', 'o', 'g'] },
  { word: 'sun', phonemes: ['s', 'u', 'n'] },
  { word: 'hat', phonemes: ['h', 'a', 't'] },
  { word: 'bed', phonemes: ['b', 'e', 'd'] },
  { word: 'pig', phonemes: ['p', 'i', 'g'] },
  { word: 'cup', phonemes: ['c', 'u', 'p'] },
  { word: 'pen', phonemes: ['p', 'e', 'n'] },
  { word: 'fox', phonemes: ['f', 'o', 'x'] },
  { word: 'rug', phonemes: ['r', 'u', 'g'] },
  { word: 'van', phonemes: ['v', 'a', 'n'] },
  { word: 'jet', phonemes: ['j', 'e', 't'] },
  { word: 'map', phonemes: ['m', 'a', 'p'] },
  { word: 'web', phonemes: ['w', 'e', 'b'] },
  { word: 'fin', phonemes: ['f', 'i', 'n'] },
];
const CCVC = [
  { word: 'frog', phonemes: ['fr', 'o', 'g'] },
  { word: 'stop', phonemes: ['st', 'o', 'p'] },
  { word: 'clap', phonemes: ['cl', 'a', 'p'] },
  { word: 'drum', phonemes: ['dr', 'u', 'm'] },
  { word: 'flag', phonemes: ['fl', 'a', 'g'] },
  { word: 'grin', phonemes: ['gr', 'i', 'n'] },
  { word: 'trip', phonemes: ['tr', 'i', 'p'] },
  { word: 'snap', phonemes: ['sn', 'a', 'p'] },
  { word: 'plan', phonemes: ['pl', 'a', 'n'] },
  { word: 'swim', phonemes: ['sw', 'i', 'm'] },
  { word: 'slip', phonemes: ['sl', 'i', 'p'] },
  { word: 'crab', phonemes: ['cr', 'a', 'b'] },
];
const BLENDS = [
  { word: 'think', phonemes: ['th', 'i', 'nk'] },
  { word: 'sheep', phonemes: ['sh', 'ee', 'p'] },
  { word: 'chain', phonemes: ['ch', 'ai', 'n'] },
  { word: 'wheel', phonemes: ['wh', 'ee', 'l'] },
  { word: 'beach', phonemes: ['b', 'ea', 'ch'] },
  { word: 'brush', phonemes: ['br', 'u', 'sh'] },
  { word: 'cloud', phonemes: ['cl', 'ou', 'd'] },
  { word: 'train', phonemes: ['tr', 'ai', 'n'] },
  { word: 'spoon', phonemes: ['sp', 'oo', 'n'] },
  { word: 'green', phonemes: ['gr', 'ee', 'n'] },
];
const MULTI = [
  { word: 'rabbit', phonemes: ['ra', 'bb', 'it'] },
  { word: 'kitten', phonemes: ['ki', 'tt', 'en'] },
  { word: 'sunset', phonemes: ['sun', 'set'] },
  { word: 'basket', phonemes: ['bas', 'ket'] },
  { word: 'monkey', phonemes: ['mon', 'key'] },
  { word: 'garden', phonemes: ['gar', 'den'] },
  { word: 'window', phonemes: ['win', 'dow'] },
  { word: 'napkin', phonemes: ['nap', 'kin'] },
  { word: 'button', phonemes: ['but', 'ton'] },
  { word: 'pillow', phonemes: ['pil', 'low'] },
];

function getPool(level) {
  if (level <= 6) return CVC;
  if (level <= 12) return CCVC;
  if (level <= 20) return BLENDS;
  return MULTI;
}

function getLevelLabel(level) {
  if (level <= 6) return 'CVC Words';
  if (level <= 12) return 'Consonant Blends';
  if (level <= 20) return 'Digraphs & Blends';
  return 'Multi-Syllable';
}

const PHONEME_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'];

export default function PhonicsBlendingLab({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [word, setWord] = useState(null);
  const [shuffled, setShuffled] = useState([]);
  const [selected, setSelected] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [merged, setMerged] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      playCelebration();
      const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
      onComplete(score, accuracy);
      return;
    }
    const pool = getPool(level);
    const item = generate(() => pool[Math.floor(Math.random() * pool.length)], (w) => w.word);
    setWord(item);
    const extra = level <= 12 ? [] : ['qu', 'ck', 'ng'].slice(0, Math.min(2, Math.floor(level / 10)));
    const shuffledPhonemes = [...item.phonemes, ...extra].sort(() => Math.random() - 0.5);
    setShuffled(shuffledPhonemes);
    setSelected([]);
    setFeedback(null);
    setMerged(false);
    const cancelRead = readQuestion(`Blend the sounds to make a word! Listen: ${item.word}`);
    return cancelRead;
  }, [round]);

  const handlePhonemeTap = useCallback((phoneme, idx) => {
    if (feedback) return;
    playClick();
    const newSelected = [...selected, { phoneme, idx }];
    setSelected(newSelected);

    if (newSelected.length === word.phonemes.length) {
      const built = newSelected.map(s => s.phoneme).join('');
      const target = word.phonemes.join('');
      const isCorrect = built === target;

      setTimeout(() => setMerged(true), 300);

      setTimeout(() => {
        if (isCorrect) {
          setScore(s => s + 10);
          setCorrect(c => c + 1);
          playSuccess();
          setFeedback('correct');
          teachAfterAnswer(true, { type: 'letter', correctAnswer: word.word, extra: `You blended ${word.phonemes.join(' + ')} to make "${word.word}"!` });
        } else {
          playWrong();
          setFeedback('wrong');
          teachAfterAnswer(false, { type: 'letter', answer: built, correctAnswer: word.word, extra: `The sounds ${word.phonemes.join(' + ')} blend together to make "${word.word}".` });
        }
        const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, isCorrect));
        setTimeout(() => setRound(r => r + 1), delay);
      }, 600);
    }
  }, [selected, word, feedback, level, playClick, playSuccess, playWrong, teachAfterAnswer, score, correct]);

  const usedIndices = new Set(selected.map(s => s.idx));

  if (round >= ROUNDS) {
    const accuracy = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Phonics Star!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>Accuracy: {accuracy}%</span>
        </div>
      </div>
    );
  }

  if (!word) return null;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} - {getLevelLabel(level)}</span>
        <span>·</span>
        <span>{round + 1}/{ROUNDS}</span>
        <span>·</span>
        <span>Score: {score}</span>
      </div>

      <p className={styles.prompt}>Tap the sounds in order to blend the word!</p>

      <div style={{
        display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center',
        minHeight: 70, margin: '1rem 0', flexWrap: 'wrap',
      }}>
        {selected.length > 0 ? (
          selected.map((s, i) => (
            <span key={i} style={{
              display: 'inline-block',
              padding: merged ? '0.6rem 0.8rem' : '0.6rem 1rem',
              background: PHONEME_COLORS[i % PHONEME_COLORS.length],
              color: '#fff',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: merged ? '1.4rem' : '1.2rem',
              letterSpacing: merged ? '0' : '0.05em',
              transition: 'all 0.4s ease',
              transform: merged ? 'scale(1.1)' : 'scale(1)',
              margin: merged ? '0 -2px' : '0',
            }}>
              {s.phoneme}
            </span>
          ))
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontStyle: 'italic' }}>
            Tap sounds below to blend...
          </span>
        )}
        {merged && feedback === 'correct' && (
          <span style={{ marginLeft: 8, fontSize: '1.5rem' }}>= {word.word}</span>
        )}
      </div>

      <div style={{
        display: 'flex', gap: '0.75rem', justifyContent: 'center',
        flexWrap: 'wrap', marginTop: '1rem',
      }}>
        {shuffled.map((p, i) => (
          <button
            key={`${p}-${i}`}
            type="button"
            onClick={() => handlePhonemeTap(p, i)}
            disabled={usedIndices.has(i) || !!feedback}
            className={styles.choiceBtn}
            style={{
              padding: '0.8rem 1.4rem',
              fontSize: '1.3rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              opacity: usedIndices.has(i) ? 0.3 : 1,
              background: usedIndices.has(i) ? 'var(--card-bg)' : undefined,
              minWidth: 60,
              transition: 'opacity 0.2s, transform 0.2s',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {feedback === 'correct' && <p className={styles.feedbackOk}>Blended! "{word.word}"</p>}
      {feedback === 'wrong' && (
        <div className={styles.feedbackBad}>
          <p>The word is <strong>"{word.word}"</strong> ({word.phonemes.join(' + ')})</p>
        </div>
      )}
    </div>
  );
}
