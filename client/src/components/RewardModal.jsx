import { useEffect, useState, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import styles from './RewardModal.module.css';

function ConfettiCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.parentElement.offsetWidth;
    const H = canvas.height = canvas.parentElement.offsetHeight;

    const colors = ['#fbbf24', '#38bdf8', '#fb923c', '#4ade80', '#fda4af', '#a78bfa'];
    const pieces = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * -1,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 1.5 + Math.random() * 3,
      wobble: Math.random() * 10,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.1,
    }));

    let running = true;
    let frame = 0;

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of pieces) {
        p.y += p.speed;
        p.x += Math.sin(p.wobble) * 0.5;
        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotSpeed;
        if (p.y > H + 10) {
          p.y = -10;
          p.x = Math.random() * W;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      frame = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      running = false;
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.confettiCanvas} />;
}

export default function RewardModal({ rewards, child, gameLevel = 1, hasNextLevel = false, onNextLevel, onPlayOther }) {
  const [show, setShow] = useState(false);
  const [stars, setStars] = useState(0);
  const [showStars, setShowStars] = useState([false, false, false]);
  const { playCelebration, playLevelUp, speak } = useAudio();

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setShow(true));
    });
    const starCount = rewards?.accuracy >= 80 ? 3 : rewards?.accuracy >= 50 ? 2 : 1;

    // Stagger star animations
    const timers = [];
    for (let i = 0; i < starCount; i++) {
      timers.push(setTimeout(() => {
        setStars((s) => s + 1);
        setShowStars((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 400 + i * 300));
    }

    // Play celebration sound
    timers.push(setTimeout(() => playCelebration(), 200));

    // Speak encouragement
    timers.push(setTimeout(() => {
      const messages = ['Great job!', 'You are amazing!', 'Wonderful work!', 'Super star!'];
      speak(messages[Math.floor(Math.random() * messages.length)]);
    }, 800));

    return () => {
      cancelAnimationFrame(t);
      timers.forEach(clearTimeout);
    };
  }, [rewards?.accuracy, playCelebration, speak]);

  useEffect(() => {
    if (rewards?.levelUp) {
      const t = setTimeout(() => playLevelUp(), 1200);
      return () => clearTimeout(t);
    }
  }, [rewards?.levelUp, playLevelUp]);

  if (!rewards) return null;

  const { xp, coins, levelUp, previousLevel, newLevel, newAchievements, isReplay, dailyBonusApplied } = rewards;
  const streak = child?.currentStreak;

  return (
    <div className={`${styles.overlay} ${show ? styles.show : ''}`} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <ConfettiCanvas />
        <div className={styles.content}>
          <div className={styles.celebrationEmoji}>{isReplay ? '🔄' : '🎉'}</div>
          <h2 className={styles.title}>{isReplay ? 'Nice practice!' : 'Great job!'}</h2>
          {streak > 0 && (
            <p className={styles.streak}>🔥 {streak} day streak!</p>
          )}
          {dailyBonusApplied && !isReplay && (
            <p className={styles.streak} style={{ color: '#4ade80' }}>🌟 Daily 2× Bonus Applied!</p>
          )}
          <div className={styles.stars}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`${styles.star} ${showStars[i] ? styles.starOn : ''}`}
              >
                ★
              </span>
            ))}
          </div>
          <p className={styles.starsEarned}>
            You earned {rewards?.accuracy >= 80 ? 3 : rewards?.accuracy >= 50 ? 2 : 1} of 3 stars!
          </p>
          {isReplay ? (
            <div className={styles.rewards}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                Already completed! No XP/coins for replays, but great practice! 💪
              </p>
            </div>
          ) : (
            <div className={styles.rewards}>
              <div className={styles.reward}>
                <span className={styles.rewardIcon}>⭐</span>
                <span className={styles.rewardValue}>+{xp} XP</span>
              </div>
              <div className={styles.reward}>
                <span className={styles.rewardIcon}>🪙</span>
                <span className={styles.rewardValue}>+{coins} coins</span>
              </div>
            </div>
          )}
          {levelUp && (
            <div className={styles.levelUp}>
              <span className={styles.levelUpEmoji}>🎊</span>
              Level up! <strong>{previousLevel}</strong> → <strong>{newLevel}</strong>
            </div>
          )}
          {newAchievements && newAchievements.length > 0 && (
            <div className={styles.achievementToast}>
              {newAchievements.map((a) => (
                <div key={a.slug} className={styles.achievementItem}>
                  <span className={styles.achievementIcon}>{a.icon}</span>
                  <div>
                    <strong>{a.title}</strong>
                    <br />
                    <small>{a.description}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
          {child && (
            <p className={styles.totals}>
              Total: <strong>{child.xp} XP</strong> · <strong>{child.coins} coins</strong> · Level {child.level}
            </p>
          )}
          <div className={styles.actions}>
            {hasNextLevel && (
              <button type="button" onClick={onNextLevel} className={styles.primaryBtn}>
                Next Level →
              </button>
            )}
            <button type="button" onClick={onPlayOther} className={hasNextLevel ? styles.secondaryBtn : styles.primaryBtn}>
              {hasNextLevel ? 'Play Other Game' : 'Back to Games'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
