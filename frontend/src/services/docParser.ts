import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import type { AuraDocument, AuraSection } from '../types';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Computes a simple identifier hash for a file to prevent duplicates.
 */
export function getFileFingerprint(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * Extracts raw text and pages from a PDF file.
 */
export async function parsePdf(file: File): Promise<{ content: string; pages: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' '); // normalize spaces
    
    pages.push(pageText);
    fullText += `\n--- Page ${i} ---\n` + pageText;
  }

  return { content: fullText.trim(), pages };
}

/**
 * Extracts raw text from a DOCX file.
 */
export async function parseDocx(file: File): Promise<{ content: string; pages: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const content = result.value;
  
  // Split into pages/sections by roughly 2000 characters for readability
  const pages: string[] = [];
  const chunkSize = 2000;
  for (let i = 0; i < content.length; i += chunkSize) {
    pages.push(content.substring(i, i + chunkSize));
  }

  return { content, pages };
}

/**
 * Extracts raw text from a TXT file.
 */
export async function parseTxt(file: File): Promise<{ content: string; pages: string[] }> {
  const text = await file.text();
  const pages: string[] = [];
  const chunkSize = 2000;
  
  for (let i = 0; i < text.length; i += chunkSize) {
    pages.push(text.substring(i, i + chunkSize));
  }

  return { content: text, pages };
}

/**
 * Parses and returns a clean list of document sections.
 * This is an initial client-side split which will be enriched by AI.
 */
export function identifyInitialSections(content: string): AuraSection[] {
  // Simple heuristic split by common headers or markdown sections
  const headerRegex = /(?:^|\n)(?:Chapter\s+\d+|Section\s+\d+|Module\s+\d+|[IVXLCDM]+\.\s+|[A-Z][a-zA-Z\s]{4,30}:)(?=\s)/g;
  const sections: AuraSection[] = [];
  
  let match;
  let lastIndex = 0;
  let sectionIndex = 1;
  let currentTitle = 'Introduction';

  while ((match = headerRegex.exec(content)) !== null) {
    const sectionContent = content.substring(lastIndex, match.index).trim();
    if (sectionContent) {
      sections.push({
        id: `sec-${sectionIndex++}`,
        title: currentTitle,
        content: sectionContent,
        summary: ''
      });
    }
    currentTitle = match[0].replace(/\n/g, '').trim();
    lastIndex = match.index;
  }

  const remainingContent = content.substring(lastIndex).trim();
  if (remainingContent) {
    sections.push({
      id: `sec-${sectionIndex++}`,
      title: currentTitle,
      content: remainingContent,
      summary: ''
    });
  }

  // If no structured headers were found, chunk by roughly 4000 characters
  if (sections.length <= 1) {
    sections.length = 0;
    const chunkSize = 4000;
    let index = 1;
    for (let i = 0; i < content.length; i += chunkSize) {
      sections.push({
        id: `sec-${index}`,
        title: `Part ${index}`,
        content: content.substring(i, i + chunkSize),
        summary: ''
      });
      index++;
    }
  }

  return sections;
}

/**
 * Primary document processing entry point.
 */
export async function processFile(file: File): Promise<Omit<AuraDocument, 'topicContext' | 'summary'>> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  let parsed: { content: string; pages: string[] };

  if (extension === 'pdf') {
    parsed = await parsePdf(file);
  } else if (extension === 'docx') {
    parsed = await parseDocx(file);
  } else if (extension === 'txt') {
    parsed = await parseTxt(file);
  } else {
    throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT.');
  }

  const sections = identifyInitialSections(parsed.content);

  return {
    id: getFileFingerprint(file),
    name: file.name,
    size: file.size,
    type: extension as 'pdf' | 'docx' | 'txt',
    content: parsed.content,
    pages: parsed.pages,
    sections,
    highlights: [],
    uploadedAt: new Date().toISOString()
  };
}
