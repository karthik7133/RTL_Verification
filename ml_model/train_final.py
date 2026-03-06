"""
Final Training Script – RTL Failure Predictor
Trains an XGBoost model with a deterministic, documented feature set
and saves it as rtl_failure_prediction_model.pkl (joblib) and .json (native).
"""

import pandas as pd
import numpy as np
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score

# ── 1. Generate Dataset ──────────────────────────────────────────────────────
np.random.seed(42)
n = 50000

modules = ["ALU", "Instruction_Decoder", "Memory_Controller",
           "Cache_Controller", "Bus_Interface", "DMA_Engine", "Interrupt_Controller"]
tests = ["memory_stress_test", "cache_eviction_test", "interrupt_test",
         "dma_transfer_test", "alu_overflow_test", "pipeline_test", "bus_protocol_test"]
errors = ["None", "Assertion Failure", "Timing Violation", "Protocol Error", "Overflow", "Deadlock"]

data = {
    "regression_id": np.random.randint(1000, 2000, n),
    "test_name":     np.random.choice(tests, n),
    "module":        np.random.choice(modules, n),
    "seed":          np.random.randint(1, 100000, n),
    "code_coverage":          np.random.uniform(50, 100, n),
    "functional_coverage":    np.random.uniform(40, 100, n),
    "assertions_failed":      np.random.randint(0, 5, n),
    "simulation_time":        np.random.uniform(20, 500, n),
    "lines_modified":         np.random.randint(0, 200, n),
    "prior_failures":         np.random.randint(0, 10, n),
    "engineer_experience":    np.random.randint(1, 10, n),
    "error_type":             np.random.choice(errors, n),
}

df = pd.DataFrame(data)

failure_score = (
    (100 - df["code_coverage"]) * 0.03
    + (100 - df["functional_coverage"]) * 0.02
    + df["lines_modified"] * 0.01
    + df["prior_failures"] * 0.3
    + df["assertions_failed"] * 0.4
)
df["result"] = (failure_score > 4).astype(int)
df.to_csv("rtl_verification_dataset.csv", index=False)
print("Dataset generated:", df.shape)

# ── 2. Preprocessing ──────────────────────────────────────────────────────────
df = df.drop(columns=["regression_id", "seed", "error_type"], errors="ignore")

categorical_cols = df.select_dtypes(include="object").columns
print("Encoding columns:", list(categorical_cols))

df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

X = df.drop("result", axis=1)
y = df["result"]

print("Feature columns:", list(X.columns))
print("Total features:", len(X.columns))

# Export feature list for API use
import json
with open("feature_columns.json", "w") as f:
    json.dump(list(X.columns), f, indent=2)
print("Feature columns saved to feature_columns.json")

# ── 3. Train/Test Split ───────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ── 4. Train XGBoost Model ────────────────────────────────────────────────────
model = XGBClassifier(
    n_estimators=400,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="logloss",
    random_state=42
)

print("\nTraining model...")
model.fit(X_train, y_train)

# ── 5. Evaluate ───────────────────────────────────────────────────────────────
pred = model.predict(X_test)
probs = model.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, pred)
auc = roc_auc_score(y_test, probs)

print(f"\n✅ Accuracy: {acc:.4f}")
print(f"✅ ROC AUC:  {auc:.4f}")
print(classification_report(y_test, pred))

# ── 6. Save Model ─────────────────────────────────────────────────────────────
joblib.dump(model, "rtl_failure_prediction_model.pkl")
model.save_model("rtl_failure_predictor.json")

print("\nModel saved:")
print("  rtl_failure_prediction_model.pkl  (joblib)")
print("  rtl_failure_predictor.json        (XGBoost native)")
print("\nVerified feature names:", model.get_booster().feature_names[:5], "...")
