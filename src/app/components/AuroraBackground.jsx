'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/* ============================================================
   Aurora Background – animated gradient blobs + stars + waves
   ============================================================ */
export default function AuroraBackground() {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 30 });
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
    }));
    setStars(generated);
  }, []);

  useEffect(() => {
    const handleMouse = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left - rect.width / 2) * 0.03);
      mouseY.set((e.clientY - rect.top - rect.height / 2) * 0.03);
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [mouseX, mouseY]);

  const blobs = [
    { color: 'rgba(255, 107, 107, 0.18)', size: 600, x: '10%', y: '5%', dur: 18 },
    { color: 'rgba(155, 109, 255, 0.15)', size: 700, x: '60%', y: '10%', dur: 22 },
    { color: 'rgba(255, 184, 107, 0.14)', size: 500, x: '80%', y: '60%', dur: 15 },
    { color: 'rgba(61, 220, 151, 0.12)', size: 400, x: '20%', y: '70%', dur: 20 },
    { color: 'rgba(110, 231, 200, 0.10)', size: 550, x: '50%', y: '45%', dur: 25 },
    { color: 'rgba(255, 200, 87, 0.10)', size: 350, x: '35%', y: '20%', dur: 17 },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Main gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #FFF8F2 0%, #FFEDE1 40%, #F9F5FF 100%)',
        }}
      />

      {/* Animated aurora blobs */}
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: blob.x,
            top: blob.y,
            width: blob.size,
            height: blob.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
            filter: 'blur(60px)',
            x: springX,
            y: springY,
          }}
          animate={{
            x: [0, 40, -30, 20, 0],
            y: [0, -30, 40, -20, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: blob.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 1.5,
          }}
        />
      ))}

      {/* Twinkling stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: 'rgba(155, 109, 255, 0.6)',
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Subtle mesh grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(155, 109, 255, 0.04) 1px, transparent 0)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Gradient overlay bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: 'linear-gradient(to top, rgba(249, 245, 255, 0.4), transparent)',
        }}
      />
    </div>
  );
}
