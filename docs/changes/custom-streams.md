---
bump: minor
---
**Added**
- **Custom streams** — the Tool Owner adds a Release page for a new stream without a new version of the app: Admin → Streams → Stream mapping → Custom streams → **＋ Add stream…** with a name, a source (Azure DevOps query connection or Windchill export) and one of the app's release rules by plain name with an example (Like DP, Like IOCC, Like Content, Like Tool Validations, Like S&S IT, Like ECP), fuzzy Feature matching, earlier names and the Epics to match Features in. Saved at once to the shared setup in Git (`custom-streams.json`); Edit renames (the old name kept as an earlier name), Remove asks first and keeps the connection and its data (STR-01, STR-03, STR-04, STR-06).
- Every list of streams follows the built-in and custom streams: the Stream mapping rows, the Release Details menu and Home tile, the stream's Release page with the UI-STANDARDS §10 parts (source bar, counts, Releases | Source data, Time Writing Feature, Planned / Booked hours, Create Feature and bulk create where the rule has it), Pulse Check, the Dashboard delivery counts, the Monthly pack setup, My dashboard and Release naming patterns; a connection belongs to the stream with the longest matching name (STR-02).
- The file read from Git is validated: an unknown rule, CP's tree rule or a built-in stream's name is refused with a clear message, the other streams are used; without “Change the stream mapping” Add stream, Edit and Remove are disabled with the reason (STR-05, STR-07).

DF-155, DF-156, DF-157, SM-99, LIM-20; TC-STR-01…07.
