---
bump: minor
---
**Added**
- **Write the PI review in the app** — **Write review…** in PI Review's Feature drawer and in each row opens a form with dedicated paragraphs: Learnings, Struggles, Move to next PI (Yes / No, No pre-selected; the PI it moves to filled in as the next PI; an optional reason), "Advise to discuss the Feature during the Review meeting?" (Discuss during Meeting / Offline Review) and Additional Remarks. It starts from the Feature's latest review, shows a Preview of the exact comment, asks to confirm and posts it as a new comment in the Feature's Discussion with your own PAT (dev.azure.com only); the result is in Background jobs ("Post review · #id"), audited, and the Discussion is read again. A correction is a new review (PIR-13, PIR-01, IF-02).
- **The standard review comment** — plain lines PI Review reads back exactly ("Learnings :", "Struggles :", "Whether the feature needs to be shifted to PI 26.5 : Yes - …", "Advise to discuss … : …", "Additional Remarks :"), sent as escaped text, with a footer line the split ignores; a line that would be read back into another column is refused before posting (PIR-14).
- **Review mode and Additional Remarks** — two more headings read from the latest comment, as two more columns (sortable, exported), a Review mode filter and in the drawer's Latest comment (PIR-15).
- **Assigned to filter** on PI Review, and the search now covers every column shown (PIR-16).
- **My Work → My PI Review** — your Features of a PI with whether you have written their review and when, and Write review… (PIR-17, NAV-17).
- **The review when closing a Feature** — the Close pop-up asks the review of the one Feature being closed (Move pre-selected No, the advice required) and posts it before closing; a failed post closes nothing and offers Close without the review (PIR-18).
- **New permission "PI Review: post the review of a Feature"** (permissions 7) for the leads — Tool Owner, Admin, People Manager by default; a Feature's own assignee posts its review with "Add a comment"; everyone else is read only (CON-113, CON-94).

**Changed**
- UI-STANDARDS §12: Move to next PI = No pre-selected in the review form, an exception approved by the product owner.

DF-310, DF-311, DF-312, R-22, SM-180, LIM-94, LIM-95; TC-PIR-13…TC-PIR-18, TC-CON-70.
