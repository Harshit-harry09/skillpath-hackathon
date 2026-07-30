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

    // 3. Ultra-Thin 3D Instanced Paper Geometries (Zero-depth Plane geometries)
    const paperSheetGeo = new THREE.PlaneGeometry(0.24, 0.40);
    const paperRibbonGeo = new THREE.PlaneGeometry(0.12, 0.75);

    const paperMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    });

    const MAX_PARTICLES = 600;
    const instancedSheets = new THREE.InstancedMesh(paperSheetGeo, paperMaterial, MAX_PARTICLES);
    const instancedRibbons = new THREE.InstancedMesh(paperRibbonGeo, paperMaterial, MAX_PARTICLES);

    instancedSheets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    instancedRibbons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    scene.add(instancedSheets);
    scene.add(instancedRibbons);

    interface ParticleState {
      isRibbon: boolean;
      instancedIndex: number;
      x: number; y: number; z: number;
      rx: number; ry: number; rz: number;
      vx: number; vy: number; vz: number;
      vrx: number; vry: number; vrz: number;
      gravity: number;
      drag: number;
      isResting: boolean;
      wobbleSeed: number;
    }

    const particles: ParticleState[] = [];
    let sheetCount = 0;
    let ribbonCount = 0;

    const dummy = new THREE.Object3D();
    const tempColor = new THREE.Color();

    // Calculate 3D viewport floor boundaries
    const vFOV = (camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
    const visibleWidth = visibleHeight * camera.aspect;

    const floorY = -visibleHeight / 2 + 0.35;
    const leftX = -visibleWidth / 2 + 0.4;
    const rightX = visibleWidth / 2 - 0.4;

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

    const handleClick = (e: MouseEvent) => {
      updateMousePos(e);
      particles.forEach((p) => {
        const dx = p.x - mouseWorld.x;
        const dy = p.y - mouseWorld.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 16) {
          const dist = Math.sqrt(distSq) || 0.1;
          const force = (1 - dist / 4) * 0.35;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force + 0.15;
          p.vz += (Math.random() - 0.5) * 0.15;
          p.vrx += (Math.random() - 0.5) * 0.4;
          p.vry += (Math.random() - 0.5) * 0.4;
          p.isResting = false;
        }
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('click', handleClick);

    const spawnParticles = (startX: number, angleDeg: number, count = 130) => {
      const angleRad = (angleDeg * Math.PI) / 180;

      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        const isRibbon = Math.random() < 0.3;
        const hexColor = PAPER_PALETTE[Math.floor(Math.random() * PAPER_PALETTE.length)];
        tempColor.setHex(hexColor);

        const idx = isRibbon ? ribbonCount++ : sheetCount++;
        const targetMesh = isRibbon ? instancedRibbons : instancedSheets;
        targetMesh.setColorAt(idx, tempColor);

        const spread = (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 0.38 + 0.28;
        const finalAngle = angleRad + spread;

        particles.push({
          isRibbon,
          instancedIndex: idx,
          x: startX + (Math.random() - 0.5) * 0.3,
          y: floorY + 0.3,
          z: (Math.random() - 0.5) * 1.5,
          rx: Math.random() * Math.PI * 2,
          ry: Math.random() * Math.PI * 2,
          rz: Math.random() * Math.PI * 2,
          vx: Math.cos(finalAngle) * speed,
          vy: Math.sin(finalAngle) * speed,
          vz: (Math.random() - 0.5) * 0.15,
          vrx: (Math.random() - 0.5) * 0.3,
          vry: (Math.random() - 0.5) * 0.4,
          vrz: (Math.random() - 0.5) * 0.3,
          gravity: Math.random() * 0.0012 + 0.0018,
          drag: 0.992,
          isResting: false,
          wobbleSeed: Math.random() * 100,
        });
      }
      if (instancedSheets.instanceColor) instancedSheets.instanceColor.needsUpdate = true;
      if (instancedRibbons.instanceColor) instancedRibbons.instanceColor.needsUpdate = true;
    };

    spawnParticles(leftX, 58, 140);
    spawnParticles(rightX, 122, 140);

    const timer1 = setTimeout(() => {
      spawnParticles(leftX + 1.2, 65, 80);
      spawnParticles(rightX - 1.2, 115, 80);
    }, 300);

    let animationFrameId: number;
    let clock = 0;

    const animate = () => {
      clock += 0.016;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = p.x - mouseWorld.x;
        const dy = p.y - mouseWorld.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 3.2) {
          const dist = Math.sqrt(distSq) || 0.1;
          const force = (1 - dist / 1.8) * 0.06;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force + 0.02;
          p.vrx += (Math.random() - 0.5) * 0.15;
          p.vry += (Math.random() - 0.5) * 0.15;
          p.isResting = false;
        }

        if (!p.isResting) {
          p.vx *= p.drag;
          p.vy *= p.drag;
          p.vz *= p.drag;
          p.vy -= p.gravity;
          p.vx += Math.sin(clock * 5 + p.wobbleSeed) * 0.0035;

          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;
          p.rx += p.vrx;
          p.ry += p.vry;
          p.rz += p.vrz;

          if (p.y <= floorY) {
            p.y = floorY + Math.random() * 0.04;
            p.isResting = true;
            p.vy = 0; p.vx = 0; p.vz = 0;
            p.rx = Math.PI / 2 + (Math.random() - 0.5) * 0.15;
            p.ry = (Math.random() - 0.5) * 0.2;
          }
        }

        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.rx, p.ry, p.rz);
        dummy.updateMatrix();

        const mesh = p.isRibbon ? instancedRibbons : instancedSheets;
        mesh.setMatrixAt(p.instancedIndex, dummy.matrix);
      }

      instancedSheets.count = sheetCount;
      instancedRibbons.count = ribbonCount;

      instancedSheets.instanceMatrix.needsUpdate = true;
      instancedRibbons.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || window.innerWidth;
        const h = entry.contentRect.height || window.innerHeight;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      clearTimeout(timer1);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('click', handleClick);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);

      paperSheetGeo.dispose();
      paperRibbonGeo.dispose();
      paperMaterial.dispose();

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
