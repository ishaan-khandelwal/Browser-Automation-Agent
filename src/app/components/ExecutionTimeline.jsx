'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Eye, RotateCcw, Repeat, AlertTriangle } from 'lucide-react';

/**
 * The step list.
 *
 * `plan` is the forecast the backend sends once, before the first action; the
 * real steps replace it one by one as they arrive. The agent chooses each step
 * from what the page actually shows, so the real count can differ from the
 * forecast -- the remaining plan lines stay visible underneath as "expected",
 * never as promises.
 */
// A full results URL can be longer than the panel is wide. The host and path
// are what tell you where the agent is; the query string is noise here, and the
// whole thing stays in the inspector and the browser bar.
function shortUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const path = u.pathname === '/' ? '' : u.pathname;
    const tail = `${u.host}${path}`;
    return (u.search ? `${tail}?…` : tail).slice(0, 64);
  } catch {
    return url.slice(0, 64);
  }
}

export default function ExecutionTimeline({ steps = [], plan, isRunning, onSelect, selectedStep }) {
  const planRest = Array.isArray(plan) ? plan.slice(steps.length) : [];
  const total = Array.isArray(plan) ? Math.max(plan.length, steps.length) : steps.length;

  return (
    <section className="panel" aria-label="Steps the agent has taken">
      <div className="panel-head">
        <h2 className="eyebrow">
          Steps{total ? ` · ${steps.length} of ${Array.isArray(plan) ? `about ${total}` : total}` : ''}
        </h2>
        {isRunning && (
          <span className="pill pill-live"><span className="dot dot-live" />Working</span>
        )}
      </div>

      <div className="panel-body">
        {steps.length === 0 && planRest.length === 0 ? (
          <p className="empty" style={{ padding: '12px 0' }}>
            {isRunning ? 'Planning the run…' : 'No steps yet.'}
          </p>
        ) : (
          <ol className="timeline">
            <AnimatePresence initial={false}>
              {steps.map((s, i) => {
                const last = i === steps.length - 1;
                const state = s.status === 'error' ? 'failed' : s.awaiting ? 'warn' : last && isRunning ? 'active' : 'done';
                return (
                  <motion.li
                    key={s.id}
                    className="timeline-row"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  >
                    <div className="timeline-gutter">
                      <span className={`timeline-mark ${state}`}>
                        {state === 'done' && <Check size={12} strokeWidth={3.2} aria-hidden="true" />}
                        {state === 'failed' && <X size={12} strokeWidth={3.2} aria-hidden="true" />}
                        {state === 'warn' && <AlertTriangle size={11} strokeWidth={2.6} aria-hidden="true" />}
                        {state === 'active' && ''}
                      </span>
                      {(!last || planRest.length > 0) && <span className="timeline-line" />}
                    </div>

                    <div className="timeline-main">
                      <button
                        type="button"
                        className="timeline-btn"
                        onClick={() => onSelect?.(s.id === selectedStep ? null : s.id)}
                        aria-current={selectedStep === s.id ? 'step' : undefined}
                        aria-label={`Step ${s.id}: ${s.action}${s.target ? ` ${s.target}` : ''} — show this step`}
                      >
                        <span className="timeline-title">
                          {s.action}
                          {s.target ? <span style={{ color: 'var(--text-2)', fontWeight: 500 }}> · {s.target}</span> : null}
                        </span>
                        {(s.value || s.url) && (
                          <span className="timeline-meta">{s.value ? `"${s.value}"` : shortUrl(s.url)}</span>
                        )}
                      </button>

                      {s.reasoning && <p className="timeline-why">{s.reasoning}</p>}

                      <div>
                        {s.usedVision && <span className="timeline-tag tag-vision"><Eye size={10} aria-hidden="true" />vision</span>}
                        {s.replayed && <span className="timeline-tag tag-replay"><Repeat size={10} aria-hidden="true" />cached flow</span>}
                        {s.verified === false && <span className="timeline-tag tag-unverified">not verified</span>}
                        {s.recoveries?.map((r, ri) => (
                          <span key={ri} className="timeline-tag tag-recovery">
                            <RotateCcw size={10} aria-hidden="true" />{r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>

            {planRest.map((label, i) => (
              <li className="timeline-row is-todo" key={`plan-${i}`}>
                <div className="timeline-gutter">
                  <span className="timeline-mark todo">{steps.length + i + 1}</span>
                  {i < planRest.length - 1 && <span className="timeline-line" />}
                </div>
                <div className="timeline-main">
                  <span className="timeline-title">{label}</span>
                  <span className="timeline-meta">expected</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
