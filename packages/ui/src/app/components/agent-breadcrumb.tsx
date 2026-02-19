import { agentsHooks } from "@/lib/hooks/agent-hooks";
import { AgentIcon } from "./agents/agent-icon";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface AgentBreadcrumbProps {
    agentId: string;
    title: string;
}

export const AgentBreadcrumb: React.FC<AgentBreadcrumbProps> = ({ agentId, title }) => {
    const { data: agent } = agentsHooks.useById(agentId);

    if (!agent) {
        return <span className="text-sm font-medium">{title}</span>;
    }

    const agentPageUrl = `/agents/${agentId}`;

    return (
        <div className="flex items-center gap-2">
            <Link
                to={agentPageUrl}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
                <AgentIcon color={agent.color} />
                <span className="text-sm font-medium">{agent.name}</span>
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
        </div>
    );
};
