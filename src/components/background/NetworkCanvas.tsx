import { useEffect, useRef } from 'react';
import { usePrefs } from '../../context/Preferences';

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

/**
 * Calm, interactive "network of nodes" background for the hero.
 * - Density scales with area (capped), DPR capped at 2.
 * - Pauses when off-screen or tab hidden; renders one static frame when motion is off.
 * - Colors come from CSS variables (--net-dot / --net-line) so it follows the theme.
 */
export function NetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { motion, theme } = usePrefs();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const dotRGB = css.getPropertyValue('--net-dot').trim() || '120 200 255';
    const lineRGB = css.getPropertyValue('--net-line').trim() || '60 130 255';
    const small = window.matchMedia('(max-width: 760px)').matches;

    let w = 0;
    let h = 0;
    let dots: Dot[] = [];
    let raf = 0;
    let last = performance.now();
    let inView = true;
    const mouse = { x: -1e4, y: -1e4 };
    const linkDist = small ? 105 : 140;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(Math.max((w * h) / 16000, 22), small ? 38 : 85));
      dots = Array.from({ length: count }, () => {
        const a = Math.random() * Math.PI * 2;
        const s = 6 + Math.random() * 12; // px per second
        return { x: Math.random() * w, y: Math.random() * h, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 0.8 + Math.random() * 1.1 };
      });
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.x < -10) d.x = w + 10;
        else if (d.x > w + 10) d.x = -10;
        if (d.y < -10) d.y = h + 10;
        else if (d.y > h + 10) d.y = -10;

        const mdx = mouse.x - d.x;
        const mdy = mouse.y - d.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 170 && md > 1) {
          d.x += (mdx / md) * 8 * dt; // gentle attraction
          d.y += (mdy / md) * 8 * dt;
        }
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < dots.length; i++) {
        const a = dots[i];
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            const alpha = (1 - Math.sqrt(d2) / linkDist) * 0.32;
            ctx.strokeStyle = `rgb(${lineRGB} / ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const md = Math.hypot(mouse.x - a.x, mouse.y - a.y);
        if (md < 170) {
          ctx.strokeStyle = `rgb(${dotRGB} / ${((1 - md / 170) * 0.5).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = `rgb(${dotRGB} / 0.85)`;
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };
    const play = () => {
      cancelAnimationFrame(raf);
      if (!motion || !inView || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -1e4;
    };
    const onResize = () => {
      resize();
      if (!motion) draw(0);
    };

    resize();
    draw(0);
    play();

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      play();
    });
    io.observe(canvas);
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', play);
    if (motion) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', play);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [motion, theme]);

  return <canvas ref={ref} className="network-canvas" aria-hidden="true" />;
}
