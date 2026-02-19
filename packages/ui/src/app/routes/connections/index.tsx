import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import { Header } from "@/app/components/header";
import { connectionHooks, connectionCollection } from "@/lib/hooks/connection-hooks";
import { ComposioToolkitIcon } from "@/app/components/chat/prompt-input/ask-question-input/composio-toolkit-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plug, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDeleteDialog } from "@/components/custom/confirm-delete-dialog";
import { ConnectionStatusBadge } from "./connection-status-badge";

const ConnectionsPage = () => {
  const { data: connections } = connectionHooks.useAll();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);

  const handleDeleteClick = (slug: string) => {
    setConnectionToDelete(slug);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (connectionToDelete) {
      connectionCollection.delete([connectionToDelete]);
      setDeleteDialogOpen(false);
      setConnectionToDelete(null);
    }
  };

  return (
    <SidebarProvider className="h-screen" defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full overflow-hidden bg-sidebar">
        <div className="flex-1 flex flex-col pl-2 pr-4 pt-4 pb-2 overflow-hidden">
          <div className="flex flex-col h-full bg-background rounded-xl shadow-sm border overflow-hidden">
            <Header title="Connections" />
            <div className="flex-1 overflow-auto p-6">
              <div className="container mx-auto">
                {!connections || connections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="text-muted-foreground mb-4">
                      <Plug className="mx-auto h-12 w-12 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
                      <p className="text-sm">
                        Connect your apps and services to enable agents and integrations
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {connections.map((connection) => (
                      <Card key={connection.slug}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <ComposioToolkitIcon
                              slug={connection.slug}
                              type="toolkit"
                              className="size-10"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium truncate">
                                  {connection.name}
                                </h3>
                                <ConnectionStatusBadge />
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {connection.slug}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => handleDeleteClick(connection.slug)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Connection"
        description="Are you sure you want to delete this connection? This may affect any agents using this connection."
      />
    </SidebarProvider>
  );
};

export default ConnectionsPage;
