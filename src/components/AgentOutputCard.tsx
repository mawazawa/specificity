import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Copy, Download, FileText, Image as ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AgentPerspective, AgentType } from "@/types/spec";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import steveJobsAvatar from "@/assets/steve-jobs.png";
import oprahAvatar from "@/assets/oprah.png";
import stevenBartlettAvatar from "@/assets/steven-bartlett.png";
import jonyIveAvatar from "@/assets/jony-ive.png";
import amalClooneyAvatar from "@/assets/amal-clooney.png";
import elonMuskAvatar from "@/assets/elon-musk.png";

const agentConfig: Record<AgentType, { name: string; role: string; avatar: string; color: string }> = {
  elon: { name: "Elon", role: "Scale & Innovation", avatar: elonMuskAvatar, color: "from-purple-500/20 to-blue-500/20" },
  steve: { name: "Steve", role: "Product Vision", avatar: steveJobsAvatar, color: "from-gray-400/20 to-gray-600/20" },
  oprah: { name: "Oprah", role: "User Impact", avatar: oprahAvatar, color: "from-amber-500/20 to-orange-500/20" },
  zaha: { name: "Zaha", role: "Design Excellence", avatar: "✨", color: "from-pink-500/20 to-rose-500/20" },
  jony: { name: "Jony", role: "Design Simplicity", avatar: jonyIveAvatar, color: "from-slate-400/20 to-zinc-500/20" },
  bartlett: { name: "Steve B.", role: "Business Strategy", avatar: stevenBartlettAvatar, color: "from-green-500/20 to-emerald-500/20" },
  amal: { name: "Amal", role: "Legal & Ethics", avatar: amalClooneyAvatar, color: "from-blue-400/20 to-cyan-500/20" },
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

interface AgentOutputCardProps {
  perspective: AgentPerspective;
}

export const AgentOutputCard = ({ perspective }: AgentOutputCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = agentConfig[perspective.agent];

  const extractBulletPoints = (text: string): string[] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.slice(0, 3).map(line => line.replace(/^[-*]\s*/, ''));
  };

  const bulletPoints = extractBulletPoints(perspective.response);

  const addVendorLogos = (text: string): string => {
    let result = text;
    Object.entries(vendorLogos).forEach(([name, logo]) => {
      const regex = new RegExp(`\\b${name}\\b`, 'gi');
      result = result.replace(regex, `${logo} ${name}`);
    });
    return result;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(perspective.response);
    toast({ title: "Copied to clipboard" });
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([perspective.response], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name}-output.md`;
    a.click();
    toast({ title: "Downloaded as Markdown" });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(perspective.response, 180);
    doc.text(lines, 15, 15);
    doc.save(`${config.name}-output.pdf`);
    toast({ title: "Downloaded as PDF" });
  };

  const handleDownloadPNG = async () => {
    const element = document.getElementById(`agent-${perspective.agent}`);
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
    <Card 
      id={`agent-${perspective.agent}`}
      className={`p-6 bg-gradient-to-br ${config.color} backdrop-blur-xl border-border/20 rounded-fluid hover:shadow-lg transition-all duration-300`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {typeof config.avatar === 'string' && config.avatar.startsWith('/') || config.avatar.includes('src/assets') ? (
              <img src={config.avatar} alt={config.name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <span className="text-3xl">{config.avatar}</span>
            )}
            <div>
              <h3 className="text-base font-light text-foreground/90">{config.name}</h3>
              <p className="text-xs text-foreground/50">{config.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-white/5"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Bullet Points Preview */}
        {!isExpanded && (
          <ul className="space-y-2">
            {bulletPoints.map((point, idx) => (
              <li key={idx} className="text-sm text-foreground/70 flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span>{addVendorLogos(point)}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Full Reasoning */}
        {isExpanded && (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-xl font-semibold text-primary mb-4 mt-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg font-semibold text-foreground/90 mt-6 mb-3" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base font-medium text-foreground/80 mt-4 mb-2" {...props} />,
                p: ({ node, ...props }) => <p className="text-sm text-foreground/70 leading-relaxed mb-4" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 mb-4" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-2 mb-4" {...props} />,
                li: ({ node, ...props }) => <li className="text-sm text-foreground/70 leading-relaxed" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-semibold text-foreground/90" {...props} />,
                code: ({ node, inline, ...props }: any) => 
                  inline ? (
                    <code className="bg-primary/10 px-2 py-0.5 rounded text-primary font-mono text-xs" {...props} />
                  ) : (
                    <code className="block bg-secondary/20 p-4 rounded-lg text-foreground/70 font-mono text-xs overflow-x-auto" {...props} />
                  ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-2 border-primary/40 pl-4 italic text-foreground/60 my-3" {...props} />
                ),
              }}
            >
              {addVendorLogos(perspective.response)}
            </ReactMarkdown>
          </div>
        )}

        {/* Export Options */}
        {isExpanded && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border/10">
            <Button variant="outline" size="sm" onClick={handleCopyMarkdown}>
              <Copy className="w-3 h-3" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadMarkdown}>
              <FileText className="w-3 h-3" /> MD
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-3 h-3" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPNG}>
              <ImageIcon className="w-3 h-3" /> PNG
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
