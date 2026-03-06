# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Django + DRF API. Domain apps include `assets`, `novedades`, `hechos`, `personnel`, and `records`; shared code lives in `core`, and project settings/routes in `config/`.
- `backend/tests/`: local verification scripts and API checks.
- `frontend/`: Angular 21 SPA. Main code is under `frontend/src/app/{pages,components,services,interceptors}`.
- `docs/`: historical/reference documentation.
- Root deployment files: `Dockerfile` and `railway.toml`.

## Build, Test, and Development Commands
Use separate terminals for backend and frontend.

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
set DATABASE_URL=postgres://user:pass@localhost:5432/gestorcoc
python manage.py migrate
python manage.py runserver
```

```bash
# Frontend
cd frontend
npm install
npm start        # ng serve --port 4200
npm run build    # production bundle
npm test         # ng test (Vitest runner)
```

Optional demo data:
`python manage.py seed_data --mode fill_missing --volume medium`

## Coding Style & Naming Conventions
- Frontend uses `frontend/.editorconfig`: UTF-8, 2-space indentation, trailing whitespace trimmed, single quotes in TypeScript.
- Follow Angular naming conventions: kebab-case filenames (`records.ts`, `records.html`), PascalCase classes (`RecordsComponent`), and `*.service.ts` for services.
- Backend follows Django/Python conventions: 4-space indentation, snake_case for functions/variables, PascalCase for models/serializers/views.
- Keep code organized by domain app (`records`, `assets`, etc.) rather than creating cross-app catch-all modules.

## Testing Guidelines
- Backend: run targeted suites with `python manage.py test records` or specific classes like `records.tests.VideoAnalysisReportApiTests`.
- For new backend behavior, prefer assert-based Django tests over ad-hoc scripts.
- Frontend: keep tests as `*.spec.ts` near source files (baseline test currently in `src/app/app.spec.ts`).
- No enforced coverage threshold is defined; add tests for each endpoint/service/UI flow you modify.

## Commit & Pull Request Guidelines
- Follow Conventional Commits used in history: `feat:`, `fix:`, `refactor:`, `chore:`.
- Keep commits focused and use imperative, scoped subjects.
- PRs should include purpose, affected paths (for example `backend/records` or `frontend/src/app/pages/records`), manual test steps, and screenshots/GIFs for UI changes.
- Link related issues/tickets and call out migrations or environment variable changes.

## Security & Configuration Tips
- Never commit `backend/.env` or provider API keys.
- `DATABASE_URL` is required by `backend/config/settings.py`; set it before running Django management commands.
