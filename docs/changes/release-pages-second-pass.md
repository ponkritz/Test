---
bump: minor
---
**Added**
- **Counts on every Release page** — Content shows Releases in {Month}; Tool Validations, S&S IT and ECP show Releases in {Month} and Supported (the same releases, as Pulse Check counts them). Completed is left out where the stream's data has no completion event (Content: Supported too); ⓘ What was counted says why (QV-64).
- **Time Writing Feature and hours on DP, CP, S&S IT and ECP** — the Feature of the release's QMS-0025 match with its match %, and the Planned (h) / Booked (h) of its Time Writing Tasks, as IOCC, Content and Tool Validations already show them (QV-65).

**Changed**
- **Release page results in Background jobs** — Refresh / Fetch, Load from Git, imports of Windchill exports and results, Fetch via Windchill tab, Save locations to Git and Load all exports from Git are listed in the top-bar Background jobs, named after the item ("Import Windchill export · S&S IT"), instead of notices on the page; the page keeps the warnings about its data, e.g. "Not refreshed: … The data shown is from …" (QV-63, NAV-36, CON-36).
- **Release pages tidied** (UI-STANDARDS §10) — KPI tile numbers 24px on every page with tiles; IOCC group rows indented by a CSS class; the Windchill Releases controls wrap at 390 px; CP Shared activity's Signed documents right-aligned, its evidence opening with ▸ (QV-62, QV-45). UI-STANDARDS §10 records the owner's accepted points: DP's counting rules behind ⓘ, the stream's own name for the date column, at most three tiles.

**Fixed**
- **Background jobs panel in dark mode** — it was white with almost unreadable text; it now uses the theme's colours (KB-76).

DF-142, DF-143, DF-144; TC-QV-43, TC-QV-44, TC-QV-45, TC-QV-46.
