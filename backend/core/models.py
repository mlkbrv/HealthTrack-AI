from django.conf import settings
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    weekly_budget = models.DecimalField(max_digits=10, decimal_places=2, default=50)
    university_slug = models.CharField(max_length=120, blank=True)
    total_xp = models.PositiveIntegerField(default=0)
    wake_time = models.TimeField(null=True, blank=True)
    sleep_reminder_time = models.TimeField(null=True, blank=True)

    def __str__(self):
        return f"Profile({self.user_id})"


class ClassBlock(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="class_blocks")
    weekday = models.PositiveSmallIntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        ordering = ["weekday", "start_time"]


class SleepEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sleep_entries")
    date = models.DateField()
    hours_slept = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        ordering = ["-date"]
        constraints = [
            models.UniqueConstraint(fields=["user", "date"], name="uniq_sleep_per_user_date"),
        ]


class StressEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="stress_entries")
    created_at = models.DateTimeField(auto_now_add=True)
    level = models.PositiveSmallIntegerField()
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]


class WaterEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="water_entries")
    date = models.DateField()
    glasses = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["-date"]
        constraints = [
            models.UniqueConstraint(fields=["user", "date"], name="uniq_water_per_user_date"),
        ]


class MoodJournalEntry(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mood_entries")
    created_at = models.DateTimeField(auto_now_add=True)
    text = models.TextField()

    class Meta:
        ordering = ["-created_at"]


class Deadline(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="deadlines")
    title = models.CharField(max_length=255)
    due_at = models.DateTimeField()
    priority = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ["due_at"]


class QuestTemplate(models.Model):
    code = models.SlugField(unique=True, max_length=64)
    title = models.CharField(max_length=200)
    description = models.TextField()
    xp_reward = models.PositiveIntegerField(default=10)

    def __str__(self):
        return self.title


class UserQuestDay(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quest_days")
    template = models.ForeignKey(QuestTemplate, on_delete=models.CASCADE)
    date = models.DateField()
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "template", "date"], name="uniq_user_quest_date"),
        ]


class Recipe(models.Model):
    title = models.CharField(max_length=200)
    prep_minutes = models.PositiveSmallIntegerField()
    ingredients = models.JSONField(default=list)
    instructions = models.TextField()

    def __str__(self):
        return self.title


class WeeklyMealPlan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="meal_plans")
    week_start = models.DateField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "week_start"], name="uniq_user_week_meal"),
        ]


class MealPlanEntry(models.Model):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SLOT_CHOICES = [
        (BREAKFAST, "breakfast"),
        (LUNCH, "lunch"),
        (DINNER, "dinner"),
    ]
    plan = models.ForeignKey(WeeklyMealPlan, on_delete=models.CASCADE, related_name="entries")
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    weekday = models.PositiveSmallIntegerField()
    slot = models.CharField(max_length=16, choices=SLOT_CHOICES)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["plan", "weekday", "slot"], name="uniq_plan_day_slot"),
        ]
