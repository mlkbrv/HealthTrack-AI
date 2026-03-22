from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from core import views

router = DefaultRouter()
router.register(r"class-blocks", views.ClassBlockViewSet, basename="classblock")
router.register(r"sleep-entries", views.SleepEntryViewSet, basename="sleep")
router.register(r"stress-entries", views.StressEntryViewSet, basename="stress")
router.register(r"water-entries", views.WaterEntryViewSet, basename="water")
router.register(r"mood-entries", views.MoodJournalEntryViewSet, basename="mood")
router.register(r"deadlines", views.DeadlineViewSet, basename="deadline")
router.register(r"recipes", views.RecipeViewSet, basename="recipe")

urlpatterns = [
    path("health/", views.HealthView.as_view()),
    path("auth/register/", views.RegisterView.as_view()),
    path("auth/token/", views.LoginView.as_view()),
    path("auth/token/refresh/", TokenRefreshView.as_view()),
    path("profile/me/", views.ProfileMeView.as_view()),
    path("insights/burnout-risk/", views.InsightsBurnoutView.as_view()),
    path("recommendations/", views.RecommendationsView.as_view()),
    path("chat/", views.ChatView.as_view()),
    path("mood/analyze/", views.MoodAnalyzeView.as_view()),
    path("quests/today/", views.QuestsTodayView.as_view()),
    path("quests/<int:pk>/complete/", views.QuestCompleteView.as_view()),
    path("meal-plan/week/", views.MealPlanWeekView.as_view()),
    path("grocery/", views.GroceryListView.as_view()),
    path("focus/tracks/", views.FocusTracksView.as_view()),
    path("insights/slot-suggestions/", views.SlotSuggestionsView.as_view()),
    path("hydration/quiet-windows/", views.HydrationQuietWindowsView.as_view()),
    path("", include(router.urls)),
]
