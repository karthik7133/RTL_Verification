import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Activity, Calendar, FileUp, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiClient } from '../api/apiClient';

const Layout = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleUploadClick = async () => {
        setIsUploading(true);
        try {
            // Simulate file upload
            const mockFile = new File([''], 'mock.csv');
            await apiClient.uploadCSV(mockFile);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000); // Hide success badge after 3s
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden selection:bg-cyan-500/30">

            {/* Side Navigation Bar */}
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
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                            isActive
                                ? "bg-white/10 text-cyan-400 shadow-[inset_0_1px_rgba(255,255,255,0.1)]"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        )}
                    >
                        <Activity className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                    </NavLink>
                    <NavLink
                        to="/plan"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                            isActive
                                ? "bg-white/10 text-purple-400 shadow-[inset_0_1px_rgba(255,255,255,0.1)]"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        )}
                    >
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">Regression Planner</span>
                    </NavLink>
                </nav>

                <div className="mt-auto w-full">
                    <div className="px-3 py-4 rounded-xl bg-gradient-to-br from-slate-900 to-black border border-white/5">
                        <p className="text-xs text-slate-500 text-center">System Status</p>
                        <div className="flex items-center gap-2 justify-center mt-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-sm text-emerald-400 font-medium">All Models Online</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden z-10 w-full h-full">
                {/* Background glow effects */}
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />

                {/* Sticky Top Header */}
                <header className="h-20 w-full border-b border-white/5 bg-slate-950/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
                    <div className="flex-1">
                        {/* Contextual Header Content could go here */}
                    </div>

                    <div className="flex items-center gap-4">
                        {uploadSuccess && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 className="w-4 h-4" />
                                CSV Loaded
                            </div>
                        )}

                        <button
                            onClick={handleUploadClick}
                            disabled={isUploading}
                            className={cn(
                                "group relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 overflow-hidden",
                                "bg-slate-900 border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]",
                                isUploading && "opacity-80 cursor-not-allowed"
                            )}
                        >
                            {/* Button gradient background that shows on hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {isUploading ? (
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-cyan-400 rounded-full animate-spin" />
                            ) : (
                                <FileUp className="w-4 h-4 text-cyan-400 group-hover:-translate-y-0.5 transition-transform duration-300" />
                            )}
                            <span className="relative z-10 text-slate-200 group-hover:text-white transition-colors">
                                {isUploading ? "Processing..." : "Upload CSV"}
                            </span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <Outlet />
                </div>
            </main>

        </div>
    );
};

export default Layout;
