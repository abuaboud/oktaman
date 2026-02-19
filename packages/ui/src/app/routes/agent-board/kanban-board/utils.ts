import { AgentSessionStatus } from "@oktaman/shared";
import { Loader, CircleDot, CircleDotDashed } from "lucide-react";

export const getSessionDisplayProps = (status: AgentSessionStatus) => {
  switch (status) {
    case AgentSessionStatus.NEEDS_YOU:
      return { icon: CircleDotDashed, color: "text-orange-700" };
    case AgentSessionStatus.RUNNING:
      return { icon: Loader, color: "text-blue-700" };
    case AgentSessionStatus.CLOSED:
      return { icon: CircleDot, color: "text-emerald-700" };
    default:
      return { icon: CircleDot, color: "text-gray-700" };
  }
};
