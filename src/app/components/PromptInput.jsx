'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Send, Sparkles, ArrowRight } from 'lucide-react';

const EXAMPLES = [
  'Find the cheapest flight from NYC to London next month',
  'Apply to 5 software engineering internships on LinkedIn',
  'Compare Amazon prices for Sony WH-1000XM5 headphones',
  'Fill out my job application on company website',
  'Book a hotel in Paris for Dec 20-25 under $200/night',
  'Summarize top 10 AI news articles from today',
];

export default function PromptInput({ onSubmit, isRunning }) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef(null);
  const controls = useAnimation();

  // Rotate placeholder examples
  useEffect(() => {
    if (value) return;
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || isRunning) return;
    controls.start({ scale: [1, 0.97, 1], transition: { duration: 0.3 } });
    onSubmit(value.trim());
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const handleExampleClick = (example) => {
    setValue(example);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {(isFocused || showSuggestions) && !value && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 12px)',
              left: 0,
              right: 0,
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              borderRadius: 20,
              boxShadow: '0 16px 48px rgba(155, 109, 255, 0.12), 0 4px 16px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              zIndex: 50,
            }}
          >
            <div style={{ padding: '12px 16px 8px', fontSize: 11, fontWeight: 600, color: '#9b92ae', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Try these
            </div>
            {EXAMPLES.map((example, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ backgroundColor: 'rgba(155, 109, 255, 0.06)', x: 4 }}
                onClick={() => handleExampleClick(example)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  color: '#5a4d6e',
                  fontWeight: 500,
                }}
              >
                <Sparkles size={13} style={{ color: '#9B6DFF', flexShrink: 0 }} />
                {example}
                <ArrowRight size={12} style={{ marginLeft: 'auto', color: '#9b92ae', opacity: 0 }} className="suggestion-arrow" />
              </motion.button>
            ))}
            <div style={{ height: 8 }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input */}
      <motion.div
        animate={controls}
        style={{
          position: 'relative',
          background: isFocused ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 24,
          border: isFocused
            ? '1.5px solid rgba(155, 109, 255, 0.4)'
            : '1.5px solid rgba(255, 255, 255, 0.8)',
          boxShadow: isFocused
            ? '0 0 0 4px rgba(155, 109, 255, 0.08), 0 0 32px rgba(255, 107, 107, 0.08), 0 8px 32px rgba(155, 109, 255, 0.1)'
            : '0 4px 24px rgba(155, 109, 255, 0.06)',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {/* Animated border glow when focused */}
        {isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: -1,
              borderRadius: 25,
              background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(155, 109, 255, 0.3), rgba(255, 184, 107, 0.3))',
              zIndex: -1,
              filter: 'blur(12px)',
              opacity: 0.5,
            }}
          />
        )}

        {/* Textarea */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ position: 'relative' }}>
            {/* Animated placeholder */}
            {!value && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  pointerEvents: 'none',
                  color: '#9b92ae',
                  fontSize: 15,
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                <AnimatePresence mode="wait">
                  {!isFocused ? (
                    <motion.div
                      key={currentExample}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                    >
                      {EXAMPLES[currentExample]}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="focused"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      Describe any browser task in detail...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => { setIsFocused(true); setShowSuggestions(true); }}
              onBlur={() => { setTimeout(() => { setIsFocused(false); setShowSuggestions(false); }, 200); }}
              onKeyDown={handleKeyDown}
              rows={3}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                color: '#1a1028',
                resize: 'none',
                lineHeight: 1.6,
                fontWeight: 400,
                caretColor: '#9B6DFF',
                minHeight: 72,
              }}
            />
          </div>
        </div>

        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px 16px',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, color: '#6b7688' }}>Your task runs in the active browser session.</span>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Shortcut hint */}
          <div style={{ fontSize: 12, color: '#9b92ae', marginRight: 8 }}>
            ⌘ Enter
          </div>

          {/* Submit button */}
          <motion.button
            whileHover={value.trim() && !isRunning ? { scale: 1.05, y: -1 } : {}}
            whileTap={value.trim() && !isRunning ? { scale: 0.96 } : {}}
            onClick={handleSubmit}
            disabled={!value.trim() || isRunning}
            style={{
              height: 40,
              paddingLeft: 20,
              paddingRight: 20,
              borderRadius: 14,
              border: 'none',
              cursor: value.trim() && !isRunning ? 'pointer' : 'not-allowed',
              background: value.trim() && !isRunning
                ? 'linear-gradient(135deg, #FF6B6B, #FFB86B, #9B6DFF)'
                : 'rgba(155, 109, 255, 0.1)',
              color: value.trim() && !isRunning ? '#fff' : '#9b92ae',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: value.trim() && !isRunning
                ? '0 4px 16px rgba(155, 109, 255, 0.3)'
                : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Send size={15} />
            {isRunning ? 'Running...' : 'Launch Agent'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
