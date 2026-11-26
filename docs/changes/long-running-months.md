---
bump: minor
---
**Changed**
- **Long-running Features by months** — in the PI Review Meeting a Feature of the ticked release-based streams is long-running when it is not Closed / Done and its Created Date is more than N calendar months before the build (exactly N months is not; created 20 May with 6 months: from 21 Nov), N per Epic in Meeting presentation → **Long-running after (months)** (a default row of **6 months** and a row per Epic). The slide says "created more than N months ago", keeps the age in months · years · PIs and shows each Feature's limit ("6 months"); it no longer needs the PI's dates to find them. A `pi-review-form.json` with the earlier PI-based limits still loads: the PI values are not converted (the default 6 months applies) and the panel says in one line to set the months again; the file stays schema 2 (PIR-85, PIR-57, PIR-58).

DF-565, DF-566, SM-355, LIM-250, LIM-251; TC-PIR-58, TC-PIR-61, TC-PIR-85, TC-PIR-86.
