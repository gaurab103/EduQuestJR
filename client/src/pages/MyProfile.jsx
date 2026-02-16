/**
 * Kid-friendly self-view profile page.
 * Shows in child mode - first child of the logged-in user.
 * Big, colorful, cartoon-style with Buddy chat integration.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { children as childrenApi, progress as progressApi, stickers as stickersApi, ai as aiApi } from '../api/client';
import { useAudio } from '../context/AudioContext';
import styles from './MyProfile.module.css';

export default function MyProfile() {
  const navigate = useNavigate();
  const { speak, playCelebration } = useAudio();
  const [child, setChild] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [allStickers, setAllStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiGreeting, setAiGreeting] = useState('');

  useEffect(() => {
    childrenApi.list().then(async (res) => {
      const c = res.children?.[0];
      if (!c) { setLoading(false); return; }
      setChild(c);

      const [progressRes, stickersRes] = await Promise.all([
        progressApi.listByChild(c._id),
        stickersApi.list(),
      ]);
      setRecentGames((progressRes.progress || []).slice(0, 5));
      setAllStickers(stickersRes.stickers || []);

      // AI greeting
      const recentAcc = progressRes.progress?.length > 0
        ? Math.round(progressRes.progress.slice(0, 5).reduce((s, p) => s + p.accuracy, 0) / Math.min(5, progressRes.progress.length))
        : 0;
      aiApi.encouragement({
        childName: c.name,
        childAge: c.age,
        level: c.level,
        streak: c.currentStreak || 0,
        recentAccuracy: recentAcc,
      }).then(res => {
        setAiGreeting(res.message);
        speak(res.message);
      }).catch(() => {});
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Loading your profile...</div>;
  if (!child) return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <p style={{ fontSize: '1.2rem' }}>No profile found!</p>
      <Link to="/dashboard">Go to Dashboard</Link>
    </div>
  );

  const equippedStickers = (child.equippedStickers || [])
    .map(slug => allStickers.find(s => s.slug === slug))
    .filter(Boolean);
  const ownedCount = (child.ownedStickers || []).length;
  const badgeCount = (child.achievements || []).length;
  const levelsCompleted = (child.completedGameLevels || []).length;

  return (
    <div className={styles.page}>
      {/* Big colorful profile header */}
      <div className={styles.heroCard}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.avatarBig}>{child.avatarConfig?.emoji || '🐻'}</div>
          <h1 className={styles.heroName}>{child.name}</h1>
          <div className={styles.heroLevel}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3af.svg" alt="" className={styles.heroLevelImg} />
            Level {child.level}
          </div>

          {/* Equipped stickers */}
          {equippedStickers.length > 0 && (
            <div className={styles.equippedRow}>
              {equippedStickers.map(s => (
                <span key={s.slug} className={styles.equippedSticker}>
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.name} className={styles.equippedImg} />
                  ) : s.emoji}
                </span>
              ))}
            </div>
          )}

          {(child.currentStreak || 0) > 0 && (
            <div className={styles.streakBadge}>🔥 {child.currentStreak} day streak!</div>
          )}
        </div>
      </div>

      {/* AI Buddy Greeting */}
      {aiGreeting && (
        <div className={styles.buddyGreeting}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg" alt="Buddy" className={styles.buddyImg} />
          <div className={styles.speechBubble}>
            <p>{aiGreeting}</p>
          </div>
        </div>
      )}

      {/* Fun Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statBubble} style={{ background: 'rgba(74, 222, 128, 0.15)', borderColor: '#4ade80' }}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3af.svg" alt="" className={styles.statBubbleImg} />
          <span className={styles.statBubbleValue}>{child.xp || 0}</span>
          <span className={styles.statBubbleLabel}>XP</span>
        </div>
        <div className={styles.statBubble} style={{ background: 'rgba(251, 191, 36, 0.15)', borderColor: '#fbbf24' }}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4b0.svg" alt="" className={styles.statBubbleImg} />
          <span className={styles.statBubbleValue}>{child.coins || 0}</span>
          <span className={styles.statBubbleLabel}>Coins</span>
        </div>
        <div className={styles.statBubble} style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8' }}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3c5.svg" alt="" className={styles.statBubbleImg} />
          <span className={styles.statBubbleValue}>{badgeCount}</span>
          <span className={styles.statBubbleLabel}>Badges</span>
        </div>
        <div className={styles.statBubble} style={{ background: 'rgba(167, 139, 250, 0.15)', borderColor: '#a78bfa' }}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f48e.svg" alt="" className={styles.statBubbleImg} />
          <span className={styles.statBubbleValue}>{ownedCount}</span>
          <span className={styles.statBubbleLabel}>Stickers</span>
        </div>
      </div>

      {/* XP Progress */}
      <div className={styles.xpSection}>
        <div className={styles.xpInfo}>
          <span>Level {child.level}</span>
          <span>Level {child.level + 1}</span>
        </div>
        <div className={styles.xpTrack}>
          <div className={styles.xpFill} style={{ width: `${Math.min(100, (child.xp || 0) % 100)}%` }} />
        </div>
      </div>

      {/* Big Fun Action Buttons */}
      <div className={styles.actionsGrid}>
        <Link to={`/games?child=${child._id}`} className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)' }}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3ae.svg" alt="" className={styles.actionImg} />
          <span>Play Games!</span>
        </Link>
        <Link to={`/shop?child=${child._id}`} className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f381.svg" alt="" className={styles.actionImg} />
          <span>Sticker Shop</span>
        </Link>
        <Link to={`/map?child=${child._id}`} className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' }}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f30d.svg" alt="" className={styles.actionImg} />
          <span>Adventure Map</span>
        </Link>
        <button
          type="button"
          onClick={() => document.querySelector('[aria-label="Talk to Buddy Bear"]')?.click()}
          className={styles.actionCard}
          style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
        >
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg" alt="" className={styles.actionImg} />
          <span>Talk to Buddy!</span>
        </button>
      </div>

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <div className={styles.recentSection}>
          <h2 className={styles.sectionTitle}>🎮 Recent Adventures</h2>
          {recentGames.map(p => (
            <div key={p._id} className={styles.recentItem}>
              <span className={styles.recentAcc} style={{
                color: (p.accuracy || 0) >= 80 ? '#4ade80' : (p.accuracy || 0) >= 50 ? '#fbbf24' : '#94a3b8',
              }}>
                {p.accuracy || 0}%
              </span>
              <span className={styles.recentTitle}>{p.gameId?.title || 'Game'}</span>
              <span className={styles.recentScore}>⭐ {p.score}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
