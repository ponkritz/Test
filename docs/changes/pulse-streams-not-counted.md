---
bump: minor
---
**Added**
- **Pulse Check → Streams not counted** — a multi-select in Pulse Check's filter bar, for the Month tabs and the Quarter / Half-year / Year view, of every release stream (built-in, custom, each Windchill export). A stream ticked there stays on the page, greyed and marked "Not counted", and every release total ignores it: the Releases and Supported summaries, the All streams total, the period's Releases and Change tiles and Total, in both periods so the Change compares like with like; ⓘ names the streams not counted and the Windchill exports export has a Counted column. A stream added later is counted (QV-66).
- **Team default and own choice** — the Tool Owner (and the Admin) saves the choice for everyone with Save view for everyone (entry `pulse-streams` in `personal-views-defaults.json`); each person's own change is kept in their personal views, with Use the view for everyone to go back (QV-67, UI-23).
- Not in scope: the Work closed and opened tables count every Epic; the Monthly pack, Team overview, My dashboard and Release pages count every stream (LIM-65).

DF-267, SM-149, LIM-65; TC-QV-47 (UAT), TC-QV-48.
