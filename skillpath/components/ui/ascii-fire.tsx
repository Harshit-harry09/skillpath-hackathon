"use client";
// updated

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

export type PaletteMode = "mono" | "color" | "custom";
export type WindDirection = "left" | "right";
export type FireCharset = "classic" | "dense" | "blocks" | "minimal";

export type FireParticle = {
  kind: "ember" | "spark";
  glyph: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  heat: number;
  life: number;
  maxLife: number;
};

export type AsciiFireOptions = {
  intensity: number;
  windDirection: WindDirection;
  windForce: number;
  decay: number;
  turbulence: number;
  thickness: number;
  embers: boolean;
  sparks: boolean;
  pulse: boolean;
  palette: PaletteMode;
  shades: string[];
  sparkColor: string;
  charset: FireCharset;
  backgroundColor: string;
};

export type Props = Partial<AsciiFireOptions> & {
  style?: React.CSSProperties;
  className?: string;
};

type FireConfig = {
  intensity: number;
  wind: number;
  decay: number;
  turbulence: number;
  thickness: number;
  embers: boolean;
  sparks: boolean;
  pulse: boolean;
};

const FONT_SIZE = 11;

const CHARSETS: Record<FireCharset, string> = {
  classic: " .:-=+*#%@",
  dense: " .':;!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  blocks: " ░▒▓█",
  minimal: " .:*#",
};

const DEFAULT_CHARSET_KEY: FireCharset = "classic";

// SkillPath brand palette tuned for dark mode
export const SKILLPATH_DARK_PALETTE = [
  "#2a0815",
  "#5c0e2c",
  "#9e1b48",
  "#ff4d8b", // SkillPath Brand Pink
  "#ff7aa5",
  "#ffb084", // SkillPath Brand Peach
  "#ffe299", // Warm Flame Core
] as const;

// SkillPath brand palette tuned for light mode
export const SKILLPATH_LIGHT_PALETTE = [
  "#e0d2c0",
  "#c47b97",
  "#a83262",
  "#ff4d8b", // SkillPath Brand Pink
  "#d62b66",
  "#7a1238",
  "#0a0a0a", // Dark flame core contrast
] as const;

export const MONO_DARK_PALETTE = [
  "#181818",
  "#303030",
  "#505050",
  "#787878",
  "#a8a8a8",
  "#d8d8d8",
  "#ffffff",
] as const;

export const MONO_LIGHT_PALETTE = [
  "#e0e0e0",
  "#b0b0b0",
  "#888888",
  "#606060",
  "#404040",
  "#202020",
  "#0a0a0a",
] as const;

const DEFAULT_FIRE_OPTIONS: AsciiFireOptions = {
  intensity: 130,
  windDirection: "right",
  windForce: 12,
  decay: 10,
  turbulence: 40,
  thickness: 3.5,
  embers: true,
  sparks: true,
  pulse: true,
  palette: "color",
  shades: [...SKILLPATH_DARK_PALETTE],
  sparkColor: "#ff4d8b",
  charset: "classic",
  backgroundColor: "transparent",
};

const FPS = 30;

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

const resolveWind = (direction: WindDirection, force: number): number => {
  const amount = clamp(force, 10, 100);
  return direction === "left" ? -amount : amount;
};

const resolveCharacters = (
  charsetName: FireCharset | undefined | string
): string =>
  (charsetName && CHARSETS[charsetName as FireCharset]) ||
  CHARSETS[DEFAULT_CHARSET_KEY];

const resolvePalette = (
  palette: PaletteMode | undefined | string,
  shades: readonly string[] | undefined,
  isDark: boolean
): readonly string[] => {
  if (palette === "custom" && shades && shades.length > 0) {
    return shades;
  }
  if (palette === "mono") {
    return isDark ? MONO_DARK_PALETTE : MONO_LIGHT_PALETTE;
  }
  return isDark ? SKILLPATH_DARK_PALETTE : SKILLPATH_LIGHT_PALETTE;
};

