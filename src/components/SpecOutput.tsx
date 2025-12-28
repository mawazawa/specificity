/**
 * SpecOutput Component - Refactored for Maintainability
 *
 * Refactoring history:
 * - November 2025: Extracted markdown components to stable module-level references
 * - December 2025: Extracted export logic to useSpecExport hook (Action 30)
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
import { useState, useRef, useEffect } from "react";
import { TechStackCard } from "./TechStackCard";
import { TechStackItem } from "@/types/spec";
import { SpecMarkdown } from "./SpecOutput/MarkdownComponents";
import { useSpecExport } from "@/hooks/use-spec-export";
import { validateImageUrl } from "@/lib/sanitize";
import { ExportBoundary } from "@/components/error-boundaries";

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
  const specRef = useRef<HTMLDivElement>(null);
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

  // Use the extracted export hook for all export functionality
  const {
    exportingPdf,
    exportingDocx,
    exportingImage,
    copyToClipboard,
    downloadMarkdown,
    downloadText,
    downloadAgentReady,
    downloadJson,
    downloadAgentsMd,
    downloadSpecKit,
    downloadImage,
    downloadWord,
    downloadPDF,
  } = useSpecExport({ spec, techStack, specRef });

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
        <ExportBoundary boundaryName="spec-export">
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
        </ExportBoundary>

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
        {(() => {
          const mockupUrl = (initialTechStack as any)?.mockup_url;
          const validatedMockupUrl = mockupUrl ? validateImageUrl(mockupUrl) : null;

          return validatedMockupUrl && (
            <div className="space-y-4 pt-6 border-t border-border/20">
              <div className="flex items-center gap-2 text-primary">
                <Image className="w-4 h-4" />
                <h3 className="text-sm font-medium">AI-Generated UI Mockup</h3>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-border/30 bg-black/20 group">
                <img
                  src={validatedMockupUrl}
                  alt="Product Mockup"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-[10px] text-white/80 italic">Conceptual UI generated based on your specification</p>
                </div>
              </div>
            </div>
          );
        })()}
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
