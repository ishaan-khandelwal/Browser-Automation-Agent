'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Eye, RotateCcw, Repeat, AlertTriangle, ArrowDown } from 'lucide-react';

/**
 * The step list.
 *
 * `plan` is the forecast the backend sends once, before the first action; the
 * real steps replace it one by one as they arrive. The agent chooses each step
 * from what the page actually shows, so the real count can differ from the
 * forecast -- the remaining plan lines stay visible underneath as "expected",
 * never as promises.
 *
 * The list scrolls inside its own panel rather than growing the page. A long
 * run used to push the live browser view further down with every step. It
 * follows the newest step while you leave it alone, and stops the moment you
 * scroll up to read an earlier one, so it never yanks you back mid-read.
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

// How close to the newest step counts as "still watching it".
const FOLLOW_SLACK_PX = 24;

export default function ExecutionTimeline({ steps = [], plan, isRunning, onSelect, selectedStep }) {
  const planRest = Array.isArray(plan) ? plan.slice(steps.length) : [];
  const total = Array.isArray(plan) ? Math.max(plan.length, steps.length) : steps.length;

  const scrollRef = useRef(null);
  const newestRef = useRef(null);
  // Our own scrolling fires scroll events too, and those must not be read as
  // the person scrolling away.
  const ownScrollRef = useRef(false);
  // How many steps there were when the person scrolled up to read; null while
  // they are following. Only the scroll handler sets it, and the parent keys
  // this component on the run, so a new run starts out following.
  const [stoppedAt, setStoppedAt] = useState(null);
  const following = stoppedAt == null;
  const behind = !following && steps.length > stoppedAt;

  // Where the scroll box would have to be for the newest step to sit fully in
  // view at the bottom, keeping the steps before it visible above.
  const followTarget = useCallback(() => {
    const box = scrollRef.current;
    const newest = newestRef.current;
    if (!box || !newest) return null;
    const bottom = newest.offsetTop + newest.offsetHeight;
    return Math.max(0, bottom - box.clientHeight + 12);
  }, []);

  const scrollToNewest = useCallback((smooth) => {
    const box = scrollRef.current;
    const target = followTarget();
    if (!box || target == null) return;
    // Already there: scrolling would fire no event, and the flag below would
    // then swallow the person's next real scroll.
    if (Math.abs(box.scrollTop - target) < 1) return;
    // Only ever this box. scrollIntoView would also scroll the window, which
    // is exactly the page jump this panel exists to stop.
    ownScrollRef.current = true;
    box.scrollTo({ top: target, behavior: smooth ? 'smooth' : 'auto' });
  }, [followTarget]);

  const onScroll = () => {
    if (ownScrollRef.current) {
      ownScrollRef.current = false;
      return;
    }
    const box = scrollRef.current;
    const target = followTarget();
    if (!box || target == null) return;
    // Back at (or past) the newest step means following again.
    const atNewest = box.scrollTop >= target - FOLLOW_SLACK_PX;
    if (atNewest && stoppedAt != null) setStoppedAt(null);
    if (!atNewest && stoppedAt == null) setStoppedAt(steps.length);
  };

  // A new step: follow it while the person is following. If they are reading
  // further up, leave them there; `behind` offers the way back.
  useEffect(() => {
    if (steps.length > 0 && following) scrollToNewest(true);
  }, [steps.length, following, scrollToNewest]);

  // The box can also change size with no new step: the window is resized, or a
  // step's reasoning wraps onto more lines once it has drawn. Following means
  // the newest step stays in view through those too, not only when one lands.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box || !following || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => scrollToNewest(false));
    observer.observe(box);
    if (box.firstElementChild) observer.observe(box.firstElementChild);
    return () => observer.disconnect();
  }, [following, scrollToNewest]);

  const jumpToLatest = () => {
    setStoppedAt(null);
    scrollToNewest(true);
  };

  return (
    <section className="panel steps-panel" aria-label="Steps the agent has taken">
      <div className="panel-head">
        <h2 className="eyebrow">
          Steps{total ? ` · ${steps.length} of ${Array.isArray(plan) ? `about ${total}` : total}` : ''}
        </h2>
        {isRunning && (
          <span className="pill pill-live"><span className="dot dot-live" />Working</span>
        )}
      </div>

      <div className="steps-scroll" ref={scrollRef} onScroll={onScroll}>
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
                      ref={last ? newestRef : undefined}
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
      </div>

      {behind && (
        <button type="button" className="steps-jump" onClick={jumpToLatest}>
          <ArrowDown size={13} aria-hidden="true" />
          New step · jump to latest
        </button>
      )}
    </section>
  );
}
