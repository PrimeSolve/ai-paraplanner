import { useEffect, useRef } from 'react';

export default function NeuralBackground({ opacity = 0.4 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const TEAL  = '0,201,177';
    const BLUE  = '30,136,229';
    const WHITE = '176,196,222';
    const NODE_COUNT  = 68;
    const MAX_DIST    = 200;
    const NODE_SPEED  = 0.28;
    const PULSE_SPEED = 0.012;

    let W, H, nodes, animId;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function randColor() {
      const r = Math.random();
      if (r < 0.55) return TEAL;
      if (r < 0.85) return BLUE;
      return WHITE;
    }

    function makeNode() {
      const angle = Math.random() * Math.PI * 2;
      const speed = NODE_SPEED * (0.4 + Math.random() * 0.6);
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.5 + Math.random() * 2.5,
        color: randColor(),
        phase: Math.random() * Math.PI * 2,
        pulseR: 0,
        firing: false,
        fireTimer: 0,
        fireInterval: 120 + Math.random() * 300,
      };
    }

    function init() {
      resize();
      nodes = Array.from({ length: NODE_COUNT }, makeNode);
    }

    function drawFrame() {
      ctx.clearRect(0, 0, W, H);

      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        n.phase += PULSE_SPEED;

        if (n.x < 0)  { n.x = 0;  n.vx *= -1; }
        if (n.x > W)  { n.x = W;  n.vx *= -1; }
        if (n.y < 0)  { n.y = 0;  n.vy *= -1; }
        if (n.y > H)  { n.y = H;  n.vy *= -1; }

        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const md = Math.sqrt(dx * dx + dy * dy);
        if (md < 280 && md > 0) {
          n.vx += (dx / md) * 0.012;
          n.vy += (dy / md) * 0.012;
        }

        const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (spd > NODE_SPEED * 1.6) {
          n.vx = (n.vx / spd) * NODE_SPEED * 1.6;
          n.vy = (n.vy / spd) * NODE_SPEED * 1.6;
        }

        n.fireTimer++;
        if (!n.firing && n.fireTimer > n.fireInterval) {
          n.firing = true;
          n.pulseR = 0;
          n.fireTimer = 0;
          n.fireInterval = 140 + Math.random() * 280;
        }
        if (n.firing) {
          n.pulseR += 1.4;
          if (n.pulseR > 60) { n.firing = false; n.pulseR = 0; }
        }
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > MAX_DIST) continue;

          const alpha = (1 - dist / MAX_DIST) * 0.18;
          const boost = (a.firing || b.firing) ? 0.25 : 0;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${TEAL},${Math.min(alpha + boost, 0.5)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();

          if (a.firing && a.pulseR > 0 && dist < MAX_DIST * 0.75) {
            const t  = Math.min(a.pulseR / 60, 1);
            const px = a.x + (b.x - a.x) * t;
            const py = a.y + (b.y - a.y) * t;
            const sig = ctx.createRadialGradient(px, py, 0, px, py, 6);
            sig.addColorStop(0, `rgba(${TEAL},0.7)`);
            sig.addColorStop(1, `rgba(${TEAL},0)`);
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fillStyle = sig;
            ctx.fill();
          }
        }
      }

      nodes.forEach(n => {
        const pulse = 0.5 + 0.5 * Math.sin(n.phase);

        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
        glow.addColorStop(0, `rgba(${n.color},${0.12 * pulse})`);
        glow.addColorStop(1, `rgba(${n.color},0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.color},${0.55 + 0.35 * pulse})`;
        ctx.fill();

        if (n.firing && n.pulseR > 0) {
          const ringAlpha = (1 - n.pulseR / 60) * 0.6;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${n.color},${ringAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(drawFrame);
    }

    const onMouseMove = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onResize    = () => {
      resize();
      nodes.forEach(n => { n.x = Math.min(n.x, W); n.y = Math.min(n.y, H); });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);
    init();
    animId = requestAnimationFrame(drawFrame);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        opacity,
      }}
    />
  );
}
