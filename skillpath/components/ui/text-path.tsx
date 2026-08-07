// updated
// Text Path — Originkit Infinite Wave Marquee
"use client"

import * as React from "react"
import { useId, useLayoutEffect, useRef, useState } from "react"

type FontValue = {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
    fontSize?: number | string
    letterSpacing?: number | string
    lineHeight?: number | string
    variant?: string
}

export type TextPathProps = {
    text?: string
    speed?: number
    reversed?: boolean
    textFont?: FontValue
    textColor?: string
    waveFrequency?: number
    waveHeight?: number
    separator?: string
    gap?: number
    className?: string
    width?: string | number
    height?: string | number
    style?: React.CSSProperties
}

const COMPONENT_DEFAULTS = {
    text: "SKILLPATH • CLOSE YOUR SKILL GAP • AI LEARNING ROADMAPS • MASTER ANY ROLE",
    separator: "   •   ",
    gap: 1,
    textFont: {
        fontSize: 20,
        variant: "Bold",
        fontWeight: 800,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontStyle: "normal",
        letterSpacing: 2,
        lineHeight: 1.2,
    },
    textColor: "var(--color-ink)",
    speed: 30,
    reversed: true,
    waveFrequency: 3,
    waveHeight: 80,
    className: "",
    width: "100%",
    height: 160,
}

