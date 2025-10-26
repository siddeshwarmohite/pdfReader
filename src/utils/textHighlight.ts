import * as pdfjs from 'pdfjs-dist';

export interface TextPosition {
  pageNumber: number;
  highlights: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export async function findTextOnPage(
  pdfUrl: string,
  pageNumber: number,
  searchText: string
): Promise<TextPosition | null> {
  try {
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });

    const highlights: Array<{ x: number; y: number; width: number; height: number }> = [];
    
    // Combine all text items into a single string with positions
    let fullText = '';
    const positions: Array<{ start: number; end: number; item: any }> = [];
    
    textContent.items.forEach((item: any) => {
      if (!item.str) return;
      const start = fullText.length;
      fullText += item.str;
      const end = fullText.length;
      positions.push({ start, end, item });
      fullText += ' '; // Add space between items
    });

    // Find all occurrences of searchText (case-insensitive)
    const searchLower = searchText.toLowerCase();
    const fullTextLower = fullText.toLowerCase();
    
    let index = fullTextLower.indexOf(searchLower);
    while (index !== -1) {
      const endIndex = index + searchText.length;
      
      // Find which text items contain this match
      const matchingItems = positions.filter(
        p => (p.start <= index && p.end > index) || (p.start < endIndex && p.end >= endIndex) || (p.start >= index && p.end <= endIndex)
      );

      matchingItems.forEach(({ item }) => {
        const transform = item.transform;
        const x = transform[4];
        const y = viewport.height - transform[5];
        const width = item.width;
        const height = item.height;

        highlights.push({
          x: (x / viewport.width) * 100,
          y: ((y - height) / viewport.height) * 100,
          width: (width / viewport.width) * 100,
          height: (height / viewport.height) * 100,
        });
      });

      index = fullTextLower.indexOf(searchLower, index + 1);
    }

    if (highlights.length === 0) {
      return null;
    }

    return {
      pageNumber,
      highlights: highlights.slice(0, 10), // Limit to first 10 matches to avoid performance issues
    };
  } catch (error) {
    console.error('Error finding text on page:', error);
    return null;
  }
}
