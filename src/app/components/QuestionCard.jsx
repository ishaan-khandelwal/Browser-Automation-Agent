'use client';

import { useState } from 'react';
import { MessageCircleQuestion } from 'lucide-react';

/**
 * The agent asked something it cannot decide for itself. The backend models
 * this as an approval whose proposed action targets `question`, so answering
 * approves with the text and skipping rejects.
 */
export default function QuestionCard({ approval, busy, onAnswer, onSkip }) {
  const [text, setText] = useState('');

  const send = () => {
    const answer = text.trim();
    if (!answer || busy) return;
    onAnswer?.(answer);
    setText('');
  };

  return (
    <section className="alert alert-good alert-waiting" aria-label="Question from the agent">
      <span className="alert-icon"><MessageCircleQuestion size={20} aria-hidden="true" /></span>
      <div className="alert-body">
        <div className="eyebrow" style={{ color: 'var(--accent-text)', marginBottom: 6 }}>Question for you</div>
        <p className="alert-title">{approval?.reason || 'The agent needs one detail to carry on.'}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 14 }}>
          <label htmlFor="agent-answer" className="sr-only">Your answer</label>
          <input
            id="agent-answer"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
            placeholder="Type your answer"
            style={{
              flex: '1 1 220px', minWidth: 0, height: 42, padding: '0 13px',
              borderRadius: 10, border: '1px solid var(--line-strong)',
              background: 'var(--bg-deep)', fontSize: 14,
            }}
          />
          <button type="button" className="btn btn-primary" onClick={send} disabled={busy || !text.trim()}>
            Send answer
          </button>
          <button type="button" className="btn" onClick={onSkip} disabled={busy}>
            Skip
          </button>
        </div>
      </div>
    </section>
  );
}
