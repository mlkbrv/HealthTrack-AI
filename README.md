# HealthTrack AI (Student MVP)

English-only student wellness MVP: Django REST API + Expo (React Native). Manual logs for sleep, stress, water, and mood; class blocks for quiet hydration windows; rule-based burnout hints; optional LLM for recommendations, chat, and mood summaries; dorm recipes, weekly meal plan, grocery estimate vs budget; daily quests and XP.

## Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py seed_demo_accounts
python manage.py runserver 0.0.0.0:8000
```

### Demo logins (after `seed_demo_accounts`)

| Username | Password | What to check |
|----------|----------|----------------|
| `demo` | `demo12345` | Higher sleep averages, low burnout, class blocks, some quests completed |
| `stressy` | `stressy12345` | Low sleep, stress 5, multiple soon deadlines → higher burnout on Insights |
| `broke` | `broke12345` | Weekly budget $25 + full meal plan → grocery list over budget |

Re-run with `python manage.py seed_demo_accounts --purge` to reset those three accounts.

Optional environment variables (create `backend/.env` or set in shell):

| Variable | Purpose |
|----------|---------|
| `DJANGO_SECRET_KEY` | Production secret |
| `DJANGO_DEBUG` | `false` in production |
| `DJANGO_ALLOWED_HOSTS` | Optional; when `DEBUG=true` and unset, all hosts are allowed (needed for `http://192.168.x.x:8000` from a phone) |
| `CORS_ALLOWED_ORIGINS` | When `DEBUG` is false |
| `LLM_API_KEY` | OpenAI-compatible API key |
| `LLM_API_BASE` | Default `https://api.openai.com/v1` |
| `LLM_MODEL` | Default `gpt-4o-mini` |
| `POSTGRES_DB` | If set, switches from SQLite to PostgreSQL |

API base path: `http://<host>:8000/api/`

## Mobile (Expo Go)

The project uses **Expo SDK 54** so it matches the **Expo Go** app from the iOS App Store / Google Play (store builds often lag behind the newest SDK).

```bash
cd mobile
npx expo start
```

Set **`HARDCODED_API_BASE`** in `mobile/src/config.ts` to your PC’s LAN API URL (same Wi‑Fi as the phone), e.g. `http://192.168.0.166:8000/api`. For the **Android emulator**, use `http://10.0.2.2:8000/api`.

Use Expo Go to scan the QR code.

**Django:** use `runserver 0.0.0.0:8000`. With `DEBUG=true` and no `DJANGO_ALLOWED_HOSTS` in `.env`, all hosts are allowed.

Optional: **`GET /api/health/`** (no auth) returns `{"ok":true}` for quick checks in a browser.

In **Settings**, use **Schedule hydration reminders** after saving class blocks (where supported). The app requests notification permission and schedules up to two reminders per day for the next seven days, skipping times that fall inside your class blocks. OS scheduling limits may apply.

**Expo Go on Android (SDK 53+):** local notification APIs were removed from Expo Go; the app skips loading `expo-notifications` there so you should not see the related console warning, and the schedule button is disabled with an on-screen note. Use a **development build** or test reminders on **iOS Expo Go** / a release build.

### Expo Go vs development build

Apple Health, Google Health Connect, and some native sensors are **not** fully available in Expo Go. A **development build** (`expo prebuild` / EAS Build) is required for deeper health integrations later.

## Not medical advice

This app does not diagnose or treat conditions. For emergencies or crisis support, use local emergency services or campus resources.
