import { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons, FUNDING } from '@paypal/react-paypal-js';
import { useAuth } from '../context/AuthContext';
import { useChildMode } from '../context/ChildModeContext';
import { subscription as subscriptionApi } from '../api/client';
import styles from './Subscription.module.css';

const PAYPAL_CLIENT_ID = 'AQqfMagZqPFIRoaZzKXpi6zppoTixFnbc3vY8RfULQlWPrfO9-aJphGQXXHoNGvbzbZh7RA0ZAefnhFa';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$9.99',
    priceNum: '9.99',
    period: '/month',
    save: null,
    popular: false,
  },
  {
    id: '6months',
    name: '6 Months',
    price: '$49.99',
    priceNum: '49.99',
    period: '/6 months',
    save: 'Save 17%',
    popular: true,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$79.99',
    priceNum: '79.99',
    period: '/year',
    save: 'Save 33%',
    popular: false,
  },
];

const FEATURES = [
  { icon: '🎮', text: '31+ premium games — full library' },
  { icon: '🌟', text: '30 levels per game — all unlocked' },
  { icon: '🐻', text: 'AI Buddy chat — unlimited' },
  { icon: '📊', text: 'Advanced parent analytics' },
  { icon: '🎁', text: 'Exclusive stickers & badges' },
  { icon: '⏰', text: 'No daily play limits' },
];

function PaymentButtons({ planType, onSuccess, onError }) {
  const [planId, setPlanId] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    setLoadingPlan(true);
    subscriptionApi.getPlanId(planType)
      .then(res => setPlanId(res.planId))
      .catch(() => onError('Failed to load plan. Please try again.'))
      .finally(() => setLoadingPlan(false));
  }, [planType]);

  const createSubscription = useCallback((data, actions) => {
    if (!planId) return Promise.reject('Plan not loaded');
    return actions.subscription.create({ plan_id: planId });
  }, [planId]);

  const onApprove = useCallback(async (data) => {
    try {
      await subscriptionApi.activate(data.subscriptionID, planType);
      onSuccess();
    } catch (err) {
      onError(err.message || 'Failed to activate subscription');
    }
  }, [planType, onSuccess, onError]);

  if (loadingPlan) {
    return <div className={styles.loadingButtons}>Loading payment options...</div>;
  }

  if (!planId) {
    return <div className={styles.errorMsg}>Could not load plan. Please refresh.</div>;
  }

  return (
    <div className={styles.buttonsWrap}>
      {/* PayPal Button */}
      <div className={styles.paymentOption}>
        <div className={styles.paymentLabel}>
          <img src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg" alt="PayPal" className={styles.paymentLogo} />
          <span>Pay with PayPal</span>
        </div>
        <PayPalButtons
          fundingSource={FUNDING.PAYPAL}
          style={{
            layout: 'horizontal',
            color: 'gold',
            shape: 'pill',
            label: 'subscribe',
            height: 48,
          }}
          createSubscription={createSubscription}
          onApprove={onApprove}
          onError={() => onError('PayPal payment failed. Please try again.')}
        />
      </div>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      {/* Card Button */}
      <div className={styles.paymentOption}>
        <div className={styles.paymentLabel}>
          <span className={styles.cardIcons}>💳</span>
          <span>Pay with Credit / Debit Card</span>
        </div>
        <PayPalButtons
          fundingSource={FUNDING.CARD}
          style={{
            layout: 'horizontal',
            color: 'black',
            shape: 'pill',
            label: 'subscribe',
            height: 48,
          }}
          createSubscription={createSubscription}
          onApprove={onApprove}
          onError={() => onError('Card payment failed. Please try again.')}
        />
      </div>
    </div>
  );
}

export default function Subscription() {
  const { user, refreshUser } = useAuth();
  const { isAdultMode } = useChildMode();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('6months');
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isAdultMode) return <Navigate to="/games" replace />;

  const isPremium = user?.subscriptionStatus === 'active';

  function handleSuccess() {
    setSuccess(true);
    refreshUser();
    setTimeout(() => navigate('/dashboard'), 3000);
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>🎉</div>
          <h2>Welcome to Premium!</h2>
          <p>Your subscription is now active. Enjoy unlimited learning!</p>
          <img src="/logo.png" alt="EduQuestJr" className={styles.successLogo} />
          <p className={styles.redirecting}>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className={styles.page}>
        <div className={styles.premiumCard}>
          <img src="/logo.png" alt="" className={styles.premiumLogo} />
          <div className={styles.premiumBadge}>👑 Premium Active</div>
          <h2>You have full access!</h2>
          <p>All 31+ games, 30 levels, AI features, and no limits.</p>
          {user?.subscriptionExpiry && (
            <p className={styles.expiry}>
              Renews: {new Date(user.subscriptionExpiry).toLocaleDateString()}
            </p>
          )}
          <button type="button" onClick={() => navigate('/games')} className={styles.playNowBtn}>
            🎮 Play Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{
      'client-id': PAYPAL_CLIENT_ID,
      vault: true,
      intent: 'subscription',
    }}>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <img src="/logo.png" alt="EduQuestJr" className={styles.headerLogo} />
          <h1 className={styles.title}>Upgrade to Premium</h1>
          <p className={styles.subtitle}>Unlock the full EduQuestJr experience for your child</p>
        </div>

        {/* Features */}
        <div className={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.text} className={styles.featureItem}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <span className={styles.featureText}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Plan selector */}
        <div className={styles.planGrid}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`${styles.planCard} ${selectedPlan === plan.id ? styles.planSelected : ''} ${plan.popular ? styles.planPopular : ''}`}
              onClick={() => { setSelectedPlan(plan.id); setShowPayment(false); setError(''); }}
              role="button"
              tabIndex={0}
            >
              {plan.save && <span className={styles.planSave}>{plan.save}</span>}
              {plan.popular && <span className={styles.planPopularTag}>Most Popular</span>}
              <h3 className={styles.planName}>{plan.name}</h3>
              <p className={styles.planPrice}>
                {plan.price}<span className={styles.planPeriod}>{plan.period}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Continue to payment */}
        {!showPayment ? (
          <button
            type="button"
            onClick={() => setShowPayment(true)}
            className={styles.continueBtn}
          >
            Continue to Payment →
          </button>
        ) : (
          <div className={styles.paymentSection}>
            <h3 className={styles.paymentTitle}>
              Choose Payment Method
            </h3>
            <p className={styles.paymentSubtitle}>
              {PLANS.find(p => p.id === selectedPlan)?.name} plan — {PLANS.find(p => p.id === selectedPlan)?.price}{PLANS.find(p => p.id === selectedPlan)?.period}
            </p>

            <PaymentButtons
              planType={selectedPlan}
              onSuccess={handleSuccess}
              onError={(msg) => setError(msg)}
            />

            <button
              type="button"
              onClick={() => setShowPayment(false)}
              className={styles.backBtn}
            >
              ← Change Plan
            </button>
          </div>
        )}

        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Security note */}
        <div className={styles.securityNote}>
          <span>🔒</span>
          <span>Payments securely processed by PayPal. Cancel anytime.</span>
        </div>

        {/* Guarantee */}
        <div className={styles.guarantee}>
          <img src="https://cdn-icons-png.flaticon.com/128/3064/3064155.png" alt="" className={styles.guaranteeImg} />
          <div>
            <strong>30-Day Money-Back Guarantee</strong>
            <p>Not satisfied? Get a full refund within 30 days, no questions asked.</p>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
