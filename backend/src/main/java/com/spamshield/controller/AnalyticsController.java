package com.spamshield.controller;

import com.spamshield.dto.ApiResponse;
import com.spamshield.service.AnalyticsService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public ApiResponse<Map<String, Object>> summary(@AuthenticationPrincipal UserDetails ud) {
        return ApiResponse.ok(analyticsService.getSummary(ud.getUsername()));
    }

    @GetMapping("/trends")
    public ApiResponse<List<Map<String, Object>>> trends(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(analyticsService.getTrends(ud.getUsername(), days));
    }

    @GetMapping("/indicators")
    public ApiResponse<List<Map<String, Object>>> indicators(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(analyticsService.getTopIndicators(ud.getUsername(), days));
    }
}
