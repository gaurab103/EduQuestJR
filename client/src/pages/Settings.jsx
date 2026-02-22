import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChildMode } from '../context/ChildModeContext';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { auth as authApi } from '../api/client';
import styles from './Settings.module.css';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { isAdultMode, setPin } = useChildMode();
  const { muted, toggleMute } = useAudio();
  const { lang, setLang, languages } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState('');

  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  if (!isAdultMode) {
    return (
      <div className={styles.page}>
        <p>Settings are only available in adult mode.</p>
        <Link to="/games">Back to games</Link>
      </div>
    );
  }

  async function handleNameSave() {
    if (!name.trim()) return;
    setNameSaving(true);
    setNameMsg('');
    try {
      await authApi.updateProfile({ name: name.trim() });
      await refreshUser();
      setNameMsg('Name updated!');
    } catch (err) {
      setNameMsg(err.message || 'Failed to update');
    }
    setNameSaving(false);
  }

  function handlePinChange() {
    if (newPin.length < 4) {
      setPinMsg('PIN must be at least 4 digits');
      return;
    }
    const ok = setPin(newPin);
    setPinMsg(ok ? 'PIN updated!' : 'Failed to update PIN');
    if (ok) setNewPin('');
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>👑 Parent Zone</h1>
        <Link to="/dashboard" className={styles.back}>← Dashboard</Link>
      </div>

      <div className={styles.heroCard}>
        <span className={styles.heroIcon}>⚙️</span>
        <h2 className={styles.heroTitle}>Advanced Settings</h2>
        <p className={styles.heroSub}>Manage your account, PIN, language, and preferences.</p>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile</h2>
        <div className={styles.card}>
          <label className={styles.label}>Your Name</label>
          <div className={styles.row}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Your name"
            />
            <button type="button" onClick={handleNameSave} disabled={nameSaving} className={styles.saveBtn}>
              {nameSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          {nameMsg && <p className={styles.msg}>{nameMsg}</p>}
          <p className={styles.detail}>Email: {user?.email}</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Parental PIN</h2>
        <div className={styles.card}>
          <label className={styles.label}>Change PIN (used to access adult mode)</label>
          <div className={styles.row}>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={styles.input}
              placeholder="New 4+ digit PIN"
            />
            <button type="button" onClick={handlePinChange} className={styles.saveBtn}>
              Update PIN
            </button>
          </div>
          {pinMsg && <p className={styles.msg}>{pinMsg}</p>}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Language</h2>
        <div className={styles.card}>
          <label className={styles.label}>App & Buddy Bear language</label>
          <div className={styles.langRow}>
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`${styles.langBtn} ${lang === l.code ? styles.langActive : ''}`}
              >
                <span className={styles.langFlag}>{l.flag}</span>
                <span>{l.name}</span>
              </button>
            ))}
          </div>
          <p className={styles.detail}>Buddy Bear and speech will use this language.</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Learning Preferences</h2>
        <div className={styles.card}>
          <div className={styles.toggleRow}>
            <span>Sound effects & speech</span>
            <button type="button" onClick={toggleMute} className={styles.toggleBtn}>
              {muted ? '🔇 Muted' : '🔊 On'}
            </button>
          </div>
          <p className={styles.detail}>Buddy Bear and game sounds use this setting.</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Subscription & Billing</h2>
        <div className={styles.card}>
          <div className={styles.subRow}>
            <span>Current plan</span>
            <strong className={styles.subBadge}>
              {user?.subscriptionStatus === 'active' ? 'Premium' : user?.subscriptionStatus === 'trial' ? 'Trial (Premium)' : 'Free'}
            </strong>
          </div>
          {(user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trial') && user?.subscriptionExpiry && (
            <p className={styles.detail}>Renews: {new Date(user.subscriptionExpiry).toLocaleDateString()}</p>
          )}
          <div className={styles.subActions}>
            <Link to="/subscription" className={styles.linkBtn}>
              {user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trial' ? 'Manage Subscription →' : 'Upgrade to Premium →'}
            </Link>
          </div>
          <p className={styles.detail}>Payments via PayPal. Cancel anytime from your PayPal account.</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Data & Privacy</h2>
        <div className={styles.card}>
          <p className={styles.detail}>Your data is stored securely. Progress is tied to your account.</p>
          <Link to="/dashboard" className={styles.linkBtn}>Back to Dashboard</Link>
        </div>
      </section>
    </div>
  );
}
