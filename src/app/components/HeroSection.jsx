'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MousePointer2, ShieldCheck, Headphones } from 'lucide-react';
import PromptInput from './PromptInput';
import Reveal from './Reveal';

const EXAMPLES = [
  'Compare prices for noise-cancelling headphones across three stores',
  'Find three hotels near the city centre for next weekend under ₹6,000',
  'Search for software internships and summarise the best matches',
];

const PIPELINE = [
  ['01', 'Plan'],
  ['02', 'Navigate'],
  ['03', 'Act on page'],
  ['04', 'Ask you if needed', true],
  ['05', 'Verify and report'],
];

const PLAN_STEPS = ['Open amazon.in', 'Search the model', 'Read the price', 'Repeat on Flipkart', 'Compare and report'];

/**
 * The 3D stack is a decorative illustration of a run: a plan card behind, the
 * page in front, a tool call floating above. It tilts toward the pointer, which
 * is what sells the depth; `prefers-reduced-motion` flattens the animations in
 * globals.css.
 */
function BrowserStack() {
  const [tilt, setTilt] = useState({ rx: 9, ry: -17 });
  // The plan ticks along on its own, so the illustration reads as a run in
  // progress rather than a still.
  const [at, setAt] = useState(2);

  useEffect(() => {
    const id = setInterval(() => setAt((p) => (p + 1) % (PLAN_STEPS.length + 1)), 1600);
    return () => clearInterval(id);
  }, []);

  const onMove = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: 9 - y * 11, ry: -17 + x * 16 });
  }, []);

  const reset = useCallback(() => setTilt({ rx: 9, ry: -17 }), []);

  return (
    <div className="hero-visual" onMouseMove={onMove} onMouseLeave={reset} aria-hidden="true">
      <div
        className="tilt-rig"
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      >
        {/* plan card, furthest back */}
        <div className="tilt-layer" style={{ left: '-4%', top: 6, width: 222, transform: 'translateZ(-150px)' }}>
          <div className="panel" style={{ padding: 18, boxShadow: 'var(--shadow)' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Plan · {PLAN_STEPS.length} steps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              {PLAN_STEPS.map((s, i) => {
                const done = i < at;
                const active = i === at;
                return (
                  <div
                    key={s}
                    style={{
                      display: 'flex', gap: 9, alignItems: 'center',
                      color: done ? 'var(--text-2)' : active ? 'var(--text)' : 'var(--text-3)',
                      fontWeight: active ? 600 : 400,
                      transition: 'color .4s',
                    }}
                  >
                    <span
                      style={{
                        width: 15, height: 15, borderRadius: '50%', flex: 'none', boxSizing: 'border-box',
                        background: done ? 'var(--good)' : 'transparent',
                        border: done ? 'none' : `1.5px solid ${active ? 'var(--accent-deep)' : 'var(--line-strong)'}`,
                        boxShadow: active ? '0 0 0 3px var(--accent-soft)' : 'none',
                        transition: 'background .4s, border-color .4s, box-shadow .4s',
                      }}
                    />
                    {s}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* the page itself, in the one dark chrome */}
        <div className="tilt-layer" style={{ left: '14%', top: 110, width: 430, transform: 'translateZ(40px)' }}>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line-strong)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--chrome)' }}>
              <span style={{ display: 'flex', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(232,236,242,.26)' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(232,236,242,.26)' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(232,236,242,.26)' }} />
              </span>
              <span className="mono" style={{ flex: 1, padding: '4px 11px', borderRadius: 999, background: 'var(--chrome-2)', fontSize: 10, color: '#b8c2d0' }}>
                amazon.in/s?k=sony+wh-1000xm6
              </span>
            </div>
            <div style={{ position: 'relative', display: 'flex', gap: 14, padding: 16, height: 210, background: '#ffffff', color: 'var(--text)', boxSizing: 'border-box' }}>
              <div style={{ width: 120, height: 120, borderRadius: 12, background: 'var(--bg-deep)', display: 'grid', placeItems: 'center', flex: 'none', color: 'var(--text-3)' }}>
                <Headphones size={50} strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 14px/1.35 var(--font-sans)', marginBottom: 5 }}>Sony WH-1000XM6 Wireless Headphones</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>Black · Visit the Sony Store</div>
                <div
                  className="disp"
                  style={{ position: 'relative', display: 'inline-block', fontSize: 22, padding: '2px 7px', borderRadius: 5, outline: '2px solid var(--accent-deep)' }}
                >
                  ₹29,990
                  <span className="mono" style={{ position: 'absolute', top: -11, right: -14, fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 5, background: 'var(--accent-deep)', color: '#fff' }}>14</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <span style={{ padding: '7px 13px', borderRadius: 999, background: 'var(--warn)', color: '#2b1a00', fontSize: 11, fontWeight: 600 }}>Add to cart</span>
                  <span style={{ padding: '7px 13px', borderRadius: 999, border: '1px solid var(--line-strong)', fontSize: 11, fontWeight: 600 }}>Compare</span>
                </div>
              </div>
              <motion.div
                style={{ position: 'absolute', left: 0, top: 0, color: 'var(--text)' }}
                animate={{ x: [40, 232, 232, 40], y: [28, 150, 150, 28], scale: [1, 1, 0.88, 1] }}
                transition={{ duration: 5.5, times: [0, 0.4, 0.5, 1], repeat: Infinity, ease: 'easeInOut' }}
              >
                <MousePointer2 size={20} fill="var(--text)" stroke="#fff" strokeWidth={1.5} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* floating tool call */}
        <div className="tilt-layer float" style={{ left: '48%', top: 352, transform: 'translateZ(130px)' }}>
          <div className="mono glass" style={{ padding: '10px 14px', borderRadius: 999, fontSize: 11, whiteSpace: 'nowrap', boxShadow: 'var(--shadow)', color: 'var(--text-2)' }}>
            <span style={{ color: 'var(--accent-text)', fontWeight: 600 }}>extract</span> price ← [14] <span style={{ color: 'var(--text-3)' }}>· verified</span>
          </div>
        </div>

        <div className="tilt-layer float" style={{ left: '2%', top: 360, transform: 'translateZ(95px)', animationDelay: '-3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px', borderRadius: 999, background: 'var(--warn-soft)', border: '1px solid var(--warn-line)', fontSize: 11, fontWeight: 600, color: 'var(--warn-text)', whiteSpace: 'nowrap' }}>
            <ShieldCheck size={13} />Pauses before checkout
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection({ onLaunch, isRunning, focusNonce = 0 }) {
  const [draft, setDraft] = useState('');

  return (
    <>
      <div className="hero">
        <div className="hero-copy">
          <span className="eyebrow" style={{ color: 'var(--accent-text)' }}>Autonomous browser agent</span>
          <h1>
            Tell it once.<br />
            <em>Watch it browse.</em>
          </h1>
          <p>
            Describe a task in plain words. BrowseAI plans the steps, drives a real Chromium window,
            and stops to ask you before payments, sign-ins or anything it cannot undo.
          </p>

          <div style={{ marginTop: 32 }}>
            <PromptInput
              onSubmit={onLaunch}
              isRunning={isRunning}
              value={draft}
              onValueChange={setDraft}
              focusNonce={focusNonce}
            />
          </div>

          <div className="suggest-row">
            {EXAMPLES.map((text) => (
              <button key={text} type="button" className="chip" onClick={() => setDraft(text)}>
                {text}
              </button>
            ))}
          </div>
        </div>

        <BrowserStack />
      </div>

      <Reveal className="pipeline" style={{ marginTop: 44 }}>
        <span className="eyebrow" style={{ marginRight: 6 }}>Every run</span>
        {PIPELINE.map(([n, label, warn], i) => (
          <span key={n} style={{ display: 'contents' }}>
            <span className={`pipeline-step${warn ? ' is-warn' : ''}`}>
              <span className="mono">{n}</span>
              {label}
            </span>
            {i < PIPELINE.length - 1 && <span className="pipeline-line" aria-hidden="true" />}
          </span>
        ))}
      </Reveal>
    </>
  );
}
