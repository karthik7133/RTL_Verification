// Mock Data models
export interface DashboardPrediction {
    run_id: string;
    module: string;
    status: 'PASS' | 'FAIL';
    risk_score: number;
}

export interface RunDetails {
    probability: string;
    explanation: string[];
    similar_runs: Array<{
        run_id: string;
        similarity: string;
        bug_type: string;
    }>;
}

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

// Mock API Client
export const apiClient = {
    uploadCSV: async (_file: File) => {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        return { status: "success", message: "CSV Loaded", total_runs: 5000 };
    },

    getDashboardPredictions: async (): Promise<DashboardPrediction[]> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return [
            { run_id: "R-101", module: "ALU_Core", status: "FAIL", risk_score: 0.92 },
            { run_id: "R-102", module: "FPU_Add", status: "PASS", risk_score: 0.15 },
            { run_id: "R-103", module: "Mem_Ctrl", status: "FAIL", risk_score: 0.78 },
            { run_id: "R-104", module: "PCIe_Phy", status: "FAIL", risk_score: 0.88 },
            { run_id: "R-105", module: "L2_Cache", status: "PASS", risk_score: 0.05 },
            { run_id: "R-106", module: "UART_Rx", status: "FAIL", risk_score: 0.65 },
            { run_id: "R-107", module: "I2C_Master", status: "PASS", risk_score: 0.12 },
            { run_id: "R-108", module: "ALU_Core", status: "FAIL", risk_score: 0.95 },
        ];
    },

    getRunDetails: async (_runId: string): Promise<RunDetails> => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return {
            probability: "92%",
            explanation: [
                "High cyclomatic complexity (45)",
                "ALU overflow assertion failed previously",
                "Recent code churn"
            ],
            similar_runs: [
                { run_id: "R-089", similarity: "88%", bug_type: "Timing_Violation" },
                { run_id: "R-012", similarity: "82%", bug_type: "Logic_Error" },
                { run_id: "R-045", similarity: "76%", bug_type: "State_Machine_Stuck" }
            ]
        };
    },

    getSmartPlan: async (_budgetMinutes: number): Promise<RegressionPlan> => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
            summary: {
                selected_tests: 12,
                total_runtime: "18.5 mins",
                coverage: "94%",
                time_saved: "85%"
            },
            plan: [
                { rank: 1, test_name: "alu_rand_test", module: "ALU_Core", risk: 0.95, runtime: "1.2m", reason: "Max risk coverage" },
                { rank: 2, test_name: "fpu_corner_cases", module: "FPU_Add", risk: 0.89, runtime: "2.1m", reason: "High code churn" },
                { rank: 3, test_name: "mem_stress_test", module: "Mem_Ctrl", risk: 0.85, runtime: "3.5m", reason: "Historical failure density" },
                { rank: 4, test_name: "pcie_link_training", module: "PCIe_Phy", risk: 0.82, runtime: "4.0m", reason: "Critical path timing issues" },
                { rank: 5, test_name: "uart_baud_sweep", module: "UART_Rx", risk: 0.76, runtime: "1.5m", reason: "High complexity score" },
            ]
        };
    }
};
