---
bump: minor
---
**Changed**
- **The team's data repository is now `philips-internal/InD_DemandPlanningStorage`** — the Connect Git storage form, its placeholders and the Get started guide start with owner `philips-internal`, repository `InD_DemandPlanningStorage`, branch `main`, data file `planning-data.json`, so a new user adds only the token (GIT-13). The browser version's address is unchanged.

**Added**
- **A notice for connections to the old repository** — a connection still saved to `ponkritz/DemandPlanningStorage` shows a warning on every page with **Switch to philips-internal/InD_DemandPlanningStorage**, which keeps the branch, data file and token, asks first when there are unsaved changes, and loads from the new repository. Nothing changes without that click. The token must be allowed on the new repository (GIT-24).

DF-262, SM-147; TC-GIT-16, TC-GIT-06.
