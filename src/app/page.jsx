'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createTask, openTaskStream, cancelTask, approveTask, rejectTask } from './lib/api';
import { useAuth } from './lib/auth-context';

import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import HeroSection from './components/HeroSection';
import PromptInput from './components/PromptInput';
import ExecutionTimeline from './components/ExecutionTimeline';
import QuestionCard from './components/QuestionCard';
import AIThinking from './components/AIThinking';
import StatsCards from './components/StatsCards';
import RecentSessions from './components/RecentSessions';
import ChromeConnectionCard from './components/ChromeConnectionCard';
import RightPanel from './components/RightPanel';
import AuthModal from './components/AuthModal';

// A dropped live feed is retried this many times, one second further apart each
// time, before the page says the connection was lost.
const MAX_RECONNECTS = 3;

// The agent hands the browser to the person with a `wait` whose target says
// why (the backend's HANDOFF_* constants). Each gets its own wording: a
// payment shown as "Sign-in needed" was waved through by someone already
// signed in, and the booking stopped at the payment page.
const HANDOFFS = {
  'for you to pay': {
    title: '💳 Payment needed: pay in the browser window',
    approve: "I've paid, continue",
    reject: 'Stop without paying',
    border: 'rgba(155, 109, 255, 0.45)',
    background: 'rgba(155, 109, 255, 0.10)',
  },
  'for you to sign in or sign up': {
    title: '🔑 Sign-in needed',
    approve: "I've signed in, continue",
    reject: 'Stop the task',
  },
  'for you to fill in details': {
    title: '📝 Details needed',
    approve: "I've filled them in, continue",
    reject: 'Stop the task',
  },
};

