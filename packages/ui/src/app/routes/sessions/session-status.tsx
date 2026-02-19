import { Loader, CircleDot, CircleDotDashed } from "lucide-react";
import { AgentSessionStatus } from "@oktaman/shared";
import type { LucideIcon } from "lucide-react";

export interface StatusConfig {
  icon: LucideIcon;
  label: string;
  className: string;
}

export const getStatusConfig = (status: AgentSessionStatus): StatusConfig => {
  switch (status) {
    case AgentSessionStatus.RUNNING:
      return {
        icon: Loader,
        label: "Running",
        className: "text-blue-700 bg-blue-50 border-blue-200"
      };
    case AgentSessionStatus.NEEDS_YOU:
      return {
        icon: CircleDotDashed,
        label: "Needs you",
        className: "text-orange-700 bg-orange-50 border-orange-200"
      };
    case AgentSessionStatus.CLOSED:
      return {
        icon: CircleDot,
        label: "Done",
        className: "text-emerald-700 bg-emerald-50 border-emerald-200"
      };
    default:
      return {
        icon: CircleDot,
        label: "Unknown",
        className: "text-gray-600 bg-gray-50 border-gray-200"
      };
  }
};
