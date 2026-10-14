package com.spamshield;

import com.spamshield.dto.*;
import com.spamshield.entity.User;
import com.spamshield.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests using H2 in-memory database (test profile).
 * Server listens on localhost only — not 0.0.0.0.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void setup() {
        userRepository.deleteAll();
    }

    @Test
    @Order(1)
    void registration_withValidData_returns201() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setName("Test User");
        req.setEmail("test@example.com");
        req.setPassword("StrongPass@1234");

        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @Order(2)
    void registration_withDuplicateEmail_returns409() throws Exception {
        // Create existing user
        User existing = new User();
        existing.setName("Existing");
        existing.setEmail("dup@example.com");
        existing.setPasswordHash(passwordEncoder.encode("password123"));
        userRepository.save(existing);

        RegisterRequest req = new RegisterRequest();
        req.setName("New User");
        req.setEmail("dup@example.com");
        req.setPassword("StrongPass@5678");

        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(3)
    void login_withValidCredentials_setsHttpOnlyCookie() throws Exception {
        User user = new User();
        user.setName("Login Test");
        user.setEmail("login@example.com");
        user.setPasswordHash(passwordEncoder.encode("ValidPass@123"));
        userRepository.save(user);

        LoginRequest req = new LoginRequest();
        req.setEmail("login@example.com");
        req.setPassword("ValidPass@123");

        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(cookie().httpOnly("__Host-auth", true));
    }

    @Test
    @Order(4)
    void login_withBadPassword_returns401() throws Exception {
        User user = new User();
        user.setName("Bad Pass Test");
        user.setEmail("badpass@example.com");
        user.setPasswordHash(passwordEncoder.encode("CorrectPassword@1"));
        userRepository.save(user);

        LoginRequest req = new LoginRequest();
        req.setEmail("badpass@example.com");
        req.setPassword("WrongPassword@99");

        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(5)
    void register_withShortPassword_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setName("Short Pass");
        req.setEmail("short@example.com");
        req.setPassword("abc");

        mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(6)
    void profile_withoutAuth_returns401() throws Exception {
        mvc.perform(get("/api/profile"))
                .andExpect(status().isUnauthorized());
    }
}
