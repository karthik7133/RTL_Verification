import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Target, Download, FlaskConical, AlertCircle, UploadCloud } from 'lucide-react';
import { apiClient, type RegressionPlan } from '../api/apiClient';
import { useCsvData } from '../context/CsvContext';
import { cn } from '../lib/utils';

const RegressionPlanner = () => {
    const { result: csvResult } = useCsvData();
    const [budget, setBudget] = useState<string>('500');
    const [isGenerating, setIsGenerating] = useState(false);
    const [plan, setPlan] = useState<RegressionPlan | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!csvResult) return;
        setIsGenerating(true);
        setError(null);
        try {
            // Use the uploaded CSV runs for planning (no hardcoded SAMPLE_RUNS)
            const result = await apiClient.getSmartPlan(csvResult.runs, Number(budget) || 500);
            setPlan(result);
        } catch (err: any) {
            const msg = err.message?.includes('fetch')
                ? "Cannot connect to ML API. Make sure the Flask server is running on port 5001."
                : err.message || "Unknown error";
            setError(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadCSV = () => {
        if (!plan) return;
        const headers = ['Rank', 'Test Name', 'Module', 'Risk %', 'Runtime', 'Reasoning'];
        const rows = plan.plan.map(item => [
            item.rank, item.test_name, item.module,
            `${(item.risk * 100).toFixed(1)}%`, item.runtime, `"${item.reason}"`,
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `regression_plan_${budget}s.csv` });
        a.click();
        URL.revokeObjectURL(a.href);
    };

    interface StatCardProps { icon: React.ComponentType<any>; label: string; value: string | number; highlight?: boolean; delay?: number; }
    const StatCard = ({ icon: Icon, label, value, highlight = false, delay = 0 }: StatCardProps) => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            className={cn("p-6 rounded-2xl border relative overflow-hidden group", highlight ? "bg-slate-900 border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.15)]" : "bg-slate-900 border-white/5")}>
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", highlight ? "bg-gradient-to-tr from-emerald-500/10 to-transparent" : "bg-gradient-to-tr from-white/5 to-transparent")} />
            <div className="flex items-center gap-4 relative z-10">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-inner", highlight ? "bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-slate-800 border border-white/5")}>
                    <Icon className={cn("w-6 h-6", highlight ? "text-white" : "text-cyan-400")} />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-400">{label}</p>
                    <p className={cn("text-3xl font-extrabold tracking-tight mt-1", highlight ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "text-white")}>{value}</p>
                </div>
            </div>
        </motion.div>
    );

    // Show message if no CSV uploaded yet
    if (!csvResult) {
        return (
            <div className="flex flex-col h-full items-center justify-center gap-6">
                <div className="w-24 h-24 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center shadow-inner relative">
                    <div className="absolute inset-0 rounded-full bg-purple-500/5 blur-xl pointer-events-none" />
                    <UploadCloud className="w-10 h-10 text-slate-600" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-slate-300">No Dataset Loaded</h3>
                    <p className="text-slate-500 max-w-sm text-center mt-2 leading-relaxed">
                        Upload a verification CSV on the Dashboard first, then return here to generate an optimized regression plan.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                        Smart Planner
                    </h1>
                    <p className="text-slate-400 mt-2">
                        AI-optimized order from <span className="text-cyan-400 font-medium">{csvResult.filename}</span> ({csvResult.runs.length} runs)
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/40 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-slate-300 whitespace-nowrap">Budget (seconds):</label>
                        <div className="relative">
                            <input
                                type="number" min="1" value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-28 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-center text-lg font-bold text-cyan-400 focus:outline-none focus:border-cyan-500/50 shadow-inner"
                            />
                            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-cyan-500/20 pointer-events-none" />
                        </div>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !budget}
                        className="group relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 overflow-hidden bg-slate-950 border border-white/10 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {isGenerating
                            ? <div className="w-5 h-5 border-2 border-slate-400 border-t-purple-400 rounded-full animate-spin" />
                            : <Zap className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-300" />}
                        <span className="relative z-10 text-white">{isGenerating ? "Analysing…" : "Generate Plan"}</span>
                    </button>
                </div>
            </div>

            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                    <p className="text-sm">{error}</p>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {!plan && !isGenerating ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center pt-16">
                        <div className="w-20 h-20 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center shadow-inner mb-6">
                            <FlaskConical className="w-9 h-9 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-300">Awaiting Parameters</h3>
                        <p className="text-slate-500 max-w-sm text-center mt-2 leading-relaxed">
                            Set a time budget and click <strong className="text-slate-300">Generate Plan</strong>. The ML model will rank all {csvResult.runs.length} runs by failure risk.
                        </p>
                    </motion.div>
                ) : plan ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        {/* Summary cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <StatCard icon={FlaskConical} label="Selected Tests" value={plan.summary.selected_tests} delay={0.1} />
                            <StatCard icon={Clock} label="Total Runtime" value={plan.summary.total_runtime} delay={0.2} />
                            <StatCard icon={Target} label="Run Coverage" value={plan.summary.coverage} delay={0.3} />
                            <StatCard icon={Zap} label="Tests Skipped" value={plan.summary.time_saved} highlight delay={0.4} />
                        </div>

                        {/* Plan table */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                            className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-950/50">
                                <h3 className="text-lg font-bold text-white">
                                    Recommended Execution Order
                                    <span className="ml-3 text-xs font-normal text-slate-500">({plan.plan.length} runs · budget: {budget}s)</span>
                                </h3>
                                <button onClick={handleDownloadCSV}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300 hover:text-white transition-all border border-transparent hover:border-white/10">
                                    <Download className="w-4 h-4" /> Download CSV
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-950/30">
                                        <tr>
                                            {['Rank', 'Test Name', 'Target Module', 'Failure Risk', 'Est. Time', 'Reasoning'].map(h => (
                                                <th key={h} className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider first:pl-6">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plan.plan.map((item, idx) => (
                                            <motion.tr
                                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.6 + idx * 0.07 }}
                                                key={`${item.test_name}-${idx}`}
                                                className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                                            >
                                                <td className="p-4 pl-6">
                                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                                                        idx === 0 ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]" :
                                                            idx === 1 ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-slate-800 text-slate-400")}>
                                                        {item.rank}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-sm text-slate-200 group-hover:text-cyan-400 transition-colors">{item.test_name}</td>
                                                <td className="p-4 text-sm text-slate-300">
                                                    <span className="px-2.5 py-1 rounded bg-black/50 border border-white/5">{item.module.replace(/_/g, ' ')}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("font-bold text-sm", item.risk > 0.75 ? "text-red-400" : item.risk > 0.5 ? "text-orange-400" : item.risk > 0.25 ? "text-amber-400" : "text-emerald-400")}>
                                                            {(item.risk * 100).toFixed(1)}%
                                                        </span>
                                                        <div className="w-16 h-1.5 bg-black rounded-full overflow-hidden">
                                                            <div className={cn("h-full", item.risk > 0.75 ? "bg-gradient-to-r from-red-500 to-pink-500" : item.risk > 0.5 ? "bg-gradient-to-r from-orange-500 to-amber-400" : "bg-gradient-to-r from-purple-500 to-cyan-500")}
                                                                style={{ width: `${item.risk * 100}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-slate-400">
                                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" />{item.runtime}</span>
                                                </td>
                                                <td className="p-4 text-sm text-slate-400 max-w-xs">
                                                    <p className="truncate border-l-2 border-cyan-500/50 pl-3" title={item.reason}>{item.reason}</p>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default RegressionPlanner;
