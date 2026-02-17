/**
 * Digital Coloring Book - PREMIUM
 * Unique mechanic: SVG scenes with tappable regions. Kid picks a color
 * from palette then taps regions to fill them. Scored on color accuracy.
 * Reference images + clear criteria for world-class experience.
 */
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useTeaching } from './useTeaching';
import { useNoRepeat } from './useNoRepeat';
import { getFeedbackDelay } from './levelConfig';
import { GameImage, OBJECT_IMAGES, ANIMAL_IMAGES } from './gameImages';
import styles from './GameCommon.module.css';

// Reference images so scene name matches what kids see
const SCENE_ICONS = {
  'Sun and Sky': OBJECT_IMAGES.sun,
  'Simple House': OBJECT_IMAGES.house,
  'Simple Flower': OBJECT_IMAGES.flower,
  'House': OBJECT_IMAGES.house,
  'Butterfly': ANIMAL_IMAGES.butterfly,
  'Fish': ANIMAL_IMAGES.fish,
  'Tree': OBJECT_IMAGES.tree,
  'Car': OBJECT_IMAGES.car,
  'Flower': OBJECT_IMAGES.flower,
};

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

// layer: 0=background (drawn first), 1=mid, 2=foreground (drawn last)
// Simple 4-region scenes — recognizable shapes matching scene names
const SIMPLE_SCENES = [
  {
    name: 'Sun and Sky',
    regions: [
      { id: 'sky', label: 'Sky', d: 'M0,0 L260,0 L260,180 L0,180 Z', suggest: 'sky', layer: 0 },
      { id: 'sun', label: 'Sun', d: 'M130,90 m-35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0', suggest: 'yellow', layer: 1 },
      { id: 'cloud', label: 'Cloud', d: 'M50,140 Q70,120 100,140 Q130,160 100,170 Q70,180 50,160 Q30,150 50,140 Z', suggest: 'pink', layer: 1 },
      { id: 'ground', label: 'Ground', d: 'M0,195 L260,195 L260,220 L0,220 Z', suggest: 'green', layer: 1 },
    ],
  },
  {
    name: 'Simple House',
    regions: [
      { id: 'sky', label: 'Sky', d: 'M0,0 L260,0 L260,95 L0,95 Z', suggest: 'sky', layer: 0 },
      { id: 'grass', label: 'Grass', d: 'M0,175 L260,175 L260,220 L0,220 Z', suggest: 'green', layer: 0 },
      { id: 'house', label: 'House', d: 'M75,95 L75,175 L185,175 L185,95 Z', suggest: 'yellow', layer: 1 },
      { id: 'roof', label: 'Roof', d: 'M55,95 L130,45 L205,95 Z', suggest: 'red', layer: 1 },
    ],
  },
  {
    name: 'Simple Flower',
    regions: [
      { id: 'sky', label: 'Sky', d: 'M0,0 L260,0 L260,130 L0,130 Z', suggest: 'sky', layer: 0 },
      { id: 'ground', label: 'Ground', d: 'M0,185 L260,185 L260,220 L0,220 Z', suggest: 'green', layer: 0 },
      { id: 'flower', label: 'Flower', d: 'M130,70 m-40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0', suggest: 'pink', layer: 1 },
      { id: 'stem', label: 'Stem', d: 'M115,110 L145,110 L145,185 L115,185 Z', suggest: 'green', layer: 1 },
    ],
  },
];

