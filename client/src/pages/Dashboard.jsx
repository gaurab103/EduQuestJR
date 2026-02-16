import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChildMode } from '../context/ChildModeContext';
import { children as childrenApi, progress as progressApi, challenges as challengesApi, ai as aiApi } from '../api/client';
import AvatarPicker from '../components/AvatarPicker';
import DailyTasks from '../components/DailyTasks';
import styles from './Dashboard.module.css';

// Animated counter: counts up from 0 to target value
function AnimatedCountUp({ value, duration = 800, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  useEffect(() => {
    const start = prevValue.current;
    const end = typeof value === 'number' ? value : parseInt(value, 10) || 0;
    if (start === end) return;
    prevValue.current = end;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 2;
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <>{display}{suffix}</>;
}

// Daily motivational quotes (rotate by day of year)
const DAILY_QUOTES = [
  "Every small step builds a brighter future.",
  "Learning is an adventure—enjoy the journey!",
  "Mistakes are proof you're trying. Keep going!",
  "Today's effort shapes tomorrow's success.",
  "Curiosity is the spark that lights up learning.",
  "You're capable of more than you know.",
];
function getDailyQuote() {
  const day = Math.floor(Date.now() / 86400000) % DAILY_QUOTES.length;
  return DAILY_QUOTES[day];
}

// Category images for game cards
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

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdultMode, enterAdultMode } = useChildMode();
  const [childList, setChildList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState(4);
  const [newAvatar, setNewAvatar] = useState('🐻');
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedChildForTasks, setSelectedChildForTasks] = useState(null);
  const [aiTip, setAiTip] = useState('');

  useEffect(() => {
    childrenApi
      .list()
      .then(({ children }) => {
        setChildList(children);
        if (children.length > 0) {
          setSelectedChildForTasks(children[0]._id);
          Promise.all(children.map(c => progressApi.listByChild(c._id).catch(() => ({ progress: [] }))))
            .then(results => {
              const all = results.flatMap(r => r.progress || []);
              all.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
              setRecentActivity(all.slice(0, 8));
            });
          aiApi.encouragement({ childName: 'parent', childAge: 0, level: 0, streak: 0, recentAccuracy: 0 })
            .then(res => setAiTip(res.message))
            .catch(() => {});
        }
      })
      .catch(() => setChildList([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddChild(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    setAddError('');
    try {
      const { child } = await childrenApi.create({
        name: newName.trim(),
        age: newAge,
        avatarConfig: { emoji: newAvatar },
      });
      setChildList((prev) => [child, ...prev]);
      setNewName('');
      setNewAvatar('🐻');
      setShowAdd(false);
      if (!selectedChildForTasks) setSelectedChildForTasks(child._id);
    } catch (err) {
      setAddError(err.message || 'Failed to add child. Please try again.');
    }
    setSubmitting(false);
  }

  const isPremium = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trial';

  // Smart routing for child mode:
  // - While loading, show loading screen (don't redirect yet)
  // - After loading: if children exist → redirect to games
  // - After loading: if NO children → show onboarding setup (don't redirect)
  if (!isAdultMode) {
    if (loading) {
      return (
        <div className={styles.dashboard}>
          <div className={styles.loadingShimmer} style={{ height: '200px', borderRadius: '1rem' }} />
        </div>
      );
    }
    if (childList.length > 0) {
      return <Navigate to="/games" replace />;
    }
    // No children — show onboarding setup screen
    return (
      <div className={styles.dashboard}>
        <div className={styles.onboardingScreen}>
          <img src="/logo.png" alt="EduQuestJr" className={styles.onboardingLogo} />
          <h1 className={styles.onboardingTitle}>Welcome to EduQuestJr!</h1>
          <p className={styles.onboardingSub}>
            Before your child can play, a parent needs to set up their profile first.
          </p>

          <div className={styles.onboardingSteps}>
            <div className={styles.onboardingStep}>
              <span className={styles.onboardingStepNum}>1</span>
              <div>
                <strong>Parent sets up profile</strong>
                <p>Add your child's name, age, and avatar</p>
              </div>
            </div>
            <div className={styles.onboardingStep}>
              <span className={styles.onboardingStepNum}>2</span>
              <div>
                <strong>Child starts playing</strong>
                <p>70+ fun educational games await!</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => enterAdultMode('1234')}
            className={styles.onboardingBtn}
          >
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f469-200d-1f4bb.svg" alt="" style={{ width: 24, height: 24 }} />
            Parent Setup
          </button>

          <p className={styles.onboardingHint}>
            Default parent PIN: <strong>1234</strong> (you can change it in Settings)
          </p>
        </div>
      </div>
    );
  }

  const totalXp = childList.reduce((sum, c) => sum + (c.xp || 0), 0);
  const totalCoins = childList.reduce((sum, c) => sum + (c.coins || 0), 0);
  const bestStreak = Math.max(0, ...childList.map(c => c.currentStreak || 0));
  const totalGames = recentActivity.length;
  const avgAccuracy = totalGames > 0 ? Math.round(recentActivity.reduce((s, p) => s + (p.accuracy || 0), 0) / totalGames) : 0;
  const highestLevel = Math.max(1, ...childList.map(c => c.level || 1));

  const today = new Date().toDateString();
  const todayActivity = recentActivity.filter(p => new Date(p.completedAt).toDateString() === today);
  const gamesPlayedToday = todayActivity.length;
  const timeSpentTodayMinutes = Math.round(gamesPlayedToday * 2.5);
  const bestAccuracyToday = todayActivity.length > 0 ? Math.max(...todayActivity.map(p => p.accuracy || 0)) : 0;

  const getTimeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={styles.dashboard}>
      {/* Welcome banner with logo */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeLeft}>
          <div className={styles.welcomeRow}>
            <img src="/logo.png" alt="EduQuestJr" className={styles.welcomeLogo} />
          </div>
          <h1 className={styles.welcomeTitle}>{getTimeOfDay()}, {user?.name || 'there'}!</h1>
          <p className={styles.welcomeSubtitle}>
            {childList.length === 0
              ? "Let's set up your first child profile to get started."
              : `Managing ${childList.length} learner${childList.length > 1 ? 's' : ''}. Keep up the great work!`}
          </p>
          {aiTip && (
            <div className={styles.aiTipBanner}>
              <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg" alt="Buddy" className={styles.aiTipImg} />
              <span className={styles.aiTipText}>{aiTip}</span>
            </div>
          )}
        </div>
        <div className={styles.welcomeRight}>
          <div className={styles.planBadge}>
            {isPremium ? (
              <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3c5.svg" alt="" className={styles.planImg} />
            ) : (
              <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ca.svg" alt="" className={styles.planImg} />
            )}
            <div>
              <strong>{isPremium ? 'Premium' : 'Free Plan'}</strong>
              {!isPremium && <Link to="/subscription" className={styles.upgradeLink}>Upgrade</Link>}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Highlights */}
      {childList.length > 0 && (
        <div className={styles.todayHighlights}>
          <h2 className={styles.todayHighlightsTitle}>Today's Highlights</h2>
          <div className={styles.todayHighlightsRow}>
            <div className={styles.todayHighlightCard}>
              <span className={styles.todayHighlightValue}><AnimatedCountUp value={gamesPlayedToday} /></span>
              <span className={styles.todayHighlightLabel}>Games played today</span>
            </div>
            <div className={styles.todayHighlightCard}>
              <span className={styles.todayHighlightValue}><AnimatedCountUp value={timeSpentTodayMinutes} suffix=" min" /></span>
              <span className={styles.todayHighlightLabel}>Time spent learning</span>
            </div>
            <div className={styles.todayHighlightCard}>
              <span className={styles.todayHighlightValue}><AnimatedCountUp value={bestAccuracyToday} suffix="%" /></span>
              <span className={styles.todayHighlightLabel}>Best accuracy today</span>
            </div>
          </div>
        </div>
      )}

      {/* Daily motivational quote */}
      {childList.length > 0 && (
        <div className={styles.dailyQuote}>
          <span className={styles.dailyQuoteIcon}>💡</span>
          <span className={styles.dailyQuoteText}>{aiTip || getDailyQuote()}</span>
        </div>
      )}

      {/* Overview stats with animated counters */}
      {childList.length > 0 && (
        <div className={styles.overviewGrid}>
          <div className={styles.overviewCard} style={{ '--card-accent': '#38bdf8' }}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f46a.svg" alt="" className={styles.overviewImg} />
            <span className={styles.overviewValue}><AnimatedCountUp value={childList.length} /></span>
            <span className={styles.overviewLabel}>Children</span>
          </div>
          <div className={styles.overviewCard} style={{ '--card-accent': '#fbbf24' }}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3af.svg" alt="" className={styles.overviewImg} />
            <span className={styles.overviewValue}><AnimatedCountUp value={totalXp} duration={1000} /></span>
            <span className={styles.overviewLabel}>Total XP</span>
          </div>
          <div className={styles.overviewCard} style={{ '--card-accent': '#fb923c' }}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4b0.svg" alt="" className={styles.overviewImg} />
            <span className={styles.overviewValue}><AnimatedCountUp value={totalCoins} duration={1000} /></span>
            <span className={styles.overviewLabel}>Coins</span>
          </div>
          <div className={styles.overviewCard} style={{ '--card-accent': '#f472b6' }}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f525.svg" alt="" className={styles.overviewImg} />
            <span className={styles.overviewValue}><AnimatedCountUp value={bestStreak} /></span>
            <span className={styles.overviewLabel}>Best Streak</span>
          </div>
          <div className={styles.overviewCard} style={{ '--card-accent': '#4ade80' }}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4da.svg" alt="" className={styles.overviewImg} />
            <span className={styles.overviewValue}><AnimatedCountUp value={avgAccuracy} suffix="%" /></span>
            <span className={styles.overviewLabel}>Accuracy</span>
          </div>
          <div className={styles.overviewCard} style={{ '--card-accent': '#a78bfa' }}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3c5.svg" alt="" className={styles.overviewImg} />
            <span className={styles.overviewValue}>Lv <AnimatedCountUp value={highestLevel} /></span>
            <span className={styles.overviewLabel}>Highest</span>
          </div>
        </div>
      )}

      {/* Daily Tasks */}
      {selectedChildForTasks && childList.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Today's Quests</h2>
            {childList.length > 1 && (
              <select
                value={selectedChildForTasks}
                onChange={(e) => setSelectedChildForTasks(e.target.value)}
                className={styles.miniSelect}
              >
                {childList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <DailyTasks childId={selectedChildForTasks} />
        </section>
      )}

      {/* Child profiles — kid-friendly cards */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Child Profiles</h2>
          {!showAdd && childList.length > 0 && (
            <button type="button" onClick={() => setShowAdd(true)} className={styles.addBtn}>
              + Add Child
            </button>
          )}
        </div>

        {loading ? (
          <div className={styles.loadingShimmer} style={{ minHeight: '120px' }}>Loading...</div>
        ) : (
          <>
            <div className={styles.childGrid}>
              {childList.map((c, idx) => {
                const xpPct = Math.min(100, (c.xp || 0) % 100);
                const achievements = (c.achievements || []).length;
                const stickers = (c.ownedStickers || []).length;
                const levelsCompleted = (c.completedGameLevels || []).length;
                const progressRingPct = Math.min(100, (xpPct + (levelsCompleted * 5)) % 100);
                return (
                  <div key={c._id} className={styles.childCard} style={{ animationDelay: `${idx * 0.08}s` }}>
                    <Link to={`/child/${c._id}`} className={styles.childCardLink}>
                      {/* Colorful header with progress ring */}
                      <div className={styles.childCardHeader}>
                        <div className={styles.childAvatarWrap} style={{ '--progress-pct': progressRingPct }}>
                          <span className={styles.childAvatar}>{c.avatarConfig?.emoji || '👤'}</span>
                        </div>
                        <div className={styles.childInfo}>
                          <span className={styles.childName}>{c.name}</span>
                          <span className={styles.childMeta}>Age {c.age} · Level {c.level}</span>
                        </div>
                        {(c.currentStreak || 0) > 0 && (
                          <span className={styles.streakBadge}>🔥 {c.currentStreak}</span>
                        )}
                      </div>
                      {/* Stats as icon bubbles */}
                      <div className={styles.childStatsRow}>
                        <div className={styles.childStatBubble}>
                          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3af.svg" alt="" className={styles.statMiniImg} />
                          <span>{c.xp || 0}</span>
                        </div>
                        <div className={styles.childStatBubble}>
                          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4b0.svg" alt="" className={styles.statMiniImg} />
                          <span>{c.coins || 0}</span>
                        </div>
                        <div className={styles.childStatBubble}>
                          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4da.svg" alt="" className={styles.statMiniImg} />
                          <span>{achievements}</span>
                        </div>
                        <div className={styles.childStatBubble}>
                          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f48e.svg" alt="" className={styles.statMiniImg} />
                          <span>{stickers}</span>
                        </div>
                        <div className={styles.childStatBubble}>
                          <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3c5.svg" alt="" className={styles.statMiniImg} />
                          <span>{levelsCompleted}</span>
                        </div>
                      </div>
                      {/* XP progress */}
                      <div className={styles.xpBarOuter}>
                        <div className={styles.xpBarInner} style={{ width: `${xpPct}%` }} />
                      </div>
                      <span className={styles.xpBarLabel}>{xpPct}% to Level {(c.level || 1) + 1}</span>
                    </Link>
                    {/* Action buttons */}
                    <div className={styles.childActions}>
                      <Link to={`/games?child=${c._id}`} className={styles.childActionPrimary}>
                        <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3ae.svg" alt="" className={styles.actionBtnImg} />
                        Start Learning
                      </Link>
                      <Link to={`/analytics/${c._id}`} className={styles.childActionBtn}>
                        📊
                      </Link>
                      <Link to={`/shop?child=${c._id}`} className={styles.childActionBtn}>
                        <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f48e.svg" alt="" className={styles.actionBtnImg} />
                      </Link>
                      <Link to={`/child/${c._id}`} className={styles.childActionBtn}>
                        👤
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {childList.length === 0 && !showAdd && (
              <div className={styles.emptyState}>
                <img src="/logo.png" alt="" className={styles.emptyLogo} />
                <h3>Welcome to EduQuestJr!</h3>
                <p>Add your first child to start their learning adventure!</p>
                <button type="button" onClick={() => setShowAdd(true)} className={styles.emptyAddBtn}>
                  + Add Your First Child
                </button>
              </div>
            )}

            {/* Add child form */}
            {showAdd && (
              <div className={styles.addForm}>
                <h3 className={styles.addFormTitle}>Add a New Learner</h3>
                <p className={styles.addLabel}>Choose an avatar:</p>
                <AvatarPicker value={newAvatar} onChange={setNewAvatar} size="small" />
                <form onSubmit={handleAddChild} className={styles.addFormFields}>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Child's name"
                    className={styles.addInput}
                    required
                    autoFocus
                  />
                  <select
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className={styles.addSelect}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>Age {n}</option>
                    ))}
                  </select>
                  {addError && <p className={styles.addError}>{addError}</p>}
                  <div className={styles.addActions}>
                    <button type="submit" disabled={submitting} className={styles.addSubmit}>
                      {submitting ? 'Adding...' : 'Add Child'}
                    </button>
                    <button type="button" onClick={() => { setShowAdd(false); setAddError(''); }} className={styles.addCancel}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </section>

      {/* Learning Insights - Skills Breakdown */}
      {recentActivity.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Learning Insights</h2>
          <div className={styles.insightsRow}>
            {/* Skill bars */}
            <div className={styles.skillsCard}>
              <h3 className={styles.skillsTitle}>
                <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4da.svg" alt="" className={styles.skillsTitleImg} />
                Skills Breakdown
              </h3>
              {(() => {
                const catCounts = {};
                const catAccuracy = {};
                recentActivity.forEach(p => {
                  const cat = p.gameId?.category || 'other';
                  catCounts[cat] = (catCounts[cat] || 0) + 1;
                  catAccuracy[cat] = catAccuracy[cat] || [];
                  catAccuracy[cat].push(p.accuracy || 0);
                });
                const SKILL_COLORS = {
                  cognitive: '#38bdf8', literacy: '#a78bfa', numeracy: '#fbbf24',
                  creativity: '#f472b6', sel: '#4ade80', motor: '#fb923c',
                  future_skills: '#818cf8', auditory: '#ef4444',
                };
                const SKILL_LABELS = {
                  cognitive: 'Thinking', literacy: 'Reading', numeracy: 'Math',
                  creativity: 'Creativity', sel: 'Emotions', motor: 'Motor',
                  future_skills: 'Coding', auditory: 'Listening',
                };
                const maxCount = Math.max(1, ...Object.values(catCounts));
                return Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                  const avg = Math.round(catAccuracy[cat].reduce((s, v) => s + v, 0) / catAccuracy[cat].length);
                  return (
                    <div key={cat} className={styles.skillRow}>
                      <div className={styles.skillLabel}>
                        <img src={CATEGORY_IMAGES[cat] || CATEGORY_IMAGES.cognitive} alt="" className={styles.skillIcon} />
                        <span>{SKILL_LABELS[cat] || cat}</span>
                      </div>
                      <div className={styles.skillBarOuter}>
                        <div className={styles.skillBarInner}
                          style={{ '--bar-width': `${(count / maxCount) * 100}%`, background: SKILL_COLORS[cat] || '#94a3b8' }} />
                      </div>
                      <span className={styles.skillAcc} style={{
                        color: avg >= 80 ? '#16a34a' : avg >= 50 ? '#d97706' : '#94a3b8'
                      }}>{avg}%</span>
                    </div>
                  );
                });
              })()}
            </div>
            {/* Weekly summary */}
            <div className={styles.weeklySummaryCard}>
              <h3 className={styles.skillsTitle}>
                <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9e0.svg" alt="" className={styles.skillsTitleImg} />
                This Week
              </h3>
              <div className={styles.weeklyStats}>
                <div className={styles.weeklyStat}>
                  <span className={styles.weeklyStatValue}>{recentActivity.length}</span>
                  <span className={styles.weeklyStatLabel}>Games Played</span>
                </div>
                <div className={styles.weeklyStat}>
                  <span className={styles.weeklyStatValue}>{avgAccuracy}%</span>
                  <span className={styles.weeklyStatLabel}>Avg Accuracy</span>
                </div>
                <div className={styles.weeklyStat}>
                  <span className={styles.weeklyStatValue}>{totalXp}</span>
                  <span className={styles.weeklyStatLabel}>Total XP</span>
                </div>
              </div>
              {/* Top performer */}
              {childList.length > 1 && (() => {
                const top = childList.reduce((a, b) => (a.xp || 0) > (b.xp || 0) ? a : b, childList[0]);
                return (
                  <div className={styles.topPerformer}>
                    <span className={styles.topPerformerEmoji}>{top.avatarConfig?.emoji || '🌟'}</span>
                    <div>
                      <strong>{top.name}</strong>
                      <span className={styles.topPerformerLabel}> is leading with {top.xp || 0} XP!</span>
                    </div>
                  </div>
                );
              })()}
              {/* Suggestion */}
              <div className={styles.suggestion}>
                <span>💡</span>
                <span>
                  {avgAccuracy >= 80 ? 'Great progress! Try increasing difficulty levels.' :
                    avgAccuracy >= 50 ? 'Good effort! Practice makes perfect.' :
                      'Keep encouraging! Regular play builds confidence.'}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Activity with game images */}
      {recentActivity.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <div className={styles.activityList}>
            {recentActivity.map((p, idx) => {
              const catImg = CATEGORY_IMAGES[p.gameId?.category] || CATEGORY_IMAGES.cognitive;
              return (
                <div key={p._id} className={styles.activityItem} data-alt={idx % 2 === 1}>
                  <img src={catImg} alt="" className={styles.activityGameImg} />
                  <div className={styles.activityInfo}>
                    <span className={styles.activityGame}>{p.gameId?.title || 'Game'}</span>
                    <span className={styles.activityMeta}>
                      Score {p.score} · Lv {p.level || 1} · {new Date(p.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={styles.activityAccBadge} style={{
                    background: p.accuracy >= 80 ? 'rgba(74,222,128,0.15)' : p.accuracy >= 50 ? 'rgba(251,191,36,0.15)' : 'rgba(0,0,0,0.05)',
                    color: p.accuracy >= 80 ? '#16a34a' : p.accuracy >= 50 ? '#d97706' : '#94a3b8',
                  }}>
                    {p.accuracy}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Actions with real images */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickActions}>
          <Link to="/games" className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)' }}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3ae.svg" alt="" className={styles.actionCardImg} />
            <span className={styles.actionLabel}>Play Games</span>
          </Link>
          <Link to="/map" className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #4ade80, #38bdf8)' }}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f30d.svg" alt="" className={styles.actionCardImg} />
            <span className={styles.actionLabel}>Adventure Map</span>
          </Link>
          <Link to="/shop" className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #fbbf24, #fb923c)' }}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f381.svg" alt="" className={styles.actionCardImg} />
            <span className={styles.actionLabel}>Sticker Shop</span>
          </Link>
          <Link to="/subscription" className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #a78bfa, #f472b6)' }}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3c5.svg" alt="" className={styles.actionCardImg} />
            <span className={styles.actionLabel}>Premium</span>
          </Link>
          <Link to="/settings" className={styles.actionCard} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ca.svg" alt="" className={styles.actionCardImg} />
            <span className={styles.actionLabel}>Settings</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
