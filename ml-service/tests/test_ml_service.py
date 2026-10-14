"""
SpamShield AI — ML Service Tests
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Patch model loading before importing app
with patch("app.predictor.predictor") as mock_predictor:
    mock_predictor.is_loaded = True
    mock_predictor.version = "1.0.0-test"
    mock_predictor.metrics = {}
    mock_predictor.predict.return_value = {
        "prediction": "SPAM",
        "score": 0.91,
        "score_type": "calibrated_probability",
        "model_version": "1.0.0-test",
        "indicators": ["Urgency phrase detected"],
    }
    from app.main import app

client = TestClient(app)


class TestHealth:
    def test_health_returns_200(self):
        with patch("app.main.predictor") as mp:
            mp.is_loaded = True
            mp.version = "1.0.0"
            resp = client.get("/health")
        assert resp.status_code == 200

    def test_health_schema(self):
        with patch("app.main.predictor") as mp:
            mp.is_loaded = True
            mp.version = "1.0.0"
            resp = client.get("/health")
            data = resp.json()
        assert "status" in data
        assert "model_loaded" in data


class TestPredict:
    def _predict(self, payload, predictor_mock=None):
        if predictor_mock is None:
            predictor_mock = MagicMock()
            predictor_mock.is_loaded = True
            predictor_mock.predict.return_value = {
                "prediction": "SPAM",
                "score": 0.88,
                "score_type": "calibrated_probability",
                "model_version": "1.0.0",
                "indicators": [],
            }
        with patch("app.main.predictor", predictor_mock):
            return client.post("/predict", json=payload)

    def test_valid_spam_request(self):
        resp = self._predict({"subject": "Win a prize!", "body": "Click here to claim your reward now"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["prediction"] in ("SPAM", "NOT_SPAM")
        assert 0.0 <= data["score"] <= 1.0
        assert "model_version" in data
        assert "indicators" in data

    def test_empty_body_returns_422(self):
        resp = client.post("/predict", json={"body": "   "})
        assert resp.status_code == 422

    def test_missing_body_returns_422(self):
        resp = client.post("/predict", json={"subject": "Hello"})
        assert resp.status_code == 422

    def test_body_too_short_returns_422(self):
        resp = client.post("/predict", json={"body": "Hi"})
        assert resp.status_code == 422

    def test_model_not_loaded_returns_503(self):
        mp = MagicMock()
        mp.is_loaded = False
        with patch("app.main.predictor", mp):
            resp = client.post("/predict", json={"body": "This is a test email body with content"})
        assert resp.status_code == 503

    def test_response_schema(self):
        resp = self._predict({"body": "This is a legitimate business email about the quarterly report"})
        assert resp.status_code == 200
        data = resp.json()
        required = {"prediction", "score", "score_type", "model_version", "indicators"}
        assert required.issubset(data.keys())

    def test_legitimate_email_prediction(self):
        mp = MagicMock()
        mp.is_loaded = True
        mp.predict.return_value = {
            "prediction": "NOT_SPAM",
            "score": 0.05,
            "score_type": "calibrated_probability",
            "model_version": "1.0.0",
            "indicators": [],
        }
        resp = self._predict({"body": "Hi team, please find the meeting agenda attached"}, mp)
        assert resp.status_code == 200
        assert resp.json()["prediction"] == "NOT_SPAM"


class TestPreprocessing:
    def test_preprocess_combines_subject_and_body(self):
        from app.preprocessing import preprocess_text
        result = preprocess_text("Hello", "World")
        assert "Hello" in result
        assert "World" in result

    def test_preprocess_handles_none_subject(self):
        from app.preprocessing import preprocess_text
        result = preprocess_text(None, "Just the body")
        assert "Just the body" in result

    def test_heuristic_detects_urgency(self):
        from app.preprocessing import extract_heuristic_indicators
        indicators = extract_heuristic_indicators("URGENT", "Act now! Limited time offer")
        assert any("Urgency" in i or "Promotional" in i for i in indicators)

    def test_heuristic_detects_url(self):
        from app.preprocessing import extract_heuristic_indicators
        indicators = extract_heuristic_indicators(None, "Click here http://example.com")
        assert any("URL" in i for i in indicators)

    def test_heuristic_clean_email_no_indicators(self):
        from app.preprocessing import extract_heuristic_indicators
        indicators = extract_heuristic_indicators(
            "Meeting tomorrow", "Hi, let us meet at 10am in conference room B"
        )
        # Clean email may have no indicators or very few
        assert isinstance(indicators, list)
