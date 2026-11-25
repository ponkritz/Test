---
bump: minor
---
**Added**
- **PI Review form setup** — the Scrum Master and the Tool Owner change the review form in the app (Admin → Epic & Feature setup → PI Review form, or Form setup on PI Review): add, remove and reorder fields; each field's label, the heading written in the comment, type (Long text or Dropdown) and options, required, default and help. Shared in Git as pi-review-form.json, queued and merged like the other shared setup, read strictly and picked up as newer data; without it the built-in form applies. Move to next PI keeps its behaviour (Yes / No, the next PI, the reason) and stays No by default unless changed (PIR-19, PIR-22).
- **The review follows the setup** — Write review…, My PI Review and the Close pop-up show its fields; the comment writes its headings; PI Review reads them, still reads the built-in headings and the earlier formats, and shows each added field as a column of its own (PIR-20).
- **Checks before saving** — empty, duplicate or colliding headings (one already read as another field) are refused, and a review written with the form must read back exactly (PIR-21).
- **New permission "PI Review: set up the review form"** (permissions 8) for Scrum Master and Tool Owner; everyone else sees the setup read only with the reason, as in View as, with sample data and without Git (CON-114, PIR-23, CON-94).

**Changed**
- **One column editor** — the On-Demand pages' Set up columns and the PI Review form setup share one editor, so a change in one place changes both; the On-Demand dialog works and reads as before (OND-05, OND-06, PIR-22).

DF-313, DF-314, R-23, SM-181, LIM-96; TC-PIR-19…TC-PIR-24, TC-CON-71.
