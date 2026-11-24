---
bump: minor
---
**Added**
- **Release Classification detected from the release number** — in Admin → Epic & Feature setup → Setup per Epic, an Epic's Release Classification List field now has, for each value, ticks for the part of the release number that changes for it: x.0 (first number only), x.y (second), x.y.z (third), x.y.z.w (fourth); the deepest non-zero part decides (e.g. Release ← x.0 and x.y, MLD ← x.y.z, PU ← x.y.z.w). A part may go to one value only: a part ticked twice is named and not saved. **Fill with the usual rules** proposes Major, Minor, MLD and Platform Update (or PU) where the values are named so. The rules are saved with the field in epic-setup.json (`classRules`, read strictly; older files keep working). Until a Tool Owner saves rules nothing changes: the value named like the release type is pre-filled, as before (DPF-10).
- The DP and IOCC **Create Features** pop-ups pre-fill each row's Release Classification from these rules, with "detected from 5.2.1" under the drop-down; a release number that is not numeric gets none, and every row can still be changed (DPF-11, DPF-08).

**Changed**
- **Release name → Version → Release Classification** first: in Setup per Epic's field list, in the DP and IOCC Create Features columns, and as the first columns of the DP and IOCC release tables, which gain **Release Classification (detected)** from the rules of the mapped bulk Epic (— without one). The IOCC table's Release column is now named Version (DPF-12, DPF-04, DPF-09).

DF-282, SM-163, LIM-69; TC-DPF-09, TC-DPF-10, TC-DPF-11.
