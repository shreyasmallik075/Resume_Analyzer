import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';

const AnswerScorer = ({ 
  totalScore = 0, 
  breakdown = { 
    semantic: 0, 
    keywords: 0, 
    star: 0, 
    length: 0, 
    redundancy: 0, 
    filler: 0, 
    quantification: 0, 
    actionVerbs: 0 
  },
  feedback = '',
  idealAnswer = ''
}) => {
  const features = [
    { name: 'Semantic Relevancy', key: 'semantic', weight: '45%', type: 'percent' },
    { name: 'Keyword Matching', key: 'keywords', weight: '15%', type: 'percent' },
    { name: 'STAR Method', key: 'star', weight: '25%', type: 'percent' },
    { name: 'Answer Length', key: 'length', weight: '10%', type: 'percent' },
    { name: 'Low Redundancy', key: 'redundancy', weight: '5%', type: 'percent' },
    { name: 'Filler Words', key: 'filler', weight: 'Penalty', type: 'count' },
    { name: 'Quantification', key: 'quantification', weight: 'Bonus', type: 'binary' },
    { name: 'Action Verbs', key: 'actionVerbs', weight: 'Bonus', type: 'binary' },
  ];

  const getScoreColor = (s) => {
    if (s >= 8) return 'text-emerald-500';
    if (s >= 5) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Score Card */}
        <div className="lg:col-span-1 glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center">
          <div className="mb-4">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-xs">Total Score</span>
          </div>
          <div className="relative mb-6">
            <svg className="h-40 w-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-slate-100"
              />
              <motion.circle
                initial={{ strokeDasharray: "0 440" }}
                animate={{ strokeDasharray: `${(totalScore / 10) * 440} 440` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeLinecap="round"
                className={`${getScoreColor(totalScore)}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-5xl font-extrabold ${getScoreColor(totalScore)}`}>{totalScore}</span>
              <span className="text-slate-400 text-xl font-bold ml-0.5">/10</span>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-bold">Good Attempt!</h4>
            <p className="text-slate-500 text-sm">Your answer shows strong potential with some room for optimization.</p>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-8">
          <h3 className="text-xl mb-6">Feature Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-sm border-b border-slate-100">
                  <th className="pb-4 font-medium">Feature</th>
                  <th className="pb-4 font-medium">Weight</th>
                  <th className="pb-4 font-medium">Score</th>
                  <th className="pb-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {features.map((f) => (
                  <tr key={f.key} className="group">
                    <td className="py-4 text-slate-700 font-medium group-hover:text-primary-600 transition-colors">{f.name}</td>
                    <td className="py-4 text-slate-400 text-sm">{f.weight}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {f.type === 'percent' ? (
                          <>
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${breakdown[f.key]}%` }}
                                className={`h-full ${breakdown[f.key] >= 70 ? 'bg-emerald-500' : breakdown[f.key] >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              />
                            </div>
                            <span className={`text-sm font-bold ${breakdown[f.key] >= 70 ? 'text-emerald-500' : breakdown[f.key] >= 40 ? 'text-amber-500' : 'text-rose-500'}`}>{breakdown[f.key]}%</span>
                          </>
                        ) : f.type === 'binary' ? (
                          <span className={`text-sm font-bold ${breakdown[f.key] ? 'text-emerald-500' : 'text-slate-300'}`}>
                            {breakdown[f.key] ? 'Applied' : 'Not Applied'}
                          </span>
                        ) : (
                          <span className={`text-sm font-bold ${breakdown[f.key] === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {breakdown[f.key]} words
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      {f.type === 'percent' ? (
                        breakdown[f.key] >= 70 ? <Check size={18} className="text-emerald-500" /> : 
                        breakdown[f.key] >= 40 ? <AlertCircle size={18} className="text-amber-500" /> : <X size={18} className="text-rose-500" />
                      ) : f.type === 'binary' ? (
                        breakdown[f.key] ? <Check size={18} className="text-emerald-500" /> : <Info size={18} className="text-slate-300" />
                      ) : (
                        breakdown[f.key] === 0 ? <Check size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-rose-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Feedback & Ideal Answer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <Info size={20} className="text-primary-600" />
            <h3 className="text-xl">Feedback & Suggestions</h3>
          </div>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
              {feedback || 'Great effort! Focus on using more action-oriented verbs and quantify your results to make your answer more impactful.'}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 border-primary-100 bg-primary-50/30">
          <div className="flex items-center gap-2 mb-6">
            <Check size={20} className="text-emerald-600" />
            <h3 className="text-xl">AI-Generated Ideal Answer</h3>
          </div>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-800 leading-relaxed italic font-medium">
              {idealAnswer || 'In my previous role at [Company], I faced a challenge where... I took the initiative to... As a result, we saw a 20% increase in productivity over 3 months...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerScorer;
