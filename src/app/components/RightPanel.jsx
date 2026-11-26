'use client';

import { useState } from 'react';
import { Target, Cpu, Monitor, ShieldCheck } from 'lucide-react';

const TABS = [
  ['calls', 'Tool calls'],
  ['page', 'Page'],
  ['run', 'Run'],
];

function fmtMs(ms) {
  if (ms == null) return '—';
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)}s`;
}

/**
 * The inspector: what the agent called, what it is looking at, and how the run
 * is configured. Values come straight off the stream, so "—" means the backend
 * has not sent that field yet rather than zero.
 */
export default function RightPanel({ agentState, isRunning, stats, status }) {
  const [tab, setTab] = useState('calls');
  const { goal, url, toolCalls, elements, recoveries } = agentState || {};

  return (
    <>
      <section className="panel" aria-label="Agent inspector">
        <div className="panel-body" style={{ padding: 8 }}>
          <div className="tabs" role="tablist" aria-label="Inspector sections">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                className="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding: '14px 10px 6px' }}>
            {tab === 'calls' && (
              toolCalls?.length ? (
                <div className="tool-call">
                  {toolCalls.slice(-9).map((c, i) => (
                    <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <b>{c.name}</b>({c.args ? `"${c.args}"` : ''})
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  {isRunning ? 'Waiting for the first action…' : 'No calls yet.'}
                </p>
              )
            )}

            {tab === 'page' && (
              <dl style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="kv"><dt>Current URL</dt><dd className="mono" style={{ fontSize: 11 }}>{url || '—'}</dd></div>
                <div className="kv"><dt>Elements seen</dt><dd className="mono">{elements ?? '—'}</dd></div>
                <div className="kv"><dt>Recoveries</dt><dd className="mono">{recoveries ?? 0}</dd></div>
              </dl>
            )}

            {tab === 'run' && (
              <dl style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="kv"><dt>Status</dt><dd>{status || (isRunning ? 'ACTING' : 'Idle')}</dd></div>
                <div className="kv"><dt>Steps</dt><dd className="mono">{stats?.steps ?? '—'}</dd></div>
                <div className="kv"><dt>Duration</dt><dd className="mono">{fmtMs(stats?.durationMs)}</dd></div>
                <div className="kv"><dt>Credits used</dt><dd className="mono">{stats?.creditsUsed ?? '—'}</dd></div>
                <div className="kv"><dt>Cached flow</dt><dd>{stats ? (stats.cacheHit ? 'Yes' : 'No') : '—'}</dd></div>
              </dl>
            )}
          </div>
        </div>
      </section>

      <section className="panel" aria-label="Goal">
        <div className="panel-body">
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Target size={13} aria-hidden="true" />Goal
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.55 }}>{goal || 'No task running.'}</p>
        </div>
      </section>

      <section className="panel" aria-label="Session">
        <div className="panel-body">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Session</div>
          <dl style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="kv">
              <dt style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Monitor size={13} aria-hidden="true" />Browser</dt>
              <dd>Chromium · headful</dd>
            </div>
            <div className="kv">
              <dt style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Cpu size={13} aria-hidden="true" />Model</dt>
              <dd>Backend default</dd>
            </div>
            <div className="kv">
              <dt style={{ display: 'flex', alignItems: 'center', gap: 7 }}><ShieldCheck size={13} aria-hidden="true" />Asks you for</dt>
              <dd style={{ color: 'var(--warn-text)' }}>Payments, sign-ins</dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
