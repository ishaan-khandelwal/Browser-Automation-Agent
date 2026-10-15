'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, LayoutDashboard, History, Settings,
  ChevronRight, Bot, Globe, Cpu, Sparkles, BookOpen
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', active: true },
  { icon: Bot, label: 'Agent', id: 'agent' },
  { icon: Globe, label: 'Sessions', id: 'sessions' },
  { icon: History, label: 'History', id: 'history' },
  { icon: BookOpen, label: 'Docs', id: 'docs' },
  { icon: Cpu, label: 'Models', id: 'models' },
];

const bottomItems = [
  { icon: Sparkles, label: 'Upgrade', id: 'upgrade' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

export default function Sidebar({ expanded, onToggle, activeView, onViewChange }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <motion.aside
      animate={{ width: expanded ? 240 : 68 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.75)',
        boxShadow: '4px 0 32px rgba(155, 109, 255, 0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: expanded ? '24px 20px 20px' : '24px 14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <motion.div
          whileHover={{ scale: 1.08, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #FF6B6B, #FFB86B, #9B6DFF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(155, 109, 255, 0.35)',
          }}
        >
          <Zap size={20} color="#fff" strokeWidth={2.5} />
        </motion.div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Animated "BrowseAI" — letter-by-letter spring + shimmer gradient */}
              <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
                {'BrowseAI'.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.6 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: i * 0.055,
                      type: 'spring',
                      stiffness: 500,
                      damping: 22,
                    }}
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      display: 'inline-block',
                      background: 'linear-gradient(90deg, #FF6B6B, #FFB86B, #9B6DFF, #6EE7C8, #FF6B6B)',
                      backgroundSize: '300% 100%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      animation: `shimmerName ${2.5 + i * 0.1}s linear infinite`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '100%' }}
                transition={{ delay: 0.55, duration: 0.4 }}
                style={{ fontSize: 11, color: '#9b92ae', fontWeight: 500, marginTop: 3 }}
              >
                Automation Agent
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {expanded && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              style={{
                marginLeft: 'auto',
                background: 'rgba(155, 109, 255, 0.1)',
                border: 'none',
                borderRadius: 8,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#9b92ae',
              }}
            >
              <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <div
              key={item.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <motion.button
                whileHover={{ x: expanded ? 3 : 0, scale: expanded ? 1 : 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onViewChange(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: expanded ? '10px 14px' : '10px',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  borderRadius: 14,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.12), rgba(155, 109, 255, 0.12))'
                    : hoveredItem === item.id
                    ? 'rgba(155, 109, 255, 0.06)'
                    : 'transparent',
                  color: isActive ? '#9B6DFF' : '#5a4d6e',
                  transition: 'background 0.2s ease, color 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '15%',
                      height: '70%',
                      width: 3,
                      borderRadius: '0 3px 3px 0',
                      background: 'linear-gradient(to bottom, #FF6B6B, #9B6DFF)',
                    }}
                  />
                )}

                <motion.div
                  animate={{ rotate: isActive ? 5 : 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{ flexShrink: 0 }}
                >
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{
                      color: isActive ? '#9B6DFF' : hoveredItem === item.id ? '#FF6B6B' : '#9b92ae',
                      transition: 'color 0.2s ease',
                    }}
                  />
                </motion.div>

                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Tooltip for collapsed state */}
              {!expanded && hoveredItem === item.id && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="tooltip"
                  style={{ opacity: 1 }}
                >
                  {item.label}
                </motion.div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div style={{ padding: '8px 10px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            height: 1,
            background: 'rgba(155, 109, 255, 0.1)',
            marginBottom: 8,
          }}
        />
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isUpgrade = item.id === 'upgrade';
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: expanded ? 3 : 0, scale: expanded ? 1 : 1.05 }}
              whileTap={{ scale: 0.96 }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: expanded ? '10px 14px' : '10px',
                justifyContent: expanded ? 'flex-start' : 'center',
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 500,
                background: isUpgrade
                  ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(155, 109, 255, 0.1))'
                  : 'transparent',
                color: isUpgrade ? '#FF6B6B' : '#9b92ae',
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18 }}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}

        {/* User avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: expanded ? '10px 14px' : '10px', justifyContent: expanded ? 'flex-start' : 'center' }}>
          <motion.div
            whileHover={{ scale: 1.08 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #FFB86B, #FF6B6B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255, 184, 107, 0.4)',
            }}
          >
            I
          </motion.div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1028' }}>Ishaan</div>
                <div style={{ fontSize: 11, color: '#9b92ae' }}>Pro Plan</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
