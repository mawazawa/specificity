/**
 * Export Utilities
 * Shared file download and blob creation utilities
 * Action 15: Large Component Refactoring
 */

import { toast } from '@/hooks/use-toast';

/**
 * Create and trigger file download from content
 */
export function downloadBlob(
  content: string | Blob,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a timestamped filename
 */
export function generateFilename(prefix: string, extension: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.${extension}`;
}

/**
 * Download content as markdown file
 */
export function downloadAsMarkdown(content: string, filenamePrefix: string = 'specification'): void {
  downloadBlob(content, generateFilename(filenamePrefix, 'md'), 'text/markdown');
  toast({ title: 'Downloaded', description: 'Saved as markdown' });
}

/**
 * Download content as plain text file
 */
export function downloadAsText(content: string, filenamePrefix: string = 'specification'): void {
  downloadBlob(content, generateFilename(filenamePrefix, 'txt'), 'text/plain');
  toast({ title: 'Downloaded', description: 'Saved as text' });
}

/**
 * Download content as JSON file
 */
export function downloadAsJson(content: string, filenamePrefix: string = 'specification'): void {
  downloadBlob(content, generateFilename(filenamePrefix, 'json'), 'application/json');
  toast({ title: 'JSON Downloaded', description: 'Machine-readable specification' });
}

/**
 * Copy content to clipboard
 */
export async function copyToClipboard(content: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(content);
    toast({ title: 'Copied!', description: 'Content copied to clipboard' });
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    toast({
      title: 'Copy Failed',
      description: 'Could not copy to clipboard',
      variant: 'destructive',
    });
  }
}

/**
 * Lazy load PDF libraries
 */
export const loadPdfLibraries = () =>
  Promise.all([import('jspdf'), import('html2canvas'), import('file-saver')]);

/**
 * Lazy load DOCX libraries
 */
export const loadDocxLibraries = () => Promise.all([import('docx'), import('file-saver')]);

/**
 * Default tech stack for new specifications
 */
export const DEFAULT_TECH_STACK = [
  {
    category: 'Backend',
    selected: {
      name: 'Supabase',
      logo: 'https://supabase.com/favicon/favicon-32x32.png',
      rating: 5,
      pros: ['Real-time capabilities', 'Built-in auth', 'PostgreSQL', 'Edge functions'],
      cons: ['Vendor lock-in', 'Limited customization'],
    },
    alternatives: [
      {
        name: 'Firebase',
        logo: 'https://www.gstatic.com/devrel-devsite/prod/v2210deb8920cd4a55bd580441aa58e7853afc04b39a9d9ac4198e1cd7fbe04ef/firebase/images/touchicon-180.png',
        rating: 4,
        pros: ['Easy setup', 'Real-time database', 'Good documentation'],
        cons: ['NoSQL only', 'Expensive at scale'],
      },
      {
        name: 'AWS Amplify',
        logo: 'https://docs.amplify.aws/assets/logo-dark.svg',
        rating: 4,
        pros: ['AWS ecosystem', 'Scalable', 'GraphQL support'],
        cons: ['Complex setup', 'Steeper learning curve'],
      },
    ],
  },
  {
    category: 'AI/ML',
    selected: {
      name: 'OpenAI',
      logo: 'https://cdn.oaistatic.com/_next/static/media/favicon-32x32.be48395e.png',
      rating: 5,
      pros: ['State-of-the-art models', 'Easy API', 'Wide capabilities'],
      cons: ['Expensive', 'Rate limits', 'Data privacy concerns'],
    },
    alternatives: [
      {
        name: 'Google Gemini',
        logo: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
        rating: 5,
        pros: ['Multimodal', 'Fast', 'Cost-effective'],
        cons: ['Newer platform', 'Less ecosystem'],
      },
      {
        name: 'Anthropic Claude',
        logo: 'https://www.anthropic.com/images/icons/apple-touch-icon.png',
        rating: 4,
        pros: ['Constitutional AI', 'Safety-focused', 'Large context'],
        cons: ['Limited availability', 'Higher cost'],
      },
    ],
  },
];

/**
 * Suggested refinements for spec review
 */
export const SUGGESTED_REFINEMENTS = [
  'Add more technical implementation details',
  'Expand security and compliance considerations',
  'Include cost estimates and timeline',
];
