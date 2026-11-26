'use client';

/**
 * The 3D backdrop: a receding grid floor plus an orbiting ring system.
 * Pure CSS 3D transforms, so it costs no JavaScript on every frame and no
 * WebGL context, and `prefers-reduced-motion` stops it (see globals.css).
 * It sits behind everything and never takes pointer events.
 */
export default function Scene3D() {
  return (
    <div className="scene3d" aria-hidden="true">
      <div className="scene3d-glow" />
      <div className="scene3d-orbit">
        <div className="scene3d-ring"><span className="scene3d-sat" /></div>
        <div className="scene3d-ring" />
        <div className="scene3d-ring" />
      </div>
      <div className="scene3d-floor">
        <div className="scene3d-grid" />
      </div>
    </div>
  );
}
