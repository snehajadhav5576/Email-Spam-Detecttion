"""
SpamShield AI — Model predictor.
Loads saved model and vectorizer at startup.
"""
import json
import pickle
from pathlib import Path
from app.preprocessing import preprocess_text, extract_heuristic_indicators

MODELS_DIR = Path(__file__).parent.parent / "models"

class Predictor:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.version = "unknown"
        self.metrics: dict = {}
        self._loaded = False

    def load(self):
        model_path = MODELS_DIR / "model.pkl"
        vectorizer_path = MODELS_DIR / "vectorizer.pkl"
        version_path = MODELS_DIR / "version.txt"
        metrics_path = MODELS_DIR / "metrics.json"

        if not model_path.exists() or not vectorizer_path.exists():
            raise FileNotFoundError(
                "Model artifacts not found. Run 'python training/train.py' first."
            )

        with open(model_path, "rb") as f:
            self.model = pickle.load(f)
        with open(vectorizer_path, "rb") as f:
            self.vectorizer = pickle.load(f)
        if version_path.exists():
            self.version = version_path.read_text().strip()
        if metrics_path.exists():
            with open(metrics_path) as f:
                self.metrics = json.load(f)
        self._loaded = True

    def predict(self, subject: str | None, sender: str | None, body: str) -> dict:
        if not self._loaded:
            raise RuntimeError("Model not loaded")

        combined = preprocess_text(subject, body)
        X = self.vectorizer.transform([combined])

        label_idx = self.model.predict(X)[0]
        proba = self.model.predict_proba(X)[0]

        prediction = "SPAM" if label_idx == 1 else "NOT_SPAM"
        score = float(proba[1])  # P(spam)

        indicators = extract_heuristic_indicators(subject, body)

        return {
            "prediction": prediction,
            "score": round(score, 4),
            "score_type": "calibrated_probability",
            "model_version": self.version,
            "indicators": indicators,
        }

    @property
    def is_loaded(self) -> bool:
        return self._loaded

# Singleton instance
predictor = Predictor()
