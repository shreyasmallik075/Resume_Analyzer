import { Target, Search } from 'lucide-react';

const ATSHighlighter = ({ resumeText = '', missingKeywords = [] }) => {
  // Simple highlighter logic: Wrap missing keywords in a span with red background
  const highlightText = (text, keywords) => {
    if (!keywords || keywords.length === 0) return text;
    
    // Escaping keywords for regex
    const escapedKeywords = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
    
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      const isMatch = keywords.some(kw => kw.toLowerCase() === part.toLowerCase());
      return isMatch ? (
        <span key={i} className="bg-rose-100 text-rose-700 font-bold px-1 rounded mx-0.5 border-b-2 border-rose-400">
          {part}
        </span>
      ) : part;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Resume Content */}
      <div className="lg:col-span-3">
        <div className="glass-card rounded-3xl p-8 h-[600px] overflow-y-auto custom-scrollbar bg-white/40">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <Target className="text-primary-600" size={24} />
            <h3 className="text-xl">Resume Keyword Analysis</h3>
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed">
            {resumeText ? highlightText(resumeText, missingKeywords) : 'Upload a resume to see keyword analysis.'}
          </div>
        </div>
      </div>

      {/* Sidebar - Missing Keywords */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-card rounded-3xl p-6 bg-slate-900 text-white shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Search size={20} className="text-primary-400" />
            <h4 className="font-semibold">Missing Keywords</h4>
          </div>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            These keywords were not found in your resume but are relevant to the job field.
          </p>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.length > 0 ? missingKeywords.map((word, i) => (
              <span key={i} className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-semibold border border-white/10">
                {word}
              </span>
            )) : <p className="text-slate-400 text-xs">No missing keywords detected.</p>}
          </div>
        </div>

        <div className="p-6 bg-primary-600 rounded-3xl text-white">
          <h4 className="font-bold mb-2">Optimization Tip</h4>
          <p className="text-primary-100 text-sm leading-relaxed">
            Try to incorporate these keywords naturally into your experience and skills sections to pass through ATS filters more easily.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ATSHighlighter;
