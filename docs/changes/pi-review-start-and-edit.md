---
bump: minor
---
**New**
- **PI Review starts from 21 September 2026** (product owner, 25 Nov 2026: "Let's do the read discussions from 26.4, older PIs don't show [as an] option. Date filter is set to 21-September-2026") — PI Review and My PI Review offer only the PIs that had not ended by the date (by their Azure DevOps dates, else their number; PI 26.4 is the first), a remembered older PI falls back to the current one, comments before the date are ignored when the Discussions are read (the columns, the latest review, Reviewed and the prefill use only the later ones), and the next PI is never suggested before it. The date is shared in `pi-review-form.json` and changed on Admin → PI Review Setup with **Edit start date…** (PIR-33; PIR-02, PIR-05, PIR-07, PIR-19, PIR-25, PIR-26, PIR-29).
- **Edit review… in My PI Review and on PI Review** (product owner, 25 Nov 2026: "if it is already written, give me a provision to edit it. In My PI Review"; then "Edit Review on both PI Review page + My PI Review page") — on PI Review in a Feature's row and its drawer, by the same rule; — your own newest review that counts for the chosen PI can be changed in place: the same form, prefilled; saving replaces that same comment in Azure DevOps (its date kept), as a Background jobs entry "Edit review · #id", audited and read back; a refused edit offers **Post as a new review instead**. Only the author's own review; the web app and the desktop proxy accept the update only as a PI review with the same HTML allowlist (PIR-34, PIR-17, IF-02).

**Changed**
- LIM-94: a review can now be edited by its author in My PI Review; the update call is an assumption recorded there.

DF-335, DF-336; SM-192, SM-193, R-22, R-23; LIM-94, LIM-112; TC-PIR-34, TC-PIR-35 (UAT), TC-PIR-36, TC-PIR-06, TC-PIR-27.
