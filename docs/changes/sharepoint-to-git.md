---
bump: minor
---
**Changed**
- **SharePoint storage moved to the backlog** — SharePoint is not functional, so the SharePoint central storage (connection, initialize, pull, autosave) and the Microsoft sign-in are removed from the app (SNP-01…03, IF-04 retired; PROJECT-PLAN.md → Backlog). Shared data already lives in the private Git data repository (Git storage). The KPI tracker still reads its workbook from SharePoint in the desktop app.
- **Snapshots are saved to Git** — LTE and PI Review snapshots are saved as JSON files in `lte-snapshots/` of the Git data repository (`ponkritz/DemandPlanningStorage`), one commit each, as new files only, read back before success, at most 50 MB; the history lists them from Git with links to GitHub (SNP-04, SNP-06…08). Saving needs a Git token that can write and is off with the synthetic sample.
- **Security** — the Content-Security-Policy no longer allows framing the Microsoft sign-in (`frame-src 'none'`); the `@azure/msal-browser` package is removed.

LIM-16; SM-19; DF-22; PT-13 closed; CR-P1-05, CR-P1-06 no longer apply; TC-SNP-01…03.
