# spec-driven-dev

A Claude Code plugin for spec-driven development, sized to the work. A quick tier produces a one-page brief; a full tier produces three sequenced artifacts — specification, implementation plan, task list — with quality enforcement and human checkpoints built in. `/sdd` triages between them, and Claude can invoke it on its own.

## What it provides

- A reusable skill for generating three markdown artifacts:
  - specification
  - implementation plan
  - task list
- Slash-command entry points for each artifact and for the full pipeline
- Review commands that evaluate artifacts before you advance to the next stage
- Specialist agents for requirements analysis, architecture planning, and task decomposition
- A guardrail hook that warns when no spec exists
- Sample generated artifacts

## Plugin structure

```
.claude-plugin/plugin.json       manifest
skills/spec-driven-dev/          main skill, templates, examples
commands/                        slash commands
agents/                          specialist agents
hooks/                           guardrail hooks
docs/                            sample output artifacts
```

## Commands

| Command | What it does |
|---|---|
| `/spec <request>` | Generate a specification only |
| `/plan <spec-path>` | Generate a plan from an existing spec |
| `/tasks <plan-path>` | Generate a task list from an existing plan |
| `/spec-review <spec-path>` | Critique a spec and return a readiness verdict |
| `/plan-review <plan-path>` | Critique a plan and return a readiness verdict |
| `/sdd [--quick\|--full] <request>` | Triage the request, then run the quick or full path interactively |
| `/brief <request>` | Write a one-page brief (quick tier) directly |
| `/implement [tasks-path]` | Drive implementation of a task list (user-invoked only) |

## Tiers

| Tier | Use when | Output |
|---|---|---|
| None | Trivial or obvious change | Just do it |
| Quick | One concern, low ambiguity, or settling decisions so other work can start | `docs/briefs/<slug>-brief.md`: no IDs, no separate plan |
| Full | Large, ambiguous, multi-session, or multi-person work | spec, plan, and task list with cross-reference tags |

The quick-tier brief centers on **decisions** (settled vs. open, with owners) and **contracts** (what separate pieces of work must agree on), then testable done-when checks. It can be implemented directly, split into tickets, or promoted to the full tier.

## The `/sdd` flow

`/sdd` triages the request into a tier, then runs it with human checkpoints. Pass `--quick` or `--full` to skip triage. It will not advance past a checkpoint without your approval. The stages below are the full tier.

**Stage 0 — Triage and assessment.** Chooses a tier and states why. If the request is too vague to spec (no user, no outcome, no constraints), Claude will ask for clarification before generating anything.

**Stage 1 — Spec.** Generates the spec, runs an internal quality review, surfaces any blocking gaps, and asks: *"Does this spec look correct? Reply approve to continue, or provide feedback to revise."*

**Stage 2 — Plan.** Explores the codebase (or identifies greenfield decisions), generates the plan, verifies file path references, runs an internal review, and asks: *"Does this plan look correct? Reply approve to continue, or provide feedback to revise."*

**Stage 3 — Tasks.** Generates the task list with sized tasks, explicit dependencies, and runnable validation steps.

**Stage 4 — Implement.** Optional; drives the task list with per-task confirmation.

## Review commands

Use review commands when you've already generated an artifact and want a quality gate before proceeding manually:

```
/spec-review docs/specs/my-feature-spec.md
/plan-review docs/plans/my-feature-plan.md
```

Each returns findings by section and one of three verdicts: **ready**, **ready with caveats**, or **not ready**.

## Artifact locations

```
docs/briefs/<slug>-brief.md   (quick tier)
docs/specs/<slug>-spec.md
docs/plans/<slug>-plan.md
docs/tasks/<slug>-tasks.md
```

## Local testing

```bash
claude --plugin-dir ./spec-driven-dev-plugin
```

Reload changes during development:

```bash
/reload-plugins
```

## Reference tags

Full-tier artifacts tag only the items another artifact or a tool cites: `[FR]`, `[NFR]`, `[CON]`, `[OQ]`, `[AC]` in specs; `[COMP]`, `[INTF]`, `[RISK]` in plans; `[P]`, `[T]` in task lists. Goals, use cases, assumptions, and technology decisions are untagged. Briefs use no tags.

## Invocation

All commands except `/implement` can be invoked by Claude itself, so a session can triage into the workflow. `/implement` edits code and commits per task, so it requires an explicit user invocation.

## Hooks

`hooks/hooks.json` defines two hooks. Both use Node.js, so they work on Windows, macOS, and Linux without any shell configuration — Node.js must be available on your PATH.

- **Spec guardrail (`PreToolUse`)** — prints a reminder before a `Write`/`Edit`/`MultiEdit` if neither `docs/specs/` nor `docs/briefs/` contains a markdown file yet. It only checks whether *any* spec or brief exists anywhere in the project, not whether one exists for the specific feature being touched — so it fires once, early in a project's life, and goes silent for good as soon as a first spec is written. It is not a per-feature check.
- **Consistency check (`PostToolUse`)** — runs `scripts/check-consistency.js` after every `Write`/`Edit`/`MultiEdit`. It checks that the reference-tag format documented in `agents/implementation-driver.md` still matches what `templates/tasks-template.md` and `examples/example-tasks.md` actually produce, and that `commands/spec.md`, `plan.md`, and `tasks.md` still each reference their corresponding specialist agent. It is advisory only — it always exits `0` and reports `PASS`/`FAIL` via stdout, so it never blocks the edit that triggered it.
