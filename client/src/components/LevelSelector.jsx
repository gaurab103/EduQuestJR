/**
 * World-class kid-friendly level selector with:
 * - Lock system (must complete previous level)
 * - Premium gates (levels 16+ need subscription)
 * - Beautiful cartoon-style world map
 * - AI suggested level
 * - Visual progress tracking with stars
 */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ai as aiApi } from '../api/client';
import { WORLDS, getDifficultyLabel, getDifficultyColor } from '../games/levelConfig';
import { useAudio } from '../context/AudioContext';
import styles from './LevelSelector.module.css';

const PREMIUM_LEVEL = 16;

// World theme images from free CDN
const WORLD_IMAGES = {
  1: 'https://cdn-icons-png.flaticon.com/128/3069/3069186.png', // meadow
  2: 'https://cdn-icons-png.flaticon.com/128/2906/2906206.png', // forest
  3: 'https://cdn-icons-png.flaticon.com/128/2906/2906491.png', // mountain
  4: 'https://cdn-icons-png.flaticon.com/128/1146/1146869.png', // sky
  5: 'https://cdn-icons-png.flaticon.com/128/3222/3222683.png', // stars
  6: 'https://cdn-icons-png.flaticon.com/128/3031/3031702.png', // cosmos
};

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
  const [expandedWorld, setExpandedWorld] = useState(1);
  const [suggestedLevel, setSuggestedLevel] = useState(null);
  const [suggestReason, setSuggestReason] = useState('');
  const [premiumPopup, setPremiumPopup] = useState(false);

  // Build completed level lookup
  const completedMap = {};
  (completedLevels || []).forEach(cl => {
    completedMap[cl.level] = cl;
  });

  // Highest completed level for unlocking
  const highestCompleted = completedLevels.length > 0
    ? Math.max(...completedLevels.map(cl => cl.level))
    : 0;

  useEffect(() => {
    if (!childId || !gameSlug) return;
    aiApi.suggestedLevel(childId, gameSlug)
      .then(res => {
        if (res.suggestedLevel) {
          setSuggestedLevel(res.suggestedLevel);
          setSuggestReason(res.reason || '');
          const world = WORLDS.find(w => res.suggestedLevel >= w.levels[0] && res.suggestedLevel <= w.levels[w.levels.length - 1]);
          if (world) setExpandedWorld(world.id);
        }
      })
      .catch(() => {});
  }, [childId, gameSlug]);

  // Auto-expand the world with the next unlocked level
  useEffect(() => {
    const nextLevel = highestCompleted + 1;
    const world = WORLDS.find(w => nextLevel >= w.levels[0] && nextLevel <= w.levels[w.levels.length - 1]);
    if (world && !suggestedLevel) setExpandedWorld(world.id);
  }, [highestCompleted, suggestedLevel]);

  useEffect(() => {
    speak(`Choose your level for ${gameTitle}!`);
  }, []);

  function isLevelUnlocked(lvl) {
    if (lvl === 1) return true;
    return completedMap[lvl - 1] !== undefined;
  }

  function isLevelPremiumLocked(lvl) {
    return lvl >= PREMIUM_LEVEL && !isPremium;
  }

  function handleLevelClick(lvl) {
    playClick();
    if (isLevelPremiumLocked(lvl)) {
      setPremiumPopup(true);
      return;
    }
    if (!isLevelUnlocked(lvl)) {
      speak(`Complete level ${lvl - 1} first!`);
      return;
    }
    onSelect(lvl);
  }

  // Overall progress
  const totalLevels = 30;
  const completedCount = completedLevels.length;
  const progressPct = Math.round((completedCount / totalLevels) * 100);

  return (
    <div className={styles.wrapper}>
      {/* Game title with cartoon banner */}
      <div className={styles.banner}>
        <img src="https://cdn-icons-png.flaticon.com/128/3176/3176298.png" alt="" className={styles.bannerIcon} />
        <div>
          <h2 className={styles.title}>{gameTitle}</h2>
          <p className={styles.subtitle}>Choose your adventure level!</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span>🏆 {completedCount}/{totalLevels} levels</span>
          <span className={styles.progressPct}>{progressPct}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* AI suggestion */}
      {suggestedLevel && isLevelUnlocked(suggestedLevel) && !isLevelPremiumLocked(suggestedLevel) && (
        <button
          type="button"
          onClick={() => handleLevelClick(suggestedLevel)}
          className={styles.suggestedBtn}
        >
          <img src="https://cdn-icons-png.flaticon.com/128/3940/3940403.png" alt="Buddy" className={styles.suggestedImg} />
          <div className={styles.suggestedInfo}>
            <span className={styles.suggestedLabel}>Buddy says: Try Level {suggestedLevel}!</span>
            <span className={styles.suggestedReason}>{suggestReason}</span>
          </div>
          <span className={styles.suggestedArrow}>▶</span>
        </button>
      )}

      {/* Reward hint */}
      <div className={styles.rewardInfo}>
        <span className={styles.rewardHint}>
          💡 Higher levels = more XP & coins! First daily game = 2× bonus!
        </span>
      </div>

      {/* World sections */}
      <div className={styles.worlds}>
        {WORLDS.map((world) => {
          const isExpanded = expandedWorld === world.id;
          const worldCompleted = world.levels.filter(l => completedMap[l]).length;
          const allPremiumLocked = world.levels[0] >= PREMIUM_LEVEL && !isPremium;

          return (
            <div key={world.id} className={`${styles.worldSection} ${allPremiumLocked ? styles.worldPremium : ''}`}>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setExpandedWorld(isExpanded ? null : world.id);
                }}
                className={styles.worldHeader}
                style={{ '--world-color': world.color }}
              >
                <img src={WORLD_IMAGES[world.id]} alt="" className={styles.worldImg} />
                <div className={styles.worldInfo}>
                  <span className={styles.worldName}>{world.name}</span>
                  <span className={styles.worldMeta}>
                    {worldCompleted}/{world.levels.length} ⭐
                    {' · '}
                    <span style={{ color: getDifficultyColor(world.levels[0]) }}>
                      {getDifficultyLabel(world.levels[0])}
                    </span>
                  </span>
                </div>
                {allPremiumLocked && (
                  <span className={styles.premiumTag}>
                    <img src="https://cdn-icons-png.flaticon.com/128/3064/3064197.png" alt="" className={styles.crownIcon} />
                    PRO
                  </span>
                )}
                <span className={styles.worldArrow}>{isExpanded ? '▼' : '▶'}</span>
              </button>

              {isExpanded && (
                <div className={styles.levelGrid}>
                  {world.levels.map((lvl) => {
                    const completed = completedMap[lvl];
                    const unlocked = isLevelUnlocked(lvl);
                    const premLocked = isLevelPremiumLocked(lvl);
                    const isSuggested = lvl === suggestedLevel;
                    const stars = completed ? getStarsForAccuracy(completed.bestAccuracy) : 0;

                    let btnClass = styles.levelBtn;
                    if (completed) btnClass += ` ${styles.levelCompleted}`;
                    if (!unlocked) btnClass += ` ${styles.levelLocked}`;
                    if (premLocked) btnClass += ` ${styles.levelPremiumLocked}`;
                    if (isSuggested && unlocked) btnClass += ` ${styles.levelSuggested}`;

                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleLevelClick(lvl)}
                        className={btnClass}
                        style={{ '--level-color': world.color }}
                        disabled={false}
                      >
                        {/* Lock / Premium overlay */}
                        {(!unlocked || premLocked) && (
                          <span className={styles.lockOverlay}>
                            {premLocked
                              ? <img src="https://cdn-icons-png.flaticon.com/128/3064/3064197.png" alt="Premium" className={styles.lockIcon} />
                              : <img src="https://cdn-icons-png.flaticon.com/128/3064/3064155.png" alt="Locked" className={styles.lockIcon} />
                            }
                          </span>
                        )}

                        {/* Level number */}
                        <span className={styles.levelNum}>{lvl}</span>

                        {/* Stars for completed */}
                        {completed && (
                          <div className={styles.starRow}>
                            {[1, 2, 3].map(s => (
                              <span key={s} className={s <= stars ? styles.starFull : styles.starEmpty}>
                                {s <= stars ? '⭐' : '☆'}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Suggested badge */}
                        {isSuggested && unlocked && !premLocked && (
                          <span className={styles.suggestedDot}>🐻</span>
                        )}

                        {/* Replay badge */}
                        {completed && (
                          <span className={styles.replayBadge}>✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Premium popup */}
      {premiumPopup && (
        <div className={styles.premiumOverlay} onClick={() => setPremiumPopup(false)}>
          <div className={styles.premiumModal} onClick={e => e.stopPropagation()}>
            <img src="https://cdn-icons-png.flaticon.com/128/3064/3064197.png" alt="" className={styles.premiumCrown} />
            <h3 className={styles.premiumTitle}>Premium Adventure!</h3>
            <p className={styles.premiumText}>
              Levels 16 and above are for Premium members! Unlock all 30 levels, unlimited play time, and exclusive games!
            </p>
            <button
              type="button"
              onClick={() => navigate('/subscription')}
              className={styles.premiumBtn}
            >
              🌟 Upgrade to Premium
            </button>
            <button
              type="button"
              onClick={() => setPremiumPopup(false)}
              className={styles.premiumClose}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
