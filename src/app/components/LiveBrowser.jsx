'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, MousePointer2, Loader2, Maximize2, Minimize2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * What the agent is looking at.
 *
 * Every `step` event carries a base64 JPEG of the page plus the `bbox` of the
 * element it acted on, in `viewport` pixels. Both are drawn here: the shot
 * fills the stage and the bbox is placed over it as a percentage of the
 * viewport, so it stays on the right element at any width. `approval_required`
 * carries the same pair, which is why a pending approval takes over the view --
 * somebody being asked to approve a click is entitled to see what it clicks.
 *
 * Frames are kept so the run can be scrubbed: picking a step pins it (here or
 * in the timeline, which shares the selection), and `Live` follows the newest
 * again.
 */
export default function LiveBrowser({ frames = [], isRunning, approval, pinned = null, onPin }) {
  const [expanded, setExpanded] = useState(false);
  const stripRef = useRef(null);

  // An approval is the thing to look at, whatever was pinned before.
  const approvalFrame = useMemo(() => {
    if (!approval?.screenshot) return null;
    return {
      step: approval.stepNumber ?? null,
      action: approval.proposedAction?.action || 'approve',
      target: approval.proposedAction?.target || null,
      screenshot: approval.screenshot,
      bbox: approval.bbox || null,
      viewport: approval.viewport || null,
      url: approval.url || null,
      isApproval: true,
    };
  }, [approval]);

  const live = frames.length ? frames[frames.length - 1] : null;
  const pinnedIndex = pinned != null ? frames.findIndex((f) => f.step === pinned) : -1;
  const pinnedFrame = pinnedIndex >= 0 ? frames[pinnedIndex] : null;
  const shown = approvalFrame || pinnedFrame || live;
  const following = !pinnedFrame;

  // Follow the run: a new step scrolls the strip to the end.
  useEffect(() => {
    if (following && stripRef.current) {
      stripRef.current.scrollLeft = stripRef.current.scrollWidth;
    }
  }, [frames.length, following]);

  // Arrow keys step through the run while it is expanded; Escape closes.
  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { setExpanded(false); return; }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (!frames.length) return;
      e.preventDefault();
      const at = pinnedIndex >= 0 ? pinnedIndex : frames.length - 1;
      const next = e.key === 'ArrowLeft' ? at - 1 : at + 1;
      if (next < 0 || next >= frames.length) return;
      onPin?.(next === frames.length - 1 ? null : frames[next].step);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [expanded, frames, pinnedIndex, onPin]);

  const step = (dir) => {
    if (!frames.length) return;
    const at = pinnedIndex >= 0 ? pinnedIndex : frames.length - 1;
    const next = at + dir;
    if (next < 0 || next >= frames.length) return;
    onPin?.(next === frames.length - 1 ? null : frames[next].step);
  };

  const box = shown?.bbox && shown?.viewport
    ? {
        left: `${(shown.bbox.x / shown.viewport.width) * 100}%`,
        top: `${(shown.bbox.y / shown.viewport.height) * 100}%`,
        width: `${(shown.bbox.width / shown.viewport.width) * 100}%`,
        height: `${(shown.bbox.height / shown.viewport.height) * 100}%`,
      }
    : null;

  return (
    <section className={`viewer${expanded ? ' is-expanded' : ''}`} aria-label="What the agent sees">
      <div className={`viewer-frame${expanded ? ' flat' : ''}`}>
        <div className="viewer-bar">
          <span className="viewer-lights" aria-hidden="true"><span /><span /><span /></span>
          <span className="viewer-url">{shown?.url || 'about:blank'}</span>

          {isRunning && !approval && (
            <span className="pill pill-live" style={{ flex: 'none' }}>
              <span className="dot dot-live" />LIVE
            </span>
          )}
          {approval && (
            <span className="pill pill-warn" style={{ flex: 'none' }}>
              <span className="dot dot-warn" />PAUSED
            </span>
          )}

          <span className="viewer-tools">
            {shown?.url && (
              <a
                className="btn btn-sm btn-icon"
                href={shown.url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Open this page in a new tab"
                title="Open this page in a new tab"
              >
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            )}
            <button
              type="button"
              className="btn btn-sm btn-icon"
              onClick={() => setExpanded((p) => !p)}
              aria-label={expanded ? 'Shrink the page view' : 'Expand the page view'}
              title={expanded ? 'Shrink (Esc)' : 'Expand'}
            >
              {expanded ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
            </button>
          </span>
        </div>

        <div
          className="viewer-stage"
          // Match the stage to the viewport the agent actually saw, so the
          // screenshot fills it without letterboxing at any window width.
          style={shown?.viewport ? { aspectRatio: `${shown.viewport.width} / ${shown.viewport.height}` } : undefined}
        >
          {shown?.screenshot ? (
            <>
              <div className="shot">
                {/* Screenshots arrive as base64 JPEG on the stream, so there is
                    no URL for next/image to optimise. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/jpeg;base64,${shown.screenshot}`}
                  alt={
                    shown.isApproval
                      ? 'The page the agent is asking you to approve an action on'
                      : `The page at step ${shown.step}`
                  }
                />
                <AnimatePresence>
                  {box && (
                    <motion.div
                      key={`${shown.step}-${shown.isApproval ? 'a' : 's'}`}
                      className={`bbox${shown.isApproval ? ' is-warn' : ''}`}
                      style={box}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <span className="bbox-tag">
                        {shown.step != null ? `${shown.step} · ` : ''}{shown.action}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isRunning && following && !approval && <span className="viewer-scan" aria-hidden="true" />}

              <div className="viewer-caption">
                <MousePointer2 size={13} aria-hidden="true" />
                <span className="act">{shown.action}</span>
                {shown.target && <span>{shown.target}</span>}
                {shown.value && <span style={{ color: 'var(--text-3)' }}>&ldquo;{shown.value}&rdquo;</span>}
                {!following && <span style={{ color: 'var(--warn-text)', marginLeft: 'auto' }}>replay</span>}
              </div>
            </>
          ) : (
            <div className="viewer-empty">
              {isRunning ? (
                <>
                  <Loader2 size={26} aria-hidden="true" style={{ animation: 'orbitSpin 1.4s linear infinite' }} />
                  <span>Opening the browser and taking the first look at the page…</span>
                </>
              ) : (
                <>
                  <Globe size={26} aria-hidden="true" />
                  <span>
                    The agent&rsquo;s browser shows up here.<br />
                    Every step arrives as a screenshot with the clicked element outlined.
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {frames.length > 0 && (
          <div className="viewer-foot">
            <button
              type="button"
              className="btn btn-sm btn-icon"
              onClick={() => step(-1)}
              disabled={(pinnedIndex >= 0 ? pinnedIndex : frames.length - 1) === 0}
              aria-label="Previous step"
            >
              <ChevronLeft size={15} aria-hidden="true" />
            </button>

            <div className="filmstrip" ref={stripRef}>
              {frames.map((f) => (
                <button
                  key={f.step}
                  type="button"
                  className={`film${!approvalFrame && shown?.step === f.step ? ' is-active' : ''}`}
                  onClick={() => onPin?.(f.step === pinned ? null : f.step)}
                  aria-label={`Step ${f.step}: ${f.action}${f.target ? ` ${f.target}` : ''}`}
                  aria-current={!approvalFrame && shown?.step === f.step ? 'true' : undefined}
                >
                  {f.screenshot ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`data:image/jpeg;base64,${f.screenshot}`} alt="" />
                  ) : (
                    <span className="film-blank" />
                  )}
                  <span>{f.step} · {f.action}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-sm btn-icon"
              onClick={() => step(1)}
              disabled={following}
              aria-label="Next step"
            >
              <ChevronRight size={15} aria-hidden="true" />
            </button>

            {!following && (
              <button type="button" className="btn btn-sm" onClick={() => onPin?.(null)}>
                Jump to live
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
