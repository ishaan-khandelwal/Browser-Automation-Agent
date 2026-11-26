'use client';

import { CreditCard, KeyRound, PenLine, ShieldAlert } from 'lucide-react';

/**
 * The agent hands the browser back to the person with a `wait` whose target
 * says why (the backend's HANDOFF_* constants). Each gets its own wording,
 * because "approve this click" is the wrong thing to say when the real ask is
 * "go and pay in the window that just opened".
 */
const HANDOFFS = {
  'for you to pay': {
    icon: CreditCard,
    title: 'Payment needed: pay in the browser window',
    body: 'I never type card details for you. Pay in the window the agent opened, then tell me to carry on.',
    approve: "I've paid, continue",
    reject: 'Stop without paying',
  },
  'for you to sign in or sign up': {
    icon: KeyRound,
    title: 'Sign-in needed',
    body: 'This site wants an account before it will go further. Sign in yourself in the browser window.',
    approve: "I've signed in, continue",
    reject: 'Stop the task',
  },
  'for you to fill in details': {
    icon: PenLine,
    title: 'Details needed',
    body: 'Some fields are yours to fill. Add them in the browser window, then tell me to carry on.',
    approve: "I've filled them in, continue",
    reject: 'Stop the task',
  },
};

export default function ApprovalCard({ approval, busy, onDecision }) {
  const action = approval?.proposedAction || {};
  const handoff = action.action === 'wait' ? HANDOFFS[action.target] : null;
  const Icon = handoff?.icon || ShieldAlert;

  const title = handoff?.title || `Approval needed (${approval?.riskLevel || 'HIGH'} risk)`;
  const body = approval?.reason || handoff?.body || 'The agent wants to do something it cannot undo.';

  return (
    <section className="alert alert-warn alert-waiting" aria-label="The agent needs your decision">
      <span className="alert-icon"><Icon size={20} aria-hidden="true" /></span>
      <div className="alert-body">
        <p className="alert-title" style={{ color: 'var(--warn-text)' }}>{title}</p>
        <p className="alert-text">{body}</p>
        {!handoff && action.action && (
          <pre>{JSON.stringify(action, null, 2)}</pre>
        )}
        <div className="alert-actions" style={{ marginTop: 14 }}>
          <button type="button" className="btn btn-warn" onClick={() => onDecision(true)} disabled={busy}>
            {handoff?.approve || 'Approve'}
          </button>
          <button type="button" className="btn btn-ghost-warn" onClick={() => onDecision(false)} disabled={busy}>
            {handoff?.reject || 'Reject'}
          </button>
        </div>
      </div>
    </section>
  );
}
