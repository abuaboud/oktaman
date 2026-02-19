import { Filter } from "lucide-react";
import { AgentSessionStatus } from "@oktaman/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getStatusConfig } from "./session-status";
import { cn } from "@/lib/utils";

interface SessionsFilterProps {
  selectedStatuses: AgentSessionStatus[];
  onStatusesChange: (statuses: AgentSessionStatus[]) => void;
}

const ALL_STATUSES = [
  AgentSessionStatus.RUNNING,
  AgentSessionStatus.NEEDS_YOU,
  AgentSessionStatus.CLOSED,
];

export const SessionsFilter = ({
  selectedStatuses,
  onStatusesChange,
}: SessionsFilterProps) => {
  const handleToggleStatus = (status: AgentSessionStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  const isFiltered = selectedStatuses.length > 0 && selectedStatuses.length < ALL_STATUSES.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            isFiltered && "text-blue-700"
          )}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">Filter by status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ALL_STATUSES.map((status) => {
          const config = getStatusConfig(status);
          const StatusIcon = config.icon;
          const isChecked = selectedStatuses.includes(status);

          return (
            <DropdownMenuCheckboxItem
              key={status}
              checked={isChecked}
              onCheckedChange={() => handleToggleStatus(status)}
              onSelect={(e) => e.preventDefault()}
              className="text-xs py-2"
            >
              <StatusIcon className={cn("h-3 w-3 mr-2", config.className.split(' ')[0])} />
              {config.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
