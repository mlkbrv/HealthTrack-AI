from datetime import datetime, time, date
from decimal import Decimal
from collections import defaultdict
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from core.models import (
    ClassBlock,
    SleepEntry,
    StressEntry,
    WaterEntry,
    MoodJournalEntry,
    Deadline,
    UserQuestDay,
    Recipe,
    WeeklyMealPlan,
    MealPlanEntry,
)
from core.serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    ClassBlockSerializer,
    SleepEntrySerializer,
    StressEntrySerializer,
    WaterEntrySerializer,
    MoodJournalEntrySerializer,
    DeadlineSerializer,
    UserQuestDaySerializer,
    RecipeSerializer,
    WeeklyMealPlanWriteSerializer,
    ChatSerializer,
    MoodAnalyzeSerializer,
)
from core.services.burnout import compute_burnout_risk, sleep_tips_for_short_night
from core.services import llm
from core.quests import ensure_daily_quests

User = get_user_model()

FOCUS_TRACKS = [
    {"id": "calm_5", "title": "5-minute calm reset", "duration_minutes": 5, "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"},
    {"id": "focus_25", "title": "25-minute study focus", "duration_minutes": 25, "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"},
]


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"ok": True, "service": "healthtrack-api"})


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class ProfileMeView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user.profile

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return ProfileUpdateSerializer
        return ProfileSerializer


class ClassBlockViewSet(viewsets.ModelViewSet):
    serializer_class = ClassBlockSerializer

    def get_queryset(self):
        return ClassBlock.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SleepEntryViewSet(viewsets.ModelViewSet):
    serializer_class = SleepEntrySerializer

    def get_queryset(self):
        return SleepEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StressEntryViewSet(viewsets.ModelViewSet):
    serializer_class = StressEntrySerializer

    def get_queryset(self):
        return StressEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WaterEntryViewSet(viewsets.ModelViewSet):
    serializer_class = WaterEntrySerializer

    def get_queryset(self):
        return WaterEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MoodJournalEntryViewSet(viewsets.ModelViewSet):
    serializer_class = MoodJournalEntrySerializer

    def get_queryset(self):
        return MoodJournalEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DeadlineViewSet(viewsets.ModelViewSet):
    serializer_class = DeadlineSerializer

    def get_queryset(self):
        return Deadline.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RecipeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecipeSerializer
    queryset = Recipe.objects.all()


class InsightsBurnoutView(APIView):
    def get(self, request):
        data = compute_burnout_risk(request.user)
        last_sleep = SleepEntry.objects.filter(user=request.user).order_by("-date").first()
        h = float(last_sleep.hours_slept) if last_sleep else None
        data["sleep_tips_short_night"] = sleep_tips_for_short_night(h)
        return Response(data)


class RecommendationsView(APIView):
    def get(self, request):
        u = request.user
        profile = u.profile
        risk = compute_burnout_risk(u)
        sleeps = list(SleepEntry.objects.filter(user=u).order_by("-date")[:7].values_list("hours_slept", flat=True))
        stress = StressEntry.objects.filter(user=u).order_by("-created_at").first()
        next_dl = Deadline.objects.filter(user=u, due_at__gte=timezone.now()).order_by("due_at").first()
        lines = [
            f"User weekly budget: {profile.weekly_budget}",
            f"Burnout level: {risk['level']}",
            f"Recent sleep hours (up to 7 entries): {[float(x) for x in sleeps]}",
            f"Latest stress 1-5: {stress.level if stress else 'unknown'}",
            f"Next deadline: {next_dl.title if next_dl else 'none'} at {next_dl.due_at if next_dl else ''}",
        ]
        text = llm.recommendations_from_context("\n".join(lines))
        return Response({"text": text})


class ChatView(APIView):
    def post(self, request):
        ser = ChatSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        reply = llm.chat_reply(ser.validated_data["message"])
        return Response({"reply": reply})


class MoodAnalyzeView(APIView):
    def post(self, request):
        ser = MoodAnalyzeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = llm.mood_analyze(ser.validated_data["text"])
        return Response(result)


class QuestsTodayView(APIView):
    def get(self, request):
        rows = ensure_daily_quests(request.user)
        return Response(UserQuestDaySerializer(rows, many=True).data)


class QuestCompleteView(APIView):
    def post(self, request, pk):
        try:
            row = UserQuestDay.objects.select_related("template").get(pk=pk, user=request.user)
        except UserQuestDay.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        if row.completed:
            return Response(UserQuestDaySerializer(row).data)
        with transaction.atomic():
            row.completed = True
            row.completed_at = timezone.now()
            row.save(update_fields=["completed", "completed_at"])
            prof = request.user.profile
            prof.total_xp += row.template.xp_reward
            prof.save(update_fields=["total_xp"])
        row.refresh_from_db()
        return Response(UserQuestDaySerializer(row).data)


