package com.spamshield.controller;

import com.spamshield.client.MlServiceClient;
import com.spamshield.dto.*;
import com.spamshield.entity.AuditLog;
import com.spamshield.repository.AuditLogRepository;
import com.spamshield.service.*;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AnalyticsService analyticsService;
    private final UserService userService;
    private final MlServiceClient mlServiceClient;
    private final AuditLogRepository auditLogRepository;

    public AdminController(AnalyticsService analyticsService,
                           UserService userService,
                           MlServiceClient mlServiceClient,
                           AuditLogRepository auditLogRepository) {
        this.analyticsService = analyticsService;
        this.userService = userService;
        this.mlServiceClient = mlServiceClient;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard() {
        Map<String, Object> summary = analyticsService.getAdminSummary();
        summary.put("modelHealth", mlServiceClient.health());
        return ApiResponse.ok(summary);
    }

    @GetMapping("/users")
    public ApiResponse<Page<UserDto>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(userService.listUsers(page, size));
    }

    @PatchMapping("/users/{id}/status")
    public ApiResponse<UserDto> toggleStatus(@PathVariable Long id,
                                              @RequestParam boolean active) {
        return ApiResponse.ok(userService.toggleUserStatus(id, active));
    }

    @GetMapping("/model-info")
    public ApiResponse<MlServiceClient.MlModelInfoResponse> modelInfo() {
        return ApiResponse.ok(mlServiceClient.modelInfo());
    }

    @GetMapping("/audit-logs")
    public ApiResponse<Page<Map<String, Object>>> auditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 200));
        Page<AuditLog> logs = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        // Return only action metadata — no email content
        Page<Map<String, Object>> result = logs.map(al -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", al.getId());
            m.put("userId", al.getUser() != null ? al.getUser().getId() : null);
            m.put("action", al.getAction());
            m.put("status", al.getStatus());
            m.put("createdAt", al.getCreatedAt());
            return m;
        });
        return ApiResponse.ok(result);
    }

    @GetMapping("/trends")
    public ApiResponse<List<Map<String, Object>>> trends(@RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(analyticsService.getAdminTrends(days));
    }

    @GetMapping("/indicators")
    public ApiResponse<List<Map<String, Object>>> indicators(@RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(analyticsService.getAdminTopIndicators(days));
    }
}
