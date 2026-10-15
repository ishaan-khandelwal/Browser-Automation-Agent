'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Globe, Target, Code2, Cpu, ExternalLink, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

function PanelCard({ icon, title, color, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 350, damping: 28 }}
      style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 20px rgba(155, 109, 255, 0.06)',
        padding: '16px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1028', letterSpacing: '-0.01em' }}>
          {title}
        </span>
      </div>
      {children}
    </motion.div>
  );
}

function EmptyState({ text, isRunning }) {
  return (
    <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#9b92ae', fontSize: 12 }}>
      {isRunning ? (
        <>
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#9B6DFF' }}
          />
          <span>Waiting for activity...</span>
        </>
      ) : (
        <span>{text}</span>
      )}
    </div>
  );
}

export default function RightPanel({ agentState, isRunning }) {
  const { goal, url, elements, reasoningSteps, toolCalls } = agentState || {};

  let domain = '';
  if (url && typeof url === 'string') {
    try {
      domain = new URL(url).hostname;
    } catch {}
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: 40,
        paddingRight: 4,
      }}
    >
      {/* Current Goal */}
      <PanelCard
        icon={<Target size={14} color="#FF6B6B" />}
        title="Current Goal"
        color="#FF6B6B"
        delay={0}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={goal || 'none'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              fontSize: 13,
              color: '#3a2d52',
              lineHeight: 1.5,
              fontWeight: 500,
              background: 'rgba(255, 107, 107, 0.05)',
              borderRadius: 12,
              padding: '10px 12px',
              border: '1px solid rgba(255, 107, 107, 0.15)',
            }}
          >
            {goal || 'No active task. Enter a prompt to launch the browser agent.'}
          </motion.div>
        </AnimatePresence>
      </PanelCard>

      {/* Browser State */}
      <PanelCard
        icon={<Globe size={14} color="#4285F4" />}
        title="Active Browser"
        color="#4285F4"
        delay={0.04}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#9b92ae', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Current URL
            </span>
            <div
              style={{
                fontSize: 12,
                color: '#1a1028',
                background: 'rgba(66, 133, 244, 0.06)',
                borderRadius: 10,
                padding: '8px 10px',
                border: '1px solid rgba(66, 133, 244, 0.15)',
                wordBreak: 'break-all',
                overflowWrap: 'anywhere',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {url ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#4285F4' }}>{domain || 'Active Page'}</span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#4285F4', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <span style={{ fontSize: 11, color: '#5a4d6e', lineHeight: 1.4 }}>
                    {url.length > 80 ? url.slice(0, 80) + '...' : url}
                  </span>
                </>
              ) : (
                <span style={{ color: '#9b92ae' }}>Browser idle</span>
              )}
            </div>
          </div>

          {elements && elements.length > 0 && (
            <div>
              <span style={{ fontSize: 11, color: '#9b92ae', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Observed Elements
              </span>
              <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {elements.slice(0, 10).map((el, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      background: 'rgba(155, 109, 255, 0.08)',
                      borderRadius: 6,
                      padding: '2px 7px',
                      color: '#9B6DFF',
                      fontWeight: 500,
                      border: '1px solid rgba(155, 109, 255, 0.15)',
                    }}
                  >
                    {el}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </PanelCard>

      {/* Reasoning Steps */}
      <PanelCard
        icon={<Brain size={14} color="#3DDC97" />}
        title="Agent Reasoning"
        color="#3DDC97"
        delay={0.08}
      >
        {reasoningSteps && reasoningSteps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {reasoningSteps.map((step, i) => {
              const isLatest = i === reasoningSteps.length - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: 'flex',
                    gap: 8,
                    fontSize: 12,
                    color: '#3a2d52',
                    lineHeight: 1.5,
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: isLatest && isRunning ? 'rgba(61, 220, 151, 0.08)' : 'transparent',
                    border: isLatest && isRunning ? '1px solid rgba(61, 220, 151, 0.2)' : 'none',
                  }}
                >
                  <span style={{ color: '#3DDC97', flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
                  <span style={{ flex: 1, overflowWrap: 'anywhere' }}>{step}</span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState text="No reasoning logged yet" isRunning={isRunning} />
        )}
      </PanelCard>

      {/* Tool Calls */}
      <PanelCard
        icon={<Code2 size={14} color="#FFB86B" />}
        title="Browser Actions"
        color="#FFB86B"
        delay={0.12}
      >
        {toolCalls && toolCalls.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            {toolCalls.map((call, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  background: 'rgba(255, 184, 107, 0.06)',
                  borderRadius: 8,
                  padding: '6px 8px',
                  border: '1px solid rgba(255, 184, 107, 0.2)',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: '#1a1028',
                  overflowWrap: 'anywhere',
                }}
              >
                <span style={{ color: '#FF6B6B', fontWeight: 700 }}>{call.name}</span>
                {call.args && (
                  <span style={{ color: '#7a6f8a', marginLeft: 4 }}>
                    ({call.args.length > 35 ? call.args.slice(0, 35) + '...' : call.args})
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState text="No browser actions yet" isRunning={isRunning} />
        )}
      </PanelCard>

      {/* System Status */}
      <PanelCard
        icon={<Cpu size={14} color="#9B6DFF" />}
        title="Engine"
        color="#9B6DFF"
        delay={0.16}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#9b92ae' }}>Model</span>
            <span style={{ fontWeight: 700, color: '#9B6DFF' }}>Gemini 2.5 Flash</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#9b92ae' }}>Browser Mode</span>
            <span style={{ fontWeight: 700, color: '#3DDC97' }}>Headful (Chromium)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#9b92ae' }}>WebSocket</span>
            <span style={{ fontWeight: 700, color: '#3DDC97' }}>Connected :8000</span>
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
