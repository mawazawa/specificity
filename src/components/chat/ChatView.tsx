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
  onChatWithAgent?: (agentId: string, message: string) => Promise<boolean>;
  currentStage?: string;
  onProceedToGeneration?: () => void;
}

export const ChatView = ({ 
  entries, 
  isPaused, 
  onPause, 
  onResume,
  isProcessing,
  onChatWithAgent,
  currentStage,
  onProceedToGeneration
}: ChatViewProps) => {
  const [selectedMentor, setSelectedMentor] = useState<AgentType | null>(null);
  const [activeChatAgent, setActiveChatAgent] = useState<AgentType | null>(null);

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
    if (activeChatAgent && onChatWithAgent) {
      onChatWithAgent(activeChatAgent, message);
    } else {
      onResume(message);
    }
  };

  const handleAvatarClick = (agent: AgentType) => {
    setSelectedMentor(agent);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)]">
      {/* Active Chat Banner */}
      {activeChatAgent && (
        <div className="bg-primary/10 border-b border-primary/20 p-2 px-4 flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-sm font-medium text-primary">
            Talking to {mentorProfiles[activeChatAgent]?.name}
          </span>
          <button 
            onClick={() => setActiveChatAgent(null)}
            className="text-xs hover:underline opacity-70 hover:opacity-100"
          >
            Exit 1:1 Chat
          </button>
        </div>
      )}

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
          
          {/* Refinement Generate Button */}
          {currentStage === 'refinement' && !isProcessing && onProceedToGeneration && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center pt-6 pb-2"
            >
              <Button 
                onClick={onProceedToGeneration}
                size="lg"
                className="rounded-full bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all"
              >
                Start Expert Panel Analysis
              </Button>
            </motion.div>
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
        placeholder={activeChatAgent ? `Message ${mentorProfiles[activeChatAgent]?.name}...` : undefined}
        mode={activeChatAgent ? 'direct' : 'round'}
      />

      {/* Mentor Contact Card */}
      {selectedMentor && (
        <MentorContactCard
          profile={mentorProfiles[selectedMentor]}
          isOpen={!!selectedMentor}
          onClose={() => setSelectedMentor(null)}
          onStartChat={(agent) => {
            setActiveChatAgent(agent);
            setSelectedMentor(null);
          }}
        />
      )}
    </div>
  );
};
