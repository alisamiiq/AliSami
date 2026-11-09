import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { site } from '../../config/site';
import { usePrefs } from '../../context/Preferences';
import { useSiteConfig } from '../../context/SiteConfig';
import { aboutText, interests } from '../../data/content';
import { SectionHeader } from '../ui/SectionHeader';
import { Reveal } from '../ui/Reveal';
import { useToast } from '../ui/Toast';
import { Terminal, Sparkles, Copy, Check, Play, Square, Zap, Radio, Cpu } from 'lucide-react';

type SimTab = 'neural' | 'radar' | 'cli';

interface PulsePacket {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  speed: number;
  color: string;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export function About() {
  const { t, tr, lang } = usePrefs();
  const { sectionIndex } = useSiteConfig();
  const showToast = useToast();
  const [copied, setCopied] = useState(false);

  // Interactive Code Runner State
  const [isRunning, setIsRunning] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const [activeTab, setActiveTab] = useState<SimTab>('neural');
  const [pulseCount, setPulseCount] = useState(1);
  const [accuracy, setAccuracy] = useState(99.4);
  const [latency, setLatency] = useState(2.4);

  // Radar turbo test state
  const [turboActive, setTurboActive] = useState(false);
  const [downSpeed, setDownSpeed] = useState(840);
  const [upSpeed, setUpSpeed] = useState(760);

  // CLI interactive logs
  const [cliLogs, setCliLogs] = useState<Array<{ cmd: string; out: string[] }>>([
    {
      cmd: 'ali-os --status',
      out: [
        '✔ Ali Sami Neural & Network Engine v4.2 ONLINE',
        '✔ Location: Al-Barakiya, Kufa, Iraq [Node #IQ-NJF-01]',
        '✔ Ready for interactive commands below 👇',
      ],
    },
  ]);

  const neuralCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const triggerShockwaveRef = useRef<((cx?: number, cy?: number) => void) | null>(null);

  const handleCopyProfile = async () => {
    const code = [
      'const developer = {',
      `  ${t.about.termName}: "${site.name.en} (${site.name.ar})",`,
      `  ${t.about.termStudy}: "${tr(site.study.major)}",`,
      `  ${t.about.termWork}: "${t.about.termWorkValue}",`,
      `  ${t.about.termLocation}: "${tr(site.locationShort)}",`,
      `  ${t.about.termFocus}: ["AI", "Web", "Networks"]`,
      '};',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast(t.about.copiedCode, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore clipboard error */
    }
  };

  // Boot sequence when clicking "Run Code"
  useEffect(() => {
    if (!isRunning) {
      setBootStep(0);
      return;
    }
    setBootStep(1);
    const t1 = setTimeout(() => setBootStep(2), 280);
    const t2 = setTimeout(() => setBootStep(3), 580);
    const t3 = setTimeout(() => setBootStep(4), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isRunning]);

  // ─── Interactive Neural Network Canvas ───
  useEffect(() => {
    if (!isRunning || bootStep < 4 || activeTab !== 'neural') return;
    const canvas = neuralCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || 520;
    const height = canvas.clientHeight || 230;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Build 4 layers of neurons
    const layerCounts = [4, 6, 6, 3];
    const nodes: Array<{
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      layer: number;
      phase: number;
      energy: number;
    }> = [];

    layerCounts.forEach((count, lIdx) => {
      const lx = (width * (lIdx + 0.7)) / (layerCounts.length + 0.4);
      for (let i = 0; i < count; i++) {
        const ly = (height * (i + 0.8)) / (count + 0.6);
        nodes.push({
          x: lx,
          y: ly,
          baseX: lx,
          baseY: ly,
          layer: lIdx,
          phase: Math.random() * Math.PI * 2,
          energy: 0.4 + Math.random() * 0.6,
        });
      }
    });

    // Connect adjacent layers
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (nodes[j].layer === nodes[i].layer + 1) {
          edges.push([i, j]);
        }
      }
    }

    const packets: PulsePacket[] = [];
    const shockwaves: Shockwave[] = [];
    const pointer = { x: width / 2, y: height / 2, active: false };

    const spawnBurst = (cx = width / 2, cy = height / 2) => {
      shockwaves.push({ x: cx, y: cy, radius: 4, maxRadius: Math.max(width, height) * 0.75, alpha: 1 });
      nodes.forEach((n) => {
        n.energy = 1.5;
      });
      for (let k = 0; k < 18; k++) {
        const edge = edges[Math.floor(Math.random() * edges.length)];
        if (edge) {
          const a = nodes[edge[0]];
          const b = nodes[edge[1]];
          packets.push({
            fromX: a.x,
            fromY: a.y,
            toX: b.x,
            toY: b.y,
            progress: 0,
            speed: 0.025 + Math.random() * 0.03,
            color: k % 2 === 0 ? '#22d3ee' : '#3b82f6',
          });
        }
      }
    };

    triggerShockwaveRef.current = spawnBurst;
    spawnBurst();

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      spawnBurst(e.clientX - rect.left, e.clientY - rect.top);
      setPulseCount((c) => c + 1);
      setAccuracy((a) => Math.min(99.99, +(a + 0.04).toFixed(2)));
      setLatency((l) => Math.max(1.1, +(l - 0.1).toFixed(1)));
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('click', onClick);

    let tick = 0;
    const render = () => {
      tick += 0.035;
      ctx.clearRect(0, 0, width, height);

      // Subtle background tech grid
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.07)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < width; gx += 32) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += 32) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // Auto-spawn ambient packets
      if (Math.random() < 0.22 && packets.length < 35) {
        const edge = edges[Math.floor(Math.random() * edges.length)];
        if (edge) {
          const a = nodes[edge[0]];
          const b = nodes[edge[1]];
          packets.push({
            fromX: a.x,
            fromY: a.y,
            toX: b.x,
            toY: b.y,
            progress: 0,
            speed: 0.018 + Math.random() * 0.022,
            color: Math.random() > 0.5 ? '#22d3ee' : '#60a5fa',
          });
        }
      }

      // Update nodes position
      nodes.forEach((n) => {
        n.x = n.baseX + Math.sin(tick + n.phase) * 4;
        n.y = n.baseY + Math.cos(tick * 0.9 + n.phase) * 4;
        if (pointer.active) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 95) {
            n.x += dx * 0.08;
            n.y += dy * 0.08;
            n.energy = Math.min(1.6, n.energy + 0.08);
          }
        }
        n.energy = Math.max(0.45, n.energy * 0.985);
      });

      // Draw edges
      edges.forEach(([i, j]) => {
        const a = nodes[i];
        const b = nodes[j];
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.11 + (a.energy + b.energy) * 0.08})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      // Draw and update packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          packets.splice(i, 1);
          continue;
        }
        const px = p.fromX + (p.toX - p.fromX) * p.progress;
        const py = p.fromY + (p.toY - p.fromY) * p.progress;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.radius += 6;
        s.alpha = Math.max(0, 1 - s.radius / s.maxRadius);
        if (s.alpha <= 0) {
          shockwaves.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(34, 211, 238, ${s.alpha * 0.65})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw nodes
      nodes.forEach((n) => {
        const r = 4.5 + n.energy * 2.5;
        const grad = ctx.createRadialGradient(n.x, n.y, 1, n.x, n.y, r * 2.4);
        grad.addColorStop(0, '#22d3ee');
        grad.addColorStop(0.5, 'rgba(37, 99, 235, 0.65)');
        grad.addColorStop(1, 'rgba(37, 99, 235, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.65, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('click', onClick);
    };
  }, [isRunning, bootStep, activeTab]);

  // ─── Interactive Network Radar Canvas ───
  useEffect(() => {
    if (!isRunning || bootStep < 4 || activeTab !== 'radar') return;
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || 520;
    const height = canvas.clientHeight || 230;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.min(width, height) * 0.42;

    const towers = [
      { angle: 0.6, dist: 0.55, label: 'Al-Barakiya Core' },
      { angle: 1.9, dist: 0.75, label: 'Kufa Sector A' },
      { angle: 3.1, dist: 0.48, label: 'Fiber Uplink #1' },
      { angle: 4.4, dist: 0.82, label: 'Mesh Node #4' },
      { angle: 5.5, dist: 0.64, label: 'AI Gateway' },
    ];

    let sweepAngle = 0;

    const render = () => {
      sweepAngle = (sweepAngle + (turboActive ? 0.085 : 0.032)) % (Math.PI * 2);
      ctx.clearRect(0, 0, width, height);

      // Concentric radar rings
      for (let i = 1; i <= 3; i++) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, (maxR * i) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshairs
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)';
      ctx.beginPath();
      ctx.moveTo(cx - maxR - 15, cy);
      ctx.lineTo(cx + maxR + 15, cy);
      ctx.moveTo(cx, cy - maxR - 15);
      ctx.lineTo(cx, cy + maxR + 15);
      ctx.stroke();

      // Radar sweep cone
      const grad = ctx.createConicGradient(sweepAngle - 0.7, cx, cy);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
      grad.addColorStop(0.12, turboActive ? 'rgba(16, 185, 129, 0.38)' : 'rgba(34, 211, 238, 0.32)');
      grad.addColorStop(0.13, 'rgba(34, 211, 238, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();

      // Draw towers & laser links
      towers.forEach((tw) => {
        const tx = cx + Math.cos(tw.angle) * (maxR * tw.dist);
        const ty = cy + Math.sin(tw.angle) * (maxR * tw.dist);

        // Link to center
        ctx.strokeStyle = turboActive ? 'rgba(16, 185, 129, 0.45)' : 'rgba(59, 130, 246, 0.3)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Blip glow
        ctx.fillStyle = turboActive ? '#10b981' : '#22d3ee';
        ctx.beginPath();
        ctx.arc(tx, ty, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(tw.label, tx + 7, ty + 3);
      });

      // Center core
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, bootStep, activeTab, turboActive]);

  const handleFireNeuralPulse = () => {
    triggerShockwaveRef.current?.();
    setPulseCount((c) => c + 1);
    setAccuracy((a) => Math.min(99.99, +(a + 0.03).toFixed(2)));
    setLatency((l) => Math.max(1.1, +(l - 0.1).toFixed(1)));
  };

  const handleTurboTest = () => {
    setTurboActive(true);
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDownSpeed(880 + Math.floor(Math.random() * 115));
      setUpSpeed(810 + Math.floor(Math.random() * 110));
      if (step >= 14) {
        clearInterval(timer);
        setDownSpeed(986);
        setUpSpeed(942);
        setTimeout(() => setTurboActive(false), 1200);
      }
    }, 90);
  };

  const runCliCommand = (cmd: string) => {
    const responses: Record<string, string[]> = {
      whoami: [
        '👤 Name: Ali Sami (علي سامي)',
        '🎓 Role: AI Engineering Tech & Full-Stack Web Architect',
        '📍 Base: Al-Barakiya — Kufa, Iraq',
      ],
      'skills --matrix': [
        '🧠 AI & ML: Python · Neural Networks · Data Analysis [98%]',
        '🌐 Web Dev: React · TypeScript · Next.js · Modern UI [99%]',
        '📡 Networks: ISP Routing · Wireless Links · MikroTik [99%]',
      ],
      'ping kufa': [
        'PING al-barakiya.kufa.iq (10.20.0.1): 64 bytes — time=1.8ms TTL=64 ⚡',
        'Packet loss: 0.0% | Signal Quality: 100% EXCELLENT',
      ],
      'deploy --future': [
        '🚀 Building next-gen digital experience...',
        '✨ Status: LIVE & READY FOR YOUR PROJECT!',
      ],
    };

    setCliLogs((prev) => [...prev.slice(-3), { cmd, out: responses[cmd] || ['✔ Executed'] }]);
  };

  return (
    <section id="about" className="section-padding about-section" data-float-scale="0.95">
      <div className="container">
        <SectionHeader
          index={sectionIndex('about')}
          eyebrow={t.about.eyebrow}
          title={t.about.title}
          lead={t.about.lead}
          id="about-title"
        />

        <div className="about-grid">
          {/* Narrative text & Code Profile Card */}
          <div className="about-story-col">
            <div className="about-paragraphs">
              {aboutText.map((p, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <p className="story-paragraph">{tr(p)}</p>
                </Reveal>
              ))}
            </div>

            {/* Developer Profile Terminal Card */}
            <Reveal delay={0.3} className={`profile-terminal-card ${isRunning ? 'is-executing' : ''}`}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <div className="terminal-title">
                  <Terminal size={14} />
                  <span>{t.about.terminalTitle}</span>
                </div>

                <div className="terminal-header-actions">
                  <button
                    type="button"
                    className={`terminal-run-btn ${isRunning ? 'is-active' : ''}`}
                    onClick={() => setIsRunning((v) => !v)}
                  >
                    {isRunning ? <Square size={13} /> : <Play size={13} />}
                    <span>{isRunning ? t.about.stopCode : t.about.runCode}</span>
                  </button>

                  <button
                    type="button"
                    className={`terminal-copy-btn ${copied ? 'is-copied' : ''}`}
                    onClick={handleCopyProfile}
                    aria-label={t.about.copyCode}
                    title={t.about.copyCode}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? t.about.copiedCode : t.about.copyCode}</span>
                  </button>
                </div>
              </div>

              <div className="terminal-body" dir="ltr">
                <p className="code-line">
                  <span className="code-kw">const</span> developer = &#123;
                </p>
                <p className="code-line indent">
                  <span className="code-prop">{t.about.termName}:</span>{' '}
                  <span className="code-str">
                    "{site.name.en} ({site.name.ar})"
                  </span>
                  ,
                </p>
                <p className="code-line indent">
                  <span className="code-prop">{t.about.termStudy}:</span>{' '}
                  <span className="code-str">"{tr(site.study.major)}"</span>,
                </p>
                <p className="code-line indent">
                  <span className="code-prop">{t.about.termWork}:</span>{' '}
                  <span className="code-str">"{t.about.termWorkValue}"</span>,
                </p>
                <p className="code-line indent">
                  <span className="code-prop">{t.about.termLocation}:</span>{' '}
                  <span className="code-str">"{tr(site.locationShort)}"</span>,
                </p>
                <p className="code-line indent">
                  <span className="code-prop">{t.about.termFocus}:</span> [
                  <span className="code-str">"AI"</span>, <span className="code-str">"Web"</span>,{' '}
                  <span className="code-str">"Networks"</span>]
                </p>
                <p className="code-line">&#125;;</p>
              </div>

              {/* ─── Interactive Live Code Execution Engine ─── */}
              <AnimatePresence>
                {isRunning && (
                  <motion.div
                    className="terminal-live-sandbox"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {/* Boot Console Sequence */}
                    <div className="sandbox-boot-log" dir="ltr">
                      {bootStep >= 1 && (
                        <div className="boot-line">
                          <span className="boot-prompt">$</span> npx tsx profile.ts --launch-hologram
                        </div>
                      )}
                      {bootStep >= 2 && (
                        <div className="boot-line is-cyan">
                          [01/03] Initializing Ali Sami AI Neural Core v4.2...{' '}
                          <span className="boot-ok">██████████ 100%</span>
                        </div>
                      )}
                      {bootStep >= 3 && (
                        <div className="boot-line is-green">
                          [02/03] Linking Al-Barakiya / Kufa Fiber Telemetry...{' '}
                          <span className="boot-ok">ONLINE (1.8ms ⚡)</span>
                        </div>
                      )}
                    </div>

                    {/* Interactive Hologram Deck */}
                    {bootStep >= 4 && (
                      <motion.div
                        className="sandbox-deck"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Mode Switcher Tabs */}
                        <div className="sandbox-tabs" role="tablist">
                          <button
                            type="button"
                            className={`sandbox-tab ${activeTab === 'neural' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('neural')}
                          >
                            <Cpu size={14} />
                            <span>{t.about.tabNeural}</span>
                          </button>
                          <button
                            type="button"
                            className={`sandbox-tab ${activeTab === 'radar' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('radar')}
                          >
                            <Radio size={14} />
                            <span>{t.about.tabRadar}</span>
                          </button>
                          <button
                            type="button"
                            className={`sandbox-tab ${activeTab === 'cli' ? 'is-active' : ''}`}
                            onClick={() => setActiveTab('cli')}
                          >
                            <Terminal size={14} />
                            <span>{t.about.tabCli}</span>
                          </button>
                        </div>

                        {/* TAB 1: Neural AI Core */}
                        {activeTab === 'neural' && (
                          <div className="sandbox-stage">
                            <div className="sandbox-canvas-wrap">
                              <canvas ref={neuralCanvasRef} className="sandbox-canvas" />
                              <div className="sandbox-canvas-overlay">
                                <span>{t.about.canvasHint}</span>
                              </div>
                            </div>

                            <div className="sandbox-metrics-row">
                              <div className="sandbox-metric-box">
                                <span className="metric-label">{t.about.accuracyLabel}</span>
                                <strong className="metric-val is-cyan">{accuracy}%</strong>
                              </div>
                              <div className="sandbox-metric-box">
                                <span className="metric-label">{t.about.nodesLabel}</span>
                                <strong className="metric-val">{128 + pulseCount * 16} Core</strong>
                              </div>
                              <div className="sandbox-metric-box">
                                <span className="metric-label">{t.about.latencyLabel}</span>
                                <strong className="metric-val is-green">{latency} ms</strong>
                              </div>
                              <button
                                type="button"
                                className="sandbox-action-btn"
                                onClick={handleFireNeuralPulse}
                              >
                                <Zap size={15} />
                                <span>{t.about.firePulse}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* TAB 2: Al-Barakiya Live Radar */}
                        {activeTab === 'radar' && (
                          <div className="sandbox-stage">
                            <div className="sandbox-canvas-wrap">
                              <canvas ref={radarCanvasRef} className="sandbox-canvas" />
                            </div>

                            <div className="sandbox-metrics-row">
                              <div className="sandbox-metric-box">
                                <span className="metric-label">Download ↓</span>
                                <strong className="metric-val is-cyan">{downSpeed} Mbps</strong>
                              </div>
                              <div className="sandbox-metric-box">
                                <span className="metric-label">Upload ↑</span>
                                <strong className="metric-val is-green">{upSpeed} Mbps</strong>
                              </div>
                              <div className="sandbox-metric-box">
                                <span className="metric-label">Ping (Kufa)</span>
                                <strong className="metric-val">2 ms ⚡</strong>
                              </div>
                              <button
                                type="button"
                                className="sandbox-action-btn"
                                onClick={handleTurboTest}
                              >
                                <Radio size={15} />
                                <span>{t.about.boostSignal}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* TAB 3: Interactive CLI */}
                        {activeTab === 'cli' && (
                          <div className="sandbox-stage sandbox-cli-stage" dir="ltr">
                            <div className="cli-output-window">
                              {cliLogs.map((entry, idx) => (
                                <div key={idx} className="cli-entry">
                                  <div className="cli-cmd-line">
                                    <span className="boot-prompt">ali@kufa-ai:~$</span> {entry.cmd}
                                  </div>
                                  {entry.out.map((line, lIdx) => (
                                    <div key={lIdx} className="cli-out-line">
                                      {line}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>

                            <div className="cli-quick-chips">
                              {['whoami', 'skills --matrix', 'ping kufa', 'deploy --future'].map(
                                (cmd) => (
                                  <button
                                    key={cmd}
                                    type="button"
                                    className="cli-chip-btn"
                                    onClick={() => runCliCommand(cmd)}
                                  >
                                    $ {cmd}
                                  </button>
                                ),
                              )}
                              {lang === 'ar' && null}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Reveal>
          </div>

          {/* Core Areas of Interest Cards */}
          <div className="about-interests-col">
            <h3 className="interests-headline">
              <Sparkles size={18} className="text-electric" />
              <span>{t.about.interestsTitle}</span>
            </h3>

            <div className="interests-grid">
              {interests.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={index} delay={0.15 + index * 0.1} className="interest-card">
                    <div className="interest-icon-box">
                      <Icon size={24} className="text-electric" />
                    </div>
                    <div className="interest-info">
                      <h4 className="interest-title">{tr(item.title)}</h4>
                      <p className="interest-text">{tr(item.text)}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
