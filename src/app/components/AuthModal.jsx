'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    // The backend's own rules, checked here so the person is not told after a
    // round trip that their password was too short.
    if (mode === 'register') {
      if (!displayName.trim()) { setError('Please enter your name.'); return; }
      if (password.length < 10) { setError('Password must be at least 10 characters.'); return; }
      if (/^\d+$/.test(password)) { setError('Password cannot be only numbers.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password, name: displayName.trim(), displayName: displayName.trim() });
        await login({ email, password });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <motion.div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div>
            <span className="rail-mark" style={{ marginBottom: 14 }}><Zap size={18} strokeWidth={2.4} aria-hidden="true" /></span>
            <h2 id="auth-title" className="disp" style={{ fontSize: 22, fontWeight: 600 }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-2)' }}>
              {mode === 'login'
                ? 'Sign in to run tasks and keep your history.'
                : 'Your runs, history and approval rules live in your account.'}
            </p>
          </div>
          <button type="button" className="btn btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="tabs" role="tablist" aria-label="Sign in or register" style={{ marginBottom: 20 }}>
          {[['login', 'Sign in'], ['register', 'Register']].map(([m, label]) => (
            <button
              key={m}
              type="button"
              role="tab"
              className="tab"
              aria-selected={mode === m}
              onClick={() => { setMode(m); setError(''); }}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          {error && <p className="form-error" role="alert">{error}</p>}

          {mode === 'register' && (
            <label className="field">
              <span>Your name</span>
              <input
                ref={mode === 'register' ? firstRef : null}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Abhishek"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              ref={mode === 'login' ? firstRef : null}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <span style={{ position: 'relative', display: 'block' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'At least 10 characters' : 'Your password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                style={{ paddingRight: 44 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 6, top: 6, width: 32, height: 32,
                  display: 'grid', placeItems: 'center', border: 0, borderRadius: 8,
                  background: 'transparent', color: 'var(--text-3)', cursor: 'pointer',
                }}
              >
                {showPass ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </span>
          </label>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 6 }}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