const SCENES = [
  {
    name: 'House',
    regions: [
      { id: 'sky', label: 'Sky', d: 'M0,0 L260,0 L260,90 L0,90 Z', suggest: 'sky', layer: 0 },
      { id: 'grass', label: 'Grass', d: 'M0,180 L260,180 L260,220 L0,220 Z', suggest: 'green', layer: 0 },
      { id: 'wall', label: 'Wall', d: 'M60,180 L60,80 L200,80 L200,180 Z', suggest: 'yellow', layer: 1 },
      { id: 'roof', label: 'Roof', d: 'M40,80 L130,20 L220,80 Z', suggest: 'red', layer: 1 },
      { id: 'door', label: 'Door', d: 'M110,180 L110,120 L150,120 L150,180 Z', suggest: 'brown', layer: 2 },
      { id: 'window', label: 'Window', d: 'M70,100 L70,130 L100,130 L100,100 Z', suggest: 'blue', layer: 2 },
    ],
  },
  {
    name: 'Butterfly',
    regions: [
      { id: 'lwing', label: 'Left Wing', d: 'M100,80 Q40,40 60,120 Q80,140 100,120 Z', suggest: 'purple', layer: 1 },
      { id: 'rwing', label: 'Right Wing', d: 'M160,80 Q220,40 200,120 Q180,140 160,120 Z', suggest: 'pink', layer: 1 },
      { id: 'body', label: 'Body', d: 'M120,60 L140,60 L145,160 L115,160 Z', suggest: 'brown', layer: 1 },
      { id: 'ldot', label: 'Left Dot', d: 'M75,90 A18,18 0 1,1 75,89.9 Z', suggest: 'blue', layer: 2 },
      { id: 'rdot', label: 'Right Dot', d: 'M185,90 A18,18 0 1,1 185,89.9 Z', suggest: 'blue', layer: 2 },
    ],
  },
  {
    name: 'Fish',
    regions: [
      { id: 'water', label: 'Water', d: 'M0,0 L260,0 L260,200 L0,200 Z', suggest: 'sky', layer: 0 },
      { id: 'body', label: 'Body', d: 'M60,100 Q130,30 200,100 Q130,170 60,100 Z', suggest: 'orange', layer: 1 },
      { id: 'tail', label: 'Tail', d: 'M60,100 L20,60 L20,140 Z', suggest: 'red', layer: 1 },
      { id: 'fin', label: 'Fin', d: 'M120,100 L100,140 L140,140 Z', suggest: 'yellow', layer: 1 },
      { id: 'stripe1', label: 'Stripe', d: 'M108,68 L122,68 L122,132 L108,132 Z', suggest: 'yellow', layer: 1 },
      { id: 'eye', label: 'Eye', d: 'M160,90 A14,14 0 1,1 160,89.9 Z', suggest: 'blue', layer: 2 },
    ],
  },
  {
    name: 'Tree',
    regions: [
      { id: 'sky', label: 'Sky', d: 'M0,0 L260,0 L260,190 L0,190 Z', suggest: 'sky', layer: 0 },
      { id: 'ground', label: 'Ground', d: 'M0,190 L260,190 L260,220 L0,220 Z', suggest: 'lime', layer: 0 },
      { id: 'trunk', label: 'Trunk', d: 'M110,130 L150,130 L155,200 L105,200 Z', suggest: 'brown', layer: 1 },
      { id: 'leaves', label: 'Leaves', d: 'M130,20 Q50,30 70,90 Q60,130 130,130 Q200,130 200,90 Q210,30 130,20 Z', suggest: 'green', layer: 1 },
      { id: 'apple1', label: 'Apple', d: 'M100,60 A12,12 0 1,1 100,59.9 Z', suggest: 'red', layer: 2 },
      { id: 'apple2', label: 'Apple', d: 'M150,80 A12,12 0 1,1 150,79.9 Z', suggest: 'red', layer: 2 },
    ],
  },
  {
    name: 'Car',
    regions: [
      { id: 'sky', label: 'Sky', d: 'M0,0 L260,0 L260,140 L0,140 Z', suggest: 'sky', layer: 0 },
      { id: 'road', label: 'Road', d: 'M0,140 L260,140 L260,180 L0,180 Z', suggest: 'purple', layer: 0 },
      { id: 'body', label: 'Car Body', d: 'M40,120 L40,90 L80,90 L100,60 L180,60 L200,90 L220,90 L220,120 Z', suggest: 'red', layer: 1 },
      { id: 'window', label: 'Window', d: 'M105,65 L115,90 L175,90 L185,65 Z', suggest: 'sky', layer: 1 },
      { id: 'wheel1', label: 'Front Wheel', d: 'M80,120 A18,18 0 1,1 80,119.9 Z', suggest: 'brown', layer: 2 },
      { id: 'wheel2', label: 'Back Wheel', d: 'M190,120 A18,18 0 1,1 190,119.9 Z', suggest: 'brown', layer: 2 },
    ],
  },
  {
    name: 'Flower',
    regions: [
      { id: 'ground', label: 'Ground', d: 'M0,175 L260,175 L260,200 L0,200 Z', suggest: 'lime', layer: 0 },
      { id: 'stem', label: 'Stem', d: 'M147,90 L153,90 L153,180 L147,180 Z', suggest: 'green', layer: 1 },
      { id: 'leaf', label: 'Leaf', d: 'M150,130 Q180,120 170,150 Q155,140 150,130 Z', suggest: 'green', layer: 1 },
      { id: 'petal1', label: 'Petal', d: 'M130,50 Q150,20 170,50 Q150,60 130,50 Z', suggest: 'pink', layer: 1 },
      { id: 'petal2', label: 'Petal', d: 'M170,50 Q190,70 170,90 Q160,70 170,50 Z', suggest: 'pink', layer: 1 },
      { id: 'petal3', label: 'Petal', d: 'M170,90 Q150,110 130,90 Q150,80 170,90 Z', suggest: 'pink', layer: 1 },
      { id: 'petal4', label: 'Petal', d: 'M130,90 Q110,70 130,50 Q140,70 130,90 Z', suggest: 'pink', layer: 1 },
      { id: 'center', label: 'Center', d: 'M140,60 A12,12 0 1,1 140,59.9 Z', suggest: 'yellow', layer: 2 },
    ],
  },
];

