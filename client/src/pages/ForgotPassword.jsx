import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth as authApi } from '../api/client';
import styles from './Auth.module.css';

export default function ForgotPassword() {
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSendCode(e) {
    if (e) e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setInfo('A reset code has been sent to your email.');
      setStep('code');
    } catch (err) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.verifyResetCode({ email, code: code.trim() });
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Invalid reset code');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code: code.trim(), newPassword });
      setStep('done');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  // Step: Done
  if (step === 'done') {
    return (
      <div className={styles.authPage}>
        <div className={styles.card}>
          <img src="/logo.png" alt="EduQuestJr" className={styles.authLogo} />
          <div className={styles.authMascot}>
            <img src="https://cdn-icons-png.flaticon.com/128/3940/3940403.png" alt="Buddy" className={styles.authMascotImg} />
          </div>
          <h1 className={styles.title}>Password Reset!</h1>
          <p className={styles.subtitle}>Your password has been updated successfully.</p>
          <div className={styles.form}>
            <Link to="/login" className={styles.submit} style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              Log in with new password
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step: New Password
  if (step === 'reset') {
    return (
      <div className={styles.authPage}>
        <div className={styles.card}>
          <img src="/logo.png" alt="EduQuestJr" className={styles.authLogo} />
          <h1 className={styles.title}>Set New Password</h1>
          <p className={styles.subtitle}>Choose a strong password for your account</p>

          <form onSubmit={handleResetPassword} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <label className={styles.label}>
              New Password
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className={styles.input}
                  autoFocus
                />
              </div>
            </label>

            <label className={styles.label}>
              Confirm Password
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>🔒</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  minLength={6}
                  className={styles.input}
                />
              </div>
            </label>

            <button type="submit" disabled={loading} className={styles.submit}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step: Enter Code
  if (step === 'code') {
    return (
      <div className={styles.authPage}>
        <div className={styles.card}>
          <img src="/logo.png" alt="EduQuestJr" className={styles.authLogo} />
          <h1 className={styles.title}>Enter Reset Code</h1>
          <p className={styles.subtitle}>
            We sent a 6-digit code to <strong>{email}</strong>
          </p>



          <form onSubmit={handleVerifyCode} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            {info && <div className={styles.success}>{info}</div>}

            <label className={styles.label}>
              Reset Code
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
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button type="button" onClick={handleSendCode} className={styles.submitSecondary}>
              Resend Code
            </button>
          </form>

          <p className={styles.footer}>
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    );
  }

  // Step: Enter Email
  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <img src="/logo.png" alt="EduQuestJr" className={styles.authLogo} />
        <h1 className={styles.title}>Forgot Password?</h1>
        <p className={styles.subtitle}>Enter your email and we'll send you a reset code</p>

        <form onSubmit={handleSendCode} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <label className={styles.label}>
            Email Address
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
                autoFocus
              />
            </div>
          </label>

          <button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>

        <p className={styles.footer}>
          Remember your password? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
