/**
 * Kid-friendly level selector — simple, colorful, one-tap to play!
 * Big buttons, clear stars, gentle lock indicators.
 */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ai as aiApi } from '../api/client';
import { useAudio } from '../context/AudioContext';
import styles from './LevelSelector.module.css';

const PREMIUM_LEVEL = 16;
const TOTAL_LEVELS = 30;

const LEVEL_COLORS = [
  '#4ade80','#38bdf8','#a78bfa','#fb923c','#f472b6',
  '#34d399','#60a5fa','#c084fc','#fbbf24','#f87171',
  '#2dd4bf','#818cf8','#e879f9','#facc15','#fb7185',
  '#fbbf24','#f59e0b','#eab308','#d97706','#b45309',
  '#a78bfa','#8b5cf6','#7c3aed','#6d28d9','#5b21b6',
  '#f472b6','#ec4899','#db2777','#be185d','#9d174d',
];

function getStarsForAccuracy(acc) {
  if (acc >= 90) return 3;
  if (acc >= 70) return 2;
  if (acc >= 50) return 1;
  return 0;
}

export default function LevelSelector({ gameTitle, gameSlug, onSelect, completedLevels = [], isPremium = false }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const childId = searchParams.get('child');
  const { playClick, speak } = useAudio();
  const [suggestedLevel, setSuggestedLevel] = useState(null);
  const [premiumPopup, setPremiumPopup] = useState(false);

  const completedMap = {};
  (completedLevels || []).forEach(cl => { completedMap[cl.level] = cl; });
  const highestCompleted = completedLevels.length > 0
    ? Math.max(...completedLevels.map(cl => cl.level))
    : 0;
  const nextLevel = highestCompleted + 1;
  const completedCount = completedLevels.length;
  const progressPct = Math.round((completedCount / TOTAL_LEVELS) * 100);

  useEffect(() => {
    if (!childId || !gameSlug) return;
    aiApi.suggestedLevel(childId, gameSlug)
      .then(res => { if (res.suggestedLevel) setSuggestedLevel(res.suggestedLevel); })
      .catch(() => {});
  }, [childId, gameSlug]);

  useEffect(() => { speak(`Pick a level!`); }, []);

  function isUnlocked(lvl) { return lvl === 1 || completedMap[lvl - 1] !== undefined; }
  function isPremLocked(lvl) { return lvl >= PREMIUM_LEVEL && !isPremium; }

  function handleClick(lvl) {
    playClick();
    if (isPremLocked(lvl)) { setPremiumPopup(true); return; }
    if (!isUnlocked(lvl)) { speak(`Finish level ${lvl - 1} first!`); return; }
    onSelect(lvl);
  }

  // Quick-play: start the next unlocked level
  function handleQuickPlay() {
    playClick();
    const lvl = suggestedLevel && isUnlocked(suggestedLevel) && !isPremLocked(suggestedLevel)
      ? suggestedLevel : nextLevel;
    if (isPremLocked(lvl)) { setPremiumPopup(true); return; }
    if (isUnlocked(lvl)) onSelect(lvl);
  }

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.gameTitle}>{gameTitle}</h2>
        <div className={styles.progressRow}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
          <span className={styles.progressLabel}>{completedCount}/{TOTAL_LEVELS}</span>
        </div>
      </div>

      {/* Big Play Button */}
      <button type="button" onClick={handleQuickPlay} className={styles.playBtn}>
        <span className={styles.playIcon}>▶</span>
        <span className={styles.playText}>
          {completedCount === 0 ? 'Start Playing!' : `Play Level ${Math.min(nextLevel, TOTAL_LEVELS)}`}
        </span>
      </button>

      {/* Level Grid */}
      <div className={styles.gridTitle}>Or pick a level:</div>
      <div className={styles.grid}>
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map(lvl => {
          const done = completedMap[lvl];
          const unlocked = isUnlocked(lvl);
          const premLocked = isPremLocked(lvl);
          const isNext = lvl === nextLevel && !premLocked;
          const stars = done ? getStarsForAccuracy(done.bestAccuracy) : 0;
          const color = LEVEL_COLORS[lvl - 1] || '#a78bfa';

          let cls = styles.lvl;
          if (done) cls += ` ${styles.lvlDone}`;
          if (!unlocked && !premLocked) cls += ` ${styles.lvlLocked}`;
          if (premLocked) cls += ` ${styles.lvlPrem}`;
          if (isNext) cls += ` ${styles.lvlNext}`;

          return (
            <button
              key={lvl}
              type="button"
              onClick={() => handleClick(lvl)}
              className={cls}
              style={{ '--lc': color }}
            >
              {(!unlocked || premLocked) && (
                <span className={styles.lock}>{premLocked ? '👑' : '🔒'}</span>
              )}
              <span className={styles.num}>{lvl}</span>
              {done && (
                <div className={styles.stars}>
                  {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
                </div>
              )}
              {isNext && <span className={styles.nextDot} />}
            </button>
          );
        })}
      </div>

      {/* Premium popup */}
      {premiumPopup && (
        <div className={styles.overlay} onClick={() => setPremiumPopup(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>👑</div>
            <h3 className={styles.modalTitle}>Premium Levels!</h3>
            <p className={styles.modalText}>
              Levels 16–30 are for Premium members! Get unlimited play, all games, and more!
            </p>
            <button type="button" onClick={() => navigate('/subscription')} className={styles.upgradeBtn}>
              Upgrade to Premium
            </button>
            <button type="button" onClick={() => setPremiumPopup(false)} className={styles.laterBtn}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
