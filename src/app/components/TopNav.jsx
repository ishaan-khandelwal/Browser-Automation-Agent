'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export default function TopNav({ sidebarExpanded, onLoginClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const name = user?.displayName || user?.email?.split('@')[0];
  return (
    <motion.nav className="app-topnav" style={{ left: sidebarExpanded ? 236 : 80, right: 312 }} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} aria-label="Workspace toolbar">
      <div className="topnav-context"><span className="topnav-mark">B</span><span>Workspace</span><span className="topnav-slash">/</span><strong>Automation</strong></div>
      <div className="topnav-actions">
        <div className="connection-state"><span /> Task workspace</div>
        {user ? (
          <div className="account-wrap">
            <button className="account-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen}>
              <span className="account-avatar">{(name || 'U')[0].toUpperCase()}</span><span className="account-name">{name}</span><ChevronDown size={14} />
            </button>
            <AnimatePresence>{menuOpen && <motion.div className="account-menu" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
              <span className="account-email">{user.email}</span><button onClick={() => { setMenuOpen(false); logout(); }}><LogOut size={14} /> Sign out</button>
            </motion.div>}</AnimatePresence>
          </div>
        ) : <button className="sign-in-button" onClick={onLoginClick}><UserRound size={15} /> Sign in</button>}
      </div>
    </motion.nav>
  );
}
