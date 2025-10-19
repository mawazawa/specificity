import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { AgentType } from "@/types/spec";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MentorContactCard } from "../mentor/MentorContactCard";
import { mentorProfiles } from "@/types/mentor";

export interface ChatEntry {
  agent: AgentType | 'user';
  message: string;
  timestamp: string;
  type: 'question' | 'answer' | 'vote' | 'research' | 'spec' | 'user';
}

interface ChatViewProps {
  entries: ChatEntry[];
  isPaused: boolean;
  onPause: () => void;
  onResume: (message?: string) => void;
  isProcessing: boolean;
}

export const ChatView = ({ 
  entries, 
  isPaused, 
  onPause, 
  onResume,
  isProcessing 
}: ChatViewProps) => {
  const [selectedMentor, setSelectedMentor] = useState<AgentType | null>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive - using a small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      const viewport = document.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [entries]);

  const handleSend = (message: string) => {
    onResume(message);
  };

  const handleAvatarClick = (agent: AgentType) => {
    setSelectedMentor(agent);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)]">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 md:px-6">
        <div className="max-w-4xl mx-auto py-6 space-y-2">
          {entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center h-full min-h-[300px]"
            >
              <div className="text-center space-y-3 max-w-md">
                <div className="text-4xl mb-4">💭</div>
                <h3 className="text-lg font-semibold text-foreground/80">
                  Advisory Panel Ready
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your mentor panel is standing by to help you build something amazing. Start a conversation to begin.
                </p>
              </div>
            </motion.div>
          ) : (
            entries.map((entry, index) => (
              <ChatMessage
                key={`${entry.agent}-${entry.timestamp}-${index}`}
                agent={entry.agent}
                message={entry.message}
                timestamp={entry.timestamp}
                type={entry.type}
                onAvatarClick={handleAvatarClick}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <ChatInput
        onSend={handleSend}
        isPaused={isPaused}
        onPause={onPause}
        onResume={() => onResume()}
        isProcessing={isProcessing}
      />

      {/* Mentor Contact Card */}
      {selectedMentor && (
        <MentorContactCard
          profile={mentorProfiles[selectedMentor]}
          isOpen={!!selectedMentor}
          onClose={() => setSelectedMentor(null)}
          onStartChat={(agent) => {
            // TODO: Implement 1:1 chat
            console.log('Start 1:1 chat with', agent);
            setSelectedMentor(null);
          }}
        />
      )}
    </div>
  );
};
