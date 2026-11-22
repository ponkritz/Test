---
bump: patch
---
**Process**
- **Independent review team** — seven read-only Claude Code agents for an unbiased, line-by-line review of the code: `review-lead` (plans module slices, merges and ranks the findings) and six discrete reviewers — Developer, Tester, Peer review, Code review, UI/UX and Design defaults. Every finding is a Bug, Open Item, Future Item, Improvement or Weak Design with its location and evidence; the report goes to `docs/reviews/`. Method and rules: `docs/reviews/README.md`; DEVELOPMENT-PROCESS §4.
