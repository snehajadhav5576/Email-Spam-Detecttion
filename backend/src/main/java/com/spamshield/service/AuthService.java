package com.spamshield.service;

import com.spamshield.dto.*;
import com.spamshield.entity.*;
import com.spamshield.exception.BusinessException;
import com.spamshield.repository.*;
import com.spamshield.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String COOKIE_NAME = "auth-token";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditLogRepository auditLogRepository;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public UserDto register(RegisterRequest req, String ipAddress) {
        if (userRepository.existsByEmail(req.getEmail().toLowerCase())) {
            // Audit failure but return generic error to avoid email enumeration
            audit(null, "REGISTER_ATTEMPT_DUPLICATE", AuditLog.Status.FAILURE, ipAddress);
            throw new BusinessException("Registration failed. Please check your details.");
        }

        User user = new User();
        user.setName(req.getName().trim());
        user.setEmail(req.getEmail().toLowerCase().trim());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(User.Role.USER);
        user = userRepository.save(user);

        audit(user, "REGISTER", AuditLog.Status.SUCCESS, ipAddress);
        log.info("New user registered: id={}", user.getId());
        return toDto(user);
    }

    @Transactional
    public UserDto login(LoginRequest req, HttpServletResponse response, String ipAddress) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase())
                .orElseThrow(() -> {
                    audit(null, "LOGIN_FAILED_USER_NOT_FOUND", AuditLog.Status.FAILURE, ipAddress);
                    // Generic message to prevent user enumeration
                    return new BadCredentialsException("Invalid email or password");
                });

        if (!user.isActive()) {
            audit(user, "LOGIN_FAILED_DISABLED", AuditLog.Status.FAILURE, ipAddress);
            throw new DisabledException("Account is disabled");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            audit(user, "LOGIN_FAILED_BAD_CREDENTIALS", AuditLog.Status.FAILURE, ipAddress);
            // Identical message — no timing oracle via user lookup difference
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        setAuthCookie(response, token);

        audit(user, "LOGIN", AuditLog.Status.SUCCESS, ipAddress);
        log.info("User logged in: id={}", user.getId());
        return toDto(user);
    }

    public void logout(HttpServletResponse response, String email, String ipAddress) {
        clearAuthCookie(response);
        userRepository.findByEmail(email).ifPresent(u -> audit(u, "LOGOUT", AuditLog.Status.SUCCESS, ipAddress));
    }

    private void setAuthCookie(HttpServletResponse response, String token) {
        // HttpOnly + Secure + SameSite=None — required for cross-domain (Vercel → Render)
        Cookie cookie = new Cookie(COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);      // Required when SameSite=None
        cookie.setPath("/");
        cookie.setMaxAge(86400);     // 24h — matches JWT expiry
        cookie.setAttribute("SameSite", "None");
        response.addCookie(cookie);
    }

    private void clearAuthCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "None");
        response.addCookie(cookie);
    }

    private void audit(User user, String action, AuditLog.Status status, String ip) {
        AuditLog log = new AuditLog();
        log.setUser(user);
        log.setAction(action);
        log.setStatus(status);
        log.setIpAddress(ip);
        auditLogRepository.save(log);
    }

    private UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.isActive(), u.getCreatedAt());
    }
}
