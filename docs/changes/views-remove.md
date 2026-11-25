---
bump: minor
---
**Added**
- **Remove or delete a shared view for everyone** (Tool Owner): Admin → Data & sharing → Other views, ⋯ of a shared view → **Remove for everyone…** or **Delete for everyone…**. A confirmation says whom it affects (everyone who uses the shared setup in Git) and, for Delete, which data files in Git are deleted; a backup of the view's definition (never a PAT) is saved to Git first and a removal marker is written to `azure-views-removed.json` (CON-109, CON-110).
- **Git wins for removed shared views**: at their next start every browser and desktop app removes a view the Tool Owner removed — also when it was changed there — once, with its saved data, and shows "The Tool Owner removed N shared views: …"; My views and PATs are never touched, and no computer adds it back from the shared setup or its on-prem data, or merges it back into Git (CON-111, CON-110, CON-98, SET-17). The first sync from another repository still changes nothing (GIT-26).
- **Removed connections** lists the views removed for everyone first, with who removed them; **Restore** takes the marker away so the view comes back for everyone (CON-112, CON-99).

**Fixed**
- A shared view removed in Other views came back at the next start, from the shared setup in Git, from another computer's save or from its on-prem data in Git (KB-95).

DF-304, DF-305, R-21, SM-178, LIM-90; TC-CON-68 (UAT), TC-CON-69.
