import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { MessageCircle, Search, Vote, FileText, Zap, Users, LucideIcon } from "lucide-react";

interface FlowStage {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  x: number;
  y: number;
  connections: string[];
}

const stages: FlowStage[] = [
  {
    id: "roundtable",
    title: "Roundtable",
    icon: Users,
    description: "Advisors discuss and influence each other",
    x: 50,
    y: 20,
    connections: ["research", "synthesis"]
  },
  {
    id: "research",
    title: "Research",
    icon: Search,
    description: "Real-time validation from Exa",
    x: 25,
    y: 50,
    connections: ["synthesis"]
  },
  {
    id: "synthesis",
    title: "Synthesis",
    icon: MessageCircle,
    description: "Collaborative refinement loop",
    x: 75,
    y: 50,
    connections: ["voting"]
  },
  {
    id: "voting",
    title: "Consensus",
    icon: Vote,
    description: "Panel approval with feedback",
    x: 50,
    y: 80,
    connections: ["spec"]
  },
  {
    id: "spec",
    title: "Specification",
    icon: FileText,
    description: "Production-ready output",
    x: 50,
    y: 110,
    connections: []
  }
];

export const CollaborativeFlowDiagram = () => {
  const [activeStage, setActiveStage] = useState(0);
  const [activeConnections, setActiveConnections] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((prev) => {
        const next = (prev + 1) % stages.length;
        const currentStage = stages[prev];
        setActiveConnections(currentStage.connections);
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getConnectionPath = (from: FlowStage, to: FlowStage) => {
    const x1 = from.x;
    const y1 = from.y;
    const x2 = to.x;
    const y2 = to.y;
    
    const midY = (y1 + y2) / 2;
    
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  };

  return (
    <div className="relative w-full" style={{ paddingBottom: "120%" }}>
      {/* SVG for connections */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 120"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="flow-grad-active" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#18CCFC" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#6344F5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#AE48FF" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="flow-grad-inactive" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--border))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--border))" stopOpacity="0.2" />
          </linearGradient>
          
          {/* Animated gradient for flowing effect */}
          <linearGradient id="flow-grad-animated" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#18CCFC" stopOpacity="0">
              <animate attributeName="stop-opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#6344F5" stopOpacity="0">
              <animate attributeName="stop-opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" begin="0.3s" />
            </stop>
            <stop offset="100%" stopColor="#AE48FF" stopOpacity="0">
              <animate attributeName="stop-opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" begin="0.6s" />
            </stop>
          </linearGradient>
        </defs>

        {/* Draw all connections */}
        {stages.map((from) =>
          from.connections.map((toId) => {
            const to = stages.find((s) => s.id === toId);
            if (!to) return null;

            const isActive = activeConnections.includes(toId) && stages[activeStage]?.id === from.id;
            
            return (
              <g key={`${from.id}-${toId}`}>
                {/* Background static line */}
                <path
                  d={getConnectionPath(from, to)}
                  stroke="url(#flow-grad-inactive)"
                  strokeWidth="0.5"
                  fill="none"
                />
                
                {/* Active animated line */}
                {isActive && (
                  <motion.path
                    d={getConnectionPath(from, to)}
                    stroke="url(#flow-grad-animated)"
                    strokeWidth="1"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                )}
              </g>
            );
          })
        )}

        {/* Influence loops - showing advisors influencing each other */}
        <motion.path
          d="M 45 22 Q 35 25, 40 30 Q 45 35, 50 32"
          stroke="url(#flow-grad-animated)"
          strokeWidth="0.5"
          fill="none"
          strokeDasharray="2,2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.path
          d="M 55 22 Q 65 25, 60 30 Q 55 35, 50 32"
          stroke="url(#flow-grad-animated)"
          strokeWidth="0.5"
          fill="none"
          strokeDasharray="2,2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
        />
      </svg>

      {/* Stage nodes */}
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isActive = activeStage === index;
        
        return (
          <motion.div
            key={stage.id}
            className="absolute"
            style={{
              left: `${stage.x}%`,
              top: `${stage.y}%`,
              transform: "translate(-50%, -50%)"
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
          >
            {/* Glow effect when active */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(99, 68, 245, 0.4) 0%, transparent 70%)",
                    width: "200%",
                    height: "200%",
                    left: "-50%",
                    top: "-50%",
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </AnimatePresence>

            {/* Node container */}
            <div className="relative">
              {/* Main node */}
              <motion.div
                className={`
                  w-16 h-16 md:w-20 md:h-20 rounded-full 
                  flex items-center justify-center
                  border-2 backdrop-blur-sm
                  transition-all duration-500
                  ${isActive 
                    ? "bg-gradient-to-br from-primary/20 to-accent/20 border-primary shadow-2xl shadow-primary/30 scale-110" 
                    : "bg-card/40 border-border/20"
                  }
                `}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <Icon 
                  className={`w-8 h-8 transition-colors duration-500 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </motion.div>

              {/* Label */}
              <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                <div className={`text-xs md:text-sm font-medium transition-colors duration-500 ${
                  isActive ? "text-foreground" : "text-muted-foreground/70"
                }`}>
                  {stage.title}
                </div>
                <div className="text-[10px] text-muted-foreground/50 max-w-[120px] mx-auto">
                  {stage.description}
                </div>
              </div>

              {/* Active indicator pulse */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/50"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Collaboration indicators - small dots showing influence */}
      {activeStage === 0 && (
        <>
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-primary"
            style={{ left: "45%", top: "18%" }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-accent"
            style={{ left: "55%", top: "18%" }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
          />
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-primary"
            style={{ left: "50%", top: "25%" }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.4 }}
          />
        </>
      )}
    </div>
  );
};