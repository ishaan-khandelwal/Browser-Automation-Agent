'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, PauseCircle, Ban, ChevronRight } from 'lucide-react';
import { listTasks, cancelTask } from '../lib/api';
import { useAuth } from '../lib/auth-context';

// Statuses a task never leaves. Anything else is still running, queued or
// waiting on the person, and holds one of their concurrent-task slots.
const TERMINAL = new Set(['COMPLETED', 'EXECUTION_FAILED', 'REJECTED', 'TIMED_OUT', 'CANCELLED']);
const REFRESH_MS = 10000;

const BADGES = {
  COMPLETED: { cls: 'pill-good', dot: 'dot-good', label: 'Completed', Icon: CheckCircle2 },
  EXECUTION_FAILED: { cls: 'pill-bad', dot: 'dot-bad', label: 'Failed', Icon: XCircle },
  // REJECTED means you declined an approval or a question: your choice, not a
  // failure, so it is not shown in red.
  REJECTED: { cls: 'pill-idle', dot: 'dot-idle', label: 'Declined', Icon: Ban },
  TIMED_OUT: { cls: 'pill-bad', dot: 'dot-bad', label: 'Timed out', Icon: XCircle },
  CANCELLED: { cls: 'pill-idle', dot: 'dot-idle', label: 'Cancelled', Icon: Ban },
  AWAITING_APPROVAL: { cls: 'pill-warn', dot: 'dot-warn', label: 'Needs you', Icon: PauseCircle },
  SUBMITTED: { cls: 'pill-idle', dot: 'dot-idle', label: 'Queued', Icon: Loader2 },
  PLANNING: { cls: 'pill-live', dot: 'dot-live', label: 'Planning', Icon: Loader2 },
  ACTING: { cls: 'pill-live', dot: 'dot-live', label: 'Running', Icon: Loader2 },
  VERIFYING: { cls: 'pill-live', dot: 'dot-live', label: 'Verifying', Icon: Loader2 },
  RECOVERING: { cls: 'pill-warn', dot: 'dot-warn', label: 'Recovering', Icon: Loader2 },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function durationStr(start, end) {
  if (!start || !end) return null;
  const s = Math.round((new Date(end) - new Date(start)) / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function answerText(finalAnswer) {
  if (!finalAnswer) return null;
  if (typeof finalAnswer === 'string') return finalAnswer;
  return finalAnswer.text || finalAnswer.answer || JSON.stringify(finalAnswer);
}

function isActive(t) {
  return !TERMINAL.has(t.status);
}

function Row({ task, index, onCancelled, onOpen }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const badge = BADGES[task.status] || BADGES.ACTING;
  const { Icon } = badge;
  const dur = durationStr(task.createdAt, task.finishedAt);
  const answer = answerText(task.finalAnswer);

  // A task left waiting (on a question, an approval, a sign-in) keeps a slot,
  // and with every slot held no new task can start. This is the way out.
  const cancel = async (e) => {
    e.stopPropagation();
    setBusy(true);
    setErr(null);
    try {
      onCancelled(task.id, await cancelTask(task.id));
    } catch (e2) {
      setErr(e2.message || 'Could not cancel the task');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.03 }}
    >
      <button type="button" className="session" onClick={() => onOpen?.(task)}>
        <span className="session-main">
          <span className="session-title">{task.instruction}</span>
          <span className="session-meta">
            {task.taskNumber ? `${task.taskNumber} · ` : ''}
            {timeAgo(task.createdAt)}
            {dur ? ` · ${dur}` : ''}
          </span>
          {task.failureReason && (
            <span
              className="session-meta"
              style={{ color: task.status === 'REJECTED' || task.status === 'CANCELLED' ? 'var(--text-3)' : 'var(--bad-text)' }}
            >
              {task.failureReason}
            </span>
          )}
          {answer && !task.failureReason && (
            <span className="session-meta" style={{ color: 'var(--text-2)' }}>{answer}</span>
          )}
          {err && <span className="session-meta" style={{ color: 'var(--bad-text)' }}>{err}</span>}
        </span>

        <span className={`pill ${badge.cls}`}>
          <Icon size={13} aria-hidden="true" style={isActive(task) ? { animation: 'orbitSpin 1.4s linear infinite' } : undefined} />
          {badge.label}
        </span>

        {isActive(task) && (
          <span
            role="button"
            tabIndex={0}
            className="btn btn-sm btn-danger"
            onClick={cancel}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') cancel(e); }}
            aria-disabled={busy}
          >
            {busy ? 'Cancelling…' : 'Cancel'}
          </span>
        )}

        <ChevronRight size={16} aria-hidden="true" style={{ color: 'var(--text-3)', flex: 'none' }} />
      </button>
    </motion.div>
  );
}

export default function RecentSessions({ limit = 6, onOpen }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    listTasks({ page: 1, pageSize: limit })
      .then((res) => { if (alive) { setTasks(res?.items || []); setErr(null); setLoading(false); } })
      .catch((e) => { if (alive) { setErr(e.message || 'Could not load your sessions'); setLoading(false); } });
    return () => { alive = false; };
  }, [user, limit, tick]);

  // Keep polling only while something is still moving.
  useEffect(() => {
    if (!user || !tasks.some(isActive)) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, [user, tasks]);

  const onCancelled = useCallback((id, updated) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  }, []);

  return (
    <section className="panel" aria-label="Recent sessions">
      <div className="panel-head">
        <h2 className="eyebrow">Recent sessions</h2>
        {tasks.length > 0 && <span className="eyebrow">{tasks.length} shown</span>}
      </div>

      {!user ? (
        <p className="empty">Sign in to see the tasks you have run.</p>
      ) : loading ? (
        <p className="empty">Loading your sessions…</p>
      ) : err ? (
        <p className="empty" style={{ color: 'var(--bad-text)' }}>{err}</p>
      ) : tasks.length === 0 ? (
        <p className="empty">No runs yet. Give the agent its first task above.</p>
      ) : (
        <div className="session-list">
          <AnimatePresence initial={false}>
            {tasks.map((t, i) => (
              <Row key={t.id} task={t} index={i} onCancelled={onCancelled} onOpen={onOpen} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
