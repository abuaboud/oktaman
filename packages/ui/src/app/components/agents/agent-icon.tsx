import { ImageWithColorBackground } from "@/components/ui/image-with-background"
import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { AGENT_COLORS, AgentColorName } from "@oktaman/shared"

interface AgentIconProps {
  color: string
  isCollapsed?: boolean
}

export function AgentIcon({ color, isCollapsed = false }: AgentIconProps) {
  const coloredSvgDataUrl = useMemo(() => {
    // Create the SVG with the agent's color
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"
     role="img"
     preserveAspectRatio="xMidYMid meet"
     viewBox="20 13.5 180 180">

  <path fill="${AGENT_COLORS[color as AgentColorName]}"
        d="M20 98.5h20v30H20zm160 0h20v30h-20zM40 43.5h140v100h-20v20h-40v-20h-20v20H60v-20H40z"/>

  <path fill="#312E81"
        d="M80 78.5h20v20H80zm60 0h20v20h-20z"/>

  <path fill="#E0E7FF"
        d="M80 78.5h8v8h-8zm60 0h8v8h-8z"/>

  <path fill="none"
        stroke="#312E81"
        stroke-linecap="round"
        stroke-width="4"
        d="M105 113.5q15 8 30 0"/>
</svg>`
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }, [color])

  return (
    <ImageWithColorBackground
      src={coloredSvgDataUrl}
      alt="Agent icon"
      backgroundColor={`color-mix(in srgb, ${AGENT_COLORS[color as AgentColorName]} 5%, transparent 80%)`}
      className={cn(
        "rounded",
        isCollapsed ? "!size-8" : "!size-7"
      )}
      imgClassName={cn(
        isCollapsed ? "px-1.5" : "px-1"
      )}
      style={
        isCollapsed
          ? { width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }
          : { width: '28px', height: '28px', minWidth: '28px', minHeight: '28px' }
      }
    />
  )
}
