-- SpamShield AI - Development Seed Data
-- WARNING: For development only. Do NOT use in production.

USE spamshield;

-- Default admin user (password: Admin@123456, BCrypt strength 12)
INSERT IGNORE INTO users (name, email, password_hash, role, active)
VALUES (
    'System Admin',
    'admin@spamshield.ai',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/IHHxFmO',
    'ADMIN',
    1
);

-- Default regular user (password: User@123456, BCrypt strength 12)
INSERT IGNORE INTO users (name, email, password_hash, role, active)
VALUES (
    'Test User',
    'user@spamshield.ai',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'USER',
    1
);

-- Initial model version record
INSERT IGNORE INTO model_versions (version, model_type, dataset_description, evaluation_summary)
VALUES (
    '1.0.0',
    'MultinomialNB with TF-IDF',
    'Synthetic development dataset (1000 spam + 1000 legitimate examples). NOT for production use. Replace with UCI SMS Spam Collection or Enron dataset and retrain.',
    'Development model — metrics generated on synthetic data and are not representative of real-world performance. Run training/evaluate.py after training on a real dataset.'
);
