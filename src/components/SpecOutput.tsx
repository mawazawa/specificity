/**
 * SpecOutput Component - Refactored for Performance
 *
 * Performance improvements (November 2025):
 * - Extracted markdown components to stable module-level references
 * - Memoized SpecMarkdown component prevents re-parse on state changes
 * - Download functions remain inline (infrequent operations)
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, CheckCircle2, Download, Copy, FileType, ThumbsUp, ChevronDown, Layers, Share2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useRef, useCallback } from "react";
import { TechStackCard } from "./TechStackCard";
import { TechStackItem } from "@/types/spec";
import { SpecMarkdown } from "./SpecOutput/MarkdownComponents";

// Lazy-loaded export utilities - these are heavy dependencies (~700KB total)
// They are only loaded when the user actually clicks the export button
const loadPdfLibraries = () => Promise.all([
  import("jspdf"),
  import("html2canvas"),
  import("file-saver")
]);

const loadDocxLibraries = () => Promise.all([
  import("docx"),
  import("file-saver")
]);

interface SpecOutputProps {
  spec: string;
  onApprove?: () => void;
  onRefine?: (refinements: string[]) => void;
  onShare?: () => void;
  readOnly?: boolean;
  initialTechStack?: TechStackItem[];
}

const SUGGESTED_REFINEMENTS = [
  "Add more technical implementation details",
  "Expand security and compliance considerations",
  "Include cost estimates and timeline"
];

export const SpecOutput = ({ spec, onApprove, onRefine, onShare, readOnly = false, initialTechStack }: SpecOutputProps) => {
  const [showRefinements, setShowRefinements] = useState(false);
  const [selectedRefinements, setSelectedRefinements] = useState<string[]>([]);
  const [customRefinement, setCustomRefinement] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);
  const [techStack, setTechStack] = useState<TechStackItem[]>(initialTechStack || [
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

  const specRef = useRef<HTMLDivElement>(null);

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

  const downloadImage = useCallback(async () => {
    if (!specRef.current || exportingImage) return;
    setExportingImage(true);
    try {
      const [, html2canvasModule, fileSaverModule] = await loadPdfLibraries();
      const html2canvas = html2canvasModule.default;
      const { saveAs } = fileSaverModule;

      const canvas = await html2canvas(specRef.current, {
        scale: 2, // Retain high resolution
        useCORS: true,
        backgroundColor: "#1a1b1e" // Match dark theme
      });
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `specification-${new Date().toISOString().split('T')[0]}.png`);
          toast({ title: "Image Downloaded", description: "Specification saved as PNG" });
        }
      });
    } catch (error) {
      console.error("Image generation error:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate image.",
        variant: "destructive"
      });
    } finally {
      setExportingImage(false);
    }
  }, [exportingImage]);

  const downloadWord = useCallback(async () => {
    if (exportingDocx) return;
    setExportingDocx(true);
    try {
      const [docxModule, fileSaverModule] = await loadDocxLibraries();
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docxModule;
      const { saveAs } = fileSaverModule;

      const lines = spec.split('\n');
      const docChildren = lines.map(line => {
        if (line.startsWith('# ')) {
          return new Paragraph({
            text: line.replace('# ', ''),
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          });
        }
        if (line.startsWith('## ')) {
          return new Paragraph({
            text: line.replace('## ', ''),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 }
          });
        }
        if (line.startsWith('### ')) {
          return new Paragraph({
            text: line.replace('### ', ''),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 120, after: 120 }
          });
        }
        return new Paragraph({
          children: [new TextRun(line)],
          spacing: { after: 120 }
        });
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `specification-${new Date().toISOString().split('T')[0]}.docx`);
      toast({ title: "Word Doc Downloaded", description: "Specification saved as .docx" });
    } catch (error) {
      console.error("Word generation error:", error);
      toast({
        title: "Export Failed",
        description: "Could not generate Word document.",
        variant: "destructive"
      });
    } finally {
      setExportingDocx(false);
    }
  }, [spec, exportingDocx]);

  const downloadPDF = useCallback(async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const [jspdfModule] = await loadPdfLibraries();
      const jsPDF = jspdfModule.default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Add header
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Technical Specification', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
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
          doc.setFont(undefined, 'bold');
          const text = line.replace('# ', '');
          doc.text(text, margin, yPosition);
          yPosition += 8;
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
        } else if (line.startsWith('## ')) {
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          const text = line.replace('## ', '');
          doc.text(text, margin, yPosition);
          yPosition += 7;
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
        } else if (line.startsWith('### ')) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          const text = line.replace('### ', '');
          doc.text(text, margin, yPosition);
          yPosition += 6;
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
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
    } finally {
      setExportingPdf(false);
    }
  }, [spec, exportingPdf]);

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

  // Early return must come AFTER all hooks to satisfy React rules
  if (!spec) return null;

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
          {!readOnly && onShare && (
            <Button onClick={onShare} variant="outline" size="sm" className="gap-2">
              <Share2 className="w-3 h-3" />
              Share
            </Button>
          )}
          <Button onClick={downloadImage} variant="outline" size="sm" className="gap-2" disabled={exportingImage}>
            {exportingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            PNG
          </Button>
          <Button onClick={downloadWord} variant="outline" size="sm" className="gap-2" disabled={exportingDocx}>
            {exportingDocx ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
            DOCX
          </Button>
          <Button onClick={downloadPDF} variant="outline" size="sm" className="gap-2" disabled={exportingPdf}>
            {exportingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            PDF
          </Button>
          <div className="flex-1" />
          {!readOnly && (
            <>
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
            </>
          )}
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

        {/* Spec Content - Using memoized markdown renderer */}
        <div ref={specRef} className="p-4 rounded-lg bg-background/30">
          <SpecMarkdown content={spec} />
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
