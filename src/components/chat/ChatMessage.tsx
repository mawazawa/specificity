import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AgentType } from "@/types/spec";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { MessageSquare, Search, Vote, FileText, User } from "lucide-react";
import { mentorProfiles } from "@/types/mentor";

interface ChatMessageProps {
  agent: AgentType | 'user';
  message: string;
  timestamp: string;
  type: 'question' | 'answer' | 'vote' | 'research' | 'spec' | 'user';
  onAvatarClick?: (agent: AgentType) => void;
}

const agentAvatars: Record<AgentType, string> = {
  elon: '/src/assets/elon-musk.png',
  steve: '/src/assets/steve-jobs.png',
  oprah: '/src/assets/oprah.png',
  zaha: '/src/assets/agent-placeholder.png',
  jony: '/src/assets/jony-ive.png',
  bartlett: '/src/assets/steven-bartlett.png',
  amal: '/src/assets/amal-clooney.png',
};

export const ChatMessage = ({ 
  agent, 
  message, 
  timestamp, 
  type,
  onAvatarClick 
}: ChatMessageProps) => {
  const isUser = agent === 'user';
  const profile = !isUser ? mentorProfiles[agent as AgentType] : null;
  
  const getTypeIcon = () => {
    switch (type) {
      case 'question': return <MessageSquare className="w-3 h-3" />;
      case 'research': return <Search className="w-3 h-3" />;
      case 'vote': return <Vote className="w-3 h-3" />;
      case 'spec': return <FileText className="w-3 h-3" />;
      case 'user': return <User className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  const getTypeBadge = () => {
    const badges = {
      question: { label: 'Question', variant: 'default' as const },
      research: { label: 'Research', variant: 'secondary' as const },
      answer: { label: 'Answer', variant: 'default' as const },
      vote: { label: 'Vote', variant: 'outline' as const },
      spec: { label: 'Spec', variant: 'default' as const },
      user: { label: 'You', variant: 'default' as const },
    };
    return badges[type] || { label: 'Message', variant: 'default' as const };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
    >
      {/* Avatar */}
      <div 
        className={`shrink-0 ${!isUser && 'cursor-pointer'}`}
        onClick={() => !isUser && onAvatarClick?.(agent as AgentType)}
      >
        <Avatar className={`w-14 h-14 ring-2 ${isUser ? 'ring-primary/30' : 'ring-primary/20'} shadow-lg hover:ring-primary/50 transition-all`}>
          <AvatarImage 
            src={isUser ? undefined : agentAvatars[agent as AgentType]} 
            alt={isUser ? 'You' : profile?.name} 
          />
          <AvatarFallback className={`text-sm font-bold bg-gradient-to-br ${isUser ? 'from-primary/40 to-primary/20' : profile?.gradient}`}>
            {isUser ? 'U' : profile?.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Bubble */}
      <div className={`flex-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-center gap-2 mb-1">
          {!isUser && (
            <span className="text-xs font-semibold text-foreground">
              {profile?.name}
            </span>
          )}
          <Badge 
            variant={getTypeBadge().variant}
            className="text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1"
          >
            {getTypeIcon()}
            {getTypeBadge().label}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <Card className={`p-4 ${
          isUser 
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
            : 'bg-card/80 backdrop-blur-sm border-border/30'
        } rounded-2xl ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
          <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p className="text-sm leading-relaxed mb-2 last:mb-0" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                em: ({ node, ...props }) => <em className="italic" {...props} />,
                code: ({ node, inline, ...props }: any) => 
                  inline ? (
                    <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${isUser ? 'bg-primary-foreground/20' : 'bg-primary/10'}`} {...props} />
                  ) : (
                    <code className={`block p-2 rounded-lg text-xs font-mono my-2 ${isUser ? 'bg-primary-foreground/20' : 'bg-secondary/30'}`} {...props} />
                  ),
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
