/**
 * ─────────────────────────────────────────────────────────────
 *  Floating Logo Engine
 * ─────────────────────────────────────────────────────────────
 *  Moves a fixed-position element through the *empty* space of the page.
 *
 *  How it works
 *  1. Obstacles: text, buttons, cards, images… (see FLOAT_SELECTORS) are measured
 *     in document coordinates and cached (re-measured on resize / layout change).
 *  2. Targets: candidate points (a jittered grid + "docks" = spaces reserved for the logo)
 *     are scored by clearance from obstacles, scroll direction, preferred side,
 *     travel distance and recently-visited penalty. The best one wins.
 *  3. Motion: the logo follows a quadratic Bézier "guide" toward the target
 *     (curved, varying speed), plus organic wander (layered sines), a light cursor
 *     reaction, all smoothed by a damped spring → no jumps, no jitter.
 *  4. Safety: targets are anchored to the document, so the logo drifts with the gap
 *     it lives in while scrolling, then glides to a new gap ahead of the scroll direction.
 *     If it ever passes behind content its opacity drops to a faint ghost.
 *     The layer is `pointer-events: none` and sits *below* the content layer.
 *
 *  Only transform / opacity / one CSS variable are written per frame (GPU-friendly).
 */

export const FLOAT_SELECTORS = {
  obstacles:
    'h1,h2,h3,h4,p,li,a,button,input,textarea,select,label,img,iframe,figure,.card,.chip,[data-float-avoid]',
  /** Anything inside these is skipped (fixed UI, dialogs, the logo layer itself). */
  ignore: '[data-float-ignore]',
  docks: '[data-float-dock]',
  sections: 'main > section',
  header: '[data-float-header]',
  fixed: '[data-float-fixed]',
} as const;

interface Vec {
  x: number;
  y: number;
}
/** Axis-aligned box. Doc boxes use document Y; fixed boxes use viewport Y. */
interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
}
interface Dock {
  box: Box;
  scale: number;
}
interface SectionInfo {
  top: number;
  bottom: number;
  scale: number;
}

export interface FloatEngineOptions {
  /** Base logo size in px (before scaling). */
  size: number;
  /** Lighter behaviour for phones: smaller wander, 30fps, no cursor reaction. */
  mobile: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Signed distance from point to box: positive outside, negative inside. */
function boxDistance(x: number, y: number, b: Box) {
  const dx = Math.max(b.l - x, 0, x - b.r);
  const dy = Math.max(b.t - y, 0, y - b.b);
  if (dx === 0 && dy === 0) return -Math.min(x - b.l, b.r - x, y - b.t, b.b - y);
  return Math.hypot(dx, dy);
}

export class FloatingLogoEngine {
  private readonly el: HTMLElement;
  private readonly size: number;
  private readonly mobile: boolean;

  // kinematics (viewport coords)
  private pos: Vec = { x: 0, y: 0 };
  private vel: Vec = { x: 0, y: 0 };
  private scale = 0.55;
  private opacity = 0;

  // path (document coords)
  private from: Vec = { x: 0, y: 0 };
  private ctrl: Vec = { x: 0, y: 0 };
  private target: Vec = { x: 0, y: 0 };
  private pathStart = 0;
  private pathDur = 1;
  private targetClear = 80;
  private targetScale = 1;
  private nextRetargetAt = 0;
  private lastRetargetAt = -1e9;
  private visited: { p: Vec; t: number }[] = [];
  private side: 0 | 1 = Math.random() < 0.5 ? 0 : 1;

  // layout cache
  private obstacles: Box[] = [];
  private visible: Box[] = [];
  private visibleAt = -1e9;
  private fixed: Box[] = [];
  private docks: Dock[] = [];
  private sections: SectionInfo[] = [];
  private sectionIndex = -1;
  private sectionScale = 1;
  private measuredAt = -1e9;
  private dirty = true;
  private vw = 0;
  private vh = 0;
  private topSafe = 80;

  // input
  private sy = 0;
  private lastSy = 0;
  private scrollDir: 1 | -1 = 1;
  private lastScrollAt = -1e9;
  private dirChanged = false;
  private mouse: Vec | null = null;

  // loop
  private rafId = 0;
  private lastT = 0;
  private running = false;
  private readonly phase = [rand(0, 6.28), rand(0, 6.28), rand(0, 6.28), rand(0, 6.28)];
  private ro: ResizeObserver | null = null;
  private readonly finePointer = window.matchMedia('(pointer: fine)').matches;

