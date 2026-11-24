---
bump: minor
---
**Added**
- **PI Review: read-only Discussions per Feature** — Data Insights → PI Review replaces its placeholder (UX-81) with a PI picker (the current PI by the Sprint dates in UTC, nothing chosen when two PIs overlap, the latest PI with Features when the iterations cannot be read; remembered in this browser), the PI's Features (Removed and absence-Epic Features left out; optional "Also Features with User Stories in this PI") with Epic and State filters, search and Export, and a Feature drawer that reads its whole Discussion as plain text (PIR-01…PIR-05; UC-40, UR-37, SR-44).
- **↻ Read all Discussions** — reads every Feature's Discussion as a background job, 3 at a time, waiting for Azure DevOps when it answers 429 and stopping with "x of n read" when it keeps doing so; read with your own PAT, kept in memory only (PIR-06).

**Changed**
- **All comment pages** — the Edit form's Discussion and PI Review read every page of comments (up to 1,000) with the continuation token; mentions show as @Name and images as [image] (BKL-20, PIR-05). The desktop proxy accepts the page token on the comments read only, at most 2,048 characters, URL-encoded on the fixed address (DSK-11).

DF-298, DF-299, DF-300; R-20, SM-175, SM-176; LIM-83, LIM-87; TC-PIR-01…06.