const seedFuel = (
  heat: Float32Array,
  columns: number,
  rows: number,
  config: FireConfig,
  elapsedSeconds: number
): void => {
  const pulseMultiplier = config.pulse
    ? 0.9 + Math.sin(elapsedSeconds * 2.8) * 0.1
    : 1;
  const fuelRows = clamp(Math.round(config.thickness), 1, Math.max(1, rows - 1));
  const baseHeat = clamp(config.intensity / 100, 0.1, 1.4) * pulseMultiplier;

  for (let rowOffset = 0; rowOffset < fuelRows; rowOffset += 1) {
    const row = rows - 1 - rowOffset;
    const rowStrength = 1 - rowOffset / Math.max(fuelRows * 1.5, 1);

    for (let column = 0; column < columns; column += 1) {
      // Dynamic sinewave flame plumes for tall, energetic rising fire
      const plume =
        0.6 +
        0.32 * Math.sin(column * 0.1 + elapsedSeconds * 3.2) +
        0.25 * Math.sin(column * 0.25 - elapsedSeconds * 2.4) +
        0.20 * Math.sin(column * 0.05 + elapsedSeconds * 1.4);

      const index = row * columns + column;
      const flicker = 0.7 + Math.random() * 0.3;
      heat[index] = clamp(baseHeat * rowStrength * plume * flicker, 0, 1.4);
    }
  }
};

const propagateFire = (
  heat: Float32Array,
  nextHeat: Float32Array,
  columns: number,
  rows: number,
  config: FireConfig
): void => {
  nextHeat.fill(0);
  const windOffset = config.wind / 35;
  const turbulence = config.turbulence / 100;
  
  // Slower decay allowing flames to reach high behind cards
  const rowDecayRate = Math.max(0.55 / Math.max(rows - 1, 4), config.decay / 400);

  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const randomDrift = (Math.random() - 0.5) * (1.3 + turbulence * 4);
      const sourceColumn = clamp(
        Math.round(column - windOffset + randomDrift),
        0,
        columns - 1
      );
      const rowBelow = (row + 1) * columns;
      const rowTwoBelow = Math.min(row + 2, rows - 1) * columns;
      const sideDirection = Math.random() < 0.5 ? -1 : 1;
      const side =
        rowBelow + clamp(sourceColumn + sideDirection, 0, columns - 1);
      const center = rowBelow + sourceColumn;
      const deep = rowTwoBelow + sourceColumn;
      let carriedHeat =
        heat[center] * 0.55 + heat[side] * 0.20 + heat[deep] * 0.25;
      const randomCooling =
        rowDecayRate * (0.3 + Math.random() * (1.0 + turbulence * 1.2));

      if (Math.random() < turbulence * 0.06) {
        carriedHeat *= 0.5 + Math.random() * 0.5;
      }

      nextHeat[row * columns + column] = clamp(carriedHeat - randomCooling, 0, 1.4);
    }
  }

  const fuelStart = Math.max(0, rows - Math.round(config.thickness));
  nextHeat.set(heat.subarray(fuelStart * columns), fuelStart * columns);
};

const updateParticles = (
  particles: FireParticle[],
  columns: number,
  rows: number,
  config: FireConfig
): FireParticle[] => {
  const updatedParticles = particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.velocityX + config.wind / 350,
      y: particle.y + particle.velocityY,
      velocityX:
        particle.velocityX + (Math.random() - 0.5) * (config.turbulence / 200),
      heat: particle.heat * (particle.kind === "spark" ? 0.975 : 0.94),
      life: particle.life - 1,
    }))
    .filter(
      (particle) =>
        particle.life > 0 &&
        particle.y >= 0 &&
        particle.x >= 0 &&
        particle.x < columns
    );

  const spawnParticle = (isSpark: boolean): void => {
    const sourceColumn = Math.floor(Math.random() * columns);
    const life = isSpark ? 24 + Math.random() * 28 : 28 + Math.random() * 32;
    updatedParticles.push({
      kind: isSpark ? "spark" : "ember",
      glyph: isSpark ? (Math.random() < 0.5 ? "*" : "^") : ".",
      x: sourceColumn + (Math.random() - 0.5) * 2,
      y: rows - Math.max(2, config.thickness),
      velocityX: (Math.random() - 0.5) * (isSpark ? 0.55 : 0.22),
      velocityY: isSpark
        ? -(0.85 + Math.random() * 0.85)
        : -(0.30 + Math.random() * 0.40),
      heat: isSpark ? 1.3 : 0.85,
      life,
      maxLife: life,
    });
  };

  if (config.embers && Math.random() < 0.5) spawnParticle(false);
  if (config.sparks && Math.random() < 0.25) spawnParticle(true);

  return updatedParticles.slice(-Math.max(80, Math.round(columns * 2.2)));
};

