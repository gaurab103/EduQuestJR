import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Home.module.css';

const FEATURES = [
  { icon: 'https://cdn-icons-png.flaticon.com/128/3176/3176298.png', title: 'Smart Learning', desc: '31+ games across 8 skill categories designed by early childhood experts' },
  { icon: 'https://cdn-icons-png.flaticon.com/128/3222/3222683.png', title: '30 Levels Per Game', desc: 'Progressive difficulty from Meadow to Cosmos — grows with your child' },
  { icon: 'https://cdn-icons-png.flaticon.com/128/3940/3940403.png', title: 'AI Buddy Friend', desc: 'Buddy the Bear chats, encourages, and adapts to your child\'s level' },
  { icon: 'https://cdn-icons-png.flaticon.com/128/3064/3064197.png', title: 'Achievements & Stickers', desc: '25+ real cartoon stickers and 15 badges to collect and display' },
  { icon: 'https://cdn-icons-png.flaticon.com/128/2906/2906206.png', title: 'Parent Analytics', desc: 'Detailed progress tracking with visual charts and AI-powered insights' },
  { icon: 'https://cdn-icons-png.flaticon.com/128/3031/3031702.png', title: 'Motor & Audio Games', desc: 'Drawing, handwriting, and sound recognition for holistic development' },
];

const CATEGORIES = [
  { img: 'https://cdn-icons-png.flaticon.com/128/2906/2906491.png', name: 'Cognitive', color: '#38bdf8', desc: 'Pattern recognition, memory, logic' },
  { img: 'https://cdn-icons-png.flaticon.com/128/3145/3145765.png', name: 'Literacy', color: '#a78bfa', desc: 'Letters, phonics, rhyming, words' },
  { img: 'https://cdn-icons-png.flaticon.com/128/3946/3946069.png', name: 'Numeracy', color: '#fb923c', desc: 'Counting, addition, subtraction' },
  { img: 'https://cdn-icons-png.flaticon.com/128/3069/3069186.png', name: 'Creativity', color: '#f472b6', desc: 'Colors, drawing, imagination' },
  { img: 'https://cdn-icons-png.flaticon.com/128/833/833472.png', name: 'Social & Emotional', color: '#4ade80', desc: 'Emotions, behavior, breathing' },
  { img: 'https://cdn-icons-png.flaticon.com/128/4712/4712031.png', name: 'Future Skills', color: '#818cf8', desc: 'Coding basics and logic' },
  { img: 'https://cdn-icons-png.flaticon.com/128/3039/3039386.png', name: 'Motor Skills', color: '#fbbf24', desc: 'Drawing, writing, motor' },
  { img: 'https://cdn-icons-png.flaticon.com/128/3039/3039386.png', name: 'Auditory', color: '#f472b6', desc: 'Listening, sound recognition' },
];

const STATS = [
  { value: '31+', label: 'Learning Games', icon: 'https://cdn-icons-png.flaticon.com/128/3176/3176298.png' },
  { value: '30', label: 'Levels Per Game', icon: 'https://cdn-icons-png.flaticon.com/128/3222/3222683.png' },
  { value: '8', label: 'Skill Categories', icon: 'https://cdn-icons-png.flaticon.com/128/2906/2906491.png' },
  { value: '25+', label: 'Stickers & Badges', icon: 'https://cdn-icons-png.flaticon.com/128/3159/3159066.png' },
];

