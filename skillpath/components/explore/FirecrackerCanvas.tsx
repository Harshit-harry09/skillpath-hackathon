'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface FirecrackerProps {
  active: boolean;
}

// Vibrant Crisp Paper Color Palette
const PAPER_PALETTE = [
  0xFF4D8B, // Bright Pink Paper
  0x10B981, // Emerald Teal Paper
  0xF59E0B, // Sunny Yellow Paper
  0x6366F1, // Royal Blue Paper
  0xEC4899, // Hot Magenta Paper
  0x38BDF8, // Sky Blue Paper
  0xFF6B0B, // Bright Orange Paper
  0xF8FAFC, // Clean White Paper
];

export function FirecrackerCanvas({ active }: FirecrackerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene();
    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Soft Ambient & Key Lighting for Clean Crisp Paper Sheen
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(4, 10, 8);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-4, -6, 5);
    scene.add(fillLight);

    // 3. Ultra-Thin 3D Paper Geometries (Zero-depth Plane geometries for true paper thinness)
    const paperSheetGeo = new THREE.PlaneGeometry(0.24, 0.40);
    const paperRibbonGeo = new THREE.PlaneGeometry(0.12, 0.75);

    // Crisp Double-Sided Paper Materials
    const materials = PAPER_PALETTE.map(
      (color) =>
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.8, // Crisp matte paper texture
          metalness: 0.1,  // Slight vibrant paper sheen
          side: THREE.DoubleSide, // Double-sided thin paper
          transparent: true,
          opacity: 1,
        })
    );

    interface PaperPhysics {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      vrx: number;
      vry: number;
      vrz: number;
      gravity: number;
      drag: number;
      isResting: boolean;
      wobbleSeed: number;
      wobbleSpeed: number;
      restTimer: number;
    }

    const paperParticles: PaperPhysics[] = [];

    // Calculate 3D viewport floor boundaries
    const vFOV = (camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
    const visibleWidth = visibleHeight * camera.aspect;

    const floorY = -visibleHeight / 2 + 0.35; // Screen bottom floor
    const leftX = -visibleWidth / 2 + 0.4;
    const rightX = visibleWidth / 2 - 0.4;

    // Mouse World Coordinate Tracking for Paper Flutter Wind
    const mouseWorld = new THREE.Vector3(999, 999, 0);
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const updateMousePos = (e: MouseEvent) => {
      mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);
      raycaster.ray.intersectPlane(planeZ, mouseWorld);
    };

    const handlePointerMove = (e: PointerEvent) => updateMousePos(e);

    // Click trigger: Explosive paper wind gust!
    const handleClick = (e: MouseEvent) => {
      updateMousePos(e);
      // Create paper gust lifting sheets into the air
      paperParticles.forEach((p) => {
        const dx = p.mesh.position.x - mouseWorld.x;
        const dy = p.mesh.position.y - mouseWorld.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 16) {
          const dist = Math.sqrt(distSq) || 0.1;
          const force = (1 - dist / 4) * 0.35;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force + 0.15; // Lift paper upward
          p.vz += (Math.random() - 0.5) * 0.15;
          p.vrx += (Math.random() - 0.5) * 0.4;
          p.vry += (Math.random() - 0.5) * 0.4;
          p.isResting = false;
        }
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('click', handleClick);

    // Spawns Light Paper Popper Burst
    const firePaperCannon = (startX: number, angleDeg: number, count = 130) => {
      const angleRad = (angleDeg * Math.PI) / 180;

      for (let i = 0; i < count; i++) {
        const mat = materials[Math.floor(Math.random() * materials.length)];
        const isRibbon = Math.random() < 0.3;
        const mesh = new THREE.Mesh(isRibbon ? paperRibbonGeo : paperSheetGeo, mat);

        mesh.position.set(
          startX + (Math.random() - 0.5) * 0.3,
          floorY + 0.3,
          (Math.random() - 0.5) * 1.5
        );
        mesh.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );

        scene.add(mesh);

        const spread = (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 0.38 + 0.28; // Light paper blast speed
        const finalAngle = angleRad + spread;

        paperParticles.push({
          mesh,
          vx: Math.cos(finalAngle) * speed,
          vy: Math.sin(finalAngle) * speed,
          vz: (Math.random() - 0.5) * 0.15,
          vrx: (Math.random() - 0.5) * 0.3,
          vry: (Math.random() - 0.5) * 0.4,
          vrz: (Math.random() - 0.5) * 0.3,
          gravity: Math.random() * 0.0012 + 0.0018, // Light paper gravity (slow soft fall)
          drag: 0.992, // Air float resistance
          isResting: false,
          wobbleSeed: Math.random() * 100,
          wobbleSpeed: Math.random() * 0.08 + 0.04,
          restTimer: 0,
        });
      }
    };

    // Initial pop from bottom corners
    firePaperCannon(leftX, 58, 140);
    firePaperCannon(rightX, 122, 140);

    // Secondary burst at 300ms
    const timer1 = setTimeout(() => {
      firePaperCannon(leftX + 1.2, 65, 80);
      firePaperCannon(rightX - 1.2, 115, 80);
    }, 300);

    let animationFrameId: number;
    let clock = 0;

    const animate = () => {
      clock += 0.016;

      for (let i = 0; i < paperParticles.length; i++) {
        const p = paperParticles[i];
        const mesh = p.mesh;

        // Interactive Cursor Paper Gust (Lifts and scatters paper)
        const dx = mesh.position.x - mouseWorld.x;
        const dy = mesh.position.y - mouseWorld.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 3.2) {
          const dist = Math.sqrt(distSq) || 0.1;
          const force = (1 - dist / 1.8) * 0.06;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force + 0.02; // Lift paper upwards
          p.vrx += (Math.random() - 0.5) * 0.15;
          p.vry += (Math.random() - 0.5) * 0.15;
          p.isResting = false;
        }

        if (!p.isResting) {
          p.vx *= p.drag;
          p.vy *= p.drag;
          p.vz *= p.drag;

          p.vy -= p.gravity;

          // Strong Aerodynamic Side Wobble (Paper floating side to side)
          p.vx += Math.sin(clock * 5 + p.wobbleSeed) * 0.0035;

          mesh.position.x += p.vx;
          mesh.position.y += p.vy;
          mesh.position.z += p.vz;

          mesh.rotation.x += p.vrx;
          mesh.rotation.y += p.vry;
          mesh.rotation.z += p.vrz;

          // Soft Paper Floor Landing (No hard bouncing!)
          if (mesh.position.y <= floorY) {
            mesh.position.y = floorY + (Math.random() * 0.04);
            p.isResting = true;
            p.vy = 0;
            p.vx = 0;
            p.vz = 0;
            // Lie flat on floor with slight natural tilt
            mesh.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.15;
            mesh.rotation.y = (Math.random() - 0.5) * 0.2;
          }
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer1);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      paperParticles.forEach((p) => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 pointer-events-none w-full h-full"
    />
  );
}
