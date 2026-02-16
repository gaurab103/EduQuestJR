import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import styles from './Home.module.css';

const FEATURES = [
  { icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3ae.svg', title: 'Play & Learn', desc: '70+ games across 8 categories — counting, letters, shapes, emotions, motor skills, and more', color: '#38bdf8' },
  { icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9e0.svg', title: 'AI-Powered', desc: 'Smart difficulty that adapts to your child. Voice teaching explains every answer.', color: '#a78bfa' },
  { icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg', title: 'Buddy Bear', desc: 'An AI chat friend who encourages, teaches, and celebrates every win with your child', color: '#fbbf24' },
  { icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3c6.svg', title: 'Rewards System', desc: 'XP, coins, 25+ stickers, 15 badges, streaks, and daily challenges keep kids motivated', color: '#f472b6' },
  { icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ca.svg', title: 'Parent Dashboard', desc: 'Beautiful analytics with skill breakdowns, progress charts, and AI-powered insights', color: '#4ade80' },
  { icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/270f.svg', title: 'Motor & Creative', desc: 'Drawing canvas, finger tracing, handwriting, connect-the-dots — builds fine motor skills', color: '#fb923c' },
];

const CATEGORIES = [
  { img: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9e0.svg', name: 'Cognitive', color: '#38bdf8', games: 12 },
  { img: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4da.svg', name: 'Literacy', color: '#a78bfa', games: 14 },
  { img: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f522.svg', name: 'Numeracy', color: '#fb923c', games: 10 },
  { img: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3a8.svg', name: 'Creativity', color: '#f472b6', games: 6 },
  { img: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2764.svg', name: 'Social-Emotional', color: '#4ade80', games: 8 },
  { img: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4bb.svg', name: 'Future Skills', color: '#818cf8', games: 4 },
  { img: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/270f.svg', name: 'Motor Skills', color: '#fbbf24', games: 10 },
  { img: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3b5.svg', name: 'Auditory', color: '#ef4444', games: 4 },
];

const GAME_PREVIEWS = [
  { name: 'Counting Adventure', emoji: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f522.svg', color: '#38bdf8' },
  { name: 'Shape Match', emoji: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f7e6.svg', color: '#a78bfa' },
  { name: 'Memory Flip', emoji: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f0cf.svg', color: '#f472b6' },
  { name: 'Animal Quiz', emoji: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f981.svg', color: '#fbbf24' },
  { name: 'Drawing Canvas', emoji: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3a8.svg', color: '#4ade80' },
  { name: 'Spelling Bee', emoji: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f41d.svg', color: '#fb923c' },
];

const TESTIMONIALS = [
  { quote: "My daughter asks to play every day. She learned her ABCs and counting in just weeks!", author: 'Sarah M.', role: 'Mom of a 4-year-old', avatar: '👩', rating: 5 },
  { quote: "The AI chat friend is incredible — my son talks to Buddy like a real best friend. The teaching after each question is brilliant.", author: 'David K.', role: 'Dad of a 5-year-old', avatar: '👨', rating: 5 },
  { quote: "Best ECD app I've ever seen. Big buttons, gentle feedback, and the kids genuinely love collecting stickers!", author: 'Lisa T.', role: 'Kindergarten teacher', avatar: '👩‍🏫', rating: 5 },
];

function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const start = performance.now();
        const num = parseInt(end) || 0;
        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * num));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{value}{suffix}</span>;
}

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className={styles.home}>
      {/* ═══ HERO ═══ */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroOrbs}>
          <div className={styles.orb} style={{ '--size': '300px', '--x': '10%', '--y': '20%', '--color': 'rgba(56,189,248,0.12)', '--dur': '8s' }} />
          <div className={styles.orb} style={{ '--size': '200px', '--x': '75%', '--y': '60%', '--color': 'rgba(167,139,250,0.1)', '--dur': '10s' }} />
          <div className={styles.orb} style={{ '--size': '250px', '--x': '85%', '--y': '10%', '--color': 'rgba(251,191,36,0.08)', '--dur': '12s' }} />
          <div className={styles.orb} style={{ '--size': '180px', '--x': '5%', '--y': '70%', '--color': 'rgba(244,114,182,0.08)', '--dur': '9s' }} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroLogoWrap}>
            <img src="/logo.png" alt="EduQuestJr" className={styles.heroLogo} />
          </div>

          <div className={styles.heroBadge}>
            <span className={styles.badgeDot} />
            Ages 1–8 · Montessori-aligned · AI-Powered
          </div>

          <h1 className={styles.heroTitle}>
            Where Little Minds
            <span className={styles.heroHighlight}> Grow Through Play</span>
          </h1>

          <p className={styles.heroSub}>
            The world's most joyful early childhood learning platform — 70+ games, AI voice teaching,
            a friendly bear companion, and beautiful progress tracking for parents.
          </p>

          <div className={styles.heroCtas}>
            {isAuthenticated ? (
              <Link to="/dashboard" className={styles.ctaPrimary}>
                <span>Go to Dashboard</span>
                <span className={styles.ctaArrow}>→</span>
              </Link>
            ) : (
              <>
                <Link to="/register" className={styles.ctaPrimary}>
                  <span>Get Started Free</span>
                  <span className={styles.ctaArrow}>→</span>
                </Link>
                <Link to="/login" className={styles.ctaSecondary}>Log in</Link>
              </>
            )}
          </div>

          <p className={styles.heroNote}>No credit card · 15 free levels per game · Cancel anytime</p>

          <div className={styles.trustRow}>
            <div className={styles.trustChip}>🛡️ COPPA Safe</div>
            <div className={styles.trustChip}>🎓 Expert Designed</div>
            <div className={styles.trustChip}>🌍 10K+ Families</div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3ae.svg" alt="" className={styles.statImg} />
            <span className={styles.statValue}><AnimatedCounter end={70} suffix="+" /></span>
            <span className={styles.statLabel}>Learning Games</span>
          </div>
          <div className={styles.statCard}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ca.svg" alt="" className={styles.statImg} />
            <span className={styles.statValue}><AnimatedCounter end={30} /></span>
            <span className={styles.statLabel}>Levels Per Game</span>
          </div>
          <div className={styles.statCard}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9e0.svg" alt="" className={styles.statImg} />
            <span className={styles.statValue}><AnimatedCounter end={8} /></span>
            <span className={styles.statLabel}>Skill Categories</span>
          </div>
          <div className={styles.statCard}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3c5.svg" alt="" className={styles.statImg} />
            <span className={styles.statValue}><AnimatedCounter end={25} suffix="+" /></span>
            <span className={styles.statLabel}>Stickers & Badges</span>
          </div>
        </div>
      </section>

      {/* ═══ GAME SHOWCASE ═══ */}
      <section className={styles.showcase}>
        <h2 className={styles.sectionTitle}>See What Kids Love</h2>
        <p className={styles.sectionSub}>A tiny peek at our world of learning games</p>
        <div className={styles.previewScroll}>
          {GAME_PREVIEWS.map((g, i) => (
            <div key={g.name} className={styles.previewCard} style={{ '--accent': g.color, animationDelay: `${i * 0.1}s` }}>
              <div className={styles.previewIcon}>
                <img src={g.emoji} alt="" className={styles.previewImg} />
              </div>
              <span className={styles.previewName}>{g.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Everything Your Child Needs</h2>
        <p className={styles.sectionSub}>Built on early childhood development research with love and care</p>
        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className={styles.featureCard} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={styles.featureIconWrap} style={{ background: `linear-gradient(135deg, ${f.color}18, ${f.color}08)`, borderColor: `${f.color}25` }}>
                <img src={f.icon} alt="" className={styles.featureImg} />
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section className={styles.catSection}>
        <h2 className={styles.sectionTitle}>8 Learning Categories</h2>
        <p className={styles.sectionSub}>A well-rounded curriculum covering all developmental areas</p>
        <div className={styles.catGrid}>
          {CATEGORIES.map((c) => (
            <div key={c.name} className={styles.catCard} style={{ '--cat': c.color }}>
              <div className={styles.catIconWrap} style={{ background: `${c.color}15` }}>
                <img src={c.img} alt="" className={styles.catImg} />
              </div>
              <h4 className={styles.catName}>{c.name}</h4>
              <span className={styles.catCount}>{c.games} games</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Get Started in 60 Seconds</h2>
        <p className={styles.sectionSub}>It's as easy as 1-2-3-4</p>
        <div className={styles.stepsGrid}>
          {[
            { num: '1', icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9d1.svg', title: 'Sign Up Free', desc: 'Create your account in seconds', color: '#38bdf8' },
            { num: '2', icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f476.svg', title: 'Add Your Child', desc: 'Set up a profile with name and age', color: '#a78bfa' },
            { num: '3', icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3ae.svg', title: 'Pick a Game', desc: 'Choose from 70+ learning adventures', color: '#fbbf24' },
            { num: '4', icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f680.svg', title: 'Watch Them Grow', desc: 'Track progress with beautiful analytics', color: '#4ade80' },
          ].map((s) => (
            <div key={s.num} className={styles.stepCard}>
              <div className={styles.stepNum} style={{ background: s.color }}>{s.num}</div>
              <div className={styles.stepIconWrap}>
                <img src={s.icon} alt="" className={styles.stepImg} />
              </div>
              <h4 className={styles.stepTitle}>{s.title}</h4>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className={styles.testimonialSection}>
        <h2 className={styles.sectionTitle}>Loved by Parents & Teachers</h2>
        <div className={styles.testimonialGrid}>
          {TESTIMONIALS.map((t) => (
            <div key={t.author} className={styles.testimonialCard}>
              <div className={styles.tStars}>{'★'.repeat(t.rating)}</div>
              <p className={styles.tQuote}>"{t.quote}"</p>
              <div className={styles.tAuthor}>
                <span className={styles.tAvatar}>{t.avatar}</span>
                <div>
                  <strong className={styles.tName}>{t.author}</strong>
                  <span className={styles.tRole}>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SAFETY ═══ */}
      <section className={styles.safetySection}>
        <h2 className={styles.sectionTitle}>Designed for Tiny Hands & Big Hearts</h2>
        <div className={styles.safetyGrid}>
          {[
            { icon: '👋', title: 'Big Touch Targets', desc: 'All buttons 60-80px for tiny fingers' },
            { icon: '🎨', title: 'Soft Colors', desc: 'Warm, calming pastel palette' },
            { icon: '❤️', title: 'Gentle Feedback', desc: 'Encouragement, never punishment' },
            { icon: '🔊', title: 'Voice Guided', desc: 'Audio instructions for pre-readers' },
            { icon: '🔒', title: 'Parent PIN Lock', desc: 'Settings protected by PIN' },
            { icon: '📱', title: 'Mobile First', desc: 'Built for phones and tablets' },
          ].map((s) => (
            <div key={s.title} className={styles.safetyCard}>
              <span className={styles.safetyEmoji}>{s.icon}</span>
              <strong>{s.title}</strong>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className={styles.finalCta}>
        <div className={styles.finalGlow} />
        <img src="/logo.png" alt="" className={styles.finalLogo} />
        <h2 className={styles.finalTitle}>Ready to Start Your Child's<br />Learning Adventure?</h2>
        <p className={styles.finalDesc}>Join thousands of families already learning with EduQuestJr</p>
        <div className={styles.heroCtas}>
          {isAuthenticated ? (
            <Link to="/games" className={styles.ctaPrimary}><span>Start Playing</span><span className={styles.ctaArrow}>→</span></Link>
          ) : (
            <>
              <Link to="/register" className={styles.ctaPrimary}><span>Get Started Free</span><span className={styles.ctaArrow}>→</span></Link>
              <Link to="/login" className={styles.ctaSecondary}>Log in</Link>
            </>
          )}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className={styles.footer}>
        <img src="/logo.png" alt="EduQuestJr" className={styles.footerLogo} />
        <p>© 2026 EduQuestJr · World-class learning for little explorers</p>
      </footer>
    </div>
  );
}
