---
bump: minor
---
**Added**
- **Conduct PI Meeting** — on Data Insights → PI Review the PI Review leads and the PI Review Setup holders build the **PI Review Meeting** presentation of the chosen PI as one self-contained, offline HTML file: a static snapshot (its title names the PI, when it was built and by whom) of the reviews from "PI Review starts from" on, with the slides Title, Summary (and per Epic), one slide per Feature to discuss during the meeting, every other reviewed Feature grouped by Epic, the Features not reviewed, and the Themes — all Learnings, then all Struggles, with their Feature IDs; long lists over several slides; ← / →, Home / End, a slide overview and print at one slide a page. Every value is escaped, people by display name only, no request leaves the file. The build runs in Background jobs; the file is always downloaded, and a copy is saved in the Git data repository under `pi-review/meetings/PI-<pi>/` (not in View as, with sample data, without Git or with a read-only token — the page says why). The new **PI Review Meetings** panel lists the saved meetings with Open and Download (PIR-40…PIR-47).

DF-470…DF-477, SM-270…SM-273, LIM-170…LIM-173; TC-PIR-42…TC-PIR-47.
