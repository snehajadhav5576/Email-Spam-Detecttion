-- SpamShield AI - Database Schema
-- MySQL 8.0+
-- All timestamps stored in UTC

CREATE DATABASE IF NOT EXISTS spamshield
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE spamshield;

-- ============================================================
-- users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name          VARCHAR(120)       NOT NULL,
    email         VARCHAR(255)       NOT NULL,
    password_hash VARCHAR(255)       NOT NULL,
    role          ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
    active        TINYINT(1)         NOT NULL DEFAULT 1,
    created_at    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- model_versions
-- ============================================================
CREATE TABLE IF NOT EXISTS model_versions (
    id                  BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    version             VARCHAR(50)      NOT NULL,
    model_type          VARCHAR(100)     NOT NULL,
    dataset_description TEXT,
    evaluation_summary  TEXT,
    created_at          DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_model_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- email_analyses
-- ============================================================
CREATE TABLE IF NOT EXISTS email_analyses (
    id             BIGINT UNSIGNED       NOT NULL AUTO_INCREMENT,
    user_id        BIGINT UNSIGNED       NOT NULL,
    subject        VARCHAR(500),
    sender         VARCHAR(255),
    prediction     ENUM('SPAM','NOT_SPAM') NOT NULL,
    model_score    DECIMAL(5,4)          NOT NULL,
    score_type     VARCHAR(50)           NOT NULL DEFAULT 'model_probability',
    model_version  VARCHAR(50)           NOT NULL,
    risk_level     ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'LOW',
    created_at     DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_analyses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_analyses_user_id (user_id),
    INDEX idx_analyses_prediction (prediction),
    INDEX idx_analyses_created_at (created_at),
    INDEX idx_analyses_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- analysis_indicators
-- ============================================================
CREATE TABLE IF NOT EXISTS analysis_indicators (
    id                  BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    analysis_id         BIGINT UNSIGNED  NOT NULL,
    indicator_type      VARCHAR(100)     NOT NULL,
    indicator_description VARCHAR(500)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_indicators_analysis FOREIGN KEY (analysis_id) REFERENCES email_analyses (id) ON DELETE CASCADE,
    INDEX idx_indicators_analysis_id (analysis_id),
    INDEX idx_indicators_type (indicator_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED,
    action     VARCHAR(200)     NOT NULL,
    status     ENUM('SUCCESS','FAILURE') NOT NULL DEFAULT 'SUCCESS',
    ip_address VARCHAR(45),
    created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_audit_user_id (user_id),
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
