"use client"

import { useNavigate } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { agentsHooks } from "@/lib/hooks/agent-hooks"
import { AgentIcon } from "./agents/agent-icon"

export function NavAgents() {
  const navigate = useNavigate()
  const { data: agents } = agentsHooks.useAll()

  const handleAgentClick = (agentId: string) => {
    navigate(`/agents/${agentId}`)
  }

  const hasAgents = agents && agents.length > 0

  return (
    <>
      {/* Expanded view */}
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Background Agents</SidebarGroupLabel>
        <SidebarMenu>
          {hasAgents ? (
            agents.map((agent) => (
              <SidebarMenuItem key={agent.id}>
                <SidebarMenuButton
                  onClick={() => handleAgentClick(agent.id)}
                  title={agent.name}
                >
                  <AgentIcon color={agent.color} />
                  <span className="truncate">{agent.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-xs text-sidebar-foreground/50">
              Chat with OktaMan to create one!
            </div>
          )}
        </SidebarMenu>
      </SidebarGroup>

      {/* Collapsed view - show only icons */}
      {hasAgents && (
        <SidebarGroup className="hidden group-data-[collapsible=icon]:block">
          <SidebarMenu>
            {agents.map((agent) => (
              <SidebarMenuItem key={agent.id}>
                <SidebarMenuButton
                  onClick={() => handleAgentClick(agent.id)}
                  title={agent.name}
                  tooltip={agent.name}
                  collapsedPadding="none"
                  className="!gap-0 justify-center items-center"
                >
                  <AgentIcon color={agent.color} isCollapsed={true} />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </>
  )
}
