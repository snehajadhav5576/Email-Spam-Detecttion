package com.spamshield.service;

import com.spamshield.client.MlServiceClient;
import com.spamshield.dto.*;
import com.spamshield.entity.*;
import com.spamshield.exception.ResourceNotFoundException;
import com.spamshield.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AnalysisService.class);

    private static final String DISCLAIMER =
        "This result is a machine-learning prediction, not a guarantee. " +
        "Automated detection can make mistakes. Do not open links or attachments " +
        "in suspicious emails based solely on this result.";

    private final EmailAnalysisRepository analysisRepository;
    private final UserRepository userRepository;
    private final MlServiceClient mlServiceClient;

    public AnalysisService(EmailAnalysisRepository analysisRepository,
                           UserRepository userRepository,
                           MlServiceClient mlServiceClient) {
        this.analysisRepository = analysisRepository;
        this.userRepository = userRepository;
        this.mlServiceClient = mlServiceClient;
    }

    @Transactional
    public AnalysisResponse analyze(AnalysisRequest req, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Call ML service — if unavailable, MlServiceUnavailableException is thrown
        // and handled by GlobalExceptionHandler (fail closed, not silently legitimate)
        MlServiceClient.MlPredictionResponse mlResp = mlServiceClient.predict(
                req.getSubject(), req.getSender(), req.getBody());

        // Build and persist entity
        EmailAnalysis analysis = new EmailAnalysis();
        analysis.setUser(user);
        analysis.setSubject(req.getSubject());
        analysis.setSender(req.getSender());
        analysis.setPrediction(
                "SPAM".equalsIgnoreCase(mlResp.getPrediction())
                        ? EmailAnalysis.Prediction.SPAM
                        : EmailAnalysis.Prediction.NOT_SPAM);
        analysis.setModelScore(BigDecimal.valueOf(mlResp.getScore() != null ? mlResp.getScore() : 0.0));
        analysis.setScoreType(mlResp.getScoreType() != null ? mlResp.getScoreType() : "model_probability");
        analysis.setModelVersion(mlResp.getModelVersion() != null ? mlResp.getModelVersion() : "unknown");
        analysis.setRiskLevel(computeRiskLevel(mlResp));

        // Persist indicators
        if (mlResp.getIndicators() != null) {
            for (String indicator : mlResp.getIndicators()) {
                AnalysisIndicator ai = new AnalysisIndicator();
                ai.setEmailAnalysis(analysis);
                ai.setIndicatorType("HEURISTIC");
                ai.setIndicatorDescription(indicator);
                analysis.getIndicators().add(ai);
            }
        }

        analysis = analysisRepository.save(analysis);
        log.info("Analysis saved: id={}, user={}", analysis.getId(), user.getId());
        return toResponse(analysis);
    }

    @Transactional(readOnly = true)
    public Page<AnalysisResponse> getHistory(String userEmail, String predictionFilter,
                                              String from, String to, String subject,
                                              int page, int size) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Instant fromInstant = from != null ? Instant.parse(from) : Instant.EPOCH;
        Instant toInstant = to != null ? Instant.parse(to) : Instant.now().plus(1, ChronoUnit.DAYS);
        EmailAnalysis.Prediction pred = predictionFilter != null
                ? EmailAnalysis.Prediction.valueOf(predictionFilter.toUpperCase()) : null;

        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("createdAt").descending());
        Page<EmailAnalysis> results = analysisRepository.findByFilters(user.getId(), pred, fromInstant, toInstant, subject, pageable);
        return results.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public AnalysisResponse getById(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // Ownership check: only return if belongs to this user
        EmailAnalysis analysis = analysisRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Analysis not found"));
        return toResponse(analysis);
    }

    @Transactional
    public void delete(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // Ownership check before deletion
        EmailAnalysis analysis = analysisRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Analysis not found"));
        analysisRepository.delete(analysis);
        log.info("Analysis deleted: id={}, user={}", id, user.getId());
    }

    private EmailAnalysis.RiskLevel computeRiskLevel(MlServiceClient.MlPredictionResponse mlResp) {
        if (!"SPAM".equalsIgnoreCase(mlResp.getPrediction())) return EmailAnalysis.RiskLevel.LOW;
        double score = mlResp.getScore() != null ? mlResp.getScore() : 0.0;
        if (score >= 0.9) return EmailAnalysis.RiskLevel.CRITICAL;
        if (score >= 0.75) return EmailAnalysis.RiskLevel.HIGH;
        if (score >= 0.5) return EmailAnalysis.RiskLevel.MEDIUM;
        return EmailAnalysis.RiskLevel.LOW;
    }

    private AnalysisResponse toResponse(EmailAnalysis a) {
        AnalysisResponse resp = new AnalysisResponse();
        resp.setId(a.getId());
        resp.setSubject(a.getSubject());
        resp.setSender(a.getSender());
        resp.setPrediction(a.getPrediction().name());
        resp.setModelScore(a.getModelScore());
        resp.setScoreType(a.getScoreType());
        resp.setModelVersion(a.getModelVersion());
        resp.setRiskLevel(a.getRiskLevel().name());
        resp.setCreatedAt(a.getCreatedAt());
        resp.setDisclaimer(DISCLAIMER);
        if (a.getIndicators() != null) {
            resp.setIndicators(a.getIndicators().stream()
                    .map(i -> new AnalysisResponse.IndicatorDto(i.getIndicatorType(), i.getIndicatorDescription()))
                    .collect(Collectors.toList()));
        }
        return resp;
    }
}