const escapeHtml = (character: string): string => {
  if (character === "&") return "&amp;";
  if (character === "<") return "&lt;";
  if (character === ">") return "&gt;";
  return character;
};

const renderFire = (
  element: HTMLPreElement,
  heat: Float32Array,
  particles: FireParticle[],
  columns: number,
  rows: number,
  charsetName: FireCharset,
  palette: readonly string[],
  sparkColor: string
): void => {
  const displayHeat = new Float32Array(heat);
  const particleGlyphs = new Map<number, { color: string; glyph: string }>();
  const safePalette = palette && palette.length > 0 ? palette : SKILLPATH_DARK_PALETTE;
  const resolvedSparkColor =
    sparkColor ||
    safePalette[safePalette.length - 1] ||
    SKILLPATH_DARK_PALETTE[SKILLPATH_DARK_PALETTE.length - 1];

  for (const particle of particles) {
    const column = clamp(Math.round(particle.x), 0, columns - 1);
    const row = clamp(Math.round(particle.y), 0, rows - 1);
    const fade = particle.life / particle.maxLife;
    const index = row * columns + column;
    displayHeat[index] = Math.max(displayHeat[index], particle.heat * fade);
    if (particle.kind === "spark" || !particleGlyphs.has(index)) {
      particleGlyphs.set(index, {
        color:
          particle.kind === "spark"
            ? resolvedSparkColor
            : safePalette[Math.max(0, safePalette.length - 3)],
        glyph: particle.glyph,
      });
    }
  }

  const characters = resolveCharacters(charsetName);
  const lines: string[] = [];

  for (let row = 0; row < rows; row += 1) {
    let line = "";
    let activeColor = "";
    let run = "";

    const flushRun = (): void => {
      if (!run) return;
      line += activeColor
        ? `<span style="color:${activeColor}">${run}</span>`
        : run;
      run = "";
    };

    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const value = displayHeat[index];
      const particleGlyph = particleGlyphs.get(index);

      if (value < 0.04 && !particleGlyph) {
        if (activeColor !== "") {
          flushRun();
          activeColor = "";
        }
        run += " ";
        continue;
      }

      const characterIndex = clamp(
        Math.floor(value * (characters.length - 1)),
        0,
        characters.length - 1
      );
      const paletteIndex = clamp(
        Math.floor(Math.pow(value, 0.65) * (safePalette.length - 1)),
        0,
        safePalette.length - 1
      );

      const color = particleGlyph?.color ?? safePalette[paletteIndex];
      const character = particleGlyph?.glyph ?? characters[characterIndex];

      if (color !== activeColor) {
        flushRun();
        activeColor = color;
      }
      run += escapeHtml(character);
    }

    flushRun();
    lines.push(line);
  }

  element.innerHTML = lines.join("\n");
};

