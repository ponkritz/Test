---
bump: minor
---
**Added**
- **PI Review: more heading styles.** The latest comment is also split by synonyms of the three headings. Struggles: Challenges, Issues, Problems, Blockers, Impediments, Risks, Pain points, What went wrong, What didn't go well. Learnings: Lessons, Lessons learnt / learned, Takeaways, What went well, Went well, Improvements, Improve, Next time. Move to Next PI: Spill over, Carry over, Next PI, Moving to next PI, Continue in next PI. The placement rules stay the same, and a dash with a space now works too. Inline forms like "struggle – …", "learning - …" and "lesson: …" also count. A plain sentence without a colon or a dash is still not a heading (PIR-08).
- **Suggested from keywords.** When the newest comment has no heading at all, its sentences are suggested for Struggles, Learnings and Move to Next PI by a built-in keyword list (blocked, delayed, risk… · learned, next time, went well… · carry over, next PI, spill over…). Whole words only, and "no blockers" or "not blocked" are not taken. A sentence with words of two columns goes to both. A suggested Move gets Yes / No / Partly only when the sentence says so right after the phrase (PIR-11).
- **Marked as suggested.** A suggested cell shows "(suggested)" before its text in italics, with the tooltip "Suggested from keywords, not headings". The drawer's Latest comment says "Suggested from keywords". Export adds the column **Split from** (Headings, Keywords or None). Nothing is stored, as before (PIR-09, PIR-10, PIR-11).

DF-303, DF-306; SM-177; LIM-89, LIM-91; TC-PIR-08, TC-PIR-10, TC-PIR-11 (UAT).
