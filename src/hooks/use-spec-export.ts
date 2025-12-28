/**
 * Specification Export Hook
 * Consolidates all export functionality for SpecOutput
 * Action 30: Large Component Refactoring (85% confidence)
 */

import { useState, useCallback, RefObject } from 'react';
import { toast } from '@/hooks/use-toast';
import { TechStackItem } from '@/types/spec';
import {
  generateAgentReadyMarkdown,
  generateSpecJsonString,
  generateAgentsMd,
  generateSpecKitMarkdown,
} from '@/lib/spec-serializers';
import { generateSpecPdf } from '@/lib/pdf-generator';
import { logger } from '@/lib/logger';

// Lazy-loaded export utilities
const loadPdfLibraries = () =>
  Promise.all([import('jspdf'), import('html2canvas'), import('file-saver')]);

const loadDocxLibraries = () => Promise.all([import('docx'), import('file-saver')]);

export interface UseSpecExportOptions {
  spec: string;
  techStack: TechStackItem[];
  specRef?: RefObject<HTMLDivElement>;
}

export interface UseSpecExportReturn {
  // Export states
  exportingPdf: boolean;
  exportingDocx: boolean;
  exportingImage: boolean;

  // Export functions
  copyToClipboard: () => void;
  downloadMarkdown: () => void;
  downloadText: () => void;
  downloadAgentReady: () => void;
  downloadJson: () => void;
  downloadAgentsMd: () => void;
  downloadSpecKit: () => void;
  downloadImage: () => Promise<void>;
  downloadWord: () => Promise<void>;
  downloadPDF: () => Promise<void>;
}

/**
 * Hook for spec export functionality
 */
export function useSpecExport({
  spec,
  techStack,
  specRef,
}: UseSpecExportOptions): UseSpecExportReturn {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(spec);
    toast({ title: 'Copied!', description: 'Specification copied to clipboard' });
  }, [spec]);

  const downloadMarkdown = useCallback(() => {
    const blob = new Blob([spec], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `specification-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Specification saved as markdown' });
  }, [spec]);

  const downloadText = useCallback(() => {
    const blob = new Blob([spec], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `specification-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Specification saved as text' });
  }, [spec]);

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
      title: 'Agent-Ready Spec Downloaded',
      description: 'Specification with YAML frontmatter for AI coding agents',
    });
  }, [spec, techStack]);

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
      title: 'JSON Downloaded',
      description: 'Machine-readable specification for CI/CD and tooling',
    });
  }, [spec, techStack]);

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
      title: 'AGENTS.md Downloaded',
      description: 'Ready for GitHub Copilot, Claude Code, and other AI agents',
    });
  }, [spec, techStack]);

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
      title: 'Spec Kit Downloaded',
      description: 'GitHub Spec Kit format with Given/When/Then acceptance criteria',
    });
  }, [spec, techStack]);

  const downloadImage = useCallback(async () => {
    if (exportingImage) return;

    if (!specRef?.current) {
      toast({
        title: 'Export Failed',
        description: 'Specification content not found. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setExportingImage(true);
    try {
      const [, html2canvasModule, fileSaverModule] = await loadPdfLibraries();
      const html2canvas = html2canvasModule.default;
      const { saveAs } = fileSaverModule;

      const canvas = await html2canvas(specRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#1a1b1e',
      });
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `specification-${new Date().toISOString().split('T')[0]}.png`);
          toast({ title: 'Image Downloaded', description: 'Specification saved as PNG' });
        } else {
          toast({
            title: 'Export Failed',
            description: 'Could not create image. Please try again.',
            variant: 'destructive',
          });
        }
      });
    } catch (error) {
      logger.error('Image generation error:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not generate image.',
        variant: 'destructive',
      });
    } finally {
      setExportingImage(false);
    }
  }, [exportingImage, specRef]);

  const downloadWord = useCallback(async () => {
    if (exportingDocx) return;
    setExportingDocx(true);
    try {
      const [docxModule, fileSaverModule] = await loadDocxLibraries();
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docxModule;
      const { saveAs } = fileSaverModule;

      const lines = spec.split('\n');
      const docChildren = lines.map((line) => {
        if (line.startsWith('# ')) {
          return new Paragraph({
            text: line.replace('# ', ''),
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          });
        }
        if (line.startsWith('## ')) {
          return new Paragraph({
            text: line.replace('## ', ''),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
          });
        }
        if (line.startsWith('### ')) {
          return new Paragraph({
            text: line.replace('### ', ''),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 120, after: 120 },
          });
        }
        return new Paragraph({
          children: [new TextRun(line)],
          spacing: { after: 120 },
        });
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docChildren,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `specification-${new Date().toISOString().split('T')[0]}.docx`);
      toast({ title: 'Word Doc Downloaded', description: 'Specification saved as .docx' });
    } catch (error) {
      logger.error('Word generation error:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not generate Word document.',
        variant: 'destructive',
      });
    } finally {
      setExportingDocx(false);
    }
  }, [spec, exportingDocx]);

  const downloadPDF = useCallback(async () => {
    if (exportingPdf) return;
    setExportingPdf(true);

    try {
      const result = await generateSpecPdf({ spec, techStack });

      if (result.success) {
        toast({
          title: 'PDF Downloaded',
          description: 'Professional specification with cover page and table of contents',
        });
      } else {
        toast({
          title: 'Export Failed',
          description: result.error || 'Could not generate PDF. Try downloading as Markdown instead.',
          variant: 'destructive',
        });
      }
    } finally {
      setExportingPdf(false);
    }
  }, [spec, techStack, exportingPdf]);

  return {
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
  };
}
