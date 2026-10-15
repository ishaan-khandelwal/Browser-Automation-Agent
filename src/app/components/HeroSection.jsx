'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Play, Zap } from 'lucide-react';

const EXAMPLES = [
  'Find cheapest flight',
  'Apply for internships',
  'Compare Amazon prices',
  'Fill online forms',
  'Book hotel',
  'Scrape job listings',
];

/* ── Animated Hero Title ─────────────────────────────────────────── */
const WORDS = [
  { text: 'Control', gradient: false },
  { text: 'Your',    gradient: false },
  { text: 'Browser', gradient: true  },
  { text: 'with',    gradient: false },
  { text: 'AI',      gradient: false },
];

function HeroTitle() {
  return (
    <motion.h1
      initial="hidden"
      animate="visible"
      style={{
        fontSize: 'clamp(36px, 5vw, 64px)',
        fontWeight: 800,
        letterSpacing: '-0.04em',
        lineHeight: 1.15,
        marginBottom: 20,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0 0.25em',
        overflow: 'hidden',
      }}
    >
      {WORDS.map((word, i) => (
        <motion.span
          key={word.text}
          initial={{ y: '110%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          transition={{
            delay: 0.1 + i * 0.13,
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            ...(word.gradient
              ? {
                  background: 'linear-gradient(90deg, #FF6B6B, #FFB86B, #9B6DFF, #6EE7C8, #FF6B6B)',
                  backgroundSize: '300% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmerName 3.5s linear infinite',
                }
              : { color: '#1a1028' }),
          }}
        >
          {word.text}
        </motion.span>
      ))}
    </motion.h1>
  );
}

