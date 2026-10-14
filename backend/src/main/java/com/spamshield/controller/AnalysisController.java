package com.spamshield.controller;

import com.spamshield.dto.*;
import com.spamshield.service.AnalysisService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analyses")
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AnalysisResponse> analyze(@Valid @RequestBody AnalysisRequest req,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        AnalysisResponse result = analysisService.analyze(req, userDetails.getUsername());
        return ApiResponse.ok(result);
    }

    @GetMapping
    public ApiResponse<Page<AnalysisResponse>> history(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String prediction,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String subject,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AnalysisResponse> result = analysisService.getHistory(
                userDetails.getUsername(), prediction, from, to, subject, page, size);
        return ApiResponse.ok(result);
    }

    @GetMapping("/{id}")
    public ApiResponse<AnalysisResponse> getById(@PathVariable Long id,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.ok(analysisService.getById(id, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id,
                       @AuthenticationPrincipal UserDetails userDetails) {
        analysisService.delete(id, userDetails.getUsername());
    }
}
