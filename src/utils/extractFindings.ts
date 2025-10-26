import { pdfjs } from 'react-pdf';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker as unknown as string;

export interface ExtractedFinding {
  id: number;
  title: string;
  content: string;
  pageRef: number;
  anchor?: {
    pageNumber: number;
    xPct: number;
    yPct: number;
    widthPct: number;
    heightPct: number;
    color?: string;
  };
}

const isLikelyFindingLine = (text: string) => {
  const t = text.trim();
  return /finding/i.test(t) || /^[\-•\u2022\d]+[\).\-\s]/.test(t);
};

export async function extractFindingsFromPdf(url: string): Promise<ExtractedFinding[]> {
  try {
    const loadingTask = pdfjs.getDocument(url as unknown as string);
    const doc = await loadingTask.promise;
    const findings: ExtractedFinding[] = [];
    let idCounter = 1;

    for (let pageNum = 1; pageNum <= Math.min(doc.numPages, 50); pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });

      const lines: string[] = [];
      (textContent.items as any[]).forEach((item) => {
        if (!item || !item.str) return;
        lines.push(String(item.str));
      });

      const detailsIdx = lines.findIndex((l) => /details/i.test(l));
      if (detailsIdx === -1) continue;

      for (let i = detailsIdx + 1; i < lines.length; i++) {
        const text = lines[i];
        if (!text || !text.trim()) continue;
        if (!isLikelyFindingLine(text)) continue;

        const item = (textContent.items as any[]).find((it) => typeof it.str === 'string' && it.str.includes(text.trim().slice(0, Math.min(8, text.trim().length))));
        let anchor: ExtractedFinding['anchor'] | undefined;
        try {
          if (item && Array.isArray(item.transform)) {
            const tr = item.transform as number[];
            const x = tr[4];
            const y = tr[5];
            const width = item.width ?? Math.max(100, text.length * 6);
            const height = item.height ?? 12;
            const xPct = Math.min(100, Math.max(0, (x / viewport.width) * 100));
            const yPct = Math.min(100, Math.max(0, (1 - y / viewport.height) * 100));
            const widthPct = Math.min(100, (width / viewport.width) * 100);
            const heightPct = Math.min(20, Math.max(2, (height * 1.5) / viewport.height * 100));
            anchor = {
              pageNumber: pageNum,
              xPct,
              yPct,
              widthPct,
              heightPct,
              color: 'rgba(254, 240, 138, 0.65)',
            };
          }
        } catch {
        }

        findings.push({
          id: idCounter++,
          title: `Finding`,
          content: text.trim(),
          pageRef: pageNum,
          anchor,
        });
      }
    }

    return findings;
  } catch (e) {
    console.error('Failed to extract findings from PDF:', e);
    return [];
  }
}
