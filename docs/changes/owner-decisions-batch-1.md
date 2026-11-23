---
bump: minor
---
**Changed** (owner decisions on the design defaults review)
- **Monthly pack status "Not set"** — with no status chosen, the pack shows "Not set" with a grey circle instead of a green "On Track" nobody judged (PCK-08).
- **Overloaded means strictly above the limit** — everywhere (Dashboard, Team overview, Settings, Capacity vs Actual): exactly at the limit is no longer Overloaded (CAP-07, OV-14, SET-02; KB-69).
- **A connection without a role is read-only** — a role-less connection (older or hand-edited, also from Git) is Reference, never the writing role; an older Time Writing setup saved before roles existed keeps working (CON-100).
- **"Joined on" is now "Time tracking started"** — the date time tracking started for a person (not the real joining date); "Left on" is unchanged; saved dates are kept (CAP-14, CAP-15).

TC-CON-62, TC-PCK-06.
