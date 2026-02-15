import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ai as aiApi } from '../api/client';
import Mascot from './Mascot';
import { useAudio } from '../context/AudioContext';
import styles from './GameLayout.module.css';

export default function GameLayout({ child, game, minutesLeftToday, isPremium, progressToNextLevel, children }) {
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const { speak, playClick } = useAudio();

  // Speak game title as an audio instruction when game loads
  useEffect(() => {
    if (game?.title) {
      const t = setTimeout(() => speak(`Let's play ${game.title}!`), 600);
      return () => clearTimeout(t);
    }
  }, [game?.title, speak]);

  const handleHint = () => {
    if (!game || hintLoading) return;
    playClick();
    setHintLoading(true);
    setHint(null);
    aiApi.hint(game.title, '', null, null, child?.age)
      .then(({ hint: h }) => {
        setHint(h || 'Keep trying!');
        speak(h || 'Keep trying!');
      })
      .catch(() => {
        setHint('You can do it!');
        speak('You can do it!');
      })
      .finally(() => setHintLoading(false));
  };
  const pct = progressToNextLevel != null ? Math.min(1, progressToNextLevel) : null;
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <Link to="/games" className={styles.back}>← Back to games</Link>
        <div className={styles.meta}>
          <span className={styles.childName}>{child?.name}</span>
          <span className={styles.level}>Level {child?.level ?? 1}</span>
          {pct != null && (
            <div className={styles.levelBar}>
              <div className={styles.levelBarFill} style={{ width: `${pct * 100}%` }} />
            </div>
          )}
          <span className={styles.xp}>⭐ {child?.xp ?? 0} XP</span>
          <span className={styles.coins}>🪙 {child?.coins ?? 0}</span>
          {!isPremium && minutesLeftToday !== undefined && (
            <span className={styles.timeLeft}>
              {minutesLeftToday > 0 ? `${Math.floor(minutesLeftToday)} min left today` : 'No time left today'}
            </span>
          )}
        </div>
      </header>
      {game && (
        <div className={styles.gameHeader}>
          <div className={styles.gameHeaderTop}>
            <Mascot message={`Let's play ${game.title}!`} mood="happy" />
            <button type="button" onClick={handleHint} disabled={hintLoading} className={styles.hintBtn}>
              {hintLoading ? '…' : '💡 Hint'}
            </button>
          </div>
          <h1 className={styles.gameTitle}>{game.title}</h1>
        </div>
      )}
      {hint && <p className={styles.hintText}>{hint}</p>}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
