from django.utils import timezone
from core.models import QuestTemplate, UserQuestDay


def ensure_daily_quests(user, date=None):
    d = date or timezone.now().date()
    templates = list(QuestTemplate.objects.order_by("id"))
    if not templates:
        return []
    n = len(templates)
    seed = (user.id + d.toordinal()) % n
    chosen = []
    for i in range(min(3, n)):
        chosen.append(templates[(seed + i) % n])
    for t in chosen:
        UserQuestDay.objects.get_or_create(user=user, template=t, date=d, defaults={"completed": False})
    return UserQuestDay.objects.filter(user=user, date=d).select_related("template")
