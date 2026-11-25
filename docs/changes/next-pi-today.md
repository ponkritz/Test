---
bump: minor
---
**Changed**
- **The next PI always from today's PI** (product owner, 25 Nov 2026) — Moves to in Write review… (PI Review, My PI Review) and the Close pop-up is now the PI that starts next after the PI whose Azure DevOps dates hold **today** (UTC), whatever PI is reviewed: a Feature of PI 26.4 reviewed on 10 Jan 2027, in PI 27.1, gets PI 27.2; reviewed during PI 26.4, PI 27.1. When no PI is dated over today (or two are), the form **warns** and uses the next undated PI by number after the last PI that ended, else the year rollover; the PIs-per-year inference and the year rollover stay (PIR-25).
- **Move to next PI = No hides Moves to and the Reason** ("When I select No, it should not show the next PI") — both appear with Yes; a reason typed is kept but posted only with Yes; the comment still names the next PI ("Whether the feature needs to be shifted to PI 27.1 : No") (PIR-13, PIR-20).
- **A clean review form** ("Minimize the text … Keep the form clean") — what posting does, the pre-selected answer and each field's help are behind **ⓘ How to fill in**, the Preview's explanation behind its ⓘ, the source of Moves to behind the ⓘ beside it with one short line or warning under the field; labels, errors and the read-back problems stay visible, the pre-selected No stays checked on the form (PIR-32, PIR-18).

**Fixed**
- **PI names of real iteration trees** — names such as "PI.25.1", "PI 25.1" with a non-breaking space, "PI 25.1 (Jan–Mar)", PIs under a year folder or in several team subtrees, and Sprints named "PI 26.2.1" were listed as "Left out (no PI number in the name)", so the dates were not used; they are now read, one PI per number, and the left-out list names at most five (PIR-25, KB-97).
- **Hand-written reviews** — "Whether the Feature needs to be shifted to PI.26.4 - Yes …" is read as the Move question, "Nil" as none, and "Learning-good exposure, Struggle-long list CRs" as Learnings and Struggles (PIR-12, KB-98).
- **ⓘ in pop-ups** opened behind the pop-up; it now opens above it (KB-99).

**Backlog**
- PI Review Discussions stored in Git — parked by the product owner (OI-19).

DF-315, DF-320, SM-185; KB-97, KB-98, KB-99, LIM-100, LIM-101, OI-19; TC-PIR-12, TC-PIR-14, TC-PIR-16, TC-PIR-18, TC-PIR-25, TC-PIR-28, TC-PIR-32, TC-PIR-33.