export function TextPath(props: TextPathProps) {
    const mergedProps = { ...COMPONENT_DEFAULTS, ...props }
    const {
        text,
        speed,
        reversed,
        textFont,
        textColor,
        waveFrequency,
        waveHeight,
        separator,
        gap,
        className,
        width,
        height,
        style,
    } = mergedProps

    const containerRef = useRef<HTMLDivElement | null>(null)
    const pathDefRef = useRef<SVGPathElement | null>(null)
    const measureRef = useRef<SVGTextElement | null>(null)
    const textPathRef = useRef<SVGTextPathElement | null>(null)

    const [containerWidth, setContainerWidth] = useState(1200)
    const [measuredUnitWidth, setMeasuredUnitWidth] = useState<number | null>(null)

    const fontSizePx = typeof textFont?.fontSize === "number" ? textFont.fontSize : parseFloat(String(textFont?.fontSize || 20)) || 20
    const letterSpacingPx = typeof textFont?.letterSpacing === "number" ? textFont.letterSpacing : parseFloat(String(textFont?.letterSpacing || 2)) || 2

    const fontSize = `${fontSizePx}px`
    const letterSpacing = `${letterSpacingPx}px`
    const fontFamily = textFont?.fontFamily || 'Inter, system-ui, sans-serif'
    const fontWeight = textFont?.fontWeight || 800
    const fontStyle = textFont?.fontStyle || "normal"

    // Container size tracking
    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) return
        const updateSize = () => {
            const rect = el.getBoundingClientRect()
            if (rect.width > 0) {
                const w = Math.round(rect.width)
                setContainerWidth((prev) => (Math.abs(prev - w) > 2 ? w : prev))
            }
        }
        updateSize()
        const ro = new ResizeObserver(updateSize)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const reactId = useId()
    const pathId = `tp-${reactId.replace(/[:]/g, "")}-path`

    const w = containerWidth > 0 ? containerWidth : 1200
    const h = typeof height === "number" ? height : parseFloat(String(height || 160)) || 160

    // Construct repeated text unit
    const safeText = text && text.length > 0 ? text : "SKILLPATH"
    const gapStr = " ".repeat(Math.max(1, Math.round(gap ?? 1)))
    const unitText = safeText + gapStr + (separator ?? "•") + gapStr

    // Estimated unit width fallback
    const estUnitWidth = Math.max(10, unitText.length * (fontSizePx * 0.65 + letterSpacingPx))
    const unitWidth = measuredUnitWidth && measuredUnitWidth > 0 ? measuredUnitWidth : estUnitWidth

    // Measure exact unit width using hidden text element
    useLayoutEffect(() => {
        const el = measureRef.current
        if (!el) return
        try {
            const len = el.getComputedTextLength()
            if (len && len > 0) {
                setMeasuredUnitWidth(len)
            }
        } catch {
            // Fallback to estUnitWidth if measurement fails
        }
    }, [unitText, fontSize, letterSpacing, fontFamily, fontWeight])

    // Generate smooth continuous sine wave path
    const cy = h / 2
    const amplitude = Math.max(10, Math.min(waveHeight / 2, h / 2 - fontSizePx))
    const ctrlAmp = amplitude * (4 / 3)
    const halfCyclesVisible = Math.max(1, Math.round(waveFrequency * 2))
    const halfWidth = w / halfCyclesVisible
    const overflow = Math.max(400, w * 0.5)

    const leftSteps = Math.ceil(overflow / halfWidth) + 1
    const rightSteps = Math.ceil(overflow / halfWidth) + 1
    const totalSteps = halfCyclesVisible + leftSteps + rightSteps
    const xStart = -leftSteps * halfWidth
    const startSign = leftSteps % 2 === 0 ? -1 : 1

    let d = `M ${xStart},${cy}`
    for (let i = 0; i < totalSteps; i++) {
        const xa = xStart + i * halfWidth
        const xb = xStart + (i + 1) * halfWidth
        const peakY = cy + (i % 2 === 0 ? startSign * ctrlAmp : -startSign * ctrlAmp)
        d += ` C ${xa + halfWidth / 3},${peakY} ${xb - halfWidth / 3},${peakY} ${xb},${cy}`
    }

    // Produce generous text repetition (60 repeats) ensuring NO end of string is ever reached
    const repeatCount = Math.max(40, Math.ceil((totalSteps * halfWidth * 2) / unitWidth) + 10)
    const repeatedText = unitText.repeat(repeatCount)

    // Animation Ref Loop for 60fps continuous infinite scrolling
    const offsetRef = useRef(0)
    const lastTRef = useRef<number | null>(null)

    useLayoutEffect(() => {
        const textPathEl = textPathRef.current
        if (!textPathEl) return

        let rafId: number
        lastTRef.current = null

        const animate = (t: number) => {
            if (lastTRef.current === null) lastTRef.current = t
            const dt = Math.min((t - lastTRef.current) / 1000, 1 / 30)
            lastTRef.current = t

            const speedPps = Math.max(0, speed) * 4
            const dir = reversed ? 1 : -1
            const currentUnit = unitWidth > 0 ? unitWidth : estUnitWidth

            let nextOffset = offsetRef.current + dir * speedPps * dt
            nextOffset = ((nextOffset % currentUnit) + currentUnit) % currentUnit
            offsetRef.current = nextOffset

            textPathEl.setAttribute("startOffset", `${nextOffset}px`)

            rafId = requestAnimationFrame(animate)
        }

        rafId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(rafId)
    }, [speed, reversed, unitWidth, estUnitWidth])

    const resolveDim = (v: string | number | undefined, fallback: string): string => {
        if (v == null) return fallback
        if (typeof v === "number") return `${v}px`
        return v
    }

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                position: "relative",
                width: resolveDim(width, "100%"),
                height: resolveDim(height, "160px"),
                overflow: "hidden",
                background: "transparent",
                ...style,
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${w} ${h}`}
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                }}
            >
                <defs>
                    <path
                        ref={pathDefRef}
                        id={pathId}
                        d={d}
                        fill="none"
                    />
                </defs>

                {/* Hidden text element for exact unit length measurement */}
                <text
                    ref={measureRef}
                    x={0}
                    y={-9999}
                    style={{
                        fontSize,
                        letterSpacing,
                        fontFamily,
                        fontWeight,
                        fontStyle,
                        visibility: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    {unitText}
                </text>

                {/* Visible Animated Wave Text */}
                <text
                    fill={textColor}
                    style={{
                        fontSize,
                        letterSpacing,
                        fontFamily,
                        fontWeight,
                        fontStyle,
                    }}
                >
                    <textPath
                        ref={textPathRef}
                        href={`#${pathId}`}
                        xlinkHref={`#${pathId}`}
                    >
                        {repeatedText}
                    </textPath>
                </text>
            </svg>
        </div>
    )
}

export default TextPath
