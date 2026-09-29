# GEC Palanpur Class Finder

Personalized timetable lookup for Government Engineering College, Palanpur students.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/gec-class-finder/src/App.tsx` — frontend routes, structured reference data, enrollment detection, and timetable rendering.
- `artifacts/gec-class-finder/src/index.css` — product theme, responsive layout, and interaction states.
- `artifacts/gec-class-finder/.replit-artifact/artifact.toml` — root web artifact routing and workflow configuration.

## Architecture decisions

- The class finder is a single unified flow: semester is selected first, then enrollment lookup detects branch and CP batch.
- Reference-derived data is kept in separate typed collections for branches, semesters, subjects, faculty, rooms, enrollment mappings, and timetables.
- Unsupported semesters remain explicit no-data states; the UI does not infer or invent schedules, rooms, faculty, or enrollment mappings.
- CP-specific timetable labels are resolved from the supplied combined reference cells using the detected batch.

## Product

The app gives students a polished home entry point, a semester-first unified finder, lookup by supplied enrollment mappings, a personalized Computer Engineering “My Class” view with current/next/today lecture prioritization, an explicit full timetable view for supported reference data, and honest no-data states for semesters without supplied schedules.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
