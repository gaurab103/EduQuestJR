import { useState } from 'react';
import styles from './PinModal.module.css';

export default function PinModal({ onSuccess, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (onSuccess(pin)) {
      setPin('');
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="pin-title">
      <div className={styles.card}>
        <h2 id="pin-title" className={styles.title}>For Grown-ups</h2>
        <p className={styles.subtitle}>Enter PIN to access parent settings</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="4-digit PIN"
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="submit" className={styles.submit}>
              Enter
            </button>
            <button type="button" onClick={onCancel} className={styles.cancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
