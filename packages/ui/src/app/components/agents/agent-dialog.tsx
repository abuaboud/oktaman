"use client"

import { Play, Pause, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Agent, AgentStatus } from "@oktaman/shared"
import { AgentTriggerIcon } from "@/components/custom/agent-trigger-icon"
import { OktaManMarkdown } from "@/components/custom/markdown"
import { agentCollection } from "@/lib/hooks/agent-hooks"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface AgentDialogProps {
  agent: Agent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentDialog({
  agent,
  open,
  onOpenChange,
}: AgentDialogProps) {
  const navigate = useNavigate()

  if (!agent) return null

  const handleToggleStatus = () => {
    const newStatus =
      agent.status === AgentStatus.ENABLED
        ? AgentStatus.DISABLED
        : AgentStatus.ENABLED

    agentCollection.update(
      agent.id,
      (draft) => {
        draft.status = newStatus
      }
    )
    toast.success(`Agent ${newStatus === AgentStatus.ENABLED ? 'resumed' : 'paused'}`)
  }

  const handleDelete = () => {
    onOpenChange(false)
    agentCollection.delete(agent.id)
    toast.success('Agent deleted successfully')
    navigate(`/sessions`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" showClose={false}>
        <DialogHeader>
          <div className="flex gap-4 items-start">
            <AgentTriggerIcon
              trigger={agent.trigger}
              className="shrink-0 size-16"
            />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-left text-base">{agent.name}</DialogTitle>
                <Badge variant={agent.status === AgentStatus.ENABLED ? "default" : "secondary"}>
                  {agent.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{agent.description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 py-4">
          {agent.instructions && (
            <div>
              <h4 className="text-sm font-medium mb-2">Instructions</h4>
              <div className="text-sm">
                <OktaManMarkdown markdown={agent.instructions} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 sm:mr-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleStatus}
            >
              {agent.status === AgentStatus.ENABLED ? (
                <>
                  <Pause className="size-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  Resume
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
