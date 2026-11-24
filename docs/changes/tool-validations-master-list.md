---
bump: minor
---
**Added**
- **Tool Validations master list** — the Tool Validations page gets the tabs **Validation expiry** and **Master list**. The master list is kept in the Git data repository (`tool-validations.json`, schema 1, validated strictly when read, saved queued and merged with the save time and user, GIT-17) and keeps every validated tool once it is listed: the tools of the Tool Validations query are appended whenever its data is fetched; another Azure DevOps query, an imported Windchill export or a Table page kept by hand are added as sources and brought in with **Merge into master list…** after a preview. The same tool from two sources is one entry (name — case, spaces and punctuation ignored — and version); a tool that leaves its source stays, marked "Not in source now" (TVL-01…TVL-05).
- **Expiry** — each tool has a validation date, a validity period in months and a due date (the source's own or one entered by hand wins, else validation date + period), read through a field mapping per source set on screen, the app's guesses marked until saved (TVL-06, TVL-07). Validation expiry lists the overdue tools, those due in the next N days with the days left and those with no due date, with Export; N is the team default (60 days) or each person's own, kept in their views (TVL-08, TVL-09).
- **Changes by hand and rights** — ＋ Add tool…, Edit (a date changed by hand is kept) and Remove, the sources and their mapping, the team default and the co-owners: only the Tool Owner and the list's co-owners, fail closed with the reason shown; results under Background jobs (TVL-10…TVL-12). Release counts, Pulse Check and the Monthly pack still count the Tool Validations query only (TVL-13, QV-64).

DF-263…DF-266, SM-148, LIM-64; TC-TVL-01…TC-TVL-08.
