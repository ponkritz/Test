---
bump: major
---
**Changed**
- **Other views are each person's own** — the shared Streams file in Git (`azure-views.json`) now holds the Stream mapping only; every other connection (custom queries, backlog views, background sources) is saved in a file of its creator's own, `other-views/<work email>.json`, with who added it and never a PAT, and only that person sees, edits and fetches it; adding, editing or removing one saves the file at once and the person's other computers follow it (CON-119, CON-120, CON-124).
- **Older shared Other views wait for an admin** — the first start with a Git token that can save moves the Other views of the shared setup to `other-views/unassigned.json` (list first, then the setup; safe when two computers do it at once; an older app writing them back changes nothing); admins see **Unassigned Other views** under Admin → Data & sharing → Other views and **Assign…** each one to a person (CON-121, CON-122, CON-123, SET-20).

**Added**
- **Load everything from Git when the Streams file changed** — a blocking pop-up (no ×, no Escape) whose only action is Load everything from Git, once per change of `azure-views.json` per repository and once for everyone after this release; never in View as, with the sample, without Git or for this computer's own save; it can never be skipped: after a failed load it names what failed and shows the Git storage connection setup (the same form as Admin → Data & sharing → Git storage) inside the pop-up with Retry; during a GitHub outage (every failure a server error or no network) it also offers Continue without loading, until the next start (GIT-29, GIT-30, GIT-31, GIT-32; LIM-155).

DF-392, DF-393, DF-394, DF-395, DF-396; SM-240, SM-241; LIM-153…LIM-157; TC-CON-75…TC-CON-80, TC-GIT-24…TC-GIT-27, TC-SET-10.
