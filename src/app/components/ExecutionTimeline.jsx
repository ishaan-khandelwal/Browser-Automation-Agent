'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, Loader2, AlertCircle, Compass,
  MousePointerClick, Keyboard, Layers, ArrowUpDown,
  ExternalLink, CheckCheck, Clock, Globe2, ChevronDown, ChevronUp
} from 'lucide-react';

const stepVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.05, type: 'spring', stiffness: 400, damping: 28 },
  }),
  exit: { opacity: 0, x: -14, transition: { duration: 0.2 } },
};

function getActionMeta(label = '') {
  const lower = label.toLowerCase();
  if (lower.includes('navigate')) {
    return { name: 'Navigate', color: '#4285F4', bg: 'rgba(66, 133, 244, 0.1)', border: 'rgba(66, 133, 244, 0.25)', icon: Compass };
  }
  if (lower.includes('click')) {
    return { name: 'Click', color: '#9B6DFF', bg: 'rgba(155, 109, 255, 0.1)', border: 'rgba(155, 109, 255, 0.25)', icon: MousePointerClick };
  }
  if (lower.includes('type')) {
    return { name: 'Type', color: '#FFB86B', bg: 'rgba(255, 184, 107, 0.12)', border: 'rgba(255, 184, 107, 0.3)', icon: Keyboard };
  }
  if (lower.includes('tab')) {
    return { name: 'Tab', color: '#6EE7C8', bg: 'rgba(110, 231, 200, 0.12)', border: 'rgba(110, 231, 200, 0.28)', icon: Layers };
  }
  if (lower.includes('scroll')) {
    return { name: 'Scroll', color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.1)', border: 'rgba(167, 139, 250, 0.25)', icon: ArrowUpDown };
  }
  if (lower.includes('done')) {
    return { name: 'Done', color: '#3DDC97', bg: 'rgba(61, 220, 151, 0.12)', border: 'rgba(61, 220, 151, 0.3)', icon: CheckCheck };
  }
  return { name: 'Action', color: '#9b92ae', bg: 'rgba(155, 109, 255, 0.06)', border: 'rgba(155, 109, 255, 0.15)', icon: Compass };
}

function StepIcon({ status }) {
  if (status === 'done') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 9, background: 'rgba(61, 220, 151, 0.12)', border: '1px solid rgba(61, 220, 151, 0.3)', flexShrink: 0 }}>
        <CheckCircle2 size={16} style={{ color: '#3DDC97' }} strokeWidth={2.5} />
      </div>
    );
  }
  if (status === 'running') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 9, background: 'rgba(155, 109, 255, 0.12)', border: '1px solid rgba(155, 109, 255, 0.3)', flexShrink: 0 }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
          <Loader2 size={16} style={{ color: '#9B6DFF' }} strokeWidth={2.5} />
        </motion.div>
      </div>
    );
  }
  if (status === 'error' || status === 'failed') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 9, background: 'rgba(255, 107, 107, 0.12)', border: '1px solid rgba(255, 107, 107, 0.3)', flexShrink: 0 }}>
        <AlertCircle size={16} style={{ color: '#FF6B6B' }} strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 9, background: 'rgba(155, 109, 255, 0.04)', border: '1px solid rgba(155, 109, 255, 0.1)', flexShrink: 0 }}>
      <Circle size={14} style={{ color: '#9b92ae', opacity: 0.5 }} strokeWidth={2} />
    </div>
  );
}