function handoffFor(approval) {
  const action = approval.proposedAction || {};
  const known = action.action === 'wait' ? HANDOFFS[action.target] : null;
  return {
    isHandoff: Boolean(known),
    title: `Approval needed (${approval.riskLevel})`,
    approve: 'Approve',
    reject: 'Reject',
    border: 'rgba(255, 184, 107, 0.5)',
    background: 'rgba(255, 184, 107, 0.12)',
    ...(known || {}),
  };
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [chromeConnected, setChromeConnected] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState([]);
  const [plan, setPlan] = useState(null);
  const [currentTask, setCurrentTask] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [thinkingState, setThinkingState] = useState(0);
  const [agentState, setAgentState] = useState({ goal: null, url: null, elements: null, reasoningSteps: null, toolCalls: null });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [taskError, setTaskError] = useState(null);
  const [finalAnswer, setFinalAnswer] = useState(null);
  const [approval, setApproval] = useState(null);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);

  const thinkingInterval = useRef(null);
  const wsRef = useRef(null);
  // The live feed's bookkeeping. Only a `final` event means the task is over;
  // a socket closing does not, so these say whether to reconnect and from where.
  const streamTaskRef = useRef(null);
  const finishedRef = useRef(false);
  const lastStepRef = useRef(0);
  const reconnectsRef = useRef(0);
  const { user } = useAuth();

  // ── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(thinkingInterval.current);
      wsRef.current?.close();
    };
  }, []);

  // ── Handle WS event ─────────────────────────────────────────────────────
  // Event shapes are the backend's section 6.1 bodies: status, step, recovery,
  // approval_required, approval_resolved, final, error. Steps are keyed by
  // stepNumber; `seq` is 0 on replayed events so it cannot be an identity.
  const handleWsEvent = useCallback((event) => {
    switch (event.type) {
      case 'plan':
        setPlan(Array.isArray(event.steps) ? event.steps : null);
        break;
      case 'step': {
        lastStepRef.current = Math.max(lastStepRef.current, event.stepNumber || 0);
        const label = [event.action, event.target].filter(Boolean).join(' · ');
        const newStep = {
          id: event.stepNumber,
          label: label || `Step ${event.stepNumber}`,
          detail: event.value || event.url || null,
          status: event.verified === false ? 'error' : 'done',
          duration: null,
        };
        setSteps((prev) =>
          prev.some((s) => s.id === newStep.id)
            ? prev.map((s) => (s.id === newStep.id ? newStep : s))
            : [...prev, newStep]
        );
        setAgentState((p) => ({
          ...p,
          url: event.url || p.url,
          reasoningSteps: event.reasoning ? [...(p.reasoningSteps || []), event.reasoning] : p.reasoningSteps,
          toolCalls: [...(p.toolCalls || []), { name: event.action, args: event.target || '' }],
        }));
        break;
      }
      case 'recovery':
        setAgentState((p) => ({
          ...p,
          reasoningSteps: [...(p.reasoningSteps || []), `Recovery (${event.strategy}): ${event.outcome}`],
        }));
        break;
      case 'approval_required':
        setApproval(event);
        break;
      case 'approval_resolved':
        setApproval(null);
        break;
      case 'final':
        finishedRef.current = true;
        clearInterval(thinkingInterval.current);
        setIsRunning(false);
        setApproval(null);
        if (event.finalAnswer) setFinalAnswer(event.finalAnswer);
        if (event.status !== 'COMPLETED') setTaskError(event.failureReason || `Task ${String(event.status).toLowerCase().replace('_', ' ')}`);
        break;
      case 'error':
        finishedRef.current = true;
        clearInterval(thinkingInterval.current);
        setIsRunning(false);
        setTaskError(event.message || 'Task failed');
        break;
      default:
        break; // status, heartbeat: nothing to render
    }
  }, []);

  // ── Live feed ────────────────────────────────────────────────────────────
  // A socket that closes before the `final` event is not the task finishing:
  // the backend restarting or a failed catch-up drops it while the agent works
  // on. Reconnect, catching up from the last step seen, and only after a few
  // failures say the connection was lost. Never "Task Completed".
  const connectStream = useCallback((taskId) => {
    const live = () => streamTaskRef.current === taskId && !finishedRef.current;

    const retry = () => {
      if (!live()) return;
      if (reconnectsRef.current >= MAX_RECONNECTS) {
        clearInterval(thinkingInterval.current);
        setIsRunning(false);
        setConnectionLost(true);
        return;
      }
      reconnectsRef.current += 1;
      setTimeout(open, 1000 * reconnectsRef.current);
    };

    async function open() {
      if (!live()) return;
      let closed = false;
      try {
        wsRef.current = await openTaskStream(taskId, {
          afterStep: lastStepRef.current,
          onEvent: (event) => {
            // The feed is working again; a later drop gets its retries back.
            reconnectsRef.current = 0;
            handleWsEvent(event);
          },
          // The browser fires both `error` and `close` for one failure.
          onClose: () => { if (!closed) { closed = true; retry(); } },
        });
      } catch {
        retry();
      }
    }

    return open();
  }, [handleWsEvent]);

  // ── Launch agent ─────────────────────────────────────────────────────────
  const handleLaunch = useCallback(async (task) => {
    if (isRunning) return;
    if (!user) { setShowAuthModal(true); return; }

    // Any feed still open belongs to the last task, and must not retry into this one.
    streamTaskRef.current = null;
    wsRef.current?.close();
    finishedRef.current = false;
    lastStepRef.current = 0;
    reconnectsRef.current = 0;

    setCurrentTask(task);
    setIsRunning(true);
    setActiveView('agent');
    setSteps([]);
    setPlan(null);
    setTaskError(null);
    setFinalAnswer(null);
    setApproval(null);
    setConnectionLost(false);
    setAgentState({ goal: task, url: null, elements: null, reasoningSteps: null, toolCalls: null });

    // Thinking animation
    thinkingInterval.current = setInterval(() => {
      setThinkingState((prev) => (prev + 1) % 6);
    }, 2500);

    try {
      // 1. Create task on backend
      const taskResponse = await createTask({ instruction: task });
      const taskId = taskResponse?.id;
      setCurrentTaskId(taskId);

      if (!taskId) throw new Error('No task ID returned from server');

      // 2. Open the live feed, which reconnects by itself if it drops.
      streamTaskRef.current = taskId;
      await connectStream(taskId);

    } catch (err) {
      clearInterval(thinkingInterval.current);
      setIsRunning(false);
      setTaskError(err.message || 'Failed to start task');
      // Fallback: show demo steps so UI is not empty
      setSteps([
        { id: 1, label: 'Could not connect to backend', detail: err.message, status: 'failed', duration: null },
      ]);
    }
  }, [isRunning, user, connectStream]);

  // ── Cancel task ──────────────────────────────────────────────────────────
  const handleCancel = useCallback(async () => {
    if (currentTaskId) {
      try { await cancelTask(currentTaskId); } catch {}
    }
    streamTaskRef.current = null; // closing it ourselves is not a drop to retry
    wsRef.current?.close();
    clearInterval(thinkingInterval.current);
    setIsRunning(false);
  }, [currentTaskId]);

  const handleDecision = useCallback(async (approve, answer) => {
    if (!currentTaskId) return;
    setApprovalBusy(true);
    try {
      await (approve ? approveTask : rejectTask)(currentTaskId, answer);
      setApproval(null);
    } catch (err) {
      setTaskError(err.message || 'Could not send your decision');
    } finally {
      setApprovalBusy(false);
    }
  }, [currentTaskId]);

  const SIDEBAR_W = sidebarExpanded ? 224 : 68;
  const RIGHT_W = 300;
  const TOP_NAV_H = 68;

  return (
    <>
      {/* Auth modal */}
      <AnimatePresence>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </AnimatePresence>

      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((p) => !p)}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <TopNav sidebarExpanded={sidebarExpanded} onLoginClick={() => setShowAuthModal(true)} />

      {/* Right panel */}
      <motion.aside
        className="app-inspector"
        animate={{ right: 0, width: RIGHT_W }}
        style={{
          position: 'fixed', top: 0, bottom: 0, right: 0, width: RIGHT_W,
          padding: `${TOP_NAV_H + 20}px 16px 0 0`, zIndex: 80, overflowY: 'auto',
        }}
      >
        <RightPanel agentState={agentState} isRunning={isRunning} />
      </motion.aside>

      {/* Main content */}
      <main
        className="app-main"
        style={{
          marginLeft: SIDEBAR_W, marginRight: RIGHT_W,
          paddingTop: TOP_NAV_H + 16, paddingLeft: 28, paddingRight: 28,
          minHeight: '100vh', position: 'relative', zIndex: 10,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <AnimatePresence mode="wait">
          {/* ── DASHBOARD ── */}
          {activeView === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}>
              <HeroSection onLaunch={handleLaunch} />
              <div style={{ marginTop: 32 }}><StatsCards /></div>
              <div style={{ marginTop: 24 }}><RecentSessions /></div>
            </motion.div>
          )}

          {/* ── AGENT VIEW ── */}
          {activeView === 'agent' && (
            <motion.div key="agent" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1028', letterSpacing: '-0.04em', marginBottom: 4 }}>
                      {isRunning ? 'Agent Running...' : connectionLost ? 'Connection Lost' : taskError ? 'Task Failed ✗' : 'Task Completed ✓'}
                    </h1>
                    {currentTask && <p style={{ fontSize: 14, color: '#9b92ae', fontWeight: 500 }}>&ldquo;{currentTask}&rdquo;</p>}
                    {taskError && <p style={{ fontSize: 13, color: '#FF6B6B', marginTop: 4, fontWeight: 500 }}>{taskError}</p>}
                    {connectionLost && (
                      <p style={{ fontSize: 13, color: '#FFB86B', marginTop: 4, fontWeight: 500 }}>
                        Lost the live connection to the agent. The task may still be running; check Sessions for its status.
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {isRunning && (
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handleCancel} style={{ padding: '8px 18px', borderRadius: 12, border: '1px solid rgba(255, 107, 107, 0.3)', background: 'rgba(255, 107, 107, 0.06)', color: '#FF6B6B', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        ✕ Cancel
                      </motion.button>
                    )}
                    <motion.button whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }} onClick={() => setActiveView('dashboard')} style={{ padding: '8px 18px', borderRadius: 12, border: '1px solid rgba(155, 109, 255, 0.2)', background: 'rgba(155, 109, 255, 0.06)', color: '#9B6DFF', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      ← Back
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Compact Connection Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 18px',
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    fontSize: 12,
                    color: '#5a4d6e',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative', width: 8, height: 8 }}>
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#3DDC97', opacity: 0.4 }} />
                      <div style={{ position: 'absolute', inset: 1, borderRadius: '50%', background: '#3DDC97' }} />
                    </div>
                    <span style={{ fontWeight: 700, color: '#1a1028' }}>Chromium Browser Connected</span>
                    <span style={{ color: '#9b92ae' }}>•</span>
                    <span style={{ color: '#9b92ae' }}>Headful Desktop Mode</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 11, color: '#9B6DFF', fontWeight: 600 }}>Gemini 2.5 Flash</span>
                    <span style={{ fontSize: 11, color: '#3DDC97', fontWeight: 700, background: 'rgba(61,220,151,0.1)', padding: '2px 8px', borderRadius: 999 }}>Active</span>
                  </div>
                </div>

                {approval && approval.proposedAction?.target === 'question' && (
                  <QuestionCard
                    approval={approval}
                    busy={approvalBusy}
                    onAnswer={(text) => handleDecision(true, text)}
                    onSkip={() => handleDecision(false)}
                  />
                )}

                {approval && approval.proposedAction?.target !== 'question' && (() => {
                  const handoff = handoffFor(approval);
                  return (
                    <div style={{ padding: 18, borderRadius: 18, border: `1px solid ${handoff.border}`, background: handoff.background }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1028', marginBottom: 4 }}>
                        {handoff.title}
                      </div>
                      <div style={{ fontSize: 14, color: '#1a1028', marginBottom: 12, lineHeight: 1.5 }}>
                        {approval.reason || 'The agent wants to do something irreversible.'}
                        {!handoff.isHandoff && (
                          <code style={{ display: 'block', marginTop: 8, fontSize: 12, color: '#5a4d6e' }}>{JSON.stringify(approval.proposedAction)}</code>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button disabled={approvalBusy} onClick={() => handleDecision(true)} style={{ padding: '8px 18px', borderRadius: 12, border: 'none', background: '#3DDC97', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{handoff.approve}</button>
                        <button disabled={approvalBusy} onClick={() => handleDecision(false)} style={{ padding: '8px 18px', borderRadius: 12, border: '1px solid rgba(255,107,107,0.4)', background: 'transparent', color: '#FF6B6B', fontWeight: 600, cursor: 'pointer' }}>{handoff.reject}</button>
                      </div>
                    </div>
                  );
                })()}

                {finalAnswer && (
                  <div style={{ padding: 18, borderRadius: 18, border: '1px solid rgba(61, 220, 151, 0.4)', background: 'rgba(61, 220, 151, 0.08)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#3DDC97', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Answer</div>
                    <div style={{ fontSize: 15, color: '#1a1028', fontWeight: 500, whiteSpace: 'pre-wrap' }}>{finalAnswer}</div>
                  </div>
                )}

                {/* Timeline and Thinking section */}
                <div style={{ display: 'grid', gridTemplateColumns: isRunning && steps.length > 0 ? '1fr 1.4fr' : '1fr', gap: 20 }}>
                  <AnimatePresence>
                    {isRunning && (
                      <motion.div key="thinking" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
                        <AIThinking thinkingState={thinkingState} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {(steps.length > 0 || plan) && <ExecutionTimeline steps={steps} isRunning={isRunning} plan={plan} />}
                </div>

                {/* Instruction input below */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#5a4d6e', marginBottom: 8 }}>
                    {isRunning ? 'Queue Next Instruction' : 'Run Another Task'}
                  </div>
                  <PromptInput onSubmit={handleLaunch} isRunning={isRunning} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SESSIONS ── */}
          {activeView === 'sessions' && (
            <motion.div key="sessions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1028', letterSpacing: '-0.04em', marginBottom: 4 }}>Sessions</h1>
                <p style={{ fontSize: 14, color: '#9b92ae' }}>All your automation runs</p>
              </div>
              <StatsCards />
              <div style={{ marginTop: 24 }}><RecentSessions /></div>
            </motion.div>
          )}

          {/* ── HISTORY ── */}
          {activeView === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1028', letterSpacing: '-0.04em', marginBottom: 4 }}>History</h1>
                <p style={{ fontSize: 14, color: '#9b92ae' }}>Review past automation sessions</p>
              </div>
              <RecentSessions />
            </motion.div>
          )}

          {/* ── OTHER ── */}
          {!['dashboard', 'agent', 'sessions', 'history'].includes(activeView) && (
            <motion.div key="other" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', textAlign: 'center' }}>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: 64, marginBottom: 20 }}>🚀</motion.div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1028', marginBottom: 8, letterSpacing: '-0.03em' }}>Coming Soon</h2>
              <p style={{ fontSize: 14, color: '#9b92ae', maxWidth: 300 }}>This section is under development. Check back soon!</p>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </>
  );
}
