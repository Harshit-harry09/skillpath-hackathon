"use client";
// updated
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// Standard cubic ease-out calculation
function cubicBezier(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef<number>(0);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth * window.devicePixelRatio;
        canvasRef.current.height = window.innerHeight * window.devicePixelRatio;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const drawVortexInternal = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    maxR: number,
    easedP: number,
    rotation: number,
    color: string
  ) => {
    // Optimization: Reduce arms and steps for performance
    const ARMS = 7;
    const STEPS = 80; 
    const ROTATIONS = 1.6;
    const ARM_WIDTH_BASE = (Math.PI * 2) / ARMS / 1.8;
    const ANGLE_FACTOR = Math.PI * 2 * ROTATIONS;

    ctx.save();
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, cx * 2, cy * 2);
    ctx.fillStyle = color;

    for (let arm = 0; arm < ARMS; arm++) {
      const armOffset = (arm / ARMS) * Math.PI * 2 + rotation;
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);

      // Draw outer curve
      for (let i = 1; i <= STEPS; i++) {
        const p = (i / STEPS) * easedP;
        const angle = p * ANGLE_FACTOR + armOffset;
        const r = p * maxR;
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      }

      // Draw inner curve back to center
      for (let i = STEPS; i >= 1; i--) {
        const p = (i / STEPS) * easedP;
        // Taper the arm width towards the center
        const angle = p * ANGLE_FACTOR + armOffset + ARM_WIDTH_BASE * (1 - p * 0.4);
        const r = p * maxR;
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      }

      ctx.closePath();
      ctx.fill();
    }

    // Fill center gap with a simple circle
    if (easedP > 0.01) {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * easedP * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const handleToggle = () => {
    if (isAnimating) return;
    const nextTheme = theme === "light" ? "dark" : "light";
    setIsAnimating(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.display = "block";

    // Colors matched to globals.css --color-canvas
    const color = nextTheme === "dark" ? "#000000" : "#fffaf0";
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.4;

    let progress = 0;
    let phase: "expand" | "collapse" = "expand";
    let themeChanged = false;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const expandSpeed = 1.3; 
      const collapseSpeed = 0.9; // Slower reveal for better "ease out" feel

      if (phase === "expand") {
        progress += dt * expandSpeed;
        const currentProgress = Math.min(progress, 1);
        const rotation = currentProgress * Math.PI * 1.2;
        
        // Expansion uses cubicBezier (easeOutCubic)
        const easedP = cubicBezier(currentProgress);
        drawVortexInternal(ctx, cx, cy, maxR, easedP, rotation, color);

        if (progress >= 1.05) {
          if (!themeChanged) {
            setTheme(nextTheme);
            themeChanged = true;
          }
          phase = "collapse";
          progress = 0;
        }
      } else {
        progress += dt * collapseSpeed;
        const p = Math.min(progress, 1);
        
        // For collapse, we want to go from 1 to 0 with an ease-out reveal.
        // We use (1 - p)^2 or similar to make it slow down at the end (as p approaches 1).
        const currentProgress = Math.pow(1 - p, 2); 
        
        const rotation = (1.2 + p * 0.8) * Math.PI;
        
        // Pass currentProgress directly to drawVortex, but avoid double-easing
        // I'll update drawVortex to accept a pre-eased value for more control.
        drawVortexInternal(ctx, cx, cy, maxR, currentProgress, rotation, color);

        if (progress >= 1) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.style.display = "none";
          setIsAnimating(false);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
  };

  if (!mounted) {
    return <div className="h-9 w-9 rounded-md border border-hairline bg-canvas opacity-20" />;
  }

  return (
    <>
      {ReactDOM.createPortal(
        <canvas
          ref={canvasRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 99999,
            pointerEvents: "none",
            display: "none",
          }}
        />,
        document.body
      )}

      <button
        onClick={handleToggle}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-canvas text-ink transition-colors hover:bg-surface-soft hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </button>
    </>
  );
}
