package com.spamshield.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class AnalysisResponse {
    private Long id;
    private String subject;
    private String sender;
    private String prediction;
    private BigDecimal modelScore;
    private String scoreType;
    private String modelVersion;
    private String riskLevel;
    private List<IndicatorDto> indicators;
    private Instant createdAt;
    private String disclaimer;

    public static class IndicatorDto {
        private String type;
        private String description;
        public IndicatorDto() {}
        public IndicatorDto(String type, String description) { this.type = type; this.description = description; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getPrediction() { return prediction; }
    public void setPrediction(String prediction) { this.prediction = prediction; }
    public BigDecimal getModelScore() { return modelScore; }
    public void setModelScore(BigDecimal modelScore) { this.modelScore = modelScore; }
    public String getScoreType() { return scoreType; }
    public void setScoreType(String scoreType) { this.scoreType = scoreType; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public List<IndicatorDto> getIndicators() { return indicators; }
    public void setIndicators(List<IndicatorDto> indicators) { this.indicators = indicators; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }
}
