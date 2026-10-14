"""
SpamShield AI — ML Training Pipeline
Dataset: Synthetic development dataset (1000 spam + 1000 legitimate examples).
NOTE: Replace with a real dataset (e.g. UCI SMS Spam Collection, Enron Email Dataset)
      and retrain before production use.

UCI SMS Spam Collection: https://archive.ics.uci.edu/dataset/228/sms+spam+collection
Enron Email Dataset: https://www.cs.cmu.edu/~enron/
"""
import os
import json
import pickle
import random
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, confusion_matrix, classification_report)
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV

RANDOM_SEED = 42
MODEL_VERSION = "1.0.0"
MODELS_DIR = Path(__file__).parent.parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Synthetic development dataset
# ---------------------------------------------------------------------------
SPAM_TEMPLATES = [
    "Congratulations! You have won a {prize}. Click here to claim: http://claim-prize-{n}.example.com",
    "URGENT: Your account will be suspended. Verify now: http://verify-{n}.example.com",
    "Free {prize}! Limited time offer. Act now! Call 1-800-SPAM-{n}",
    "You are selected for a ${amount} reward. Click http://reward-{n}.example.com",
    "WIN a FREE vacation! You've been chosen. Reply YES to claim",
    "Your PayPal account has been limited. Confirm: http://paypal-secure-{n}.example.com",
    "WINNER! As a valued customer, you have won a free gift card. Claim: http://gift-{n}.example.com",
    "Make $$$ from home! No experience needed. Call now 1-800-MAKE-MONEY",
    "Cheap meds online! Viagra, Cialis. No prescription. http://meds-{n}.example.com",
    "Nigerian prince needs your help! $5 million reward. Reply immediately",
    "Earn $500 per day working from home! Guaranteed! Click http://easy-money-{n}.example.com",
    "Dear friend, I am contacting you about an inheritance of ${amount}",
    "FINAL NOTICE: You owe ${amount}. Pay now or face legal action",
    "Get rich quick! Invest in crypto {n}. 1000% returns guaranteed!",
    "Your computer is infected! Download antivirus: http://fake-av-{n}.example.com",
]

LEGIT_TEMPLATES = [
    "Hi {name}, meeting tomorrow at {time}. Conference room B.",
    "Please find attached the quarterly report for review.",
    "Your package has been shipped. Tracking number: {n}ABC123",
    "Reminder: your dentist appointment is scheduled for {date}",
    "Team standup notes from today: completed sprint review, planning next sprint",
    "Invoice #{n} from {company} is ready for payment. Due date: {date}",
    "Your bank statement for {month} is now available in online banking",
    "Hello, I wanted to follow up on our conversation about the project",
    "The meeting has been rescheduled to {time} next {day}",
    "Please review the attached document and send your feedback by {date}",
    "Your subscription renewal is coming up. No action needed if you want to continue",
    "Weekly newsletter: here are this week's top articles from {company}",
    "Thank you for your order #{n}. Expected delivery: {date}",
    "Feedback requested: how would you rate your recent experience with us?",
    "Security alert: a new device logged into your account. Was this you?",
]

def gen_spam(n):
    t = random.choice(SPAM_TEMPLATES)
    return t.format(
        prize=random.choice(["iPhone 15", "$1000 cash", "luxury car", "vacation package"]),
        amount=random.randint(500, 50000),
        n=n,
    )

def gen_legit(n):
    t = random.choice(LEGIT_TEMPLATES)
    return t.format(
        name=random.choice(["Alice", "Bob", "Carol", "David", "Eve"]),
        time=f"{random.randint(9,17)}:{'00' if random.random()>0.5 else '30'}",
        date=f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
        company=random.choice(["Acme Corp", "TechCo", "GlobalInc"]),
        month=random.choice(["January","February","March","April"]),
        day=random.choice(["Monday","Tuesday","Wednesday"]),
        n=n,
    )

def build_dataset(n_each=1000):
    random.seed(RANDOM_SEED)
    texts = [gen_spam(i) for i in range(n_each)] + [gen_legit(i) for i in range(n_each)]
    labels = [1] * n_each + [0] * n_each
    df = pd.DataFrame({"text": texts, "label": labels})
    df = df.sample(frac=1, random_state=RANDOM_SEED).reset_index(drop=True)
    return df

# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------
def train():
    print("=" * 60)
    print("SpamShield ML Training Pipeline")
    print("IMPORTANT: Using synthetic development dataset.")
    print("Replace with a real dataset for production use.")
    print("=" * 60)

    df = build_dataset(n_each=1000)
    print(f"Dataset: {len(df)} examples ({df['label'].sum()} spam, {(df['label']==0).sum()} legitimate)")

    X_train, X_test, y_train, y_test = train_test_split(
        df["text"], df["label"], test_size=0.2, random_state=RANDOM_SEED, stratify=df["label"]
    )
    print(f"Train: {len(X_train)}, Test: {len(X_test)}")

    # Fit vectorizer ONLY on training data — prevents data leakage
    vectorizer = TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=2,
    )

    base_clf = MultinomialNB(alpha=0.1)
    # Use calibration for better probability estimates
    clf = CalibratedClassifierCV(base_clf, cv=5, method="isotonic")

    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    clf.fit(X_train_vec, y_train)
    y_pred = clf.predict(X_test_vec)
    y_prob = clf.predict_proba(X_test_vec)[:, 1]

    # Evaluation
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0

    metrics = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "false_positive_rate": round(fpr, 4),
        "false_negative_rate": round(fnr, 4),
        "confusion_matrix": cm.tolist(),
        "dataset": "synthetic_development",
        "train_size": len(X_train),
        "test_size": len(X_test),
        "note": "Metrics generated on synthetic development data. Not representative of real-world performance.",
    }

    print("\n--- Evaluation Results ---")
    print(f"Accuracy:            {acc:.4f}")
    print(f"Precision:           {prec:.4f}")
    print(f"Recall:              {rec:.4f}")
    print(f"F1-Score:            {f1:.4f}")
    print(f"False Positive Rate: {fpr:.4f}  (legitimate classified as spam)")
    print(f"False Negative Rate: {fnr:.4f}  (spam classified as legitimate)")
    print(f"\nConfusion Matrix:\n{cm}")
    print("\n" + classification_report(y_test, y_pred, target_names=["Legitimate", "Spam"]))

    # Save artifacts
    model_path = MODELS_DIR / "model.pkl"
    vectorizer_path = MODELS_DIR / "vectorizer.pkl"
    metrics_path = MODELS_DIR / "metrics.json"
    version_path = MODELS_DIR / "version.txt"

    with open(model_path, "wb") as f:
        pickle.dump(clf, f)
    with open(vectorizer_path, "wb") as f:
        pickle.dump(vectorizer, f)
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    with open(version_path, "w") as f:
        f.write(MODEL_VERSION)

    print(f"\nModel saved to:      {model_path}")
    print(f"Vectorizer saved to: {vectorizer_path}")
    print(f"Metrics saved to:    {metrics_path}")
    print(f"Version:             {MODEL_VERSION}")

if __name__ == "__main__":
    train()
