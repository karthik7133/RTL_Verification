import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ShieldAlert, ArrowUpDown, ChevronRight } from 'lucide-react';
import { apiClient, type DashboardPrediction } from '../api/apiClient';
import { cn } from '../lib/utils';
import DetailsPanel from '../components/DetailsPanel';

const Dashboard = () => {
    const [data, setData] = useState<DashboardPrediction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [failOnly, setFailOnly] = useState(false);
    const [selectedRun, setSelectedRun] = useState<DashboardPrediction | null>(null);

    // Sorting state
    const [sortField, setSortField] = useState<keyof DashboardPrediction>('risk_score');
    const [sortDesc, setSortDesc] = useState(true);

    useEffect(() => {
        apiClient.getDashboardPredictions().then(res => {
            setData(res);
            setIsLoading(false);
        });
    }, []);

    const handleSort = (field: keyof DashboardPrediction) => {
        if (sortField === field) {
            setSortDesc(!sortDesc);
        } else {
            setSortField(field);
            setSortDesc(true);
        }
    };

    const filteredAndSortedData = useMemo(() => {
        let result = [...data];

        // Filter
        if (failOnly) {
            result = result.filter(item => item.status === 'FAIL');
        }
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(item =>
                item.run_id.toLowerCase().includes(lower) ||
                item.module.toLowerCase().includes(lower)
            );
        }

        // Sort
        result.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDesc ? bVal - aVal : aVal - bVal;
            }
            return 0;
        });

        return result;
    }, [data, searchTerm, failOnly, sortField, sortDesc]);

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Failure Prediction
                    </h1>
                    <p className="text-slate-400 mt-1">Real-time AI analysis of targeted verification runs</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search run or module..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors w-64 shadow-inner"
                        />
                    </div>

                    <button
                        onClick={() => setFailOnly(!failOnly)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border",
                            failOnly
                                ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                : "bg-black/40 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        FAIL only
                    </button>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="flex-1 min-h-0 bg-slate-900/40 border border-white/5 rounded-2xl backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
                            <tr>
                                {/* Column Headers */}
                                <th
                                    className="p-4 text-sm font-semibold text-slate-300 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => handleSort('run_id')}
                                >
                                    <div className="flex items-center gap-2">
                                        Run ID <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                </th>
                                <th
                                    className="p-4 text-sm font-semibold text-slate-300 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => handleSort('module')}
                                >
                                    <div className="flex items-center gap-2">
                                        Module <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                </th>
                                <th
                                    className="p-4 text-sm font-semibold text-slate-300 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-2">
                                        Status <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                </th>
                                <th
                                    className="p-4 text-sm font-semibold text-slate-300 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => handleSort('risk_score')}
                                >
                                    <div className="flex items-center gap-2">
                                        Risk Score <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                </th>
                                <th className="p-4 text-sm font-semibold text-slate-300 border-b border-white/10 text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-8 h-8 border-2 border-slate-600 border-t-cyan-500 rounded-full animate-spin" />
                                            Loading predictions...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAndSortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No runs found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedData.map((row, index) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={row.run_id}
                                        onClick={() => setSelectedRun(row)}
                                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                                    >
                                        <td className="p-4 font-mono text-sm text-slate-300 group-hover:text-white transition-colors">
                                            {row.run_id}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-200">
                                            {row.module}
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold tracking-wider border",
                                                row.status === 'FAIL'
                                                    ? "bg-red-500/10 text-red-400 border-red-500/20 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                            )}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3 w-48">
                                                <span className="text-sm font-medium w-12 text-slate-300">
                                                    {(row.risk_score * 100).toFixed(0)}%
                                                </span>
                                                <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${row.risk_score * 100}%` }}
                                                        transition={{ duration: 1, delay: 0.2 + index * 0.05 }}
                                                        className={cn(
                                                            "h-full rounded-full relative",
                                                            row.risk_score > 0.7
                                                                ? "bg-gradient-to-r from-red-600 to-pink-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                                                                : row.risk_score > 0.4
                                                                    ? "bg-gradient-to-r from-amber-500 to-orange-400"
                                                                    : "bg-gradient-to-r from-emerald-500 to-teal-400"
                                                        )}
                                                    >
                                                        {/* Inner gleam */}
                                                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30" />
                                                    </motion.div>
                                                </div>
                                                {row.risk_score > 0.8 && (
                                                    <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="p-2 rounded-lg bg-white/5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Drawer */}
            <DetailsPanel
                isOpen={selectedRun !== null}
                onClose={() => setSelectedRun(null)}
                run={selectedRun}
            />
        </div>
    );
};

export default Dashboard;
