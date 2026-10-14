package com.spamshield.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Date;
import java.util.HexFormat;

/**
 * JWT utility. Secret resolution order:
 *   1. JWT_SECRET environment variable
 *   2. jwt_secret.txt file (dev convenience)
 *   3. Ephemeral random value with a loud warning (single-instance dev only)
 *
 * TODO(security): In production, store JWT_SECRET in a secrets manager (e.g. AWS Secrets Manager / Vault).
 * TODO(security): Add OAuth2 / OIDC provider support for federated login.
 * TODO(security): Add MFA support.
 */
@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtUtil(@Value("${jwt.secret:}") String configuredSecret,
                   @Value("${jwt.expiration-ms:86400000}") long expirationMs) {
        this.expirationMs = expirationMs;
        this.signingKey = Keys.hmacShaKeyFor(resolveSecret(configuredSecret).getBytes(StandardCharsets.UTF_8));
    }

    private String resolveSecret(String configured) {
        if (configured != null && configured.length() >= 32) {
            return configured;
        }
        // Try file
        try {
            Path f = Path.of("jwt_secret.txt");
            if (Files.exists(f)) {
                String s = Files.readString(f).strip();
                if (s.length() >= 32) {
                    log.warn("JWT secret loaded from jwt_secret.txt — do NOT use in production");
                    return s;
                }
            }
        } catch (Exception ignored) {}

        // Generate ephemeral — warn loudly
        byte[] random = new byte[64];
        new SecureRandom().nextBytes(random);
        String ephemeral = HexFormat.of().formatHex(random);
        log.warn("SECURITY WARNING: No JWT_SECRET configured. Generating ephemeral secret. " +
                 "All tokens will be invalidated on restart. NOT suitable for multi-instance deployment.");
        return ephemeral;
    }

    public String generateToken(String email, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(signingKey, Jwts.SIG.HS256)  // Algorithm hardcoded — never derived from token
                .compact();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT validation failed");
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
