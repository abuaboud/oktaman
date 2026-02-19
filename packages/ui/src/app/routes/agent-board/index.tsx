import { useParams, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";
import { agentsHooks, agentCollection, useTestAgent } from "@/lib/hooks/agent-hooks";
import { sessionHooks, sessionCollection } from "@/lib/hooks/session-hooks";
import { AgentSessionStatus, AgentStatus } from "@oktaman/shared";
import { useMemo, useState } from "react";
import { AgentBoardKanban } from "./kanban-board/index";
import { Edit, Settings, PlayCircle, PauseCircle, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AgentIcon } from "@/app/components/agents/agent-icon";
import { cn } from "@/lib/utils";
import { ModelSelector, MODELS, AIModel } from "@/app/components/chat/prompt-input/model-selector";
import { toast } from "sonner";
import { AgentTriggerIcon } from "@/components/custom/agent-trigger-icon";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { OktaManMarkdown } from "@/components/custom/markdown";
import EditableText from "@/components/custom/editable-text";

const AgentBoardPage = () => {
  const { agentId } = useParams<{ agentId?: string }>();
  const navigate = useNavigate();
  const { data: agent } = agentsHooks.useById(agentId!);
  const { data: allSessions } = sessionHooks.useAll();
  const testAgentMutation = useTestAgent();
  const [isInstructionsDialogOpen, setIsInstructionsDialogOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [isTriggerArgsDialogOpen, setIsTriggerArgsDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    const currentModel = MODELS.find(m => m.id === agent?.modelId) || MODELS[0];
    return currentModel;
  });

  // Update selected model when agent changes
  const currentModel = MODELS.find(m => m.id === agent?.modelId) || MODELS[0];
  if (selectedModel.id !== currentModel.id && agent) {
    setSelectedModel(currentModel);
  }

  const handleModelChange = (model: AIModel) => {
    setSelectedModel(model);
    agentCollection.update(agent!.id, (draft) => {
      draft.modelId = model.id;
    });
    toast.success('Model updated successfully');
  };

  const handleOpenInstructionsDialog = () => {
    setInstructions(agent?.instructions || "");
    setIsInstructionsDialogOpen(true);
  };

  const handleSaveInstructions = () => {
    agentCollection.update(agent!.id, (draft) => {
      draft.instructions = instructions;
    });
    setIsInstructionsDialogOpen(false);
    toast.success('Instructions updated successfully');
  };

  const handleToggleStatus = () => {
    const newStatus =
      agent!.status === AgentStatus.ENABLED
        ? AgentStatus.DISABLED
        : AgentStatus.ENABLED;

    agentCollection.update(agent!.id, (draft) => {
      draft.status = newStatus;
    });
    toast.success(`Agent ${newStatus === AgentStatus.ENABLED ? 'resumed' : 'paused'}`);
  };

  const handleTest = async () => {
    try {
      const { sessionId } = await testAgentMutation.mutateAsync({ agentId: agent!.id });
      toast.success('Test agent triggered successfully');
      navigate(`/sessions/${sessionId}`);
    } catch (error) {
      toast.error('Failed to test agent');
      console.error(error);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this agent?')) {
      agentCollection.delete(agent!.id);
      toast.success('Agent deleted successfully');
      navigate(`/sessions`);
    }
  };

  const handleNameChange = (newName: string) => {
    agentCollection.update(agent!.id, (draft) => {
      draft.name = newName;
    });
    toast.success('Agent name updated successfully');
  };

  // Filter sessions for this agent
  const agentSessions = useMemo(() => {
    if (!allSessions || !agentId) return [];
    return allSessions.filter(session => session.agentId === agentId);
  }, [allSessions, agentId]);

  // Group sessions by status
  const sessionsByStatus = useMemo(() => {
    const needsYou = agentSessions.filter(s => s.status === AgentSessionStatus.NEEDS_YOU);
    const inProgress = agentSessions.filter(s => s.status === AgentSessionStatus.RUNNING);
    const completed = agentSessions.filter(s => s.status === AgentSessionStatus.CLOSED);

    return { needsYou, inProgress, completed };
  }, [agentSessions]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    return agentSessions.reduce((sum, session) => sum + (session.cost || 0), 0);
  }, [agentSessions]);

  const handleSessionStatusChange = (sessionId: string, newStatus: AgentSessionStatus) => {
    sessionCollection.update(sessionId, (draft) => {
      draft.status = newStatus;
    });
  };

  if (!agent) {
    return (
      <SidebarProvider className="h-screen" defaultOpen={true}>
        <AppSidebar />
        <SidebarInset className="flex h-full overflow-hidden bg-sidebar">
          <div className="flex flex-col flex-1 pr-4 pt-2 pb-2 overflow-hidden">
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider className="h-screen" defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex h-full overflow-hidden bg-sidebar">
        <div className="flex flex-col flex-1 pl-2 pr-4 pt-2 pb-2 overflow-hidden">
          <div className="flex flex-col h-full bg-background rounded-xl shadow-sm border overflow-hidden">
            {/* Header */}
            <div className="border-b">
              <div className="flex items-center gap-3 px-4 py-2.5">
                <SidebarTrigger className="h-4 w-4" />
                <AgentIcon color={agent.color} />
                <EditableText
                  value={agent.name}
                  className="text-sm font-medium"
                  readonly={false}
                  onValueChange={handleNameChange}
                  isEditing={isEditingName}
                  setIsEditing={setIsEditingName}
                />
                <div className="flex-1" />
                <div
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                    agent.status === AgentStatus.ENABLED
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-gray-600 bg-gray-50 border-gray-200"
                  )}
                >
                  {agent.status === AgentStatus.ENABLED ? "Active" : "Inactive"}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={handleToggleStatus} className="cursor-pointer">
                      {agent.status === AgentStatus.ENABLED ? (
                        <>
                          <PauseCircle className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Resume
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleTest} className="cursor-pointer">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Test
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Kanban Board */}
              <div className="flex-1 overflow-auto">
                <AgentBoardKanban
                  agentId={agentId!}
                  sessionsByStatus={sessionsByStatus}
                  onSessionStatusChange={handleSessionStatusChange}
                />
              </div>

              {/* Agent Details Panel */}
              <div className="w-80 border-l bg-muted/30 overflow-auto">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="px-4 py-3 border-b">
                    <h3 className="text-sm font-semibold">Agent Details</h3>
                  </div>

                  {/* Description */}
                  <div className="px-4 py-3 border-b">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {agent.description || "No description available"}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="px-4 py-3 border-b space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Details</h4>

                    {/* Trigger */}
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-muted/20 -mx-2 px-2 py-2 rounded-md transition-colors"
                      onClick={() => setIsTriggerArgsDialogOpen(true)}
                    >
                      <AgentTriggerIcon
                        trigger={agent.trigger}
                        className="size-10 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Trigger</p>
                        <p className="text-sm font-medium capitalize">{agent.trigger.type}</p>
                      </div>
                    </div>

                    {/* Total Cost */}
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-muted-foreground w-18 shrink-0">Total Cost</p>
                      <p className="text-xs flex-1">${totalCost.toFixed(4)}</p>
                    </div>
                    {/* AI Model */}
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-muted-foreground w-18 shrink-0">AI Model</p>
                      <div className="flex-1">
                        <ModelSelector
                          selectedModel={selectedModel}
                          onModelChange={handleModelChange}
                        />
                      </div>
                    </div>


                  </div>

                  {/* Instructions */}
                  <div className="px-4 py-3 border-b group cursor-pointer hover:bg-muted/20 transition-colors" onClick={handleOpenInstructionsDialog}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Instructions</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-70 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInstructionsDialog();
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed line-clamp-4 prose prose-sm max-w-none">
                      <OktaManMarkdown markdown={agent.instructions || "*No instructions available*"} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      <Dialog open={isInstructionsDialogOpen} onOpenChange={setIsInstructionsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl">Edit Instructions</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Define how this agent should behave and respond. You can use markdown formatting.
            </p>
          </DialogHeader>
          <div className="flex-1 py-4">
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter agent instructions in markdown..."
              className="resize-none font-mono text-sm h-[450px] w-full"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsInstructionsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveInstructions}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTriggerArgsDialogOpen} onOpenChange={setIsTriggerArgsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl flex items-center gap-2">
              <AgentTriggerIcon trigger={agent.trigger} className="size-8" />
              Trigger Configuration
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              View the configuration for this agent's trigger
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Trigger Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Trigger Type
              </label>
              <div className="px-3 py-2 bg-muted/30 rounded-md">
                <p className="text-sm font-medium capitalize">{agent.trigger.type}</p>
              </div>
            </div>

            {/* Trigger ID */}
            {agent.trigger.triggerId && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Trigger ID
                </label>
                <div className="px-3 py-2 bg-muted/30 rounded-md">
                  <p className="text-sm font-mono">{agent.trigger.triggerId}</p>
                </div>
              </div>
            )}

            {/* Slug */}
            {agent.trigger.slug && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Slug
                </label>
                <div className="px-3 py-2 bg-muted/30 rounded-md">
                  <p className="text-sm font-mono">{agent.trigger.slug}</p>
                </div>
              </div>
            )}

            {/* Cron */}
            {agent.trigger.cron && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Cron Schedule
                </label>
                <div className="px-3 py-2 bg-muted/30 rounded-md">
                  <p className="text-sm font-mono">{agent.trigger.cron}</p>
                </div>
              </div>
            )}

            {/* Schedule ID */}
            {agent.trigger.scheduleId && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Schedule ID
                </label>
                <div className="px-3 py-2 bg-muted/30 rounded-md">
                  <p className="text-sm font-mono">{agent.trigger.scheduleId}</p>
                </div>
              </div>
            )}

            {/* Arguments */}
            {agent.trigger.args && Object.keys(agent.trigger.args).length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Arguments
                </label>
                <div className="px-3 py-2 bg-muted/30 rounded-md">
                  <pre className="text-xs font-mono overflow-x-auto">
                    {JSON.stringify(agent.trigger.args, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* No args message */}
            {(!agent.trigger.args || Object.keys(agent.trigger.args).length === 0) &&
             !agent.trigger.triggerId &&
             !agent.trigger.slug &&
             !agent.trigger.cron &&
             !agent.trigger.scheduleId && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No additional configuration available</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsTriggerArgsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AgentBoardPage;
