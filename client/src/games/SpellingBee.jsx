/**
 * Spelling Bee - Listen to a word and spell it correctly.
 * Builds spelling, phonics, and listening skills.
 * Progressive: 3-letter → 4-letter → 5-letter → 6-letter words.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const WORDS_3 = ['cat','dog','sun','hat','big','red','cup','pen','bus','run','map','bat','fan','hot','sit'];
const WORDS_4 = ['fish','bird','tree','star','moon','cake','play','frog','bear','ship','duck','rose','blue','lion','drum'];
const WORDS_5 = ['apple','house','green','water','happy','mouse','train','cloud','smile','brave','dance','plant','light'];
const WORDS_6 = ['banana','flower','orange','window','purple','school','garden','monkey','rabbit','bridge','friend'];

function getPool(level) {
  if (level <= 6) return WORDS_3;
  if (level <= 12) return WORDS_4;
  if (level <= 20) return WORDS_5;
  return WORDS_6;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function SpellingBee({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration, speak } = useAudio();
  const [round, setRound] = useState(0);
  const [word, setWord] = useState('');
  const [typed, setTyped] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [revealed, setRevealed] = useState(false);
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
    const pool = getPool(level);
    const w = pool[Math.floor(Math.random() * pool.length)].toUpperCase();
    setWord(w);
    setTyped([]);
    setFeedback(null);
    setRevealed(false);
    setTimeout(() => speak(`Spell the word: ${w.toLowerCase()}`), 300);
  }, [round]);

  function addLetter(ch) {
    if (feedback || typed.length >= word.length) return;
    playClick();
    setTyped(t => [...t, ch]);
  }

  function removeLetter() {
    if (feedback || typed.length === 0) return;
    playClick();
    setTyped(t => t.slice(0, -1));
  }

  function handleHear() {
    speak(word.toLowerCase());
  }

  function handleSubmit() {
    const attempt = typed.join('');
    if (attempt === word) {
      const pts = word.length * 5;
      setScore(s => s + pts);
      setCorrect(c => c + 1);
      setFeedback({ type: 'correct', text: `Correct! "${word}" +${pts} points!` });
      playSuccess();
    } else {
      setWrong(w => w + 1);
      setRevealed(true);
      setFeedback({ type: 'wrong', text: `Wrong! The spelling is "${word}".` });
      playWrong();
    }
    setTimeout(() => setRound(r => r + 1), delay + 400);
  }

  if (done) {
    const acc = ROUNDS > 0 ? Math.round((correct / ROUNDS) * 100) : 0;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>🐝</span>
          <h2>Spelling Bee, {childName || 'Speller'}!</h2>
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

      <p className={styles.prompt}>Spell the word you hear!</p>

      {/* Hear button */}
      <button type="button" onClick={handleHear}
        style={{
          fontSize: '2rem', padding: '0.75rem 1.5rem', borderRadius: 16,
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)', color: 'white',
          border: 'none', cursor: 'pointer', marginBottom: '0.75rem', fontWeight: 900,
        }}>
        🔊 Hear Again
      </button>

      {/* Reveal hint for lower levels */}
      {level <= 5 && !revealed && (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Hint: {word.length} letters, starts with "{word[0]}"
        </p>
      )}

      {/* Letter slots */}
      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginBottom: '0.75rem', minHeight: '48px' }}>
        {word.split('').map((ch, i) => {
          const isCorrect = typed[i] === ch;
          const isWrong = typed[i] && typed[i] !== ch && revealed;
          return (
            <div key={i} style={{
              width: 40, height: 44, borderRadius: 8,
              background: typed[i] ? (isWrong ? 'rgba(239,68,68,0.15)' : 'var(--primary)') : 'rgba(0,0,0,0.04)',
              border: typed[i] ? (isWrong ? '2px solid #ef4444' : '2px solid var(--primary)') : '2px dashed var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', fontWeight: 900, color: typed[i] ? 'white' : 'var(--text-muted)',
            }}>
              {revealed && !typed[i] ? ch : typed[i] || ''}
            </div>
          );
        })}
      </div>

      {/* Keyboard */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', maxWidth: '360px', marginBottom: '0.5rem' }}>
        {ALPHABET.map(ch => (
          <button key={ch} type="button" onClick={() => addLetter(ch)}
            disabled={feedback !== null || typed.length >= word.length}
            style={{
              width: 34, height: 38, borderRadius: 6, border: '2px solid var(--border)',
              background: 'var(--card-bg)', fontSize: '0.85rem', fontWeight: 800,
              cursor: 'pointer', color: 'var(--text)', padding: 0, minHeight: 'auto',
            }}>
            {ch}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button type="button" onClick={removeLetter}
          className={styles.choiceBtn}
          style={{ fontSize: '0.8rem', padding: '0.5rem 0.8rem' }}
          disabled={typed.length === 0 || feedback !== null}>
          ← Delete
        </button>
        <button type="button" onClick={handleSubmit}
          className={styles.choiceBtn}
          style={{ fontSize: '0.8rem', padding: '0.5rem 1.2rem', background: 'var(--success)', color: 'white', fontWeight: 900 }}
          disabled={typed.length !== word.length || feedback !== null}>
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
