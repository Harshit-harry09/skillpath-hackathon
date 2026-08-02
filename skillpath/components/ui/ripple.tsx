import React, { type ComponentPropsWithoutRef, type CSSProperties } from "react"

import { cn } from "@/lib/utils"

interface RippleProps extends ComponentPropsWithoutRef<"div"> {
  mainCircleSize?: number
  mainCircleOpacity?: number
  numCircles?: number
  circleColor?: string
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 280,
  mainCircleOpacity = 0.5,
  numCircles = 9,
  circleColor,
  className,
  ...props
}: RippleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 select-none overflow-hidden flex items-center justify-center",
        className
      )}
      {...props}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 95
        const opacity = Math.max(0.12, mainCircleOpacity - i * 0.035)
        const animationDelay = `${i * 0.12}s`

        return (
          <div
            key={i}
            className="animate-ripple absolute rounded-full border border-black/20 dark:border-white/20 bg-black/[0.05] dark:bg-white/[0.08] shadow-2xl -translate-x-1/2 -translate-y-1/2"
            style={
              {
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                animationDelay,
                borderStyle: "solid",
                borderWidth: "1.5px",
                borderColor: circleColor || undefined,
                top: "50%",
                left: "50%",
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
})

Ripple.displayName = "Ripple"
