package com.spamshield.controller;

import com.spamshield.dto.*;
import com.spamshield.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserDto> register(@Valid @RequestBody RegisterRequest req,
                                         HttpServletRequest request) {
        UserDto user = authService.register(req, getClientIp(request));
        return ApiResponse.ok("Registration successful", user);
    }

    @PostMapping("/login")
    public ApiResponse<UserDto> login(@Valid @RequestBody LoginRequest req,
                                      HttpServletRequest request,
                                      HttpServletResponse response) {
        UserDto user = authService.login(req, response, getClientIp(request));
        return ApiResponse.ok("Login successful", user);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@AuthenticationPrincipal UserDetails userDetails,
                                     HttpServletRequest request,
                                     HttpServletResponse response) {
        authService.logout(response, userDetails.getUsername(), getClientIp(request));
        return ApiResponse.ok("Logged out", null);
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> me(@AuthenticationPrincipal UserDetails userDetails) {
        // Build minimal DTO from security context — no extra DB call needed here
        // Full profile is at GET /api/profile
        return ApiResponse.ok(null);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
