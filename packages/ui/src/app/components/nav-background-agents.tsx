"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar"

export function NavBackgroundAgents() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Background Agents</SidebarGroupLabel>
      <SidebarMenu>
        <div className="px-2 py-1.5 text-xs text-sidebar-foreground/50">
          Chat with OktaMan to create one!
        </div>
      </SidebarMenu>
    </SidebarGroup>
  )
}
