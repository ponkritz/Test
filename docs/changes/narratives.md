---
bump: minor
---
**Added**
- **Narratives** — a new chart type **Narrative (text)** on the Insights tab and block type on On-Demand Dashboards: sentences in plain text about a measure (Count, Sum, Average … of a column, one currency at a time), over the same rows as the charts (the filter row or the dashboard's period, then its own filters), deterministic, without AI or any request (CHT-60, CHT-69).
- **Automatic sentences** the owners tick — the total, the highest and lowest Group by value with its share, above / below a threshold, the change against the previous month, quarter or year (counted outside the period chosen in the filter row) and the biggest mover (CHT-61, CHT-62).
- **Rules** — up to 20, in order: If Total, Rows counted, Top value, Top share or Change is >, ≥, <, ≤ or = a number, changed by more than x %, or the top category is a name, then show a sentence with placeholders ({value}, {total}, {top}, {share}, {change}, {period} …) and a tone (Info, Good, Warning, Bad: a coloured border, an icon and the tone in words); every match or the first, and an Else sentence (CHT-63, CHT-64, CHT-65).
- Edited in the chart and block pop-ups with a live preview; shown in Export PDF… and Publish standalone HTML… as escaped text; stored as an optional `narrative` field, validated when read and merged per chart (CHT-66, CHT-67, CHT-68). An app version without narratives (10.3 and earlier) drops them and removes them when it saves the page (LIM-50).

DF-240…DF-243, SM-130, LIM-50; TC-CHT-50…TC-CHT-57.
