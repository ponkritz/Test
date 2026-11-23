---
bump: minor
---
**Added**
- **Chart grid: resize and drag to move** — charts on the Insights tab, On-Demand Dashboards and Team overview → Streams now sit on a 12-column grid with rows of about 40 px instead of the ⅓ / ½ / ⅔ / Full snapping: a chart is 2…12 columns wide and any number of rows high (at least 3 × 5; a summary table 4 × 4), its size shown as "8 × 6"; the others move out of the way and gaps close upward. The page's owners (a dashboard's builders) click **Arrange charts** (Dashboard: ⋯ → **Arrange on the page**): the grid's lines show and they drag a chart by ⠿ to another place or by its corner to another size — or use the keyboard (arrows on ⠿ move, arrows on the corner resize, Shift + arrows on the corner move) — and the layout is saved to Git for everyone. Everyone can still resize a chart for themselves (now by columns and rows) but not move it; on a phone every chart is full width. The sizes of before map exactly onto the grid, so nothing changes until someone arranges (CHT-43…CHT-50).

**Changed**
- The resize handle snaps to columns and rows instead of the four widths and three heights; "Arrange sizes" is now "Arrange charts" (Dashboard: "Arrange on the page") (CHT-49, CHT-47). Older app versions show the nearest size and ignore the places (LIM-41).

DF-215, SM-117, LIM-41; TC-CHT-34…TC-CHT-37.
