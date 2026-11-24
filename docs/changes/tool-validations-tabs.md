---
bump: minor
---
**Changed**
- **Tool Validations page: Master list first, Azure, then a tab per source** — the page's tabs are now **Master list** (opens first, with **Validation expiry** on top: the Overdue / Due in the next N days / No due date tiles, your own window of days with Use the team default, the expiry table; then the master list, Sources and Team settings), **Azure** (the Tool Validations query: its Releases table of the month and, below it, the query's rows as **Source data**; before a fetch the usual fetch message) and **one tab per other source** added under Sources, named after it in the order added: its rows as read with its field mapping (Merged / Not merged yet), with **Edit mapping…** and **Merge into master list…**, or how to load its data when it is not in this browser. Removing a source removes its tab. The separate Releases, Validation expiry and Source data tabs are gone; a tab remembered from before opens where its content is now (Releases, Source data → Azure; Validation expiry → Master list), and a tab that no longer exists opens the Master list. The tiles above the tabs, Pulse Check and the Monthly pack count as before; every right and behaviour of the master list is kept (TVL-14; TVL-05, TVL-08, TVL-10, QV-47, QV-62 changed).
- UI-STANDARDS §10 (3) exception: the Tool Validations Release page has Master list | Azure | a tab per source instead of Releases | Source data (n), with its Releases table and the query's rows together on the Azure tab.

DF-275; TC-TVL-09, TC-TVL-07 (UAT), TC-TVL-03, TC-QV-43, TC-QV-27.
