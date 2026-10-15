'use client';

import { useState } from 'react';

// A question the agent asks before it starts: tap one of the likely answers or
// type your own. "Skip" means no preference; it does not stop the task.
// The backend sends the options in proposedAction.value, separated by "|".
export default function QuestionCard({ approval, busy, onAnswer, onSkip }) {
  const [typed, setTyped] = useState('');
  const options = (approval.proposedAction?.value || '').split('|').filter(Boolean);
  const chip = {
    padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(155,109,255,0.4)',
    background: 'rgba(155,109,255,0.08)', color: '#5a2fc2', fontWeight: 600, fontSize: 13,
    cursor: 'pointer',
  };

  return (
    <div style={{ padding: 18, borderRadius: 18, border: '1px solid rgba(155,109,255,0.45)', background: 'rgba(155,109,255,0.08)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#9B6DFF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        A quick question
      </div>
      <div style={{ fontSize: 15, color: '#1a1028', fontWeight: 600, marginBottom: 12 }}>
        {approval.reason}
      </div>
      {options.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {options.map((option) => (
            <button key={option} type="button" disabled={busy} onClick={() => onAnswer(option)} style={chip}>
              {option}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (typed.trim()) onAnswer(typed.trim());
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder="Or type your own answer"
          maxLength={200}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(90,77,110,0.25)', fontSize: 13 }}
        />
        <button type="submit" disabled={busy || !typed.trim()} style={{ ...chip, background: '#9B6DFF', color: '#fff', border: 'none' }}>
          Send
        </button>
        <button type="button" disabled={busy} onClick={onSkip} style={{ ...chip, background: 'transparent', color: '#5a4d6e', border: '1px solid rgba(90,77,110,0.25)' }}>
          No preference
        </button>
      </form>
    </div>
  );
}
