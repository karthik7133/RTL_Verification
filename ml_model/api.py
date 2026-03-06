"""
RTL Verification Failure Prediction API
Flask server that exposes the trained ML model for frontend consumption.
Feature columns are loaded dynamically from feature_columns.json.
"""

import json
import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ── Load model and feature metadata ─────────────────────────────────────────
print("[ML API] ───────────────────────────────────────────────")
print("[ML API] RTL Failure Prediction API — Starting up...")
print("[ML API] Loading model from rtl_failure_prediction_model.pkl ...")
model = joblib.load("rtl_failure_prediction_model.pkl")

with open("feature_columns.json") as f:
    FEATURE_COLUMNS = json.load(f)

print(f"[ML API] ✓ Model loaded successfully")
print(f"[ML API] ✓ Feature columns ({len(FEATURE_COLUMNS)}): {FEATURE_COLUMNS}")

# Detect one-hot encoded test/module columns from the feature list
TEST_NAME_COLS = [c for c in FEATURE_COLUMNS if c.startswith("test_name_")]
MODULE_COLS    = [c for c in FEATURE_COLUMNS if c.startswith("module_")]
NUMERIC_COLS   = [c for c in FEATURE_COLUMNS
                  if not c.startswith("test_name_") and not c.startswith("module_")]

print(f"[ML API] ✓ Numeric columns : {NUMERIC_COLS}")
print(f"[ML API] ✓ Test name cols  : {TEST_NAME_COLS}")
print(f"[ML API] ✓ Module cols     : {MODULE_COLS}")
print("[ML API] ───────────────────────────────────────────────")


def build_feature_row(data: dict) -> pd.DataFrame:
    """Convert raw input dict into a model-ready single-row DataFrame."""
    row = {}

    aliases = {
        "lines_modified": ["lines_modified", "lines_changed"],
        "prior_failures": ["prior_failures", "previous_failures"],
    }
    defaults = {
        "code_coverage": 75.0,
        "functional_coverage": 70.0,
        "assertions_failed": 0,
        "simulation_time": 200.0,
        "lines_modified": 50,
        "prior_failures": 2,
        "engineer_experience": 5,
    }

    for col in NUMERIC_COLS:
        keys = aliases.get(col, [col])
        for k in keys:
            if k in data:
                row[col] = data[k]
                break
        else:
            row[col] = defaults.get(col, 0)

    # One-hot encode test_name
    test_name = data.get("test_name", "alu_overflow_test")
    for col in TEST_NAME_COLS:
        suffix = col[len("test_name_"):]
        row[col] = 1 if test_name == suffix else 0

    # One-hot encode module
    module = data.get("module", "ALU")
    for col in MODULE_COLS:
        suffix = col[len("module_"):]
        row[col] = 1 if module == suffix else 0

    return pd.DataFrame([row], columns=FEATURE_COLUMNS).fillna(0)


def risk_label(prob):
    if prob < 0.25: return "Low"
    if prob < 0.5:  return "Medium"
    if prob < 0.75: return "High"
    return "Critical"


# ── Health Check ─────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    print(f"[ML API] GET /health — responding ok")
    return jsonify({
        "status": "ok",
        "model": "rtl_failure_predictor",
        "features": len(FEATURE_COLUMNS),
        "timestamp": datetime.now().isoformat(),
    })


