import requests
from django.conf import settings

SYSTEM_CHAT = (
    "You are HealthTrack AI, a wellness coach for university students. "
    "Give practical, non-clinical lifestyle tips in English. "
    "Never diagnose or prescribe medication. "
    "If the user expresses self-harm, suicide, or crisis, reply with a short supportive message and tell them to contact local emergency services or campus crisis resources immediately."
)

SYSTEM_RECOMMEND = (
    "You are HealthTrack AI. Using the structured student wellness summary, output 3 to 5 short bullet recommendations in English. "
    "Focus on sleep, stress, nutrition on a budget, study breaks, and movement. No medical diagnosis."
)

SYSTEM_MOOD = (
    "Summarize the emotional tone of the journal entry in 2 sentences in English and list up to 3 possible stress themes as short labels. "
    "JSON only with keys: summary (string), themes (array of strings). No clinical labels."
)

CRISIS_KEYWORDS = (
    "suicide",
    "kill myself",
    "end my life",
    "self-harm",
    "want to die",
)


def _has_crisis(text):
    t = (text or "").lower()
    return any(k in t for k in CRISIS_KEYWORDS)


def _call_chat(messages, max_tokens=500):
    key = getattr(settings, "LLM_API_KEY", "") or ""
    if not key:
        return None
    base = getattr(settings, "LLM_API_BASE", "https://api.openai.com/v1").rstrip("/")
    model = getattr(settings, "LLM_MODEL", "gpt-4o-mini")
    url = f"{base}/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    body = {"model": model, "messages": messages, "max_tokens": max_tokens}
    try:
        r = requests.post(url, json=body, headers=headers, timeout=45)
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


def chat_reply(user_message):
    if _has_crisis(user_message):
        return (
            "If you are in immediate danger, contact your local emergency number now. "
            "You matter — please reach out to campus counseling or a crisis line. "
            "This app cannot provide emergency help."
        )
    content = _call_chat(
        [
            {"role": "system", "content": SYSTEM_CHAT},
            {"role": "user", "content": user_message},
        ]
    )
    if content:
        return content
    return (
        "I am offline right now. Try a short walk, water, and a consistent sleep time tonight. "
        "For urgent mental health support, use your campus counseling service."
    )


def recommendations_from_context(context_text):
    content = _call_chat(
        [
            {"role": "system", "content": SYSTEM_RECOMMEND},
            {"role": "user", "content": context_text},
        ],
        max_tokens=400,
    )
    if content:
        return content
    return (
        "- Keep a fixed wake time even after late study nights.\n"
        "- Prep one 15-minute dorm meal ahead of long library sessions.\n"
        "- Take a 5-minute stretch each hour at the desk.\n"
        "- Batch small deadlines to reduce context switching.\n"
        "- Limit late caffeine if sleep has been under 7 hours."
    )


def mood_analyze(text):
    if _has_crisis(text):
        return {
            "summary": "Your message may indicate serious distress. Please contact emergency services or campus crisis support now.",
            "themes": ["crisis_support"],
            "crisis": True,
        }
    raw = _call_chat(
        [
            {"role": "system", "content": SYSTEM_MOOD},
            {"role": "user", "content": text[:8000]},
        ],
        max_tokens=300,
    )
    if raw:
        try:
            import json

            data = json.loads(raw)
            data["crisis"] = False
            return data
        except Exception:
            return {"summary": raw, "themes": [], "crisis": False}
    words = text.lower().split()
    stressed = any(w in ("exam", "stress", "tired", "anxious", "overwhelmed") for w in words)
    return {
        "summary": "Unable to run AI analysis. Consider noting what happened just before this mood.",
        "themes": ["stress"] if stressed else ["general"],
        "crisis": False,
    }
