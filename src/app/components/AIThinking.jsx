'use client';

import { motion } from 'framer-motion';

const PHASES = {
  SUBMITTED: 'Queued and about to start',
  PLANNING: 'Reading the task and planning the steps',
  ACTING: 'Working on the page',
  VERIFYING: 'Checking that the last action did what it should',
  RECOVERING: 'That did not work. Trying another way in',
  AWAITING_APPROVAL: 'Waiting for your decision',
};

/**
 * The agent's own words. `reasoning` on each step event is the real thing; the
 * phase line below it comes from the `status` event, so it says what the
 * backend is actually doing rather than animating a guess.
 */
export default function AIThinking({ reasoning = [], status, isRunning }) {
  const recent = reasoning.slice(-3).reverse();
  const phase = PHASES[status] || (isRunning ? 'Working' : 'Idle');

  return (
    <section className="panel" aria-label="What the agent is thinking" aria-live="polite">
      <div className="panel-head">
        <h2 className="eyebrow">Thinking</h2>
        {isRunning && <span className="pill pill-live"><span className="dot dot-live" />{status || 'ACTING'}</span>}
      </div>

      <div className="panel-body" style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <div className="orb" aria-hidden="true">
          <span className="orb-ring" />
          <span className="orb-ring" />
          <span className="orb-core" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {recent.length === 0 ? (
            <p className="think-line">
              {phase}
              {isRunning && <span className="caret">▍</span>}
            </p>
          ) : (
            recent.map((line, i) => (
              <motion.p
                key={`${line.slice(0, 24)}-${i}`}
                className="think-line"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: i === 0 ? 1 : 0.62, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span>
                  {line}
                  {i === 0 && isRunning && <span className="caret">▍</span>}
                </span>
              </motion.p>
            ))
          )}
          {/* Only worth a line of its own once there is reasoning above it;
              with none, the phase IS the line above. */}
          {recent.length > 0 && <p className="eyebrow" style={{ marginTop: 14 }}>{phase}</p>}
        </div>
      </div>
    </section>
  );
}
