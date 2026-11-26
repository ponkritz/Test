---
bump: minor
---
**Changed**
- **Load everything from Git runs in the background** — pressing Load everything from Git in the forced pop-up (or Retry) closes it at once and the load runs as the background job "Load everything from Git" in the top bar's Background jobs (Jobs done): running with the part being loaded, then done with what was loaded, or failed naming each part; the app can be used meanwhile. One load at a time; the pop-up stays closed while it runs and comes back in its failed state (what failed, the Git storage setup, Retry) only when it fails. Admin → Data & sharing → Load from Git → Load everything from Git runs the same job. At phone width the Background jobs list opens over the page (GIT-33, GIT-34, GIT-35).

DF-397, DF-398, DF-399; TC-GIT-28, TC-GIT-29, TC-GIT-30.
