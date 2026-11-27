---
bump: minor
---
**Added**
- **UI design skills** — one agent skill per kind of component of UI-STANDARDS (page layout, panels, forms, pop-ups, drawers, tables, buttons, tabs and filters, messages, KPI tiles and charts, Release pages, colours and type, UI defaults) and an index skill, in `.claude/skills/`, each with the shared building blocks, a copy-ready pattern, what not to do and a checklist, so the app looks the same whichever agent or model builds it; CLAUDE.md, AGENTS.md and the UI agents point to them, and `pnpm test` fails when a skill names a building block that does not exist (CI-13).

TC-CI-09.
