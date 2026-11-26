'use client';

import { useEffect, useRef } from 'react';

/**
 * Fades a section up as it scrolls into view. Uses an IntersectionObserver and
 * a class rather than per-frame state, so scrolling stays cheap, and it adds
 * the class once and then stops watching -- sections should not re-animate when
 * you scroll back up. `prefers-reduced-motion` neutralises the transition in
 * globals.css, and the element is visible either way.
 */
export default function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // No observer (or reduced motion): show it immediately.
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in');
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}
