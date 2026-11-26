---
bump: minor
---
**Added**
- **Month Task states kept automatically** — after every fetch of the Time Writing connection a background job **Month Task states** (Jobs done) closes your **own** Month Tasks of a month whose Actuals lock has passed (midnight UTC after the lock day, or locked early) or whose Feature is Resolved / Closed / Completed / Done, and your Time Writing story once all its Tasks are Closed; a New Month Task with hours is set Active. The States are read again before writing; never another person's Task, never a Feature closed, nothing with the sample, in View as, without the right or on-premises (ACT-26, ACT-27).
- **Feature set Active with its Time Writing story** — when hours make the Time Writing story Active, a New Feature above it becomes Active too (ACT-25).

**Changed**
- **Hours set Active only from New** — saving hours on a Month Task (Time Writing, Edit form) sets the Task and its Time Writing story Active only when they are still New; a Resolved or Closed item is no longer reopened and the message says so (ACT-24, replaces BKL-41).
- **Features Working on** — the Time Writing card "Tasks" is now "Features Working on": the number of distinct Features holding your Time Writing Task of the month (ACT-23, ACT-22).

DF-480, DF-481, DF-482, DF-483, SM-280, SM-281, LIM-175, LIM-176; TC-ACT-18…TC-ACT-22, TC-BKL-30.
