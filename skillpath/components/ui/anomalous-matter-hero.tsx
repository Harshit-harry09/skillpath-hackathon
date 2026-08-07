'use client';
// updated

import React, { useRef, useEffect, Suspense } from "react";
import {
  Scene, PerspectiveCamera, WebGLRenderer,
  IcosahedronGeometry, Color, ShaderMaterial, Mesh, PointLight,
} from "three";
import { useTheme } from "next-themes";

export function GenerativeArtScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<PointLight>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const { theme } = useTheme();

  useEffect(() => {
    let frameId: number;
    let cleanupFn: (() => void) | null = null;

    const initTimer = setTimeout(() => {
      const currentMount = mountRef.current;
      if (!currentMount) return;

      const scene = new Scene();
      const camera = new PerspectiveCamera(
        75,
        currentMount.clientWidth / currentMount.clientHeight,
        0.1,
        1000
      );
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      camera.position.z = isMobile ? 4.5 : 3;

      const renderer = new WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      currentMount.appendChild(renderer.domElement);

      const detailLevel = isMobile ? 12 : 16;
      const geometry = new IcosahedronGeometry(1.6, detailLevel);
      
      const isDark = theme === 'dark';
      const skyColor = new Color().setHSL(203/360, 0.92, isDark ? 0.53 : 0.4);

      const material = new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color: { value: skyColor },
        },
        vertexShader: `
          uniform float time;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
          vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
          float snoise(vec3 v) {
              const vec2 C = vec2(1.0/6.0, 1.0/3.0);
              const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
              vec3 i = floor(v + dot(v, C.yyy));
              vec3 x0 = v - i + dot(i, C.xxx);
              vec3 g = step(x0.yzx, x0.xyz);
              vec3 l = 1.0 - g;
              vec3 i1 = min(g.xyz, l.zxy);
              vec3 i2 = max(g.xyz, l.zxy);
              vec3 x1 = x0 - i1 + C.xxx;
              vec3 x2 = x0 - i2 + C.yyy;
              vec3 x3 = x0 - D.yyy;
              i = mod289(i);
              vec4 p = permute(permute(permute(
                          i.z + vec4(0.0, i1.z, i2.z, 1.0))
                      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
              float n_ = 0.142857142857;
              vec3 ns = n_ * D.wyz - D.xzx;
              vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
              vec4 x_ = floor(j * ns.z);
              vec4 y_ = floor(j - 7.0 * x_);
              vec4 x = x_ * ns.x + ns.yyyy;
              vec4 y = y_ * ns.x + ns.yyyy;
              vec4 h = 1.0 - abs(x) - abs(y);
              vec4 b0 = vec4(x.xy, y.xy);
              vec4 b1 = vec4(x.zw, y.zw);
              vec4 s0 = floor(b0) * 2.0 + 1.0;
              vec4 s1 = floor(b1) * 2.0 + 1.0;
              vec4 sh = -step(h, vec4(0.0));
              vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
              vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
              vec3 p0 = vec3(a0.xy, h.x);
              vec3 p1 = vec3(a0.zw, h.y);
              vec3 p2 = vec3(a1.xy, h.z);
              vec3 p3 = vec3(a1.zw, h.w);
              vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
              p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
              vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
              m = m * m;
              return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
          }

          void main() {
              vNormal = normal;
              vPosition = position;
              float displacement = snoise(position * 2.0 + time * 0.5) * 0.2;
              vec3 newPosition = position + normal * displacement;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
              vec3 normal = normalize(vNormal);
              vec3 lightDir = normalize(vec3(0.0, 0.0, 5.0) - vPosition);
              float diffuse = max(dot(normal, lightDir), 0.0);
              
              float fresnel = 1.0 - dot(normal, vec3(0.0, 0.0, 1.0));
              fresnel = pow(fresnel, 2.0);
              
              vec3 finalColor = color * diffuse + color * fresnel * 0.5;
              gl_FragColor = vec4(finalColor, 1.0);
          }
        `,
        wireframe: true,
      });
      
      // @ts-ignore
      materialRef.current = material;

      const mesh = new Mesh(geometry, material);
      scene.add(mesh);

      const pointLight = new PointLight(0xffffff, 1, 100);
      pointLight.position.set(0, 0, 5);
      scene.add(pointLight);

      // ponytail: isVisible starts false — loop only begins when IntersectionObserver fires,
      // not eagerly on mount. Eliminates ~100-200ms blocking rAF on initial load.
      let isVisible = false;
      const animate = (t: number) => {
        if (!isVisible || document.hidden) { frameId = 0; return; }
        material.uniforms.time.value = t * 0.00015;
        mesh.rotation.y += 0.0002;
        mesh.rotation.x += 0.0001;
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };

      const observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !frameId) animate(performance.now());
      }, { threshold: 0.05 });
      observer.observe(currentMount);

      const handleVisibilityChange = () => {
        if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; }
        else if (isVisible && !frameId) animate(performance.now());
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          const height = entry.contentRect.height;
          if (width > 0 && height > 0) {
            camera.aspect = width / height;
            camera.position.z = width < 768 ? 4.5 : 3;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
          }
        }
      });
      resizeObserver.observe(currentMount);

      cleanupFn = () => {
        cancelAnimationFrame(frameId);
        observer.disconnect();
        resizeObserver.disconnect();
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        if (currentMount && renderer.domElement.parentNode === currentMount) {
          currentMount.removeChild(renderer.domElement);
        }
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (cleanupFn) cleanupFn();
    };
  }, []);

  // Sync theme color
  useEffect(() => {
    if (materialRef.current) {
      const isDark = theme === 'dark';
      const skyColor = new Color().setHSL(203/360, 0.92, isDark ? 0.53 : 0.4);
      materialRef.current.uniforms.color.value = skyColor;
    }
  }, [theme]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />;
}

interface AnomalousMatterHeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

export function AnomalousMatterHero({
  title = "Observation Log: Anomaly 7",
  subtitle = "Matter in a state of constant, beautiful flux.",
  description = "A new form of digital existence has been observed. It responds to stimuli, changes form, and exudes an unknown energy. Further study is required.",
}: AnomalousMatterHeroProps) {
  return (
    <section
      role="banner"
      className="relative w-full h-screen bg-canvas text-ink overflow-hidden"
    >
      <Suspense fallback={<div className="w-full h-full bg-canvas" />}>
        <GenerativeArtScene />
      </Suspense>

      <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/70 to-transparent z-10" />

      <div className="relative z-20 flex flex-col items-center justify-end h-full pb-20 md:pb-32 text-center">
        <div className="max-w-3xl px-4 animate-fade-in-long">
          <h1 className="text-sm font-sans font-bold tracking-[0.3em] text-brand-lavender uppercase">
            {title}
          </h1>
          <p className="mt-4 text-display-md md:text-display-lg leading-tight">
            {subtitle}
          </p>
          <p className="mt-6 max-w-xl mx-auto text-body-md leading-relaxed text-muted">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
