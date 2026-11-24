---
bump: minor
---
**Added**
- **User guide** — `docs/USER-GUIDE.md`, for end users: getting started (browser and desktop, one PAT per server, Git storage, work email, the synthetic sample), the menu and Home, roles and rights (the reason line, View as), daily work, reports, Release Details, On-Demand pages, Insights, On-Demand Dashboards, PDF and interactive HTML, Admin and troubleshooting, each as short tasks with steps. It covers editing My dashboard (MYD-14…MYD-24), Save view for everyone for tables and page filters (UI-20…UI-23) and the chart editor's tabs Data, Filters, Format, Elements and Narrative (CHT-70…CHT-73) (DOC-12).
- **Screenshots and short clips in the guide** — 60 screenshots and 7 silent how-to clips (WebM with a poster), shown on the Documentation page from the build's own files; every clip has a caption and its steps written out next to it (DOC-13).
- **Made from synthetic data by a script** — `pnpm docs:shots` and `pnpm docs:videos` (`scripts/user-guide-shots.mjs`) remake them from the built app with the synthetic sample and made-up pages and people, and stop if a real host, organisation, repository, token or an email outside example.com would be captured (DOC-14).

**Changed**
- **Documentation** shows the **User guide** as its first tab; the profile menu has **User guide**, which opens it (DOC-01, NAV-48).
- The Content-Security-Policy names `media-src 'self'`: video only from the app's own files (NFR-09).

DF-261, SM-146, LIM-51; TC-DOC-04, TC-DOC-01, TC-NAV-48, TC-CSP-01.
