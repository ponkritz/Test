---
bump: minor
---
**Added**
- **Tool Validations: tabs of your own** — under **Setup → Tabs** the Tool Owner and the list's co-owners **＋ Add tab…**: a **Table**, **Table + Insights** or **On-Demand Dashboard** page, kept in Git like every On-Demand page but shown only as a tab of Tool Validations, between the source tabs and Setup (not in the menu, on Home or in search). On the tab the page works as anywhere else (columns, rows, Insights, dashboard blocks); everyone else reads it. **← →** move a tab, **Rename…** renames it and its page, **Remove…** asks first: the page is kept in Git, hidden — or, by a Tool Owner, deleted with its data. The tabs are kept in `tool-validations.json` as `tabs`, validated when read and merged by page id (TVL-14, TVL-15, TVL-16, TVL-17, TVL-02).
- **The master list and the expiry list as dashboard sources** — the On-Demand Dashboards (the dashboard tabs and every other dashboard) and My dashboard can chart the Tool Validations **master list** and **expiry list**: Tool, Version, Validation date, Validity (months), Due date, Due date from, Status (Overdue / Due soon / No due date / OK, with the team default window), Days left, Sources and In source now — for roles that see Release Details (TVL-18, DSH-03, DSH-04, MYD-15).

Older app versions drop the tabs and such dashboard blocks when they save (LIM-70); the dashboards' Status uses the team default window (LIM-71). DF-283, DF-284; SM-164; TC-TVL-10…TC-TVL-13.
