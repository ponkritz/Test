---
bump: patch
---
**Fixed**
- **Change connection… shows the repository in use** — after Switch moved the connection to `philips-internal/InD_DemandPlanningStorage`, the Git storage pop-up still opened with `ponkritz` / `DemandPlanningStorage`, so Update & load would have connected back to the old repository. The form is now filled from the current connection each time it opens (GIT-13, KB-90).

TC-GIT-17.
