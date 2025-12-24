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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, CheckCircle2, Download, Copy, FileType, ThumbsUp, ChevronDown, Layers, Share2, Loader2, Bot, Code, Github, Image } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useRef, useCallback, useEffect } from "react";
import { TechStackCard } from "./TechStackCard";
import { TechStackItem } from "@/types/spec";
import { SpecMarkdown } from "./SpecOutput/MarkdownComponents";
import { generateAgentReadyMarkdown, generateSpecJsonString, generateAgentsMd, generateSpecKitMarkdown } from "@/lib/spec-serializers";

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
  mockupUrl?: string;
}

const SUGGESTED_REFINEMENTS = [
  "Add more technical implementation details",
  "Expand security and compliance considerations",
  "Include cost estimates and timeline"
];

export const SpecOutput = ({ spec, onApprove, onRefine, onShare, readOnly = false, initialTechStack, mockupUrl }: SpecOutputProps) => {
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

  // Sync techStack when initialTechStack changes (Fixes "Truth Gap")
  useEffect(() => {
    if (initialTechStack && initialTechStack.length > 0) {
      setTechStack(initialTechStack);
    }
  }, [initialTechStack]);

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

  // Agent-ready export with YAML frontmatter
  const downloadAgentReady = useCallback(() => {
    const agentReadyContent = generateAgentReadyMarkdown(spec, techStack);
    const blob = new Blob([agentReadyContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `specification-agent-ready-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Agent-Ready Spec Downloaded",
      description: "Specification with YAML frontmatter for AI coding agents"
    });
  }, [spec, techStack]);

  // JSON export for machine parsing
  const downloadJson = useCallback(() => {
    const jsonContent = generateSpecJsonString(spec, techStack);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `specification-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "JSON Downloaded",
      description: "Machine-readable specification for CI/CD and tooling"
    });
  }, [spec, techStack]);

  // AGENTS.md export for GitHub Copilot / Claude Code
  const downloadAgentsMd = useCallback(() => {
    const agentsMdContent = generateAgentsMd(spec, techStack);
    const blob = new Blob([agentsMdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AGENTS.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "AGENTS.md Downloaded",
      description: "Ready for GitHub Copilot, Claude Code, and other AI agents"
    });
  }, [spec, techStack]);

  // GitHub Spec Kit format with Given/When/Then acceptance criteria
  const downloadSpecKit = useCallback(() => {
    const specKitContent = generateSpecKitMarkdown(spec, techStack);
    const blob = new Blob([specKitContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spec-kit-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Spec Kit Downloaded",
      description: "GitHub Spec Kit format with Given/When/Then acceptance criteria"
    });
  }, [spec, techStack]);

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

      // Extract project name from spec
      const titleMatch = spec.match(/^#\s+(.+?)(?:\n|$)/m);
      const projectName = titleMatch ? titleMatch[1].trim() : 'Technical Specification';

      // Extract sections for table of contents
      const tocEntries: Array<{ title: string; level: number }> = [];
      const lines = spec.split('\n');
      lines.forEach((line) => {
        if (line.startsWith('## ')) {
          tocEntries.push({ title: line.replace('## ', ''), level: 2 });
        } else if (line.startsWith('### ')) {
          tocEntries.push({ title: line.replace('### ', ''), level: 3 });
        }
      });

      // ═══════════════════════════════════════════════════════════════
      // COVER PAGE
      // ═══════════════════════════════════════════════════════════════

      // Background gradient effect (dark theme)
      doc.setFillColor(24, 24, 27); // zinc-900
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Accent stripe at top
      doc.setFillColor(139, 92, 246); // violet-500
      doc.rect(0, 0, pageWidth, 4, 'F');

      // Title
      doc.setFontSize(32);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      const titleLines = doc.splitTextToSize(projectName, maxWidth);
      let coverY = 80;
      titleLines.forEach((line: string) => {
        doc.text(line, pageWidth / 2, coverY, { align: 'center' });
        coverY += 14;
      });

      // Subtitle
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(161, 161, 170); // zinc-400
      doc.text('Technical Specification', pageWidth / 2, coverY + 10, { align: 'center' });

      // Generation info
      doc.setFontSize(10);
      doc.setTextColor(113, 113, 122); // zinc-500
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Generated: ${dateStr}`, pageWidth / 2, coverY + 25, { align: 'center' });

      // Tech stack count
      if (techStack.length > 0) {
        doc.text(`Tech Stack: ${techStack.length} technologies selected`, pageWidth / 2, coverY + 35, { align: 'center' });
      }

      // Footer branding
      doc.setFontSize(11);
      doc.setTextColor(139, 92, 246); // violet-500
      doc.text('Specificity AI', pageWidth / 2, pageHeight - 30, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text('Multi-Agent Expert Specification Generator', pageWidth / 2, pageHeight - 22, { align: 'center' });

      // ═══════════════════════════════════════════════════════════════
      // TABLE OF CONTENTS (if enough sections)
      // ═══════════════════════════════════════════════════════════════

      if (tocEntries.length >= 3) {
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(24, 24, 27);
        doc.text('Table of Contents', margin, 30);

        let tocY = 50;
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');

        tocEntries.slice(0, 20).forEach((entry, index) => {
          const indent = entry.level === 3 ? 10 : 0;
          doc.setTextColor(entry.level === 2 ? 24 : 82, entry.level === 2 ? 24 : 82, entry.level === 2 ? 27 : 91);
          doc.setFont(undefined, entry.level === 2 ? 'bold' : 'normal');

          const truncatedTitle = entry.title.length > 50 ? entry.title.substring(0, 47) + '...' : entry.title;
          doc.text(`${index + 1}. ${truncatedTitle}`, margin + indent, tocY);
          tocY += 8;

          if (tocY > pageHeight - 30) {
            return; // Stop if we run out of space
          }
        });
      }

      // ═══════════════════════════════════════════════════════════════
      // SPEC CONTENT
      // ═══════════════════════════════════════════════════════════════

      doc.addPage();
      let yPosition = margin;

      // Reset to white background for content
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Reset text color
      doc.setTextColor(24, 24, 27);

      // Process spec content
      doc.setFontSize(10);

      lines.forEach((line) => {
        // Check for page break
        if (yPosition > pageHeight - margin - 15) {
          doc.addPage();
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          yPosition = margin;
        }

        // Handle headings
        if (line.startsWith('# ')) {
          doc.setFontSize(18);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(24, 24, 27);
          const text = line.replace('# ', '');
          doc.text(text, margin, yPosition);
          yPosition += 10;
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
        } else if (line.startsWith('## ')) {
          yPosition += 4; // Extra spacing before h2
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(24, 24, 27);
          const text = line.replace('## ', '');
          doc.text(text, margin, yPosition);
          // Add subtle underline
          doc.setDrawColor(228, 228, 231); // zinc-200
          doc.line(margin, yPosition + 2, margin + doc.getTextWidth(text), yPosition + 2);
          yPosition += 9;
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
        } else if (line.startsWith('### ')) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(63, 63, 70); // zinc-700
          const text = line.replace('### ', '');
          doc.text(text, margin, yPosition);
          yPosition += 7;
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
        } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          // Bullet points
          doc.setTextColor(63, 63, 70);
          const cleanLine = line.replace(/^\s*[-*]\s*/, '').replace(/[*_`]/g, '');
          const bulletLines = doc.splitTextToSize(`• ${cleanLine}`, maxWidth - 10);
          bulletLines.forEach((bulletLine: string) => {
            if (yPosition > pageHeight - margin - 15) {
              doc.addPage();
              doc.setFillColor(255, 255, 255);
              doc.rect(0, 0, pageWidth, pageHeight, 'F');
              yPosition = margin;
            }
            doc.text(bulletLine, margin + 5, yPosition);
            yPosition += 5;
          });
        } else if (line.trim()) {
          // Regular text with word wrap
          doc.setTextColor(63, 63, 70);
          const cleanLine = line.replace(/[*_`]/g, ''); // Remove markdown formatting
          const splitLines = doc.splitTextToSize(cleanLine, maxWidth);
          splitLines.forEach((splitLine: string) => {
            if (yPosition > pageHeight - margin - 15) {
              doc.addPage();
              doc.setFillColor(255, 255, 255);
              doc.rect(0, 0, pageWidth, pageHeight, 'F');
              yPosition = margin;
            }
            doc.text(splitLine, margin, yPosition);
            yPosition += 5;
          });
        } else {
          yPosition += 3; // Empty line spacing
        }
      });

      // ═══════════════════════════════════════════════════════════════
      // FOOTERS WITH PAGE NUMBERS
      // ═══════════════════════════════════════════════════════════════

      const totalPages = doc.internal.pages.length - 1;
      for (let i = 2; i <= totalPages; i++) { // Start from page 2 (skip cover)
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(161, 161, 170);

        // Page number
        doc.text(
          `Page ${i - 1} of ${totalPages - 1}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );

        // Branding on left
        doc.text('Specificity AI', margin, pageHeight - 10);

        // Date on right
        doc.text(dateStr, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      doc.save(`${projectName.toLowerCase().replace(/\s+/g, '-')}-specification-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({
        title: "PDF Downloaded",
        description: "Professional specification with cover page and table of contents"
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
  }, [spec, techStack, exportingPdf]);

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

        {/* Action Buttons - Consolidated for clarity */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Actions */}
          <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-2">
            <Copy className="w-3 h-3" />
            Copy
          </Button>

          {/* Document Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-3 h-3" />
                Download
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Document Formats</DropdownMenuLabel>
              <DropdownMenuItem onClick={downloadMarkdown} className="gap-2 cursor-pointer">
                <FileText className="w-4 h-4" />
                Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadText} className="gap-2 cursor-pointer">
                <FileType className="w-4 h-4" />
                Plain Text (.txt)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={downloadPDF}
                className="gap-2 cursor-pointer"
                disabled={exportingPdf}
              >
                {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                PDF Document
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={downloadWord}
                className="gap-2 cursor-pointer"
                disabled={exportingDocx}
              >
                {exportingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={downloadImage}
                className="gap-2 cursor-pointer"
                disabled={exportingImage}
              >
                {exportingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                Image (PNG)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI/Agent Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Bot className="w-3 h-3" />
                AI Export
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">For AI Coding Agents</DropdownMenuLabel>
              <DropdownMenuItem onClick={downloadAgentReady} className="gap-2 cursor-pointer">
                <Bot className="w-4 h-4" />
                <div className="flex flex-col">
                  <span>Agent-Ready Spec</span>
                  <span className="text-xs text-muted-foreground">YAML frontmatter format</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadAgentsMd} className="gap-2 cursor-pointer">
                <Github className="w-4 h-4" />
                <div className="flex flex-col">
                  <span>AGENTS.md</span>
                  <span className="text-xs text-muted-foreground">GitHub Copilot format</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Machine Readable</DropdownMenuLabel>
              <DropdownMenuItem onClick={downloadJson} className="gap-2 cursor-pointer">
                <Code className="w-4 h-4" />
                <div className="flex flex-col">
                  <span>JSON</span>
                  <span className="text-xs text-muted-foreground">Structured data format</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadSpecKit} className="gap-2 cursor-pointer">
                <Layers className="w-4 h-4" />
                <div className="flex flex-col">
                  <span>GitHub Spec Kit</span>
                  <span className="text-xs text-muted-foreground">Given/When/Then format</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!readOnly && onShare && (
            <Button onClick={onShare} variant="outline" size="sm" className="gap-2">
              <Share2 className="w-3 h-3" />
              Share
            </Button>
          )}

          <div className="flex-1" />

          {/* Primary Actions - Right aligned */}
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowRefinements(!showRefinements)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Refine
              </Button>
              <Button onClick={onApprove} variant="default" size="sm" className="gap-2">
                <ThumbsUp className="w-3 h-3" />
                Approve Spec
              </Button>
            </div>
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

        {/* Visual Mockup Section - NEW for Visual Spec Era */}
        {(initialTechStack as any)?.mockup_url && (
          <div className="space-y-4 pt-6 border-t border-border/20">
            <div className="flex items-center gap-2 text-primary">
              <Image className="w-4 h-4" />
              <h3 className="text-sm font-medium">AI-Generated UI Mockup</h3>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border/30 bg-black/20 group">
              <img 
                src={(initialTechStack as any).mockup_url} 
                alt="Product Mockup" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-[10px] text-white/80 italic">Conceptual UI generated based on your specification</p>
              </div>
            </div>
          </div>
        )}
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
