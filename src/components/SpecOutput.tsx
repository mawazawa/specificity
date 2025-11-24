import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, CheckCircle2, Download, Copy, FileType, ThumbsUp, ChevronDown, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import jsPDF from "jspdf";
import { TechStackCard } from "./TechStackCard";
import { TechStackItem } from "@/types/spec";

interface SpecOutputProps {
  spec: string;
  onApprove?: () => void;
  onRefine?: (refinements: string[]) => void;
}

const SUGGESTED_REFINEMENTS = [
  "Add more technical implementation details",
  "Expand security and compliance considerations",
  "Include cost estimates and timeline"
];

export const SpecOutput = ({ spec, onApprove, onRefine }: SpecOutputProps) => {
  const [showRefinements, setShowRefinements] = useState(false);
  const [selectedRefinements, setSelectedRefinements] = useState<string[]>([]);
  const [customRefinement, setCustomRefinement] = useState("");
  const [techStack, setTechStack] = useState<TechStackItem[]>([
    {
      category: "Backend",
      selected: {
        name: "Supabase",
        logo: "https://supabase.com/favicon/favicon-32x32.png",
        rating: 5,
        pros: ["Real-time capabilities", "Built-in auth", "PostgreSQL", "Edge functions"],
        cons: ["Vendor lock-in", "Limited customization"]
      },
      alternatives: [
        {
          name: "Firebase",
          logo: "https://www.gstatic.com/devrel-devsite/prod/v2210deb8920cd4a55bd580441aa58e7853afc04b39a9d9ac4198e1cd7fbe04ef/firebase/images/touchicon-180.png",
          rating: 4,
          pros: ["Easy setup", "Real-time database", "Good documentation"],
          cons: ["NoSQL only", "Expensive at scale"]
        },
        {
          name: "AWS Amplify",
          logo: "https://docs.amplify.aws/assets/logo-dark.svg",
          rating: 4,
          pros: ["AWS ecosystem", "Scalable", "GraphQL support"],
          cons: ["Complex setup", "Steeper learning curve"]
        }
      ]
    },
    {
      category: "AI/ML",
      selected: {
        name: "OpenAI",
        logo: "https://cdn.oaistatic.com/_next/static/media/favicon-32x32.be48395e.png",
        rating: 5,
        pros: ["State-of-the-art models", "Easy API", "Wide capabilities"],
        cons: ["Expensive", "Rate limits", "Data privacy concerns"]
      },
      alternatives: [
        {
          name: "Google Gemini",
          logo: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
          rating: 5,
          pros: ["Multimodal", "Fast", "Cost-effective"],
          cons: ["Newer platform", "Less ecosystem"]
        },
        {
          name: "Anthropic Claude",
          logo: "https://www.anthropic.com/images/icons/apple-touch-icon.png",
          rating: 4,
          pros: ["Constitutional AI", "Safety-focused", "Large context"],
          cons: ["Limited availability", "Higher cost"]
        }
      ]
    }
  ]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    techStack: true,
    dependencies: false,
    risks: false,
    testing: false
  });

  if (!spec) return null;

  const handleTechSelect = (category: string, techName: string) => {
    setTechStack(prev => prev.map(item => {
      if (item.category === category) {
        const newSelected = item.alternatives.find(alt => alt.name === techName);
        if (newSelected) {
          return {
            ...item,
            selected: newSelected,
            alternatives: [item.selected, ...item.alternatives.filter(alt => alt.name !== techName)]
          };
        }
      }
      return item;
    }));
    toast({ 
      title: "Tech Stack Updated", 
      description: `Selected ${techName} for ${category}` 
    });
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(spec);
    toast({ title: "Copied!", description: "Specification copied to clipboard" });
  };

  const downloadMarkdown = () => {
    const blob = new Blob([spec], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `specification-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Specification saved as markdown" });
  };

  const downloadText = () => {
    const blob = new Blob([spec], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `specification-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Specification saved as text" });
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Add header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Technical Specification', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 15;

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Process spec content
      const sections = spec.split('\n');
      doc.setFontSize(10);

      sections.forEach((line) => {
        // Check for page break
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        // Handle headings
        if (line.startsWith('# ')) {
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          const text = line.replace('# ', '');
          doc.text(text, margin, yPosition);
          yPosition += 8;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
        } else if (line.startsWith('## ')) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          const text = line.replace('## ', '');
          doc.text(text, margin, yPosition);
          yPosition += 7;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
        } else if (line.startsWith('### ')) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          const text = line.replace('### ', '');
          doc.text(text, margin, yPosition);
          yPosition += 6;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
        } else if (line.trim()) {
          // Regular text with word wrap
          const cleanLine = line.replace(/[*_`]/g, ''); // Remove markdown formatting
          const lines = doc.splitTextToSize(cleanLine, maxWidth);
          lines.forEach((splitLine: string) => {
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(splitLine, margin, yPosition);
            yPosition += 5;
          });
        } else {
          yPosition += 3; // Empty line spacing
        }
      });

      // Add footer with page numbers
      const totalPages = doc.internal.pages.length - 1; // Subtract 1 for internal page
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(`specification-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({
        title: "PDF Downloaded",
        description: "Specification saved with professional formatting"
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Export Failed",
        description: "Could not generate PDF. Try downloading as Markdown instead.",
        variant: "destructive"
      });
    }
  };

  const handleRefine = () => {
    const allRefinements = [...selectedRefinements];
    if (customRefinement.trim()) {
      allRefinements.push(customRefinement.trim());
    }
    if (allRefinements.length > 0 && onRefine) {
      onRefine(allRefinements);
      setSelectedRefinements([]);
      setCustomRefinement("");
      setShowRefinements(false);
    }
  };

  const toggleRefinement = (refinement: string) => {
    setSelectedRefinements(prev =>
      prev.includes(refinement)
        ? prev.filter(r => r !== refinement)
        : [...prev, refinement]
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-gradient-card backdrop-blur-xl border-border/20 rounded-fluid space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Final Specification
              </h2>
              <p className="text-[10px] text-muted-foreground">Generated by advisory panel</p>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-2">
            <Copy className="w-3 h-3" />
            Copy All
          </Button>
          <Button onClick={downloadMarkdown} variant="outline" size="sm" className="gap-2">
            <Download className="w-3 h-3" />
            Markdown
          </Button>
          <Button onClick={downloadText} variant="outline" size="sm" className="gap-2">
            <FileType className="w-3 h-3" />
            Text
          </Button>
          <Button onClick={downloadPDF} variant="outline" size="sm" className="gap-2">
            <Download className="w-3 h-3" />
            PDF
          </Button>
          <div className="flex-1" />
          <Button onClick={onApprove} variant="default" size="sm" className="gap-2">
            <ThumbsUp className="w-3 h-3" />
            Approve
          </Button>
          <Button 
            onClick={() => setShowRefinements(!showRefinements)} 
            variant="secondary" 
            size="sm"
          >
            Refine Further
          </Button>
        </div>

        {/* Refinement Options */}
        {showRefinements && (
          <Card className="p-4 bg-background/50 border-border/30 space-y-3">
            <h3 className="text-xs font-medium text-foreground/80">Suggested Refinements</h3>
            <div className="space-y-2">
              {SUGGESTED_REFINEMENTS.map((refinement) => (
                <label
                  key={refinement}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedRefinements.includes(refinement)}
                    onChange={() => toggleRefinement(refinement)}
                    className="w-3 h-3 rounded border-border/50"
                  />
                  <span className="text-xs text-foreground/70 group-hover:text-foreground transition-colors">
                    {refinement}
                  </span>
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-xs text-foreground/80">Custom Refinement</label>
              <textarea
                value={customRefinement}
                onChange={(e) => setCustomRefinement(e.target.value)}
                maxLength={1000}
                placeholder="Specify what you'd like to refine..."
                className="w-full min-h-[60px] px-3 py-2 bg-background/50 border border-border/30 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>
            <Button 
              onClick={handleRefine} 
              size="sm" 
              className="w-full"
              disabled={selectedRefinements.length === 0 && !customRefinement.trim()}
            >
              Apply Refinements
            </Button>
          </Card>
        )}

        {/* Spec Content */}
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-primary mb-8 mt-8 tracking-tight border-b border-border/20 pb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-foreground/90 mt-12 mb-6 tracking-tight" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-foreground/80 mt-10 mb-4 tracking-tight" {...props} />,
              h4: ({ node, ...props }) => <h4 className="text-lg font-medium text-foreground/70 mt-8 mb-3" {...props} />,
              p: ({ node, ...props }) => <p className="text-foreground/70 leading-relaxed mb-5 text-sm" {...props} />,
              ul: ({ node, ...props }) => <ul className="space-y-2 mb-6 ml-4 list-disc list-inside" {...props} />,
              ol: ({ node, ...props }) => <ol className="space-y-2 mb-6 ml-4 list-decimal list-inside" {...props} />,
              li: ({ node, ...props }) => <li className="text-foreground/70 text-sm leading-relaxed" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-foreground/90" {...props} />,
              em: ({ node, ...props }) => <em className="italic text-foreground/80" {...props} />,
              code: ({ node, inline, ...props }: any) => 
                inline ? (
                  <code className="bg-primary/10 px-2 py-0.5 rounded text-primary font-mono text-xs border border-primary/20" {...props} />
                ) : (
                  <code className="block bg-secondary/30 p-5 rounded-xl text-foreground/80 font-mono text-xs overflow-x-auto border border-border/20 my-4" {...props} />
                ),
              pre: ({ node, ...props }) => <pre className="my-4 overflow-x-auto" {...props} />,
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-primary/40 pl-6 pr-4 py-3 my-6 bg-primary/5 rounded-r-lg italic text-foreground/70" {...props} />
              ),
              hr: ({ node, ...props }) => <hr className="my-8 border-border/30" {...props} />,
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-6">
                  <table className="w-full border-collapse border border-border/30 rounded-lg" {...props} />
                </div>
              ),
              th: ({ node, ...props }) => <th className="border border-border/30 px-4 py-2 bg-primary/10 text-left text-sm font-semibold text-foreground/90" {...props} />,
              td: ({ node, ...props }) => <td className="border border-border/30 px-4 py-2 text-sm text-foreground/70" {...props} />,
              a: ({ node, ...props }) => <a className="text-primary hover:text-primary/80 underline transition-colors" {...props} />,
            }}
          >
            {spec}
          </ReactMarkdown>
        </div>
      </Card>

      {/* Interactive Tech Stack Section */}
      <Collapsible open={openSections.techStack} onOpenChange={() => toggleSection('techStack')}>
        <Card className="overflow-hidden bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl border border-border/30 rounded-2xl">
          <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-background/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-foreground">Technology Stack</h3>
                <p className="text-[10px] text-muted-foreground">Click to select alternatives</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openSections.techStack ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator className="bg-border/20" />
            <div className="p-6 space-y-4">
              {techStack.map((item) => (
                <TechStackCard key={item.category} item={item} onSelect={handleTechSelect} />
              ))}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
