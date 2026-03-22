from django.contrib import admin
from core.models import (
    Profile,
    ClassBlock,
    SleepEntry,
    StressEntry,
    WaterEntry,
    MoodJournalEntry,
    Deadline,
    QuestTemplate,
    UserQuestDay,
    Recipe,
    WeeklyMealPlan,
    MealPlanEntry,
)

admin.site.register(Profile)
admin.site.register(ClassBlock)
admin.site.register(SleepEntry)
admin.site.register(StressEntry)
admin.site.register(WaterEntry)
admin.site.register(MoodJournalEntry)
admin.site.register(Deadline)
admin.site.register(QuestTemplate)
admin.site.register(UserQuestDay)
admin.site.register(Recipe)
admin.site.register(WeeklyMealPlan)
admin.site.register(MealPlanEntry)
