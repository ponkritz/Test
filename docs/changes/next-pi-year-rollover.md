---
bump: patch
---
**Fixed**
- **The next PI after the last PI of a year** — Moves to in Write review… and the Close pop-up gave PI 26.5 after PI 26.4; it now gives **PI 27.1** (PI 2026.4 → PI 2027.1). The next PI is still the PI that starts next by the Azure DevOps iteration dates, future PIs included; a reviewed PI without dates takes the period of the PI covering today; with no later dated PI, the next PI by number in the iteration tree; with nothing later known, the PI number with the year rollover (4 PIs a year unless a higher number is seen; mid-year PI 26.2 → PI 26.3). "PI26.4" is read as a PI, and a PI name without a number is named in the note under Moves to (PIR-25, PIR-13, ATM-30).

DF-315; KB-96, LIM-100; TC-PIR-13, TC-PIR-25, TC-PIR-32.
