---
bump: minor
---
**Added**
- **Tool Validations — add an existing page as a tab** — Setup → Tabs → **＋ Add existing page as tab…** lists the On-Demand pages (Table, Table + Insights, On-Demand Dashboard) that are hidden from the menu and not a tab yet — a page kept hidden when its tab was removed, or left behind when an older app version dropped the tabs (LIM-70) — and makes the chosen one a tab again, with its data; once a tab it leaves the list. Same rights as ＋ Add tab… (TVL-24).
- **Tool Validations — the list's co-owners are the tab pages' co-owners** — when a tab is added and whenever the list's co-owners are saved (Team settings, Set {N} days as team default), they are written as co-owners of each tab's page in menu-layout.json, so they hold the page's rights also when it is opened from Admin → Pages & menu. Co-owners added to a page by hand stay; only the ones the list wrote (remembered as `ownersFromList`) are taken off when they leave the list or the tab is removed. A change of the co-owners is refused while the pages cannot be written; a page out of line is named on Setup → Tabs with **Write the co-owners to the tab pages** (TVL-25, PGB-03).
- **Show expiry status** on a dashboard block of the Tool Validations master list or expiry list (On-Demand Dashboards and My dashboard): switched off, the block neither offers nor shows Status and Days left — in the block, its table and its drill-down; ⓘ says the status uses the team default window of N days. Read from the product owner's "give option to hide it if need be" as a switch per block, on by default — to be confirmed (TVL-26, TVL-18).

TVL-16, TVL-17, TVL-18, TVL-24, TVL-25, TVL-26, PGB-03; DF-288, DF-289, DF-290; SM-164, SM-168; LIM-70, LIM-71, LIM-75; TC-TVL-11 (UAT), TC-TVL-21, TC-TVL-22, TC-TVL-23.
