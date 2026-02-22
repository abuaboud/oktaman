import { useParams } from "react-router-dom";
import { Header } from "../../components/header";
import { ChatWithInput } from "@/app/components/chat/chat-with-input";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import { isNil } from "@oktaman/shared";
import { sessionHooks } from "@/lib/hooks/session-hooks";

const HomePage = () => {
    const { sessionId } = useParams<{ sessionId?: string }>();
    const { data: currentSession, isLoading: isLoadingSession } = sessionHooks.useSession(sessionId ?? null);
    const { data: conversationData, isLoading: isLoadingConversation } = sessionHooks.useConversation(sessionId ?? null);

    const headerTitle = !isNil(currentSession) ? currentSession.title : "New Chat";

    return (
        <SidebarProvider className="h-screen" defaultOpen={true}>
            <AppSidebar />
            <SidebarInset className="flex flex-col h-full overflow-hidden bg-sidebar">
                <div className="flex-1 flex flex-col pl-2 pr-2 pt-4 pb-2 overflow-hidden">
                    <div className="flex flex-col h-full bg-background rounded-xl shadow-sm border overflow-hidden">
                        {!isLoadingSession && <Header title={headerTitle} cost={currentSession?.cost} session={currentSession} />}
                        <ChatWithInput
                            sessionId={sessionId ?? null}
                            session={currentSession}
                            conversationData={conversationData}
                            isLoadingSession={isLoadingSession}
                            isLoadingConversation={isLoadingConversation}
                        />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default HomePage;
