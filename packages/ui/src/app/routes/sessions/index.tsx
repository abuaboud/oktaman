import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import { sessionHooks, sessionCollection } from "@/lib/hooks/session-hooks";
import { ChatWithInput } from "@/app/components/chat/chat-with-input";
import { SessionList } from "./session-list";
import { SessionStatusDropdown } from "./session-status-dropdown";
import { SessionsFilter } from "./sessions-filter";
import { Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentSessionStatus, SessionSource } from "@oktaman/shared";
import { AgentBreadcrumb } from "@/app/components/agent-breadcrumb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const SessionsPage = () => {
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const { data: sessions } = sessionHooks.useAll();
  const selectedSessionId = urlSessionId || null;
  const { data: selectedSession, isLoading: isLoadingSession } = sessionHooks.useSession(selectedSessionId);
  const { data: conversationData, isLoading: isLoadingConversation } = sessionHooks.useConversation(selectedSessionId);
  const [selectedStatuses, setSelectedStatuses] = useState<AgentSessionStatus[]>([]);

  const filteredSessions = useMemo(() => {
    if (!sessions || selectedStatuses.length === 0) {
      return sessions;
    }
    return sessions.filter((session) => selectedStatuses.includes(session.status));
  }, [sessions, selectedStatuses]);

  useEffect(() => {
    if (selectedSessionId && !isLoadingSession && !selectedSession) {
      navigate(`/sessions`);
    }
  }, [selectedSessionId, isLoadingSession, selectedSession, navigate]);

  const handleSelectSession = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };

  const handleDeleteSession = (sessionId: string) => {
    sessionCollection.delete([sessionId]);
    if (sessionId === selectedSessionId) {
      navigate(`/sessions`);
    }
  };


  return (
    <SidebarProvider className="h-screen" defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex h-full overflow-hidden bg-sidebar">
        <div className="flex flex-col flex-1 pl-2 pr-4 pt-4 pb-2 overflow-hidden">
          <div className="flex flex-col h-full bg-background rounded-xl shadow-sm border overflow-hidden">
            <div className="flex">
              {/* Left header */}
              <div className="w-60 border-r">
                <div className="w-full border-b">
                  <div className="flex justify-between items-center px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <SidebarTrigger className="h-4 w-4" />
                      <span className="text-sm font-medium ml-2">Sessions</span>
                    </div>
                    <SessionsFilter
                      selectedStatuses={selectedStatuses}
                      onStatusesChange={setSelectedStatuses}
                    />
                  </div>
                </div>
              </div>
              {/* Right header */}
              {selectedSessionId && selectedSession && (
                <div className="w-full flex-1 h-full border-b">
                  <div className="flex items-center gap-3 px-4 h-full">
                    {selectedSession.agentId ? (
                      <AgentBreadcrumb
                        agentId={selectedSession.agentId}
                        title={selectedSession.title || "Chat"}
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {selectedSession.title || "Chat"}
                      </span>
                    )}
                    {selectedSession.source === SessionSource.TELEGRAM ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 cursor-help">
                              <Send className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Telegram</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This is a Telegram session and it can only be managed from Telegram</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : selectedSession.source !== SessionSource.MAIN && (
                      <SessionStatusDropdown
                        sessionId={selectedSessionId}
                        status={selectedSession.status}
                      />
                    )}
                    <div className="flex-1" />
                    {selectedSession.cost > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        ${selectedSession.cost.toFixed(4)}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteSession(selectedSessionId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left side - Session list */}
              <SessionList
                sessions={filteredSessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={handleSelectSession}
              />

              {/* Right side - Chat view */}
              <div className="flex-1 flex flex-col">
                <ChatWithInput
                  sessionId={selectedSessionId}
                  session={selectedSession}
                  conversationData={conversationData}
                  isLoadingSession={isLoadingSession}
                  isLoadingConversation={isLoadingConversation}
                  showEmptyStateForNoSession={true}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SessionsPage;
