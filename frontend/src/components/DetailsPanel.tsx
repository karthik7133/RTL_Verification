import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, AlertCircle, Copy, CheckCircle2 } from 'lucide-react';
import { apiClient, type RunDetails, type DashboardPrediction } from '../api/apiClient';
import { cn } from '../lib/utils';

interface DetailsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    run: DashboardPrediction | null;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ isOpen, onClose, run }) => {
    const [details, setDetails] = useState<RunDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && run) {
            setIsLoading(true);
            apiClient.getRunDetails(run.run_id)
                .then(data => setDetails(data))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, run]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40"
                    />

                    {/* Side Drawer */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-[450px] bg-slate-900 border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                                    <AlertCircle className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Run Insights</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {isLoading || !run ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-8 h-8 border-2 border-slate-600 border-t-purple-500 rounded-full animate-spin" />
                                    <p className="text-slate-400">Loading insights...</p>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="space-y-6"
                                >
                                    {/* Card 1: Header / Probability */}
                                    <div className="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <div>
                                                <p className="text-sm text-slate-400 font-medium">Target Module</p>
                                                <p className="text-lg font-bold text-white mt-0.5">{run.module}</p>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-slate-950/50 border border-white/5 text-xs font-mono text-slate-300 flex items-center gap-2">
                                                {run.run_id}
                                                <Copy className="w-3 h-3 cursor-pointer hover:text-white transition-colors" />
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-end justify-between relative z-10">
                                            <div>
                                                <p className="text-sm text-slate-400 font-medium mb-1">Failure Probability</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-pink-500">
                                                        {details?.probability || (run.risk_score * 100).toFixed(0) + '%'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-sm shadow-[0_0_15px_rgba(0,0,0,0.2)]",
                                                run.risk_score > 0.7
                                                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                                                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                            )}>
                                                {run.risk_score > 0.7 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                {run.risk_score > 0.7 ? 'HIGH RISK' : 'LOW RISK'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 2: Explainability */}
                                    <div className="p-5 rounded-2xl bg-slate-950/50 border border-white/5 space-y-4">
                                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-cyan-400" />
                                            Why this risk?
                                        </h3>
                                        <ul className="space-y-3">
                                            {details?.explanation.map((exp, idx) => (
                                                <motion.li
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                                    key={idx}
                                                    className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                                                    <span className="text-sm text-slate-200 leading-relaxed">{exp}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Card 3: Clustering */}
                                    <div className="p-5 rounded-2xl bg-slate-950/50 border border-white/5 space-y-4">
                                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Top 3 Similar Failures</h3>
                                        <div className="space-y-2">
                                            {details?.similar_runs.map((sim, idx) => (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.4 + idx * 0.1 }}
                                                    key={idx}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all hover:translate-x-1 group border border-transparent hover:border-white/10"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                                                            {sim.run_id}
                                                        </span>
                                                        <span className="text-xs text-slate-500 px-2 py-0.5 rounded-md bg-black/50">
                                                            {sim.bug_type}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold text-cyan-400">{sim.similarity}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

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
