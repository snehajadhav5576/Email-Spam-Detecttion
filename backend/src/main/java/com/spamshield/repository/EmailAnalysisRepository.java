package com.spamshield.repository;

import com.spamshield.entity.EmailAnalysis;
import com.spamshield.entity.EmailAnalysis.Prediction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailAnalysisRepository extends JpaRepository<EmailAnalysis, Long> {

    // Ownership-safe lookup — never return analysis without user check
    Optional<EmailAnalysis> findByIdAndUserId(Long id, Long userId);

    Page<EmailAnalysis> findByUserId(Long userId, Pageable pageable);

    Page<EmailAnalysis> findByUserIdAndPrediction(Long userId, Prediction prediction, Pageable pageable);

    Page<EmailAnalysis> findByUserIdAndCreatedAtBetween(Long userId, Instant from, Instant to, Pageable pageable);

    @Query("SELECT ea FROM EmailAnalysis ea WHERE ea.user.id = :userId " +
           "AND (:prediction IS NULL OR ea.prediction = :prediction) " +
           "AND ea.createdAt BETWEEN :from AND :to " +
           "AND (:subject IS NULL OR LOWER(ea.subject) LIKE LOWER(CONCAT('%', :subject, '%')))")
    Page<EmailAnalysis> findByFilters(
        @Param("userId") Long userId,
        @Param("prediction") Prediction prediction,
        @Param("from") Instant from,
        @Param("to") Instant to,
        @Param("subject") String subject,
        Pageable pageable
    );

    long countByUserId(Long userId);

    long countByUserIdAndPrediction(Long userId, Prediction prediction);

    // Admin queries
    long countByPrediction(Prediction prediction);

    @Query("SELECT COUNT(ea) FROM EmailAnalysis ea WHERE ea.createdAt BETWEEN :from AND :to")
    long countByDateRange(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT DATE(ea.createdAt) as date, COUNT(ea) as total, " +
           "SUM(CASE WHEN ea.prediction = 'SPAM' THEN 1 ELSE 0 END) as spam " +
           "FROM EmailAnalysis ea WHERE ea.user.id = :userId " +
           "AND ea.createdAt >= :from GROUP BY DATE(ea.createdAt) ORDER BY DATE(ea.createdAt)")
    List<Object[]> getDailyTrend(@Param("userId") Long userId, @Param("from") Instant from);

    @Query("SELECT DATE(ea.createdAt) as date, COUNT(ea) as total, " +
           "SUM(CASE WHEN ea.prediction = 'SPAM' THEN 1 ELSE 0 END) as spam " +
           "FROM EmailAnalysis ea WHERE ea.createdAt >= :from GROUP BY DATE(ea.createdAt) ORDER BY DATE(ea.createdAt)")
    List<Object[]> getAdminDailyTrend(@Param("from") Instant from);

    List<EmailAnalysis> findTop5ByUserIdOrderByCreatedAtDesc(Long userId);

    List<EmailAnalysis> findTop10ByOrderByCreatedAtDesc();

    void deleteByUserId(Long userId);
}
