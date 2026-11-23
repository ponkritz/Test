---
bump: minor
---
**Added**
- **Row keys on On-Demand pages** — every row gets a key the moment it is added, e.g. `CONQ-261123-K7Q2` (the page's key prefix, the date, 4 random characters). It is unique even when several people add rows at the same time and save on their own, and it never changes. The key is the first column, searchable and exported; the prefix is set per page in Set up columns… and fixed once rows have keys; existing rows get keys on the next Save to Git (OND-18).

DF-151; TC-OND-15.
