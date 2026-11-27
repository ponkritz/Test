---
bump: patch
---
**Changed**
- **Own repository** — the desktop download links, the desktop updater's `desktop-latest` release and the documents now point at this repository's own releases instead of the original one (DSK-07).
- **First import** — the pull-request check of change notes (CI-09) no longer fails when the base branch has no `package.json` yet (the first import of the app into a repository); a changed version is still refused otherwise.
