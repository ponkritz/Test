---
bump: minor
---
**Added**
- **Features moved to a later PI stay in their PI's meeting** — the PI Review Meeting counts a Feature in a PI when its Iteration Path was in that PI: the history of the Features now in a later PI is read from Azure DevOps (the existing updates read, GETs only, a few at a time, once per page load, "Reading history · n of N") and a Feature that was in the PI is shown there as usual (PIR-91, PIR-93, PIR-95).
- **"Moved to PI X"** — the label on a moved Feature's slide and next to its title in the tables listing Features (PIR-92).
- **Carried forward by the move** — a moved Feature counts as carried forward even without Move to next PI = Yes, once when both; the Executive summary, Review completion, PI-over-PI trend, Repeat carry-overs and team dividers include it (PIR-94).
- **Nothing invented** — without a PAT, with the sample data or when a history cannot be read, those Features are left out and the job result says how many and why (PIR-93, LIM-263); a Feature moved twice counts in each PI it was in (LIM-264).

DF-594…DF-599, SM-371; TC-PIR-93…TC-PIR-98.
