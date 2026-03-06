import React, { createContext, useContext, useState, useCallback } from 'react';

const ML_BASE = import.meta.env.VITE_ML_API_URL || "http://localhost:5001";

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

export interface RunDetails {
    // Assuming RunDetails might contain similar prediction fields or more specific ones
    // For now, let's assume it returns an AnalyzedRun or a subset/superset of it.
    // This is a placeholder; the actual structure would depend on the API response.
    failure_probability: number;
    failure_probability_pct: number;
    result: "Pass" | "Fail";
    risk_level: "Low" | "Medium" | "High" | "Critical";
    // Potentially other fields specific to a single run's detailed analysis
    // e.g., feature_contributions: { [key: string]: number };
}

export interface AnalysisSummary {
    total_runs: number;
    fail_count: number;
    pass_count: number;
    fail_rate_pct: number;
    model_accuracy_pct: number;
    roc_auc: number;
    fairness_score: number;
    model_name?: string;
}

export interface AnalysisResult {
    summary: AnalysisSummary;
    runs: AnalyzedRun[];
    timestamp: string;
    filename: string;
    model_id: string;
}

interface CsvContextValue {
    result: AnalysisResult | null;
    isAnalyzing: boolean;
    error: string | null;
    uploadAndAnalyze: (file: File) => Promise<void>;
    clearData: () => void;
    setSelectedModelId: (id: string) => void;
    selectedModelId: string;
}

const CsvContext = createContext<CsvContextValue | null>(null);

export const CsvProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedModelId, setSelectedModelId] = useState<string>("model_1");

    const uploadAndAnalyze = useCallback(async (file: File) => {
        setIsAnalyzing(true);
        setError(null);
        console.log(`[Client] Uploading CSV: ${file.name} using ${selectedModelId}`);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("model_id", selectedModelId);

            console.log(`[Client] POST ${ML_BASE}/analyze-csv (model: ${selectedModelId})`);
            const res = await fetch(`${ML_BASE}/analyze-csv`, {
                method: "POST",
                body: formData,
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);

            const json = await res.json();
            console.log("[Client] Analysis complete:", json.summary);

            setResult({
                summary: json.summary,
                runs: json.runs,
                timestamp: json.timestamp,
                filename: file.name,
                model_id: json.model_id || selectedModelId
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
        <CsvContext.Provider value={{
            result,
            isAnalyzing,
            error,
            uploadAndAnalyze,
            clearData,
            selectedModelId,
            setSelectedModelId
        }}>
            {children}
        </CsvContext.Provider>
    );
};

export const useCsvData = (): CsvContextValue => {
    const ctx = useContext(CsvContext);
    if (!ctx) throw new Error("useCsvData must be used inside <CsvProvider>");
    return ctx;
};
