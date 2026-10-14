"""
SpamShield AI — FastAPI ML Service
Listens on 127.0.0.1 only (localhost). Never on 0.0.0.0 in production.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import logging

from app.schemas import PredictRequest, PredictResponse, HealthResponse, ModelInfoResponse
from app.predictor import predictor

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)

# Max request body size: 1 MB
MAX_BODY_SIZE = 1 * 1024 * 1024


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model at startup. Fail loudly if artifacts are missing."""
    try:
        predictor.load()
        logger.info("Model loaded successfully. Version: %s", predictor.version)
    except FileNotFoundError as e:
        logger.error("STARTUP FAILED: %s", str(e))
        # Allow startup but mark as degraded — /health will report this
    yield
    logger.info("ML service shutting down")


app = FastAPI(
    title="SpamShield ML Service",
    description="Email spam classification API. Internal service only.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",      # Disable in production: docs_url=None
    redoc_url=None,
)

import os

# Only accept requests from localhost (internal service) when running locally
# In production (Render), traffic comes from the backend's internal service URL
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
# Remove TrustedHostMiddleware for cloud deployment compatibility;
# rely on network-level isolation (Render private network) instead
# app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(status_code=413, content={"detail": "Request body too large"})
    return await call_next(request)


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok" if predictor.is_loaded else "degraded",
        model_version=predictor.version if predictor.is_loaded else None,
        model_loaded=predictor.is_loaded,
    )


@app.get("/model/info", response_model=ModelInfoResponse)
def model_info():
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return ModelInfoResponse(
        version=predictor.version,
        model_type="MultinomialNB with TF-IDF (calibrated)",
        metrics=predictor.metrics,
    )


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if not predictor.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="ML model is not loaded. Run training/train.py and restart the service."
        )
    try:
        result = predictor.predict(req.subject, req.sender, req.body)
        # Do NOT log email content — only log prediction result and model version
        logger.info("Prediction: %s, score: %.4f, version: %s",
                    result["prediction"], result["score"], result["model_version"])
        return PredictResponse(**result)
    except Exception as e:
        logger.error("Prediction error: %s", type(e).__name__)
        raise HTTPException(status_code=500, detail="Prediction failed. Please try again.")
