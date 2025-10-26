import React from 'react';
import { usePdfContext } from '../context/PdfContext';
import LoadingSkeleton from './LoadingSkeleton';

const AnalysisPanel: React.FC = () => {
  const { state, navigateToPage, addTextHighlight } = usePdfContext();

  const highlightRef1OnPage3 = () => {
    navigateToPage(3);
    setTimeout(() => {
      addTextHighlight(3, "Maersk’s results continued to improve year-on-year with consolidated revenue of USD 13.1bn (USD 12.8bn) and EBITDA of USD 2.3bn (USD 2.1bn)", '/report.pdf');
      addTextHighlight(3, "EBITDA of USD 2.3 bn", '/report.pdf');
    }, 400);
  };

  const highlightRef2OnPage5 = () => {
    navigateToPage(5);
    setTimeout(() => {
      addTextHighlight(5, "EBITDA increased to USD 2.3 bn", '/report.pdf');
      addTextHighlight(5, "Logistics & Services", '/report.pdf');
    }, 400);
  };

  const highlightRef3OnPage15 = () => {
    navigateToPage(15);
    setTimeout(() => {
      addTextHighlight(15, "Gain on sale of non-current assets", '/report.pdf');
      addTextHighlight(15, "USD 25", '/report.pdf');
    }, 400);
  };

  if (state.isLoading) {
    return <LoadingSkeleton type="analysis" count={3} />;
  }

  return (
    <div className="h-full bg-neutral-800 flex flex-col text-neutral-100 text-sm">
      {/* Header */}
      <div className="p-6 border-b border-neutral-700 bg-linear-to-r from-neutral-800 to-neutral-700">
  <h2 className="text-lg font-bold text-neutral-50 mb-2">Financial Analysis</h2>
        <p className="text-sm text-neutral-300">Static findings for quick navigation</p>
      </div>

      {/* Static Sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Finding label at top */}
          <h3 className="text-base font-semibold text-neutral-50">Finding</h3>

          {/* Section: Page 3 — Highlights Q2 2025 */}
          <div>
            <h3 className="text-base font-semibold text-neutral-50 mb-3">
              <button
                onClick={() => navigateToPage(3)}
                className="text-blue-300 hover:text-blue-200 hover:underline mr-2 cursor-pointer"
                title="Go to page 3"
              >
                Page 3
              </button>
              — Highlights Q2 2025
            </h3>
            <div className="text-neutral-100 leading-relaxed mb-4 text-sm">
              <p>
                EBITDA increase (USD 2.3 bn vs USD 2.1 bn prior year) attributed to operational improvements; no
                mention of extraordinary or one-off items.
                {' '}
                <button
                  onClick={highlightRef1OnPage3}
                  className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors"
                  title="Highlight reference [1] on page 3"
                >
                  [1]
                </button>
              </p>
            </div>
            {/* Removed standalone Go to Page 3 button as requested */}
          </div>

          {/* Section: Page 5 — Review Q2 2025 */}
          <div>
            <h3 className="text-base font-semibold text-neutral-50 mb-3">
              <button
                onClick={() => navigateToPage(5)}
                className="text-blue-300 hover:text-blue-200 hover:underline mr-2 cursor-pointer"
                title="Go to page 5"
              >
                Page 5
              </button>
              — Review Q2 2025
            </h3>
            <div className="text-neutral-100 leading-relaxed mb-4 text-sm">
              <p>
                EBITDA rise driven by higher revenue and cost control across all segments; no extraordinary gains
                or losses included.
                {' '}
                <button
                  onClick={highlightRef2OnPage5}
                  className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors"
                  title="Highlight reference [2] on page 5"
                >
                  [2]
                </button>
              </p>
            </div>
          </div>

          {/* Section: Page 15 — Condensed Income Statement */}
          <div>
            <h3 className="text-base font-semibold text-neutral-50 mb-3">
              <button
                onClick={() => navigateToPage(15)}
                className="text-blue-300 hover:text-blue-200 hover:underline mr-2 cursor-pointer"
                title="Go to page 15"
              >
                Page 15
              </button>
              — Condensed Income Statement
            </h3>
            <div className="text-neutral-100 leading-relaxed mb-4 text-sm">
              <p>
                Gain on sale of non-current assets USD 25 m (vs USD 208 m prior year) reported separately below EBITDA;
                therefore, not part of EBITDA.
                {' '}
                <button
                  onClick={highlightRef3OnPage15}
                  className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors"
                  title="Highlight reference [3] on page 15"
                >
                  [3]
                </button>
              </p>
            </div>
          </div>

          {/* Evidence section heading */}
          <hr className="opacity-20" />
          <h3 className="text-base font-semibold text-neutral-50">Evidence</h3>
          {/* Evidence list (no numbering) */}
          <div className="text-neutral-100 leading-relaxed space-y-3 text-sm">
            <p>
              <button
                onClick={highlightRef1OnPage3}
                className="inline-flex items-center px-1 py-0.5 mx-0.5 text-[11px] font-medium text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors"
                title="Reference [1] on page 3"
              >
                [1]
              </button>{' '}
              A.P. Moller – Maersk Q2 2025 Interim Report (7 Aug 2025) —{' '}
              <button
                onClick={() => navigateToPage(3)}
                className="text-blue-300 hover:text-blue-200 hover:underline cursor-pointer"
                title="Go to page 3"
              >
                Page 3
              </button>{' '}→ "Maersk's results continued to improve year-on-year … EBITDA of USD 2.3 bn (USD 2.1 bn) … driven by volume and other revenue growth in Ocean, margin improvements in Logistics & Services and significant top line growth in Terminals."
            </p>

            <p>
              <button
                onClick={highlightRef2OnPage5}
                className="inline-flex items-center px-1 py-0.5 mx-0.5 text-[11px] font-medium text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors"
                title="Reference [2] on page 5"
              >
                [2]
              </button>{' '}
              A.P. Moller – Maersk Q2 2025 Interim Report (7 Aug 2025) —{' '}
              <button
                onClick={() => navigateToPage(5)}
                className="text-blue-300 hover:text-blue-200 hover:underline cursor-pointer"
                title="Go to page 5"
              >
                Page 5
              </button>{' '}→ "EBITDA increased to USD 2.3 bn (USD 2.1 bn) … driven by higher revenue and cost management … Ocean's EBITDA … slightly increased by USD 36 m … Logistics & Services contributed significantly with a USD 71 m increase … Terminals' EBITDA increased by USD 50 m."
            </p>

            <p>
              <button
                onClick={highlightRef3OnPage15}
                className="inline-flex items-center px-1 py-0.5 mx-0.5 text-[11px] font-medium text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors"
                title="Reference [3] on page 15"
              >
                [3]
              </button>{' '}
              A.P. Moller – Maersk Q2 2025 Interim Report (7 Aug 2025) —{' '}
              <button
                onClick={() => navigateToPage(15)}
                className="text-blue-300 hover:text-blue-200 hover:underline cursor-pointer"
                title="Go to page 15"
              >
                Page 15
              </button>{' '}→ "Gain on sale of non-current assets, etc., net 25 (208) … Profit before depreciation, amortisation and impairment losses, etc. (EBITDA) 2,298"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;