# Repository Instructions

## Keep documentation aligned with code

When a change affects user-visible behavior, architecture, data flow/schema, security, local setup, dependencies, deployment, or an agreed roadmap, review and update the relevant Markdown documentation in the same change.

Use this map to choose the smallest relevant set of files:

| Change area | Documentation to review |
|---|---|
| Overall product, stack, setup, scripts, or known limitations | `README.md` |
| Page/runtime boundaries, integrations, data flow, or schema | `docs/ARCHITECTURE.md` |
| Authentication, authorization, RLS, uploads, headers, or security findings | `docs/SECURITY.md` |
| JavaScript module behavior, script loading, or browser data contracts | `js/README.md` |
| Stylesheet ownership, active design system, or styling workflow | `css/README.md` |
| Accepted future work or priorities | `docs/ROADMAP_BRAINSTORMING.md` |

Do not update every document for every code change. Skip documentation edits for changes that do not alter documented behavior or guidance, such as an isolated typo or purely visual adjustment that does not change the design system. If no Markdown file needs a change, briefly state that in the handoff and why.

## Documentation accuracy

- Describe the implementation that exists in the repository. Mark proposed or planned behavior as planned; do not write it as if it is active.
- When a document cannot verify remote state (for example, Supabase dashboard policies or Vercel project settings), label it as unverified and describe what must be checked.
- Remove or revise contradicted instructions and stale claims instead of appending another conflicting section.
- Keep links, file paths, commands, counts, and script names aligned with the repository. Avoid fragile line-number references in long-lived docs.
- Keep documentation updates in the same change as the code they explain so reviewers can assess both together.

## Before handing off a change

Review the relevant Markdown files against the changed code. In the final handoff, list the documentation files changed, or explain why none required an update. Do not claim remote configuration was verified unless it was actually inspected.
