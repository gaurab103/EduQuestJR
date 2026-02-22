import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChildMode } from '../context/ChildModeContext';
import { useAudio } from '../context/AudioContext';
import { useTheme } from '../context/ThemeContext';
import { children as childrenApi } from '../api/client';
import PinModal from './PinModal';
import BuddyChat from './BuddyChat';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { isAdultMode, enterAdultMode, exitAdultMode } = useChildMode();
  const navigate = useNavigate();
  const { muted, toggleMute } = useAudio();
  const { isDark, toggleTheme } = useTheme();
  const [showPinModal, setShowPinModal] = useState(false);
  const [buddyChatOpen, setBuddyChatOpen] = useState(false);
  const [firstChild, setFirstChild] = useState(null);

  useEffect(() => {
    if (isAuthenticated && !isAdultMode) {
      childrenApi.list().then(res => {
        if (res.children?.length) setFirstChild(res.children[0]);
      }).catch(() => {});
    }
  }, [isAuthenticated, isAdultMode]);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <img src="/logo.png" alt="EduQuestJr" className={styles.logoImg} />
        </Link>
        <nav className={styles.nav}>
          {isAuthenticated ? (
            isAdultMode ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/settings">Settings</Link>
                <span className={styles.userName}>{user?.name}</span>
                <button type="button" onClick={toggleTheme} className={styles.themeBtn} aria-label="Toggle theme" title={isDark ? 'Light mode' : 'Dark mode'}>
                  {isDark ? '☀️' : '🌙'}
                </button>
                <button type="button" onClick={toggleMute} className={styles.muteBtn} aria-label={muted ? 'Unmute' : 'Mute'}>
                  {muted ? '🔇' : '🔊'}
                </button>
                <button type="button" onClick={exitAdultMode} className={styles.childModeBtn}>
                  👶 Child Mode
                </button>
                <button type="button" onClick={logout} className={styles.btnLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/games" className={styles.navGames}>🎮 Play</Link>
                <Link to="/map" className={styles.navGames}>🗺️ Map</Link>
                <Link to="/shop" className={styles.navGames}>🎁 Shop</Link>
                <Link to="/my-profile" className={styles.navGames}>👤 Me</Link>
                <button type="button" onClick={toggleTheme} className={styles.themeBtn} aria-label="Toggle theme">
                  {isDark ? '☀️' : '🌙'}
                </button>
                <button type="button" onClick={toggleMute} className={styles.muteBtn} aria-label={muted ? 'Unmute' : 'Mute'}>
                  {muted ? '🔇' : '🔊'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinModal(true)}
                  className={styles.forGrownups}
                  title="Parent settings & dashboard"
                >
                  👑 Parents
                </button>
              </>
            )
          ) : (
            <>
              <button type="button" onClick={toggleTheme} className={styles.themeBtn} aria-label="Toggle theme">
                {isDark ? '☀️' : '🌙'}
              </button>
              <Link to="/login">Log in</Link>
              <Link to="/register" className={styles.btnRegister}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
      {showPinModal && (
        <PinModal
          onSuccess={(pin) => {
            if (enterAdultMode(pin)) {
              setShowPinModal(false);
              navigate('/dashboard');
              return true;
            }
            return false;
          }}
          onCancel={() => setShowPinModal(false)}
        />
      )}
      {isAuthenticated && !isAdultMode && (
        <>
          {!buddyChatOpen && (
            <button
              type="button"
              onClick={() => setBuddyChatOpen(true)}
              aria-label="Talk to Buddy Bear"
              style={{
                position: 'fixed', bottom: '1.25rem', right: '1.25rem', zIndex: 9998,
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                border: '3px solid #fff', boxShadow: '0 4px 20px rgba(251,191,36,0.5)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'buddyBounce 2s ease-in-out infinite', padding: 0,
              }}
            >
              <img
                src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg"
                alt="Buddy Bear"
                style={{ width: 38, height: 38 }}
              />
            </button>
          )}
          <BuddyChat
            childId={firstChild?._id}
            childName={firstChild?.name}
            isOpen={buddyChatOpen}
            onClose={() => setBuddyChatOpen(false)}
          />
        </>
      )}
    </div>
  );
}
