package com.spamshield.service;

import com.spamshield.entity.EmailAnalysis;
import com.spamshield.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AnalyticsService {

    private final EmailAnalysisRepository analysisRepository;
    private final AnalysisIndicatorRepository indicatorRepository;
    private final UserRepository userRepository;

    public AnalyticsService(EmailAnalysisRepository analysisRepository,
                            AnalysisIndicatorRepository indicatorRepository,
                            UserRepository userRepository) {
        this.analysisRepository = analysisRepository;
        this.indicatorRepository = indicatorRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSummary(String userEmail) {
        Long userId = getUserId(userEmail);
        long total = analysisRepository.countByUserId(userId);
        long spam = analysisRepository.countByUserIdAndPrediction(userId, EmailAnalysis.Prediction.SPAM);
        long legit = total - spam;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", total);
        result.put("spam", spam);
        result.put("legitimate", legit);
        result.put("spamRatio", total > 0 ? (double) spam / total : 0.0);
        result.put("note", "Spam ratio reflects analyzed emails only, not the true rate of your entire mailbox.");
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTrends(String userEmail, int days) {
        Long userId = getUserId(userEmail);
        Instant from = Instant.now().minus(days, ChronoUnit.DAYS);
        List<Object[]> raw = analysisRepository.getDailyTrend(userId, from);
        return mapTrends(raw);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopIndicators(String userEmail, int days) {
        Long userId = getUserId(userEmail);
        Instant from = Instant.now().minus(days, ChronoUnit.DAYS);
        List<Object[]> raw = indicatorRepository.getTopIndicatorsByUser(userId, from);
        return mapIndicators(raw);
    }

    // Admin analytics
    @Transactional(readOnly = true)
    public Map<String, Object> getAdminSummary() {
        long total = analysisRepository.count();
        long spam = analysisRepository.countByPrediction(EmailAnalysis.Prediction.SPAM);
        long users = userRepository.count();
        Map<String, Object> result = new LinkedHashMap<>();
        long activeUsers = userRepository.countByActiveTrue();
        result.put("totalUsers", users);
        result.put("activeUsers", activeUsers);
        result.put("totalAnalyses", total);
        result.put("spam", spam);
        result.put("legitimate", total - spam);
        result.put("spamRatio", total > 0 ? (double) spam / total : 0.0);
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAdminTrends(int days) {
        Instant from = Instant.now().minus(days, ChronoUnit.DAYS);
        return mapTrends(analysisRepository.getAdminDailyTrend(from));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAdminTopIndicators(int days) {
        Instant from = Instant.now().minus(days, ChronoUnit.DAYS);
        return mapIndicators(indicatorRepository.getTopIndicatorsAdmin(from));
    }

    private Long getUserId(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new com.spamshield.exception.ResourceNotFoundException("User not found"))
                .getId();
    }

    private List<Map<String, Object>> mapTrends(List<Object[]> raw) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Object[] row : raw) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", row[0].toString());
            m.put("total", ((Number) row[1]).longValue());
            m.put("spam", ((Number) row[2]).longValue());
            m.put("legitimate", ((Number) row[1]).longValue() - ((Number) row[2]).longValue());
            list.add(m);
        }
        return list;
    }

    private List<Map<String, Object>> mapIndicators(List<Object[]> raw) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Object[] row : raw) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("indicator", row[0]);
            m.put("count", ((Number) row[1]).longValue());
            list.add(m);
        }
        return list;
    }
}
