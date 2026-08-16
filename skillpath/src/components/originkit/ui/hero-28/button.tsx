// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * The bracketed CTA — Figma 2356:1076 (filled) and 2356:1082 (ghost), identical
 * at all three frames at 156 x 51.
 *
 * Figma builds the brackets as four 10px squares carrying a top and right
 * border, each rotated or mirrored into its corner. Two borders per corner say
 * the same thing without the transforms, so they are written that way.
 *
 * The ghost variant ships its brackets at opacity 0 — they exist in the file
 * but are invisible, which only reads as a rest state for a hover. They fade in
 * on hover here rather than shipping four nodes that never paint.
 */

type ButtonVariant = "primary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const BASE_CLASS =
  "relative inline-flex min-h-11 items-center justify-center gap-[10px] whitespace-nowrap cursor-pointer touch-manipulation" +
  " px-[20px] py-[14px] font-rajdhani text-[18px] leading-[normal] font-bold tracking-[-0.54px] text-white" +
  " transition-[opacity,transform] duration-200 ease-out" +
  " [-webkit-tap-highlight-color:transparent]" +
  " focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" +
  " active:scale-[0.97] motion-reduce:active:scale-100" +
  " [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-90";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "bg-white/10",
  ghost: "group bg-transparent",
};

/** Figma's brackets are 50% white on the filled button, absent on the ghost. */
const BRACKET_CLASS: Record<ButtonVariant, string> = {
  primary: "opacity-50",
  ghost:
    "opacity-0 transition-opacity duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-50",
};

const CORNERS = [
  "top-0 left-0 border-t border-l",
  "top-0 right-0 border-t border-r",
  "bottom-0 left-0 border-b border-l",
  "bottom-0 right-0 border-b border-r",
] as const;

export const Button = ({
  variant = "primary",
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`${BASE_CLASS} ${VARIANT_CLASS[variant]} ${className}`}
    {...props}
  >
    {children}
    {CORNERS.map((corner) => (
      <span
        key={corner}
        aria-hidden
        className={`pointer-events-none absolute size-2.5 border-solid border-white ${corner} ${BRACKET_CLASS[variant]}`}
      />
    ))}
  </button>
);
