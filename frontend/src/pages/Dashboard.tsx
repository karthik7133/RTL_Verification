import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Filter, ShieldAlert, ArrowUpDown, ChevronRight,
    UploadCloud, AlertCircle, FileSpreadsheet, Cpu, Zap
} from 'lucide-react';
import { useCsvData, type AnalyzedRun } from '../context/CsvContext';
import { apiClient } from '../api/apiClient';
import { cn } from '../lib/utils';
import DetailsPanel from '../components/DetailsPanel';

// ── Summary stat pill ────────────────────────────────────────────────────────
const StatPill = ({ label, value, accent = 'text-white' }: { label: string; value: string | number; accent?: string }) => (
    <div className="flex flex-col items-center px-4 py-3 bg-black/30 rounded-2xl border border-white/5 min-w-[105px]">
        <span className={cn("text-xl font-extrabold tracking-tight", accent)}>{value}</span>
        <span className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">{label}</span>
    </div>
);

// ── Model Selector Toggle ───────────────────────────────────────────────────
const ModelSelector = () => {
    const { selectedModelId, setSelectedModelId, isAnalyzing } = useCsvData();

    return (
        <div className="flex p-1 bg-black/40 border border-white/10 rounded-2xl w-fit self-center">
            <button
                disabled={isAnalyzing}
                onClick={() => setSelectedModelId('model_1')}
                className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                    selectedModelId === 'model_1'
                        ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                        : "text-slate-500 hover:text-slate-300"
                )}
            >
                <Cpu className="w-4 h-4" />
                XGBoost Precision
            </button>
            <button
                disabled={isAnalyzing}
                onClick={() => setSelectedModelId('model_2')}
                className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                    selectedModelId === 'model_2'
                        ? "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                        : "text-slate-500 hover:text-slate-300"
                )}
            >
                <Zap className="w-4 h-4" />
                LightGBM Speed
            </button>
        </div>
    );
};

