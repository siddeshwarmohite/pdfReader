import { useEffect, useCallback, useRef } from 'react';
import { usePdfContext } from '../context/PdfContext';

interface UsePdfNavigationOptions {
  autoSync?: boolean;
  scrollThreshold?: number;
  debounceDelay?: number;
}

interface UsePdfNavigationReturn {
  navigateToPage: (page: number) => void;
  navigateToSection: (sectionId: number) => void;
  syncCurrentPageWithAnalysis: () => void;
  getCurrentSection: () => number | null;
}

export const usePdfNavigation = (
  options: UsePdfNavigationOptions = {}
): UsePdfNavigationReturn => {
  const {
    autoSync = true,
    scrollThreshold = 100,
    debounceDelay = 300,
  } = options;

  const { state, navigateToPage, setActiveSection } = usePdfContext();
  const debounceTimerRef = useRef<number | null>(null);
  const lastPageRef = useRef<number>(state.currentPage);
  const lastSectionRef = useRef<number | null>(state.activeSection);

  // Find which analysis section corresponds to current page
  const getCurrentSection = useCallback((): number | null => {
    if (!state.analysisSections.length) return null;

    // Find the section that best matches the current page
    let bestMatch: number | null = null;
    let smallestDistance = Infinity;

    state.analysisSections.forEach((section) => {
      const distance = Math.abs(section.pageRef - state.currentPage);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        bestMatch = section.id;
      }
    });

    // Only return a match if it's within a reasonable threshold
    return smallestDistance <= scrollThreshold ? bestMatch : null;
  }, [state.analysisSections, state.currentPage, scrollThreshold]);

  // Navigate to a specific page and sync analysis
  const handleNavigateToPage = useCallback((page: number) => {
    navigateToPage(page);
    
    // Debounce the analysis sync to avoid rapid updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = window.setTimeout(() => {
      const correspondingSection = getCurrentSection();
      if (correspondingSection && correspondingSection !== state.activeSection) {
        setActiveSection(correspondingSection);
      }
    }, debounceDelay);
  }, [navigateToPage, getCurrentSection, setActiveSection, state.activeSection, debounceDelay]);

  // Navigate to a specific analysis section and sync PDF
  const navigateToSection = useCallback((sectionId: number) => {
    const section = state.analysisSections.find(s => s.id === sectionId);
    if (section) {
      setActiveSection(sectionId);
      navigateToPage(section.pageRef);
    }
  }, [state.analysisSections, setActiveSection, navigateToPage]);

  // Sync current page with analysis panel
  const syncCurrentPageWithAnalysis = useCallback(() => {
    const correspondingSection = getCurrentSection();
    if (correspondingSection !== state.activeSection) {
      setActiveSection(correspondingSection);
    }
  }, [getCurrentSection, setActiveSection, state.activeSection]);

  // Auto-sync when page changes (if enabled)
  useEffect(() => {
    if (!autoSync) return;

    const hasPageChanged = state.currentPage !== lastPageRef.current;
    const hasSectionChanged = state.activeSection !== lastSectionRef.current;

    if (hasPageChanged) {
      lastPageRef.current = state.currentPage;
      
      // Debounce sync to avoid excessive updates during scrolling
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = window.setTimeout(() => {
        syncCurrentPageWithAnalysis();
      }, debounceDelay);
    }

    if (hasSectionChanged) {
      lastSectionRef.current = state.activeSection;
    }
  }, [state.currentPage, state.activeSection, autoSync, syncCurrentPageWithAnalysis, debounceDelay]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Advanced navigation patterns
  const navigateToNextSection = useCallback(() => {
    if (!state.activeSection) {
      // If no active section, go to first section
      if (state.analysisSections.length > 0) {
        navigateToSection(state.analysisSections[0].id);
      }
      return;
    }

    const currentIndex = state.analysisSections.findIndex(s => s.id === state.activeSection);
    if (currentIndex < state.analysisSections.length - 1) {
      navigateToSection(state.analysisSections[currentIndex + 1].id);
    }
  }, [state.activeSection, state.analysisSections, navigateToSection]);

  const navigateToPrevSection = useCallback(() => {
    if (!state.activeSection) {
      // If no active section, go to last section
      if (state.analysisSections.length > 0) {
        const lastSection = state.analysisSections[state.analysisSections.length - 1];
        navigateToSection(lastSection.id);
      }
      return;
    }

    const currentIndex = state.analysisSections.findIndex(s => s.id === state.activeSection);
    if (currentIndex > 0) {
      navigateToSection(state.analysisSections[currentIndex - 1].id);
    }
  }, [state.activeSection, state.analysisSections, navigateToSection]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events when not in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            navigateToPrevSection();
          }
          break;
        case 'ArrowDown':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            navigateToNextSection();
          }
          break;
        case 'Home':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (state.analysisSections.length > 0) {
              navigateToSection(state.analysisSections[0].id);
            }
          }
          break;
        case 'End':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (state.analysisSections.length > 0) {
              const lastSection = state.analysisSections[state.analysisSections.length - 1];
              navigateToSection(lastSection.id);
            }
          }
          break;
        case 'g':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Could implement "go to page" dialog here
            console.log('Go to page shortcut pressed');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigateToNextSection, navigateToPrevSection, navigateToSection, state.analysisSections]);

  return {
    navigateToPage: handleNavigateToPage,
    navigateToSection,
    syncCurrentPageWithAnalysis,
    getCurrentSection,
  };
};