/**
 * Word Scramble - Unscramble letters to form words.
 * Builds spelling, vocabulary, and problem-solving skills.
 * Progressive: 3-letter words → 4-letter → 5-letter words.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const WORDS_3 = ['CAT','DOG','SUN','HAT','BIG','RED','CUP','PEN','BUS','HOP','FUN','RUN','MAP','BAT','FAN'];
const WORDS_4 = ['FISH','BIRD','TREE','STAR','MOON','CAKE','PLAY','FROG','BEAR','SHIP','DUCK','ROSE','BLUE','LION','DRUM'];
const WORDS_5 = ['APPLE','HOUSE','GREEN','WATER','HAPPY','MOUSE','TRAIN','CLOUD','SMILE','BRAVE','DANCE','PLANT','BRAIN','LIGHT','STONE'];

function getWordPool(level) {
  if (level <= 8) return WORDS_3;
  if (level <= 18) return WORDS_4;
  return WORDS_5;
}

function scramble(word) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join('');
  return result === word ? scramble(word) : result;
}

export default function WordScramble({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration, speak } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const [round, setRound] = useState(0);
  const [word, setWord] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [answer, setAnswer] = useState([]);
  const [available, setAvailable] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = getRounds(level);
  const delay = getFeedbackDelay(level);

  useEffect(() => {
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      setDone(true);
      playCelebration();
      onComplete(score, ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0);
      return;
    }
    const pool = getWordPool(level);
    const w = pool[Math.floor(Math.random() * pool.length)];
    setWord(w);
    const s = scramble(w);
    setScrambled(s);
    setAnswer([]);
    setAvailable(s.split('').map((ch, i) => ({ ch, id: i, used: false })));
    setFeedback(null);
    const cancelRead = readQuestion('Unscramble the letters to make a word!');
    return cancelRead;
  }, [round]);

  function pickLetter(item) {
    if (feedback || item.used) return;
    playClick();
    setAnswer(a => [...a, item]);
    setAvailable(av => av.map(a => a.id === item.id ? { ...a, used: true } : a));
  }

  function removeLetter(idx) {
    if (feedback) return;
    playClick();
    const removed = answer[idx];
    setAnswer(a => a.filter((_, i) => i !== idx));
    setAvailable(av => av.map(a => a.id === removed.id ? { ...a, used: false } : a));
  }

  function handleSubmit() {
    const attempt = answer.map(a => a.ch).join('');
    if (attempt === word) {
      const pts = word.length * 5;
      setScore(s => s + pts);
      setCorrect(c => c + 1);
      setFeedback({ type: 'correct', text: `Correct! "${word}" +${pts} points!` });
      playSuccess();
      teachAfterAnswer(true, { type: 'word', answer: attempt, correctAnswer: word, extra: 'Excellent! "' + word + '" is correct!' });
    } else {
      setWrong(w => w + 1);
      setFeedback({ type: 'wrong', text: `Not quite! The word was "${word}".` });
      playWrong();
      teachAfterAnswer(false, { type: 'word', answer: attempt, correctAnswer: word, extra: 'The answer was "' + word + '".' });
    }
    setTimeout(() => setRound(r => r + 1), delay + 200);
  }

  function handleClear() {
    playClick();
    setAnswer([]);
    setAvailable(scrambled.split('').map((ch, i) => ({ ch, id: i, used: false })));
  }

  if (done) {
    const acc = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>🔤</span>
          <h2>Word Master, {childName || 'Speller'}!</h2>
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

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · {round + 1}/{ROUNDS} · ✅ {correct} · ❌ {wrong} · ⭐ {score}</span>
      </div>
      <p className={styles.prompt}>Unscramble the word!</p>

      {/* Answer slots */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '1rem', minHeight: '52px' }}>
        {word.split('').map((_, i) => (
          <div key={i} onClick={() => answer[i] && removeLetter(i)} style={{
            width: 44, height: 48, borderRadius: 10,
            background: answer[i] ? 'var(--primary)' : 'rgba(0,0,0,0.04)',
            border: answer[i] ? '3px solid var(--primary)' : '3px dashed var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 900, color: answer[i] ? 'white' : 'var(--text-muted)',
            cursor: answer[i] ? 'pointer' : 'default', transition: 'all 0.15s',
          }}>
            {answer[i]?.ch || ''}
          </div>
        ))}
      </div>

      {/* Letter tiles */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {available.map(item => (
          <button key={item.id} type="button" onClick={() => pickLetter(item)}
            className={styles.choiceBtn}
            disabled={item.used || feedback !== null}
            style={{
              minWidth: 48, minHeight: 52, fontSize: '1.3rem', fontWeight: 900,
              opacity: item.used ? 0.3 : 1, padding: '0.6rem',
            }}>
            {item.ch}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button type="button" onClick={handleClear} className={styles.choiceBtn}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          disabled={answer.length === 0 || feedback !== null}>
          🗑️ Clear
        </button>
        <button type="button" onClick={handleSubmit} className={styles.choiceBtn}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.5rem', background: 'var(--success)', color: 'white', fontWeight: 900 }}
          disabled={answer.length !== word.length || feedback !== null}>
          ✅ Check
        </button>
      </div>

      {feedback && (
        <div className={feedback.type === 'correct' ? styles.feedbackOk : styles.feedbackBad}
          style={{ marginTop: '0.5rem' }}>{feedback.text}</div>
      )}
    </div>
  );
}
