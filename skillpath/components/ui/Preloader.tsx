'use client';

import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { useUI } from "@/context/UIContext";
import { usePathname } from "next/navigation";

// Helper to create aesthetic SVG tech cards as data URLs for WebGL slabs
const createAestheticTechCard = (
  title: string,
  subtitle: string,
  accentColor: string,
  iconText: string
) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0d0d12"/>
        <stop offset="100%" stop-color="#050508"/>
      </linearGradient>
    </defs>
    <rect width="800" height="500" rx="16" fill="url(#bgGrad)"/>
    <rect x="2" y="2" width="796" height="496" rx="14" fill="none" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.3"/>
    <path d="M0 100 H800 M0 200 H800 M0 300 H800 M0 400 H800 M200 0 V500 M400 0 V500 M600 0 V500" stroke="#FFFFFF" stroke-opacity="0.03" stroke-width="1"/>
    <circle cx="400" cy="190" r="70" fill="${accentColor}" fill-opacity="0.08" stroke="${accentColor}" stroke-width="2" stroke-opacity="0.6"/>
    <text x="400" y="215" font-family="'Outfit', 'Inter', sans-serif" font-size="65" font-weight="900" fill="${accentColor}" text-anchor="middle">${iconText}</text>
    <text x="400" y="330" font-family="'Inter', sans-serif" font-size="32" font-weight="900" letter-spacing="8" fill="#FFFFFF" text-anchor="middle">${title.toUpperCase()}</text>
    <text x="400" y="380" font-family="monospace" font-size="16" font-weight="700" letter-spacing="4" fill="${accentColor}" text-anchor="middle">${subtitle.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
  createAestheticTechCard("System Design", "Scalable Microservices", "#AB54F7", "⚙"),
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
  createAestheticTechCard("Neural Networks", "Deep Learning & AI", "#FF4D8B", "🧠"),
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80",
  createAestheticTechCard("TypeScript 5", "Strict Type Safety", "#3178C6", "TS"),
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
  createAestheticTechCard("React & Next.js", "Modern Fullstack", "#61DAFB", "⚛"),
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80"
];

