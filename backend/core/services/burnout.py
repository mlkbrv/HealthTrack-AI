from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Count
from core.models import SleepEntry, StressEntry, Deadline


def compute_burnout_risk(user):
    now = timezone.now()
    week_ago = (now - timedelta(days=7)).date()
    sleep_avg = (
        SleepEntry.objects.filter(user=user, date__gte=week_ago)
        .aggregate(v=Avg("hours_slept"))
        .get("v")
    )
    sleep_avg = float(sleep_avg) if sleep_avg is not None else None
    latest_stress = StressEntry.objects.filter(user=user).order_by("-created_at").first()
    stress_level = latest_stress.level if latest_stress else None
    soon = now + timedelta(days=3)
    deadline_count = Deadline.objects.filter(user=user, due_at__gte=now, due_at__lte=soon).count()
    heavy_week = (
        Deadline.objects.filter(user=user, due_at__gte=now, due_at__lte=now + timedelta(days=7))
        .aggregate(c=Count("id"))
        .get("c", 0)
    )

    score = 0
    reasons = []
    if sleep_avg is not None and sleep_avg < 6:
        score += 2
        reasons.append("Average sleep over the last 7 days is under 6 hours.")
    if stress_level is not None and stress_level >= 4:
        score += 2
        reasons.append("Recent stress rating is high.")
    if deadline_count >= 2:
        score += 1
        reasons.append("Multiple deadlines in the next 3 days.")
    if heavy_week >= 4:
        score += 1
        reasons.append("Many deadlines this week.")

    if score >= 4:
        level = "high"
        message = "Your schedule and recovery signals suggest elevated burnout risk. Prioritize sleep, short breaks, and reach out to campus support if you feel overwhelmed."
    elif score >= 2:
        level = "medium"
        message = "You are trending toward fatigue. Try to protect one longer sleep block and reduce non-essential commitments before exams."
    else:
        level = "low"
        message = "Recovery signals look manageable. Keep steady habits and watch sleep as deadlines approach."

    return {
        "level": level,
        "message": message,
        "factors": {
            "avg_sleep_hours_7d": round(sleep_avg, 2) if sleep_avg is not None else None,
            "latest_stress_level": stress_level,
            "deadlines_next_3d": deadline_count,
            "deadlines_next_7d": heavy_week,
        },
        "reasons": reasons,
    }


def sleep_tips_for_short_night(hours):
    h = float(hours) if hours is not None else 0
    if h >= 7:
        return "Aim for a consistent bedtime tonight to lock in recovery."
    if h >= 6:
        return "Six hours can work before a big day: avoid caffeine after 2pm, hydrate, and take a 10-minute walk before the exam."
    return "Short sleep increases error risk. Plan a 20-minute nap before late afternoon and avoid all-nighters if possible."
