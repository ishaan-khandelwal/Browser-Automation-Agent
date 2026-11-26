'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, Clock, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { listTasks, cancelTask } from '../lib/api';
import { useAuth } from '../lib/auth-context';

// Statuses a task never leaves. Anything else is still running, queued or
// waiting on the person, and holds one of their concurrent-task slots.
const TERMINAL = new Set(['COMPLETED', 'EXECUTION_FAILED', 'REJECTED', 'TIMED_OUT', 'CANCELLED']);
// How often the list is re-read while any task in it is still active.
const REFRESH_MS = 10000;

function isActive(session) {
  return !TERMINAL.has(session.status) && !String(session.id).startsWith('demo-');
}

const statusConfig = {
  completed: { Icon: CheckCircle, color: '#3DDC97', bg: 'rgba(61, 220, 151, 0.1)', label: 'Completed' },
  failed: { Icon: XCircle, color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.1)', label: 'Failed' },
  running: { Icon: AlertCircle, color: '#9B6DFF', bg: 'rgba(155, 109, 255, 0.1)', label: 'Running' },
  submitted: { Icon: AlertCircle, color: '#FFB86B', bg: 'rgba(255, 184, 107, 0.1)', label: 'Queued' },
  cancelled: { Icon: XCircle, color: '#9b92ae', bg: 'rgba(155, 146, 174, 0.1)', label: 'Cancelled' },
};

