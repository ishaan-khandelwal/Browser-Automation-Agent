'use client';
import { motion } from 'framer-motion';
import { Bot, Clock3, LayoutDashboard, Sparkles, Zap } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', id: 'dashboard' },
  { icon: Bot, label: 'Agent', id: 'agent' },
  { icon: Clock3, label: 'Sessions', id: 'sessions' },
  { icon: Clock3, label: 'History', id: 'history' },
];

export default function Sidebar({ expanded, onToggle, activeView, onViewChange }) {
  return (
    <motion.aside className="app-sidebar" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, display: 'flex', flexDirection: 'column', padding: '16px 10px' }} animate={{ width: expanded ? 224 : 68 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
      <button className="brand-lockup" onClick={onToggle} aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}>
        <span className="brand-mark"><Zap size={18} fill="currentColor" /></span>
        {expanded && <span className="brand-name">BrowseAI<small>Browser workspace</small></span>}
      </button>
      <div className="sidebar-caption">{expanded ? 'WORKSPACE' : ''}</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(({ icon: Icon, label, id }) => (
          <button key={id} className={`sidebar-link ${activeView === id ? 'is-active' : ''}`} onClick={() => onViewChange(id)} title={!expanded ? label : undefined} aria-current={activeView === id ? 'page' : undefined}>
            <Icon size={18} strokeWidth={2} /><span>{expanded && label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        {expanded && <div className="sidebar-note"><Sparkles size={15} /><span>Human guided automation</span></div>}
        <div className="sidebar-profile"><span className="profile-avatar">B</span>{expanded && <span>BrowseAI<small>Browser workspace</small></span>}</div>
      </div>
    </motion.aside>
  );
}
