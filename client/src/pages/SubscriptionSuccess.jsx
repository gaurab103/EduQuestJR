import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscription as subscriptionApi } from '../api/client';
import styles from './Subscription.module.css';

export default function SubscriptionSuccess() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('syncing');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const subscriptionId = searchParams.get('subscription_id');

    async function activate() {
      try {
        if (subscriptionId) {
          await subscriptionApi.activate(subscriptionId, 'monthly');
        }
        await subscriptionApi.sync();
        await refreshUser();
        setStatus('success');
      } catch {
        setStatus('error');
      } finally {
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    }

    activate();
  }, [refreshUser, navigate, searchParams]);

  return (
    <div className={styles.page}>
      <div className={styles.successCard}>
        {status === 'syncing' && (
          <>
            <div className={styles.successIcon}>⏳</div>
            <h2>Activating your subscription…</h2>
            <p>Please wait a moment</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className={styles.successIcon}>🎉</div>
            <h2>Welcome to Premium!</h2>
            <p>Your subscription is now active. Enjoy unlimited learning!</p>
            <img src="/logo.png" alt="EduQuestJr" className={styles.successLogo} />
            <p className={styles.redirecting}>Redirecting to dashboard…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className={styles.successIcon}>⏳</div>
            <h2>Almost there…</h2>
            <p>Subscription may still be activating. Check your dashboard in a moment.</p>
            <p className={styles.redirecting}>Redirecting…</p>
          </>
        )}
      </div>
    </div>
  );
}
