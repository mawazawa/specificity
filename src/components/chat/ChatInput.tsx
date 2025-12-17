import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Pause, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  onSend: (message: string) => void;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  isProcessing: boolean;
  placeholder?: string;
  mode?: 'round' | 'direct';
}

export const ChatInput = ({ 
  onSend, 
  isPaused, 
  onPause, 
  onResume,
  isProcessing,
  placeholder = "Add your thoughts or guidance...",
  mode = 'round'
}: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-background/80 backdrop-blur-xl border-t border-border/20 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-3">
        {mode === 'direct' ? (
          <div className="relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[60px] pr-16 resize-none bg-card/50 backdrop-blur-sm border-border/30 rounded-2xl text-sm focus:ring-2 focus:ring-primary/30"
              disabled={isProcessing}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isProcessing}
              size="icon"
              className="absolute right-2 bottom-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {isPaused ? (
              <motion.div
                key="paused"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="min-h-[100px] resize-none bg-card/50 backdrop-blur-sm border-border/30 rounded-2xl text-sm focus:ring-2 focus:ring-primary/30"
                  disabled={isProcessing}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || isProcessing}
                    className="flex-1 h-12 rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 shadow-lg shadow-primary/20 font-semibold"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send & Resume
                  </Button>
                  <Button
                    onClick={onResume}
                    variant="outline"
                    className="h-12 px-6 rounded-full border-border/30"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Button
                  onClick={onPause}
                  variant="outline"
                  className="w-full h-12 rounded-full border-border/30 hover:bg-primary/5"
                  disabled={!isProcessing}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause to Add Comment
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
