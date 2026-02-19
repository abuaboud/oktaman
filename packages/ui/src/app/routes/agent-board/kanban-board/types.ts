import { SessionMetadata, AgentSessionStatus } from "@oktaman/shared";
import { LucideIcon } from "lucide-react";

export interface AgentBoardKanbanProps {
  agentId: string;
  sessionsByStatus: {
    needsYou: SessionMetadata[];
    inProgress: SessionMetadata[];
    completed: SessionMetadata[];
  };
  onSessionStatusChange: (sessionId: string, newStatus: AgentSessionStatus) => void;
}

export interface KanbanColumnProps {
  title: string;
  description: string;
  count: number;
  sessions: SessionMetadata[];
  color: string;
  icon: LucideIcon;
  status: AgentSessionStatus;
}

export interface SessionCardProps {
  session: SessionMetadata;
  onClick: () => void;
  icon: LucideIcon;
  iconColor: string;
  isDragging?: boolean;
}
