---
bump: patch
---
**Fixed**
- **A data repository the token cannot read no longer looks empty** — after Git storage was moved to a new repository, streams, links and connections were shown as empty: GitHub answers "Not Found" also when the token cannot see the repository, and the app took that for missing files. The app now asks GitHub once per session whether the repository can be read; if it cannot, it says "Repository … or branch … was not found, or the token cannot access it." on Git storage, the read-only notice and People & roles, keeps the custom streams, connections, PATs and roles this browser has, and does not offer Set up roles (GIT-25, KB-92).
- **Changing the repository keeps your connections** — the first start after Change connection… or Switch only adds the new repository's connections that are not here; nothing is removed or replaced, a clean-up found there is not applied, and Admin → Data & sharing (Git storage, and Shared setup in Git) says what differs (GIT-26, KB-92).

DF-270, DF-271, SM-151, LIM-67; TC-GIT-18, TC-GIT-19, TC-GIT-20.
