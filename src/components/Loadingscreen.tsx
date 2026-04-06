"use client";

import { useEffect, useState, useRef } from "react";

// ─── Particle canvas ───────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const PARTICLE_COUNT = 80;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 230, 207, ${p.opacity})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(168, 230, 207, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Orbiting ring ──────────────────────────────────────────────────────────
function OrbitRing({ size, duration, delay, color, dotSize = 6 }) {
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `1px solid rgba(168,230,207,0.08)`,
        animation: `spin ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -dotSize / 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 ${dotSize * 2}px ${color}`,
        }}
      />
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────
/**
 * LoadingScreen — drop this wherever you await a slow API call.
 *
 * Props
 * ─────
 * isVisible  boolean  — show/hide the overlay          default: true
 * message    string   — headline (unused, rotates auto) default: "Loading your experience"
 *
 * Usage example
 * ─────────────
 * const [loading, setLoading] = useState(true);
 *
 * useEffect(() => {
 *   fetchData().finally(() => setLoading(false));
 * }, []);
 *
 * return (
 *   <>
 *     <LoadingScreen isVisible={loading} />
 *     {!loading && <YourPage />}
 *   </>
 * );
 */
export default function LoadingScreen({ isVisible = true }) {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState(".");
  const [phase, setPhase] = useState(0);

  const MESSAGES = [
    "Connecting to server",
    "Fetching your data",
    "Almost ready",
    "Polishing the details",
  ];

  useEffect(() => {
    if (!isVisible) return;

    const totalMs = 5000;
    const startTime = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const raw = Math.min(elapsed / totalMs, 1);
      const eased = 1 - Math.pow(1 - raw, 3); // cubic ease-out
      setProgress(Math.round(eased * 97)); // cap at 97% — data finishes it

      if (raw < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);

    const phaseTimer = setInterval(() => {
      setPhase((p) => Math.min(p + 1, MESSAGES.length - 1));
    }, 1200);

    const dotsTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 400);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(phaseTimer);
      clearInterval(dotsTimer);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400&display=swap');

        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes pulse-glow  { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes flicker     { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:.4} 95%{opacity:1} 97%{opacity:.6} 99%{opacity:1} }
        @keyframes scanline    { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes bar-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes text-in     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes breathe     {
          0%,100%{box-shadow:0 0 30px rgba(168,230,207,.15),0 0 80px rgba(168,230,207,.05)}
          50%    {box-shadow:0 0 60px rgba(168,230,207,.3), 0 0 120px rgba(168,230,207,.1)}
        }

        .__ls *{box-sizing:border-box;margin:0;padding:0}

        .__ls {
          font-family:'Syne',sans-serif;
          position:fixed;inset:0;z-index:9999;
          background:#ff0;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          overflow:hidden;color:#a8e6cf;
        }
        .__ls::after {
          content:'';position:absolute;inset:0;
          background:radial-gradient(ellipse at center,transparent 40%,#070b12 100%);
          pointer-events:none;z-index:1;
        }
        .__ls-scanline{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}
        .__ls-scanline::after{
          content:'';position:absolute;left:0;right:0;height:120px;
          background:linear-gradient(transparent,rgba(168,230,207,.02),transparent);
          animation:scanline 6s linear infinite;
        }
        .__ls-content{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;gap:40px}

        .__ls-orbital{position:relative;width:180px;height:180px;display:flex;align-items:center;justify-content:center}
        .__ls-orbital>div{position:absolute;display:flex;align-items:center;justify-content:center}

        .__ls-core{
          width:42px;height:42px;border-radius:50%;
          background:radial-gradient(circle at 35% 35%,#d4f5e9,#3ccf8e);
          animation:breathe 2.5s ease-in-out infinite,pulse-glow 2.5s ease-in-out infinite;
          box-shadow:0 0 30px rgba(168,230,207,.4);z-index:4;
        }
        .__ls-logo{
          font-size:11px;letter-spacing:.35em;text-transform:uppercase;
          color:rgba(168,230,207,.35);font-family:'DM Mono',monospace;font-weight:300;
          animation:flicker 8s infinite;
        }
        .__ls-status{
          font-size:22px;font-weight:700;letter-spacing:-.02em;
          color:#e8faf3;text-align:center;min-height:32px;
          animation:text-in .4s ease both;
        }
        .__ls-prog-wrap{width:280px;display:flex;flex-direction:column;gap:10px}
        .__ls-track{
          height:2px;background:rgba(168,230,207,.1);border-radius:99px;overflow:visible;position:relative;
        }
        .__ls-fill{
          height:100%;border-radius:99px;
          background:linear-gradient(90deg,#3ccf8e 0%,#a8e6cf 40%,#3ccf8e 60%,#a8e6cf 100%);
          background-size:200% auto;
          animation:bar-shimmer 2s linear infinite;
          transition:width .4s cubic-bezier(.4,0,.2,1);
          box-shadow:0 0 12px rgba(60,207,142,.6);
        }
        .__ls-dot{
          position:absolute;top:-3px;width:8px;height:8px;border-radius:50%;
          background:#a8e6cf;box-shadow:0 0 10px 4px rgba(168,230,207,.5);
          transition:left .4s cubic-bezier(.4,0,.2,1);
        }
        .__ls-labels{
          display:flex;justify-content:space-between;
          font-family:'DM Mono',monospace;font-size:10px;
          color:rgba(168,230,207,.35);letter-spacing:.1em;
        }
        .__ls-sub{
          font-family:'DM Mono',monospace;font-size:11px;
          color:rgba(168,230,207,.4);letter-spacing:.08em;
          animation:text-in .3s ease both;
        }
        .__ls-corner{position:absolute;width:48px;height:48px;z-index:3;opacity:.25}
        .__ls-corner svg{width:100%;height:100%}
        .__ls-tl{top:24px;left:24px}
        .__ls-tr{top:24px;right:24px;transform:scaleX(-1)}
        .__ls-bl{bottom:24px;left:24px;transform:scaleY(-1)}
        .__ls-br{bottom:24px;right:24px;transform:scale(-1)}
      `}</style>

      <div className="__ls">
        <ParticleCanvas />
        <div className="__ls-scanline" />

        {/* Corner brackets */}
        {[
          ["__ls-tl", "__ls-corner"],
          ["__ls-tr", "__ls-corner"],
          ["__ls-bl", "__ls-corner"],
          ["__ls-br", "__ls-corner"],
        ].map(([pos, base]) => (
          <div key={pos} className={`${base} ${pos}`}>
            <svg viewBox="0 0 48 48" fill="none">
              <path
                d="M2 46 L2 2 L46 2"
                stroke="#a8e6cf"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ))}

        <div className="__ls-content">
          <span className="__ls-logo">Qurilo initializing</span>

          {/* Orbital ring system */}
          <div className="__ls-orbital">
            <OrbitRing
              size={180}
              duration={7}
              delay={0}
              color="#3ccf8e"
              dotSize={7}
            />
            <OrbitRing
              size={130}
              duration={4.5}
              delay={-2}
              color="#a8e6cf"
              dotSize={5}
            />
            <OrbitRing
              size={90}
              duration={3}
              delay={-1}
              color="#68d9aa"
              dotSize={4}
            />
            <div className="__ls-core" />
          </div>

          {/* Status message */}
          <div className="__ls-status" key={phase}>
            {MESSAGES[phase]}
          </div>

          {/* Progress bar */}
          <div className="__ls-prog-wrap">
            <div className="__ls-track">
              <div className="__ls-fill" style={{ width: `${progress}%` }} />
              <div
                className="__ls-dot"
                style={{ left: `calc(${progress}% - 4px)` }}
              />
            </div>
            <div className="__ls-labels">
              <span>INIT</span>
              <span>{progress}%</span>
              <span>READY</span>
            </div>
          </div>

          <span className="__ls-sub">Please wait{dots}</span>
        </div>
      </div>
    </>
  );
}
