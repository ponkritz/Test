---
bump: major
---
**Changed**
- **Business time is UTC** (owner decision 1 of the design defaults review) — UTC now decides, for everyone wherever
  they are, which **month** a date belongs to (the header month's default, the month filters and counts of the
  release pages, Pulse Check, the Dashboard, Capacity, Insights, Windchill exports and closures in a month), the
  **month of new month Time Writing Tasks**, which **Sprint / PI is current**, and the **moment a month's plan or
  actuals lock** (the lock day ends at midnight UTC). Before, the app mixed India time, the viewer's own zone and UTC.
  Dates and times shown to you (fetched at, saved at, history) stay in your own time zone (NAV-51, NAV-11, NAV-12,
  QV-18, QV-16, QV-24, QV-53, OV-10, MON-06, MON-07, ATM-08, BKL-31, BKL-43, SET-06).
- **What you will notice outside UTC:** a new month (and a new Sprint day) now starts at your local time of midnight
  UTC — for example at 19:00 / 20:00 on the last day of the month in New York, and at 05:30 on the 1st in India
  instead of midnight. **Existing data near a month end can move to a different month:** an item approved, closed or
  dated in the last or first hours of a month (in your local time) is now counted in its UTC month, so a release,
  document or closure counted in November before may now be counted in October (or the reverse), and the month
  locks a few hours earlier or later than before.

**Fixed**
- The header month, a new month Task's title, the current Sprint and the lock could disagree near a month end (a US
  user saw November while a new Task was titled December; a plan was locked for one person and open for another)
  (KB-72).

DF-140; TC-NAV-51.
