"use client"
// updated

import { useEffect, useState, type FC } from "react"
import { motion, useSpring, useMotionValue } from "framer-motion"

export interface SmoothCursorProps {
  cursor?: React.ReactNode
  springConfig?: {
    damping: number
    stiffness: number
    mass: number
    restDelta: number
  }
}

const DESKTOP_POINTER_QUERY = "(any-hover: hover) and (any-pointer: fine)"

type CursorMode = "default" | "pointer" | "text"

const CompactCursorSVG: FC<{ isPointer?: boolean; isMouseDown?: boolean; isText?: boolean }> = ({
  isPointer,
  isMouseDown,
  isText,
}) => {
  if (isText) {
    return (
      <div className="w-1 h-5 bg-brand-pink rounded-full shadow-[0_0_8px_#ff4d8b] animate-pulse" />
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={22}
      height={24}
      viewBox="0 0 50 54"
      fill="none"
      className="transition-transform duration-100 origin-top-left"
      style={{
        transform: isMouseDown ? "scale(0.8)" : isPointer ? "scale(1.08)" : "scale(1)",
      }}
    >
      <g filter="url(#filter0_d_91_7928)">
        <path
          d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"
          fill={isPointer ? "#ff4d8b" : "black"}
          className="transition-colors duration-150"
        />
        <path
          d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z"
          stroke="white"
          strokeWidth={2.5}
        />
      </g>
      <defs>
        <filter
          id="filter0_d_91_7928"
          x={0.602397}
          y={0.952444}
          width={49.0584}
          height={52.428}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={2} />
          <feGaussianBlur stdDeviation={2} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_91_7928"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_91_7928"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  )
}

export function SmoothCursor({
  cursor,
  springConfig = {
    damping: 32,
    stiffness: 450,
    mass: 0.3,
    restDelta: 0.001,
  },
}: SmoothCursorProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [cursorMode, setCursorMode] = useState<CursorMode>("default")

  const rawMouseX = useMotionValue(-100)
  const rawMouseY = useMotionValue(-100)

  // Fast, tight spring for instant responsiveness
  const cursorX = useSpring(rawMouseX, springConfig)
  const cursorY = useSpring(rawMouseY, springConfig)

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_POINTER_QUERY)

    const updateEnabled = () => {
      const nextIsEnabled = mediaQuery.matches
      setIsEnabled(nextIsEnabled)
      if (!nextIsEnabled) {
        setIsVisible(false)
      }
    }

    updateEnabled()
    mediaQuery.addEventListener("change", updateEnabled)
    return () => {
      mediaQuery.removeEventListener("change", updateEnabled)
    }
  }, [])

  useEffect(() => {
    if (!isEnabled) {
      document.documentElement.classList.remove("custom-cursor-active")
      return
    }

    document.documentElement.classList.add("custom-cursor-active")

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return

      if (!isVisible) setIsVisible(true)

      const x = e.clientX
      const y = e.clientY

      rawMouseX.set(x)
      rawMouseY.set(y)

      const target = e.target as HTMLElement | null
      if (target) {
        const interactiveEl = target.closest(
          'a, button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"], select, .cursor-pointer, [data-cursor-pointer]'
        )
        const textEl = target.closest(
          'input[type="text"], input[type="search"], input[type="email"], input[type="password"], input[type="number"], textarea, [contenteditable="true"], .cursor-text'
        )

        if (textEl) {
          setCursorMode("text")
        } else if (interactiveEl) {
          setCursorMode("pointer")
        } else {
          setCursorMode("default")
        }
      }
    }

    const handleMouseDown = () => {
      setIsMouseDown(true)
    }

    const handleMouseUp = () => {
      setIsMouseDown(false)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)
    document.body.addEventListener("mouseleave", handleMouseLeave)
    document.body.addEventListener("mouseenter", handleMouseEnter)

    return () => {
      document.documentElement.classList.remove("custom-cursor-active")
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      document.body.removeEventListener("mouseleave", handleMouseLeave)
      document.body.removeEventListener("mouseenter", handleMouseEnter)
    }
  }, [isEnabled, isVisible, rawMouseX, rawMouseY])

  if (!isEnabled) return null

  return (
    <>
      <style jsx global>{`
        html.custom-cursor-active,
        html.custom-cursor-active * {
          cursor: none !important;
        }
      `}</style>

      {/* Main Compact Cursor Arrow */}
      <motion.div
        style={{
          position: "fixed",
          left: cursorX,
          top: cursorY,
          zIndex: 100000,
          pointerEvents: "none",
          opacity: isVisible ? 1 : 0,
        }}
      >
        {cursor || (
          <CompactCursorSVG
            isPointer={cursorMode === "pointer"}
            isMouseDown={isMouseDown}
            isText={cursorMode === "text"}
          />
        )}
      </motion.div>
    </>
  )
}



