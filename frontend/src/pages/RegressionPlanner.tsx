import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Target, Download, FlaskConical, Activity } from 'lucide-react';
import { apiClient, type RegressionPlan } from '../api/apiClient';
import { cn } from '../lib/utils';

const RegressionPlanner = () => {
    const [budget, setBudget] = useState<string>('20');
    const [isGenerating, setIsGenerating] = useState(false);
    const [plan, setPlan] = useState<RegressionPlan | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await apiClient.getSmartPlan(Number(budget) || 0);
            setPlan(result);
        } catch (error) {
            console.error("Failed to generate plan", error);
        } finally {
            setIsGenerating(false);
        }
    };

    interface StatCardProps {
        icon: React.ComponentType<any>;
        label: string;
        value: string | number;
        highlight?: boolean;
        delay?: number;
    }

    const StatCard = ({ icon: Icon, label, value, highlight = false, delay = 0 }: StatCardProps) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={cn(
                "p-6 rounded-2xl border relative overflow-hidden group",
                highlight
                    ? "bg-slate-900 border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                    : "bg-slate-900 border-white/5"
            )}
        >
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                highlight
                    ? "bg-gradient-to-tr from-emerald-500/10 to-transparent"
                    : "bg-gradient-to-tr from-white/5 to-transparent"
            )} />

            <div className="flex items-center gap-4 relative z-10">
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-inner",
                    highlight
                        ? "bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        : "bg-slate-800 border border-white/5"
                )}>
                    <Icon className={cn("w-6 h-6", highlight ? "text-white" : "text-cyan-400")} />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-400">{label}</p>
                    <p className={cn(
                        "text-3xl font-extrabold tracking-tight mt-1",
                        highlight ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "text-white"
                    )}>
                        {value}
                    </p>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="flex flex-col h-full space-y-8 max-w-7xl mx-auto w-full">
            {/* Header & Input Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                        Smart Planner
                    </h1>
                    <p className="text-slate-400 mt-2">Optimize execution order for maximum risk coverage under budget</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/40 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-slate-300 whitespace-nowrap">Budget (mins):</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-24 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-center text-lg font-bold text-cyan-400 focus:outline-none focus:border-cyan-500/50 shadow-inner"
                            />
                            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-cyan-500/20 pointer-events-none" />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !budget}
                        className="group relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 overflow-hidden bg-slate-950 border border-white/10 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] w-full sm:w-auto"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {isGenerating ? (
                            <div className="w-5 h-5 border-2 border-slate-400 border-t-purple-400 rounded-full animate-spin" />
                        ) : (
                            <Zap className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                        )}
                        <span className="relative z-10 text-white group-hover:text-purple-100 transition-colors">
                            {isGenerating ? "Analyzing..." : "Generate Plan"}
                        </span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!plan && !isGenerating ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col items-center justify-center pt-20"
                    >
                        <div className="w-24 h-24 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center shadow-inner mb-6 relative">
                            <div className="absolute inset-0 rounded-full bg-cyan-500/5 blur-xl pointer-events-none" />
                            <Activity className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-300">Awaiting Parameters</h3>
                        <p className="text-slate-500 max-w-md text-center mt-2 leading-relaxed">
                            Enter your target execution budget and generate an AI-optimized test suite order to maximize defect discovery.
                        </p>
                    </motion.div>
                ) : plan ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Summary Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 ml:grid-cols-4 gap-4">
                            <StatCard
                                icon={FlaskConical}
                                label="Selected Tests"
                                value={plan.summary.selected_tests}
                                delay={0.1}
                            />
                            <StatCard
                                icon={Clock}
                                label="Total Runtime"
                                value={plan.summary.total_runtime}
                                delay={0.2}
                            />
                            <StatCard
                                icon={Target}
                                label="Risk Coverage"
                                value={plan.summary.coverage}
                                delay={0.3}
                            />
                            <StatCard
                                icon={Zap}
                                label="Time Saved"
                                value={plan.summary.time_saved}
                                highlight
                                delay={0.4}
                            />
                        </div>

                        {/* Plan Table */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-950/50">
                                <h3 className="text-lg font-bold text-white tracking-wide">Recommended Execution Order</h3>
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300 hover:text-white transition-all border border-transparent hover:border-white/10">
                                    <Download className="w-4 h-4" />
                                    Download CSV
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-950/30">
                                        <tr>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider pl-6">Rank</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Test Name</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Target Module</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Risk Prio</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cost</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Reasoning</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plan.plan.map((item, index) => (
                                            <motion.tr
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.6 + index * 0.1 }}
                                                key={item.test_name}
                                                className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                                            >
                                                <td className="p-4 pl-6">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                                                        index === 0 ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]" :
                                                            index === 1 ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                                                                "bg-slate-800 text-slate-400"
                                                    )}>
                                                        {item.rank}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-sm text-slate-200 font-medium group-hover:text-cyan-400 transition-colors">
                                                    {item.test_name}
                                                </td>
                                                <td className="p-4 text-sm text-slate-300">
                                                    <span className="px-2.5 py-1 rounded bg-black/50 border border-white/5">
                                                        {item.module}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-white drop-shadow-md">
                                                            {(item.risk * 100).toFixed(0)}
                                                        </span>
                                                        <div className="w-16 h-1.5 bg-black rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                                                style={{ width: `${item.risk * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-400 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                                    {item.runtime}
                                                </td>
                                                <td className="p-4 text-sm text-slate-400 max-w-xs truncate" title={item.reason}>
                                                    <p className="truncate border-l-2 border-cyan-500/50 pl-3">
                                                        {item.reason}
                                                    </p>
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
