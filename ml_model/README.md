---
title: RTL Verification Failure Prediction API
emoji: 🚀
colorFrom: indigo
colorTo: blue
sdk: docker
pinned: false
---

# RTL Verification Failure Prediction API

This is a Flask-based API for predicting failures in RTL verification runs.
It uses XGBoost and LightGBM models to provide analysis and regression planning.

## API Endpoints

- `GET /health`: Check if the API is running.
- `POST /predict`: Get failure probability for a single run.
- `POST /analyze-csv`: Analyze multiple runs from a CSV file or JSON.
- `POST /regression-plan`: Generate an optimal regression plan within a time budget.

## Usage

This API is designed to be consumed by the "AI Co-Pilot for Hardware Verification" frontend.
