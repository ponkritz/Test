---
bump: minor
---
**Added**
- **Chart elements** — like Excel's Chart Elements, the owners of an Insights tab (and a dashboard's builders) can set for everyone, in the chart's Display options: chart heading, axes and axis names on or off; data labels on or off for everyone, their position (bars: Center, Inside End, Inside Base, Outside End; lines: Center, Left, Right, Above, Below; pies: Center, Inside End, Outside End, Best Fit with leader lines), their contents (series name, category name, value, percentage) and number format (0–2 decimals, currency code); a data table under the chart; major and minor gridlines; the legend at the top, bottom, left, right or none; a linear trendline per series. Each viewer can still switch data labels on or off for themselves. Labels never overlap or leave the chart. Charts nobody changed look exactly as before (CHT-26…CHT-35).
- **KPI cards** — KPI (one number) charts on an Insights tab are now shown together as a row of compact cards above the other charts, like the Dashboard's KPI tiles, with ⓘ, "Filtered" and the owners' ⋯ menu. Existing KPI charts (added since v9.14) become cards; Show as: Panel keeps the old panel (CHT-36, CHT-37).

**Changed**
- Chart and table headers on the Insights tab and On-Demand Dashboards no longer show the chart type above the title; the type is the first line of ⓘ (CHT-39). UI-STANDARDS records the approved v10.1 chart wording (size, resize handle, chart header, ⋯ menus).

**Fixed**
- The KPI preview in the chart pop-up was about 90 px wide and cut the number; KPI cards are now at least 180 px and never cut the number (KB-84, CHT-37).
- The chart pop-up's preview overlapped the Display fieldset and clipped the field labels; the form and the preview now sit side by side or one under the other (KB-85, CHT-38).
- The preview repeated the measure, filters and rows counted under its title; it now shows the chart's own header (KB-86, CHT-38).

DF-207…DF-210, SM-114, LIM-38, KB-84…KB-86; TC-CHT-22…TC-CHT-31.
