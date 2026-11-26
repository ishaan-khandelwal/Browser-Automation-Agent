'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Link2, ShieldCheck, Loader2 } from 'lucide-react';

const MAX = 2000;

/**
 * The task composer. `onSubmit` receives { instruction, startUrl } because the
 * backend's POST /tasks takes both, and a start URL saves the agent a search.
 */
export default function PromptInput({ onSubmit, isRunning, value, onValueChange, autoFocus, focusNonce = 0 }) {
  const [inner, setInner] = useState('');
  const [startUrl, setStartUrl] = useState('');
  const [showUrl, setShowUrl] = useState(false);
  const urlRef = useRef(null);
  const taskRef = useRef(null);

  // "New task" in the rail puts the cursor here rather than only changing view.
  useEffect(() => {
    if (focusNonce > 0) taskRef.current?.focus();
  }, [focusNonce]);

  const controlled = value !== undefined;
  const text = controlled ? value : inner;
  const setText = (v) => (controlled ? onValueChange?.(v) : setInner(v));

  const submit = () => {
    const instruction = text.trim();
    if (!instruction || isRunning) return;
    onSubmit?.({ instruction, startUrl: startUrl.trim() || null });
    setText('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="composer">
      <label htmlFor="task-instruction" className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>
        Task instruction
      </label>
      <textarea
        id="task-instruction"
        ref={taskRef}
        rows={3}
        value={text}
        maxLength={MAX}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Compare prices for Sony WH-1000XM6 on Amazon, Flipkart and Croma, then tell me the cheapest"
      />

      {showUrl && (
        <div className="url-field">
          <Link2 size={15} aria-hidden="true" style={{ color: 'var(--text-3)', flex: 'none' }} />
          <label htmlFor="start-url" className="sr-only">Start URL</label>
          <input
            id="start-url"
            ref={urlRef}
            type="url"
            inputMode="url"
            value={startUrl}
            onChange={(e) => setStartUrl(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="https://example.com — where the agent should begin"
          />
        </div>
      )}

      <div className="composer-foot">
        <div className="composer-tools">
          <button
            type="button"
            className="chip"
            aria-pressed={showUrl}
            onClick={() => {
              setShowUrl((p) => {
                if (p) setStartUrl('');
                else setTimeout(() => urlRef.current?.focus(), 0);
                return !p;
              });
            }}
          >
            <Link2 size={14} aria-hidden="true" />
            Start URL
          </button>
          <span className="chip" aria-pressed="true" style={{ cursor: 'default' }}>
            <ShieldCheck size={14} aria-hidden="true" />
            Asks before paying
          </span>
          <span className="composer-count">{text.length}/{MAX}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="kbd" aria-hidden="true">⌘ ↵</span>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={!text.trim() || isRunning}>
            {isRunning ? (
              <>
                <Loader2 size={15} aria-hidden="true" style={{ animation: 'orbitSpin 1.2s linear infinite' }} />
                Running
              </>
            ) : (
              <>
                Run task
                <ArrowRight size={15} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