const DEFAULTS = {
  background: "#000000",
  lineColor: "#B0B0B0",
  lineOpacity: 50,
  colors: ["#FF6A00", "#AB54F7", "#EA3737", "#0072E3", "#00AA3C", "#FFB200"],
  grid: 4,
  speed: 100,
  boost: 100,
  fade: 100,
  label: true,
  labelText: "Hold to Warp Speed",
  labelFill: "#FFFFFF",
  labelColor: "#000000",
  labelFont: { fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em" } as CSSProperties,
};

const TUNNEL_WIDTH = 2;
const TUNNEL_HEIGHT = 1.8;
const SEGMENT_DEPTH = 1;
const NUM_SEGMENTS = 15;
const LINE_RADIUS = 0.003;
const SCROLL_TO_Z = 0.05;
const CAMERA_CHASE = 0.1;
const FADE_IN = 1;

const FOG_FAR = NUM_SEGMENTS * SEGMENT_DEPTH * 0.95;

interface PreloaderProps {
  onComplete?: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
  const pathname = usePathname();
  const { setLoaded } = useUI();
  const [isVisible, setIsVisible] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [labelText, setLabelText] = useState(DEFAULTS.labelText);

  const isHomePage = pathname === "/";

  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);

  const urls = useMemo(() => DEFAULT_IMAGES, []);
  const palette = useMemo(() => DEFAULTS.colors, []);

  const cfgRef = useRef<{ speed: number; boost: number }>({ speed: 1, boost: 1 });

  useEffect(() => {
    cfgRef.current = {
      speed: (Math.max(0, DEFAULTS.speed) / 100) * speedMultiplier,
      boost: (Math.max(0, DEFAULTS.boost) / 10) * speedMultiplier,
    };
  }, [speedMultiplier]);

  useEffect(() => {
    setHasMounted(true);

    if (!isHomePage) {
      setLoaded(true);
      setIsVisible(false);
      return;
    }

    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(DEFAULTS.background);

    const fogNear = Math.min(
      FOG_FAR * (1 - Math.min(100, Math.max(0, DEFAULTS.fade)) / 100),
      FOG_FAR - 0.01
    );
    scene.fog = new THREE.Fog(new THREE.Color(DEFAULTS.background), fogNear, FOG_FAR);

    const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const lineMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(DEFAULTS.lineColor),
      transparent: true,
      opacity: Math.min(100, Math.max(0, DEFAULTS.lineOpacity)) / 100,
    });

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const fading: THREE.MeshBasicMaterial[] = [];

    let imageIndex = 0;
    let colorIndex = 0;
    let populateIndex = 0;
    let scrollPos = 0;
    let raf = 0;
    let last = 0;
    let pressed = false;
    let alive = true;

    const hw = TUNNEL_WIDTH / 2;
    const hh = TUNNEL_HEIGHT / 2;

    const cols = Math.max(1, Math.round(DEFAULTS.grid));
    const rows = Math.max(1, Math.round(DEFAULTS.grid));
    const colW = TUNNEL_WIDTH / cols;
    const rowH = TUNNEL_HEIGHT / rows;

    const geoFloor = new THREE.PlaneGeometry(colW, SEGMENT_DEPTH);
    const geoWall = new THREE.PlaneGeometry(SEGMENT_DEPTH, rowH);

    const geoTubeZ = new THREE.TubeGeometry(
      new THREE.LineCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -SEGMENT_DEPTH)
      ),
      1,
      LINE_RADIUS,
      8
    );
    const geoTubeX = new THREE.TubeGeometry(
      new THREE.LineCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(TUNNEL_WIDTH, 0, 0)
      ),
      1,
      LINE_RADIUS,
      8
    );
    const geoTubeY = new THREE.TubeGeometry(
      new THREE.LineCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, TUNNEL_HEIGHT, 0)
      ),
      1,
      LINE_RADIUS,
      8
    );

    const colorMats = palette.map(
      (hex) =>
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(hex),
          side: THREE.DoubleSide,
        })
    );

    const imageMats = urls.map((url) => {
      const mat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      loader.load(
        url,
        (tex) => {
          if (!alive) {
            tex.dispose();
            return;
          }
          tex.minFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          tex.colorSpace = THREE.SRGBColorSpace;
          mat.map = tex;
          mat.needsUpdate = true;
          fading.push(mat);
        },
        undefined,
        () => {}
      );
      return mat;
    });

    const tube = (geo: THREE.BufferGeometry, x: number, y: number, z = 0) => {
      const m = new THREE.Mesh(geo, lineMaterial);
      m.position.set(x, y, z);
      return m;
    };

    const SLOTS: Array<{
      geo: THREE.BufferGeometry;
      pos: THREE.Vector3;
      rot: THREE.Euler;
    }> = [];
    {
      const z = -SEGMENT_DEPTH / 2;
      for (let i = 0; i < cols; i++) {
        const x = -hw + i * colW + colW / 2;
        SLOTS.push({
          geo: geoFloor,
          pos: new THREE.Vector3(x, -hh, z),
          rot: new THREE.Euler(-Math.PI / 2, 0, 0),
        });
        SLOTS.push({
          geo: geoFloor,
          pos: new THREE.Vector3(x, hh, z),
          rot: new THREE.Euler(Math.PI / 2, 0, 0),
        });
      }
      for (let i = 0; i < rows; i++) {
        const y = -hh + i * rowH + rowH / 2;
        SLOTS.push({
          geo: geoWall,
          pos: new THREE.Vector3(-hw, y, z),
          rot: new THREE.Euler(0, Math.PI / 2, 0),
        });
        SLOTS.push({
          geo: geoWall,
          pos: new THREE.Vector3(hw, y, z),
          rot: new THREE.Euler(0, -Math.PI / 2, 0),
        });
      }
    }

    function populate(group: THREE.Group) {
      const takesSlabs = populateIndex % 2 === 0;
      populateIndex++;
      const slabs = group.userData.slabs as THREE.Mesh[];

      for (const slab of slabs) {
        if (!takesSlabs || Math.random() > 0.5) {
          slab.visible = false;
          continue;
        }
        slab.visible = true;
        if (Math.random() > 0.5) {
          slab.material = colorMats[(5 * colorIndex) % colorMats.length];
          colorIndex++;
        } else {
          slab.material = imageMats[(3 * imageIndex) % imageMats.length];
          imageIndex++;
        }
      }
    }

    function createSegment(z: number) {
      const group = new THREE.Group();
      group.position.z = z;

      for (let i = 0; i <= cols; i++) {
        const x = -hw + i * colW;
        group.add(tube(geoTubeZ, x, -hh));
        group.add(tube(geoTubeZ, x, hh));
      }
      for (let i = 1; i < rows; i++) {
        const y = -hh + i * rowH;
        group.add(tube(geoTubeZ, -hw, y));
        group.add(tube(geoTubeZ, hw, y));
      }
      group.add(tube(geoTubeX, -hw, -hh));
      group.add(tube(geoTubeX, -hw, hh));
      group.add(tube(geoTubeY, -hw, -hh));
      group.add(tube(geoTubeY, hw, -hh));

      const slabs: THREE.Mesh[] = SLOTS.map((slot) => {
        const m = new THREE.Mesh(slot.geo, colorMats[0]);
        m.position.copy(slot.pos);
        m.rotation.copy(slot.rot);
        m.visible = false;
        group.add(m);
        return m;
      });
      group.userData.slabs = slabs;

      populate(group);
      return group;
    }

    const segments: THREE.Group[] = [];
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const g = createSegment(-i * SEGMENT_DEPTH);
      scene.add(g);
      segments.push(g);
    }

    const resize = () => {
      const w = Math.max(1, frame.clientWidth);
      const h = Math.max(1, frame.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(frame);
    resize();

    const animate = (now: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(animate);
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;

      const cfg = cfgRef.current;
      scrollPos += pressed ? cfg.boost : cfg.speed;

      const want = -SCROLL_TO_Z * scrollPos;
      camera.position.z += CAMERA_CHASE * (want - camera.position.z);

      const span = NUM_SEGMENTS * SEGMENT_DEPTH;
      const z = camera.position.z;
      for (const seg of segments) {
        if (seg.position.z > z + SEGMENT_DEPTH) {
          seg.position.z -= span;
          populate(seg);
        } else if (seg.position.z < z - span - SEGMENT_DEPTH) {
          seg.position.z += span;
          populate(seg);
        }
      }

      for (let i = fading.length - 1; i >= 0; i--) {
        const m = fading[i];
        m.opacity = Math.min(1, m.opacity + dt / FADE_IN);
        if (m.opacity >= 1) fading.splice(i, 1);
      }

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    const onMove = (e: PointerEvent) => {
      const el = cursorRef.current;
      if (!el) return;
      const rect = frame.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.transform = `translate3d(${x}px, ${y - 40}px, 0) scale(${pressed ? 0.85 : 1})`;
    };
    const onEnter = () => {
      const el = cursorRef.current;
      if (el) el.style.opacity = "1";
    };
    const onLeave = () => {
      pressed = false;
      const el = cursorRef.current;
      if (el) el.style.opacity = "0";
    };
    const onDown = () => {
      pressed = true;
    };
    const onUp = () => {
      pressed = false;
    };

    frame.addEventListener("pointermove", onMove);
    frame.addEventListener("pointerenter", onEnter);
    frame.addEventListener("pointerleave", onLeave);
    frame.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    // Sequence state choreography: CRUISE -> SLOWDOWN (1s) -> HYPER WARP -> DONE
    let slowdownTimeout: NodeJS.Timeout;
    let speedUpTimeout: NodeJS.Timeout;
    let finishTimeout: NodeJS.Timeout;
    const startTime = Date.now();

    const triggerTransitionSequence = () => {
      const elapsed = Date.now() - startTime;
      const delayBeforeSlow = Math.max(1000, 1500 - elapsed);

      slowdownTimeout = setTimeout(() => {
        // Step 1: Slowdown beat when site loaded (1 full sec hold)
        setSpeedMultiplier(0.15);
        setLabelText("Neural Sync Ready");

        // Step 2: Hold slowdown for 1000ms, then speed up into hyper tunnel zoom
        speedUpTimeout = setTimeout(() => {
          setSpeedMultiplier(16.0);
          setLabelText("Warp Launch!");

          // Step 3: After 700ms hyper speed, land onto home page
          finishTimeout = setTimeout(() => {
            setIsVisible(false);
            setLoaded(true);
            if (onComplete) onComplete();
          }, 700);
        }, 1000);
      }, delayBeforeSlow);
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
      triggerTransitionSequence();
    } else {
      const handleLoad = () => triggerTransitionSequence();
      window.addEventListener("DOMContentLoaded", handleLoad);
      window.addEventListener("load", handleLoad);
      const fallback = setTimeout(triggerTransitionSequence, 2500);

      return () => {
        alive = false;
        cancelAnimationFrame(raf);
        ro.disconnect();
        frame.removeEventListener("pointermove", onMove);
        frame.removeEventListener("pointerenter", onEnter);
        frame.removeEventListener("pointerleave", onLeave);
        frame.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("DOMContentLoaded", handleLoad);
        window.removeEventListener("load", handleLoad);
        clearTimeout(slowdownTimeout);
        clearTimeout(speedUpTimeout);
        clearTimeout(finishTimeout);
        clearTimeout(fallback);

        geoFloor.dispose();
        geoWall.dispose();
        geoTubeZ.dispose();
        geoTubeX.dispose();
        geoTubeY.dispose();
        for (const m of colorMats) m.dispose();
        for (const m of imageMats) {
          m.map?.dispose();
          m.dispose();
        }
        lineMaterial.dispose();
        renderer.dispose();
      };
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      frame.removeEventListener("pointermove", onMove);
      frame.removeEventListener("pointerenter", onEnter);
      frame.removeEventListener("pointerleave", onLeave);
      frame.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      clearTimeout(slowdownTimeout);
      clearTimeout(speedUpTimeout);
      clearTimeout(finishTimeout);

      geoFloor.dispose();
      geoWall.dispose();
      geoTubeZ.dispose();
      geoTubeX.dispose();
      geoTubeY.dispose();
      for (const m of colorMats) m.dispose();
      for (const m of imageMats) {
        m.map?.dispose();
        m.dispose();
      }
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, [isHomePage, urls, palette, onComplete, setLoaded]);

  if (!isHomePage || !isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="preloader-3d-overlay"
          className="fixed inset-0 z-[999999] bg-black overflow-hidden select-none"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.15,
            filter: "blur(10px)",
            transition: {
              duration: 0.8,
              ease: [0.76, 0, 0.24, 1],
            },
          }}
        >
          <div ref={frameRef} className="relative w-full h-full overflow-hidden cursor-none">
            <canvas ref={canvasRef} className="block w-full h-full" />
            <div
              ref={cursorRef}
              className="absolute top-0 left-0 pointer-events-none opacity-0 bg-white rounded-full px-5 py-2.5 shadow-2xl transition-opacity duration-200"
              style={{
                ...DEFAULTS.labelFont,
                color: DEFAULTS.labelColor,
                willChange: "transform, opacity",
              }}
            >
              {labelText}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
