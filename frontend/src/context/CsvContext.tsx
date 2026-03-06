import React, { createContext, useContext, useState, useCallback } from 'react';

const ML_BASE = "http://localhost:5001";

// ── Shared types ──────────────────────────────────────────────────────────────
export interface AnalyzedRun {
    // Raw fields from CSV
    code_coverage: number;
    functional_coverage: number;
    assertions_failed: number;
    simulation_time: number;
    lines_modified: number;
    prior_failures: number;
    engineer_experience: number;
    test_name: string;
    module: string;
    // ML predictions
    failure_probability: number;
    failure_probability_pct: number;
    result: "Pass" | "Fail";
    risk_level: "Low" | "Medium" | "High" | "Critical";
}

export interface AnalysisSummary {
    total_runs: number;
    fail_count: number;
    pass_count: number;
    fail_rate_pct: number;
    model_accuracy_pct: number;
    roc_auc: number;
    fairness_score: number;
}

export interface AnalysisResult {
    summary: AnalysisSummary;
    runs: AnalyzedRun[];
    timestamp: string;
    filename: string;
}

interface CsvContextValue {
    result: AnalysisResult | null;
    isAnalyzing: boolean;
    error: string | null;
    uploadAndAnalyze: (file: File) => Promise<void>;
    clearData: () => void;
}

const CsvContext = createContext<CsvContextValue | null>(null);

export const CsvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadAndAnalyze = useCallback(async (file: File) => {
        setIsAnalyzing(true);
        setError(null);
        console.log(`[Client] Uploading CSV: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

        try {
            const formData = new FormData();
            formData.append("file", file);

            console.log(`[Client] POST ${ML_BASE}/analyze-csv`);
            const res = await fetch(`${ML_BASE}/analyze-csv`, {
                method: "POST",
                body: formData,
                cache: "no-store",
            });

            if (!res.ok) {
                const bodyText = await res.text().catch(() => '');
                console.error(`[Client] POST /analyze-csv failed — HTTP ${res.status}`);
                console.error(`[Client] Response body:`, bodyText);

                if (res.status === 404) {
                    throw new Error(
                        `404: /analyze-csv endpoint not found. ` +
                        `The Flask server running on port 5001 is an OLD version (started before the code update). ` +
                        `Please kill all "python api.py" processes and restart: python api.py`
                    );
                }
                let errMsg = `Server error: ${res.status}`;
                try { errMsg = JSON.parse(bodyText).error || errMsg; } catch { }
                throw new Error(errMsg);
            }

            const json = await res.json();
            console.log(`[Client] Analysis received: ${json.runs?.length} runs`);

            setResult({
                summary: json.summary,
                runs: json.runs,
                timestamp: json.timestamp,
                filename: file.name,
            });
        } catch (err: any) {
            const msg = err.message?.includes("fetch")
                ? "Cannot connect to ML API. Make sure the Flask server is running on port 5001."
                : err.message || "Unknown error";
            console.error(`[Client] Upload error: ${msg}`);
            setError(msg);
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    const clearData = useCallback(() => {
        setResult(null);
        setError(null);
        console.log("[Client] CSV data cleared.");
    }, []);

    return (
        <CsvContext.Provider value={{ result, isAnalyzing, error, uploadAndAnalyze, clearData }}>
            {children}
        </CsvContext.Provider>
    );
};

export const useCsvData = (): CsvContextValue => {
    const ctx = useContext(CsvContext);
    if (!ctx) throw new Error("useCsvData must be used inside <CsvProvider>");
    return ctx;
};
