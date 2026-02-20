"use client"

import { useNavigate, useLocation } from "react-router-dom"
import { useRef } from "react"
import { SquarePenIcon, type SquarePenIconHandle } from "@/components/ui/square-pen"
import { MessageSquareIcon, type MessageSquareIconHandle } from "@/components/ui/message-square"
import { PlugZapIcon } from "@/components/ui/plug-zap"
import { Settings, Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { NavAgents } from "./nav-agents"
import { useTheme } from "./theme-provider"


export function AppSidebar({
  ...props
}: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const newChatIconRef = useRef<SquarePenIconHandle>(null);
  const sessionsIconRef = useRef<MessageSquareIconHandle>(null);

  const isSessionsActive = location.pathname.includes("/sessions");
  const isSettingsActive = location.pathname.includes("/settings");
  const isConnectionsActive = location.pathname.includes("/connections");
  const isNewChatActive = !isSessionsActive && !isSettingsActive && location.pathname === "/";

  const handleNewChat = () => {
    navigate("/")
  }

  return (

    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SidebarHeader className="pb-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              collapsedPadding="none"
              className="px-1.5 md:px-1 group-data-[collapsible=icon]:justify-center"
            >
              <img
                src="/logo.png"
                alt="OktaMan Logo"
                className="object-contain size-7"
              />
              <span className="font-semibold group-data-[collapsible=icon]:hidden">OktaMan</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="New Chat"
                  onClick={handleNewChat}
                  isActive={isNewChatActive}
                  className="px-2.5 md:px-2"
                  onMouseEnter={() => newChatIconRef.current?.startAnimation()}
                  onMouseLeave={() => newChatIconRef.current?.stopAnimation()}
                >
                  <SquarePenIcon ref={newChatIconRef} size={16} className="size-4" />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Sessions"
                  onClick={() => navigate("/sessions")}
                  isActive={isSessionsActive}
                  className="px-2.5 md:px-2"
                  onMouseEnter={() => sessionsIconRef.current?.startAnimation()}
                  onMouseLeave={() => sessionsIconRef.current?.stopAnimation()}
                >
                  <MessageSquareIcon ref={sessionsIconRef} size={16} className="size-4" />
                  <span>Sessions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavAgents />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Connections"
              onClick={() => navigate("/connections")}
              isActive={isConnectionsActive}
              className="px-2.5 md:px-2"
            >
              <PlugZapIcon size={16} className="size-4" />
              <span>Connections</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              onClick={() => navigate("/settings")}
              isActive={isSettingsActive}
              className="px-2.5 md:px-2"
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2.5 md:px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
              <span className="text-sm text-sidebar-foreground group-data-[collapsible=icon]:hidden">Theme</span>
              <div className="flex gap-0.5">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      "rounded p-1.5 transition-colors",
                      theme === t
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    )}
                  >
                    {t === "light" && <Sun className="size-4" />}
                    {t === "dark" && <Moon className="size-4" />}
                    {t === "system" && <Monitor className="size-4" />}
                  </button>
                ))}
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> { }
