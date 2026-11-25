---
bump: minor
---
**Changed**
- **Closed groups are left out of Export, select all and Previous / Next** — on a grouped table (the On-Demand Table pages), Export, "Select every row shown" and the row drawer's Previous / Next (also when opened with a row's Edit button) act only on the rows you see: rows inside a closed group are left out until you open it, and Export says so — "Exports the 4 rows shown (3 rows in closed groups left out)"; the row count still counts every matching row (UI-29, UI-25, OND-132; product owner, 2026-11-25).

DF-324; TC-UI-25, TC-OND-103.
