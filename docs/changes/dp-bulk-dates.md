---
bump: minor
---
**Added**
- **Start and Target dates for DP bulk Features** — DP Create Features sets each Feature's Start date from the DRPE Date (RPE) and its Target date from the DDT Date (DT), or from the DP date columns mapped in Admin → Stream options → Bulk creation Epics → DP bulk creation dates (shared, saved straight to Git); the pop-up shows the dates per release, creates a release without a date without it (named on the row) and skips one whose Start date is after its Target date (DPF-13, DPF-14, DPF-15).
- **Optional month Tasks from the Start date in DP bulk creation** — a tick box, not ticked by default, "Create Time Writing month Tasks from the Start date to the Target date": unticked one Task for the current month, as before; ticked one Task per month from the Start date's month to the Target date's month (a Start date in an earlier month, or none, starts at the current month and the row says so), with the months per release and the total shown before Create (DPF-16).

**Changed**
- **Full-size bulk pop-ups** — the DP and IOCC Create Features pop-ups fill the window with a small margin, the page dimmed behind; only the list scrolls, the title and buttons stay in view; the whole screen on a phone (UI-30, UI-STANDARDS §4).

DF-370, DF-371, DF-372, DF-373, SM-220, LIM-140, LIM-141; TC-DPF-12…TC-DPF-16, TC-UI-26.
