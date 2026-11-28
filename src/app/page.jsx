'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, ShieldCheck, CreditCard, KeyRound, PenLine, CheckCircle2, WifiOff, Copy, Check } from 'lucide-react';
import { createTask, openTaskStream, cancelTask, approveTask, rejectTask } from './lib/api';
import { useAuth } from './lib/auth-context';

import Scene3D from './components/Scene3D';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import HeroSection from './components/HeroSection';
import PromptInput from './components/PromptInput';
import LiveBrowser from './components/LiveBrowser';
import ExecutionTimeline from './components/ExecutionTimeline';
import QuestionCard from './components/QuestionCard';
import ApprovalCard from './components/ApprovalCard';
import AIThinking from './components/AIThinking';
import StatsCards from './components/StatsCards';
import RecentSessions from './components/RecentSessions';
import RightPanel from './components/RightPanel';
import AuthModal from './components/AuthModal';
import Reveal from './components/Reveal';
import Toasts, { useToasts } from './components/Toasts';

// A dropped live feed is retried this many times, one second further apart each
// time, before the page says the connection was lost.
const MAX_RECONNECTS = 3;

// Statuses that mean the run is over.
const TERMINAL = new Set(['COMPLETED', 'EXECUTION_FAILED', 'REJECTED', 'TIMED_OUT', 'CANCELLED']);

// Ends the person chose: declining an approval or a question ends a task as
// REJECTED, and cancelling as CANCELLED. Reporting those as "Task failed" in red
// tells someone their own decision was an error.
const STOPPED_BY_YOU = new Set(['REJECTED', 'CANCELLED']);

function answerText(finalAnswer) {
  if (!finalAnswer) return null;
  if (typeof finalAnswer === 'string') return finalAnswer;
  return finalAnswer.text || finalAnswer.answer || JSON.stringify(finalAnswer);
}

