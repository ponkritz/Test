---
bump: minor
---
**Changed** (owner decision 10)
- **One list of finished states** — Closed, Resolved, Completed and Done count as finished on every page (Pulse Check, the Monthly pack, Planning Overview, Insights, My Tasks, query views); Removed and Cut are not finished (FET-23, KB-70).
- **The close date from the item's history** — a finished item without a Closed Date now counts in the month it was finished: its State Change Date, else its Resolved Date, else its history (read once and kept), and only then its last change (FET-24; DSK-04 adds the read-only history request; CR-PB-08).

DF-138; SM-92; TC-FET-11.
