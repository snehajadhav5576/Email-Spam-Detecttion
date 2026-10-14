package com.spamshield.dto;

import jakarta.validation.constraints.*;

public class AnalysisRequest {

    @Size(max = 500, message = "Subject too long")
    private String subject;

    @Email(message = "Invalid sender email")
    @Size(max = 255, message = "Sender too long")
    private String sender;

    @NotBlank(message = "Email body is required")
    @Size(min = 5, max = 50000, message = "Body must be between 5 and 50000 characters")
    private String body;

    @Size(max = 5000, message = "Headers too long")
    private String headers;

    @Size(max = 2000, message = "URLs field too long")
    private String urls;

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getHeaders() { return headers; }
    public void setHeaders(String headers) { this.headers = headers; }
    public String getUrls() { return urls; }
    public void setUrls(String urls) { this.urls = urls; }
}
