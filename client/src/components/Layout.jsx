import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChildMode } from '../context/ChildModeContext';
import { useAudio } from '../context/AudioContext';
import { useTheme } from '../context/ThemeContext';
import PinModal from './PinModal';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { isAdultMode, enterAdultMode, exitAdultMode } = useChildMode();
  const { muted, toggleMute } = useAudio();
  const { isDark, toggleTheme } = useTheme();
  const [showPinModal, setShowPinModal] = useState(false);

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
                <Link to="/games">Games</Link>
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
                >
                  For Grown-ups
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
              return true;
            }
            return false;
          }}
          onCancel={() => setShowPinModal(false)}
        />
      )}
    </div>
  );
}