export default function AsciiFire(props: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted
    ? resolvedTheme === "dark" ||
      (typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark"))
    : true;

  const {
    intensity = DEFAULT_FIRE_OPTIONS.intensity,
    windDirection = DEFAULT_FIRE_OPTIONS.windDirection,
    windForce = DEFAULT_FIRE_OPTIONS.windForce,
    decay = DEFAULT_FIRE_OPTIONS.decay,
    turbulence = DEFAULT_FIRE_OPTIONS.turbulence,
    thickness = DEFAULT_FIRE_OPTIONS.thickness,
    embers = DEFAULT_FIRE_OPTIONS.embers,
    sparks = DEFAULT_FIRE_OPTIONS.sparks,
    pulse = DEFAULT_FIRE_OPTIONS.pulse,
    palette = DEFAULT_FIRE_OPTIONS.palette,
    shades,
    sparkColor,
    charset = DEFAULT_FIRE_OPTIONS.charset,
    backgroundColor = DEFAULT_FIRE_OPTIONS.backgroundColor,
    style,
    className,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const wind = resolveWind(windDirection, windForce);
  const activePalette = resolvePalette(palette, shades, isDark);
  const activeSparkColor =
    sparkColor || (isDark ? "#ff4d8b" : "#ff4d8b");

  useEffect(() => {
    const container = containerRef.current;
    const output = outputRef.current;
    if (!container || !output) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    const measurementContext = document.createElement("canvas").getContext("2d");
    let animationFrameId = 0;
    let isActive = true;
    let columns = 1;
    let rows = 1;
    let heat = new Float32Array(1);
    let nextHeat = new Float32Array(1);
    let particles: FireParticle[] = [];
    let previousFrameTime = 0;
    let startTime = performance.now();

    const config: FireConfig = {
      intensity,
      wind,
      decay,
      turbulence,
      thickness,
      embers,
      sparks,
      pulse,
    };

    const handleResize = (): void => {
      const bounds = container.getBoundingClientRect();
      const width = Math.max(bounds.width, container.clientWidth) || 600;
      const height = Math.max(bounds.height, container.clientHeight) || 600;

      const fontFamily =
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      const lineHeight = FONT_SIZE * 1.05;
      if (measurementContext) {
        measurementContext.font = `${FONT_SIZE}px ${fontFamily}`;
      }
      const characterWidth =
        measurementContext?.measureText("M").width || FONT_SIZE * 0.6;
      const nextColumns = Math.max(1, Math.floor(width / characterWidth));
      const nextRows = Math.max(1, Math.floor(height / lineHeight));
      if (nextColumns === columns && nextRows === rows) return;

      columns = nextColumns;
      rows = nextRows;
      heat = new Float32Array(columns * rows);
      nextHeat = new Float32Array(columns * rows);
      particles = [];

      for (let warmUpStep = 0; warmUpStep < Math.min(rows, 48); warmUpStep += 1) {
        seedFuel(heat, columns, rows, config, warmUpStep / FPS);
        propagateFire(heat, nextHeat, columns, rows, config);
        [heat, nextHeat] = [nextHeat, heat];
      }

      renderFire(
        output,
        heat,
        particles,
        columns,
        rows,
        charset,
        activePalette,
        activeSparkColor
      );
    };

    const drawFrame = (timestamp: number): void => {
      const frameInterval = 1000 / FPS;
      const elapsedSinceFrame = timestamp - previousFrameTime;

      if (elapsedSinceFrame >= frameInterval || previousFrameTime === 0) {
        const elapsedSeconds = (timestamp - startTime) / 1000;
        seedFuel(heat, columns, rows, config, elapsedSeconds);
        propagateFire(heat, nextHeat, columns, rows, config);
        [heat, nextHeat] = [nextHeat, heat];
        particles = updateParticles(particles, columns, rows, config);
        renderFire(
          output,
          heat,
          particles,
          columns,
          rows,
          charset,
          activePalette,
          activeSparkColor
        );
        previousFrameTime = timestamp - (elapsedSinceFrame % frameInterval);
      }

      if (reducedMotionQuery.matches) return;
      animationFrameId = window.requestAnimationFrame(drawFrame);
    };

    const handleMotionPreferenceChange = (): void => {
      window.cancelAnimationFrame(animationFrameId);
      previousFrameTime = 0;
      startTime = performance.now();
      animationFrameId = window.requestAnimationFrame(drawFrame);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();
    void document.fonts.ready.then(() => {
      if (isActive) handleResize();
    });
    animationFrameId = window.requestAnimationFrame(drawFrame);
    reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      isActive = false;
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      reducedMotionQuery.removeEventListener(
        "change",
        handleMotionPreferenceChange
      );
    };
  }, [
    intensity,
    wind,
    decay,
    turbulence,
    thickness,
    embers,
    sparks,
    pulse,
    activePalette,
    activeSparkColor,
    charset,
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 100,
        overflow: "hidden",
        backgroundColor,
        ...style,
      }}
    >
      <pre
        ref={outputRef}
        role="img"
        aria-label="Animated ASCII wall of fire"
        style={{
          position: "absolute",
          inset: 0,
          margin: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          userSelect: "none",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: FONT_SIZE,
          fontVariantLigatures: "none",
          lineHeight: 1.05,
          whiteSpace: "pre",
          textRendering: "optimizeSpeed",
        }}
      />
    </div>
  );
}
