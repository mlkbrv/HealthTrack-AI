from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
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

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "password_confirm")
        extra_kwargs = {"email": {"required": False, "allow_blank": True}}

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        return token


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = (
            "username",
            "email",
            "weekly_budget",
            "university_slug",
            "total_xp",
            "wake_time",
            "sleep_reminder_time",
        )


class ProfileUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Profile
        fields = (
            "username",
            "weekly_budget",
            "university_slug",
            "wake_time",
            "sleep_reminder_time",
            "email",
        )

    def update(self, instance, validated_data):
        email = validated_data.pop("email", None)
        if email is not None:
            instance.user.email = email
            instance.user.save(update_fields=["email"])
        return super().update(instance, validated_data)


class ClassBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassBlock
        fields = ("id", "weekday", "start_time", "end_time")


class SleepEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SleepEntry
        fields = ("id", "date", "hours_slept")


class StressEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = StressEntry
        fields = ("id", "created_at", "level", "note")
        read_only_fields = ("created_at",)


class WaterEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterEntry
        fields = ("id", "date", "glasses")


class MoodJournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodJournalEntry
        fields = ("id", "created_at", "text")
        read_only_fields = ("created_at",)


class DeadlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deadline
        fields = ("id", "title", "due_at", "priority")


class QuestTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestTemplate
        fields = ("id", "code", "title", "description", "xp_reward")


class UserQuestDaySerializer(serializers.ModelSerializer):
    template = QuestTemplateSerializer(read_only=True)

    class Meta:
        model = UserQuestDay
        fields = ("id", "template", "date", "completed", "completed_at")


class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = ("id", "title", "prep_minutes", "ingredients", "instructions")


class MealPlanEntryWriteSerializer(serializers.Serializer):
    weekday = serializers.IntegerField(min_value=0, max_value=6)
    slot = serializers.ChoiceField(choices=["breakfast", "lunch", "dinner"])
    recipe_id = serializers.IntegerField()


class WeeklyMealPlanWriteSerializer(serializers.Serializer):
    week_start = serializers.DateField()
    entries = MealPlanEntryWriteSerializer(many=True)


class ChatSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=4000)


class MoodAnalyzeSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=8000)
