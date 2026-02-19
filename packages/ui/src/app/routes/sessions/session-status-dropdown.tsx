import { CircleDot, CircleDotDashed, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentSessionStatus } from "@oktaman/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStatusConfig } from "./session-status";
import { sessionCollection } from "@/lib/hooks/session-hooks";

interface SessionStatusDropdownProps {
  sessionId: string;
  status: AgentSessionStatus;
  iconOnly?: boolean;
  interactive?: boolean;
  showBackground?: boolean;
  iconSize?: "sm" | "md" | "lg";
}

export const SessionStatusDropdown = ({
  sessionId,
  status,
  iconOnly = false,
  interactive = true,
  showBackground = true,
  iconSize = "sm",
}: SessionStatusDropdownProps) => {
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  const isRunning = status === AgentSessionStatus.RUNNING;

  const iconSizeClass = iconSize === "lg" ? "h-5 w-5" : iconSize === "md" ? "h-4 w-4" : "h-3 w-3";

  const handleStatusChange = (newStatus: AgentSessionStatus) => {
    sessionCollection.update(sessionId, (draft) => {
      draft.status = newStatus;
    });
  };

  // Extract just the text color class when background is not shown
  const textColorClass = statusConfig.className.split(' ').find(cls => cls.startsWith('text-'));

  const badge = (
    <div
      className={cn(
        "inline-flex items-center gap-1 flex-shrink-0",
        showBackground && "rounded border",
        iconOnly ? "p-1" : "px-2 py-1 text-xs whitespace-nowrap",
        showBackground ? statusConfig.className : textColorClass
      )}
    >
      <StatusIcon className={iconSizeClass} />
      {!iconOnly && <span>{statusConfig.label}</span>}
    </div>
  );

  // Interactive dropdown trigger
  const trigger = (
    <DropdownMenuTrigger
      disabled={isRunning}
      className={cn(
        "inline-flex items-center gap-1 flex-shrink-0 transition-opacity",
        showBackground && "rounded border",
        iconOnly ? "p-1" : "px-2 py-1 text-xs whitespace-nowrap",
        isRunning ? "cursor-not-allowed opacity-60" : "hover:opacity-80",
        showBackground ? statusConfig.className : textColorClass
      )}
    >
      <StatusIcon className={iconSizeClass} />
      {!iconOnly && <span>{statusConfig.label}</span>}
      {!iconOnly && !isRunning && <ChevronDown className="h-3 w-3" />}
    </DropdownMenuTrigger>
  );

  // If not interactive, show badge with optional tooltip
  if (!interactive) {
    if (iconOnly) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {badge}
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">{statusConfig.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return badge;
  }

  // Interactive dropdown
  return (
    <DropdownMenu>
      {iconOnly ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {trigger}
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">{statusConfig.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        trigger
      )}
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem
          onClick={() => handleStatusChange(AgentSessionStatus.NEEDS_YOU)}
          className="text-xs py-1.5"
        >
          <CircleDotDashed className="h-3 w-3 mr-2 text-orange-700" />
          Needs you
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusChange(AgentSessionStatus.CLOSED)}
          className="text-xs py-1.5"
        >
          <CircleDot className="h-3 w-3 mr-2 text-emerald-700" />
          Done
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
