---
bump: minor
---
**Changed**
- **My PI Review: Reviewed for the chosen PI** — a review counts as Reviewed for the PI chosen in the PI filter when its headings name that PI, or — without a PI in them — when it is dated within that PI's dates in Azure DevOps (its own, else its Sprints'; UTC), or when the Feature is Closed and the review is dated on or after its Closed Date ("At close"). A review written for another PI shows Not reviewed with "Last review {date} ({PI})"; choosing another PI recomputes the column; without dates every review counts and the page says so. Write review… still starts from the latest review and says when it was written for another PI (PIR-26, PIR-17, PIR-24, PIR-13).
- **The PI review as a nested bullet list** — the comment is posted the way the product owner writes it: each heading a bullet with the lines typed as bullets under it (numbered lines as a numbered list), the choices on one bullet, the Move reason under its bullet. It is sent as HTML built by the app — every text escaped, only its own list tags — which the web app and the desktop proxy check before sending; the Preview shows the list as it will look, and hand-written comments in this layout are read back too (PIR-14).
- **The reviewed PI in the headings** — "Learnings of PI 26.4:" and "Struggles of PI 26.4:" name the PI chosen on the page (in the Close pop-up the Feature's own PI); the form setup offers {REVIEWED PI} for any heading, and setups saved before keep their headings. PI Review reads the PI back into a new Reviewed PI column, also exported (PIR-28, PIR-21, PIR-09).

**Added**
- **No learnings or struggles** — a tick box (not ticked) in Write review… and the Close pop-up's review sets both to "None", greys both boxes out and writes "None" under both headings; unticking brings back what was typed. With one of the two removed from the form setup it sets only the other, saying so (PIR-27).

DF-317, DF-318, SM-183, R-22; LIM-98, LIM-99; TC-PIR-13, TC-PIR-16, TC-PIR-27, TC-PIR-28, TC-PIR-29.
