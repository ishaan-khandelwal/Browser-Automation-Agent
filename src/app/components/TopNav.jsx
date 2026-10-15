'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Zap, LogOut, User } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export default function TopNav({ sidebarExpanded, onLoginClick }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [avatarMenu, setAvatarMenu] = useState(false);
  const { user, logout } = useAuth();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      style={{
        position: 'fixed',
        top: 12,
        left: sidebarExpanded ? 260 + 12 : 68 + 12,
        right: 320 + 12,
        zIndex: 90,
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 20,
        border: '1px solid rgba(255, 255, 255, 0.85)',
        boxShadow: '0 4px 24px rgba(155, 109, 255, 0.08), 0 1px 4px rgba(0,0,0,0.04)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #FF6B6B, #9B6DFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={13} color="#fff" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1028', letterSpacing: '-0.02em' }}>BrowseAI</span>
        </div>
        <span style={{ color: '#9b92ae', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 13, color: '#5a4d6e', fontWeight: 600 }}>Dashboard</span>
      </div>

      <motion.div
        animate={{ width: searchOpen ? 240 : 150 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ background: 'rgba(155, 109, 255, 0.06)', borderRadius: 12, border: searchOpen ? '1px solid rgba(155, 109, 255, 0.25)' : '1px solid rgba(155, 109, 255, 0.1)', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.2s ease' }}
        onClick={() => setSearchOpen(!searchOpen)}
      >
        <Search size={13} style={{ color: '#9b92ae', flexShrink: 0 }} />
        <input placeholder="Search tasks..." style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: 13, color: '#1a1028', width: '100%' }} onFocus={() => setSearchOpen(true)} onBlur={() => setSearchOpen(false)} />
        {!searchOpen && <span style={{ fontSize: 10, color: '#9b92ae', background: 'rgba(155, 109, 255, 0.08)', borderRadius: 5, padding: '2px 5px', fontWeight: 600, flexShrink: 0 }}>⌘K</span>}
      </motion.div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', background: 'rgba(61, 220, 151, 0.08)', borderRadius: 999, border: '1px solid rgba(61, 220, 151, 0.2)' }}>
        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#3DDC97' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#3DDC97' }}>All systems go</span>
      </div>

      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} style={{ width: 36, height: 36, borderRadius: 11, border: 'none', background: 'rgba(155, 109, 255, 0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Bell size={15} style={{ color: '#9b92ae' }} />
        <div style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: '#FF6B6B', border: '1.5px solid #fff' }} />
      </motion.button>

      {user ? (
        <div style={{ position: 'relative' }}>
          <motion.button id="top-nav-avatar-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setAvatarMenu(!avatarMenu)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(155, 109, 255, 0.08)', border: '1px solid rgba(155, 109, 255, 0.15)', borderRadius: 12, padding: '6px 12px 6px 6px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg, #FF6B6B, #9B6DFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1028' }}>{user.displayName || user.email?.split('@')[0]}</span>
          </motion.button>
          <AnimatePresence>
            {avatarMenu && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 32px rgba(155, 109, 255, 0.15)', padding: 6, minWidth: 160, zIndex: 200 }}>
                <div style={{ padding: '8px 12px', fontSize: 11, color: '#9b92ae', fontWeight: 600 }}>{user.email}</div>
                <div style={{ height: 1, background: 'rgba(155,109,255,0.08)', margin: '4px 0' }} />
                <motion.button whileHover={{ background: 'rgba(255, 107, 107, 0.06)' }} onClick={() => { setAvatarMenu(false); logout(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 10, fontFamily: 'var(--font-sans)', fontSize: 13, color: '#FF6B6B', fontWeight: 600 }}>
                  <LogOut size={14} /> Sign out
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.button id="top-nav-login-btn" whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }} onClick={onLoginClick} style={{ height: 36, paddingLeft: 16, paddingRight: 16, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #FF6B6B, #9B6DFF)', color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(155, 109, 255, 0.3)' }}>
          <User size={14} /> Sign In
        </motion.button>
      )}
    </motion.nav>
  );
}
