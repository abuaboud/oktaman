import { AgentSessionStatus } from "@oktaman/shared";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";
import { Loader, CircleDot, CircleDotDashed } from "lucide-react";
import { LayoutGroup } from "motion/react";
import { AgentBoardKanbanProps } from "./types";
import { KanbanColumn } from "./kanban-column";
import { SessionCard } from "./session-card";
import { getSessionDisplayProps } from "./utils";

export function AgentBoardKanban({ agentId, sessionsByStatus, onSessionStatusChange }: AgentBoardKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastDroppedIdRef = useRef<string | null>(null);

  // Clear the lastDroppedId after the render cycle completes
  // so the flag is available during the re-render but not after
  useEffect(() => {
    if (lastDroppedIdRef.current) {
      const id = lastDroppedIdRef.current;
      requestAnimationFrame(() => {
        if (lastDroppedIdRef.current === id) {
          lastDroppedIdRef.current = null;
        }
      });
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum drag distance before drag starts
      },
    })
  );

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const sessionId = active.id as string;
    const newStatus = over.id as AgentSessionStatus;
    const session = active.data.current?.session;

    // Only allow dropping into Needs You or Completed (not Running)
    if (newStatus === AgentSessionStatus.RUNNING) {
      setActiveId(null);
      return;
    }

    // Don't allow dragging out of Running
    if (session?.status === AgentSessionStatus.RUNNING) {
      setActiveId(null);
      return;
    }

    // Only update if the status actually changed
    if (session && session.status !== newStatus) {
      lastDroppedIdRef.current = sessionId;
      onSessionStatusChange(sessionId, newStatus);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Find the active session for the drag overlay
  const activeSession = activeId
    ? [...sessionsByStatus.needsYou, ...sessionsByStatus.inProgress, ...sessionsByStatus.completed].find(
        (s) => s.id === activeId
      )
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <LayoutGroup id={agentId}>
        <div className="flex h-full">
          <KanbanColumn
            title="Needs You"
            description="The agent is asking for your help"
            count={sessionsByStatus.needsYou.length}
            sessions={sessionsByStatus.needsYou}
            color="text-orange-700"
            icon={CircleDotDashed}
            status={AgentSessionStatus.NEEDS_YOU}
            lastDroppedIdRef={lastDroppedIdRef}
          />
          <div className="w-px bg-border" />
          <KanbanColumn
            title="Running"
            description="The agent is working on the task"
            count={sessionsByStatus.inProgress.length}
            sessions={sessionsByStatus.inProgress}
            color="text-blue-700"
            icon={Loader}
            status={AgentSessionStatus.RUNNING}
            disableDrop={true}
            disableDrag={true}
            lastDroppedIdRef={lastDroppedIdRef}
          />
          <div className="w-px bg-border" />
          <KanbanColumn
            title="Completed"
            description="No further action required"
            count={sessionsByStatus.completed.length}
            sessions={sessionsByStatus.completed}
            color="text-emerald-700"
            icon={CircleDot}
            status={AgentSessionStatus.CLOSED}
            lastDroppedIdRef={lastDroppedIdRef}
          />
        </div>
      </LayoutGroup>

      <DragOverlay>
        {activeSession ? (
          <div className="cursor-grabbing">
            <SessionCard
              session={activeSession}
              onClick={() => {}}
              icon={getSessionDisplayProps(activeSession.status).icon}
              iconColor={getSessionDisplayProps(activeSession.status).color}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
