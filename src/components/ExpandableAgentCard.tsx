"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { AgentPerspective, AgentType } from "@/types/spec";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Copy, Download, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const agentConfig: Record<AgentType, { name: string; role: string; avatar: string; color: string }> = {
  elon: { name: "Elon", role: "Scale & Innovation", avatar: "🚀", color: "from-purple-500/20 to-blue-500/20" },
  steve: { name: "Steve", role: "Product Vision", avatar: "🍎", color: "from-gray-400/20 to-gray-600/20" },
  oprah: { name: "Oprah", role: "User Impact", avatar: "💫", color: "from-amber-500/20 to-orange-500/20" },
  zaha: { name: "Zaha", role: "Design Excellence", avatar: "✨", color: "from-pink-500/20 to-rose-500/20" },
  jony: { name: "Jony", role: "Design Simplicity", avatar: "⚪", color: "from-slate-400/20 to-zinc-500/20" },
  bartlett: { name: "Steve B.", role: "Business Strategy", avatar: "📈", color: "from-green-500/20 to-emerald-500/20" },
  amal: { name: "Amal", role: "Legal & Ethics", avatar: "⚖️", color: "from-blue-400/20 to-cyan-500/20" },
};

const vendorLogos: Record<string, string> = {
  supabase: "🗄️",
  lovable: "💜",
  nextjs: "▲",
  groq: "⚡",
  openai: "🤖",
  react: "⚛️",
  typescript: "📘",
  tailwind: "🎨",
};

interface ExpandableAgentCardProps {
  perspectives: AgentPerspective[];
}

export const ExpandableAgentCard = ({ perspectives }: ExpandableAgentCardProps) => {
  const [active, setActive] = useState<AgentPerspective | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  const extractBulletPoints = (text: string): string[] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.slice(0, 3).map(line => line.replace(/^[-*]\s*/, ''));
  };

  const addVendorLogos = (text: string): string => {
    let result = text;
    Object.entries(vendorLogos).forEach(([name, logo]) => {
      const regex = new RegExp(`\\b${name}\\b`, 'gi');
      result = result.replace(regex, `${logo} ${name}`);
    });
    return result;
  };

  const handleCopyMarkdown = (perspective: AgentPerspective) => {
    navigator.clipboard.writeText(perspective.response);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownloadMarkdown = (perspective: AgentPerspective) => {
    const config = agentConfig[perspective.agent];
    const blob = new Blob([perspective.response], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name}-output.md`;
    a.click();
    toast({ title: "Downloaded as Markdown" });
  };

  const handleDownloadPDF = (perspective: AgentPerspective) => {
    const config = agentConfig[perspective.agent];
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(perspective.response, 180);
    doc.text(lines, 15, 15);
    doc.save(`${config.name}-output.pdf`);
    toast({ title: "Downloaded as PDF" });
  };

  const handleDownloadPNG = async (perspective: AgentPerspective) => {
    const config = agentConfig[perspective.agent];
    const element = document.getElementById(`agent-modal-${perspective.agent}`);
    if (!element) return;
    
    const canvas = await html2canvas(element, { backgroundColor: "#ffffff" });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name}-output.png`;
    a.click();
    toast({ title: "Downloaded as PNG" });
  };

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm h-full w-full z-50"
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 grid place-items-center z-[100] p-4">
            <motion.button
              key={`button-${active.agent}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="flex absolute top-4 right-4 items-center justify-center bg-white rounded-full h-10 w-10 shadow-lg hover:scale-110 transition-transform"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            
            <motion.div
              layoutId={`card-${active.agent}-${id}`}
              ref={ref}
              id={`agent-modal-${active.agent}`}
              className="w-full max-w-3xl h-full md:h-fit md:max-h-[90%] flex flex-col bg-background border border-border/30 rounded-fluid overflow-hidden shadow-2xl"
            >
              <div className={`bg-gradient-to-br ${agentConfig[active.agent].color} p-8`}>
                <div className="flex items-center gap-4">
                  <span className="text-6xl">{agentConfig[active.agent].avatar}</span>
                  <div>
                    <motion.h3
                      layoutId={`title-${active.agent}-${id}`}
                      className="text-2xl font-light text-foreground/90"
                    >
                      {agentConfig[active.agent].name}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.agent}-${id}`}
                      className="text-sm text-foreground/60 uppercase tracking-widest"
                    >
                      {agentConfig[active.agent].role}
                    </motion.p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-8">
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="prose prose-invert prose-sm max-w-none"
                >
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="text-sm text-foreground/70 leading-relaxed mb-4" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 mb-4" {...props} />,
                      li: ({ node, ...props }) => <li className="text-sm text-foreground/70" {...props} />,
                      code: ({ node, inline, ...props }: { node?: unknown; inline?: boolean; [key: string]: unknown }) =>
                        inline ? (
                          <code className="bg-secondary/30 px-2 py-1 rounded-lg text-accent font-mono text-xs" {...props} />
                        ) : (
                          <code className="block bg-secondary/20 p-4 rounded-fluid text-foreground/70 font-mono text-xs overflow-x-auto" {...props} />
                        ),
                    }}
                  >
                    {addVendorLogos(active.response)}
                  </ReactMarkdown>
                </motion.div>
              </div>

              <div className="flex flex-wrap gap-2 p-6 border-t border-border/10 bg-secondary/10">
                <Button variant="outline" size="sm" onClick={() => handleCopyMarkdown(active)}>
                  <Copy className="w-3 h-3" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownloadMarkdown(active)}>
                  <FileText className="w-3 h-3" /> MD
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(active)}>
                  <Download className="w-3 h-3" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownloadPNG(active)}>
                  <ImageIcon className="w-3 h-3" /> PNG
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {perspectives.map((perspective) => {
          const config = agentConfig[perspective.agent];
          const bulletPoints = extractBulletPoints(perspective.response);
          
          return (
            <motion.div
              layoutId={`card-${perspective.agent}-${id}`}
              key={`card-${perspective.agent}-${id}`}
              onClick={() => setActive(perspective)}
              className={`p-6 bg-gradient-to-br ${config.color} backdrop-blur-xl border border-border/20 rounded-fluid hover:shadow-2xl transition-all duration-300 cursor-pointer group`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{config.avatar}</span>
                <div>
                  <motion.h3
                    layoutId={`title-${perspective.agent}-${id}`}
                    className="text-base font-light text-foreground/90"
                  >
                    {config.name}
                  </motion.h3>
                  <motion.p
                    layoutId={`description-${perspective.agent}-${id}`}
                    className="text-xs text-foreground/50 uppercase tracking-widest"
                  >
                    {config.role}
                  </motion.p>
                </div>
              </div>
              
              <ul className="space-y-2">
                {bulletPoints.map((point, idx) => (
                  <li key={idx} className="text-sm text-foreground/70 flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>{addVendorLogos(point)}</span>
                  </li>
                ))}
              </ul>
              
              <motion.button
                layoutId={`button-${perspective.agent}-${id}`}
                className="mt-4 px-4 py-2 text-xs rounded-full font-light bg-secondary/30 hover:bg-accent hover:text-white transition-all uppercase tracking-widest group-hover:translate-x-1 duration-300"
              >
                View Full Analysis
              </motion.button>
            </motion.div>
          );
        })}
      </ul>
    </>
  );
};

const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};
