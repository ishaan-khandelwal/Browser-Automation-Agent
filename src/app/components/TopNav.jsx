'use client';

import { useEffect, useRef, useState } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

const VIEWS = [
  ['dashboard', 'Overview'],
  ['agent', 'Agent'],
  ['sessions', 'Sessions'],
  ['rules', 'Rules'],
];

/** Steps done out of steps expected, drawn as a ring so progress reads at a glance. */
function ProgressRing({ done, total }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.min(1, done / total) : 0;

  return (
    <span className="ring" title={`${done} of about ${total} steps`}>
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle className="track" cx="18" cy="18" r={r} />
        <circle className="bar" cx="18" cy="18" r={r} strokeDasharray={`${c * frac} ${c}`} />
      </svg>
      <b>{done}</b>
      <span className="sr-only">{done} of about {total} steps done</span>
    </span>
  );
}

export default function TopNav({
  sidebarExpanded,
  onLoginClick,
  activeView = 'dashboard',
  onViewChange,
  isRunning,
  stepsDone = 0,
  stepsTotal = 0,
}) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (e) => { if (!wrapRef.current?.contains(e.target)) setMenuOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [menuOpen]);

  const name = user?.name || user?.displayName || user?.email?.split('@')[0] || '';
  const initial = (name || '?').charAt(0).toUpperCase();

  return (
    <header className={`topbar${sidebarExpanded ? ' rail-open' : ''}`}>
      {/* Switching views should not need the rail expanded, so it lives here too. */}
      <nav className="seg" aria-label="Sections">
        {VIEWS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onViewChange?.(id)}
            aria-current={activeView === id ? 'page' : undefined}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        {isRunning && stepsTotal > 0 && <ProgressRing done={stepsDone} total={stepsTotal} />}

        <span className={`pill ${isRunning ? 'pill-live' : 'pill-idle'}`}>
          <span className={`dot ${isRunning ? 'dot-live' : 'dot-idle'}`} />
          {isRunning ? 'Agent working' : 'Agent ready'}
        </span>

        {user ? (
          <div className="account" ref={wrapRef}>
            <button
              type="button"
              className="account-btn"
              onClick={() => setMenuOpen((p) => !p)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="avatar" aria-hidden="true">{initial}</span>
              <span className="account-name">{name}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {menuOpen && (
              <div className="account-menu" role="menu">
                <p>{user.email}</p>
                <button type="button" role="menuitem" onClick={() => setMenuOpen(false)}>
                  <User size={15} aria-hidden="true" />Account
                </button>
                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); logout(); }}>
                  <LogOut size={15} aria-hidden="true" />Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className="btn" onClick={onLoginClick}>Sign in</button>
        )}
      </div>
    </header>
  );
}
