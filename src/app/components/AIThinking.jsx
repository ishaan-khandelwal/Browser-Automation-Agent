'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

const NODE_COUNT = 18;
const LINK_COUNT = 22;

function seededRandom(seed) {
  let x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
  id: i,
  x: 10 + seededRandom(i * 3) * 80,
  y: 10 + seededRandom(i * 3 + 1) * 80,
  size: 4 + seededRandom(i * 3 + 2) * 8,
  delay: seededRandom(i * 2) * 3,
  color: ['#FF6B6B', '#9B6DFF', '#3DDC97', '#FFB86B', '#6EE7C8'][i % 5],
}));

const links = Array.from({ length: LINK_COUNT }, (_, i) => ({
  from: Math.floor(seededRandom(i * 7) * NODE_COUNT),
  to: Math.floor(seededRandom(i * 7 + 1) * NODE_COUNT),
})).filter(l => l.from !== l.to);

const THINKING_STATES = [
  { label: 'Initializing neural pathways...', color: '#9B6DFF' },
  { label: 'Planning approach...', color: '#FF6B6B' },
  { label: 'Reasoning about context...', color: '#FFB86B' },
  { label: 'Reading webpage structure...', color: '#3DDC97' },
  { label: 'Verifying actions...', color: '#6EE7C8' },
  { label: 'Extracting information...', color: '#9B6DFF' },
];

export default function AIThinking({ thinkingState = 0 }) {
  const svgRef = useRef(null);
  const state = THINKING_STATES[thinkingState % THINKING_STATES.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 24,
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 8px 40px rgba(155, 109, 255, 0.08)',
        overflow: 'hidden',
        padding: 24,
      }}
    >
      {/* Neural network visualization */}
      <div style={{ position: 'relative', height: 200 }}>
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          style={{ width: '100%', height: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Links */}
          {links.map((link, i) => {
            const from = nodes[link.from];
            const to = nodes[link.to];
            return (
              <motion.line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={state.color}
                strokeWidth={0.4}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.5, 0.1] }}
                transition={{
                  duration: 2 + seededRandom(i * 4) * 2,
                  repeat: Infinity,
                  delay: seededRandom(i * 4 + 1) * 3,
                  ease: 'easeInOut',
                }}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <motion.circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={node.size / 10}
              fill={node.color}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.5 + node.delay * 0.5,
                repeat: Infinity,
                delay: node.delay * 0.4,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Traveling particles along links */}
          {links.slice(0, 8).map((link, i) => {
            const from = nodes[link.from];
            const to = nodes[link.to];
            return (
              <motion.circle
                key={`particle-${i}`}
                r={0.8}
                fill={state.color}
                animate={{
                  cx: [from.x, to.x, from.x],
                  cy: [from.y, to.y, from.y],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + seededRandom(i * 5) * 2,
                  repeat: Infinity,
                  delay: seededRandom(i * 5 + 2) * 3,
                  ease: 'easeInOut',
                }}
              />
            );
          })}
        </svg>

        {/* Center glow */}
        <motion.div
          animate={{
            background: [
              `radial-gradient(circle, ${state.color}30 0%, transparent 70%)`,
              `radial-gradient(circle, ${state.color}15 0%, transparent 70%)`,
              `radial-gradient(circle, ${state.color}30 0%, transparent 70%)`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          style={{ textAlign: 'center', marginTop: 8 }}
        >
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: state.color,
              letterSpacing: '-0.01em',
            }}
          >
            {state.label}
          </motion.div>
          <div style={{ fontSize: 12, color: '#9b92ae', marginTop: 4 }}>
            Neural network processing...
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Processing bars */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {['Attention', 'Memory', 'Reasoning', 'Planning'].map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#9b92ae', width: 64, fontWeight: 500 }}>{label}</span>
            <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'rgba(155, 109, 255, 0.1)', overflow: 'hidden' }}>
              <motion.div
                animate={{
                  width: ['20%', '95%', '40%', '80%', '60%'],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.5,
                }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${['#FF6B6B', '#9B6DFF', '#3DDC97', '#FFB86B'][i]}, ${['#FFB86B', '#6EE7C8', '#9B6DFF', '#FF6B6B'][i]})`,
                  borderRadius: 999,
                }}
              />
            </div>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              style={{ fontSize: 11, color: ['#FF6B6B', '#9B6DFF', '#3DDC97', '#FFB86B'][i], width: 30, textAlign: 'right', fontWeight: 600 }}
            >
              {['87%', '94%', '72%', '81%'][i]}
            </motion.span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
