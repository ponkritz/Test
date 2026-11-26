---
bump: patch
---
**Fixed**
- **"This view could not be drawn. Failed to fetch dynamically imported module …" after a new release** — a page opened in an app that was open across a release no longer blames a loaded work item: it says a newer version was published, and **Load the new version** opens the new build from a fresh address instead of reloading the browser's cached copy, which asked for the old code again (UPD-07).

DF-404; TC-UPD-03.
