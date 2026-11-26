---
bump: minor
---
**Added**
- **Write one review for several Features** — in My PI Review, tick Features (or every row shown with the heading's tick box) and press **Write review for N…** in the bar "N selected · Write review for N… · Clear selection". A Feature you cannot review — your rights, View as, the sample, an on-premises server, or its Discussion not read yet — has its tick box greyed out with the reason. One full-size pop-up names the Features, says how many already have your review of the chosen PI (replaced, as Edit review… does; the others get a new comment) and has the same form, Moves to and Preview, filled in once. Post runs as **one** Background jobs entry "PI review for N Features", one Feature after another; each Discussion is read again just before it is written, so a review that changed meanwhile is never overwritten or posted twice; a failure on one Feature does not stop the others, and the job ends with what was posted, replaced and failed, with the reasons (PIR-36, PIR-37).
- **Tables: a row that cannot be ticked says why** — the shared table selection can disable a row's tick box with its reason; "Select every row shown" skips such rows (UI-31).

DF-400…DF-403, SM-242; TC-PIR-38, TC-PIR-39, TC-UI-27.
