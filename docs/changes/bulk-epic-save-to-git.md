---
bump: patch
---
- **Bulk creation Epics: a shared Epic is saved straight to Git** (QV-59). In Admin → Stream options → Bulk creation Epics, **Save to Git** on a shared Epic commits it to the shared planning data in Git at once, with no separate Save to Git step. It shows Saved or why it failed. Without a writable Git connection (not connected, read-only token, synthetic sample loaded) the shared field is disabled and says why. Your own Epic works as before.
- **A missing bulk creation Epic needs attention** (ADM-05). Admin → Overview lists *{stream} bulk creation Epic is not set* under **Attention** instead of Optional, because that stream's Create Features stays disabled until it is mapped.
