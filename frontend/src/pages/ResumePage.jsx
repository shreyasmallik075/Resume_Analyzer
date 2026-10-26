import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeText, uploadResume } from '../services/api';
import ScoreDisplay from '../components/ScoreDisplay';
import ATSHighlighter from '../components/ATSHighlighter';
import GraphInsights from '../components/GraphInsights';
import LoadingSpinner from '../components/LoadingSpinner';

const ResumePage = () => {
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(() => {
    // Restore the last analysis so it survives a page reload.
    const cached = localStorage.getItem('resumeAnalysis');
    return cached ? JSON.parse(cached) : null;
  });
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'text'
  const [savedResumeId, setSavedResumeId] = useState(() => localStorage.getItem('resumeId'));

  const handleAnalyze = async () => {
    if (!apiKey) {
      toast.error('Please enter your OpenAI API Key');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      if (inputMode === 'upload') {
        if (!file) {
          toast.error('Please select a file');
          setIsLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('apiKey', apiKey);
        response = await uploadResume(formData);
      } else {
        if (!resumeText.trim()) {
          toast.error('Please paste your resume text');
          setIsLoading(false);
          return;
        }
        response = await analyzeText({ text: resumeText, apiKey });
      }

      setResult(response.data);
      localStorage.setItem('resumeAnalysis', JSON.stringify(response.data));
      if (response.data.resumeId) {
        localStorage.setItem('resumeId', response.data.resumeId);
        setSavedResumeId(response.data.resumeId);
      }
      if (response.data.resumeText) setResumeText(response.data.resumeText);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl mb-4">Resume Analyzer</h1>
        <p className="text-slate-500 text-lg">
          Upload your resume and get instant feedback on how to optimize it for ATS and hiring managers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel: Inputs */}
        <div className="lg:col-span-1 space-y-6">

          <div className="glass-card rounded-3xl p-8">
            <h3 className="text-xl mb-6 flex items-center gap-2">
              <Upload className="text-primary-600" size={20} /> Resume Input
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => setInputMode('upload')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${inputMode === 'upload' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500'}`}
              >
                Upload File
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${inputMode === 'text' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-500'}`}
              >
                Paste Text
              </button>
            </div>

            <div className="space-y-6">
              {inputMode === 'upload' ? (
                <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-primary-400 transition-colors group cursor-pointer">
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt"
                  />
                  <div className="space-y-2">
                    <div className="mx-auto w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                      <Upload size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">
                        {file ? file.name : 'Click to upload or drag'}
                      </p>
                      <p className="text-xs text-slate-400">PDF, DOCX or TXT (Max 5MB)</p>
                    </div>
                  </div>
                </div>
              ) : (
                <textarea
                  className="input-field min-h-[200px] text-sm resize-none"
                  placeholder="Paste your resume content here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              )}

              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="btn-premium w-full h-14 mt-8 shadow-xl"
              >
                {isLoading ? <LoadingSpinner size="sm" color="white" /> : <><Sparkles size={18} /> Analyze Resume</>}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {!result && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] glass-card rounded-[2.5rem] border-dashed border-2 flex flex-col items-center justify-center text-center p-12"
              >
                <div className="bg-slate-50 p-6 rounded-full mb-6">
                  <FileText size={48} className="text-slate-300" />
                </div>
                <h3 className="text-2xl text-slate-400 mb-2">No Analysis Yet</h3>
                <p className="text-slate-400 max-w-sm">
                  Upload your resume and click analyze to see your score and recommendations.
                </p>
              </motion.div>
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center text-center"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full" />
                  <LoadingSpinner size="lg" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Analyzing Your Resume</h3>
                <p className="text-slate-500 animate-pulse">Our AI is crunching the numbers... this take a few seconds.</p>
              </motion.div>
            )}

            {result && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <ScoreDisplay {...result} />
                <ATSHighlighter resumeText={resumeText || result.resumeText} missingKeywords={result.missingKeywords || result.missing_keywords || []} />
                <GraphInsights key={savedResumeId || result.resumeId || 'none'} resumeId={savedResumeId || result.resumeId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ResumePage;
