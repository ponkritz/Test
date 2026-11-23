---
bump: minor
---
**Added**
- **On-Demand row IDs** — every row gets a readable ID such as `CONQ-0001` when it is first saved to Git: the next free number, never changed, unique also when several people save at the same time (OND-19).
- **Who added a row and when, and its History** — each row records the work email of the person who added it and the time (Added by / Added on); every saved change is logged automatically with who, when and what changed (old → new), shown as History in the row pop-up; Last updated by / on can be added as columns; two saves of the same row keep both log entries (OND-20, OND-21).
- **Long text and Currency columns** — a paragraph of up to 10,000 characters; an amount with its currency (a default per column, another per row), shown as "1,200.00 EUR". Insights add up a Currency column one currency at a time, never converting (OND-22, OND-23, OND-24).
- **Column descriptions** — how or what to fill, shown under the field in the row pop-up and behind ⓘ on the column heading (OND-25).

**Changed**
- The page file keeps schema 1 with optional new fields; an older app version saving a page drops them (LIM-19). Changing the columns now keeps each row's key, ID and History (OND-26).

DF-152, DF-153, DF-154, SM-98, LIM-19; TC-OND-16…20.
