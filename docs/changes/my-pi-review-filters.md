---
bump: minor
---
**Added**
- **My PI Review: Person and PI filters** — one filter row with **PI** (the current PI first, the list of PI Review) and **Person** (Me by default), and **Reset filters**. A lead with "PI Review: post the review of a Feature" can choose another person and sees only that person's Features (their Assigned To, matched by work email where known) with their review status; for everyone else Person is disabled with the reason. Write review… keeps its posting rights (PIR-24, PIR-17, CON-113).

**Changed**
- **The next PI from Azure DevOps by its dates** — Moves to in the review form (PI Review, My PI Review, the Close pop-up) is the PI that starts first after the reviewed PI ends, by the iteration tree's dates (a PI without dates takes its Sprints' span; overlapping PIs: the earliest start after the reviewed PI's start); without usable dates the PI number as before. The form says which source it used, and the PI can still be changed (PIR-25, PIR-13, PIR-18).

DF-315, DF-316, SM-182, LIM-97; TC-PIR-25, TC-PIR-26 (UAT), TC-PIR-17.
