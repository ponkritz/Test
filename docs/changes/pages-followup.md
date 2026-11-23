---
bump: minor
---
**Changed**
- **Co-owners from the Azure DevOps team** — the page and group co-owner lists also offer the members of the Time Writing team, read once when the app starts (after the start fetch) and kept for the session, so a colleague without fetched work can be picked without opening People & roles first; a refused read offers the others silently (PGB-21, PGB-18, CAP-30).
- **"Newer data in Git" names the colleague** — every commit the app writes ends with `[by {name} <{work email}>]` (after the `[saved …]` stamp; never a token), and the notice names that person instead of the GitHub account; a change made outside the app still shows its GitHub author (GIT-22, GIT-18, GIT-17).
- **Access roles load quietly** — a newer access.json is loaded on every page without a notice and the rights change in place; when your own rights changed, a short line on the page says who changed what ("Your access was changed by …: you can now edit On-Demand data (rows)."). Only Admin → People & roles shows the notice (GIT-23, CON-101).
- **Convert suggestion for large pages** — a Tool Owner sees a line on a table page still in one file with more than 500 rows (or over 600 KB) suggesting **Convert to row files…**, dismissible per page; new pages stay one file (OND-62, OND-32).

DF-203…DF-206, SM-113, LIM-37; TC-GIT-14, TC-GIT-15, TC-PGB-16, TC-OND-50.
