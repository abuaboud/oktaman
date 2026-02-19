import { useNavigate } from "react-router-dom";
import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { KanbanColumnProps } from "./types";
import { DraggableSessionCard } from "./session-card";
import { MutableRefObject } from "react";

export function KanbanColumn({ title, description, count, sessions, color, icon: Icon, status, disableDrop = false, disableDrag = false, lastDroppedIdRef }: KanbanColumnProps & { disableDrop?: boolean; disableDrag?: boolean; lastDroppedIdRef: MutableRefObject<string | null> }) {
  const navigate = useNavigate();
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    disabled: disableDrop,
  });

  const handleSessionClick = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };

  return (
    <div className="flex flex-col h-full flex-1">
      {/* Column Header */}
      <div className="px-4 py-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", color)} />
          <h3 className="text-sm font-medium">{title}</h3>
          <span className="text-xs text-muted-foreground ml-auto">{count}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto p-3 space-y-2 transition-colors",
          isOver && "bg-accent/20"
        )}
      >
        {sessions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground text-center px-4">
            No sessions here yet
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sessions.map((session) => (
              <DraggableSessionCard
                key={session.id}
                session={session}
                onClick={() => handleSessionClick(session.id)}
                icon={Icon}
                iconColor={color}
                disableDrag={disableDrag}
                lastDroppedIdRef={lastDroppedIdRef}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
