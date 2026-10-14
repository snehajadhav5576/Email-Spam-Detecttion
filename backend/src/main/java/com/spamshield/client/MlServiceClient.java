package com.spamshield.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.List;
import java.util.Map;
import org.springframework.web.client.RestClientException;

/**
 * HTTP client for the Python ML FastAPI service.
 * ML service URL is configured only on the backend — never exposed to the frontend.
 */
@Component
public class MlServiceClient {

    private static final Logger log = LoggerFactory.getLogger(MlServiceClient.class);

    private final RestTemplate restTemplate;
    private final String mlServiceUrl;

    public MlServiceClient(
            @Value("${ml.service.url:http://127.0.0.1:8000}") String mlServiceUrl,
            @Value("${ml.service.timeout-ms:10000}") int timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restTemplate = new RestTemplate(factory);
        this.mlServiceUrl = mlServiceUrl;
    }

    public MlPredictionResponse predict(String subject, String sender, String body) {
        MlPredictionRequest req = new MlPredictionRequest(subject, sender, body);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<MlPredictionRequest> entity = new HttpEntity<>(req, headers);

        try {
            ResponseEntity<MlPredictionResponse> resp =
                    restTemplate.exchange(mlServiceUrl + "/predict", HttpMethod.POST, entity, MlPredictionResponse.class);
            return resp.getBody();
        } catch (RestClientException e) {
            // Log only the exception type, not request content — no email content in logs
            log.error("ML service unavailable: {}", e.getClass().getSimpleName());
            throw new MlServiceUnavailableException("ML classification service is currently unavailable. Please try again later.");
        }
    }

    public MlHealthResponse health() {
        try {
            return restTemplate.getForObject(mlServiceUrl + "/health", MlHealthResponse.class);
        } catch (RestClientException e) {
            return new MlHealthResponse("unavailable", null);
        }
    }

    public MlModelInfoResponse modelInfo() {
        try {
            return restTemplate.getForObject(mlServiceUrl + "/model/info", MlModelInfoResponse.class);
        } catch (RestClientException e) {
            return new MlModelInfoResponse("unknown", "unknown", null);
        }
    }

    // ---- Request / Response records ----

    public record MlPredictionRequest(String subject, String sender, String body) {}

    public static class MlPredictionResponse {
        private String prediction;
        private Double score;
        @JsonProperty("score_type") private String scoreType;
        @JsonProperty("model_version") private String modelVersion;
        private List<String> indicators;

        public String getPrediction() { return prediction; }
        public void setPrediction(String prediction) { this.prediction = prediction; }
        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }
        public String getScoreType() { return scoreType; }
        public void setScoreType(String scoreType) { this.scoreType = scoreType; }
        public String getModelVersion() { return modelVersion; }
        public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
        public List<String> getIndicators() { return indicators; }
        public void setIndicators(List<String> indicators) { this.indicators = indicators; }
    }

    public static class MlHealthResponse {
        private String status;
        @JsonProperty("model_version") private String modelVersion;
        public MlHealthResponse() {}
        public MlHealthResponse(String status, String modelVersion) { this.status = status; this.modelVersion = modelVersion; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getModelVersion() { return modelVersion; }
        public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    }

    public static class MlModelInfoResponse {
        private String version;
        @JsonProperty("model_type") private String modelType;
        private Map<String, Object> metrics;
        public MlModelInfoResponse() {}
        public MlModelInfoResponse(String version, String modelType, Map<String, Object> metrics) {
            this.version = version; this.modelType = modelType; this.metrics = metrics;
        }
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
        public String getModelType() { return modelType; }
        public void setModelType(String modelType) { this.modelType = modelType; }
        public Map<String, Object> getMetrics() { return metrics; }
        public void setMetrics(Map<String, Object> metrics) { this.metrics = metrics; }
    }

    public static class MlServiceUnavailableException extends RuntimeException {
        public MlServiceUnavailableException(String message) { super(message); }
    }
}
