/**
 * RTL Verification — API Client
 * All fetch calls target the ML Flask server on http://localhost:5001.
 * Uses cache:"no-store" so stale results never appear when backend is off.
 * The primary analysis flow is: uploadAndAnalyze() via CsvContext.
 * This file handles /health, /predict (run details), and /regression-plan.
 */

export const ML_BASE = import.meta.env.VITE_ML_API_URL || "https://karthik7133-sand-disk.hf.space";

// Re-export types used across components
export type { AnalyzedRun, AnalysisSummary, AnalysisResult } from '../context/CsvContext';

// ── DetailsPanel run details (from /predict) ──────────────────────────────────
export interface RunDetails {
    failure_probability_pct: number;
    risk_level: string;
    result: string;
    explanation: string;
}

// ── Regression Planner types ──────────────────────────────────────────────────
export interface PlanSummary {
    selected_tests: number;
    total_runtime: string;
    coverage: string;
    time_saved: string;
}

export interface PlanItem {
    rank: number;
    test_name: string;
    module: string;
    risk: number;
    runtime: string;
    reason: string;
}

export interface RegressionPlan {
    summary: PlanSummary;
    plan: PlanItem[];
}

export interface HealthStatus {
    status: string;
    model: string;
    features: number;
    timestamp: string;
}

// ── API Client ────────────────────────────────────────────────────────────────
export const apiClient = {

    /** Health check — used by Layout sidebar to show model status */
    checkHealth: async (): Promise<HealthStatus> => {
        console.log(`[Client] GET ${ML_BASE}/health`);
        const res = await fetch(`${ML_BASE}/health`, { cache: "no-store" });
        if (!res.ok) throw new Error("Health check failed");
        const data = await res.json();
        console.log(`[Client] Health: ${data.status} — ${data.features} features`);
        return data;
    },

    /**
     * Gets ML prediction for a specific run (used by DetailsPanel).
     */
    getRunDetails: async (run: any, modelId: string = "model_1"): Promise<RunDetails> => {
        const payload = {
            code_coverage: run.code_coverage,
            functional_coverage: run.functional_coverage,
            assertions_failed: run.assertions_failed,
            simulation_time: run.simulation_time ?? 200,
            lines_modified: run.lines_modified,
            prior_failures: run.prior_failures,
            engineer_experience: run.engineer_experience,
            module: run.module,
            test_name: run.test_name,
            model_id: modelId
        };
        console.log(`[Client] POST ${ML_BASE}/predict`, payload);
        const res = await fetch(`${ML_BASE}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            cache: "no-store",
        });
        if (!res.ok) throw new Error(`Predict API error: ${res.status}`);
        const data = await res.json();
        console.log(`[Client] Predict result: ${data.result} — ${data.failure_probability_pct}%`);
        return {
            failure_probability_pct: data.failure_probability_pct,
            risk_level: data.risk_level,
            result: data.result,
            explanation: data.explanation,
        };
    },

    /**
     * POST /regression-plan
     * Sends the user's uploaded runs + time budget. Returns optimized order.
     */
    getSmartPlan: async (runs: any[], budgetSeconds: number, modelId: string = "model_1"): Promise<RegressionPlan> => {
        console.log(`[Client] POST ${ML_BASE}/regression-plan — ${runs.length} runs, model: ${modelId}`);
        const res = await fetch(`${ML_BASE}/regression-plan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ runs, time_budget: budgetSeconds, model_id: modelId }),
            cache: "no-store",
        });
        if (!res.ok) throw new Error(`Regression-plan API error: ${res.status}`);
        const json = await res.json();
        console.log(`[Client] Plan: ${json.selected_count} selected, ${json.total_estimated_time}s`);

        const totalSubmitted = runs.length;
        const skippedPct = totalSubmitted > 0
            ? Math.round((1 - json.selected_count / totalSubmitted) * 100)
            : 0;

        const plan: PlanItem[] = (json.selected_runs as any[]).map((run: any, idx: number) => ({
            rank: idx + 1,
            test_name: run.test_name ?? "unknown_test",
            module: run.module ?? "Unknown",
            risk: run.failure_probability,
            runtime: `${run.estimated_time}s`,
            reason: run.failure_probability > 0.75
                ? "Critical risk — run immediately"
                : run.failure_probability > 0.5
                    ? "High failure probability"
                    : "Moderate complexity — include for coverage",
        }));

        return {
            summary: {
                selected_tests: json.selected_count,
                total_runtime: `${json.total_estimated_time}s`,
                coverage: `${json.coverage_pct}%`,
                time_saved: `${skippedPct}%`,
            },
            plan,
        };
    },
};
