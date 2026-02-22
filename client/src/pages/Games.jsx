import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChildMode } from '../context/ChildModeContext';
import { useAudio } from '../context/AudioContext';
import { games as gamesApi, children as childrenApi, ai as aiApi, challenges as challengesApi } from '../api/client';
import DailyTasks from '../components/DailyTasks';
import PersonalMascot from '../components/PersonalMascot';
import styles from './Games.module.css';

const CATEGORY_LABELS = {
  cognitive: '🧠 Cognitive',
  literacy: '🔤 Literacy',
  numeracy: '🔢 Numeracy',
  creativity: '🎨 Creativity',
  sel: '😊 Social & Emotional',
  future_skills: '💻 Future Skills',
  motor: '🏃 Motor Skills',
  auditory: '🔊 Auditory',
};

const CATEGORY_IMAGES = {
  cognitive: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9e0.svg',
  literacy: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4da.svg',
  numeracy: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ca.svg',
  creativity: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3a8.svg',
  sel: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2764.svg',
  future_skills: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4bb.svg',
  motor: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/270f.svg',
  auditory: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3b5.svg',
};

const DIFFICULTY_BADGE = {
  easy: { label: 'Easy', color: '#4ade80' },
  medium: { label: 'Medium', color: '#fbbf24' },
  hard: { label: 'Hard', color: '#f87171' },
};

// Best interactive games for kids — featured first
const FEATURED_SLUGS = new Set([
  'counting-adventure', 'shape-match-quest', 'animal-quiz', 'tap-the-color',
  'digital-coloring-book', 'memory-flip-arena', 'balloon-pop', 'sound-safari',
  'fill-missing-letter', 'addition-island', 'odd-one-out', 'trace-letters',
  'letter-sound-match', 'picture-word-match', 'emotion-detective', 'color-mixing',
  'logic-grid-junior',
]);

// Card accent colors per category
const CATEGORY_ACCENTS = {
  cognitive: ['#38bdf8', '#818cf8'],
  literacy: ['#f472b6', '#a78bfa'],
  numeracy: ['#fbbf24', '#fb923c'],
  creativity: ['#4ade80', '#38bdf8'],
  sel: ['#f9a8d4', '#c084fc'],
  future_skills: ['#818cf8', '#38bdf8'],
  motor: ['#fb923c', '#ef4444'],
  auditory: ['#38bdf8', '#4ade80'],
};

