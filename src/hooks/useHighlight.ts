import { useCallback, useRef, useEffect } from 'react';
import { usePdfContext } from '../context/PdfContext';

interface HighlightOptions {
  duration?: number;
  fadeOutDelay?: number;
  fadeOutDuration?: number;
  maxHighlights?: number;
}

interface UseHighlightReturn {
  addHighlight: (pageNumber: number, xPct: number, yPct: number, widthPct?: number, heightPct?: number) => string;
  removeHighlight: (highlightId: string) => void;
  clearAllHighlights: () => void;
  highlightTextReference: (referenceNumber: number, pageNumber: number) => Promise<string>;
  animateHighlight: (highlightId: string) => void;
}

export const useHighlight = (options: HighlightOptions = {}): UseHighlightReturn => {
  const {
    duration = 4000,
    fadeOutDelay = 3000,
    fadeOutDuration = 1000,
    maxHighlights = 10,
  } = options;

  const { state, dispatch } = usePdfContext();
  const activeAnimationsRef = useRef<Map<string, number>>(new Map());
  const highlightCountRef = useRef<number>(0);

  const addHighlight = useCallback((
    pageNumber: number,
    xPct: number,
    yPct: number,
    widthPct: number = 20,
    heightPct: number = 4
  ): string => {
    if (state.highlights.length >= maxHighlights) {
      const oldestHighlight = state.highlights[0];
      dispatch({ type: 'REMOVE_HIGHLIGHT', payload: oldestHighlight.id });
    }

    const highlightId = `highlight-${Date.now()}-${++highlightCountRef.current}`;
    
    const highlight = {
      id: highlightId,
      pageNumber,
      xPct: Math.max(0, Math.min(98, xPct)),
      yPct: Math.max(0, Math.min(98, yPct)), 
      wPct: Math.max(1, Math.min(98, widthPct)), 
      hPct: Math.max(1, Math.min(40, heightPct)), 
      opacity: 1,
    };

    dispatch({ type: 'ADD_HIGHLIGHT', payload: highlight });

    // Auto-remove after duration
    const timeoutId = window.setTimeout(() => {
      removeHighlight(highlightId);
    }, duration);

    activeAnimationsRef.current.set(highlightId, timeoutId);

    window.setTimeout(() => {
      animateHighlight(highlightId);
    }, fadeOutDelay);

    return highlightId;
  }, [state.highlights.length, maxHighlights, dispatch, duration, fadeOutDelay]);

  const removeHighlight = useCallback((highlightId: string) => {
    const timeoutId = activeAnimationsRef.current.get(highlightId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      activeAnimationsRef.current.delete(highlightId);
    }

    dispatch({ type: 'REMOVE_HIGHLIGHT', payload: highlightId });
  }, [dispatch]);

  const clearAllHighlights = useCallback(() => {
    activeAnimationsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    activeAnimationsRef.current.clear();

    state.highlights.forEach((highlight) => {
      dispatch({ type: 'REMOVE_HIGHLIGHT', payload: highlight.id });
    });
  }, [state.highlights, dispatch]);

  const animateHighlight = useCallback((highlightId: string) => {
    const fadeSteps = 10;
    const stepDelay = fadeOutDuration / fadeSteps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      dispatch({ type: 'FADE_HIGHLIGHT', payload: highlightId });

      if (currentStep >= fadeSteps) {
        clearInterval(fadeInterval);
        removeHighlight(highlightId);
      }
    }, stepDelay);
  }, [fadeOutDuration, dispatch, removeHighlight]);

  const highlightTextReference = useCallback(async (
    referenceNumber: number,
    pageNumber: number
  ): Promise<string> => {
    const simulatedPositions = [
      { xPct: 15, yPct: 25 }, // Top left area
      { xPct: 45, yPct: 35 }, // Center left
      { xPct: 25, yPct: 55 }, // Middle area
      { xPct: 65, yPct: 45 }, // Center right
      { xPct: 35, yPct: 75 }, // Lower area
      { xPct: 55, yPct: 65 },
    ];

    const positionIndex = (referenceNumber - 1) % simulatedPositions.length;
    const position = simulatedPositions[positionIndex];

    const x = position.xPct + (Math.random() - 0.5) * 6;
    const y = position.yPct + (Math.random() - 0.5) * 6;

    const highlightId = addHighlight(pageNumber, x, y, 18, 3);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(highlightId);
      }, 100);
    });
  }, [addHighlight]);

  const addTemporaryHighlight = useCallback((
    pageNumber: number,
    x: number,
    y: number,
    tempDuration: number = 2000
  ): string => {
    const highlightId = addHighlight(pageNumber, x, y);
    
    const existingTimeout = activeAnimationsRef.current.get(highlightId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const newTimeoutId = window.setTimeout(() => {
      removeHighlight(highlightId);
    }, tempDuration);

    activeAnimationsRef.current.set(highlightId, newTimeoutId);
    return highlightId;
  }, [addHighlight, removeHighlight]);

  const addPulsingHighlight = useCallback((
    pageNumber: number,
    x: number,
    y: number
  ): string => {
    const highlightId = addHighlight(pageNumber, x, y);
    
    let pulseCount = 0;
    const maxPulses = 6;
    
    const pulseInterval = setInterval(() => {
      if (pulseCount < maxPulses) {
        dispatch({ type: 'FADE_HIGHLIGHT', payload: highlightId });
        setTimeout(() => {
          dispatch({ type: 'SET_HIGHLIGHT_OPACITY', payload: { id: highlightId, opacity: 1 } });
        }, 200);
        pulseCount++;
      } else {
        clearInterval(pulseInterval);
        removeHighlight(highlightId);
      }
    }, 400);

    return highlightId;
  }, [addHighlight, dispatch, removeHighlight, state.highlights]);

  useEffect(() => {
    return () => {
      activeAnimationsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      activeAnimationsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (state.highlights.length > maxHighlights) {
        const excessCount = state.highlights.length - maxHighlights;
        for (let i = 0; i < excessCount; i++) {
          const oldestHighlight = state.highlights[i];
          removeHighlight(oldestHighlight.id);
        }
      }
    }, 5000);

    return () => clearInterval(cleanupInterval);
  }, [state.highlights, maxHighlights, removeHighlight]);

  return {
    addHighlight,
    removeHighlight,
    clearAllHighlights,
    highlightTextReference,
    animateHighlight,
    addTemporaryHighlight,
    addPulsingHighlight,
  } as UseHighlightReturn & {
    addTemporaryHighlight: (pageNumber: number, xPct: number, yPct: number, duration?: number) => string;
    addPulsingHighlight: (pageNumber: number, xPct: number, yPct: number) => string;
  };
};