const TESTIMONIALS = [
  { quote: "My daughter asks to play every day. She learned her ABCs and counting through EduQuestJr!", author: 'Sarah M.', role: 'Mom of a 4-year-old', avatar: '👩' },
  { quote: "The AI chat friend is amazing — my son talks to Buddy like a real friend. The level system keeps him motivated.", author: 'David K.', role: 'Dad of a 5-year-old', avatar: '👨' },
  { quote: "Best ECD app I've seen. Big buttons, gentle feedback, and kids love collecting stickers!", author: 'Lisa T.', role: 'Kindergarten teacher', avatar: '👩‍🏫' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className={styles.home}>
      {/* ═══ HERO ═══ */}
      <section className={styles.hero}>
        {/* Animated floating elements */}
        <div className={styles.heroBg}>
          <div className={styles.floater} style={{ top: '8%', left: '3%', animationDelay: '0s' }}>
            <img src="https://cdn-icons-png.flaticon.com/128/3222/3222683.png" alt="" className={styles.floaterImg} />
          </div>
          <div className={styles.floater} style={{ top: '15%', right: '5%', animationDelay: '1.2s' }}>
            <img src="https://cdn-icons-png.flaticon.com/128/3031/3031702.png" alt="" className={styles.floaterImg} />
          </div>
          <div className={styles.floater} style={{ bottom: '20%', left: '8%', animationDelay: '2.4s' }}>
            <img src="https://cdn-icons-png.flaticon.com/128/3069/3069186.png" alt="" className={styles.floaterImg} />
          </div>
          <div className={styles.floater} style={{ bottom: '10%', right: '6%', animationDelay: '0.8s' }}>
            <img src="https://cdn-icons-png.flaticon.com/128/3176/3176298.png" alt="" className={styles.floaterImg} />
          </div>
          <div className={styles.floater} style={{ top: '45%', left: '2%', animationDelay: '1.8s' }}>
            <img src="https://cdn-icons-png.flaticon.com/128/3159/3159066.png" alt="" className={styles.floaterImg} />
          </div>
          <div className={styles.floater} style={{ top: '40%', right: '3%', animationDelay: '3s' }}>
            <img src="https://cdn-icons-png.flaticon.com/128/3940/3940403.png" alt="" className={styles.floaterImg} />
          </div>
        </div>

        <div className={styles.heroInner}>
          {/* Giant logo */}
          <div className={styles.heroLogoWrap}>
            <img src="/logo.png" alt="EduQuestJr" className={styles.heroLogo} />
          </div>

          <span className={styles.heroBadge}>
            <img src="https://cdn-icons-png.flaticon.com/128/3222/3222683.png" alt="" className={styles.badgeIcon} />
            Ages 1-8 · Montessori-aligned · AI-Powered
          </span>

          <h1 className={styles.heroTitle}>
            Where Little Minds<br />
            <span className={styles.heroGradient}>Grow Through Play</span>
          </h1>

          <p className={styles.heroSubtitle}>
            The world's most joyful early childhood learning platform.
            31+ games, 30 levels each, AI chat friend, and beautiful progress tracking —
            all designed with tiny fingers and big imaginations in mind.
          </p>

          <div className={styles.heroCtas}>
            {isAuthenticated ? (
              <Link to="/dashboard" className={styles.ctaPrimary}>
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className={styles.ctaPrimary}>
                  Get Started Free →
                </Link>
                <Link to="/login" className={styles.ctaSecondary}>
                  Log in
                </Link>
              </>
            )}
          </div>

          <p className={styles.heroNote}>No credit card needed · 15 free levels per game · Cancel anytime</p>

          {/* Trust indicators */}
          <div className={styles.trustRow}>
            <span className={styles.trustItem}>🛡️ COPPA Safe</span>
            <span className={styles.trustItem}>🎓 Expert Designed</span>
            <span className={styles.trustItem}>🌍 10K+ Families</span>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section className={styles.statsBar}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statItem}>
            <img src={s.icon} alt="" className={styles.statIcon} />
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Everything Your Child Needs to Thrive</h2>
        <p className={styles.sectionSubtitle}>Built on early childhood development research with love and care</p>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <img src={f.icon} alt="" className={styles.featureImg} loading="lazy" />
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>8 Learning Categories</h2>
        <p className={styles.sectionSubtitle}>A well-rounded curriculum covering all developmental areas</p>
        <div className={styles.catGrid}>
          {CATEGORIES.map((c) => (
            <div key={c.name} className={styles.catCard} style={{ '--cat-color': c.color }}>
              <img src={c.img} alt="" className={styles.catImg} loading="lazy" />
              <h4 className={styles.catName}>{c.name}</h4>
              <p className={styles.catDesc}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <p className={styles.sectionSubtitle}>Getting started takes less than a minute</p>
        <div className={styles.stepsGrid}>
          {[
            { num: '1', icon: 'https://cdn-icons-png.flaticon.com/128/3176/3176355.png', title: 'Create Account', desc: 'Sign up free and add your child\'s profile' },
            { num: '2', icon: 'https://cdn-icons-png.flaticon.com/128/3176/3176298.png', title: 'Pick a Game', desc: 'Choose from 31+ learning games across 8 categories' },
            { num: '3', icon: 'https://cdn-icons-png.flaticon.com/128/3222/3222683.png', title: 'Learn & Grow', desc: 'Progress through 30 levels, earn XP, coins, and stickers' },
            { num: '4', icon: 'https://cdn-icons-png.flaticon.com/128/2906/2906206.png', title: 'Track Progress', desc: 'Parents get beautiful analytics and AI-powered tips' },
          ].map((step) => (
            <div key={step.num} className={styles.stepCard}>
              <span className={styles.stepNumber}>{step.num}</span>
              <img src={step.icon} alt="" className={styles.stepImg} />
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Loved by Parents & Teachers</h2>
        <div className={styles.testimonialGrid}>
          {TESTIMONIALS.map((t) => (
            <div key={t.author} className={styles.testimonialCard}>
              <div className={styles.testimonialStars}>★★★★★</div>
              <p className={styles.testimonialQuote}>"{t.quote}"</p>
              <div className={styles.testimonialAuthor}>
                <span className={styles.testimonialAvatar}>{t.avatar}</span>
                <div>
                  <strong>{t.author}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ECD SAFETY ═══ */}
      <section className={styles.safetySection}>
        <h2 className={styles.sectionTitle}>Designed for Tiny Hands & Big Hearts</h2>
        <div className={styles.safetyGrid}>
          {[
            { img: 'https://cdn-icons-png.flaticon.com/128/3176/3176355.png', title: 'Big Touch Targets', desc: 'All buttons 60-80px minimum for little fingers' },
            { img: 'https://cdn-icons-png.flaticon.com/128/3069/3069186.png', title: 'Soft Pastel Colors', desc: 'Warm, calming palette gentle on young eyes' },
            { img: 'https://cdn-icons-png.flaticon.com/128/833/833472.png', title: 'No Harsh Feedback', desc: 'Gentle encouragement, never punishment' },
            { img: 'https://cdn-icons-png.flaticon.com/128/3039/3039386.png', title: 'Audio Instructions', desc: 'Voice-guided gameplay for pre-readers' },
            { img: 'https://cdn-icons-png.flaticon.com/128/3064/3064155.png', title: 'Parent PIN Lock', desc: 'Settings protected behind a parent-only PIN' },
            { img: 'https://cdn-icons-png.flaticon.com/128/854/854878.png', title: 'Mobile First', desc: 'Built for tablets and phones kids actually use' },
          ].map((s) => (
            <div key={s.title} className={styles.safetyItem}>
              <img src={s.img} alt="" className={styles.safetyImg} />
              <div>
                <strong>{s.title}</strong>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className={styles.finalCta}>
        <img src="/logo.png" alt="" className={styles.finalCtaLogo} />
        <h2 className={styles.finalCtaTitle}>Ready to Start Your Child's Learning Adventure?</h2>
        <p className={styles.finalCtaDesc}>Join thousands of families already learning with EduQuestJr</p>
        <div className={styles.heroCtas}>
          {isAuthenticated ? (
            <Link to="/games" className={styles.ctaPrimary}>Start Playing →</Link>
          ) : (
            <>
              <Link to="/register" className={styles.ctaPrimary}>Get Started Free →</Link>
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