export default function Games() {
  const { user } = useAuth();
  const { isAdultMode, exitAdultMode } = useChildMode();
  const navigate = useNavigate();
  const { playClick } = useAudio();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlChildId = searchParams.get('child');
  const [allGames, setAllGames] = useState([]);
  const [childList, setChildList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [bestOnly, setBestOnly] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null);

  const selectedChildId = urlChildId || (childList.length > 0 ? childList[0]._id : null);
  const selectedChild = childList.find(c => c._id === selectedChildId) || null;

  // Games are only playable in Child Mode — parent must switch first
  if (isAdultMode) {
    return (
      <div className={styles.page}>
        <div className={styles.parentModeBlock}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f46a.svg" alt="" className={styles.parentModeImg} />
          <h1 className={styles.parentModeTitle}>Parent Mode</h1>
          <p className={styles.parentModeText}>
            Games are only available in Child Mode. Switch to let your child play and learn!
          </p>
          <button
            type="button"
            onClick={() => {
              exitAdultMode();
              navigate(childList.length > 0 ? `/games?child=${childList[0]._id}` : '/games');
            }}
            className={styles.parentModeBtn}
          >
            👶 Switch to Child Mode
          </button>
          <Link to="/dashboard" className={styles.parentModeBack}>← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!urlChildId && childList.length > 0) {
      setSearchParams({ child: childList[0]._id }, { replace: true });
    }
  }, [childList, urlChildId, setSearchParams]);

  useEffect(() => {
    if (selectedChildId) {
      aiApi.recommendation(selectedChildId)
        .then(({ recommendedSlug, game }) => setAiRecommendation(game || { slug: recommendedSlug, title: recommendedSlug }))
        .catch(() => setAiRecommendation(null));
    } else {
      setAiRecommendation(null);
    }
  }, [selectedChildId]);

  useEffect(() => {
    Promise.all([gamesApi.list(), childrenApi.list(), challengesApi.daily()])
      .then(([gamesRes, childrenRes, challengeRes]) => {
        setAllGames(gamesRes.games || []);
        setChildList(childrenRes.children || []);
        setDailyChallenge(challengeRes.challenge || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isPremium = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trial';

  const { featuredGames, otherGames } = useMemo(() => {
    const bySlug = new Map();
    allGames.forEach((g) => { if (g?.slug && !bySlug.has(g.slug)) bySlug.set(g.slug, g); });
    let list = Array.from(bySlug.values());
    if (filter) list = list.filter((g) => g.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((g) => g.title.toLowerCase().includes(q) || g.category.includes(q));
    }
    const featured = list.filter((g) => FEATURED_SLUGS.has(g.slug));
    const other = list.filter((g) => !FEATURED_SLUGS.has(g.slug));
    return { featuredGames: featured, otherGames: bestOnly ? [] : other };
  }, [allGames, filter, search, bestOnly]);

  function handleChildChange(e) {
    const id = e.target.value;
    if (id) setSearchParams({ child: id });
  }

  function renderGameCard(game) {
    const locked = game.isPremium && !isPremium;
    const catImg = CATEGORY_IMAGES[game.category] || CATEGORY_IMAGES.cognitive;
    const diff = DIFFICULTY_BADGE[game.difficulty] || DIFFICULTY_BADGE.easy;
    const isChallenge = dailyChallenge?.game?.slug === game.slug;
    const accent = CATEGORY_ACCENTS[game.category] || ['#38bdf8', '#818cf8'];
    return (
      <div
        key={game._id}
        className={`${styles.card} ${locked ? styles.cardLocked : ''} ${isChallenge ? styles.cardChallenge : ''}`}
      >
        {isChallenge && <div className={styles.challengeBadge}>🏆 Daily</div>}
        <div className={styles.cardStrip} style={{ background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})` }} />
        <div className={styles.cardBody}>
          <div className={styles.cardTop}>
            {locked ? (
              <span className={styles.cardLockIcon}>🔒</span>
            ) : (
              <img src={catImg} alt="" className={styles.cardImg} />
            )}
            <span className={styles.diffBadge} style={{ background: `${diff.color}22`, color: diff.color }}>
              {diff.label}
            </span>
          </div>
          <h3 className={styles.cardTitle}>{game.title}</h3>
          {game.description && (
            <p className={styles.cardDesc}>{game.description}</p>
          )}
          <span className={styles.cardCategory}>
            {CATEGORY_LABELS[game.category] || game.category}
          </span>
          <span className={styles.cardLevels}>30 Levels</span>
          {locked ? (
            <Link to="/subscription" className={styles.lockedBtn}>
              🔒 Premium
            </Link>
          ) : (
                    <Link
                      to={selectedChildId ? `/play/${game.slug}?child=${selectedChildId}` : '#'}
                      className={styles.playBtn}
                      onClick={(e) => {
                        if (!selectedChildId) e.preventDefault();
                        else playClick();
                      }}
                    >
                      {selectedChildId ? '▶ Play Now' : (childList.length === 0 ? 'Add child to play' : 'Select child')}
                    </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Child Mode welcome — games only playable here */}
      <div className={styles.childWelcome}>
        <h1 className={styles.childWelcomeTitle}>
          Hi{selectedChild ? ` ${selectedChild.name}` : ''}! 👋
        </h1>
        <p className={styles.childWelcomeSub}>
          Pick a game and have fun learning! Your progress is saved.
        </p>
      </div>

      <div className={styles.pageHeader}>
        <img src="/logo.png" alt="EduQuestJr" className={styles.headerLogo} />
        <div>
          <h1 className={styles.title}>Let&apos;s Play!</h1>
          <p className={styles.subtitle}>
            {featuredGames.length + otherGames.length} games · Pick one and start learning!
          </p>
        </div>
      </div>

      {/* Child selector */}
      {childList.length > 0 && (
        <div className={styles.childBanner}>
          <div className={styles.childBannerLeft}>
            <span className={styles.childBannerAvatar}>{selectedChild?.avatarConfig?.emoji || '👤'}</span>
            <div>
              <span className={styles.childBannerName}>Playing as {selectedChild?.name || 'Select child'}</span>
              {selectedChild && (
                <span className={styles.childBannerMeta}>Level {selectedChild.level} · ⭐ {selectedChild.xp || 0} XP · 🪙 {selectedChild.coins || 0}</span>
              )}
            </div>
          </div>
          {childList.length > 1 && (
            <select
              value={selectedChildId || ''}
              onChange={handleChildChange}
              className={styles.childSelect}
            >
              {childList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} (Level {c.level})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {childList.length === 0 && !loading && (
        <div className={styles.noChildBanner}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9d2.svg" alt="" className={styles.noChildImg} />
          <div>
            <strong>Add a child to play</strong>
            <p>Games save progress to a child&apos;s profile. Add a child from the Dashboard to start playing.</p>
            <Link to="/dashboard" className={styles.noChildBtn}>
              {isAdultMode ? 'Add Child Profile' : 'Go to Parent Setup'}
            </Link>
          </div>
        </div>
      )}

      {selectedChildId && selectedChild && (
        <PersonalMascot child={selectedChild} compact />
      )}

      {dailyChallenge && selectedChildId && (
        <Link
          to={`/play/${dailyChallenge.game.slug}?child=${selectedChildId}`}
          className={styles.dailyChallenge}
          onClick={() => playClick()}
        >
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3c6.svg" alt="" className={styles.challengeImg} />
          <div className={styles.challengeInfo}>
            <span className={styles.challengeLabel}>{dailyChallenge.label}</span>
            <span className={styles.challengeGame}>{dailyChallenge.game.title}</span>
          </div>
          <span className={styles.challengeArrow}>→</span>
        </Link>
      )}

      {selectedChildId && <DailyTasks childId={selectedChildId} />}

      {aiRecommendation && selectedChildId && (
        <Link
          to={`/play/${aiRecommendation.slug}?child=${selectedChildId}`}
          className={styles.aiRecommendation}
          onClick={() => playClick()}
        >
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg" alt="Buddy" className={styles.aiRecImg} />
          <span className={styles.aiLabel}>Buddy suggests:</span>
          <span className={styles.aiGame}>{aiRecommendation.title}</span>
          <span className={styles.challengeArrow}>→</span>
        </Link>
      )}

      {/* Search + Filters */}
      <div className={styles.toolBar}>
        <input
          type="search"
          placeholder="🔍 Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.filters}>
          <button
            type="button"
            onClick={() => setFilter('')}
            className={filter === '' ? styles.filterActive : styles.filterBtn}
          >
            All ({featuredGames.length + otherGames.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const count = allGames.filter(g => g.category === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={filter === key ? styles.filterActive : styles.filterBtn}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="loading-screen">Loading games...</div>
      ) : featuredGames.length === 0 && otherGames.length === 0 ? (
        <div className={styles.empty}>
          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3ae.svg" alt="" style={{ width: 48, opacity: 0.5 }} />
          <p>No games found. Try a different filter or search.</p>
        </div>
      ) : (
        <>
          {featuredGames.length > 0 && (
            <section className={styles.featuredSection}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <h2 className={styles.featuredTitle}>
                  <span className={styles.featuredStar}>⭐</span> Best Games for Kids
                </h2>
                <button
                  type="button"
                  onClick={() => setBestOnly(!bestOnly)}
                  style={{
                    fontSize: '0.85rem', fontWeight: 700, padding: '0.4rem 0.8rem',
                    borderRadius: 999, border: '2px solid rgba(56,189,248,0.3)',
                    background: bestOnly ? 'rgba(56,189,248,0.1)' : 'transparent',
                    color: 'var(--primary)', cursor: 'pointer',
                  }}
                >
                  {bestOnly ? 'Show all games' : 'Best only'}
                </button>
              </div>
              <div className={styles.grid}>
                {featuredGames.map((game) => renderGameCard(game))}
              </div>
            </section>
          )}
          {otherGames.length > 0 && (
            <section className={styles.otherSection}>
              {featuredGames.length > 0 && (
                <h2 className={styles.otherTitle}>More Games</h2>
              )}
              <div className={styles.grid}>
                {otherGames.map((game) => renderGameCard(game))}
              </div>
            </section>
          )}
        </>
      )}

    </div>
  );
}
