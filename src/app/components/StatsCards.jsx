'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle2, Target, Timer } from 'lucide-react';
import { getStatsOverview } from '../lib/api';
import { useAuth } from '../lib/auth-context';

function useCountUp(target) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(target)) return undefined;
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / 700);
      setN(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return n;
}

function Stat({ icon: Icon, label, value, suffix = '', sub, meter, index }) {
  const shown = useCountUp(value);
  const text = Number.isFinite(value)
    ? (Number.isInteger(value) ? Math.round(shown) : shown.toFixed(1))
    : '—';

  // Feeds the card's sheen (globals.css reads --mx/--my); set on the node
  // directly so moving the pointer never costs a React render.
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <motion.div
      className="stat"
      onMouseMove={onMove}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 26 }}
    >
      <div className="stat-label"><Icon size={15} aria-hidden="true" />{label}</div>
      <div className="stat-value">{text}{Number.isFinite(value) ? suffix : ''}</div>
      {meter != null && <div className="meter"><i style={{ width: `${Math.max(0, Math.min(100, meter))}%` }} /></div>}
      {sub && <div className="stat-sub">{sub}</div>}
    </motion.div>
  );
}

export default function StatsCards() {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    getStatsOverview('mine')
      .then((d) => { if (alive) { setLoaded(d); setFailed(false); } })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [user]);

  // Signing out must not leave the last account's numbers on screen.
  const data = user ? loaded : null;
  const rate = data?.completionRate != null ? Math.round(data.completionRate * 100) : null;
  const recovery = data?.recoverySuccessRate != null ? Math.round(data.recoverySuccessRate * 100) : null;

  return (
    <div className="stat-grid">
      <Stat
        index={0}
        icon={Zap}
        label="Tasks run"
        value={data?.tasksTotal ?? (user ? 0 : NaN)}
        sub={!user ? 'Sign in to see your runs' : failed ? 'Could not load stats' : 'All time'}
      />
      <Stat
        index={1}
        icon={CheckCircle2}
        label="Completed"
        value={data?.tasksCompleted ?? (user ? 0 : NaN)}
        sub={rate != null ? `${rate}% of finished runs` : ' '}
      />
      <Stat
        index={2}
        icon={Target}
        label="Success rate"
        value={rate ?? (user ? 0 : NaN)}
        suffix="%"
        meter={rate ?? 0}
        sub={recovery != null ? `${recovery}% of stuck steps recovered` : ' '}
      />
      <Stat
        index={3}
        icon={Timer}
        label="Median run"
        value={data?.medianDurationSeconds ?? (user ? 0 : NaN)}
        suffix="s"
        sub="Per task"
      />
    </div>
  );
}