// Simple 3D browser window illustration
function BrowserIllustration() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto' }}>
      {/* Main browser window */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [-1, 1, -1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 32px 80px rgba(155, 109, 255, 0.18), 0 8px 32px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 3,
        }}
      >
        {/* Browser chrome */}
        <div style={{ background: 'rgba(249, 245, 255, 0.9)', padding: '12px 16px', borderBottom: '1px solid rgba(155, 109, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {['#FF6B6B', '#FFB86B', '#3DDC97'].map((c, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.2 }}
                style={{ width: 10, height: 10, borderRadius: '50%', background: c }}
              />
            ))}
            <div style={{ flex: 1, background: 'rgba(155, 109, 255, 0.08)', borderRadius: 8, padding: '4px 12px', fontSize: 11, color: '#9b92ae', fontWeight: 500, border: '1px solid rgba(155, 109, 255, 0.1)' }}>
              https://flights.google.com
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 20px', minHeight: 180 }}>
          {/* Skeleton + content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #4285F4, #EA4335)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: 12, borderRadius: 6, background: 'rgba(155, 109, 255, 0.1)' }} />
            </div>

            {/* Flight results */}
            {[
              { airline: '✈ United', price: '$649', time: '8h 20m', color: '#9B6DFF' },
              { airline: '✈ Delta', price: '$712', time: '11h 05m', color: '#FF6B6B' },
              { airline: '✈ Air France', price: '$589', time: '9h 50m', color: '#3DDC97' },
            ].map((flight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 + 0.5 }}
                style={{
                  background: i === 2 ? `${flight.color}10` : 'rgba(155, 109, 255, 0.04)',
                  border: i === 2 ? `1px solid ${flight.color}25` : '1px solid rgba(155, 109, 255, 0.06)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: '#5a4d6e' }}>{flight.airline}</span>
                <span style={{ fontSize: 11, color: '#9b92ae' }}>{flight.time}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: flight.color }}>{flight.price}</span>
                {i === 2 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#3DDC97', borderRadius: 6, padding: '2px 6px' }}>BEST</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating side window 1 */}
      <motion.div
        animate={{ y: [0, 8, 0], rotate: [3, 5, 3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        style={{
          position: 'absolute',
          top: 20,
          right: -60,
          width: 180,
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 14,
          border: '1px solid rgba(255, 255, 255, 0.85)',
          boxShadow: '0 16px 48px rgba(255, 107, 107, 0.12)',
          padding: '12px 14px',
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#FF6B6B', marginBottom: 6 }}>🤖 AI Agent</div>
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontSize: 10, color: '#9b92ae', lineHeight: 1.5 }}
        >
          Reading flight options...
        </motion.div>
        <motion.div
          style={{ marginTop: 6, height: 3, background: 'rgba(155, 109, 255, 0.1)', borderRadius: 999, overflow: 'hidden' }}
        >
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ height: '100%', width: '50%', background: 'linear-gradient(90deg, transparent, #9B6DFF, transparent)', borderRadius: 999 }}
          />
        </motion.div>
      </motion.div>

      {/* Floating side window 2 */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [-4, -2, -4] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute',
          bottom: -20,
          left: -50,
          width: 160,
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 14,
          border: '1px solid rgba(255, 255, 255, 0.85)',
          boxShadow: '0 16px 48px rgba(61, 220, 151, 0.12)',
          padding: '10px 12px',
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: '#3DDC97', marginBottom: 4 }}>✅ Completed</div>
        <div style={{ fontSize: 11, color: '#5a4d6e', fontWeight: 600 }}>Best price: $589</div>
        <div style={{ fontSize: 10, color: '#9b92ae', marginTop: 2 }}>Air France · Dec 20</div>
      </motion.div>

      {/* Connecting particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
          style={{
            position: 'absolute',
            top: `${30 + i * 20}%`,
            right: -30,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: ['#FF6B6B', '#9B6DFF', '#3DDC97'][i],
            zIndex: 4,
          }}
        />
      ))}
    </div>
  );
}

export default function HeroSection({ onLaunch }) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % EXAMPLES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 60,
          alignItems: 'center',
          minHeight: '80vh',
          padding: '60px 0 40px',
        }}
      >
        {/* Left: Text + Input */}
        <div>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'rgba(155, 109, 255, 0.1)',
              border: '1px solid rgba(155, 109, 255, 0.2)',
              borderRadius: 999,
              padding: '5px 14px',
              marginBottom: 24,
            }}
          >
            <motion.div animate={{ rotate: [0, 20, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Sparkles size={13} color="#9B6DFF" />
            </motion.div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9B6DFF' }}>
              Powered by GPT-4o + Browser CDP
            </span>
          </motion.div>

          {/* Title – word-reveal animation */}
          <HeroTitle />

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: 17,
              color: '#5a4d6e',
              lineHeight: 1.7,
              maxWidth: 480,
              marginBottom: 36,
              fontWeight: 400,
            }}
          >
            Describe any task in natural language. The AI plans, navigates Chrome, verifies every action, and completes complex workflows automatically.
          </motion.p>

          {/* Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{ marginBottom: 20 }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 20,
                border: '1.5px solid rgba(255, 255, 255, 0.85)',
                boxShadow: '0 8px 32px rgba(155, 109, 255, 0.08)',
                padding: '6px 6px 6px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Animated placeholder */}
              {!inputValue && (
                <div
                  style={{
                    position: 'absolute',
                    left: 20,
                    pointerEvents: 'none',
                    color: '#9b92ae',
                    fontSize: 14,
                    fontWeight: 400,
                    overflow: 'hidden',
                    right: 140,
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={exampleIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: 'block' }}
                    >
                      {EXAMPLES[exampleIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              )}

              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && inputValue.trim()) onLaunch(inputValue.trim()); }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  color: '#1a1028',
                  height: 44,
                  zIndex: 1,
                  position: 'relative',
                }}
              />

              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => inputValue.trim() && onLaunch(inputValue.trim())}
                style={{
                  height: 44,
                  paddingLeft: 22,
                  paddingRight: 22,
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF6B6B, #FFB86B, #9B6DFF)',
                  color: '#fff',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 20px rgba(155, 109, 255, 0.35)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Play size={14} />
                Launch Agent
              </motion.button>
            </div>
          </motion.div>

          {/* Example chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
          >
            <span style={{ fontSize: 12, color: '#9b92ae', paddingTop: 4, fontWeight: 500 }}>Try:</span>
            {EXAMPLES.slice(0, 4).map((ex, i) => (
              <motion.button
                key={ex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setInputValue(ex); onLaunch(ex); }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 999,
                  border: '1px solid rgba(155, 109, 255, 0.2)',
                  background: 'rgba(155, 109, 255, 0.06)',
                  color: '#9B6DFF',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {ex}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Right: Browser Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 30, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 22 }}
          style={{ position: 'relative' }}
        >
          <BrowserIllustration />

          {/* Glow behind illustration */}
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(155, 109, 255, 0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
        </motion.div>
      </div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingBottom: 20 }}
      >
        {[
          { icon: '🔒', text: 'Privacy first' },
          { icon: '⚡', text: 'GPT-4o powered' },
          { icon: '🌐', text: 'Any website' },
          { icon: '🎯', text: '94% success rate' },
          { icon: '🔁', text: 'Fully automated' },
        ].map((feat, i) => (
          <motion.div
            key={feat.text}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.06 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              fontSize: 12,
              fontWeight: 600,
              color: '#5a4d6e',
              boxShadow: '0 2px 8px rgba(155, 109, 255, 0.06)',
            }}
          >
            <span>{feat.icon}</span>
            {feat.text}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
