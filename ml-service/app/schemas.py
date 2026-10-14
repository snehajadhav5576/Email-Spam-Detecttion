"""
SpamShield AI — Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional

class PredictRequest(BaseModel):
    subject: Optional[str] = Field(None, max_length=500)
    sender: Optional[str] = Field(None, max_length=255)
    body: str = Field(..., min_length=5, max_length=50000)

    @field_validator("body")
    @classmethod
    def body_not_only_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("body must not be empty or whitespace only")
        return v

class IndicatorItem(BaseModel):
    description: str

class PredictResponse(BaseModel):
    prediction: str          # "SPAM" or "NOT_SPAM"
    score: float             # Model probability (0.0–1.0)
    score_type: str          # "calibrated_probability" or "model_probability"
    model_version: str
    indicators: list[str]    # Heuristic indicators (rule-based, separate from ML)

class HealthResponse(BaseModel):
    status: str              # "ok" or "degraded"
    model_version: Optional[str] = None
    model_loaded: bool

class ModelInfoResponse(BaseModel):
    version: str
    model_type: str
    metrics: Optional[dict] = None