// ── Upload prompt (shown before any CSV loaded) ───────────────────────────────
const UploadPrompt = () => {
    const { uploadAndAnalyze, isAnalyzing, error } = useCsvData();

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.name.endsWith('.csv')) uploadAndAnalyze(file);
    };

    const handleClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) uploadAndAnalyze(file);
        };
        input.click();
    };

    return (
        <div className="flex flex-col h-full items-center justify-center gap-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
            >
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select ML Engine</span>
                <ModelSelector />
            </motion.div>
            {/* Upload card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl"
            >
                <div
                    onClick={!isAnalyzing ? handleClick : undefined}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className={cn(
                        "relative border-2 border-dashed rounded-3xl p-14 flex flex-col items-center gap-5 transition-all duration-300 group",
                        isAnalyzing
                            ? "border-cyan-500/50 bg-cyan-500/5 cursor-wait"
                            : "border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.02] cursor-pointer"
                    )}
                >
                    {/* Background glow */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {isAnalyzing ? (
                        <>
                            <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
                            <p className="text-lg font-semibold text-cyan-400">Analysing your CSV…</p>
                            <p className="text-sm text-slate-500">Sending to ML model and computing predictions</p>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-inner">
                                <UploadCloud className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">Upload Verification CSV</p>
                                <p className="text-slate-400 mt-2 leading-relaxed">
                                    Drag & drop your CSV file here, or click to browse<br />
                                    <span className="text-slate-500 text-sm">Required columns: code_coverage, functional_coverage, assertions_failed,<br />simulation_time, lines_modified, prior_failures, engineer_experience, test_name, module</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                <FileSpreadsheet className="w-4 h-4 text-cyan-500" />
                                .csv files only
                            </div>
                        </>
                    )}
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                        <p className="text-sm">{error}</p>
                    </motion.div>
                )}
            </motion.div>

            {/* Sample data hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 text-xs text-slate-600 bg-white/[0.02] px-4 py-2 rounded-full border border-white/5"
            >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                Sample file available at <code className="text-slate-400 mx-1">ml_model/sample_verification_data.csv</code>
            </motion.div>
        </div>
    );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
    const { result } = useCsvData();
    const [searchTerm, setSearchTerm] = useState('');
    const [failOnly, setFailOnly] = useState(false);
    const [selectedRun, setSelectedRun] = useState<AnalyzedRun | null>(null);
    const [sortField, setSortField] = useState<keyof AnalyzedRun>('failure_probability');
    const [sortDesc, setSortDesc] = useState(true);

    const handleSort = (field: keyof AnalyzedRun) => {
        if (sortField === field) setSortDesc(!sortDesc);
        else { setSortField(field); setSortDesc(true); }
    };

    const filteredAndSorted = useMemo(() => {
        if (!result) return [];
        let rows = [...result.runs];
        if (failOnly) rows = rows.filter(r => r.result === 'Fail');
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            rows = rows.filter(r =>
                (r.module ?? '').toLowerCase().includes(lower) ||
                (r.test_name ?? '').toLowerCase().includes(lower)
            );
        }
        rows.sort((a, b) => {
            const av = a[sortField] as any, bv = b[sortField] as any;
            if (typeof av === 'string') return sortDesc ? bv.localeCompare(av) : av.localeCompare(bv);
            if (typeof av === 'number') return sortDesc ? bv - av : av - bv;
            return 0;
        });
        return rows;
    }, [result, searchTerm, failOnly, sortField, sortDesc]);

    // Show upload prompt if no CSV loaded
    if (!result) return <UploadPrompt />;

    const { summary } = result;

    return (
        <div className="flex flex-col h-full space-y-5">
            {/* Title + controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Failure Prediction
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-400">
                            ML analysis of <span className="text-cyan-400 font-medium">{result.filename}</span> · {summary.total_runs} runs
                        </span>
                        <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            result.model_id === 'model_2' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        )}>
                            {summary.model_name || (result.model_id === 'model_2' ? 'LightGBM' : 'XGBoost')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search module or test..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors w-60 shadow-inner"
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
                        <Filter className="w-4 h-4" /> FAIL only
                    </button>
                </div>
            </div>

            {/* Summary Stats Bar */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2"
            >
                <StatPill label="Total Runs" value={summary.total_runs} />
                <StatPill label="Fail Rate" value={`${summary.fail_rate_pct}%`} accent="text-red-400" />
                <StatPill label="Pass Count" value={summary.pass_count} accent="text-emerald-400" />
                <StatPill label="Fail Count" value={summary.fail_count} accent="text-rose-400" />
                <StatPill label="Accuracy" value={`${summary.model_accuracy_pct}%`} accent="text-cyan-400" />
                <StatPill label="ROC AUC" value={summary.roc_auc.toFixed(4)} accent="text-purple-400" />
                <StatPill label="Fairness" value={`${summary.fairness_score}%`} accent="text-amber-400" />
            </motion.div>

            {/* Table */}
            <div className="flex-1 min-h-0 bg-slate-900/40 border border-white/5 rounded-2xl backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-950/80 backdrop-blur-md z-10">
                            <tr>
                                {[
                                    { label: '#', field: null },
                                    { label: 'Module', field: 'module' as keyof AnalyzedRun },
                                    { label: 'Test Name', field: 'test_name' as keyof AnalyzedRun },
                                    { label: 'Status', field: 'result' as keyof AnalyzedRun },
                                    { label: 'Failure Risk', field: 'failure_probability' as keyof AnalyzedRun },
                                    { label: 'Risk Level', field: 'risk_level' as keyof AnalyzedRun },
                                    { label: '', field: null },
                                ].map(({ label, field }) => (
                                    <th
                                        key={label}
                                        onClick={() => field && handleSort(field)}
                                        className={cn(
                                            "p-4 text-sm font-semibold text-slate-300 border-b border-white/10 transition-colors",
                                            field ? "cursor-pointer hover:bg-white/5" : ""
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {label}
                                            {field && <ArrowUpDown className="w-3 h-3 text-slate-600" />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {filteredAndSorted.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-slate-500">
                                        No runs match your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSorted.map((row, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        key={idx}
                                        onClick={() => setSelectedRun(row)}
                                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                                    >
                                        <td className="p-4 font-mono text-xs text-slate-600">
                                            {String(idx + 1).padStart(2, '0')}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                                            {(row.module ?? '—').replace(/_/g, ' ')}
                                        </td>
                                        <td className="p-4 font-mono text-xs text-slate-400 group-hover:text-cyan-400 transition-colors">
                                            {row.test_name ?? '—'}
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold tracking-wider border",
                                                row.result === 'Fail'
                                                    ? "bg-red-500/10 text-red-400 border-red-500/20 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                            )}>
                                                {row.result.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3 w-44">
                                                <span className="text-sm font-bold w-14 text-slate-300">
                                                    {row.failure_probability_pct.toFixed(1)}%
                                                </span>
                                                <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${row.failure_probability * 100}%` }}
                                                        transition={{ duration: 0.8, delay: 0.1 + idx * 0.02 }}
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            row.failure_probability > 0.75
                                                                ? "bg-gradient-to-r from-red-600 to-pink-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                                                                : row.failure_probability > 0.5
                                                                    ? "bg-gradient-to-r from-orange-500 to-amber-400"
                                                                    : row.failure_probability > 0.25
                                                                        ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                                                        : "bg-gradient-to-r from-emerald-500 to-teal-400"
                                                        )}
                                                    />
                                                </div>
                                                {row.failure_probability > 0.8 && (
                                                    <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={cn(
                                                "text-xs font-bold px-2.5 py-1 rounded-lg border",
                                                row.risk_level === 'Critical' ? "bg-red-500/15 text-red-300 border-red-500/25" :
                                                    row.risk_level === 'High' ? "bg-orange-500/15 text-orange-300 border-orange-500/25" :
                                                        row.risk_level === 'Medium' ? "bg-amber-500/15 text-amber-300 border-amber-500/25" :
                                                            "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                                            )}>
                                                {row.risk_level}
                                            </span>
                                        </td>
                                        <td className="p-4">
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

            {/* Details drawer */}
            <DetailsPanel
                isOpen={selectedRun !== null}
                onClose={() => setSelectedRun(null)}
                run={selectedRun}
                getRunDetails={(run) => apiClient.getRunDetails(run, result.model_id)}
            />
        </div>
    );
};

export default Dashboard;