class MealPlanWeekView(APIView):
    def post(self, request):
        ser = WeeklyMealPlanWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ws = ser.validated_data["week_start"]
        entries = ser.validated_data["entries"]
        user = request.user
        with transaction.atomic():
            plan, _ = WeeklyMealPlan.objects.get_or_create(user=user, week_start=ws)
            plan.entries.all().delete()
            for e in entries:
                try:
                    recipe = Recipe.objects.get(pk=e["recipe_id"])
                except Recipe.DoesNotExist:
                    return Response({"detail": "Invalid recipe_id."}, status=400)
                MealPlanEntry.objects.create(
                    plan=plan,
                    recipe=recipe,
                    weekday=e["weekday"],
                    slot=e["slot"],
                )
        return Response({"week_start": str(ws), "entries_count": len(entries)})


class GroceryListView(APIView):
    def get(self, request):
        ws = request.query_params.get("week_start")
        if not ws:
            return Response({"detail": "week_start is required (YYYY-MM-DD)."}, status=400)
        try:
            week_start = date.fromisoformat(ws)
        except ValueError:
            return Response({"detail": "Invalid week_start."}, status=400)
        try:
            plan = WeeklyMealPlan.objects.prefetch_related("entries__recipe").get(user=request.user, week_start=week_start)
        except WeeklyMealPlan.DoesNotExist:
            return Response({"items": [], "estimated_total": "0.00", "weekly_budget": str(request.user.profile.weekly_budget), "over_budget": False})
        merged = defaultdict(lambda: {"amount": "", "unit": "", "cost": Decimal("0")})
        for ent in plan.entries.all():
            for ing in ent.recipe.ingredients or []:
                name = (ing.get("name") or "").strip().lower()
                if not name:
                    continue
                unit = ing.get("unit") or ""
                amount = str(ing.get("amount") or "")
                try:
                    c = Decimal(str(ing.get("cost_estimate") or "0"))
                except Exception:
                    c = Decimal("0")
                key = name
                merged[key]["name"] = ing.get("name") or name
                merged[key]["unit"] = unit or merged[key]["unit"]
                merged[key]["amount"] = amount or merged[key]["amount"]
                merged[key]["cost"] += c
        items = []
        total = Decimal("0")
        for v in merged.values():
            total += v["cost"]
            items.append(
                {
                    "name": v["name"],
                    "amount": v["amount"],
                    "unit": v["unit"],
                    "estimated_cost": str(v["cost"].quantize(Decimal("0.01"))),
                }
            )
        budget = request.user.profile.weekly_budget
        over = total > budget
        return Response(
            {
                "items": sorted(items, key=lambda x: x["name"]),
                "estimated_total": str(total.quantize(Decimal("0.01"))),
                "weekly_budget": str(budget),
                "over_budget": over,
            }
        )


class FocusTracksView(APIView):
    def get(self, request):
        return Response({"tracks": FOCUS_TRACKS})


class SlotSuggestionsView(APIView):
    def get(self, request):
        blocks = list(ClassBlock.objects.filter(user=request.user).order_by("weekday", "start_time"))
        if not blocks:
            return Response(
                {
                    "sleep_window": "Aim for 11:00 PM to 7:00 AM when possible.",
                    "meals": "Breakfast 8:00, lunch 12:30, dinner 18:30.",
                    "workout": "Walk or light workout 17:00 to 18:00.",
                }
            )
        by_d = defaultdict(list)
        for b in blocks:
            by_d[b.weekday].append((b.start_time, b.end_time))

        def suggest_for_day(weekday):
            day_blocks = sorted(by_d.get(weekday, []))
            if not day_blocks:
                return "No classes recorded — keep a regular meal and movement block."
            gaps = []
            day_start = time(7, 0)
            day_end = time(22, 0)
            prev_end = day_start
            for st, et in day_blocks:
                if st > prev_end:
                    gaps.append((prev_end, st))
                prev_end = max(prev_end, et)
            if prev_end < day_end:
                gaps.append((prev_end, day_end))
            if not gaps:
                return "Tight schedule — use 10-minute walks between classes."
            best = max(gaps, key=lambda g: (datetime.combine(date.today(), g[1]) - datetime.combine(date.today(), g[0])).seconds)
            return f"Use gap {best[0].strftime('%H:%M')} to {best[1].strftime('%H:%M')} for a meal prep or workout."

        today_wd = timezone.now().weekday()
        return Response(
            {
                "today_workout_or_meal_prep": suggest_for_day(today_wd),
                "sleep_window": "Protect 7.5 to 8 hours when no late labs; shift earlier before exam weeks.",
            }
        )


class HydrationQuietWindowsView(APIView):
    def get(self, request):
        blocks = ClassBlock.objects.filter(user=request.user)
        out = [{"weekday": b.weekday, "start_time": b.start_time.isoformat(timespec="minutes"), "end_time": b.end_time.isoformat(timespec="minutes")} for b in blocks]
        return Response({"class_blocks": out})
