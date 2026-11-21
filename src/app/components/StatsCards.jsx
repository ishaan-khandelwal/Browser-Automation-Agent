'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getStatsOverview } from '../lib/api';
import { useAuth } from '../lib/auth-context';

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function StatCard({ stat, index }) {
  const count = useCountUp(stat.value, 1400);
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 320, damping: 28 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 20,
        border: hovered ? `1px solid ${stat.color}30` : '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: hovered ? `0 12px 40px ${stat.color}20, 0 4px 16px rgba(0,0,0,0.04)` : '0 4px 20px rgba(155, 109, 255, 0.06)',
        padding: '20px 20px', cursor: 'default',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <motion.div animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.3 }} style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${stat.color}18 0%, transparent 70%)`, filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${stat.color}20, ${stat.color2}20)`, border: `1px solid ${stat.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 18 }}>{stat.icon}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, marginBottom: 4 }}>
        <motion.span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', background: `linear-gradient(135deg, ${stat.color}, ${stat.color2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
          {stat.isPercent ? `${count}%` : stat.prefix ? `${stat.prefix}${count}` : `${count}${stat.suffix || ''}`}
        </motion.span>
      </div>
      <div style={{ fontSize: 13, color: '#5a4d6e', fontWeight: 500 }}>{stat.label}</div>
      {stat.trend && (
        <div style={{ marginTop: 8, fontSize: 11, color: stat.trendUp ? '#3DDC97' : '#FF6B6B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
          {stat.trendUp ? '↑' : '↓'} {stat.trend}
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${stat.color}, ${stat.color2})`, borderRadius: '0 0 20px 20px', opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease' }} />
    </motion.div>
  );
}

const FALLBACK_STATS = [
  { icon: '⚡', label: "Today's Tasks", value: 0, color: '#FF6B6B', color2: '#FFB86B', trend: 'No data yet', trendUp: true },
  { icon: '✅', label: 'Completed Tasks', value: 0, color: '#3DDC97', color2: '#6EE7C8', trend: '', trendUp: true },
  { icon: '🎯', label: 'Success Rate', value: 0, isPercent: true, color: '#9B6DFF', color2: '#FFB86B', trend: '', trendUp: true },
  { icon: '⏱️', label: 'Median Duration', value: 0, suffix: 's', color: '#FFC857', color2: '#FFB86B', trend: '', trendUp: true },
];

export default function StatsCards() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    getStatsOverview('mine').then((data) => {
      if (!data) return;
      const rate = data.completionRate != null ? Math.round(data.completionRate * 100) : 0;
      const med = data.medianDurationSeconds != null ? Math.round(data.medianDurationSeconds) : 0;
      setStats([
        { icon: '⚡', label: "Total Tasks", value: data.tasksTotal || 0, color: '#FF6B6B', color2: '#FFB86B', trend: data.tasksTotal > 0 ? 'All time' : 'No tasks yet', trendUp: true },
        { icon: '✅', label: 'Completed Tasks', value: data.tasksCompleted || 0, color: '#3DDC97', color2: '#6EE7C8', trend: `${rate}% success rate`, trendUp: true },
        { icon: '🎯', label: 'Success Rate', value: rate, isPercent: true, color: '#9B6DFF', color2: '#FFB86B', trend: '', trendUp: true },
        { icon: '⏱️', label: 'Median Duration', value: med, suffix: 's', color: '#FFC857', color2: '#FFB86B', trend: 'Per task', trendUp: true },
      ]);
    }).catch(() => {});
  }, [user]);

  return (
    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {stats.map((stat, i) => <StatCard key={stat.label} stat={stat} index={i} />)}
    </div>
  );
}