// Backend statuses are uppercase and finer-grained than the badges.
const STATUS_MAP = {
  COMPLETED: 'completed', EXECUTION_FAILED: 'failed', REJECTED: 'failed', TIMED_OUT: 'failed',
  CANCELLED: 'cancelled', SUBMITTED: 'submitted',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function durationStr(start, end) {
  if (!start || !end) return null;
  const s = Math.round((new Date(end) - new Date(start)) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function taskIcon(instruction) {
  const t = (instruction || '').toLowerCase();
  if (t.includes('flight')) return '✈️';
  if (t.includes('hotel') || t.includes('book')) return '🏨';
  if (t.includes('job') || t.includes('intern') || t.includes('apply') || t.includes('linkedin')) return '💼';
  if (t.includes('amazon') || t.includes('price') || t.includes('shop')) return '🛒';
  if (t.includes('news') || t.includes('article')) return '📰';
  if (t.includes('form') || t.includes('fill')) return '📝';
  return '🤖';
}

function SessionRow({ session, index, onCancelled }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const cfg = statusConfig[STATUS_MAP[session.status] || session.status] || statusConfig.running;
  const { Icon, color, bg, label } = cfg;
  const dur = durationStr(session.createdAt, session.finishedAt);

  // A task left waiting (on a question, an approval, a sign-in) keeps a slot,
  // and with every slot held no new task can start. This is the way out.
  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await cancelTask(session.id);
      onCancelled(session.id, updated);
    } catch (err) {
      setCancelError(err.message || 'Could not cancel the task');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 380, damping: 28 }}
    >
      <motion.div
        whileHover={{ backgroundColor: 'rgba(155, 109, 255, 0.03)' }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        style={{ borderRadius: 16, overflow: 'hidden', border: hovered ? '1px solid rgba(155, 109, 255, 0.15)' : '1px solid transparent', transition: 'border-color 0.2s ease' }}
      >
        <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)' }}>
          <motion.div whileHover={{ scale: 1.1, rotate: 5 }} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(155, 109, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, border: '1px solid rgba(155, 109, 255, 0.1)' }}>
            {taskIcon(session.instruction)}
          </motion.div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1028', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.instruction}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {session.startUrl && <span style={{ fontSize: 12, color: '#9b92ae', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{session.startUrl}</span>}
              {dur && <><span style={{ fontSize: 12, color: '#9b92ae' }}>•</span><span style={{ fontSize: 12, color: '#9b92ae', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{dur}</span></>}
              {session.stepCount != null && <><span style={{ fontSize: 12, color: '#9b92ae' }}>•</span><span style={{ fontSize: 12, color: '#9b92ae' }}>{session.stepCount} steps</span></>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: bg, borderRadius: 8, padding: '3px 8px' }}>
              <Icon size={12} style={{ color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
            </div>
            <span style={{ fontSize: 11, color: '#9b92ae' }}>{timeAgo(session.createdAt)}</span>
          </div>

          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: '#9b92ae' }}>
            <ChevronDown size={16} />
          </motion.div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '0 16px 16px 70px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ background: 'rgba(26, 16, 40, 0.03)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(155, 109, 255, 0.08)' }}>
                  <div style={{ fontSize: 12, color: '#5a4d6e', fontWeight: 500, marginBottom: 4 }}>Task ID: <span style={{ fontFamily: 'monospace', color: '#9b92ae' }}>{session.id}</span></div>
                  {session.finalAnswer && <div style={{ fontSize: 12, color: '#5a4d6e', fontWeight: 500 }}>Result: {typeof session.finalAnswer === 'string' ? session.finalAnswer : JSON.stringify(session.finalAnswer)}</div>}
                  {session.failureReason && <div role="status" style={{ fontSize: 12, color: '#c0392b', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Reason: {session.failureReason}</div>}
                  {!session.finalAnswer && !session.failureReason && <div style={{ fontSize: 12, color: '#9b92ae' }}>No result summary available.</div>}
                </div>
                {isActive(session) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      disabled={cancelling}
                      onClick={handleCancel}
                      style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(255, 107, 107, 0.35)', background: 'rgba(255, 107, 107, 0.06)', color: '#FF6B6B', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: cancelling ? 'default' : 'pointer', opacity: cancelling ? 0.6 : 1 }}
                    >
                      {cancelling ? 'Cancelling…' : '✕ Cancel task'}
                    </button>
                    {cancelError && <span style={{ fontSize: 12, color: '#FF6B6B' }}>{cancelError}</span>}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default function RecentSessions() {
  // Null until the first read comes back. Loading and the signed-out demo list
  // are worked out from it below rather than kept as state of their own.
  const [sessions, setSessions] = useState(null);
  const { user } = useAuth();

  // `quiet` is a background refresh: a failed one keeps what is on screen.
  const load = useCallback((quiet) => (
    listTasks({ page: 1, pageSize: 10 })
      .then((data) => {
        if (data?.items?.length) setSessions(data.items);
        else if (!quiet) setSessions([]);
      })
      .catch(() => { if (!quiet) setSessions([]); })
  ), []);

  useEffect(() => {
    if (user) load(false);
  }, [user, load]);

  // Read once, a "Running" badge stayed "Running" after the task had timed
  // out. While anything in the list is still active, keep it current.
  const anyActive = Boolean(user && sessions?.some(isActive));
  useEffect(() => {
    if (!anyActive) return undefined;
    const timer = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [anyActive, load]);

  const handleCancelled = useCallback((id, updated) => {
    setSessions((prev) => (prev || []).map((s) => (
      s.id === id ? { ...s, ...(updated || {}), status: updated?.status || 'CANCELLED' } : s
    )));
  }, []);

  const loading = Boolean(user) && sessions === null;
  const displayed = user ? (sessions || []) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 280, damping: 26 }}
      style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: 24, border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 8px 40px rgba(155, 109, 255, 0.06)', overflow: 'hidden' }}
    >
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(155, 109, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1028', letterSpacing: '-0.02em' }}>Recent Sessions</h2>
          <div style={{ fontSize: 12, color: '#9b92ae', marginTop: 1 }}>
            {loading ? 'Loading...' : `${displayed.length} automation run${displayed.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>
      <div style={{ padding: '8px 8px 8px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>
              <Loader2 size={22} style={{ color: '#9B6DFF' }} />
            </motion.div>
          </div>
        ) : (
          displayed.length ? displayed.map((s, i) => <SessionRow key={s.id} session={s} index={i} onCancelled={handleCancelled} />) : (
            <div style={{ padding: '28px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>{user ? 'No runs yet' : 'Sign in to view your runs'}</div>
              <div style={{ marginTop: 5, fontSize: 12, color: '#6b7688' }}>{user ? 'Your browser automation sessions will appear here.' : 'Your session history is private to your account.'}</div>
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
