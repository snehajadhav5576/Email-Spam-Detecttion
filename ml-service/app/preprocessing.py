"""
SpamShield AI — Preprocessing utilities.
Must stay in sync with training/train.py preprocessing settings.
"""
import re

# Heuristic indicator patterns — separate from the ML model
SPAM_INDICATORS = [
    (r'\bcongratulations?\b', "Prize/congratulations phrase detected"),
    (r'\b(claim|win|winner|won)\b', "Prize/winning phrase detected"),
    (r'\b(urgent|immediate|act now|limited time)\b', "Urgency phrase detected"),
    (r'\b(free|guaranteed|no risk|100%)\b', "Promotional phrase detected"),
    (r'\b(click here|click now|click below)\b', "Call-to-action link phrase detected"),
    (r'\b(verify|confirm|update).{0,30}(account|payment|info)', "Account verification request detected"),
    (r'http[s]?://[^\s]+', "URL found in email body"),
    (r'\$[\d,]+|\d+[\s]?dollars?', "Monetary amount found"),
    (r'\b(password|ssn|social security|bank account|credit card)\b', "Sensitive information request detected"),
    (r'[\$@#%]{2,}', "Unusual punctuation density detected"),
    (r'\b(nigeria|prince|inheritance|transfer fund)\b', "Advance fee fraud phrase detected"),
    (r'\b(make money|earn money|work from home)\b', "Work-from-home solicitation detected"),
    (r'\b(unsubscribe|opt.out|remove me)\b', "Unsubscribe language detected"),
    (r'[A-Z]{5,}', "Excessive capitalization detected"),
    (r'!{2,}', "Excessive exclamation marks detected"),
]

def preprocess_text(subject: str | None, body: str) -> str:
    """
    Combine subject and body the same way as during training.
    Subject is prepended with a separator to weight it slightly higher.
    """
    parts = []
    if subject and subject.strip():
        parts.append(f"SUBJECT: {subject.strip()}")
    if body and body.strip():
        parts.append(body.strip())
    return " ".join(parts)

def extract_heuristic_indicators(subject: str | None, body: str) -> list[str]:
    """
    Run pattern-based heuristic checks on the email text.
    These are separate from the ML model prediction — they are rule-based signals.
    """
    text = ((subject or "") + " " + (body or "")).lower()
    found = []
    for pattern, description in SPAM_INDICATORS:
        if re.search(pattern, text, re.IGNORECASE):
            found.append(description)
    return found
