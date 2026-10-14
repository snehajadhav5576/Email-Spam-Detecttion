package com.spamshield.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "analysis_indicators")
public class AnalysisIndicator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analysis_id", nullable = false)
    private EmailAnalysis emailAnalysis;

    @Column(name = "indicator_type", nullable = false, length = 100)
    private String indicatorType;

    @Column(name = "indicator_description", nullable = false, length = 500)
    private String indicatorDescription;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public EmailAnalysis getEmailAnalysis() { return emailAnalysis; }
    public void setEmailAnalysis(EmailAnalysis emailAnalysis) { this.emailAnalysis = emailAnalysis; }
    public String getIndicatorType() { return indicatorType; }
    public void setIndicatorType(String indicatorType) { this.indicatorType = indicatorType; }
    public String getIndicatorDescription() { return indicatorDescription; }
    public void setIndicatorDescription(String indicatorDescription) { this.indicatorDescription = indicatorDescription; }
}
