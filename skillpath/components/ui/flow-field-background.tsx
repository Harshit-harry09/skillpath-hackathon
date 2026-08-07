'use client';
// updated

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface NeuralBackgroundProps {
  className?: string;
  color?: string;
  trailOpacity?: number;
  particleCount?: number;
  speed?: number;
  backgroundColor?: string;
  trailColor?: string;
}

export default function NeuralBackground({
  className,
  color = "#6366f1",
  trailOpacity = 0.45,
  particleCount = 300,
  speed = 1,
  backgroundColor = "transparent",
  trailColor = "10, 10, 10",
}: NeuralBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId = 0;
    let cleanupFn: (() => void) | null = null;
    // Use a ref-like object so the idle callback closure can read latest value
    const state = { isInView: false };

    // Use requestIdleCallback when available, fall back to setTimeout
    const scheduleIdle =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? (cb: () => void) => (window as any).requestIdleCallback(cb, { timeout: 2000 })
        : (cb: () => void) => setTimeout(cb, 200);

    const cancelIdle =
      typeof window !== 'undefined' && 'cancelIdleCallback' in window
        ? (id: number) => (window as any).cancelIdleCallback(id)
        : (id: number) => clearTimeout(id);

    let idleId = 0;

    // Set up intersection observer BEFORE idle callback so state.isInView is correct when init runs
    const observer = new IntersectionObserver(
      ([entry]) => {
        state.isInView = entry.isIntersecting;
        if (state.isInView && !animationFrameId && cleanupFn) {
          // canvas is already initialised — just restart the loop
          animationFrameId = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Placeholder — will be assigned once canvas is initialised
    let tick = (_t: number) => {};

    idleId = scheduleIdle(() => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = container.clientWidth;
      let height = container.clientHeight;
      let particles: Array<{
        x: number; y: number; vx: number; vy: number; age: number; life: number;
        update(): void; reset(): void; draw(ctx: CanvasRenderingContext2D): void;
      }> = [];
      const mouse = { x: -1000, y: -1000 };

      const makeParticle = () => {
        const p = {
          x: Math.random() * width, y: Math.random() * height,
          vx: 0, vy: 0, age: 0, life: Math.random() * 200 + 100,
          update() {
            const angle = (Math.cos(p.x * 0.005) + Math.sin(p.y * 0.005)) * Math.PI;
            p.vx += Math.cos(angle) * 0.2 * speed;
            p.vy += Math.sin(angle) * 0.2 * speed;
            const dx = mouse.x - p.x, dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 50) { const f = (50 - dist) / 50; p.vx -= dx * f * 0.05; p.vy -= dy * f * 0.05; }
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.95; p.vy *= 0.95;
            if (++p.age > p.life) p.reset();
            if (p.x < 0) p.x = width; if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height; if (p.y > height) p.y = 0;
          },
          reset() { p.x = Math.random() * width; p.y = Math.random() * height; p.vx = 0; p.vy = 0; p.age = 0; p.life = Math.random() * 200 + 100; },
          draw(context: CanvasRenderingContext2D) {
            context.fillStyle = color;
            context.globalAlpha = 1 - Math.abs((p.age / p.life) - 0.5) * 2;
            context.fillRect(p.x, p.y, 1.5, 1.5);
          },
        };
        return p;
      };

      const init = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr; canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
        particles = Array.from({ length: particleCount }, makeParticle);
      };

      // Assign real tick now that canvas is ready
      tick = () => {
        if (!state.isInView || document.hidden) { animationFrameId = 0; return; }
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = backgroundColor === 'transparent'
          ? `rgba(${trailColor}, ${trailOpacity})`
          : backgroundColor;
        ctx.fillRect(0, 0, width, height);
        particles.forEach(p => { p.update(); p.draw(ctx); });
        animationFrameId = requestAnimationFrame(tick);
      };

      let resizeTimer: ReturnType<typeof setTimeout>;
      const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { width = container.clientWidth; height = container.clientHeight; init(); }, 150); };
      const onMouseMove = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
      const onMouseLeave = () => { mouse.x = -1000; mouse.y = -1000; };
      const onVisibility = () => {
        if (document.hidden) { cancelAnimationFrame(animationFrameId); animationFrameId = 0; }
        else if (state.isInView && !animationFrameId) animationFrameId = requestAnimationFrame(tick);
      };

      init();
      if (state.isInView) animationFrameId = requestAnimationFrame(tick);

      window.addEventListener('resize', onResize);
      container.addEventListener('mousemove', onMouseMove);
      container.addEventListener('mouseleave', onMouseLeave);
      document.addEventListener('visibilitychange', onVisibility);

      cleanupFn = () => {
        clearTimeout(resizeTimer);
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', onResize);
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('mouseleave', onMouseLeave);
        document.removeEventListener('visibilitychange', onVisibility);
      };
    });

    return () => {
      observer.disconnect();
      cancelIdle(idleId);
      if (cleanupFn) cleanupFn();
    };
  }, [color, trailOpacity, particleCount, speed, backgroundColor, trailColor]);

  return (
    <div ref={containerRef} className={cn('relative w-full h-full overflow-hidden', className)}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
