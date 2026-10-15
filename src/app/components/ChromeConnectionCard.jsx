'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Globe2 } from 'lucide-react';

export default function ChromeConnectionCard({ connected = true, onReconnect }) {
  const [reconnecting, setReconnecting] = useState(false);

  const handleReconnect = async () => {
    setReconnecting(true);
    await new Promise(r => setTimeout(r, 2000));
    setReconnecting(false);
    onReconnect?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      style={{
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 20,
        border: connected
          ? '1px solid rgba(61, 220, 151, 0.25)'
          : '1px solid rgba(255, 200, 87, 0.3)',
        boxShadow: connected
          ? '0 4px 24px rgba(61, 220, 151, 0.08)'
          : '0 4px 24px rgba(255, 200, 87, 0.1)',
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Chrome icon */}
        <motion.div
          whileHover={{ rotate: 15, scale: 1.08 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #4285F4 0%, #EA4335 33%, #FBBC05 66%, #34A853 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(66, 133, 244, 0.3)',
            flexShrink: 0,
          }}
        >
          <Globe2 size={22} color="#fff" strokeWidth={2} />
        </motion.div>

        {/* Status info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1028', letterSpacing: '-0.02em' }}>
              Chrome
            </span>

            {/* Status badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: connected ? 'rgba(61, 220, 151, 0.1)' : 'rgba(255, 200, 87, 0.12)',
                borderRadius: 999,
                padding: '3px 10px',
              }}
            >
              {/* Pulse dot */}
              <div style={{ position: 'relative', width: 7, height: 7 }}>
                <motion.div
                  animate={{
                    scale: connected ? [1, 1.8, 1] : [1, 1.5, 1],
                    opacity: connected ? [1, 0, 1] : [0.8, 0.3, 0.8],
                  }}
                  transition={{ duration: connected ? 2 : 1.5, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: connected ? '#3DDC97' : '#FFC857',
                    opacity: 0.4,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 1,
                    borderRadius: '50%',
                    background: connected ? '#3DDC97' : '#FFC857',
                  }}
                />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: connected ? '#3DDC97' : '#FFC857' }}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#9b92ae', marginTop: 2, fontWeight: 400 }}>
            {connected ? 'Ready for automation' : 'Chrome not detected'}
          </div>
        </div>

        {/* Reconnect button */}
        {!connected && (
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleReconnect}
            disabled={reconnecting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #FFB86B, #FF6B6B)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              fontSize: 13,
              cursor: reconnecting ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(255, 184, 107, 0.3)',
            }}
          >
            <motion.div
              animate={{ rotate: reconnecting ? 360 : 0 }}
              transition={{ duration: 1, repeat: reconnecting ? Infinity : 0, ease: 'linear' }}
            >
              <RefreshCw size={13} />
            </motion.div>
            {reconnecting ? 'Reconnecting...' : 'Reconnect'}
          </motion.button>
        )}

        {connected && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Wifi size={18} style={{ color: '#3DDC97' }} />
          </motion.div>
        )}
      </div>

      {/* Connection details */}
      {connected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            marginTop: 14,
            padding: '10px 12px',
            background: 'rgba(61, 220, 151, 0.04)',
            borderRadius: 12,
            border: '1px solid rgba(61, 220, 151, 0.1)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          {[
            { label: 'Extension', value: 'v2.4.1', color: '#3DDC97' },
            { label: 'Protocol', value: 'CDP 1.3', color: '#9B6DFF' },
            { label: 'Port', value: '9222', color: '#FFB86B' },
            { label: 'Latency', value: '12ms', color: '#FF6B6B' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#9b92ae', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
