'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!displayName.trim()) {
        setError('Please enter your name.');
        return;
      }
      if (password.length < 10) {
        setError('Password must be at least 10 characters long.');
        return;
      }
      if (/^\d+$/.test(password)) {
        setError('Password cannot be all numbers.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password, name: displayName.trim(), displayName: displayName.trim() });
        // Auto-login after register
        await login({ email, password });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1.5px solid rgba(155, 109, 255, 0.2)',
    borderRadius: 14,
    padding: '12px 14px 12px 42px',
    fontSize: 14,
    color: '#1a1028',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  };

  const iconStyle = {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9b92ae',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26, 16, 40, 0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9000,
          padding: 20,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(32px)',
            borderRadius: 28,
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 32px 80px rgba(155, 109, 255, 0.18)',
            padding: '36px 36px 32px',
            width: '100%',
            maxWidth: 420,
            position: 'relative',
          }}
        >
          {/* Close */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: 10,
              border: 'none',
              background: 'rgba(155, 109, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#9b92ae',
            }}
          >
            <X size={16} />
          </motion.button>

          {/* Header */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <motion.div
              animate={{ rotate: [0, 15, -10, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{ fontSize: 36, marginBottom: 12 }}
            >
              🤖
            </motion.div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1028', letterSpacing: '-0.03em', marginBottom: 4 }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ fontSize: 13, color: '#9b92ae' }}>
              {mode === 'login'
                ? 'Sign in to launch your browser agent'
                : 'Get started with browser automation'}
            </p>
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: 'rgba(155, 109, 255, 0.06)', borderRadius: 14, padding: 4, marginBottom: 24 }}>
            {['login', 'register'].map((m) => (
              <motion.button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: mode === m ? '#fff' : 'transparent',
                  boxShadow: mode === m ? '0 2px 8px rgba(155, 109, 255, 0.12)' : 'none',
                  color: mode === m ? '#1a1028' : '#9b92ae',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Display name (register only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={iconStyle} />
                    <input
                      type="text"
                      placeholder="Display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      style={inputStyle}
                      required={mode === 'register'}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={iconStyle} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={iconStyle} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Password (min. 10 characters)' : 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 42 }}
                  required
                  minLength={mode === 'register' ? 10 : 1}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9b92ae',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </motion.button>
              </div>
              {mode === 'register' && (
                <div style={{ fontSize: 11, color: '#9b92ae', marginTop: 4, paddingLeft: 4 }}>
                  Must be at least 10 characters and cannot be all digits.
                </div>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    background: 'rgba(255, 107, 107, 0.08)',
                    border: '1px solid rgba(255, 107, 107, 0.2)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 12,
                    color: '#FF6B6B',
                    fontWeight: 500,
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={{
                marginTop: 4,
                height: 48,
                borderRadius: 16,
                border: 'none',
                background: loading
                  ? 'rgba(155, 109, 255, 0.15)'
                  : 'linear-gradient(135deg, #FF6B6B, #FFB86B, #9B6DFF)',
                color: loading ? '#9b92ae' : '#fff',
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(155, 109, 255, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                  <Loader2 size={18} />
                </motion.div>
              ) : (
                <>
                  <Sparkles size={16} />
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