function getScenesForLevel(level) {
  if (level <= 3) return SIMPLE_SCENES;
  if (level <= 5) return [...SIMPLE_SCENES, ...SCENES.slice(0, 2)];
  if (level <= 10) return SCENES.slice(0, 4);
  return SCENES;
}

function getColoringRounds(level) {
  if (level <= 5) return 2;
  if (level <= 10) return 3;
  if (level <= 15) return 4;
  if (level <= 20) return 5;
  return 6;
}

function getPaletteForLevel(level) {
  if (level <= 5) return PALETTE.slice(0, 6);
  if (level <= 10) return PALETTE.slice(0, 8);
  return PALETTE;
}

export default function DigitalColoringBook({ onComplete, level = 1, childName }) {
  const { playSuccess, playClick, playCelebration } = useAudio();
  const { teachAfterAnswer, readQuestion, getRecommendedDelayBeforeNext } = useTeaching();
  const { generate } = useNoRepeat(level);
  const [round, setRound] = useState(0);
  const [scene, setScene] = useState(null);
  const [regionColors, setRegionColors] = useState({});
  const [activeColor, setActiveColor] = useState(null);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalRegions, setTotalRegions] = useState(0);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);
  const pool = getScenesForLevel(level);
  const palette = getPaletteForLevel(level);
  const ROUNDS = Math.min(getColoringRounds(level), pool.length);

  useEffect(() => {
    setActiveColor(palette[0]);
  }, [level]);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    if (round >= ROUNDS && !completedRef.current) {
      completedRef.current = true;
      playCelebration();
      const accuracy = totalRegions > 0 ? Math.round((totalCorrect / totalRegions) * 100) : 100;
      onComplete(score, accuracy);
      return;
    }
    const s = generate(() => pool[Math.floor(Math.random() * pool.length)], (s) => s.name);
    setScene(s);
    setRegionColors({});
    setDone(false);
    if (!activeColor) setActiveColor(palette[0]);
    const cancelRead = readQuestion(`Color the ${s.name}! Pick a color and tap each part.`);
    return cancelRead;
  }, [round, level]);

  function handleRegionClick(regionId) {
    if (done || !activeColor) return;
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
      setTotalCorrect(c => c + matchCount);
      setTotalRegions(t => t + scene.regions.length);
      const sceneAccuracy = Math.round((matchCount / scene.regions.length) * 100);
      setScore(s => s + 10 + Math.round(sceneAccuracy / 10));
      playSuccess();
      teachAfterAnswer(true, { type: 'color', extra: `Beautiful ${scene.name}! You colored all ${scene.regions.length} parts!` });
      const delay = getRecommendedDelayBeforeNext(getFeedbackDelay(level, true));
      setTimeout(() => setRound(r => r + 1), delay);
    }
  }

  if (round >= ROUNDS) {
    const finalAccuracy = totalRegions > 0 ? Math.round((totalCorrect / totalRegions) * 100) : 100;
    const stars = finalAccuracy >= 80 ? 3 : finalAccuracy >= 50 ? 2 : 1;
    return (
      <div className={styles.container}>
        <div className={styles.celebration}>
          <h2>Art Star!</h2>
          <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
            {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {finalAccuracy}% correct colors · {stars} of 3 stars
          </p>
          <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>Score: {score}</p>
          <p style={{ color: 'var(--text-muted)' }}>You colored {ROUNDS} scene{ROUNDS !== 1 ? 's' : ''}!</p>
          {finalAccuracy >= 80 && <p style={{ color: 'var(--success)', fontWeight: 700, marginTop: '0.5rem' }}>Great color choices!</p>}
        </div>
      </div>
    );
  }

  if (!scene) return null;

  const sceneIcon = SCENE_ICONS[scene.name];
  const colorGuide = scene.regions
    .filter(r => r.suggest && r.label)
    .map(r => {
      const p = PALETTE.find(x => x.name === r.suggest);
      return p ? `${r.label} → ${p.name}` : null;
    })
    .filter(Boolean);

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>Lv {level}</span>
        <span>·</span>
        <span>Scene {round + 1}/{ROUNDS}</span>
        <span>·</span>
        <span>{Object.keys(regionColors).length}/{scene.regions.length} parts</span>
      </div>

      {/* Reference: image + name match */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(56,189,248,0.08)',
        borderRadius: 12, border: '1px solid rgba(56,189,248,0.2)',
      }}>
        {sceneIcon && <GameImage src={sceneIcon} alt={scene.name} size={40} />}
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Color the {scene.name}</h3>
      </div>

      <p className={styles.prompt}>
        Pick a color, then tap each part to paint it!
      </p>

      {/* Clear star criteria */}
      <p style={{
        fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem',
        background: 'rgba(251,191,36,0.12)', padding: '0.4rem 0.6rem', borderRadius: 8,
        fontWeight: 600,
      }}>
        ★★★ 80%+ correct colors · ★★☆ 50%+ · ★☆☆ Keep practicing!
      </p>

      {/* Color guide: what to color what */}
      {colorGuide.length > 0 && Object.keys(regionColors).length === 0 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Hint: {colorGuide.slice(0, 4).join(' · ')}
        </p>
      )}

      {/* Color Palette */}
      <div style={{
        display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap',
        margin: '0.5rem 0 1rem',
      }}>
        {palette.map(c => (
          <button
            key={c.name}
            type="button"
            onClick={() => { playClick(); setActiveColor(c); }}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: c.hex, cursor: 'pointer',
              outline: activeColor?.name === c.name ? '3px solid var(--text)' : '2px solid rgba(0,0,0,0.15)',
              outlineOffset: 2,
              transform: activeColor?.name === c.name ? 'scale(1.2)' : 'scale(1)',
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
          {[...scene.regions].sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0)).map(r => (
            <path
              key={r.id}
              d={r.d}
              fill={regionColors[r.id] || '#f3f4f6'}
              stroke="#333"
              strokeWidth={2}
              style={{ cursor: done ? 'default' : 'pointer', transition: 'fill 0.2s', pointerEvents: 'all' }}
              onClick={() => handleRegionClick(r.id)}
            >
              <title>{r.label}</title>
            </path>
          ))}
        </svg>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        Painting with: <strong style={{ color: activeColor?.hex }}>{activeColor?.name || 'Pick a color'}</strong>
      </p>

      {done && <p className={styles.feedbackOk}>Beautiful {scene.name}!</p>}
    </div>
  );
}
