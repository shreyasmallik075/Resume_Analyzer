import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Network,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { getGraphInsights } from '../services/api';

const matchColor = (value) => {
  if (value >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  if (value >= 45) return 'text-amber-600 bg-amber-50 border-amber-100';
  return 'text-rose-600 bg-rose-50 border-rose-100';
};

const matchBarColor = (value) => {
  if (value >= 75) return 'bg-emerald-500';
  if (value >= 45) return 'bg-amber-500';
  return 'bg-rose-500';
};

const GraphInsights = ({ resumeId }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(resumeId));
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!resumeId) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const response = await getGraphInsights(resumeId);
        if (cancelled) return;
        setData(response.data);
        setError(null);
      } catch (requestError) {
        if (cancelled) return;
        const status = requestError.response?.status;
        setData(null);
        setError({
          status,
          message: status === 503
            ? 'Neo4j is not connected. Start the graph database to unlock role matching and skill-gap insights.'
            : status === 404
              ? 'This resume is not in the knowledge graph yet. Analyze it again or run the graph reindex endpoint.'
              : requestError.response?.data?.message || 'Could not load graph insights.',
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resumeId, reloadToken]);

  if (!resumeId) return null;

  const reload = () => {
    setIsLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  };

  const target = data?.primaryTarget;
  const matchPercent = target?.matchPercent ?? null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl overflow-hidden"
    >
      <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Network size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Career Knowledge Graph
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                Neo4j
              </span>
            </h3>
            <p className="text-sm text-slate-500">
              Relationships between your skills, target roles, and other resumes
            </p>
          </div>
        </div>

        <button
          onClick={reload}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="p-8">
        {isLoading && (
          <div className="py-10 text-center text-slate-500">
            <div className="mx-auto mb-4 w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            Mapping your skills across the graph...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 flex gap-4">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={22} />
            <div>
              <p className="font-semibold text-amber-900">Graph insights unavailable</p>
              <p className="text-sm text-amber-800 mt-1">{error.message}</p>
              <p className="text-xs text-amber-700 mt-3">
                The rest of the app keeps working — MongoDB and all AI features are independent of Neo4j.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && data && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
                  <Target size={15} /> Target Role
                </div>
                {target ? (
                  <>
                    <div className="flex items-end justify-between gap-4 mb-3">
                      <h4 className="text-2xl font-bold text-slate-800">{target.role}</h4>
                      {matchPercent !== null && (
                        <span className={`px-3 py-1 rounded-full border text-sm font-bold ${matchColor(matchPercent)}`}>
                          {matchPercent}% fit
                        </span>
                      )}
                    </div>
                    {matchPercent !== null && (
                      <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${matchBarColor(matchPercent)} transition-all duration-700`}
                          style={{ width: `${matchPercent}%` }}
                        />
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-3">
                      {target.matchedSkills.length} of {target.requiredSkills.length} role requirements matched in the graph
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    No target role yet. Analyze a resume with a clear job title to populate this.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-6">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
                  <Sparkles size={15} /> Your Graph Profile
                </div>
                <p className="text-3xl font-extrabold text-slate-800">
                  {data.profile?.skills?.length || 0}
                  <span className="text-sm font-medium text-slate-400 ml-2">skills mapped</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {(data.profile?.skills || []).slice(0, 12).map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100 text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                  <AlertCircle size={18} className="text-amber-500" /> Skill Gaps
                </h4>
                {data.skillGaps?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.skillGaps.map((gap) => (
                      <span
                        key={`${gap.name}-${gap.importance}`}
                        className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-sm font-medium"
                      >
                        {gap.name}
                        {gap.importance === 'core' && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-rose-500">core</span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <CheckCircle size={18} /> No skill gaps detected for your target role.
                  </div>
                )}
              </div>

              <div>
                <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                  <TrendingUp size={18} className="text-emerald-500" /> Recommended Roles
                </h4>
                {data.recommendedRoles?.length > 0 ? (
                  <div className="space-y-3">
                    {data.recommendedRoles.slice(0, 4).map((role) => (
                      <div key={role.role}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-semibold text-slate-700">{role.role}</span>
                          <span className="text-slate-500">{role.matchPercent}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${matchBarColor(role.matchPercent)}`}
                            style={{ width: `${role.matchPercent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No role recommendations yet. Seed the catalog or analyze more resumes.
                  </p>
                )}
              </div>
            </div>

            {data.relatedSkills?.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                  <Network size={18} className="text-indigo-500" /> Skills Connected to Your Profile
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.relatedSkills.map((skill) => (
                    <span
                      key={skill.name}
                      className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-medium"
                    >
                      {skill.name}
                      <span className="ml-2 text-[10px] text-indigo-400">
                        {skill.coOccurrences} link{skill.coOccurrences === 1 ? '' : 's'}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
              Stored across MongoDB (documents) and Neo4j (relationships). Graph id: {data.resumeId}
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default GraphInsights;
