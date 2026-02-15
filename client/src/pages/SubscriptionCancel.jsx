import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionCancel() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate('/dashboard'), 2000);
    return () => clearTimeout(t);
  }, [navigate]);
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Subscription cancelled. Redirecting to dashboard…</p>
    </div>
  );
}
