---
bump: minor
---
**Changed**
- **Load latest Release Details** — the forced pop-up when the shared Stream mapping in Git changed is now "Load latest Release Details" and loads only the Stream mapping: the custom streams and the connection setup (azure-views.json with its markers and your own Other views), as a background job of that name in Jobs done; the Release Details pages then fetch their data as before. It no longer loads the planning data, roles, Feature setup, on-prem view data or Windchill exports (GIT-36; GIT-29, GIT-30, GIT-31, GIT-33, GIT-35 reworded).
- **Load everything from Git on the Git storage tab** — Admin → Data & sharing has no Load from Git section any more; Load everything from Git is a panel of Git storage and runs as its own background job. The two loads never run at once (GIT-37, GIT-38).

DF-440, DF-441; TC-GIT-28, TC-GIT-29, TC-GIT-31.
