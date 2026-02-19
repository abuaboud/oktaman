import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatusBadgeProps {
  className?: string;
}

export const ConnectionStatusBadge = ({
  className,
}: ConnectionStatusBadgeProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded border px-2 py-1 text-xs whitespace-nowrap flex-shrink-0",
        "text-emerald-700 bg-emerald-50 border-emerald-200",
        className
      )}
    >
      <CircleCheck className="h-3 w-3" />
      <span>Connected</span>
    </div>
  );
};
