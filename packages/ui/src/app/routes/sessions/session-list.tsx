import { cn } from "@/lib/utils";
import { SessionMetadata, SessionSource } from "@oktaman/shared";
import { TruncatedText } from "@/app/components/truncated-text";
import { SessionStatusDropdown } from "./session-status-dropdown";
import { agentsHooks } from "@/lib/hooks/agent-hooks";
import { AgentIcon } from "@/app/components/agents/agent-icon";
import { Send, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SessionListProps {
  sessions: SessionMetadata[] | null | undefined;
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

const SessionItem = ({
  session,
  selectedSessionId,
  onSelectSession,
  agents,
}: {
  session: SessionMetadata;
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  agents: Array<{ id: string; color: string }> | undefined;
}) => {
  const agent = session.agentId && agents ? agents.find(a => a.id === session.agentId) : null;
  const agentColor = agent?.color || 'indigo'; 

  return (
    <div
      key={session.id}
      onClick={() => onSelectSession(session.id)}
      className={cn(
        "group w-full text-left p-2 rounded-lg mb-1 transition-colors hover:bg-accent min-w-0 max-w-full overflow-hidden cursor-pointer",
        selectedSessionId === session.id && "bg-accent"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-shrink-0 flex items-center">
          <AgentIcon color={agentColor} />
        </div>
        <div className="flex-1 min-w-0">
          <TruncatedText
            text={session.title}
            className="text-sm"
          />
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {session.isTest && (
            <Badge variant="outline" className="h-5 px-1.5 text-xs flex items-center gap-1 bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300">
              <FlaskConical className="h-3 w-3" />
              Test
            </Badge>
          )}
          {session.source === SessionSource.TELEGRAM ? (
            <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : (
            session.status && session.source !== SessionSource.MAIN && (
              <SessionStatusDropdown
                sessionId={session.id}
                status={session.status}
                iconOnly
                interactive={false}
                showBackground={false}
                iconSize="md"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};


export const SessionList = ({
  sessions,
  selectedSessionId,
  onSelectSession,
}: SessionListProps) => {
  const { data: agents } = agentsHooks.useAll();

  return (
    <div className="w-60 border-r flex flex-col">
      <div className="p-2 overflow-y-auto flex-1">
        {sessions && sessions.length > 0 ? (
          <>
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                selectedSessionId={selectedSessionId}
                onSelectSession={onSelectSession}
                agents={agents}
              />
            ))}
          </>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No sessions yet
          </div>
        )}
      </div>
    </div>
  );
};
