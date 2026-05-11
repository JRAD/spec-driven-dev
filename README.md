# spec-driven-dev

A Claude Code plugin for spec-driven development. Generates three sequenced artifacts — specification, implementation plan, task list — with quality enforcement and human checkpoints built in.

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
| `/sdd <request>` | Run the full pipeline interactively |

## The `/sdd` flow

`/sdd` runs a staged pipeline with human checkpoints. It will not advance to the next artifact without your approval.

**Stage 0 — Request assessment.** If the request is too vague to spec (no user, no outcome, no constraints), Claude will ask for clarification before generating anything.

**Stage 1 — Spec.** Generates the spec, runs an internal quality review, surfaces any blocking gaps, and asks: *"Does this spec look correct? Reply approve to continue, or provide feedback to revise."*

**Stage 2 — Plan.** Explores the codebase (or identifies greenfield decisions), generates the plan, verifies file path references, runs an internal review, and asks: *"Does this plan look correct? Reply approve to continue, or provide feedback to revise."*

**Stage 3 — Tasks.** Generates the task list with sized tasks, explicit dependencies, and runnable validation steps.

## Review commands

Use review commands when you've already generated an artifact and want a quality gate before proceeding manually:

```
/spec-review docs/specs/my-feature-spec.md
/plan-review docs/plans/my-feature-plan.md
```

Each returns findings by section and one of three verdicts: **ready**, **ready with caveats**, or **not ready**.

## Artifact locations

```
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

## Hooks

The guardrail hook in `hooks/hooks.json` uses bash syntax. On Windows, Claude Code must be running with a bash-compatible shell (Git Bash or WSL) for the hook to execute correctly. If hooks are not firing, check your shell configuration or remove the `hooks` entry from `plugin.json` to disable them.
