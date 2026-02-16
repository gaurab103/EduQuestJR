/**
 * Digital Coloring Book - PREMIUM
 * Unique mechanic: SVG scenes with tappable regions. Kid picks a color
 * from palette then taps regions to fill them. Scored on completion.
 * Different from DrawingCanvas (freehand) -- this is structured coloring.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getRounds, getFeedbackDelay } from './levelConfig';
import styles from './GameCommon.module.css';

const PALETTE = [
  { name: 'red', hex: '#ef4444' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'green', hex: '#22c55e' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'orange', hex: '#f97316' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'pink', hex: '#ec4899' },
  { name: 'brown', hex: '#92400e' },
  { name: 'sky', hex: '#38bdf8' },
  { name: 'lime', hex: '#84cc16' },
];

const SCENES = [
  {
    name: 'House',
    regions: [
      { id: 'wall', label: 'Wall', d: 'M60,180 L60,80 L200,80 L200,180 Z', suggest: 'yellow' },
      { id: 'roof', label: 'Roof', d: 'M40,80 L130,20 L220,80 Z', suggest: 'red' },
      { id: 'door', label: 'Door', d: 'M110,180 L110,120 L150,120 L150,180 Z', suggest: 'brown' },
      { id: 'window', label: 'Window', d: 'M70,100 L70,130 L100,130 L100,100 Z', suggest: 'blue' },
      { id: 'grass', label: 'Grass', d: 'M0,180 L260,180 L260,220 L0,220 Z', suggest: 'green' },
      { id: 'sky', label: 'Sky', d: 'M0,0 L260,0 L260,80 L40,80 L130,20 L220,80 L260,80 L260,0 Z', suggest: 'sky' },
    ],
  },
  {
    name: 'Butterfly',
    regions: [
      { id: 'lwing', label: 'Left Wing', d: 'M100,80 Q40,40 60,120 Q80,140 100,120 Z', suggest: 'purple' },
      { id: 'rwing', label: 'Right Wing', d: 'M160,80 Q220,40 200,120 Q180,140 160,120 Z', suggest: 'pink' },
      { id: 'body', label: 'Body', d: 'M120,60 L140,60 L145,160 L115,160 Z', suggest: 'brown' },
      { id: 'bg', label: 'Background', d: 'M0,0 L260,0 L260,200 L0,200 Z', suggest: 'sky' },
      { id: 'ldot', label: 'Left Dot', d: 'M75,90 A15,15 0 1,1 75,89.9 Z', suggest: 'blue' },
      { id: 'rdot', label: 'Right Dot', d: 'M185,90 A15,15 0 1,1 185,89.9 Z', suggest: 'blue' },
    ],
  },
  {
    name: 'Fish',
    regions: [
      { id: 'body', label: 'Body', d: 'M60,100 Q130,30 200,100 Q130,170 60,100 Z', suggest: 'orange' },
      { id: 'tail', label: 'Tail', d: 'M60,100 L20,60 L20,140 Z', suggest: 'red' },
      { id: 'eye', label: 'Eye', d: 'M160,90 A10,10 0 1,1 160,89.9 Z', suggest: 'blue' },
      { id: 'water', label: 'Water', d: 'M0,0 L260,0 L260,200 L0,200 Z', suggest: 'sky' },
      { id: 'fin', label: 'Fin', d: 'M120,100 L100,140 L140,140 Z', suggest: 'yellow' },
      { id: 'stripe1', label: 'Stripe', d: 'M110,70 L120,70 L120,130 L110,130 Z', suggest: 'yellow' },
    ],
  },
  {
    name: 'Tree',
    regions: [
      { id: 'trunk', label: 'Trunk', d: 'M110,130 L150,130 L155,200 L105,200 Z', suggest: 'brown' },
      { id: 'leaves', label: 'Leaves', d: 'M130,20 Q50,30 70,90 Q60,130 130,130 Q200,130 200,90 Q210,30 130,20 Z', suggest: 'green' },
      { id: 'ground', label: 'Ground', d: 'M0,190 L260,190 L260,220 L0,220 Z', suggest: 'lime' },
      { id: 'sky', label: 'Sky', d: 'M0,0 L260,0 L260,190 L0,190 Z', suggest: 'sky' },
      { id: 'apple1', label: 'Apple', d: 'M100,60 A8,8 0 1,1 100,59.9 Z', suggest: 'red' },
      { id: 'apple2', label: 'Apple', d: 'M150,80 A8,8 0 1,1 150,79.9 Z', suggest: 'red' },
    ],
  },
  {
    name: 'Car',
    regions: [
      { id: 'body', label: 'Car Body', d: 'M40,120 L40,90 L80,90 L100,60 L180,60 L200,90 L220,90 L220,120 Z', suggest: 'red' },
      { id: 'window', label: 'Window', d: 'M105,65 L115,90 L175,90 L185,65 Z', suggest: 'sky' },
      { id: 'wheel1', label: 'Front Wheel', d: 'M80,120 A18,18 0 1,1 80,119.9 Z', suggest: 'brown' },
      { id: 'wheel2', label: 'Back Wheel', d: 'M190,120 A18,18 0 1,1 190,119.9 Z', suggest: 'brown' },
      { id: 'road', label: 'Road', d: 'M0,140 L260,140 L260,180 L0,180 Z', suggest: 'purple' },
      { id: 'sky', label: 'Sky', d: 'M0,0 L260,0 L260,140 L0,140 Z', suggest: 'sky' },
    ],
  },
  {
    name: 'Flower',
    regions: [
      { id: 'petal1', label: 'Petal', d: 'M130,50 Q150,20 170,50 Q150,60 130,50 Z', suggest: 'pink' },
      { id: 'petal2', label: 'Petal', d: 'M170,50 Q190,70 170,90 Q160,70 170,50 Z', suggest: 'pink' },
      { id: 'petal3', label: 'Petal', d: 'M170,90 Q150,110 130,90 Q150,80 170,90 Z', suggest: 'pink' },
      { id: 'petal4', label: 'Petal', d: 'M130,90 Q110,70 130,50 Q140,70 130,90 Z', suggest: 'pink' },
      { id: 'center', label: 'Center', d: 'M140,60 A12,12 0 1,1 140,59.9 Z', suggest: 'yellow' },
      { id: 'stem', label: 'Stem', d: 'M147,90 L153,90 L153,180 L147,180 Z', suggest: 'green' },
      { id: 'leaf', label: 'Leaf', d: 'M150,130 Q180,120 170,150 Q155,140 150,130 Z', suggest: 'green' },
      { id: 'ground', label: 'Ground', d: 'M0,175 L260,175 L260,200 L0,200 Z', suggest: 'lime' },
    ],
  },
];

function getScenesForLevel(level) {
  if (level <= 5) return SCENES.slice(0, 2);
  if (level <= 10) return SCENES.slice(0, 4);
  return SCENES;
}

export default function DigitalColoringBook({ onComplete, level = 1, childName }) {
  const { playSuccess, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion } = useTeaching();
  const { generate } = useNoRepeat();
  const [round, setRound] = useState(0);
  const [scene, setScene] = useState(null);
  const [regionColors, setRegionColors] = useState({});
  const [activeColor, setActiveColor] = useState(PALETTE[0]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const ROUNDS = Math.min(getRounds(level), getScenesForLevel(level).length);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      playCelebration();
      onComplete(score, 100);
      return;
    }
    const pool = getScenesForLevel(level);
    const s = generate(() => pool[Math.floor(Math.random() * pool.length)], (s) => s.name);
    setScene(s);
    setRegionColors({});
    setDone(false);
    const cancelRead = readQuestion(`Color the ${s.name}! Pick a color and tap each part.`);
    return cancelRead;
  }, [round]);

  function handleRegionClick(regionId) {
    if (done) return;
    playClick();
    const newColors = { ...regionColors, [regionId]: activeColor.hex };
    setRegionColors(newColors);

    if (scene && Object.keys(newColors).length >= scene.regions.length) {
      let matchCount = 0;
      for (const r of scene.regions) {
        if (newColors[r.id]) {
          const suggested = PALETTE.find(p => p.name === r.suggest);
          if (suggested && newColors[r.id] === suggested.hex) matchCount++;
        }
      }
      setDone(true);
      const accuracy = Math.round((matchCount / scene.regions.length) * 100);
      setScore(s => s + 10 + Math.round(accuracy / 10));
      playSuccess();
      teachAfterAnswer(true, { type: 'color', extra: `Beautiful ${scene.name}! You colored all ${scene.regions.length} parts!` });
      const delay = getFeedbackDelay(level, true);
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }

  if (round >= ROUNDS) {
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Art Star!</h2>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <p style={{ color: 'var(--text-muted)' }}>You colored {ROUNDS} scenes!</p>
        </div>
      </div>
    );
  }

  if (!scene) return null;

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>Scene {round + 1}/{ROUNDS}: {scene.name}</span>
        <span>·</span>
        <span>{Object.keys(regionColors).length}/{scene.regions.length} parts</span>
      </div>

      <p className={styles.prompt}>
        Pick a color, then tap each part to paint it!
      </p>

      {/* Color Palette */}
      <div style={{
        display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap',
        margin: '0.5rem 0 1rem',
      }}>
        {PALETTE.map(c => (
          <button
            key={c.name}
            type="button"
            onClick={() => { playClick(); setActiveColor(c); }}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: c.hex, cursor: 'pointer',
              outline: activeColor.name === c.name ? '3px solid var(--text)' : '2px solid rgba(0,0,0,0.15)',
              outlineOffset: 2,
              transform: activeColor.name === c.name ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 0.15s, outline 0.15s',
            }}
            aria-label={c.name}
          />
        ))}
      </div>

      {/* SVG Scene */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: 8,
        border: '2px solid var(--card-border)', display: 'inline-block',
        maxWidth: '100%',
      }}>
        <svg viewBox="0 0 260 220" style={{ width: '100%', maxWidth: 360, height: 'auto' }}>
          {scene.regions.map(r => (
            <path
              key={r.id}
              d={r.d}
              fill={regionColors[r.id] || '#f3f4f6'}
              stroke="#333"
              strokeWidth={1.5}
              style={{ cursor: done ? 'default' : 'pointer', transition: 'fill 0.2s' }}
              onClick={() => handleRegionClick(r.id)}
            >
              <title>{r.label}</title>
            </path>
          ))}
        </svg>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        Painting with: <strong style={{ color: activeColor.hex }}>{activeColor.name}</strong>
      </p>

      {done && <p className={styles.feedbackOk}>Beautiful {scene.name}!</p>}
    </div>
  );
}
