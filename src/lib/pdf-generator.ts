/**
 * PDF Generator for Specification Export
 * Extracted from SpecOutput.tsx for maintainability
 * Action 30: Large Component Refactoring (85% confidence)
 */

import { TechStackItem } from '@/types/spec';

// Lazy-load jsPDF to avoid bundle bloat
const loadJsPDF = () => import('jspdf');

export interface PdfGeneratorOptions {
  spec: string;
  techStack: TechStackItem[];
  onProgress?: (stage: string) => void;
}

export interface PdfResult {
  success: boolean;
  filename?: string;
  error?: string;
}

/**
 * Extract project name from spec markdown
 */
export function extractProjectName(spec: string): string {
  const titleMatch = spec.match(/^#\s+(.+?)(?:\n|$)/m);
  return titleMatch ? titleMatch[1].trim() : 'Technical Specification';
}

/**
 * Extract table of contents entries from spec
 */
export function extractTocEntries(spec: string): Array<{ title: string; level: number }> {
  const entries: Array<{ title: string; level: number }> = [];
  const lines = spec.split('\n');

  lines.forEach((line) => {
    if (line.startsWith('## ')) {
      entries.push({ title: line.replace('## ', ''), level: 2 });
    } else if (line.startsWith('### ')) {
      entries.push({ title: line.replace('### ', ''), level: 3 });
    }
  });

  return entries;
}

/**
 * Generate professional PDF from specification
 */
export async function generateSpecPdf(options: PdfGeneratorOptions): Promise<PdfResult> {
  const { spec, techStack, onProgress } = options;

  try {
    onProgress?.('Loading PDF library');
    const jspdfModule = await loadJsPDF();
    const jsPDF = jspdfModule.default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    const projectName = extractProjectName(spec);
    const tocEntries = extractTocEntries(spec);
    const lines = spec.split('\n');
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // ═══════════════════════════════════════════════════════════════
    // COVER PAGE
    // ═══════════════════════════════════════════════════════════════
    onProgress?.('Creating cover page');

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
    doc.text(`Generated: ${dateStr}`, pageWidth / 2, coverY + 25, { align: 'center' });

    // Tech stack count
    if (techStack.length > 0) {
      doc.text(
        `Tech Stack: ${techStack.length} technologies selected`,
        pageWidth / 2,
        coverY + 35,
        { align: 'center' }
      );
    }

    // Footer branding
    doc.setFontSize(11);
    doc.setTextColor(139, 92, 246); // violet-500
    doc.text('Specificity AI', pageWidth / 2, pageHeight - 30, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text('Multi-Agent Expert Specification Generator', pageWidth / 2, pageHeight - 22, {
      align: 'center',
    });

    // ═══════════════════════════════════════════════════════════════
    // TABLE OF CONTENTS (if enough sections)
    // ═══════════════════════════════════════════════════════════════
    onProgress?.('Building table of contents');

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
        doc.setTextColor(
          entry.level === 2 ? 24 : 82,
          entry.level === 2 ? 24 : 82,
          entry.level === 2 ? 27 : 91
        );
        doc.setFont(undefined, entry.level === 2 ? 'bold' : 'normal');

        const truncatedTitle =
          entry.title.length > 50 ? `${entry.title.substring(0, 47)}...` : entry.title;
        doc.text(`${index + 1}. ${truncatedTitle}`, margin + indent, tocY);
        tocY += 8;

        if (tocY > pageHeight - 30) {
          return;
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // SPEC CONTENT
    // ═══════════════════════════════════════════════════════════════
    onProgress?.('Rendering specification content');

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
        yPosition += 4;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(24, 24, 27);
        const text = line.replace('## ', '');
        doc.text(text, margin, yPosition);
        doc.setDrawColor(228, 228, 231);
        doc.line(margin, yPosition + 2, margin + doc.getTextWidth(text), yPosition + 2);
        yPosition += 9;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
      } else if (line.startsWith('### ')) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(63, 63, 70);
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
        const cleanLine = line.replace(/[*_`]/g, '');
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
        yPosition += 3;
      }
    });

    // ═══════════════════════════════════════════════════════════════
    // FOOTERS WITH PAGE NUMBERS
    // ═══════════════════════════════════════════════════════════════
    onProgress?.('Adding page numbers');

    const totalPages = doc.internal.pages.length - 1;
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170);

      doc.text(`Page ${i - 1} of ${totalPages - 1}`, pageWidth / 2, pageHeight - 10, {
        align: 'center',
      });

      doc.text('Specificity AI', margin, pageHeight - 10);
      doc.text(dateStr, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Generate filename and save
    const filename = `${projectName.toLowerCase().replace(/\s+/g, '-')}-specification-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
