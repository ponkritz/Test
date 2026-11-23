---
bump: minor
---
**Added**
- **On-Demand Dashboard pages** — a third page type of the page builder: ＋ Add page… → **On-Demand Dashboard** in any group that accepts added pages. A read-only page of **KPI tiles**, **bar, line and pie charts** and **summary tables** over the rows of any table page (On-Demand, Table, Table + Insights, as saved in Git), with Count, Sum or Average (one currency at a time) (DSH-01…DSH-05).
- **Filter row** — Year / Quarter / Month as on Team overview (the current year when nothing is ticked), filters the owners add and Reset filters; tiles open their tab; charts with data labels and Table view, summary tables largest first with the first 10 rows, Show all and Export; "No data for this selection." when empty. Your tab, period and filters are remembered for you (DSH-06, DSH-07, DSH-10, DSH-11).
- **Building an On-Demand Dashboard** — whoever may set the page up (Tool Owner, page and group co-owners, “Set up On-Demand pages”) adds, edits, reorders and removes blocks, tabs and filters, each saved to Git at once as `dashboards/<page>.json`, merged block by block with a change saved at the same time, the result in Background jobs; for everyone else the buttons are disabled with the reason (DSH-08, DSH-09, DSH-12).

DF-160, DF-161, DF-162, SM-101, LIM-22; TC-DSH-01…11.

**Backlog**
- Six follow-ups for custom streams are recorded as OI-17 (parked by the product owner).
