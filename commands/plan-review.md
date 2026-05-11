---
description: Critique an existing implementation plan and return a readiness verdict.
argument-hint: [path to plan file]
disable-model-invocation: true
allowed-tools: Read Glob Grep
---

Read the plan at the path provided and evaluate it. Do not modify the plan. Use Glob and Grep to verify file path references — a path reference that cannot be found is an invented path and must be flagged.

$ARGUMENTS

## What to check

**Component and file references**
- For every entry in "Components and files affected", attempt to verify it exists:
  - Run `Glob` with the path pattern to check if the file or directory is present.
  - Entries tagged `[exists]` that cannot be found via Glob are invented paths — flag them by name.
  - Entries tagged `[new]` do not need to exist yet — skip Glob verification but confirm they have a plausible path (not invented from thin air).
  - Entries tagged `[assumed]` must have an explanation. Flag any `[assumed]` entry with no explanation.
- Are there component references in other sections (architecture overview, interfaces, data flow) that do not appear in the components list? They should be added or the reference should be corrected.

**Architecture overview**
- Does it describe a data flow, not just a component list? A component list without showing how data moves between components is incomplete.
- Does it explicitly call out what does *not* change, not just what is being added?

**Interfaces and contracts**
- Are API shapes, function signatures, data schemas, or event formats defined here, or just named?
- Ambiguity at interfaces is the most common source of integration failures. Flag interfaces described by name only with no contract detail.

**Delivery sequence**
- Does each phase boundary produce a working, testable system state? A phase that ends with "scaffolding in place but not wired up" does not count.
- Is the riskiest assumption in the plan tested in the earliest possible phase, or deferred to a late phase?
- Are there dependencies between phases that are implicit (not stated)?

**Risks and mitigations**
- Does each risk include a likelihood, an impact, and an actionable mitigation?
- Flag risks whose mitigation is a reassurance ("we will monitor", "this is unlikely") rather than an action.
- Are there obvious risk categories missing? Check: shared state, external service dependencies, schema migrations, permission boundary changes.

**Technology decisions**
- Are there technology decisions made implicitly in the architecture that are not documented in either the spec or a "Technology decisions" section?
- Implicit decisions are hidden risks. Flag any choice that a different architect might make differently and that isn't documented.

**Traceability**
- Does the plan link back to the spec via `depends_on` frontmatter?
- Are there acceptance criteria in the source spec that are not addressed anywhere in the plan?

## Output format

Return a structured critique with one section per area above. For each finding, cite the specific section or item. For invented file paths, list the exact path string that could not be verified.

End with an explicit readiness verdict:

- **Ready for task decomposition** — no blocking gaps found.
- **Ready with caveats** — minor gaps that should be noted but do not block task generation. List each caveat.
- **Not ready** — one or more blocking gaps must be resolved before task decomposition. List each blocking gap explicitly.
