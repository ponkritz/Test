---
bump: minor
---
**Added**
- **Delete from a page under Other views** — a view of your own (My views) has **Delete this view…** in its page's ⋯, with a pop-up that names the view and what is and is not deleted; it is the same deletion as My settings → My views, whose row action is now **Delete…** with that pop-up (SET-19). A shared view's page has no delete item for anyone; the Tool Owner's Remove / Delete for everyone stay in Admin (CON-116). A Windchill export under Other views has **Delete this export…** for whoever may import Windchill exports: its files in Git are deleted in one commit, then the export here; blocked in View as, with the sample data, without Git or with a read-only token (CON-118). Afterwards Home opens with a confirmation, also in Background jobs.

DF-380, DF-381, SM-230, SM-231, LIM-150, LIM-151; TC-SET-09 (UAT), TC-CON-72, TC-CON-74.
