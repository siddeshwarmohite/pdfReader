import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { findTextOnPage } from '../utils/textHighlight';

export interface AnalysisSection {
  id: number;
  title: string;
  content: string;
  pageRef: number;
  highlights?: number[];
}

export interface Highlight {
  id: string;
  pageNumber: number;
  // Absolute pixel-based (legacy)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Percentage-based (preferred)
  xPct?: number; // 0-100
  yPct?: number; // 0-100
  wPct?: number; // 0-100
  hPct?: number; // 0-100
  opacity: number;
  color?: string; // rgba color for background
}

interface PdfState {
  currentPage: number;
  totalPages: number;
  scale: number;
  isLoading: boolean;
  analysisSections: AnalysisSection[];
  highlights: Highlight[];
  activeSection: number | null;
  scrollPosition: number;
  textHighlights: Array<{ pageNumber: number; patterns: string[] }>;
}

type PdfAction =
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_TOTAL_PAGES'; payload: number }
  | { type: 'SET_SCALE'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ANALYSIS_SECTIONS'; payload: AnalysisSection[] }
  | { type: 'ADD_HIGHLIGHT'; payload: Highlight }
  | { type: 'REMOVE_HIGHLIGHT'; payload: string }
  | { type: 'SET_HIGHLIGHT_OPACITY'; payload: { id: string; opacity: number } }
  | { type: 'SET_ACTIVE_SECTION'; payload: number | null }
  | { type: 'SET_SCROLL_POSITION'; payload: number }
  | { type: 'FADE_HIGHLIGHT'; payload: string }
  | { type: 'SET_TEXT_HIGHLIGHTS_FOR_PAGE'; payload: { pageNumber: number; patterns: string[] } }
  | { type: 'CLEAR_TEXT_HIGHLIGHTS' };

const initialState: PdfState = {
  currentPage: 1,
  totalPages: 0,
  scale: 1.2,
  isLoading: true,
  analysisSections: [],
  highlights: [],
  activeSection: null,
  scrollPosition: 0,
  textHighlights: [],
};

const pdfReducer = (state: PdfState, action: PdfAction): PdfState => {
  switch (action.type) {
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_TOTAL_PAGES':
      return { ...state, totalPages: action.payload };
    case 'SET_SCALE':
      return { ...state, scale: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ANALYSIS_SECTIONS':
      return { ...state, analysisSections: action.payload };
    case 'ADD_HIGHLIGHT':
      return { ...state, highlights: [...state.highlights, action.payload] };
    case 'REMOVE_HIGHLIGHT':
      return {
        ...state,
        highlights: state.highlights.filter((h) => h.id !== action.payload),
      };
    case 'SET_HIGHLIGHT_OPACITY':
      return {
        ...state,
        highlights: state.highlights.map((h) =>
          h.id === action.payload.id ? { ...h, opacity: action.payload.opacity } : h
        ),
      };
    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload };
    case 'SET_SCROLL_POSITION':
      return { ...state, scrollPosition: action.payload };
    case 'FADE_HIGHLIGHT':
      return {
        ...state,
        highlights: state.highlights.map((h) =>
          h.id === action.payload ? { ...h, opacity: Math.max(0, h.opacity - 0.1) } : h
        ),
      };
    case 'SET_TEXT_HIGHLIGHTS_FOR_PAGE': {
      const others = state.textHighlights.filter((t) => t.pageNumber !== action.payload.pageNumber);
      return { ...state, textHighlights: [...others, { pageNumber: action.payload.pageNumber, patterns: action.payload.patterns }] };
    }
    case 'CLEAR_TEXT_HIGHLIGHTS':
      return { ...state, textHighlights: [] };
    default:
      return state;
  }
};

interface PdfContextType {
  state: PdfState;
  dispatch: React.Dispatch<PdfAction>;
  navigateToPage: (page: number) => void;
  addHighlight: (pageNumber: number, x: number, y: number) => void;
  addParagraphHighlight: (pageNumber: number) => void;
  addTextHighlight: (pageNumber: number, text: string, pdfUrl: string) => Promise<void>;
  setTextHighlightsForPage: (pageNumber: number, patterns: string[]) => void;
  setActiveSection: (sectionId: number | null) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const PdfContext = createContext<PdfContextType | undefined>(undefined);

const mockAnalysisSections: AnalysisSection[] = [
  {
    id: 1,
    title: "Executive Summary",
    content: "The financial analysis reveals strong performance indicators across all major sectors. Key highlights include a 15% increase in revenue and improved operational efficiency. [5] See detailed breakdown on page 3.",
    pageRef: 3,
    highlights: [5]
  },
  {
    id: 2,
    title: "Revenue Analysis",
    content: "Q4 revenue showed exceptional growth, primarily driven by digital transformation initiatives. The technology sector contributed 40% of total growth [8]. Market expansion strategies yielded positive results as outlined on page 7.",
    pageRef: 7,
    highlights: [8]
  },
  {
    id: 3,
    title: "Operational Metrics",
    content: "Operational efficiency improved by 12% year-over-year. Cost reduction measures implemented in Q2 resulted in significant savings [12]. Detailed cost analysis can be found on page 14.",
    pageRef: 14,
    highlights: [12]
  },
  {
    id: 4,
    title: "Market Position",
    content: "The company maintains a strong competitive position with 25% market share. Strategic partnerships and innovation investments [18] have strengthened our market presence. Comprehensive market analysis is detailed on page 21.",
    pageRef: 21,
    highlights: [18]
  },
  {
    id: 5,
    title: "Risk Assessment",
    content: "Risk factors have been carefully evaluated with mitigation strategies in place. Regulatory compliance remains strong with 99.2% adherence rate [25]. Full risk matrix is presented on page 28.",
    pageRef: 28,
    highlights: [25]
  },
  {
    id: 6,
    title: "Future Outlook",
    content: "Projections for the next fiscal year indicate continued growth with an estimated 18% increase in revenue. Investment in R&D and market expansion [32] will drive future success. Strategic roadmap is outlined on page 35.",
    pageRef: 35,
    highlights: [32]
  }
];

export const PdfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(pdfReducer, initialState);

  const navigateToPage = (page: number) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
    saveToLocalStorage();
  };

  const addHighlight = (pageNumber: number, x: number, y: number) => {
    const highlight: Highlight = {
      id: `highlight-${Date.now()}-${Math.random()}`,
      pageNumber,
      // legacy pixel-based small pill
      x,
      y,
      width: 200,
      height: 20,
      opacity: 1,
      color: 'rgba(255, 221, 0, 0.45)',
    };
    dispatch({ type: 'ADD_HIGHLIGHT', payload: highlight });
    
    // Auto-fade highlight after 3 seconds
    setTimeout(() => {
      const fadeInterval = setInterval(() => {
        dispatch({ type: 'FADE_HIGHLIGHT', payload: highlight.id });
      }, 100);
      
      setTimeout(() => {
        clearInterval(fadeInterval);
        dispatch({ type: 'REMOVE_HIGHLIGHT', payload: highlight.id });
      }, 1000);
    }, 3000);
    
    saveToLocalStorage();
  };

  // Big paragraph-like highlight near top of the page (first paragraph approximation)
  const addParagraphHighlight = (pageNumber: number) => {
    const highlight: Highlight = {
      id: `para-${Date.now()}-${Math.random()}`,
      pageNumber,
      xPct: 4,
      yPct: 8,
      wPct: 92,
      hPct: 16,
      opacity: 0.45,
      color: 'rgba(255, 241, 118, 0.6)', // amber/yellow
    };
    dispatch({ type: 'ADD_HIGHLIGHT', payload: highlight });

    // Auto-fade and remove (slightly longer visibility)
    setTimeout(() => {
      const fadeInterval = setInterval(() => {
        dispatch({ type: 'FADE_HIGHLIGHT', payload: highlight.id });
      }, 120);
      setTimeout(() => {
        clearInterval(fadeInterval);
        dispatch({ type: 'REMOVE_HIGHLIGHT', payload: highlight.id });
      }, 1500);
    }, 3000);

    saveToLocalStorage();
  };

  const setTextHighlightsForPage = (pageNumber: number, patterns: string[]) => {
    dispatch({ type: 'SET_TEXT_HIGHLIGHTS_FOR_PAGE', payload: { pageNumber, patterns } });
  };

  // Smart text highlight - finds exact text position on the page
  const addTextHighlight = async (pageNumber: number, text: string, pdfUrl: string) => {
    try {
      const result = await findTextOnPage(pdfUrl, pageNumber, text);
      if (result && result.highlights.length > 0) {
        // Add highlights for each matched text position
        result.highlights.forEach((pos) => {
          const highlight: Highlight = {
            id: `text-${Date.now()}-${Math.random()}`,
            pageNumber,
            xPct: pos.x,
            yPct: pos.y,
            wPct: pos.width,
            hPct: pos.height,
            opacity: 1,
            color: 'rgba(255, 255, 0, 0.5)',
          };
          dispatch({ type: 'ADD_HIGHLIGHT', payload: highlight });
          
          // Auto-fade and remove
          setTimeout(() => {
            const fadeInterval = setInterval(() => {
              dispatch({ type: 'FADE_HIGHLIGHT', payload: highlight.id });
            }, 120);
            setTimeout(() => {
              clearInterval(fadeInterval);
              dispatch({ type: 'REMOVE_HIGHLIGHT', payload: highlight.id });
            }, 1500);
          }, 3000);
        });
      } else {
        console.warn(`Text "${text}" not found on page ${pageNumber}`);
      }
    } catch (error) {
      console.error('Error adding text highlight:', error);
    }
  };

  const setActiveSection = (sectionId: number | null) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', payload: sectionId });
    saveToLocalStorage();
  };

  const saveToLocalStorage = () => {
    const dataToSave = {
      currentPage: state.currentPage,
      activeSection: state.activeSection,
      scrollPosition: state.scrollPosition,
      scale: state.scale,
    };
    localStorage.setItem('pdfViewerState', JSON.stringify(dataToSave));
  };

  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem('pdfViewerState');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Always start at page 1 on reload
        dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 });
        dispatch({ type: 'SET_ACTIVE_SECTION', payload: parsed.activeSection || null });
        dispatch({ type: 'SET_SCROLL_POSITION', payload: parsed.scrollPosition || 0 });
        dispatch({ type: 'SET_SCALE', payload: parsed.scale || 1.2 });
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  };

  useEffect(() => {
    dispatch({ type: 'SET_ANALYSIS_SECTIONS', payload: mockAnalysisSections });
    loadFromLocalStorage();
  }, []);

  const contextValue: PdfContextType = {
    state,
    dispatch,
    navigateToPage,
    addHighlight,
    addParagraphHighlight,
    addTextHighlight,
    setTextHighlightsForPage,
    setActiveSection,
    saveToLocalStorage,
    loadFromLocalStorage,
  };

  return <PdfContext.Provider value={contextValue}>{children}</PdfContext.Provider>;
};

export const usePdfContext = () => {
  const context = useContext(PdfContext);
  if (context === undefined) {
    throw new Error('usePdfContext must be used within a PdfProvider');
  }
  return context;
};