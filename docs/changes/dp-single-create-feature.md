---
bump: minor
---
**Changed**
- **Create Feature on a DP release works like DP Create Features**: the New Feature form opened from one row of Release Details → DP now starts with the DP bulk creation Epic as Parent Epic, the bulk title and detected Release Classification (with its DoD and User Stories), the QE from the QE page as Assigned to, Start date = DRPE Date and Target date = DDT Date (or the columns set in DP bulk creation dates; a missing date is left empty with a note), and the same optional "Create Time Writing month Tasks from the Start date to the Target date" tick box (not ticked: the current month only). Everything can still be changed; a Start date after the Target date is named by the form. Both ways use one set of rules, so the same release gives the same Feature (DPF-17, DPF-18, BKL-23). Other streams' Create Feature is unchanged.

**Added**
- **Sprint from** on each User Story of an Epic's Feature setup — None (default), RPE, PRD, SFV, DT or another DP date column: when a DP release's Feature is made (bulk or Create Feature), the story goes in the current or future Sprint holding that date of the release; without one, or in a past Sprint, it keeps the default Sprint and the row or form says why ("PRD 12 Mar 2026 is in a past Sprint — default Sprint") (EPS-10).

**Fixed**
- In the single New Feature form the Target date box was too narrow at 1440 px and cut the date off; it now spans two columns.
- Create Feature on a DP release did not fill the Start and Target dates or the Parent Epic (KB-110).

DF-390, DF-391, SM-232, LIM-152; TC-DPF-17, TC-DPF-18, TC-EPS-08, TC-EPS-09.
