import { Suspense, lazy } from 'react';
import { PdfProvider } from './context/PdfContext';
import LoadingSkeleton from './components/LoadingSkeleton';
import './App.css';

const PdfViewer = lazy(() => import('./components/PdfViewer'));
const AnalysisPanel = lazy(() => import('./components/AnalysisPanel'));

function App() {
  return (
    <PdfProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-white">
        <div className="w-[75%] h-full min-w-0 border-r border-gray-200">
          <Suspense fallback={<LoadingSkeleton type="pdf" />}>
            <PdfViewer pdfUrl="/report.pdf" />
          </Suspense>
        </div>

        <div className="w-[25%] h-full min-w-0">
          <Suspense fallback={<LoadingSkeleton type="analysis" count={6} />}>
            <AnalysisPanel />
          </Suspense>
        </div>
      </div>
    </PdfProvider>
  );
}

export default App;
