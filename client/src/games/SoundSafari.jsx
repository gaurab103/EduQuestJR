/**
 * Sound Safari - Audio listening & recognition game.
 * Kids hear a sound/word and tap the matching picture.
 * Progressive levels: simple animals → instruments → words → phrases.
 */
import { useState, useEffect, useCallback } from 'react';
import { getRounds, getChoiceCount, getFeedbackDelay } from './levelConfig';
import { useAudio } from '../context/AudioContext';
import styles from './GameCommon.module.css';

const SOUND_SETS = {
  animals: [
    { word: 'Cat', image: 'https://cdn-icons-png.flaticon.com/128/1864/1864514.png', sound: 'meow' },
    { word: 'Dog', image: 'https://cdn-icons-png.flaticon.com/128/1864/1864593.png', sound: 'woof' },
    { word: 'Cow', image: 'https://cdn-icons-png.flaticon.com/128/2864/2864730.png', sound: 'moo' },
    { word: 'Duck', image: 'https://cdn-icons-png.flaticon.com/128/1864/1864470.png', sound: 'quack' },
    { word: 'Frog', image: 'https://cdn-icons-png.flaticon.com/128/3940/3940432.png', sound: 'ribbit' },
    { word: 'Bird', image: 'https://cdn-icons-png.flaticon.com/128/3940/3940417.png', sound: 'tweet' },
    { word: 'Lion', image: 'https://cdn-icons-png.flaticon.com/128/3940/3940403.png', sound: 'roar' },
    { word: 'Sheep', image: 'https://cdn-icons-png.flaticon.com/128/2864/2864708.png', sound: 'baa' },
  ],
  objects: [
    { word: 'Ball', image: 'https://cdn-icons-png.flaticon.com/128/3946/3946069.png' },
    { word: 'Book', image: 'https://cdn-icons-png.flaticon.com/128/3145/3145765.png' },
    { word: 'Star', image: 'https://cdn-icons-png.flaticon.com/128/3222/3222683.png' },
    { word: 'Moon', image: 'https://cdn-icons-png.flaticon.com/128/3222/3222803.png' },
    { word: 'Fish', image: 'https://cdn-icons-png.flaticon.com/128/1864/1864514.png' },
    { word: 'Tree', image: 'https://cdn-icons-png.flaticon.com/128/685/685022.png' },
    { word: 'Sun', image: 'https://cdn-icons-png.flaticon.com/128/869/869869.png' },
    { word: 'Apple', image: 'https://cdn-icons-png.flaticon.com/128/415/415682.png' },
  ],
  colors: [
    { word: 'Red', image: null, color: '#ef4444' },
    { word: 'Blue', image: null, color: '#38bdf8' },
    { word: 'Green', image: null, color: '#4ade80' },
    { word: 'Yellow', image: null, color: '#fbbf24' },
    { word: 'Purple', image: null, color: '#a78bfa' },
    { word: 'Orange', image: null, color: '#f97316' },
    { word: 'Pink', image: null, color: '#f472b6' },
    { word: 'Brown', image: null, color: '#a16207' },
  ],
};

function getPool(level) {
  if (level <= 8) return SOUND_SETS.animals;
  if (level <= 16) return [...SOUND_SETS.animals, ...SOUND_SETS.objects];
  return [...SOUND_SETS.animals, ...SOUND_SETS.objects, ...SOUND_SETS.colors];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SoundSafari({ onComplete, level = 1, childName }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const [target, setTarget] = useState(null);
  const [options, setOptions] = useState([]);
  const [spoken, setSpoken] = useState(false);
  const { playSuccess, playWrong, playClick, playCelebration, speak } = useAudio();

  const totalRounds = getRounds(level);
  const choiceCount = getChoiceCount(level);
  const pool = getPool(level);

  const generateRound = useCallback(() => {
    const shuffled = shuffle(pool);
    const correct = shuffled[0];
    const others = shuffled.slice(1, choiceCount);
    const allOptions = shuffle([correct, ...others]);
    setTarget(correct);
    setOptions(allOptions);
    setSpoken(false);
  }, [pool, choiceCount]);

  useEffect(() => {
    generateRound();
  }, [round]);

  // Auto-speak the target word
  useEffect(() => {
    if (target && !spoken) {
      setTimeout(() => {
        speak(`${childName ? childName + '! ' : ''}Find the ${target.word}!`);
        setSpoken(true);
      }, 400);
    }
  }, [target, spoken]);

  function handleRepeat() {
    playClick();
    if (target) {
      speak(`Find the ${target.word}!`);
    }
  }

  function handleChoice(item) {
    if (feedback) return;
    playClick();

    if (item.word === target.word) {
      const bonus = streak >= 2 ? 15 : 10;
      setScore(s => s + bonus);
      setStreak(s => s + 1);
      setFeedback({ text: `Yes! That's ${target.word}! 🎉`, correct: true });
      playSuccess();
      speak(`Great job! That's ${target.word}!`);
    } else {
      setStreak(0);
      setFeedback({ text: `That's ${item.word}. Let's try another!`, correct: false });
      playWrong();
    }

    setTimeout(() => {
      setFeedback(null);
      if (round + 1 >= totalRounds) {
        setDone(true);
        playCelebration();
        const accuracy = Math.round((score / (totalRounds * 10)) * 100);
        onComplete(score, Math.min(100, accuracy));
      } else {
        setRound(r => r + 1);
      }
    }, getFeedbackDelay(level));
  }

  if (done) {
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <span style={{ fontSize: '4rem' }}>🔊</span>
          <h2>Super Ears, {childName || 'Explorer'}!</h2>
          <p>Score: {score}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level} · Round {round + 1}/{totalRounds} · ⭐ {score}</span>
        {streak >= 2 && <span style={{ color: 'var(--accent)' }}>🔥 {streak}</span>}
      </div>

      {/* Listen button */}
      <button
        type="button"
        onClick={handleRepeat}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.85rem 1.5rem',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          fontSize: '1.1rem',
          fontWeight: 900,
          cursor: 'pointer',
          margin: '0 auto 0.75rem',
          animation: 'pulseGlow 2s ease infinite',
          minHeight: 'auto',
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>🔊</span>
        Listen Again
      </button>

      <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Tap the picture you hear!
      </p>

      {/* Options grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: choiceCount <= 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
        gap: '0.6rem',
        maxWidth: '380px',
        width: '100%',
      }}>
        {options.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleChoice(item)}
            className={styles.choiceBtn}
            disabled={!!feedback}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.75rem',
              minHeight: '90px',
              background: item.color || 'var(--card-bg)',
              border: feedback && item.word === target.word
                ? '3px solid var(--success)'
                : '3px solid rgba(0,0,0,0.08)',
              borderRadius: '16px',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                style={{ width: 48, height: 48, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                loading="lazy"
              />
            ) : (
              <span style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: item.color || '#ddd',
                display: 'block',
                border: '3px solid rgba(255,255,255,0.5)',
              }} />
            )}
            <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{item.word}</span>
          </button>
        ))}
      </div>

      {feedback && (
        <div className={feedback.correct ? styles.feedbackOk : styles.feedbackBad}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}
