import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChildMode } from '../context/ChildModeContext';
import { useAudio } from '../context/AudioContext';
import { auth as authApi } from '../api/client';
import styles from './Settings.module.css';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { isAdultMode, setPin } = useChildMode();
  const { muted, toggleMute } = useAudio();

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
      <h1 className={styles.title}>Settings</h1>
      <Link to="/dashboard" className={styles.back}>← Back to Dashboard</Link>

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
        <h2 className={styles.sectionTitle}>Audio</h2>
        <div className={styles.card}>
          <div className={styles.toggleRow}>
            <span>Sound Effects & Speech</span>
            <button type="button" onClick={toggleMute} className={styles.toggleBtn}>
              {muted ? '🔇 Muted' : '🔊 On'}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Subscription</h2>
        <div className={styles.card}>
          <p>Current plan: <strong>{user?.subscriptionStatus === 'active' ? 'Premium' : 'Free'}</strong></p>
          <Link to="/subscription" className={styles.linkBtn}>Manage Subscription</Link>
        </div>
      </section>
    </div>
  );
}