  constructor(el: HTMLElement, opts: FloatEngineOptions) {
    this.el = el;
    this.size = opts.size;
    this.mobile = opts.mobile;
  }

  /* ───────────── lifecycle ───────────── */

  start() {
    if (this.running) return;
    this.running = true;
    this.sy = this.lastSy = window.scrollY;
    this.measure(performance.now());

    // Start from the best spot (usually the hero dock) and "take off" with a fade/scale-in.
    const now = performance.now();
    this.chooseTarget(now, true);
    this.pos = { x: this.target.x, y: this.target.y - this.sy };
    this.from = { ...this.target };
    this.ctrl = { ...this.target };

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    if (this.finePointer && !this.mobile) {
      window.addEventListener('pointermove', this.onPointer, { passive: true });
      document.documentElement.addEventListener('pointerleave', this.onPointerLeave);
    }
    this.ro = new ResizeObserver(() => this.invalidate());
    this.ro.observe(document.body);

    this.lastT = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pointermove', this.onPointer);
    document.documentElement.removeEventListener('pointerleave', this.onPointerLeave);
    this.ro?.disconnect();
  }

  /** Call when layout changes in ways the engine can't observe (e.g. language switch). */
  invalidate() {
    this.dirty = true;
  }

  /* ───────────── events ───────────── */

  private onScroll = () => {
    const y = window.scrollY;
    const dy = y - this.lastSy;
    if (Math.abs(dy) > 0.5) {
      const dir: 1 | -1 = dy > 0 ? 1 : -1;
      if (dir !== this.scrollDir) {
        this.scrollDir = dir;
        this.dirChanged = true;
      }
      this.lastScrollAt = performance.now();
    }
    this.lastSy = y;
    this.sy = y;
  };

  private onResize = () => {
    this.dirty = true;
    this.nextRetargetAt = 0;
  };

