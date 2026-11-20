import { useEffect, useState } from 'react';

const GLITTER_COLORS = ['#ffdd51', '#ea5f5c', '#78a0d0', '#d6de19', '#fcf7e0', '#009fa3', '#ffffff'];
const GLITTER_SHAPES = ['dot', 'square', 'star'] as const;
const GLITTER_COUNT = 70;
const DURATION_MS = 4500;

interface Glitter {
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  color: string;
  shape: typeof GLITTER_SHAPES[number];
}

function makeGlitter(): Glitter[] {
  return Array.from({ length: GLITTER_COUNT }, () => ({
    left: Math.random() * 100,
    size: 6 + Math.random() * 10,
    delay: Math.random() * 1.6,
    duration: 2.2 + Math.random() * 2,
    drift: (Math.random() - 0.5) * 120,
    color: GLITTER_COLORS[Math.floor(Math.random() * GLITTER_COLORS.length)],
    shape: GLITTER_SHAPES[Math.floor(Math.random() * GLITTER_SHAPES.length)],
  }));
}

/** Animation plein écran quand un joueur réalise un Flip 7 : GIF + pluie de paillettes */
export default function Flip7Celebration({ playerName, onDone }: { playerName: string; onDone: () => void }) {
  const [glitter] = useState(makeGlitter);

  useEffect(() => {
    const timer = window.setTimeout(onDone, DURATION_MS);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone(); };
    window.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(timer); window.removeEventListener('keydown', onKey); };
  }, [onDone]);

  return (
    <div className="flip7-overlay" onClick={onDone} role="dialog" aria-label={`Flip 7 pour ${playerName}`}>
      <div className="flip7-glitter" aria-hidden="true">
        {glitter.map((g, i) => (
          <span
            key={i}
            className={`glitter glitter-${g.shape}`}
            style={{
              left: `${g.left}%`,
              width: g.size,
              height: g.size,
              background: g.color,
              animationDelay: `${g.delay}s, ${g.delay}s`,
              animationDuration: `${g.duration}s, 0.6s`,
              '--drift': `${g.drift}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="flip7-card">
        <div className="flip7-title">Flip 7 !</div>
        <img src="/flip7.gif" alt="" className="flip7-gif" />
        <div className="flip7-player">{playerName}</div>
        <div className="flip7-bonus">+15 points</div>
      </div>
    </div>
  );
}
