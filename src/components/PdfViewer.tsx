import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { usePdfContext } from '../context/PdfContext';
import LoadingSkeleton from './LoadingSkeleton';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker as unknown as string;

interface PdfViewerProps {
  pdfUrl: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl }) => {
  const { state, dispatch, saveToLocalStorage } = usePdfContext();
  const [numPages, setNumPages] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [viewport, setViewport] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setViewport({ width: el.clientWidth, height: el.clientHeight });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    dispatch({ type: 'SET_TOTAL_PAGES', payload: numPages });
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  const pageProps = useMemo(() => {
    const vw = Math.max(200, viewport.width);
    const vh = Math.max(100, viewport.height);
    if (Math.round(state.scale * 100) === 100) {
      if (naturalSize) {
        const { width: nw, height: nh } = naturalSize;
        const widthAtHeightFit = (nw / nh) * vh;
        if (widthAtHeightFit > vw) {
          return { width: vw } as const;
        }
      }
      return { height: vh } as const;
    }
    return { width: Math.max(100, vw * state.scale) } as const;
  }, [state.scale, viewport.width, viewport.height, naturalSize]);

  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isProgrammaticScroll = useRef(false);

  const goToPage = useCallback(
    (page: number) => {
      if (numPages === 0) return;
      const next = Math.min(Math.max(page, 1), numPages);
      if (next !== state.currentPage) {
        dispatch({ type: 'SET_CURRENT_PAGE', payload: next });
        saveToLocalStorage();
      }
    },
    [dispatch, saveToLocalStorage, state.currentPage, numPages]
  );

  const handlePrev = () => goToPage(state.currentPage - 1);
  const handleNext = () => goToPage(state.currentPage + 1);

  const handleZoomIn = () => {
    const newScale = Math.min(state.scale + 0.2, 3);
    dispatch({ type: 'SET_SCALE', payload: newScale });
    saveToLocalStorage();
  };

  const handleZoomOut = () => {
    const newScale = Math.max(state.scale - 0.2, 0.5);
    dispatch({ type: 'SET_SCALE', payload: newScale });
    saveToLocalStorage();
  };

  const handleResetZoom = () => {
    dispatch({ type: 'SET_SCALE', payload: 1 });
    saveToLocalStorage();
  };

  const handlePageClick = (event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    if (x > 10 && x < 90 && y > 10 && y < 90) {
      console.log(`Clicked on page ${state.currentPage} at ${x.toFixed(1)}%, ${y.toFixed(1)}%`);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || numPages === 0) return;

    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;

      const containerRect = container.getBoundingClientRect();
      const containerMidY = containerRect.top + containerRect.height / 2;

      let closestPage = 1;
      let minDistance = Infinity;

      pageRefs.current.forEach((pageEl, pageNum) => {
        const pageRect = pageEl.getBoundingClientRect();
        const pageMidY = pageRect.top + pageRect.height / 2;
        const distance = Math.abs(pageMidY - containerMidY);

        if (distance < minDistance) {
          minDistance = distance;
          closestPage = pageNum;
        }
      });

      if (closestPage !== state.currentPage) {
        dispatch({ type: 'SET_CURRENT_PAGE', payload: closestPage });
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [dispatch, state.currentPage, numPages]);

  useEffect(() => {
    const pageEl = pageRefs.current.get(state.currentPage);
    if (pageEl && containerRef.current) {
      isProgrammaticScroll.current = true;
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 1000);
    }
  }, [state.currentPage]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <style>{`
        .react-pdf__Page { position: relative !important; }
        .react-pdf__Page__textContent {
          display: none !important;
        }
      `}</style>
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrev}
            disabled={state.currentPage <= 1}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-gray-600">Page {state.currentPage} of {numPages || state.totalPages}</span>
          <button
            onClick={handleNext}
            disabled={state.currentPage >= (numPages || state.totalPages)}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={handleZoomOut} className="p-2 rounded hover:bg-gray-100" title="Zoom out">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button onClick={handleResetZoom} className="px-3 py-1 text-sm rounded hover:bg-gray-100" title="Reset zoom">
            {Math.round(state.scale * 100)}%
          </button>
          <button onClick={handleZoomIn} className="p-2 rounded hover:bg-gray-100" title="Zoom in">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto">
        <div className="w-full space-y-4 p-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<LoadingSkeleton type="pdf" />}
            error={
              <div className="text-center p-8">
                <p className="text-red-600 mb-2">Failed to load PDF</p>
                <p className="text-gray-500 text-sm">Tried to load {pdfUrl}. Check the file path or worker setup.</p>
              </div>
            }
          >
            {numPages > 0 && Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
              const pageHighlights = state.highlights.filter(h => h.pageNumber === pageNum);
              return (
                <div
                  key={pageNum}
                  ref={(el) => {
                    if (el) {
                      pageRefs.current.set(pageNum, el);
                    } else {
                      pageRefs.current.delete(pageNum);
                    }
                  }}
                  className="relative bg-white w-full mx-auto shadow-lg"
                >
                  <Page
                    pageNumber={pageNum}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    loading={<LoadingSkeleton type="page" />}
                    onClick={handlePageClick}
                    onLoadSuccess={(page: any) => {
                      if (pageNum === 1) {
                        const w = page?.originalWidth ?? page?.width ?? (Array.isArray(page?.view) ? page.view[2] : undefined) ?? 595;
                        const h = page?.originalHeight ?? page?.height ?? (Array.isArray(page?.view) ? page.view[3] : undefined) ?? 842;
                        if (!naturalSize || naturalSize.width !== w || naturalSize.height !== h) {
                          setNaturalSize({ width: w, height: h });
                        }
                      }
                    }}
                    className="cursor-pointer"
                    {...pageProps}
                  />
                  <div className="absolute inset-0 pointer-events-none z-10">
                    {pageHighlights.map((h) => {
                      const left = h.xPct !== undefined ? `${h.xPct}%` : h.x !== undefined ? `${h.x}px` : '0';
                      const top = h.yPct !== undefined ? `${h.yPct}%` : h.y !== undefined ? `${h.y}px` : '0';
                      const width = h.wPct !== undefined ? `${h.wPct}%` : h.width !== undefined ? `${h.width}px` : '0';
                      const height = h.hPct !== undefined ? `${h.hPct}%` : h.height !== undefined ? `${h.height}px` : '0';
                      return (
                        <div
                          key={h.id}
                          className="absolute"
                          style={{
                            left,
                            top,
                            width,
                            height,
                            backgroundColor: h.color || 'rgba(255, 255, 0, 0.5)',
                            opacity: h.opacity,
                            mixBlendMode: 'multiply',
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {pageNum}
                  </div>
                </div>
              );
            })}
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;