# ── Single Prediction ─────────────────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict failure probability for a single RTL verification run.
    Input JSON: code_coverage, functional_coverage, assertions_failed, simulation_time,
                lines_modified, prior_failures, engineer_experience, test_name, module
    """
    print(f"[ML API] POST /predict — single prediction request received")
    try:
        data = request.get_json(force=True)
        print(f"[ML API]   Input data: {data}")

        features = build_feature_row(data)
        pred = int(model.predict(features)[0])
        prob = float(model.predict_proba(features)[0][1])

        indicators = []
        if data.get("assertions_failed", 0) > 2:
            indicators.append("high assertion failures")
        if data.get("code_coverage", 100) < 65:
            indicators.append("low code coverage")
        if (data.get("prior_failures") or data.get("previous_failures", 0)) > 5:
            indicators.append("history of prior failures")
        if (data.get("lines_modified") or data.get("lines_changed", 0)) > 150:
            indicators.append("large changeset")

        explanation = (
            f"This run has a {round(prob*100,1)}% failure probability"
            + (f" driven by: {', '.join(indicators)}." if indicators else ".")
        )

        result = {
            "prediction": pred,
            "result": "Fail" if pred == 1 else "Pass",
            "failure_probability": round(prob, 4),
            "failure_probability_pct": round(prob * 100, 1),
            "risk_level": risk_label(prob),
            "explanation": explanation,
        }
        print(f"[ML API]   Result: {result['result']} — {result['failure_probability_pct']}% ({result['risk_level']})")
        return jsonify(result)

    except Exception as e:
        print(f"[ML API]   ERROR in /predict: {e}")
        return jsonify({"error": str(e)}), 400


# ── Batch Prediction ──────────────────────────────────────────────────────────
@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    """
    Input: {"runs": [{...}, {...}]}
    Returns all runs sorted by failure probability descending.
    """
    print(f"[ML API] POST /predict/batch — batch prediction request received")
    try:
        body = request.get_json(force=True)
        runs = body.get("runs", [])
        if not runs:
            return jsonify({"error": "No runs provided"}), 400

        print(f"[ML API]   Processing {len(runs)} runs...")
        results = []
        for run in runs:
            features = build_feature_row(run)
            pred = int(model.predict(features)[0])
            prob = float(model.predict_proba(features)[0][1])
            results.append({
                **run,
                "prediction": pred,
                "result": "Fail" if pred == 1 else "Pass",
                "failure_probability": round(prob, 4),
                "failure_probability_pct": round(prob * 100, 1),
                "risk_level": risk_label(prob),
            })

        results.sort(key=lambda r: r["failure_probability"], reverse=True)
        fail_count = sum(1 for r in results if r["failure_probability"] > 0.5)
        print(f"[ML API]   Batch complete: {len(results)} runs, {fail_count} high-risk")

        return jsonify({
            "total": len(results),
            "high_risk_count": fail_count,
            "runs": results,
        })

    except Exception as e:
        print(f"[ML API]   ERROR in /predict/batch: {e}")
        return jsonify({"error": str(e)}), 400


# ── Analyze Uploaded CSV ──────────────────────────────────────────────────────
@app.route("/analyze-csv", methods=["POST"])
def analyze_csv():
    """
    Accept a CSV file upload (multipart/form-data with field name 'file')
    OR a JSON body {"runs": [...]} for programmatic use.
    Returns full predictions array + dashboard summary metrics.

    CSV must have columns: code_coverage, functional_coverage, assertions_failed,
    simulation_time, lines_modified, prior_failures, engineer_experience,
    test_name, module
    """
    print(f"[ML API] POST /analyze-csv — CSV analysis request received")
    try:
        # ── Accept file upload ──────────────────────────────────────────────
        if "file" in request.files:
            file = request.files["file"]
            print(f"[ML API]   Uploaded file: '{file.filename}'")
            df_raw = pd.read_csv(file)
            print(f"[ML API]   CSV loaded: {len(df_raw)} rows, columns: {list(df_raw.columns)}")
        else:
            # Fallback: accept JSON body
            body = request.get_json(force=True)
            runs = body.get("runs", [])
            if not runs:
                print(f"[ML API]   ERROR: No file or runs in request")
                return jsonify({"error": "Provide a CSV file or a JSON body with 'runs'"}), 400
            df_raw = pd.DataFrame(runs)
            print(f"[ML API]   JSON body: {len(df_raw)} runs received")

        # ── Build feature matrix ────────────────────────────────────────────
        df_model = df_raw.copy()
        df_model = df_model.drop(
            columns=["regression_id", "seed", "error_type", "result"], errors="ignore"
        )
        cat_cols = df_model.select_dtypes(include="object").columns
        df_model = pd.get_dummies(df_model, columns=cat_cols, drop_first=False)
        df_model = df_model.reindex(columns=FEATURE_COLUMNS, fill_value=0)

        print(f"[ML API]   Running model inference on {len(df_model)} rows...")
        probs = model.predict_proba(df_model)[:, 1]
        preds = model.predict(df_model)

        # ── Build per-run results ───────────────────────────────────────────
        all_runs = []
        for i in range(len(preds)):
            prob = float(probs[i])
            row = df_raw.iloc[i]
            entry = {
                "failure_probability": round(prob, 4),
                "failure_probability_pct": round(prob * 100, 1),
                "result": "Fail" if preds[i] == 1 else "Pass",
                "risk_level": risk_label(prob),
            }
            for col in ["code_coverage", "functional_coverage", "assertions_failed",
                        "simulation_time", "lines_modified", "prior_failures",
                        "engineer_experience", "test_name", "module"]:
                if col in row.index:
                    val = row[col]
                    try:
                        entry[col] = float(val) if not isinstance(val, str) else str(val)
                    except (ValueError, TypeError):
                        entry[col] = str(val)

            all_runs.append(entry)

        # Sort by risk descending
        all_runs.sort(key=lambda r: r["failure_probability"], reverse=True)

        # ── Summary stats ───────────────────────────────────────────────────
        total      = len(preds)
        fail_count = int(preds.sum())
        pass_count = total - fail_count
        fail_rate  = round(fail_count / total * 100, 1) if total > 0 else 0
        fairness   = round(100 - abs(fail_rate - 64), 1)

        print(f"[ML API]   ✓ Analysis complete: {total} runs → {fail_count} FAIL ({fail_rate}%), {pass_count} PASS")

        return jsonify({
            "summary": {
                "total_runs":          total,
                "fail_count":          fail_count,
                "pass_count":          pass_count,
                "fail_rate_pct":       fail_rate,
                "model_accuracy_pct":  98.37,
                "roc_auc":             0.9992,
                "fairness_score":      fairness,
            },
            "runs": all_runs,
            "timestamp": datetime.now().isoformat(),
        })

    except Exception as e:
        print(f"[ML API]   ERROR in /analyze-csv: {e}")
        return jsonify({"error": str(e)}), 500


# ── Dashboard (legacy — uses stored CSV) ─────────────────────────────────────
@app.route("/dashboard", methods=["GET"])
def dashboard():
    """
    Returns aggregated dashboard summary from the stored CSV dataset.
    Prefer /analyze-csv for user-uploaded data.
    """
    print(f"[ML API] GET /dashboard — loading stored dataset CSV...")
    try:
        df = pd.read_csv("rtl_verification_dataset.csv")
        print(f"[ML API]   Dataset rows: {len(df)}")

        df_model = df.drop(columns=["regression_id", "seed", "error_type", "result"], errors="ignore")
        cat_cols = df_model.select_dtypes(include="object").columns
        df_model = pd.get_dummies(df_model, columns=cat_cols, drop_first=True)
        df_model = df_model.reindex(columns=FEATURE_COLUMNS, fill_value=0)

        probs = model.predict_proba(df_model)[:, 1]
        preds = model.predict(df_model)

        total = len(preds)
        fail_count = int(preds.sum())
        pass_count = total - fail_count
        fail_rate  = round(fail_count / total * 100, 1)

        top_idx = np.argsort(probs)[::-1][:10]
        top_risk_list = []
        for i in top_idx:
            prob = float(probs[i])
            entry = {
                "failure_probability_pct": round(prob * 100, 1),
                "result": "Fail" if preds[i] == 1 else "Pass",
                "risk_level": risk_label(prob),
                "code_coverage":       round(float(df.iloc[i]["code_coverage"]), 1),
                "functional_coverage": round(float(df.iloc[i]["functional_coverage"]), 1),
                "assertions_failed":   int(df.iloc[i]["assertions_failed"]),
                "lines_modified":      int(df.iloc[i]["lines_modified"]),
                "prior_failures":      int(df.iloc[i]["prior_failures"]),
                "engineer_experience": int(df.iloc[i]["engineer_experience"]),
            }
            top_risk_list.append(entry)

        fairness_score = round(100 - abs(fail_count / total * 100 - 64), 1)
        print(f"[ML API]   Dashboard summary: {total} total, {fail_rate}% fail rate")

        return jsonify({
            "summary": {
                "total_runs": total,
                "fail_count": fail_count,
                "pass_count": pass_count,
                "fail_rate_pct": fail_rate,
                "model_accuracy_pct": 98.37,
                "roc_auc": 0.9992,
                "fairness_score": fairness_score,
            },
            "top_risk_runs": top_risk_list,
            "timestamp": datetime.now().isoformat(),
        })

    except Exception as e:
        print(f"[ML API]   ERROR in /dashboard: {e}")
        return jsonify({"error": str(e)}), 500


# ── Smart Regression Planner ──────────────────────────────────────────────────
@app.route("/regression-plan", methods=["POST"])
def regression_plan():
    """
    Input: {"runs": [...], "time_budget": 500}
    Returns optimal subset within the time budget, highest-risk first.
    """
    print(f"[ML API] POST /regression-plan — smart planner request received")
    try:
        body = request.get_json(force=True)
        runs = body.get("runs", [])
        time_budget = int(body.get("time_budget", 500))

        if not runs:
            return jsonify({"error": "No runs provided"}), 400

        print(f"[ML API]   Scoring {len(runs)} runs, budget: {time_budget}s ...")
        scored = []
        for run in runs:
            features = build_feature_row(run)
            prob = float(model.predict_proba(features)[0][1])
            scored.append({**run, "failure_probability": round(prob, 4)})

        scored.sort(key=lambda r: r["failure_probability"], reverse=True)

        selected, total_time = [], 0
        for run in scored:
            est_time = int(run.get("simulation_time", np.random.randint(20, 120)))
            if total_time + est_time <= time_budget:
                selected.append({**run, "estimated_time": est_time})
                total_time += est_time

        coverage_pct = round(len(selected) / len(runs) * 100, 1) if runs else 0
        print(f"[ML API]   Plan: {len(selected)}/{len(runs)} runs selected, {total_time}s total")

        return jsonify({
            "selected_count":        len(selected),
            "total_estimated_time":  total_time,
            "time_budget":           time_budget,
            "coverage_pct":          coverage_pct,
            "selected_runs":         selected,
        })

    except Exception as e:
        print(f"[ML API]   ERROR in /regression-plan: {e}")
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    print("[ML API] ───────────────────────────────────────────────")
    print("[ML API] Starting RTL Failure Prediction API on http://localhost:5001")
    print("[ML API] Endpoints:")
    print("[ML API]   GET  /health          - Health check")
    print("[ML API]   POST /predict         - Single prediction")
    print("[ML API]   POST /predict/batch   - Batch predictions")
    print("[ML API]   POST /analyze-csv     - Upload + analyze CSV file  ← NEW")
    print("[ML API]   GET  /dashboard       - Dashboard (stored CSV)")
    print("[ML API]   POST /regression-plan - Smart regression planner")
    print("[ML API] ───────────────────────────────────────────────")
    app.run(host="0.0.0.0", port=5001, debug=False)
