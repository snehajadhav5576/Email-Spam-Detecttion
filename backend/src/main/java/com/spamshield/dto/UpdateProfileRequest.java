package com.spamshield.dto;

import jakarta.validation.constraints.*;

public class UpdateProfileRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 120, message = "Name must be between 2 and 120 characters")
    @Pattern(regexp = "^[\\p{L}\\s'-]+$", message = "Name contains invalid characters")
    private String name;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
