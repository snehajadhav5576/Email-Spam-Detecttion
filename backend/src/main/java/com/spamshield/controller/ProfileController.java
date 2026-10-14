package com.spamshield.controller;

import com.spamshield.dto.*;
import com.spamshield.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ApiResponse<UserDto> getProfile(@AuthenticationPrincipal UserDetails ud) {
        return ApiResponse.ok(userService.getProfile(ud.getUsername()));
    }

    @PutMapping
    public ApiResponse<UserDto> updateProfile(@AuthenticationPrincipal UserDetails ud,
                                               @Valid @RequestBody UpdateProfileRequest req) {
        return ApiResponse.ok(userService.updateProfile(ud.getUsername(), req));
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(@AuthenticationPrincipal UserDetails ud,
                                             @Valid @RequestBody ChangePasswordRequest req) {
        userService.changePassword(ud.getUsername(), req);
        return ApiResponse.ok("Password updated", null);
    }

    @DeleteMapping("/history")
    public ApiResponse<Void> deleteAllHistory(@AuthenticationPrincipal UserDetails ud) {
        userService.deleteAllHistory(ud.getUsername());
        return ApiResponse.ok("Analysis history deleted", null);
    }
}
