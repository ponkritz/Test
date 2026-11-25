---
bump: minor
---
**Added**
- **On-Demand page files named after the page** — a page added from this version on (Table, Table + Insights, On-Demand Dashboard, a Tool Validations tab) is kept in the data repository as `on-demand/<name>--<id>.json` (a page of row files: the folder `on-demand/<name>--<id>/`), the name made file-safe and the id staying the page's identity; renaming such a page moves its file or folder in the same commit, and a save made meanwhile by someone else lands in the renamed file (row locks, queued saves and the newer-data check follow the page by its id). Both forms are read; with two copies of a page the newer is shown and flagged. Delete page removes every file of the page (OND-120…OND-125, OND-127, OND-129…OND-131).
- **CoNQ and every existing page keep their file** (`on-demand/<id>.json`) for good: a rename changes only the title inside (OND-133).
- **Dashboard blocks named after the page** — a Dashboard page added from this version on keeps its blocks in `dashboards/<name>--<id>.json`, moved with the page file in the same commit when renamed; existing dashboards keep `dashboards/<id>.json` (OND-134).
- **Delete older copy…** — when a page or its blocks have two copies in Git, the notice (Admin → Pages & menu and the page) offers the Tool Owner to delete the older one after a pop-up listing what is deleted and what stays, in one commit (OND-135).
- **Update marker** — the first page added under its name writes `on-demand/app-update-required.json`, which older app versions show as an error line and which names the oldest version that lists named pages; this version checks it (OND-121, OND-128).

**Known limitation:** app versions before this one do not list the pages added under a name; existing pages are untouched. Update every app (LIM-115).

DF-340…DF-346, R-31, R-32, SM-195…SM-197, LIM-115, LIM-116; TC-OND-120…TC-OND-126, TC-OND-128, TC-OND-129, TC-OND-131…TC-OND-137.
