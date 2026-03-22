from datetime import date, timedelta, time
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

User = get_user_model()


def monday_of(d: date) -> date:
    return d - timedelta(days=d.weekday())


class Command(BaseCommand):
    help = "Create demo users with fake wellness data (run after seed_data)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--purge",
            action="store_true",
            help="Delete existing demo users (demo, stressy, broke) then recreate.",
        )

    def handle(self, *args, **options):
        from core.models import (
            Profile,
            ClassBlock,
            SleepEntry,
            StressEntry,
            WaterEntry,
            MoodJournalEntry,
            Deadline,
            Recipe,
            WeeklyMealPlan,
            MealPlanEntry,
            QuestTemplate,
            UserQuestDay,
        )

        demo_names = ["demo", "stressy", "broke"]
        if options["purge"]:
            User.objects.filter(username__in=demo_names).delete()
            self.stdout.write(self.style.WARNING("Removed existing demo users."))

        if not Recipe.objects.exists():
            self.stdout.write(self.style.ERROR("No recipes. Run: python manage.py seed_data"))
            return

        r1 = Recipe.objects.order_by("id").first()
        r2 = Recipe.objects.order_by("id")[1] if Recipe.objects.count() > 1 else r1
        today = timezone.now().date()
        now = timezone.now()
        week_start = monday_of(today)

        def upsert_user(username, password, **profile_kw):
            u, created = User.objects.get_or_create(username=username, defaults={"email": f"{username}@demo.local"})
            if created:
                u.set_password(password)
                u.save()
            else:
                u.set_password(password)
                u.save()
            p = u.profile
            for k, v in profile_kw.items():
                setattr(p, k, v)
            p.save()
            return u

        demo = upsert_user(
            "demo",
            "demo12345",
            weekly_budget=Decimal("80.00"),
            university_slug="state-u-cs",
            total_xp=120,
        )
        stressy = upsert_user(
            "stressy",
            "stressy12345",
            weekly_budget=Decimal("45.00"),
            university_slug="state-u-eng",
            total_xp=45,
        )
        broke = upsert_user(
            "broke",
            "broke12345",
            weekly_budget=Decimal("25.00"),
            university_slug="state-u-art",
            total_xp=200,
        )

        for u in (demo, stressy, broke):
            u.class_blocks.all().delete()
            u.sleep_entries.all().delete()
            u.stress_entries.all().delete()
            u.water_entries.all().delete()
            u.mood_entries.all().delete()
            u.deadlines.all().delete()
            u.meal_plans.all().delete()
            u.quest_days.all().delete()

        ClassBlock.objects.create(user=demo, weekday=0, start_time=time(10, 0), end_time=time(11, 30))
        ClassBlock.objects.create(user=demo, weekday=2, start_time=time(14, 0), end_time=time(15, 30))
        ClassBlock.objects.create(user=stressy, weekday=0, start_time=time(9, 0), end_time=time(12, 0))
        ClassBlock.objects.create(user=stressy, weekday=1, start_time=time(13, 0), end_time=time(17, 0))
        ClassBlock.objects.create(user=stressy, weekday=3, start_time=time(10, 0), end_time=time(11, 0))
        ClassBlock.objects.create(user=broke, weekday=4, start_time=time(11, 0), end_time=time(12, 30))

        for i in range(14):
            d = today - timedelta(days=i)
            SleepEntry.objects.update_or_create(
                user=demo,
                date=d,
                defaults={"hours_slept": Decimal("7.25") + (Decimal("0.5") if i % 3 == 0 else Decimal("0"))},
            )
            SleepEntry.objects.update_or_create(
                user=stressy,
                date=d,
                defaults={"hours_slept": Decimal("4.5") if i < 7 else Decimal("5.25")},
            )
            SleepEntry.objects.update_or_create(
                user=broke,
                date=d,
                defaults={"hours_slept": Decimal("6.0")},
            )

        for i, u in enumerate([demo, stressy, broke]):
            WaterEntry.objects.update_or_create(
                user=u,
                date=today,
                defaults={"glasses": 5 + i},
            )
            WaterEntry.objects.update_or_create(
                user=u,
                date=today - timedelta(days=1),
                defaults={"glasses": 4},
            )

        s1 = StressEntry.objects.create(user=demo, level=2, note="Light week.")
        StressEntry.objects.filter(pk=s1.pk).update(created_at=now - timedelta(hours=5))
        s2 = StressEntry.objects.create(user=stressy, level=5, note="Exam cram, no sleep.")
        StressEntry.objects.filter(pk=s2.pk).update(created_at=now - timedelta(hours=2))
        s3 = StressEntry.objects.create(user=broke, level=3, note="Part-time job + labs.")
        StressEntry.objects.filter(pk=s3.pk).update(created_at=now - timedelta(hours=8))

        MoodJournalEntry.objects.create(
            user=demo,
            text="Feeling organized. Finished problem set early.",
        )
        MoodJournalEntry.objects.create(
            user=stressy,
            text="Anxious about calculus final. Coffee all day.",
        )
        MoodJournalEntry.objects.create(
            user=broke,
            text="Tired but okay. Ramen week to save money.",
        )

        Deadline.objects.create(
            user=demo,
            title="CS project milestone",
            due_at=now + timedelta(days=10),
            priority=2,
        )
        for title, days, pr in [
            ("Physics midterm", 2, 1),
            ("Essay draft", 2, 1),
            ("Lab report", 5, 2),
            ("Group presentation", 7, 2),
        ]:
            Deadline.objects.create(
                user=stressy,
                title=title,
                due_at=now + timedelta(days=days),
                priority=pr,
            )
        Deadline.objects.create(
            user=broke,
            title="Scholarship form",
            due_at=now + timedelta(days=14),
            priority=2,
        )

        for u, recs in [
            (demo, [(0, "lunch", r1), (2, "dinner", r2)]),
            (stressy, [(wd, "lunch", r1) for wd in range(5)]),
            (
                broke,
                [(wd, sl, r2) for wd in range(7) for sl in ("breakfast", "lunch", "dinner")],
            ),
        ]:
            plan, _ = WeeklyMealPlan.objects.get_or_create(user=u, week_start=week_start)
            plan.entries.all().delete()
            for wd, slot, r in recs:
                MealPlanEntry.objects.create(plan=plan, recipe=r, weekday=wd, slot=slot)

        templates = list(QuestTemplate.objects.order_by("id")[:3])
        if templates:
            for u in (demo, stressy, broke):
                for t in templates:
                    UserQuestDay.objects.update_or_create(
                        user=u,
                        template=t,
                        date=today,
                        defaults={"completed": u == demo, "completed_at": now if u == demo else None},
                    )

        self.stdout.write(self.style.SUCCESS("Demo accounts ready:\n"))
        self.stdout.write("  demo     / demo12345     - good sleep, low stress, light deadlines\n")
        self.stdout.write("  stressy  / stressy12345  - low sleep, high stress, stacked deadlines (burnout)\n")
        self.stdout.write("  broke    / broke12345    - tight budget, full week meal plan (grocery over budget)\n")
