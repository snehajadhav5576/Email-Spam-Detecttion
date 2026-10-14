package com.spamshield.repository;

import com.spamshield.entity.AnalysisIndicator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AnalysisIndicatorRepository extends JpaRepository<AnalysisIndicator, Long> {

    @Query("SELECT ai.indicatorType, COUNT(ai) as cnt " +
           "FROM AnalysisIndicator ai " +
           "JOIN ai.emailAnalysis ea " +
           "WHERE ea.user.id = :userId AND ea.createdAt >= :from " +
           "GROUP BY ai.indicatorType ORDER BY cnt DESC")
    List<Object[]> getTopIndicatorsByUser(@Param("userId") Long userId, @Param("from") Instant from);

    @Query("SELECT ai.indicatorType, COUNT(ai) as cnt " +
           "FROM AnalysisIndicator ai " +
           "JOIN ai.emailAnalysis ea " +
           "WHERE ea.createdAt >= :from " +
           "GROUP BY ai.indicatorType ORDER BY cnt DESC")
    List<Object[]> getTopIndicatorsAdmin(@Param("from") Instant from);
}
