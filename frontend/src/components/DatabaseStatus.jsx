import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  ExternalLink,
  Network,
  RefreshCw,
} from 'lucide-react';
import { getGraphStats, getHealth } from '../services/api';

const StatusCard = ({ icon, title, badge, connected, lines, href, linkLabel }) => (
  <div className="rounded-2xl border border-slate-100 bg-white/70 p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {icon}
        </div>
        <div>
          <p className="font-bold text-slate-800 flex items-center gap-2">
            {title}
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {badge}
            </span>
          </p>
          <p className="text-xs text-slate-400">{connected ? 'Connected' : 'Unavailable'}</p>
        </div>
      </div>
      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${connected ? 'text-emerald-600' : 'text-rose-600'}`}>
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        {connected ? 'Live' : 'Down'}
      </span>
    </div>

    <div className="space-y-1">
      {lines.map((line) => (
        <p key={line} className="text-sm text-slate-600 font-medium break-all">{line}</p>
      ))}
    </div>

    {href && (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700"
      >
        {linkLabel} <ExternalLink size={12} />
      </a>
    )}
  </div>
);

const DatabaseStatus = () => {
  const [state, setState] = useState({
    loading: true,
    health: null,
    stats: null,
    error: null,
    checkedAt: null,
  });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [healthResult, statsResult] = await Promise.allSettled([getHealth(), getGraphStats()]);
      if (cancelled) return;

      const health = healthResult.status === 'fulfilled' ? healthResult.value.data : null;
      const stats = statsResult.status === 'fulfilled' ? statsResult.value.data : null;

      setState({
        loading: false,
        health,
        stats,
        error: health ? null : 'Backend is not reachable. Start it with "npm start" in the backend folder.',
        checkedAt: new Date().toLocaleTimeString(),
      });
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = () => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    setReloadToken((token) => token + 1);
  };

  const mongodb = state.health?.databases?.mongodb;
  const neo4j = state.health?.databases?.neo4j;
  const totalNodes = state.stats?.nodes?.reduce((sum, node) => sum + node.count, 0);
  const totalRelationships = state.stats?.relationships?.reduce((sum, rel) => sum + rel.count, 0);

  const mongoLines = mongodb
    ? [
      `Database: ${mongodb.database || 'not selected'}`,
      `Host: ${mongodb.host || 'unknown'}`,
    ]
    : ['Connection details unavailable'];

  const neo4jLines = neo4j
    ? [
      `URI: ${neo4j.uri || 'not configured'}`,
      totalNodes === undefined
        ? `Database: ${neo4j.database || 'neo4j'}`
        : `${totalNodes} nodes · ${totalRelationships} relationships`,
    ]
    : ['Connection details unavailable'];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-3xl p-6 md:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Live Database Status
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-primary-50 text-primary-600 border border-primary-100">
                MongoDB + Neo4j
              </span>
            </h2>
            <p className="text-sm text-slate-500">
              Checked from <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/api/health</code> and <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/api/graph/stats</code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {state.checkedAt && !state.loading && (
              <span className="text-xs text-slate-400">Updated {state.checkedAt}</span>
            )}
            <button
              onClick={reload}
              disabled={state.loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors"
            >
              <RefreshCw size={15} className={state.loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {state.loading ? (
          <div className="py-8 text-center text-slate-500">
            <div className="mx-auto mb-3 w-8 h-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
            Checking database connections...
          </div>
        ) : state.error ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-amber-900">Cannot reach the backend</p>
              <p className="text-sm text-amber-800 mt-1">{state.error}</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <StatusCard
              icon={<Database size={20} />}
              title="MongoDB"
              badge="Document store"
              connected={Boolean(mongodb?.connected)}
              lines={mongoLines}
              href="http://localhost:5001/api/health"
              linkLabel="View health JSON"
            />
            <StatusCard
              icon={<Network size={20} />}
              title="Neo4j"
              badge="Graph store"
              connected={Boolean(neo4j?.connected)}
              lines={neo4jLines}
              href="http://localhost:7474"
              linkLabel="Open Neo4j Browser"
            />
          </div>
        )}

        {!state.loading && !state.error && (
          <p className="mt-4 text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Resumes, cover letters and interview sessions are persisted in MongoDB and mirrored into Neo4j.
          </p>
        )}
      </motion.div>
    </section>
  );
};

export default DatabaseStatus;