export default function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [isRunning, setIsRunning] = useState(false);

  // Run state, all of it fed by the stream.
  const [steps, setSteps] = useState([]);
  const [frames, setFrames] = useState([]);
  const [plan, setPlan] = useState(null);
  const [reasoning, setReasoning] = useState([]);
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentTask, setCurrentTask] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [agentState, setAgentState] = useState({ goal: null, url: null, elements: null, toolCalls: null, recoveries: 0 });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [taskError, setTaskError] = useState(null);
  // Set when the person ended the run themselves: { status, reason }.
  const [stopped, setStopped] = useState(null);
  const [finalAnswer, setFinalAnswer] = useState(null);
  const [approval, setApproval] = useState(null);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const [focusNonce, setFocusNonce] = useState(0);
  const [copied, setCopied] = useState(false);

  const { toasts, push, dismiss } = useToasts();

  const wsRef = useRef(null);
  // The live feed's bookkeeping. Only a `final` event means the task is over;
  // a socket closing does not, so these say whether to reconnect and from where.
  const streamTaskRef = useRef(null);
  const finishedRef = useRef(false);
  const lastStepRef = useRef(0);
  const reconnectsRef = useRef(0);
  const { user } = useAuth();

  useEffect(() => () => { wsRef.current?.close(); }, []);

  // The steps column sticks just below the run header, which is sticky too and
  // wraps to a different height at different widths. Measured here, not
  // guessed in CSS, so the column never slides under it. A callback ref rather
  // than an effect: the agent view mounts only after the previous view's exit
  // animation, so an effect keyed on the view would find no header yet.
  const headObserverRef = useRef(null);
  const runHeaderRef = useCallback((node) => {
    headObserverRef.current?.disconnect();
    headObserverRef.current = null;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const scope = node.parentElement;
    const apply = () => {
      scope?.style.setProperty('--run-head-h', `${Math.round(node.getBoundingClientRect().height)}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    headObserverRef.current = observer;
  }, []);
  useEffect(() => () => headObserverRef.current?.disconnect(), []);

  // Views differ a lot in height, so keeping the old scroll position can land
  // you on blank space below a shorter one.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeView]);

  // ── Handle one stream event ──────────────────────────────────────────────
  // Shapes are the backend's documented event bodies: status, plan, step,
  // recovery, approval_required, approval_resolved, final, error. Steps are
  // keyed by stepNumber; `seq` is -1 on replayed events so it cannot be an
  // identity.
  const handleWsEvent = useCallback((event) => {
    switch (event.type) {
      case 'status':
        setStatus(event.status);
        break;

      case 'plan':
        setPlan(Array.isArray(event.steps) ? event.steps : null);
        break;

      case 'step': {
        const n = event.stepNumber || 0;
        lastStepRef.current = Math.max(lastStepRef.current, n);

        // A committed step means it is acting, whatever the last status event
        // said. Without this the page keeps reading "Planning" while steps
        // stream in, because the next status event may be some way off.
        setStatus((s) => (s === 'PLANNING' || s === 'SUBMITTED' ? 'ACTING' : s));

        const next = {
          id: n,
          action: event.action,
          target: event.target || null,
          value: event.value || null,
          url: event.url || null,
          reasoning: event.reasoning || null,
          verified: event.verified,
          usedVision: event.usedVision,
          replayed: event.replayed,
          confidence: event.confidence,
          status: event.verified === false ? 'error' : 'done',
        };

        setSteps((prev) => {
          const at = prev.findIndex((s) => s.id === n);
          if (at === -1) return [...prev, next];
          const copy = [...prev];
          copy[at] = { ...prev[at], ...next };
          return copy;
        });

        // A replayed step above the screenshot cutover arrives without an
        // image; keep the frame anyway so the strip has no holes.
        setFrames((prev) => {
          const frame = {
            step: n,
            action: event.action,
            target: event.target || null,
            value: event.value || null,
            screenshot: event.screenshot || null,
            bbox: event.bbox || null,
            viewport: event.viewport || null,
            url: event.url || null,
          };
          const at = prev.findIndex((f) => f.step === n);
          if (at === -1) return [...prev, frame];
          const copy = [...prev];
          copy[at] = frame;
          return copy;
        });

        if (event.reasoning) setReasoning((prev) => [...prev, event.reasoning]);

        setAgentState((p) => ({
          ...p,
          url: event.url || p.url,
          toolCalls: [...(p.toolCalls || []), { name: event.action, args: event.target || '' }],
        }));
        break;
      }

      case 'recovery': {
        const label = `${event.strategy} · ${String(event.outcome || '').toLowerCase()}`;
        setSteps((prev) => prev.map((s) => (
          s.id === event.stepNumber
            ? { ...s, recoveries: [...(s.recoveries || []), label] }
            : s
        )));
        setAgentState((p) => ({ ...p, recoveries: (p.recoveries || 0) + 1 }));
        setReasoning((prev) => [...prev, `Step ${event.stepNumber} did not take. Trying "${event.strategy}" (attempt ${event.attemptNumber}).`]);
        break;
      }

      case 'approval_required':
        setApproval(event);
        setStatus('AWAITING_APPROVAL');
        setSteps((prev) => prev.map((s) => (s.id === event.stepNumber ? { ...s, awaiting: true } : s)));
        // A run can sit here for minutes, so say so even if the tab is not the
        // one being looked at.
        push({
          tone: 'warn',
          title: 'The agent needs you',
          body: event.reason || 'It stopped before an action it cannot undo.',
        });
        break;

      case 'approval_resolved':
        setApproval(null);
        setSteps((prev) => prev.map((s) => ({ ...s, awaiting: false })));
        break;

      case 'final':
        finishedRef.current = true;
        setIsRunning(false);
        setApproval(null);
        setStatus(event.status);
        setStats(event.stats || null);
        setSteps((prev) => prev.map((s) => ({ ...s, awaiting: false })));
        if (event.finalAnswer) setFinalAnswer(answerText(event.finalAnswer));
        if (event.status === 'COMPLETED') {
          push({
            tone: 'good',
            title: 'Task completed',
            body: answerText(event.finalAnswer) || `${event.stats?.steps ?? 0} steps.`,
          });
        } else if (STOPPED_BY_YOU.has(event.status)) {
          // No toast: they have just pressed the button themselves.
          setStopped({ status: event.status, reason: event.failureReason || null });
        } else {
          const why = event.failureReason || `Task ${String(event.status).toLowerCase().replace(/_/g, ' ')}`;
          setTaskError(why);
          push({ tone: 'bad', title: 'The run did not finish', body: why });
        }
        break;

      case 'error':
        finishedRef.current = true;
        setIsRunning(false);
        setTaskError(event.message || 'Task failed');
        push({ tone: 'bad', title: 'Stream error', body: event.message || 'Task failed' });
        break;

      default:
        break; // heartbeat and anything new: nothing to render
    }
  }, [push]);

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

  // ── Launch ───────────────────────────────────────────────────────────────
  const handleLaunch = useCallback(async ({ instruction, startUrl } = {}) => {
    const task = typeof instruction === 'string' ? instruction : '';
    if (!task.trim() || isRunning) return;
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
    setFrames([]);
    setPlan(null);
    setReasoning([]);
    setStats(null);
    setStatus('SUBMITTED');
    setSelectedStep(null);
    setTaskError(null);
    setStopped(null);
    setFinalAnswer(null);
    setApproval(null);
    setConnectionLost(false);
    setAgentState({ goal: task, url: startUrl || null, elements: null, toolCalls: null, recoveries: 0 });

    try {
      const taskResponse = await createTask({ instruction: task, startUrl });
      const taskId = taskResponse?.id;
      setCurrentTaskId(taskId);
      if (!taskId) throw new Error('No task ID returned from server');

      streamTaskRef.current = taskId;
      await connectStream(taskId);
    } catch (err) {
      setIsRunning(false);
      setStatus(null);
      setTaskError(err.message || 'Could not start the task');
    }
  }, [isRunning, user, connectStream]);

  const handleCancel = useCallback(async () => {
    if (currentTaskId) {
      try { await cancelTask(currentTaskId); } catch { /* the final event still settles it */ }
    }
    streamTaskRef.current = null; // closing it ourselves is not a drop to retry
    wsRef.current?.close();
    setIsRunning(false);
    setStatus('CANCELLED');
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

  const handleNewTask = useCallback(() => {
    setActiveView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFocusNonce((n) => n + 1);
  }, []);

  const copyAnswer = useCallback(async () => {
    if (!finalAnswer) return;
    try {
      await navigator.clipboard.writeText(finalAnswer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      push({ tone: 'bad', title: 'Could not copy', body: 'Your browser blocked clipboard access.' });
    }
  }, [finalAnswer, push]);

  // What the page calls the run right now.
  const headline = useMemo(() => {
    if (isRunning) return status === 'AWAITING_APPROVAL' ? 'Waiting for you' : 'Agent running';
    if (connectionLost) return 'Connection lost';
    if (taskError) return 'Task failed';
    if (status && TERMINAL.has(status)) return status === 'COMPLETED' ? 'Task completed' : 'Task stopped';
    return 'Agent';
  }, [isRunning, connectionLost, taskError, status]);

  const needsYou = approval ? 1 : 0;
  const isQuestion = approval?.proposedAction?.target === 'question';

  return (
    <>
      <Scene3D />

      <AnimatePresence>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </AnimatePresence>

      <Toasts toasts={toasts} onDismiss={dismiss} />

      <div className="shell">
        <Sidebar
          expanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded((p) => !p)}
          activeView={activeView}
          onViewChange={setActiveView}
          onNewTask={handleNewTask}
          needsYou={needsYou}
          isRunning={isRunning}
        />

        <TopNav
          sidebarExpanded={sidebarExpanded}
          onLoginClick={() => setShowAuthModal(true)}
          activeView={activeView}
          onViewChange={setActiveView}
          isRunning={isRunning}
          stepsDone={steps.length}
          stepsTotal={Array.isArray(plan) ? Math.max(plan.length, steps.length) : steps.length}
        />

        <main className={`main${sidebarExpanded ? ' rail-open' : ''}`}>
          <div className="main-inner">
            <AnimatePresence mode="wait">

              {/* ── OVERVIEW ── */}
              {activeView === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                >
                  <HeroSection onLaunch={handleLaunch} isRunning={isRunning} focusNonce={focusNonce} />
                  <Reveal style={{ marginTop: 40 }}><StatsCards /></Reveal>
                  <Reveal delay={80} style={{ marginTop: 20 }}>
                    <RecentSessions onOpen={() => setActiveView('agent')} />
                  </Reveal>
                </motion.div>
              )}

              {/* ── AGENT ── */}
              {activeView === 'agent' && (
                <motion.div
                  key="agent"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                >
                  {/* Sticky, so Cancel stays reachable however far you scroll
                      down a long run. */}
                  <div className="run-header" ref={runHeaderRef}>
                    <div className="run-header-main">
                      <span className="eyebrow">
                        {currentTaskId ? `Run · ${String(currentTaskId).slice(0, 8)}` : 'No run yet'}
                        {stats?.steps != null ? ` · ${stats.steps} steps` : ''}
                        {stats?.durationMs != null ? ` · ${(stats.durationMs / 1000).toFixed(1)}s` : ''}
                      </span>
                      <h1>{headline}</h1>
                      {currentTask && <p className="run-header-task">&ldquo;{currentTask}&rdquo;</p>}
                    </div>
                    <div className="run-actions">
                      {isRunning ? (
                        <button type="button" className="btn btn-danger" onClick={handleCancel}>
                          <X size={15} aria-hidden="true" />Cancel run
                        </button>
                      ) : (
                        <button type="button" className="btn btn-primary" onClick={handleNewTask}>
                          New task
                        </button>
                      )}
                      <button type="button" className="btn" onClick={() => setActiveView('dashboard')}>
                        <ArrowLeft size={15} aria-hidden="true" />Overview
                      </button>
                    </div>
                  </div>

                  {connectionLost && (
                    <div className="alert alert-warn" style={{ marginBottom: 16 }}>
                      <span className="alert-icon"><WifiOff size={20} aria-hidden="true" /></span>
                      <div className="alert-body">
                        <p className="alert-title" style={{ color: 'var(--warn-text)' }}>Lost the live connection</p>
                        <p className="alert-text">
                          The task may still be running on the server. Open Sessions to see where it got to.
                        </p>
                      </div>
                      <div className="alert-actions">
                        <button type="button" className="btn btn-ghost-warn" onClick={() => setActiveView('sessions')}>
                          Open sessions
                        </button>
                      </div>
                    </div>
                  )}

                  {taskError && !connectionLost && (
                    <div className="alert alert-bad" style={{ marginBottom: 16 }}>
                      <span className="alert-icon"><X size={20} aria-hidden="true" /></span>
                      <div className="alert-body">
                        <p className="alert-title" style={{ color: 'var(--bad-text)' }}>The run did not finish</p>
                        <p className="alert-text">{taskError}</p>
                      </div>
                    </div>
                  )}

                  {stopped && !connectionLost && (
                    <div className="alert" style={{ marginBottom: 16 }} role="status">
                      <span className="alert-icon" style={{ background: 'var(--raised)', color: 'var(--text-2)' }}>
                        <ShieldCheck size={20} aria-hidden="true" />
                      </span>
                      <div className="alert-body">
                        <p className="alert-title">
                          {stopped.status === 'REJECTED' ? 'You declined, so the agent stopped' : 'You cancelled this run'}
                        </p>
                        <p className="alert-text">
                          {stopped.status === 'REJECTED' && stopped.reason
                            ? `It was asking before: ${stopped.reason} Nothing after that was done.`
                            : 'Nothing further was done on the page.'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="run-grid">
                    <aside className="run-side">
                      <ExecutionTimeline
                        // Keyed on the run, so a new task starts with the list
                        // following its newest step rather than the last one's.
                        key={currentTaskId || 'no-run'}
                        steps={steps}
                        plan={plan}
                        isRunning={isRunning}
                        selectedStep={selectedStep}
                        onSelect={setSelectedStep}
                      />
                    </aside>

                    <div className="run-main">
                      {/* One selection drives both: picking a step in the
                          timeline pins the viewer to it, and so does picking a
                          thumbnail. */}
                      <LiveBrowser
                        frames={frames}
                        isRunning={isRunning}
                        approval={approval}
                        pinned={selectedStep}
                        onPin={setSelectedStep}
                      />

                      {approval && isQuestion && (
                        <QuestionCard
                          approval={approval}
                          busy={approvalBusy}
                          onAnswer={(text) => handleDecision(true, text)}
                          onSkip={() => handleDecision(false)}
                        />
                      )}

                      {approval && !isQuestion && (
                        <ApprovalCard approval={approval} busy={approvalBusy} onDecision={handleDecision} />
                      )}

                      {finalAnswer && (
                        <section className="alert alert-good" aria-label="The agent's answer">
                          <span className="alert-icon"><CheckCircle2 size={20} aria-hidden="true" /></span>
                          <div className="alert-body">
                            <div className="eyebrow" style={{ color: 'var(--accent-text)', marginBottom: 6 }}>Answer</div>
                            <p className="answer-text">{finalAnswer}</p>
                          </div>
                          <div className="alert-actions">
                            <button
                              type="button"
                              className={`btn btn-sm${copied ? ' copy-ok' : ''}`}
                              onClick={copyAnswer}
                            >
                              {copied
                                ? <><Check size={14} aria-hidden="true" />Copied</>
                                : <><Copy size={14} aria-hidden="true" />Copy</>}
                            </button>
                          </div>
                        </section>
                      )}

                      {(isRunning || reasoning.length > 0) && (
                        <AIThinking reasoning={reasoning} status={status} isRunning={isRunning} />
                      )}

                      <div>
                        <div className="eyebrow" style={{ marginBottom: 9 }}>
                          {isRunning ? 'Queue another instruction' : 'Run another task'}
                        </div>
                        <PromptInput onSubmit={handleLaunch} isRunning={isRunning} />
                      </div>
                    </div>

                    <aside className="run-insp">
                      <RightPanel agentState={agentState} isRunning={isRunning} stats={stats} status={status} />
                    </aside>
                  </div>
                </motion.div>
              )}

              {/* ── SESSIONS ── */}
              {activeView === 'sessions' && (
                <motion.div
                  key="sessions"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                >
                  <div className="section-head">
                    <div>
                      <h1 className="disp" style={{ fontSize: 26, fontWeight: 600 }}>Sessions</h1>
                      <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>Every task you have run.</p>
                    </div>
                  </div>
                  <StatsCards />
                  <div style={{ marginTop: 20 }}>
                    <RecentSessions limit={20} onOpen={() => setActiveView('agent')} />
                  </div>
                </motion.div>
              )}

              {/* ── APPROVAL RULES ── */}
              {activeView === 'rules' && (
                <motion.div
                  key="rules"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                >
                  <div className="section-head">
                    <div>
                      <h1 className="disp" style={{ fontSize: 26, fontWeight: 600 }}>Approval rules</h1>
                      <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>
                        When the agent stops and hands the browser back to you.
                      </p>
                    </div>
                  </div>

                  <div className="stat-grid">
                    {[
                      { Icon: CreditCard, title: 'Payments', body: 'Anything that spends money stops for you. The agent never types card details.' },
                      { Icon: KeyRound, title: 'Sign-ins', body: 'Logins and sign-ups are handed to you in the browser window.' },
                      { Icon: PenLine, title: 'Personal details', body: 'Forms asking for your details wait for you to fill them in.' },
                      { Icon: ShieldCheck, title: 'Anything irreversible', body: 'Deleting, sending or confirming gets flagged as high risk and asks first.' },
                    ].map(({ Icon, title, body }) => (
                      <div key={title} className="stat lift">
                        <div className="stat-label"><Icon size={15} aria-hidden="true" />{title}</div>
                        <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>{body}</p>
                        <div className="stat-sub" style={{ marginTop: 12, color: 'var(--accent-text)' }}>Always on</div>
                      </div>
                    ))}
                  </div>

                  <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-3)' }}>
                    These rules are enforced by the backend, not by this page, so they hold even if a run is
                    started from somewhere else.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </>
  );
}
