'use client';

import { useEffect } from 'react';
import { LayoutDashboard, Bot, History, ShieldCheck, Zap, PanelLeft, Plus } from 'lucide-react';

const NAV = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'agent', label: 'Agent', icon: Bot },
  { id: 'sessions', label: 'Sessions', icon: History },
  { id: 'rules', label: 'Approval rules', icon: ShieldCheck },
];

// The same breakpoint as globals.css, where the open rail stops being a column
// beside the page and becomes a drawer over it.
const PHONE = '(max-width: 680px)';
const onPhone = () => typeof window !== 'undefined' && window.matchMedia(PHONE).matches;

export default function Sidebar({
  expanded,
  onToggle,
  activeView,
  onViewChange,
  onNewTask,
  needsYou = 0,
  isRunning,
}) {
  // On a phone the drawer covers the page, so choosing where to go also puts
  // it away. Elsewhere the open rail is a column that can stay open.
  const thenClose = (go) => () => {
    go();
    if (expanded && onPhone()) onToggle();
  };

  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && onPhone()) onToggle();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [expanded, onToggle]);

  return (
    <>
    {expanded && (
      // Shown only on phones (globals.css). A real button, so tapping beside
      // the drawer closes it and a screen reader can find the way out.
      <button type="button" className="rail-scrim" aria-label="Close navigation" onClick={onToggle} />
    )}
    <aside className={`rail${expanded ? ' is-open' : ''}`}>
      <button
        type="button"
        className="rail-brand"
        onClick={onToggle}
        aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
        aria-expanded={expanded}
      >
        <span className="rail-mark"><Zap size={18} strokeWidth={2.4} aria-hidden="true" /></span>
        <span className="rail-name">BrowseAI</span>
      </button>

      {/* The one thing you come here to do, so it is the one filled button. */}
      <button
        type="button"
        className="rail-new"
        onClick={thenClose(onNewTask)}
        title={!expanded ? 'New task' : undefined}
      >
        <Plus size={17} strokeWidth={2.6} aria-hidden="true" />
        <span>New task</span>
      </button>

      <nav aria-label="Main navigation" style={{ display: 'grid', gap: 4 }}>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`rail-link${activeView === id ? ' is-active' : ''}`}
            onClick={thenClose(() => onViewChange(id))}
            title={!expanded ? label : undefined}
            aria-current={activeView === id ? 'page' : undefined}
          >
            <Icon size={18} strokeWidth={2} aria-hidden="true" />
            <span>{label}</span>
            {id === 'agent' && needsYou > 0 && expanded && <span className="rail-badge">{needsYou}</span>}
          </button>
        ))}
      </nav>

      <div className="rail-foot">
        <div className="rail-note" title={!expanded ? (isRunning ? 'Agent running' : 'Chromium ready') : undefined}>
          <span className={`dot ${isRunning ? 'dot-live' : 'dot-idle'}`} />
          <span>{isRunning ? 'Agent running' : 'Chromium ready'}</span>
        </div>
        {expanded && (
          <button type="button" className="rail-link" onClick={onToggle}>
            <PanelLeft size={18} strokeWidth={2} aria-hidden="true" />
            <span>Collapse</span>
          </button>
        )}
      </div>
    </aside>
    </>
  );
}
