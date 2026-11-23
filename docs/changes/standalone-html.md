---
bump: minor
---
**Added**
- **Publish standalone HTML…** — the Tool Owner and a page's co-owners can publish any table page (CoNQ included) as one self-contained, offline `.html` file: "Published by {name} on {date, time, zone}", the filters of the charts, the Insights charts and KPI cards, and every row that is not hidden with sort and search (OND-73, OND-74, OND-80). A pop-up first warns that the file contains every row of the page. Never from Sample (OND-75).
- The file goes **where you choose** (default "{page}.html") and each publish overwrites it: the desktop app asks once with its save dialog and remembers the file per page on that computer; Chrome and Edge remember it in the browser (File System Access, the permission asked again at most once per session); Firefox and Safari download it instead (OND-76). Every value is escaped and a Content-Security-Policy in the file blocks every request; it holds no token (OND-77).
- **Scheduled publish** — Off / Daily / Weekly at a time, per page, saved on your computer only (never in Git); it runs while the app is open, a missed run runs at the next start, results go to Background jobs and a failure (permission lost, folder missing) also shows on the page (OND-78, OND-79).

DF-220…DF-223, SM-120…SM-123, LIM-44; TC-OND-60…TC-OND-65.
