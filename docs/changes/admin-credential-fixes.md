---
bump: patch
---
**Fixed**
- **The PAT typed for Restore from Git goes to one server only** — Admin → Data & sharing → Shared setup in Git → Views in Git has **Server of this PAT** next to the PAT field; the PAT is used and saved only for that server, and restored connections on other servers stay without a PAT and are named (CON-141, CON-24; KB-131, review AR-005).
- **Edit or Clone onto another server asks for that server's PAT** — the old connection's PAT is never stored for or sent to the new server (CON-142; KB-132, review AR-006).
- **Release naming patterns no longer freeze the page** — patterns are matched in linear time with the same results; a pattern has at most 20 `*`, checked on save and when the shared settings are read (CON-140; KB-130, review AR-007).
- **Shared files above 1 MB load and save** — `history-hours.json` and every other shared file above 1 MB are read raw by their version id, so Historical hours and their saves work again (GIT-40; KB-133, review AR-008).

DF-430…DF-433, SM-255…SM-258 (SM-05, SM-69, SM-79, R-02 updated); TC-CON-100…TC-CON-103, TC-GIT-35…TC-GIT-37.
