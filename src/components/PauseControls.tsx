import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pause, Play, MessageSquare } from "lucide-react";

interface PauseControlsProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: (comment?: string) => void;
}

export const PauseControls = ({ isPaused, onPause, onResume }: PauseControlsProps) => {
  const [comment, setComment] = useState("");

  const handleResume = () => {
    onResume(comment || undefined);
    setComment("");
  };

  return (
    <Card className="p-6 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-4 h-4 text-foreground/60" />
          <h3 className="text-xs font-light uppercase tracking-widest text-foreground/80">
            Session Control
          </h3>
        </div>

        {isPaused ? (
          <div className="space-y-4">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add guidance or corrections for the agents..."
              className="min-h-[100px] bg-background/30 border-border/20 text-sm resize-none rounded-fluid"
            />
            <Button
              onClick={handleResume}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-fluid"
            >
              <Play className="w-4 h-4 mr-2" />
              Resume Session
            </Button>
          </div>
        ) : (
          <Button
            onClick={onPause}
            variant="outline"
            className="w-full border-border/20 rounded-fluid"
          >
            <Pause className="w-4 h-4 mr-2" />
            Pause to Add Comment
          </Button>
        )}
      </div>
    </Card>
  );
};
