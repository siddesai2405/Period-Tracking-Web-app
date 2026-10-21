"use client";

/** Tiny dependency-free canvas confetti for delight moments. */
export function burstConfetti(opts: { particles?: number; durationMs?: number; colors?: string[] } = {}) {
  if (typeof window === "undefined") return;
  const particles = opts.particles ?? 90;
  const duration = opts.durationMs ?? 1400;
  const colors = opts.colors ?? ["#f43f70", "#fb7299", "#a855f7", "#fde68a", "#fff"];

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.35;
  const items = Array.from({ length: particles }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 6;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      g: 0.18 + Math.random() * 0.12,
      size: 5 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[(Math.random() * colors.length) | 0],
      life: 1,
    };
  });

  const start = performance.now();
  function frame(t: number) {
    const elapsed = t - start;
    const alpha = Math.max(0, 1 - elapsed / duration);
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    items.forEach((p) => {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (elapsed < duration) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
