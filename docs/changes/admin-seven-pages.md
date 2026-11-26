---
bump: major
---
**Changed**
- **Admin in seven pages** — Admin goes from eleven pages to seven, in this order: **Overview** (now the page Admin opens on, and the one shown instead of a page you may not see), **Streams** (Stream mapping with each stream's *Epics to match*, Release counts, Bulk creation), **Feature & PI setup** (Setup per Epic, Lists — value lists and team lists in one tab —, User Story templates, PI Review form with the start date), **People & access** (People, Team tree, Role rights with *Access for emails not in Azure DevOps*), **Capacity & time** (Capacity with the Capacity roles, Calculation profiles, Hour classification, Thresholds, Month locks), **Pages & reports** (Menu groups & pages, Monthly pack, Table & chart defaults) and **Data & history** (Git storage, Other views, Connections in Git, Historical hours, Changes, Demo data). Stream options, Epic & Feature setup, PI Review Setup, People & roles, Reports, Data & sharing, Pages & menu and History are gone as pages; what they held is in the new places (SET-26, SET-29).
- **A page for the rights of its sections** — a page is shown when your role holds a right for at least one of its sections, and the other sections are hidden: a Scrum Master set up with only "PI Review: set up the review form" sees Feature & PI setup with the PI Review form only; Latest changes, Changes and Reset synthetic MVP data need *Shared setup in Git* (SET-27).
- **Old places still work** — links, Get started steps, Search settings (old names find the new place; one entry per setting, AR-080) and remembered pages and sections open where the settings live now (SET-28).
- **Moved out** — your own bulk creation Epics are in **My settings → My bulk creation Epics**; **Table & chart defaults** left Look & feel for Admin → Pages & reports (SET-30); the Read-only sources section is gone — each view's work items *By type* are in its Other views row (SET-29). No Git file or stored setting changes.
- **Lists** and **User Story templates** stay visible to everyone, read only without the right, each blocked action with its reason — a Team Member still sees what they hold (SET-31).

DF-450, DF-451, DF-452, SM-260, KB-135, LIM-160, LIM-161, LIM-162; TC-SET-13, TC-SET-14, TC-SET-15, TC-SET-16; SET-31.

