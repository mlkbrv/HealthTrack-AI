# HealthTrack AI

### Student wellness companion · MVP

---

> Turn scattered habits into a single, calm dashboard: log how you feel, see trends at a glance, and get practical nudges—**without** replacing a clinician or crisis line.

**HealthTrack AI** is an English-language portfolio / hackathon-style app for students who juggle sleep, stress, coursework, and a tight food budget. A **Django REST** API powers auth and data; an **Expo (React Native, SDK 54)** client puts everything behind a tabbed UI with a **Today** screen that surfaces big numbers and simple charts so progress is obvious, not buried in forms.

| | |
| :-- | :-- |
| **Stack** | Django + DRF · JWT · SQLite or Postgres · Expo / TypeScript |
| **Intelligence** | Rule-based burnout + schedule hints; optional OpenAI-compatible LLM for recommendations, chat, and mood summaries |
| **Scope** | Sleep, stress, water, mood · class blocks · deadlines · recipes & weekly meal plan · grocery estimate vs budget · quests & XP |

### What ships in the box

- **Today** — KPI tiles, bar charts from your latest logs, shortcuts, daily quests  
- **Body** — wellness logging and mood journal  
- **Plan** — schedule, deadlines, meals, grocery list  
- **Coach** — insights and conversational assistant  
- **More** — profile, budget, hydration reminders (where the platform allows), focus audio  

---

## Repository layout

| Path | Role |
|------|------|
| `backend/` | Django + DRF, JWT auth, SQLite or Postgres |
| `mobile/` | Expo app (tabs: Today, Body, Plan, Coach, More) |

Do **not** run `git init` inside `mobile/` if this folder belongs to this repo—Git would track it as a submodule-style gitlink instead of normal files.

## Backend

```bash
cd backend
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py seed_demo_accounts
python manage.py runserver 0.0.0.0:8000
```

API base: `http://<host>:8000/api/` · **`GET /api/health/`** (no auth) for a quick check.

### Demo logins (after `seed_demo_accounts`)

| Username | Password | Notes |
|----------|----------|--------|
| `demo` | `demo12345` | Higher sleep, low burnout, quests |
| `stressy` | `stressy12345` | Low sleep, stress 5, deadlines → burnout on Insights |
| `broke` | `broke12345` | Tight budget + meal plan → grocery over budget |

Reset: `python manage.py seed_demo_accounts --purge`

### Backend environment

Copy `backend/.env.example` to `backend/.env` and adjust.

| Variable | Purpose |
|----------|---------|
| `DJANGO_SECRET_KEY` | Production secret |
| `DJANGO_DEBUG` | `false` in production |
| `DJANGO_ALLOWED_HOSTS` | Optional; with `DEBUG=true` and unset, permissive dev (LAN IP from a phone) |
| `CORS_ALLOWED_ORIGINS` | Required when `DEBUG` is false |
| `LLM_API_KEY` | OpenAI-compatible key (optional) |
| `LLM_API_BASE` | Default `https://api.openai.com/v1` |
| `LLM_MODEL` | Default `gpt-4o-mini` |
| `POSTGRES_*` | If set (see `settings.py`), use Postgres instead of SQLite |

## Mobile (Expo)

Uses **SDK 54** to match **Expo Go** from the store.

```bash
cd mobile
npm install
npx expo start
```

### API URL

Set **`HARDCODED_API_BASE`** in `mobile/src/config.ts` to your machine’s API (same Wi‑Fi as the device), e.g. `http://192.168.0.166:8000/api`. **Android emulator:** `http://10.0.2.2:8000/api`.

`mobile/.env.example` only documents this; the app reads the constant in `config.ts`.

### App structure

- **Today** — greeting, XP, KPI tiles (sleep / water / stress / quests), bar charts (last logs), shortcuts, daily quests.
- **Body** — wellness logs, mood journal.
- **Plan** — hub to schedule, deadlines, meals, grocery.
- **Coach** — insights, AI assistant chat.
- **More** — settings (profile, hydration reminders where supported), focus audio.

Run Django with `0.0.0.0:8000` so LAN devices can reach it.

### Notifications

**Schedule hydration reminders** (Settings) uses class blocks from **Plan → Class schedule**. **Expo Go on Android:** local notifications are not available in Go; the UI disables scheduling and explains. Use a **dev build** or test on **iOS Expo Go** / a release build.

### Beyond Expo Go

Apple Health, Health Connect, and many native APIs need a **development build** (`expo prebuild` / EAS), not Expo Go alone.

## Not medical advice

This app does not diagnose or treat conditions. For emergencies, use local emergency services or campus crisis resources.
