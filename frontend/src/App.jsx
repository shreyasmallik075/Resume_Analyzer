import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import ResumePage from './pages/ResumePage';
import CoverLetterPage from './pages/CoverLetterPage';
import InterviewPage from './pages/InterviewPage';
import AnswerPage from './pages/AnswerPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#1e293b',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
          }}
        />
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/cover-letter" element={<CoverLetterPage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/practice" element={<AnswerPage />} />
            <Route path="/practice/:question" element={<AnswerPage />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-slate-400 text-sm font-medium">
              © 2026 AI Interview Ready. Built with ❤️ for career excellence.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
