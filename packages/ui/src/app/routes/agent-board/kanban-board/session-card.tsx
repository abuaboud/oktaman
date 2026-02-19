import { cn } from "@/lib/utils";
import { Clock, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDraggable } from "@dnd-kit/core";
import { motion } from "motion/react";
import { SessionCardProps } from "./types";
import { MutableRefObject, useRef } from "react";

export function SessionCard({ session, onClick, icon: Icon, iconColor, isDragging = false }: SessionCardProps) {
  const messageCount = session.todos?.length || 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg border bg-card text-left cursor-pointer",
        "hover:bg-accent/50 transition-colors",
        "focus:outline-none",
        isDragging && "opacity-30 cursor-grabbing"
      )}
    >
      <div className="space-y-2">
        {/* Title with Icon */}
        <div className="flex items-start gap-2">
          <Icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", iconColor)} />
          <div className="text-sm font-medium line-clamp-2 flex-1">
            {session.title || "Untitled Session"}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(session.created), { addSuffix: true })}</span>
          </div>
          {messageCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{messageCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DraggableSessionCard({ session, onClick, icon, iconColor, disableDrag = false, lastDroppedIdRef }: SessionCardProps & { disableDrag?: boolean; lastDroppedIdRef: MutableRefObject<string | null> }) {
  const wasDragging = useRef(false);

  // Check if this card was just dropped (skip all animation for it)
  const wasJustDropped = lastDroppedIdRef.current === session.id;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session.id,
    data: {
      session,
    },
    disabled: disableDrag,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Track when dragging starts
  if (isDragging && !wasDragging.current) {
    wasDragging.current = true;
  }

  const handleClick = () => {
    // Prevent navigation if we just finished dragging
    if (wasDragging.current) {
      wasDragging.current = false;
      return;
    }
    onClick();
  };

  // For just-dropped cards, render without any motion wrapper to avoid all animations
  if (wasJustDropped) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="touch-none"
      >
        <SessionCard
          session={session}
          onClick={handleClick}
          icon={icon}
          iconColor={iconColor}
          isDragging={isDragging}
        />
      </div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="touch-none"
      layout
      layoutId={session.id}
      initial={false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -100 }}
      transition={{
        layout: { type: "spring", stiffness: 350, damping: 25 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
    >
      <SessionCard
        session={session}
        onClick={handleClick}
        icon={icon}
        iconColor={iconColor}
        isDragging={isDragging}
      />
    </motion.div>
  );
}
