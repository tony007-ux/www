/**
 * PDF Generation using jsPDF
 * Compiles all content into a single downloadable PDF
 */

import { jsPDF } from 'jspdf';

interface PDFContent {
  query: string;
  briefAnswer: string;
  keyPoints: string[];
  overview: { subtopic: string; content: string }[];
  flashcards: { front: string; back: string }[];
  resources: { title: string; url: string }[];
  timeline?: { date: string; title: string; description: string }[];
  didYouKnow?: string[];
  mindMap?: { nodes: { id: string; label: string }[]; connections: { from: string; to: string }[] };
}

const MARGIN = 20;
const PAGE_WIDTH = 210;
const LINE_HEIGHT = 6;
const TITLE_SIZE = 16;
const HEADING_SIZE = 12;
const BODY_SIZE = 10;

export async function generatePDF(content: PDFContent): Promise<Blob> {
  const doc = new jsPDF();
  let y = MARGIN;

  const addPageBreak = () => {
    if (y > 270) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const addTitle = (text: string, size: number = TITLE_SIZE) => {
    addPageBreak();
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(text, PAGE_WIDTH - 2 * MARGIN);
    doc.text(lines, MARGIN, y);
    y += lines.length * LINE_HEIGHT + 4;
  };

  const addParagraph = (text: string) => {
    addPageBreak();
    doc.setFontSize(BODY_SIZE);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, PAGE_WIDTH - 2 * MARGIN);
    doc.text(lines, MARGIN, y);
    y += lines.length * LINE_HEIGHT + 4;
  };

  const addSection = (title: string, body: () => void) => {
    addPageBreak();
    addTitle(title, HEADING_SIZE);
    body();
    y += 6;
  };

  // Header
  addTitle(`Info Quest: ${content.query}`);
  y += 4;

  // Brief Answer
  addSection('Brief Answer', () => addParagraph(content.briefAnswer));

  // Key Points
  addSection('Key Points', () => {
    content.keyPoints.forEach((point) => {
      addPageBreak();
      doc.setFontSize(BODY_SIZE);
      const lines = doc.splitTextToSize('• ' + point, PAGE_WIDTH - 2 * MARGIN - 4);
      doc.text(lines, MARGIN, y);
      y += lines.length * LINE_HEIGHT + 2;
    });
  });

  // Overview
  addSection('Overview', () => {
    content.overview.forEach((s) => {
      addPageBreak();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(BODY_SIZE + 1);
      doc.text(s.subtopic, MARGIN, y);
      y += LINE_HEIGHT + 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(BODY_SIZE);
      const lines = doc.splitTextToSize(s.content, PAGE_WIDTH - 2 * MARGIN);
      doc.text(lines, MARGIN, y);
      y += lines.length * LINE_HEIGHT + 6;
    });
  });

  // Flashcards
  addSection('Flashcards', () => {
    content.flashcards.forEach((card, i) => {
      addPageBreak();
      doc.setFont('helvetica', 'bold');
      doc.text(`Q${i + 1}: ${card.front}`, MARGIN, y);
      y += LINE_HEIGHT + 2;
      doc.setFont('helvetica', 'normal');
      const backLines = doc.splitTextToSize(card.back, PAGE_WIDTH - 2 * MARGIN);
      doc.text(`A: ` + backLines.join(' '), MARGIN, y);
      y += Math.max(LINE_HEIGHT, backLines.length * LINE_HEIGHT) + 4;
    });
  });

  // Timeline
  if (content.timeline && content.timeline.length > 0) {
    addSection('Timeline', () => {
      content.timeline!.forEach((t) => {
        addPageBreak();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(BODY_SIZE + 1);
        doc.text(`${t.date} — ${t.title}`, MARGIN, y);
        y += LINE_HEIGHT + 2;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(BODY_SIZE);
        const lines = doc.splitTextToSize(t.description, PAGE_WIDTH - 2 * MARGIN);
        doc.text(lines, MARGIN, y);
        y += lines.length * LINE_HEIGHT + 4;
      });
    });
  }

  // Did You Know
  if (content.didYouKnow && content.didYouKnow.length > 0) {
    addSection('Did You Know?', () => {
      content.didYouKnow!.forEach((fact) => {
        addPageBreak();
        doc.setFontSize(BODY_SIZE);
        const lines = doc.splitTextToSize('✦ ' + fact, PAGE_WIDTH - 2 * MARGIN - 4);
        doc.text(lines, MARGIN, y);
        y += lines.length * LINE_HEIGHT + 2;
      });
    });
  }

  // Mind Map (as text)
  if (content.mindMap && content.mindMap.nodes.length > 0) {
    addSection('Mind Map', () => {
      content.mindMap!.nodes.forEach((n) => {
        addPageBreak();
        doc.setFontSize(BODY_SIZE);
        doc.text(`• ${n.label}`, MARGIN, y);
        y += LINE_HEIGHT + 2;
      });
    });
  }

  // Resources
  addSection('Sources & Resources', () => {
    content.resources.forEach((r) => {
      addPageBreak();
      doc.setFontSize(BODY_SIZE);
      doc.textWithLink(r.title, MARGIN, y, { url: r.url });
      y += LINE_HEIGHT + 2;
    });
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Info Quest - Generated ${new Date().toLocaleDateString()} | Page ${i}/${pageCount}`,
      PAGE_WIDTH / 2,
      290,
      { align: 'center' }
    );
  }
  doc.setTextColor(0, 0, 0);

  return doc.output('blob');
}
