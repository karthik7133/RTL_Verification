import pandas as pd
import numpy as np
import joblib
from lightgbm import LGBMClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import json

# ── 1. Create Dataset (Same logic as model_2.ipynb) ───────────────────────────
np.random.seed(42)
n = 50000

modules = ["ALU", "Instruction_Decoder", "Memory_Controller",
           "Cache_Controller", "Bus_Interface", "DMA_Engine", "Interrupt_Controller"]
tests = ["memory_stress_test", "cache_eviction_test", "interrupt_test",
         "dma_transfer_test", "alu_overflow_test", "pipeline_test", "bus_protocol_test"]
errors = ["None", "Assertion Failure", "Timing Violation", "Protocol Error", "Overflow", "Deadlock"]

data = {
    "regression_id": np.random.randint(1000, 2000, n),
    "test_name": np.random.choice(tests, n),
    "module": np.random.choice(modules, n),
    "seed": np.random.randint(1, 100000, n),
    "code_coverage": np.random.uniform(50, 100, n),
    "functional_coverage": np.random.uniform(40, 100, n),
    "assertions_failed": np.random.randint(0, 5, n),
    "simulation_time": np.random.uniform(20, 500, n),
    "lines_modified": np.random.randint(0, 200, n),
    "prior_failures": np.random.randint(0, 10, n),
    "engineer_experience": np.random.randint(1, 10, n),
    "error_type": np.random.choice(errors, n)
}

df = pd.DataFrame(data)

# Failure Logic
failure_score = (
    (100 - df["code_coverage"]) * 0.03
    + (100 - df["functional_coverage"]) * 0.02
    + df["lines_modified"] * 0.01
    + df["prior_failures"] * 0.3
    + df["assertions_failed"] * 0.4
)
df["result"] = (failure_score > 4).astype(int)

# ── 2. Preprocessing (Logic from model_2.ipynb) ───────────────────────────────
df = df.rename(columns={
    "lines_modified": "lines_changed",
    "prior_failures": "previous_failures",
    "result": "pass_fail"
})

# Feature Engineering
df["change_risk"] = df["lines_changed"] * df["previous_failures"]

# Categorical Encoding
cat_cols = ["module", "error_type"]
df_encoded = pd.get_dummies(df, columns=cat_cols, drop_first=True)

# Drop unused columns (failure_text was synthesized but dropped in notebook)
X = df_encoded.drop(["pass_fail", "test_name", "regression_id", "seed"], axis=1)
y = df_encoded["pass_fail"]

# Save feature list for the API
features_list = list(X.columns)
with open("model_2_features.json", "w") as f:
    json.dump(features_list, f, indent=2)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ── 3. Train LightGBM ─────────────────────────────────────────────────────────
model = LGBMClassifier(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=6,
    random_state=42
)

print("Training Model 2 (LightGBM)...")
model.fit(X_train, y_train)

# ── 4. Evaluate ───────────────────────────────────────────────────────────────
y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(classification_report(y_test, y_pred))

# ── 5. Save ───────────────────────────────────────────────────────────────────
joblib.dump(model, "model_2.pkl")
print("Model 2 saved to model_2.pkl")
print("Features saved to model_2_features.json")
