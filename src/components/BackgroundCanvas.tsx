import { useEffect, useRef } from 'react';
import { BackgroundStyle } from '../types';

interface BackgroundCanvasProps {
  style: BackgroundStyle;
}

export default function BackgroundCanvas({ style }: BackgroundCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Set canvas dimensions
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        width = w;
        height = h;
        canvas.width = w * window.devicePixelRatio;
        canvas.height = h * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    });

    resizeObserver.observe(canvas.parentElement || document.body);

    // Particle class for "particles" style
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }

    const particles: Particle[] = [];
    const initParticles = () => {
      particles.length = 0;
      const count = Math.min(60, Math.floor((width * height) / 25000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1,
        });
      }
    };

    // Bokeh light class for "bokeh" style
    interface BokehLight {
      x: number;
      y: number;
      vy: number;
      radius: number;
      alpha: number;
      fadeSpeed: number;
    }

    const bokehLights: BokehLight[] = [];
    const initBokeh = () => {
      bokehLights.length = 0;
      const count = Math.min(30, Math.floor((width * height) / 45000));
      for (let i = 0; i < count; i++) {
        bokehLights.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vy: -(Math.random() * 0.3 + 0.1),
          radius: Math.random() * 40 + 20,
          alpha: Math.random() * 0.3,
          fadeSpeed: (Math.random() * 0.002 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
        });
      }
    };

    // Aurora blob properties
    interface AuroraBlob {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      radius: number;
      color: string;
      speed: number;
    }

    const auroraBlobs: AuroraBlob[] = [];
    const initAurora = () => {
      auroraBlobs.length = 0;
      const colors = [
        'rgba(1, 0, 102, 0.08)',    // Deep Navy
        'rgba(58, 58, 154, 0.06)',   // Soft Indigo
        'rgba(255, 203, 5, 0.03)',   // Pale Gold
        'rgba(199, 203, 232, 0.07)'  // Mid Blue
      ];
      for (let i = 0; i < 4; i++) {
        auroraBlobs.push({
          x: Math.random() * width,
          y: Math.random() * height,
          targetX: Math.random() * width,
          targetY: Math.random() * height,
          radius: Math.random() * 250 + 200,
          color: colors[i % colors.length],
          speed: 0.005 + Math.random() * 0.005,
        });
      }
    };

    let initialized = false;

    // Main animation loop
    const animate = () => {
      if (width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      if (!initialized) {
        initParticles();
        initBokeh();
        initAurora();
        initialized = true;
      }

      ctx.clearRect(0, 0, width, height);

      // Render based on user-selected background style
      if (style === 'none') {
        // Just empty / handled by Tailwind base classes
      } else if (style === 'particles') {
        // Draw constellation particles
        ctx.fillStyle = 'rgba(1, 0, 102, 0.25)';
        ctx.strokeStyle = 'rgba(1, 0, 102, 0.05)';

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      } else if (style === 'bokeh') {
        // Draw smooth moving bokeh lights
        for (let i = 0; i < bokehLights.length; i++) {
          const b = bokehLights[i];
          b.y += b.vy;
          b.alpha += b.fadeSpeed;

          // Recycle floating lights
          if (b.y + b.radius < 0) {
            b.y = height + b.radius;
            b.x = Math.random() * width;
            b.alpha = 0.05;
          }

          if (b.alpha <= 0 || b.alpha > 0.35) {
            b.fadeSpeed *= -1;
            b.alpha = Math.max(0.01, Math.min(0.35, b.alpha));
          }

          const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
          grad.addColorStop(0, `rgba(58, 58, 154, ${b.alpha})`);
          grad.addColorStop(0.5, `rgba(1, 0, 102, ${b.alpha * 0.4})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (style === 'aurora') {
        // Draw massive atmospheric aurora shapes
        for (let i = 0; i < auroraBlobs.length; i++) {
          const blob = auroraBlobs[i];
          
          // Lerp towards dynamic target
          blob.x += (blob.targetX - blob.x) * blob.speed;
          blob.y += (blob.targetY - blob.y) * blob.speed;

          if (Math.abs(blob.x - blob.targetX) < 10 && Math.abs(blob.y - blob.targetY) < 10) {
            blob.targetX = Math.random() * width;
            blob.targetY = Math.random() * height;
          }

          const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
          grad.addColorStop(0, blob.color);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [style]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-80"
    />
  );
}
