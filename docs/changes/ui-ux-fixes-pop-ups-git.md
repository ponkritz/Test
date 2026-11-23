---
bump: patch
---
**Fixed** (independent UI/UX review findings 1, 3, 4 and 7)
- **Pop-ups work with the keyboard** — the first field takes the focus, Tab and Shift+Tab stay inside, Escape closes the topmost pop-up (an open list inside it closes first) and the focus returns to the button that opened it (UI-18).
- **A click beside a pop-up no longer loses what was typed** — every Azure DevOps write pop-up and settings editor stays open; pop-ups without input still close on such a click (UI-19).
- **Loading from Git asks before replacing unsaved changes** — Load latest, Update & load, Load latest from Git and Load everything name what would be replaced, also after a save conflict (GIT-16).
- **Edit without a saved PAT** — the PAT field no longer disappears after the first character (BKL-40).

KB-62…65; DF-134, DF-135; TC-UI-11, TC-UI-12, TC-GIT-09, TC-BKL-29.
