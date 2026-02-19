import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Smile, Meh, Frown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

interface FeedbackDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
}

export function FeedbackDialog({
    open,
    onOpenChange,
    title = "Leave Feedback",
    description = "We'd love to hear what went well or how we can improve the product experience."
}: FeedbackDialogProps) {
    const [feedback, setFeedback] = useState("");
    const [selectedMood, setSelectedMood] = useState<"happy" | "neutral" | "sad" | null>(null);

    const submitFeedbackMutation = useMutation({
        mutationFn: async (data: { feedback: string; mood: string | null }) => {
            const response = await fetch("https://cloud.activepieces.com/api/v1/webhooks/TZ3bdglJNRYS3BwU8bn5U", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to submit feedback");
            }

            return response.json();
        },
        onSuccess: () => {
            // Reset form and close dialog
            setFeedback("");
            setSelectedMood(null);
            onOpenChange(false);
        },
    });

    const handleSubmit = () => {
        submitFeedbackMutation.mutate({
            feedback,
            mood: selectedMood
        });
    };

    const MoodIcon = ({
        type,
        icon: Icon,
        selected
    }: {
        type: "happy" | "neutral" | "sad",
        icon: React.ElementType,
        selected: boolean
    }) => (
        <button
            type="button"
            onClick={() => setSelectedMood(type)}
            className={cn(
                "p-2 rounded-full transition-colors",
                selected ? "bg-gray-200" : "hover:bg-gray-100"
            )}
        >
            <Icon className={cn(
                "h-5 w-5",
                selected ? "text-primary" : "text-gray-500"
            )} />
        </button>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader className="">
                    <DialogTitle>
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Your feedback"
                    className="resize-none min-h-[80px]"
                />

                <div className="flex items-center justify-start gap-2 mt-2">
                    <MoodIcon
                        type="sad"
                        icon={Frown}
                        selected={selectedMood === "sad"}
                    />
                    <MoodIcon
                        type="neutral"
                        icon={Meh}
                        selected={selectedMood === "neutral"}
                    />
                    <MoodIcon
                        type="happy"
                        icon={Smile}
                        selected={selectedMood === "happy"}
                    />
                </div>

                <DialogFooter className="flex justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitFeedbackMutation.isPending}
                        size="sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitFeedbackMutation.isPending}
                        size="sm"
                    >
                        {submitFeedbackMutation.isPending ? "Submitting..." : "Submit"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 