function UrlPill({ url }) {
  const [expanded, setExpanded] = useState(false);
  if (!url || typeof url !== 'string' || (!url.startsWith('http') && !url.includes('://'))) return null;

  let hostname = url;
  try {
    hostname = new URL(url).hostname;
  } catch {}

  return (
    <div
      style={{
        marginTop: 6,
        padding: '6px 10px',
        borderRadius: 10,
        background: 'rgba(255, 255, 255, 0.75)',
        border: '1px solid rgba(155, 109, 255, 0.15)',
        fontSize: 12,
        color: '#5a4d6e',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <Globe2 size={13} style={{ color: '#4285F4', marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
        <span style={{ fontWeight: 700, color: '#1a1028', marginRight: 6 }}>{hostname}</span>
        <span style={{ color: '#9b92ae', fontSize: 11 }}>
          {expanded ? url : (url.length > 65 ? url.slice(0, 65) + '...' : url)}
        </span>
      </div>
      {url.length > 65 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B6DFF', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      )}
    </div>
  );
}

export default function ExecutionTimeline({ steps, isRunning, plan = null }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [steps, isRunning]);

  const hasPlan = Boolean(plan && plan.length);
  if ((!steps || steps.length === 0) && !hasPlan) return null;

  const completedCount = steps.filter((s) => s.status === 'done').length;
  // The plan is a forecast, so the agent can need more steps than it listed.
  // Never show 100% while running: the count of steps still to come is not known.
  const expectedTotal = plan && plan.length ? Math.max(plan.length, completedCount + 1) : null;
  const progressPercent = isRunning
    ? expectedTotal
      ? Math.min(95, Math.round((completedCount / expectedTotal) * 100))
      : null
    : steps.length
      ? Math.round((completedCount / steps.length) * 100)
      : 0;
  const statusLine = isRunning
    ? expectedTotal
      ? `Step ${completedCount + 1} of about ${expectedTotal}`
      : `Step ${completedCount + 1}, working…`
    : `${completedCount} of ${steps.length} steps completed`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 24,
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 12px 40px rgba(155, 109, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(155, 109, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(255, 255, 255, 0.45)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #9B6DFF, #FF6B6B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(155, 109, 255, 0.25)',
            flexShrink: 0,
          }}
        >
          {isRunning ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
              <Loader2 size={18} color="#fff" />
            </motion.div>
          ) : (
            <CheckCheck size={18} color="#fff" />
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#1a1028', letterSpacing: '-0.02em' }}>
              Agent Execution
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: isRunning ? 'rgba(155, 109, 255, 0.12)' : 'rgba(61, 220, 151, 0.12)',
                color: isRunning ? '#9B6DFF' : '#3DDC97',
                border: isRunning ? '1px solid rgba(155, 109, 255, 0.25)' : '1px solid rgba(61, 220, 151, 0.25)',
              }}
            >
              {isRunning ? 'In Progress' : 'Completed'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#9b92ae', fontWeight: 500, marginTop: 2 }}>
            {statusLine}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {progressPercent !== null && (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9B6DFF' }}>{progressPercent}%</span>
          )}
          <div style={{ width: 110, height: 7, borderRadius: 999, background: 'rgba(155, 109, 255, 0.1)', overflow: 'hidden' }}>
            {progressPercent !== null ? (
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #3DDC97, #9B6DFF)',
                  borderRadius: 999,
                }}
              />
            ) : (
              <motion.div
                animate={{ x: ['-100%', '260%'] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  height: '100%',
                  width: '40%',
                  background: 'linear-gradient(90deg, #3DDC97, #9B6DFF)',
                  borderRadius: 999,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Expected steps, from the plan preview */}
      {plan && plan.length > 0 && (
        <div style={{ padding: '14px 24px 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {plan.map((item, index) => {
            const done = index < completedCount;
            return (
              <span
                key={`${index}-${item}`}
                title={item}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 999,
                  maxWidth: 220,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  background: done ? 'rgba(61, 220, 151, 0.12)' : 'rgba(155, 109, 255, 0.06)',
                  color: done ? '#2ba873' : '#9b92ae',
                  border: done ? '1px solid rgba(61, 220, 151, 0.28)' : '1px solid rgba(155, 109, 255, 0.15)',
                }}
              >
                {done ? '✓ ' : `${index + 1}. `}
                {item}
              </span>
            );
          })}
        </div>
      )}

      {/* Steps List */}
      <div
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxHeight: 440,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <AnimatePresence initial={false}>
          {steps.map((step, i) => {
            const meta = getActionMeta(step.label);
            const ActionIcon = meta.icon;

            // Separate action from target text
            const parts = (step.label || '').split(/\s+[·•-]\s+/);
            const actionText = parts[0] || 'Step';
            const targetText = parts.slice(1).join(' · ');

            return (
              <motion.div
                key={step.id || i}
                custom={i}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{
                  position: 'relative',
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: step.status === 'running'
                    ? 'rgba(155, 109, 255, 0.06)'
                    : 'rgba(255, 255, 255, 0.65)',
                  border: step.status === 'running'
                    ? '1px solid rgba(155, 109, 255, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <StepIcon status={step.status} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      {/* Action tag */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: meta.bg,
                          color: meta.color,
                          border: `1px solid ${meta.border}`,
                        }}
                      >
                        <ActionIcon size={11} />
                        {actionText}
                      </span>

                      {/* Step index */}
                      <span style={{ fontSize: 11, color: '#9b92ae', fontWeight: 600 }}>
                        Step #{step.id || i + 1}
                      </span>

                      {step.duration && (
                        <span style={{ fontSize: 11, color: '#9b92ae', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} />
                          {step.duration}
                        </span>
                      )}
                    </div>

                    {/* Target detail */}
                    {targetText && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#1a1028',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          lineHeight: 1.5,
                        }}
                      >
                        {targetText}
                      </div>
                    )}

                    {/* URL or detail info */}
                    {step.detail && <UrlPill url={step.detail} />}

                    {/* If detail is not a URL, display as clean note */}
                    {step.detail && !step.detail.startsWith('http') && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: '#5a4d6e',
                          background: 'rgba(155, 109, 255, 0.04)',
                          borderRadius: 8,
                          padding: '4px 8px',
                          border: '1px solid rgba(155, 109, 255, 0.1)',
                          wordBreak: 'break-all',
                        }}
                      >
                        {step.detail}
                      </div>
                    )}

                    {/* Running animated indicator */}
                    {step.status === 'running' && (
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 3, borderRadius: 999, background: 'rgba(155, 109, 255, 0.15)', overflow: 'hidden' }}>
                          <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                              height: '100%',
                              width: '40%',
                              background: 'linear-gradient(90deg, transparent, #9B6DFF, transparent)',
                              borderRadius: 999,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: '#9B6DFF', fontWeight: 600 }}>Executing...</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </motion.div>
  );
}
