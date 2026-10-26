import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, Lightbulb, Download, Target } from 'lucide-react';
import { generatePDFReport } from '../utils/reportGenerator';

const ScoreDisplay = ({ 
  score = 0, 
  skills = [], 
  strengths = [], 
  weaknesses = [], 
  missingKeywords = [], 
  missing_keywords,   // backward compat alias
  suggestions = [], 
  atsFeedback = '', 
  ats_feedback,       // backward compat alias
  grammarFeedback = '', 
  grammar_feedback    // backward compat alias
}) => {
  // Normalise — accept either naming convention
  const resolvedMissingKeywords = missingKeywords.length ? missingKeywords : (missing_keywords || []);
  const resolvedAtsFeedback = atsFeedback || ats_feedback || '';
  const resolvedGrammarFeedback = grammarFeedback || grammar_feedback || '';
  const [activeTab, setActiveTab] = useState('skills');

  const getScoreColor = (s) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBg = (s) => {
    if (s >= 80) return 'bg-emerald-50';
    if (s >= 60) return 'bg-amber-50';
    return 'bg-rose-50';
  };

  const tabs = [
    { id: 'skills', label: 'Skills', icon: <CheckCircle size={16} /> },
    { id: 'strengths', label: 'Strengths', icon: <CheckCircle size={16} /> },
    { id: 'weaknesses', label: 'Weaknesses', icon: <AlertTriangle size={16} /> },
    { id: 'ats', label: 'ATS & Grammar', icon: <Target size={16} /> },
    { id: 'suggestions', label: 'Suggestions', icon: <Lightbulb size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'skills':
        return (
          <div className="space-y-4">
            <h4 className="text-slate-800 font-semibold">Identified Skills</h4>
            <div className="flex flex-wrap gap-2">
              {skills.length > 0 ? skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium border border-primary-100">
                  {skill}
                </span>
              )) : <p className="text-slate-500">No skills identified.</p>}
            </div>
            {resolvedMissingKeywords.length > 0 && (
              <div className="mt-6">
                <h4 className="text-slate-800 font-semibold mb-2">Missing Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {resolvedMissingKeywords.map((word, i) => (
                    <span key={i} className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-sm font-medium border border-rose-100">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'strengths':
        return (
          <ul className="space-y-3">
            {strengths.length > 0 ? strengths.map((item, i) => (
              <li key={i} className="flex gap-3 text-slate-700 items-start">
                <CheckCircle className="text-emerald-500 shrink-0 mt-1" size={18} />
                <span>{item}</span>
              </li>
            )) : <p className="text-slate-500">No specific strengths listed.</p>}
          </ul>
        );
      case 'weaknesses':
        return (
          <ul className="space-y-3">
            {weaknesses.length > 0 ? weaknesses.map((item, i) => (
              <li key={i} className="flex gap-3 text-slate-700 items-start">
                <XCircle className="text-rose-500 shrink-0 mt-1" size={18} />
                <span>{item}</span>
              </li>
            )) : <p className="text-slate-500">No specific weaknesses listed.</p>}
          </ul>
        );
      case 'ats':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-slate-800 font-semibold flex items-center gap-2 mb-2">
                <Target size={18} className="text-primary-600" /> ATS Optimization
              </h4>
              <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{resolvedAtsFeedback || 'No ATS feedback available.'}</p>
            </div>
            <div>
              <h4 className="text-slate-800 font-semibold flex items-center gap-2 mb-2">
                <Info size={18} className="text-primary-600" /> Grammar & Tone
              </h4>
              <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{resolvedGrammarFeedback || 'No grammar feedback available.'}</p>
            </div>
          </div>
        );
      case 'suggestions':
        return (
          <ul className="space-y-3">
            {suggestions.length > 0 ? suggestions.map((item, i) => (
              <li key={i} className="flex gap-3 text-slate-700 items-start">
                <Lightbulb className="text-amber-500 shrink-0 mt-1" size={18} />
                <span>{item}</span>
              </li>
            )) : <p className="text-slate-500">No suggestions available.</p>}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-card rounded-3xl overflow-hidden animate-slide-up">
      <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
        {/* Score Circle */}
        <div className="relative h-48 w-48 shrink-0">
          <svg className="h-full w-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-100"
            />
            <motion.circle
              initial={{ strokeDasharray: "0 502" }}
              animate={{ strokeDasharray: `${(score / 100) * 502} 502` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeLinecap="round"
              className={`${getScoreColor(score)}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-extrabold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-slate-500 font-medium text-sm">Overall Score</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-2xl mb-2">Analysis Result</h3>
          <p className="text-slate-600 mb-6">
            Your resume has been analyzed using our AI engine. We've identified key areas of improvement to help you land your dream job.
          </p>
          <div className="flex gap-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${getScoreBg(score)} ${getScoreColor(score)}`}>
              {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'}
            </div>
            <button 
              onClick={() => generatePDFReport({ score, skills, strengths, weaknesses, missingKeywords: resolvedMissingKeywords, suggestions, atsFeedback: resolvedAtsFeedback, grammarFeedback: resolvedGrammarFeedback })}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full font-semibold text-sm hover:bg-slate-800 transition-colors"
            >
              <Download size={16} /> Download PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-slate-100">
        <div className="flex overflow-x-auto no-scrollbar bg-slate-50/50 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay;
