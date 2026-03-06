import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Activity, Calendar, FileUp, CheckCircle2, WifiOff, UploadCloud, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiClient, type HealthStatus } from '../api/apiClient';
import { useCsvData } from '../context/CsvContext';

const Layout = () => {
    const { uploadAndAnalyze, isAnalyzing, result, clearData } = useCsvData();
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [healthError, setHealthError] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Live health check every 30 seconds
    useEffect(() => {
        const check = async () => {
            try {
                const s = await apiClient.checkHealth();
                setHealth(s);
                setHealthError(false);
            } catch {
                setHealth(null);
                setHealthError(true);
            }
        };
        check();
        const id = setInterval(check, 30_000);
        return () => clearInterval(id);
    }, []);

    const handleUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            await uploadAndAnalyze(file);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 4000);
        };
        input.click();
    };

    return (
        <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden selection:bg-cyan-500/30">

            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl flex flex-col items-start p-4 shrink-0 relative z-20">
                <div className="flex items-center gap-3 w-full px-2 py-4 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Apex Debug
                    </span>
                </div>

                <nav className="flex flex-col gap-2 w-full">
                    <NavLink to="/" end className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                        isActive ? "bg-white/10 text-cyan-400 shadow-[inset_0_1px_rgba(255,255,255,0.1)]"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    )}>
                        <Activity className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                    </NavLink>
                    <NavLink to="/plan" className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                        isActive ? "bg-white/10 text-purple-400 shadow-[inset_0_1px_rgba(255,255,255,0.1)]"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    )}>
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">Regression Planner</span>
                    </NavLink>
                </nav>

                {/* Active CSV indicator */}
                {result && (
                    <div className="mt-4 w-full px-3 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-cyan-300">Active Dataset</p>
                            <button onClick={clearData} className="text-slate-500 hover:text-red-400 transition-colors" title="Clear data">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate" title={result.filename}>{result.filename}</p>
                        <p className="text-[10px] text-slate-500">{result.summary.total_runs} runs analysed</p>
                    </div>
                )}

                {/* Model health status */}
                <div className="mt-auto w-full">
                    <div className={cn(
                        "px-3 py-4 rounded-xl border transition-all duration-500",
                        healthError ? "bg-gradient-to-br from-red-950/60 to-black border-red-500/20"
                            : "bg-gradient-to-br from-slate-900 to-black border-white/5"
                    )}>
                        <p className="text-xs text-slate-500 text-center">System Status</p>
                        <div className="flex items-center gap-2 justify-center mt-2">
                            {healthError ? (
                                <><WifiOff className="w-3.5 h-3.5 text-red-400" /><span className="text-sm text-red-400 font-medium">Model Offline</span></>
                            ) : health ? (
                                <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-sm text-emerald-400 font-medium">Model Online</span></>
                            ) : (
                                <><div className="w-3 h-3 border border-slate-500 border-t-slate-300 rounded-full animate-spin" /><span className="text-sm text-slate-400">Checking…</span></>
                            )}
                        </div>
                        {health && (
                            <p className="text-[10px] text-slate-600 text-center mt-1">
                                {health.features} features · {health.model}
                            </p>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col relative overflow-hidden z-10 w-full h-full">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />

                {/* Top header */}
                <header className="h-20 w-full border-b border-white/5 bg-slate-950/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex-1" />
                    <div className="flex items-center gap-3">

                        {isAnalyzing && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm">
                                <div className="w-3.5 h-3.5 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                Analysing…
                            </div>
                        )}

                        {uploadSuccess && !isAnalyzing && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 className="w-4 h-4" />
                                CSV Analysed!
                            </div>
                        )}

                        {/* Clear button if data loaded */}
                        {result && (
                            <button
                                onClick={clearData}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-900 border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                            >
                                <X className="w-4 h-4" />
                                Clear Data
                            </button>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={isAnalyzing}
                            className={cn(
                                "group relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 overflow-hidden",
                                "bg-slate-900 border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]",
                                isAnalyzing && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            {isAnalyzing ? (
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-cyan-400 rounded-full animate-spin" />
                            ) : result ? (
                                <UploadCloud className="w-4 h-4 text-cyan-400 group-hover:-translate-y-0.5 transition-transform duration-300" />
                            ) : (
                                <FileUp className="w-4 h-4 text-cyan-400 group-hover:-translate-y-0.5 transition-transform duration-300" />
                            )}
                            <span className="relative z-10 text-slate-200 group-hover:text-white transition-colors">
                                {isAnalyzing ? "Analysing…" : result ? "Upload New CSV" : "Upload CSV"}
                            </span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
