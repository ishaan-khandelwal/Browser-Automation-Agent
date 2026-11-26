'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Hand } from 'lucide-react';

const ICONS = {
  good: CheckCircle2,
  warn: Hand,
  bad: AlertTriangle,
};

/**
 * Small corner notices for things that happen while you are looking elsewhere:
 * the agent finished, or it stopped and wants a decision. A run can last
 * minutes, so the page should be able to tell you without you watching it.
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const push = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
    // A decision the agent is waiting on stays until it is answered.
    if (toast.tone !== 'warn') {
      timers.current.set(id, setTimeout(() => dismiss(id), toast.ms || 6000));
    }
    return id;
  }, [dismiss]);

  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach(clearTimeout); map.clear(); };
  }, []);

  return { toasts, push, dismiss };
}

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = ICONS[t.tone] || CheckCircle2;
          return (
            <motion.div
              key={t.id}
              className={`toast toast-${t.tone || 'good'}`}
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            >
              <Icon
                size={17}
                aria-hidden="true"
                style={{
                  flex: 'none',
                  marginTop: 1,
                  color: t.tone === 'warn' ? 'var(--warn-text)' : t.tone === 'bad' ? 'var(--bad-text)' : 'var(--accent-text)',
                }}
              />
              <div style={{ minWidth: 0 }}>
                <b>{t.title}</b>
                {t.body && <span>{t.body}</span>}
              </div>
              <button type="button" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
                <X size={14} aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
