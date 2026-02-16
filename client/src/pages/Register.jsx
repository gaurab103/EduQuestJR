import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth as authApi } from '../api/client';
import styles from './Auth.module.css';

const PENDING_VERIFY_KEY = 'eduquest_pending_verify';

export default function Register() {
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(PENDING_VERIFY_KEY);
      if (pending) {
        const { email: e, name: n } = JSON.parse(pending);
        if (e) {
          setEmail(e);
          if (n) setName(n);
          setStep('verify');
        }
      }
    } catch (_) {}
  }, []);

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await authApi.register({ name: name.trim(), email, password });
      if (res.requiresVerification) {
        sessionStorage.setItem(PENDING_VERIFY_KEY, JSON.stringify({ email, name: name.trim() }));
        setInfo('A verification code has been sent to your email. Check your inbox and spam folder.');
        setStep('verify');
      } else {
        setError('Unexpected response. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.verifyEmail({ email, code: code.trim() });
      if (res.token && res.user) {
        sessionStorage.removeItem(PENDING_VERIFY_KEY);
        localStorage.setItem('eduquest_token', res.token);
        localStorage.setItem('eduquest_user', JSON.stringify(res.user));
        localStorage.setItem('eduquest_mode', 'adult');
        window.location.href = '/dashboard';
      } else {
        setInfo('Email verified! You can now log in.');
        sessionStorage.removeItem(PENDING_VERIFY_KEY);
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    try {
      await authApi.resendVerification({ email });
      setInfo('Verification code resent. Check your email inbox and spam folder.');
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    }
  }

  if (step === 'verify') {
    return (
      <div className={styles.authPage}>
        <div className={styles.card}>
          <img src="/logo.png" alt="EduQuestJr" className={styles.authLogo} />
          <div className={styles.authMascot}>
            <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f43b.svg" alt="Buddy" className={styles.authMascotImg} />
          </div>
          <h1 className={styles.title}>Check your email!</h1>
          <p className={styles.subtitle}>
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
          <p className={styles.subtitle} style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
            Check your inbox and spam/junk folder
          </p>

          <form onSubmit={handleVerify} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            {info && <div className={styles.success}>{info}</div>}

            <label className={styles.label}>
              Verification Code
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>🔑</span>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                  maxLength={6}
                  className={styles.input}
                  autoFocus
                  style={{ letterSpacing: '4px', fontWeight: 800, fontSize: '1.2rem' }}
                />
              </div>
            </label>

            <button type="submit" disabled={loading || code.length < 6} className={styles.submit}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <button type="button" onClick={handleResend} className={styles.submitSecondary}>
              Resend Code
            </button>
          </form>

          <p className={styles.footer}>
            Wrong email? <Link to="/register" onClick={() => { sessionStorage.removeItem(PENDING_VERIFY_KEY); setStep('register'); }}>Go back</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <img src="/logo.png" alt="EduQuestJr" className={styles.authLogo} />
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Start your family's learning journey</p>

        <form onSubmit={handleRegister} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <label className={styles.label}>
            Your Name
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>👤</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className={styles.input}
                autoComplete="name"
              />
            </div>
          </label>

          <label className={styles.label}>
            Email
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>📧</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={styles.input}
                autoComplete="email"
              />
            </div>
          </label>

          <label className={styles.label}>
            Password
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className={styles.input}
                autoComplete="new-password"
              />
            </div>
          </label>

          <button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
