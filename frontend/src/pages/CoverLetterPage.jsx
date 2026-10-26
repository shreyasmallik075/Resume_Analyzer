import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Briefcase, Building, FileText, Copy, Download, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateCoverLetter } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const CoverLetterPage = () => {
  const [formData, setFormData] = useState({
    jobRole: '',
    company: '',
    jobDescription: '',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    resumeId: localStorage.getItem('resumeId') || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    if (!formData.apiKey) {
      toast.error('Please enter your OpenAI API Key');
      return;
    }
    if (!formData.jobRole || !formData.company) {
      toast.error('Please fill in Job Role and Company Name');
      return;
    }

    setIsLoading(true);
    try {
      const response = await generateCoverLetter(formData);
      setGeneratedLetter(response.data.coverLetter);
      toast.success('Cover letter generated successfully!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast.success('Copied to clipboard!');
  };

  const downloadAsTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedLetter], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Cover_Letter_${formData.company.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    toast.success('Downloading...');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl mb-4">AI Cover Letter Generator</h1>
        <p className="text-slate-500 text-lg">
          Create professional, tailored cover letters that stand out and showcase your best skills.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card rounded-[2.5rem] p-8 md:p-10">
            <h3 className="text-xl mb-8 flex items-center gap-2">
              <Mail className="text-primary-600" size={24} /> Job Details
            </h3>
            
            <div className="space-y-6">

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Briefcase size={14} /> Job Role
                </label>
                <input
                  type="text"
                  name="jobRole"
                  className="input-field"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formData.jobRole}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Building size={14} /> Company Name
                </label>
                <input
                  type="text"
                  name="company"
                  className="input-field"
                  placeholder="e.g. Google"
                  value={formData.company}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <FileText size={14} /> Job Description (Optional)
                </label>
                <textarea
                  name="jobDescription"
                  className="input-field min-h-[150px] resize-none"
                  placeholder="Paste the job description for better personalization..."
                  value={formData.jobDescription}
                  onChange={handleChange}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="btn-premium w-full h-14 mt-8 shadow-xl"
              >
                {isLoading ? <LoadingSpinner size="sm" color="white" /> : <><Sparkles size={18} /> Generate Letter</>}
              </button>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!generatedLetter && !isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[500px] glass-card rounded-[2.5rem] border-dashed border-2 flex flex-col items-center justify-center text-center p-12"
              >
                <div className="bg-primary-50 p-6 rounded-full mb-6">
                  <Mail size={48} className="text-primary-300" />
                </div>
                <h3 className="text-2xl text-slate-400 mb-2">Ready to Write</h3>
                <p className="text-slate-400 max-w-sm">
                  Fill in the job details and let our AI craft a compelling cover letter for you.
                </p>
              </motion.div>
            ) : isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[500px] flex flex-col items-center justify-center text-center"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full" />
                  <LoadingSpinner size="lg" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Generating Your Letter</h3>
                <p className="text-slate-500 animate-pulse">Personalizing based on your resume and JD...</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-[2.5rem] overflow-hidden flex flex-col h-full"
              >
                <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="ml-2 text-slate-400 text-sm font-mono">GeneratedCoverLetter.txt</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy size={18} />
                    </button>
                    <button 
                      onClick={downloadAsTxt}
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                      title="Download as TXT"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>
                <textarea
                  className="flex-1 p-10 bg-white text-slate-700 font-inter leading-relaxed text-lg outline-none resize-none min-h-[500px]"
                  value={generatedLetter}
                  onChange={(e) => setGeneratedLetter(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterPage;
