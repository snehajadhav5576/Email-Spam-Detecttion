package com.spamshield.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "email_analyses")
public class EmailAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 500)
    private String subject;

    @Column(length = 255)
    private String sender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Prediction prediction;

    @Column(name = "model_score", nullable = false, precision = 5, scale = 4)
    private BigDecimal modelScore;

    @Column(name = "score_type", nullable = false, length = 50)
    private String scoreType = "model_probability";

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 10)
    private RiskLevel riskLevel = RiskLevel.LOW;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "emailAnalysis", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<AnalysisIndicator> indicators = new ArrayList<>();

    public enum Prediction { SPAM, NOT_SPAM }
    public enum RiskLevel { LOW, MEDIUM, HIGH, CRITICAL }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public Prediction getPrediction() { return prediction; }
    public void setPrediction(Prediction prediction) { this.prediction = prediction; }
    public BigDecimal getModelScore() { return modelScore; }
    public void setModelScore(BigDecimal modelScore) { this.modelScore = modelScore; }
    public String getScoreType() { return scoreType; }
    public void setScoreType(String scoreType) { this.scoreType = scoreType; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public RiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public List<AnalysisIndicator> getIndicators() { return indicators; }
    public void setIndicators(List<AnalysisIndicator> indicators) { this.indicators = indicators; }
}
