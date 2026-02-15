import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <img src="/logo.png" alt="EduQuestJr" className={styles.authLogo} />
        <h1 className={styles.title}>Welcome back!</h1>
        <p className={styles.subtitle}>Log in to your EduQuestJr account</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

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
                placeholder="••••••••"
                required
                className={styles.input}
                autoComplete="current-password"
              />
            </div>
          </label>

          <Link to="/forgot-password" className={styles.forgotLink}>
            Forgot password?
          </Link>

          <button type="submit" disabled={loading} className={styles.submit}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link to="/register">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
