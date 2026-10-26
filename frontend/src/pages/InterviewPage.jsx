import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, AlertCircle, ChevronRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateQuestions } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const QuestionCard = ({ question, index, onClick }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    onClick={onClick}
    className="group glass-card rounded-2xl p-6 cursor-pointer hover:border-primary-300 transition-all active:scale-[0.98]"
  >
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-bold shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-primary-500 transition-colors">
            {question.category || 'Technical'}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
            {question.difficulty || 'Medium'}
          </span>
        </div>
        <h4 className="text-lg text-slate-800 font-semibold leading-snug group-hover:text-primary-700 transition-colors">
          {question.text || question}
        </h4>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all">
        <ChevronRight size={24} />
      </div>
    </div>
  </motion.div>
);

const InterviewPage = () => {
  const navigate = useNavigate();
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState(() => {
    const cached = localStorage.getItem('interviewQuestions');
    return cached ? JSON.parse(cached) : [];
  });
  
  // Mock questions for preview
  const defaultQuestions = [
    "Tell me about yourself and your background.",
    "What are your greatest professional strengths?",
    "Can you describe a time you faced a difficult challenge at work?",
    "Why do you want to work at this company?",
    "Where do you see yourself in five years?",
    "Tell me about a time you showed leadership.",
    "What are your salary expectations?",
    "How do you handle stress and pressure?",
    "What is your greatest professional achievement?",
    "Do you have any questions for us?"
  ];

  const handleGenerate = async () => {
    if (!apiKey) {
      toast.error('Please enter your OpenAI API Key');
      return;
    }

    const resumeAnalysis = localStorage.getItem('resumeAnalysis');
    if (!resumeAnalysis) {
      toast.error('Please analyze your resume first to get personalized questions.');
      return;
    }

    setIsLoading(true);
    try {
      const resumeId = localStorage.getItem('resumeId');
      const response = await generateQuestions({ 
        apiKey, 
        resumeId,
        resumeData: JSON.parse(resumeAnalysis) 
      });
      
      const newQuestions = Array.isArray(response.data) ? response.data : response.data.questions;
      setQuestions(newQuestions);
      localStorage.setItem('interviewQuestions', JSON.stringify(newQuestions));
      if (response.data.sessionId) {
        localStorage.setItem('interviewSessionId', response.data.sessionId);
      }
      toast.success('Questions generated successfully!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = (question) => {
    const questionText = typeof question === 'string' ? question : question.text;
    navigate(`/practice?question=${encodeURIComponent(questionText)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl mb-4">Interview Preparation</h1>
        <p className="text-slate-500 text-lg">
          Practice with realistic questions generated specifically for your profile. Select a question to start practicing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-[2.5rem] p-8 sticky top-24">
            <h3 className="text-xl mb-8 flex items-center gap-2">
              <Sparkles className="text-primary-600" size={24} /> Personalized Prep
            </h3>

            <div className="space-y-6">

              <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex gap-3">
                <div className="text-primary-600 shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-primary-900 mb-1">How it works</h5>
                  <p className="text-xs text-primary-700 leading-relaxed">
                    We use your analyzed resume data to generate highly relevant technical and behavioral questions tailored to your experience.
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="btn-premium w-full h-14"
              >
                {isLoading ? <LoadingSpinner size="sm" color="white" /> : <><Sparkles size={18} /> Generate Questions</>}
              </button>

              {!localStorage.getItem('resumeAnalysis') && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                  <div className="text-amber-600 shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <p className="text-xs text-amber-700">
                    Analyze your resume first to unlock personalized questions!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <h3 className="text-2xl flex items-center gap-3 mb-8">
              <MessageSquare className="text-primary-600" /> 
              {questions.length > 0 ? 'Your Custom Questions' : 'Sample Questions'}
            </h3>
            
            <AnimatePresence>
              {(questions.length > 0 ? questions : defaultQuestions).map((q, i) => (
                <QuestionCard 
                  key={i} 
                  question={q} 
                  index={i} 
                  onClick={() => handleQuestionClick(q)} 
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
