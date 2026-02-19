import { SidebarTrigger } from "@/components/ui/sidebar";
import { SessionMetadata } from "@oktaman/shared";
import { AgentBreadcrumb } from "./agent-breadcrumb";

interface HeaderProps {
    title?: string;
    children?: React.ReactNode;
    cost?: number;
    session?: SessionMetadata | null;
}

export const Header: React.FC<HeaderProps> = ({ title, children, cost, session }) => {
    const agentId = session?.agentId;

    const renderTitle = () => {
        // If there's a valid agentId, show agent breadcrumb
        if (agentId && title) {
            return <AgentBreadcrumb agentId={agentId} title={title} />;
        }

        // Otherwise, just show the title
        if (title) {
            return <span className="text-sm font-medium">{title}</span>;
        }

        return null;
    };

    return (
        <div className="w-full border-b">
            <div className="flex justify-between items-center px-4 py-4">
                {/* Left side */}
                <div className="flex items-center gap-3">
                    <SidebarTrigger className="h-4 w-4" />
                    {renderTitle()}
                    {children}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {cost !== undefined && cost > 0 && (
                        <span className="text-sm text-muted-foreground">
                            ${cost.toFixed(4)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
