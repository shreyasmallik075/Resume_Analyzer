import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Target, Send, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { scoreAnswer } from '../services/api';
import AnswerScorer from '../components/AnswerScorer';
import LoadingSpinner from '../components/LoadingSpinner';

const AnswerPage = () => {
  const [searchParams] = useSearchParams();
  const question = searchParams.get('question') || 'Tell me about yourself.';
  
  const [answer, setAnswer] = useState('');
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!apiKey) {
      toast.error('Please enter your OpenAI API Key');
      return;
    }
    if (!answer.trim()) {
      toast.error('Please type your answer before submitting');
      return;
    }

    setIsLoading(true);
    try {
      const resumeId = localStorage.getItem('resumeId');
      const sessionId = localStorage.getItem('interviewSessionId');
      const response = await scoreAnswer({ question, answer, apiKey, resumeId, sessionId });
      setResult(response.data);
      toast.success('Evaluation complete!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link to="/interview" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors mb-8 group">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Questions
      </Link>

      <div className="space-y-12">
        {/* Question Display */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[2.5rem] p-10 bg-slate-900 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-primary-500/20">
            <MessageSquare size={120} />
          </div>
          <div className="relative z-10">
            <span className="inline-flex px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              Current Question
            </span>
            <h2 className="text-3xl font-bold leading-tight max-w-2xl">
              "{question}"
            </h2>
          </div>
        </motion.div>

        {!result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Config */}

            <div className="lg:col-span-3 space-y-6">
              <div className="glass-card rounded-[2.5rem] p-8 flex flex-col h-full border-primary-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl flex items-center gap-2 font-bold">
                    <Target className="text-primary-600" size={20} /> Your Answer
                  </h3>
                  <span className="text-xs font-medium text-slate-400">
                    {answer.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                
                <textarea
                  className="flex-1 input-field min-h-[300px] text-lg leading-relaxed p-6 bg-white border-none focus:ring-0 resize-none"
                  placeholder="Start typing your answer here... Use the STAR (Situation, Task, Action, Result) method for best results."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />

                <div className="mt-8">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !answer.trim()}
                    className="btn-premium w-full h-16 text-lg"
                  >
                    {isLoading ? <LoadingSpinner size="sm" color="white" /> : <><Send size={20} /> Submit for AI Scoring</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold">Performance Analysis</h3>
                <button 
                  onClick={() => setResult(null)}
                  className="text-primary-600 font-bold hover:underline"
                >
                  Try Again
                </button>
              </div>
              <AnswerScorer {...result} />
            </motion.div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 flex flex-col items-center justify-center text-center"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full" />
                <LoadingSpinner size="lg" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Analyzing Your Response</h3>
              <p className="text-slate-500 animate-pulse">Evaluating STAR structure and semantic relevancy...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnswerPage;
