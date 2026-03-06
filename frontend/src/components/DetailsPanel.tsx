import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, AlertCircle, Copy, CheckCircle2, Activity } from 'lucide-react';
import type { RunDetails } from '../api/apiClient';
import type { AnalyzedRun } from '../context/CsvContext';
import { cn } from '../lib/utils';

interface DetailsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    run: AnalyzedRun | null;
    getRunDetails: (run: AnalyzedRun) => Promise<RunDetails>;
}

const MetricRow = ({ label, value, unit = '', accent = '' }: { label: string; value: number | string; unit?: string; accent?: string }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
        <span className="text-sm text-slate-400">{label}</span>
        <span className={cn("text-sm font-bold tabular-nums", accent || "text-white")}>{value}{unit}</span>
    </div>
);

const DetailsPanel: React.FC<DetailsPanelProps> = ({ isOpen, onClose, run, getRunDetails }) => {
    const [details, setDetails] = useState<RunDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && run) {
            setIsLoading(true);
            setDetails(null);
            getRunDetails(run)
                .then(setDetails)
                .catch(err => console.error('[Client] getRunDetails error:', err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, run, getRunDetails]);

    const handleCopy = () => {
        if (run?.module) { navigator.clipboard.writeText(run.module); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40" />

                    <motion.div
                        initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-[460px] bg-slate-900 border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                                    <AlertCircle className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Run Insights</h2>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {isLoading || !run ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-8 h-8 border-2 border-slate-600 border-t-purple-500 rounded-full animate-spin" />
                                    <p className="text-slate-400">Querying ML model…</p>
                                </div>
                            ) : (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-5">

                                    {/* Header card */}
                                    <div className="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <div>
                                                <p className="text-sm text-slate-400">Target Module</p>
                                                <p className="text-lg font-bold text-white mt-0.5">{(run.module ?? '—').replace(/_/g, ' ')}</p>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">{run.test_name}</p>
                                            </div>
                                            <button onClick={handleCopy} className="px-3 py-1 rounded-full bg-slate-950/50 border border-white/5 text-xs font-mono text-slate-300 flex items-center gap-2 hover:border-white/20 transition-colors">
                                                {run.module}
                                                {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </div>

                                        <div className="mt-5 flex items-end justify-between relative z-10">
                                            <div>
                                                <p className="text-sm text-slate-400 mb-1">Failure Probability</p>
                                                <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-pink-500">
                                                    {details
                                                        ? `${details.failure_probability_pct.toFixed(1)}%`
                                                        : `${run.failure_probability_pct.toFixed(1)}%`}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-sm",
                                                run.failure_probability > 0.75 ? "bg-red-500/10 border-red-500/30 text-red-400" :
                                                    run.failure_probability > 0.5 ? "bg-orange-500/10 border-orange-500/30 text-orange-400" :
                                                        run.failure_probability > 0.25 ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                                                            "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                            )}>
                                                {run.failure_probability > 0.5 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                {details?.risk_level ?? run.risk_level} RISK
                                            </div>
                                        </div>
                                    </div>

                                    {/* ML explanation */}
                                    {details?.explanation && (
                                        <div className="p-5 rounded-2xl bg-slate-950/50 border border-white/5 space-y-3">
                                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-cyan-400" /> Why this risk?
                                            </h3>
                                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                                                className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                                                <span className="text-sm text-slate-200 leading-relaxed">{details.explanation}</span>
                                            </motion.div>
                                        </div>
                                    )}

                                    {/* Coverage metrics */}
                                    <div className="p-5 rounded-2xl bg-slate-950/50 border border-white/5 space-y-1">
                                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                                            <Activity className="w-4 h-4 text-purple-400" /> Coverage Metrics
                                        </h3>
                                        <MetricRow label="Code Coverage" value={run.code_coverage} unit="%" accent={run.code_coverage < 65 ? "text-red-400" : "text-emerald-400"} />
                                        <MetricRow label="Functional Coverage" value={run.functional_coverage} unit="%" accent={run.functional_coverage < 65 ? "text-red-400" : "text-emerald-400"} />
                                        <MetricRow label="Assertions Failed" value={run.assertions_failed} accent={run.assertions_failed > 2 ? "text-red-400" : "text-white"} />
                                        <MetricRow label="Simulation Time" value={run.simulation_time} unit="s" />
                                        <MetricRow label="Lines Modified" value={run.lines_modified} accent={run.lines_modified > 150 ? "text-amber-400" : "text-white"} />
                                        <MetricRow label="Prior Failures" value={run.prior_failures} accent={run.prior_failures > 5 ? "text-amber-400" : "text-white"} />
                                        <MetricRow label="Engineer Experience" value={`${run.engineer_experience} yrs`} />
                                    </div>

                                    {/* Verdict */}
                                    {details && (
                                        <div className={cn(
                                            "p-4 rounded-2xl border text-center font-bold tracking-wider text-sm",
                                            details.result === 'Fail'
                                                ? "bg-red-500/10 border-red-500/25 text-red-400"
                                                : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                        )}>
                                            ML Verdict: {details.result === 'Fail' ? '⚠ PREDICTED FAILURE' : '✓ PREDICTED PASS'}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default DetailsPanel;
