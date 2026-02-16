/**
 * Music Rhythm Tap - PREMIUM
 * Unique mechanic: Notes scroll across the screen on a track. Kid taps
 * the hit zone when notes arrive. Timing-based scoring (like Guitar Hero for kids).
 * Uses Web Audio API for real musical tones.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const NOTE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
const NOTE_FREQS = [261.63, 329.63, 392.00, 523.25];
const NOTE_NAMES = ['Do', 'Mi', 'So', 'Do+'];

function getBPM(level) {
  if (level <= 5) return 60;
  if (level <= 10) return 80;
  if (level <= 15) return 100;
  if (level <= 20) return 120;
  return 140;
}

function getNoteCount(level) {
  if (level <= 5) return 8;
  if (level <= 10) return 12;
  if (level <= 15) return 16;
  return 20;
}

function getLaneCount(level) {
  if (level <= 5) return 2;
  if (level <= 12) return 3;
  return 4;
}

function generatePattern(noteCount, laneCount) {
  const pattern = [];
  for (let i = 0; i < noteCount; i++) {
    pattern.push({
      lane: Math.floor(Math.random() * laneCount),
      beat: i,
    });
  }
  return pattern;
}

function playTone(audioCtx, freq, duration = 0.15) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {}
}

export default function MusicRhythmTap({ onComplete, level = 1, childName }) {
  const { playSuccess, playWrong, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const [phase, setPhase] = useState('ready');
  const [pattern, setPattern] = useState([]);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [flashLane, setFlashLane] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const hitMapRef = useRef(new Set());

  const bpm = getBPM(level);
  const noteCount = getNoteCount(level);
  const laneCount = getLaneCount(level);
  const beatMs = 60000 / bpm;

  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    setPattern(generatePattern(noteCount, laneCount));
    setCurrentBeat(-1);
    setHits(0);
    setMisses(0);
    setCombo(0);
    setMaxCombo(0);
    setPhase('ready');
    setFeedback(null);
    hitMapRef.current = new Set();
    const cancelRead = readQuestion(`Get ready! Tap the notes when they light up. ${bpm} beats per minute!`);
    return () => { cancelRead(); clearInterval(timerRef.current); };
  }, [level]);

  function startGame() {
    playClick();
    ensureAudio();
    setPhase('playing');
    setCurrentBeat(0);
    let beat = 0;
    timerRef.current = setInterval(() => {
      beat++;
      if (beat >= noteCount) {
        clearInterval(timerRef.current);
        setPhase('done');
        setCurrentBeat(-1);
      } else {
        setCurrentBeat(beat);
      }
    }, beatMs);
  }

  useEffect(() => {
    if (currentBeat >= 0 && currentBeat < pattern.length) {
      const note = pattern[currentBeat];
      const ctx = ensureAudio();
      if (ctx) playTone(ctx, NOTE_FREQS[note.lane]);
      setFlashLane(note.lane);
      setTimeout(() => setFlashLane(null), beatMs * 0.6);

      const checkTimer = setTimeout(() => {
        if (!hitMapRef.current.has(currentBeat)) {
          setMisses(m => m + 1);
          setCombo(0);
        }
      }, beatMs * 0.9);
      return () => clearTimeout(checkTimer);
    }
  }, [currentBeat]);

  useEffect(() => {
    if (phase === 'done') {
      const totalNotes = noteCount;
      const accuracy = totalNotes > 0 ? Math.round((hits / totalNotes) * 100) : 0;
      const score = hits * 10 + maxCombo * 5;
      const isGood = accuracy >= 50;
      if (isGood) {
        playCelebration();
        teachAfterAnswer(true, { type: 'music', extra: `You hit ${hits} out of ${totalNotes} notes! Max combo: ${maxCombo}!` });
      } else {
        teachAfterAnswer(false, { type: 'music', extra: `You hit ${hits} out of ${totalNotes}. Practice makes perfect!` });
      }
      setFeedback(isGood ? 'correct' : 'wrong');
      setTimeout(() => {
        onComplete(score, accuracy);
      }, getFeedbackDelay(level, isGood));
    }
  }, [phase]);

  function handleLaneTap(lane) {
    if (phase !== 'playing' || currentBeat < 0) return;
    const ctx = ensureAudio();
    if (ctx) playTone(ctx, NOTE_FREQS[lane], 0.2);

    const note = pattern[currentBeat];
    if (note && note.lane === lane && !hitMapRef.current.has(currentBeat)) {
      hitMapRef.current.add(currentBeat);
      setHits(h => h + 1);
      setCombo(c => {
        const newC = c + 1;
        setMaxCombo(m => Math.max(m, newC));
        return newC;
      });
      playSuccess();
    } else {
      setMisses(m => m + 1);
      setCombo(0);
    }
  }

  if (phase === 'ready') {
    return (
      <div className={styles.container}>
        <div className={styles.hud}>
          <span>Lv {level}</span><span>·</span>
          <span>{laneCount} lanes</span><span>·</span>
          <span>{noteCount} notes</span><span>·</span>
          <span>{bpm} BPM</span>
        </div>
        <div style={{ margin: '2rem 0' }}>
          <p className={styles.prompt}>Tap the colored buttons when they light up!</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0' }}>
            The notes will play one at a time. Tap the matching color!
          </p>
        </div>
        <button type="button" onClick={startGame} className={styles.choiceBtn} style={{
          padding: '1rem 2.5rem', fontSize: '1.2rem', fontWeight: 800,
          background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
          border: 'none', borderRadius: 16,
        }}>
          Start!
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Beat {Math.min(currentBeat + 1, noteCount)}/{noteCount}</span>
        <span>·</span>
        <span>Hits: {hits}</span>
        <span>·</span>
        <span>Combo: {combo}</span>
        {combo >= 3 && <span>· 🔥</span>}
      </div>

      {phase === 'playing' && (
        <div style={{
          display: 'flex', gap: '0.75rem', justifyContent: 'center',
          margin: '2rem 0', flexWrap: 'wrap',
        }}>
          {Array.from({ length: laneCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleLaneTap(i)}
              style={{
                width: 72, height: 72, borderRadius: '50%', border: 'none',
                background: NOTE_COLORS[i],
                opacity: flashLane === i ? 1 : 0.4,
                transform: flashLane === i ? 'scale(1.25)' : 'scale(1)',
                transition: 'transform 0.15s, opacity 0.15s',
                cursor: 'pointer',
                boxShadow: flashLane === i ? `0 0 24px ${NOTE_COLORS[i]}80` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '0.85rem',
              }}
            >
              {NOTE_NAMES[i]}
            </button>
          ))}
        </div>
      )}

      {phase === 'done' && (
        <div style={{ marginTop: '1.5rem' }}>
          {feedback === 'correct' && (
            <div className={styles.celebration}>
              <h2>Rhythm Star!</h2>
              <p>Hits: {hits}/{noteCount} | Max Combo: {maxCombo}</p>
            </div>
          )}
          {feedback === 'wrong' && (
            <div className={styles.feedbackBad}>
              <p>Hits: {hits}/{noteCount}. Keep practicing!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
