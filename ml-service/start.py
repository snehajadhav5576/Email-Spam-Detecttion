#!/usr/bin/env python3
"""
SpamShield AI ML Service — Startup Script
Trains the model if artifacts are missing, then starts the FastAPI server.
This is used by Render as the start command.
"""
import os
import sys
import subprocess
from pathlib import Path

MODELS_DIR = Path(__file__).parent / "models"
MODEL_FILE = MODELS_DIR / "model.pkl"
VECTORIZER_FILE = MODELS_DIR / "vectorizer.pkl"

def main():
    # Train the model if artifacts are missing
    if not MODEL_FILE.exists() or not VECTORIZER_FILE.exists():
        print("Model artifacts not found. Running training pipeline...")
        MODELS_DIR.mkdir(exist_ok=True)
        result = subprocess.run(
            [sys.executable, "training/train.py"],
            cwd=Path(__file__).parent,
            capture_output=False,
        )
        if result.returncode != 0:
            print("Training failed! Exiting.", file=sys.stderr)
            sys.exit(1)
        print("Training complete.")
    else:
        print("Model artifacts found. Skipping training.")

    # Start uvicorn
    port = os.environ.get("PORT", "10000")
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting FastAPI on {host}:{port}")
    os.execvp("uvicorn", [
        "uvicorn",
        "app.main:app",
        "--host", host,
        "--port", port,
        "--workers", "1",
    ])

if __name__ == "__main__":
    main()