  private onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.rafId);
    } else if (this.running) {
      this.lastT = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    }
  };

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    this.mouse = { x: e.clientX, y: e.clientY };
  };

  private onPointerLeave = () => {
    this.mouse = null;
  };

  /* ───────────── layout ───────────── */

  private measure(now: number) {
    this.vw = document.documentElement.clientWidth;
    this.vh = window.innerHeight;
    const sy = window.scrollY;
    const pad = this.mobile ? 6 : 10;

    const header = document.querySelector<HTMLElement>(FLOAT_SELECTORS.header);
    this.topSafe = (header ? header.getBoundingClientRect().bottom : 72) + 8;

    const obstacles: Box[] = [];
    document.querySelectorAll<HTMLElement>(FLOAT_SELECTORS.obstacles).forEach((node) => {
      if (node.closest(FLOAT_SELECTORS.ignore)) return;
      const r = node.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      obstacles.push({ l: r.left - pad, t: r.top + sy - pad, r: r.right + pad, b: r.bottom + sy + pad });
    });
    this.obstacles = obstacles;

    this.fixed = [];
    document.querySelectorAll<HTMLElement>(FLOAT_SELECTORS.fixed).forEach((node) => {
      const r = node.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      this.fixed.push({ l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad });
    });

    this.docks = [];
    document.querySelectorAll<HTMLElement>(FLOAT_SELECTORS.docks).forEach((node) => {
      const r = node.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      this.docks.push({
        box: { l: r.left, t: r.top + sy, r: r.right, b: r.bottom + sy },
        scale: Number(node.dataset.floatScale) || 1,
      });
    });

    this.sections = [];
    document.querySelectorAll<HTMLElement>(FLOAT_SELECTORS.sections).forEach((node) => {
      const r = node.getBoundingClientRect();
      this.sections.push({ top: r.top + sy, bottom: r.bottom + sy, scale: Number(node.dataset.floatScale) || 1 });
    });

    this.measuredAt = now;
    this.dirty = false;
    this.visibleAt = -1e9;
  }

  private refreshVisible() {
    const margin = 420;
    const top = this.sy - margin;
    const bottom = this.sy + this.vh + margin;
    this.visible = this.obstacles.filter((b) => b.b > top && b.t < bottom);
    this.visibleAt = this.sy;
  }

  /** Free distance around a viewport point (obstacles + fixed UI + viewport edges). */
  private clearance(xv: number, yv: number) {
    const yd = yv + this.sy;
    let c = Math.min(xv, this.vw - xv, yv - this.topSafe, this.vh - yv);
    for (const b of this.visible) {
      const d = boxDistance(xv, yd, b);
      if (d < c) c = d;
    }
    for (const b of this.fixed) {
      const d = boxDistance(xv, yv, b);
      if (d < c) c = d;
    }
    return c;
  }

  /* ───────────── targeting ───────────── */

  private chooseTarget(now: number, initial = false) {
    if (this.dirty || now - this.measuredAt > 1200) this.measure(now);
    if (Math.abs(this.sy - this.visibleAt) > 120) this.refreshVisible();

    const { vw, vh, sy } = this;
    const radius = (this.size * this.sectionScale) / 2;
    const need = radius + (this.mobile ? 10 : 18);
    const diag = Math.hypot(vw, vh);
    const recentScroll = now - this.lastScrollAt < 1600;
    const sideX = this.side ? 0.82 : 0.18;

    // Candidate points: jittered grid + visible docks.
    const cols = this.mobile ? 5 : 9;
    const rows = this.mobile ? 8 : 6;
    const top = this.topSafe;
    const usableH = Math.max(vh - top, 100);
    const cands: { x: number; y: number; dock?: Dock }[] = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        cands.push({
          x: ((i + 0.5 + rand(-0.4, 0.4)) / cols) * vw,
          y: top + ((j + 0.5 + rand(-0.4, 0.4)) / rows) * usableH,
        });
      }
    }
    for (const d of this.docks) {
      const cx = (d.box.l + d.box.r) / 2 + rand(-12, 12);
      const cy = (d.box.t + d.box.b) / 2 - sy + rand(-12, 12);
      if (cy > top + 20 && cy < vh - 20) cands.push({ x: cx, y: cy, dock: d });
    }

    let best = cands[0];
    let bestScore = -Infinity;
    let bestClear = 0;
    for (const p of cands) {
      const c = this.clearance(p.x, p.y);
      let s: number;
      if (c < need * 0.75) {
        s = -100 + c / need; // fallback ranking only if nothing is free
      } else {
        s = (Math.min(c, need * 2.2) / need) * 0.9;
        const vy = (p.y - top) / usableH;
        if (recentScroll) s += (this.scrollDir > 0 ? vy : 1 - vy) * 1.1;
        s += (1 - Math.abs(p.x / vw - sideX)) * 0.9;
        if (!initial) {
          const d = Math.hypot(p.x - this.pos.x, p.y - this.pos.y) / diag;
          s += (1 - Math.min(Math.abs(d - 0.32) * 2.2, 1)) * 0.45;
        }
        if (p.dock) s += initial ? 5 : 1.4;
        for (const v of this.visited) {
          const age = (now - v.t) / 25000;
          if (age < 1 && Math.hypot(v.p.x - p.x, v.p.y - (p.y + sy)) < 140) s -= 0.9 * (1 - age);
        }
        s += Math.random() * 0.35;
      }
      if (s > bestScore) {
        bestScore = s;
        best = p;
        bestClear = c;
      }
    }

    const dockScale = best.dock?.scale ?? 1;
    this.targetClear = bestClear;
    this.targetScale = clamp(
      this.sectionScale * (best.dock ? dockScale : clamp(bestClear / (this.size * 0.85), 0.78, 1.1)),
      0.6,
      1.5,
    );
    this.setPath({ x: best.x, y: best.y + sy }, now);
    this.visited.push({ p: { ...this.target }, t: now });
    if (this.visited.length > 12) this.visited.shift();

    const dwell = best.dock ? rand(6000, 9000) : rand(3500, 6000);
    this.nextRetargetAt = now + this.pathDur * 1000 + dwell;
    this.lastRetargetAt = now;
  }

  private setPath(to: Vec, now: number) {
    const from = { x: this.pos.x, y: this.pos.y + this.sy };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    this.from = from;
    this.target = to;
    if (dist < 6) {
      this.ctrl = { ...to };
      this.pathDur = 0.6;
    } else {
      // Bend the path sideways for a natural curved flight.
      const bend = rand(0.16, 0.38) * dist * (Math.random() < 0.5 ? -1 : 1);
      this.ctrl = {
        x: (from.x + to.x) / 2 + (-dy / dist) * bend,
        y: (from.y + to.y) / 2 + (dx / dist) * bend,
      };
      const speed = this.mobile ? rand(170, 260) : rand(230, 380);
      this.pathDur = clamp(dist / speed, 1.2, 3.4);
    }
    this.pathStart = now;
  }

  private updateSection(now: number) {
    const line = this.sy + this.vh * 0.5;
    const idx = this.sections.findIndex((s) => line >= s.top && line < s.bottom);
    if (idx !== -1 && idx !== this.sectionIndex) {
      const first = this.sectionIndex === -1;
      this.sectionIndex = idx;
      this.sectionScale = this.sections[idx].scale;
      if (!first) {
        this.side = this.side ? 0 : 1; // alternate sides as you move between sections
        if (now - this.lastRetargetAt > 500) this.chooseTarget(now);
      }
    }
  }

  /* ───────────── frame loop ───────────── */

  private tick = (t: number) => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.tick);

    // Phones: ~30fps is plenty and saves battery.
    if (this.mobile && t - this.lastT < 30) return;
    const dt = Math.min((t - this.lastT) / 1000, 1 / 20);
    this.lastT = t;
    const now = t;

    if (this.dirty) {
      this.measure(now);
      this.nextRetargetAt = Math.min(this.nextRetargetAt, now + 200);
    }
    if (Math.abs(this.sy - this.visibleAt) > 120) this.refreshVisible();
    this.updateSection(now);

    // Retarget triggers: timer, target scrolled out of view, scroll direction flip.
    const radius = (this.size * this.scale) / 2;
    const targetVy = this.target.y - this.sy;
    const outOfView = targetVy < this.topSafe + radius * 0.4 || targetVy > this.vh - radius * 0.4;
    if (now >= this.nextRetargetAt) {
      if (Math.random() < 0.55) this.side = this.side ? 0 : 1;
      this.chooseTarget(now);
    } else if ((outOfView || this.dirChanged) && now - this.lastRetargetAt > 350) {
      this.dirChanged = false;
      this.chooseTarget(now);
    }

    // Guide point along the Bézier path (document → viewport).
    const u = clamp((now - this.pathStart) / (this.pathDur * 1000), 0, 1);
    const e = easeInOutSine(u);
    const ie = 1 - e;
    const gx = ie * ie * this.from.x + 2 * ie * e * this.ctrl.x + e * e * this.target.x;
    const gy = ie * ie * this.from.y + 2 * ie * e * this.ctrl.y + e * e * this.target.y - this.sy;

    // Organic wander — bounded by the free space around the target.
    const T = now / 1000;
    const maxAmp = this.mobile ? 10 : 28;
    const amp = clamp(this.targetClear - radius, 3, maxAmp) * (0.35 + 0.65 * u);
    const [p0, p1, p2, p3] = this.phase;
    let dx = amp * (0.62 * Math.sin(T * 0.41 + p0) + 0.38 * Math.sin(T * 0.93 + p1));
    let dy = amp * (0.62 * Math.sin(T * 0.37 + p2) + 0.38 * Math.sin(T * 0.81 + p3));

    // Cursor: gentle repel when close + subtle parallax.
    if (this.mouse) {
      const mx = this.pos.x - this.mouse.x;
      const my = this.pos.y - this.mouse.y;
      const md = Math.hypot(mx, my) || 1;
      if (md < 220) {
        const k = (1 - md / 220) ** 2 * 46;
        dx += (mx / md) * k;
        dy += (my / md) * k;
      }
      dx += (this.mouse.x / this.vw - 0.5) * -16;
      dy += (this.mouse.y / this.vh - 0.5) * -12;
    }

    // Damped spring toward the desired point (smooth, never jumps).
    const k = 24;
    const c = 2 * Math.sqrt(k) * 0.82;
    const ax = k * (gx + dx - this.pos.x) - c * this.vel.x;
    const ay = k * (gy + dy - this.pos.y) - c * this.vel.y;
    this.vel.x += ax * dt;
    this.vel.y += ay * dt;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // Scale eases toward the target size for the current space/section.
    this.scale = lerp(this.scale, this.targetScale, 1 - Math.exp(-dt * 2.2));

    // Opacity: full in free space, faint ghost if passing behind content.
    const r = (this.size * this.scale) / 2;
    const clear = this.clearance(this.pos.x, this.pos.y);
    const vis = smoothstep(r * 0.15, r * 0.95, clear);
    this.opacity = lerp(this.opacity, 0.1 + 0.85 * vis, 1 - Math.exp(-dt * 6));

    const speed = Math.hypot(this.vel.x, this.vel.y);
    const rot = clamp(this.vel.x * 0.025, -12, 12);
    const glow = clamp(0.35 + speed / 700, 0.35, 1);

    const half = this.size / 2;
    this.el.style.transform = `translate3d(${(this.pos.x - half).toFixed(1)}px, ${(this.pos.y - half).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${this.scale.toFixed(3)})`;
    this.el.style.opacity = this.opacity.toFixed(3);
    this.el.style.setProperty('--glow', glow.toFixed(3));
  };
}
