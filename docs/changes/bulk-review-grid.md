---
bump: minor
---
**Changed**
- **Update review for N… is a per-Feature grid** (My PI Review) — Learnings, Struggles and Additional Remarks are written once for all, each with **Keep each Feature's own** (the default when a Feature has a review) or **Use the shared text**; every ticked Feature has its own row with **Move to next PI**, **Moves to**, **Reason** (optional, as in the single form) and the **Review meeting** advice, started from **that Feature's review** (yours, else the latest one of the PI, else your old-format comment — which stays: use Convert… to replace it — else the form defaults). **All Features** applies a value to every row (Apply to all) or fills the active row's value down; Ctrl+D copies the row above. The Preview shows the active row's comment (PIR-82, PIR-83, PIR-36).
- **Preview, then a faster run** — the **Result** column says per Feature what saving does: **Post**, **Replace** (your review), **Unchanged** (the same as your review: not written) or **Blocked** (with the reason). The job "PI review for N Features" writes **3 Features at a time** with the rate-limit handling of the Discussion reads ("2 of 4 done · …"), each Discussion still read again just before its write; the summary names the unchanged and blocked Features, and **Retry failed** in Background jobs writes only the failed Features again with the same comments (PIR-84, PIR-37).

UI-STANDARDS §5 exception: the grid is a hand-built editable table in the full-size pop-up (`DataTable` has no editable cells; LIM-248).

PIR-82, PIR-83, PIR-84; PIR-36, PIR-37 changed; TC-PIR-82…84 (TC-PIR-84 UAT); DF-560…564; LIM-245…248; SM-350, SM-351.
