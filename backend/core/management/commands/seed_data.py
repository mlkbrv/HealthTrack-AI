from django.core.management.base import BaseCommand
from core.models import QuestTemplate, Recipe


class Command(BaseCommand):
    help = "Seed quest templates and dorm-friendly recipes"

    def handle(self, *args, **options):
        quests = [
            ("walk_8k", "Walk 8,000 steps", "Hit your step goal between classes.", 15),
            ("water_6", "Hydration streak", "Drink 6 glasses of water today.", 10),
            ("stretch_10", "Desk reset", "10 minutes of neck and upper back stretches.", 12),
            ("sleep_log", "Sleep check-in", "Log last night's sleep honestly.", 8),
            ("no_late_caffeine", "Caffeine curfew", "No caffeine after 3 PM.", 10),
            ("meal_prep", "One quick meal", "Cook one 15-minute dorm recipe.", 15),
        ]
        for code, title, desc, xp in quests:
            QuestTemplate.objects.update_or_create(
                code=code,
                defaults={"title": title, "description": desc, "xp_reward": xp},
            )
        recipes_data = [
            (
                "Microwave oat bowl",
                12,
                [
                    {"name": "Rolled oats", "amount": "1", "unit": "cup", "cost_estimate": "0.40"},
                    {"name": "Milk or water", "amount": "1", "unit": "cup", "cost_estimate": "0.30"},
                    {"name": "Banana", "amount": "1", "unit": "pc", "cost_estimate": "0.25"},
                ],
                "Combine oats and liquid in a bowl. Microwave 2 minutes, stir, microwave 1 minute. Top with banana slices.",
            ),
            (
                "5-minute egg tortilla",
                8,
                [
                    {"name": "Eggs", "amount": "2", "unit": "pc", "cost_estimate": "0.50"},
                    {"name": "Tortilla", "amount": "1", "unit": "pc", "cost_estimate": "0.20"},
                    {"name": "Shredded cheese", "amount": "2", "unit": "tbsp", "cost_estimate": "0.30"},
                ],
                "Scramble eggs in a mug in the microwave. Warm tortilla, fill, add cheese, fold.",
            ),
            (
                "Chickpea tuna-style wrap",
                18,
                [
                    {"name": "Canned chickpeas", "amount": "1", "unit": "can", "cost_estimate": "1.20"},
                    {"name": "Mayo or yogurt", "amount": "2", "unit": "tbsp", "cost_estimate": "0.20"},
                    {"name": "Tortilla", "amount": "2", "unit": "pc", "cost_estimate": "0.40"},
                ],
                "Mash chickpeas with fork, mix with mayo, season. Wrap in tortillas.",
            ),
            (
                "Microwave veggie rice",
                15,
                [
                    {"name": "Instant rice cup", "amount": "1", "unit": "cup", "cost_estimate": "1.00"},
                    {"name": "Frozen mixed vegetables", "amount": "1", "unit": "cup", "cost_estimate": "0.60"},
                    {"name": "Soy sauce", "amount": "1", "unit": "tbsp", "cost_estimate": "0.10"},
                ],
                "Cook rice per package. Steam vegetables in microwave with splash of water. Mix with soy sauce.",
            ),
        ]
        for title, minutes, ings, instr in recipes_data:
            Recipe.objects.update_or_create(
                title=title,
                defaults={"prep_minutes": minutes, "ingredients": ings, "instructions": instr},
            )
        self.stdout.write(self.style.SUCCESS("Seed complete."))
