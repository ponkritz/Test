---
bump: minor
---
**Changed**
- **PI Review Setup** — the PI Review form setup is now a page of its own, **Admin → PI Review Setup**, right after Epic & Feature setup in the Admin menu: the summary of the form in use, **Edit form…** with the shared column editor, **Save to Git**, the notices and the read-only state with its reason. The page — in the menu, Search settings (Ctrl K) and the Home page's Admin links — is shown **only to people with "PI Review: set up the review form"** (Scrum Master and Tool Owner by default; Role rights decide); anyone else asking for it by a remembered page or an old link gets Admin → Streams, and everyone else's reviews simply follow the form. **Epic & Feature setup** is back to its three sections (Setup per Epic, Value lists, User Story templates). The "newer data in Git" notice for `pi-review-form.json` shows on the new page; everywhere else the newer form is loaded quietly. A link to the former section opens the page (PIR-29, PIR-31, PIR-19, SET-15; PIR-23 retired).

**Added**
- **⚙ PI Review Setup** — an icon button at the end of the page actions of **My PI Review** and **PI Review** opens PI Review Setup. It is shown exactly when the page is in your menu — also in View as, by the viewed role, with the page then read only — and replaces PI Review's **Form setup** button (PIR-30, CON-114).
- **UI standard** — ⚙ is the symbol for "open the setup of this page" in the page actions (UI-STANDARDS §6, approved by the product owner on 2026-11-25).

TC-PIR-30, TC-PIR-31 (UAT), TC-PIR-22, TC-PIR-23, TC-PIR-24, TC-CON-71, TC-SET-06.
