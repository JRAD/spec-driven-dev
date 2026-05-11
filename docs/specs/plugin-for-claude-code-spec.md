---
artifact_type: spec
title: Spec-Driven Development Plugin for Claude Code
slug: plugin-for-claude-code
status: draft
source_request: build a Claude Code plugin that implements a spec-driven development workflow
depends_on: []
---

# Spec-Driven Development Plugin for Claude Code

## Summary

A Claude Code plugin that provides a structured workflow for generating three linked markdown artifacts — specification, implementation plan, and task list — from a raw feature request. The plugin exposes slash commands, a reusable skill, specialist agents, and optional hooks so teams can adopt spec-driven development inside Claude Code.

## Problem statement

Developers using Claude Code often jump directly from a vague request to code generation. Without a structured intermediate step, the resulting code frequently misses scope, skips edge cases, and is hard to review or trace back to intent. There is no standard plugin that enforces a think-before-build pattern inside Claude Code.

## Goals

- Provide a `/spec`, `/plan`, `/tasks`, and `/sdd` command set that guides users through artifact generation in sequence.
- Produce consistently formatted markdown artifacts with YAML frontmatter for traceability.
- Offer templates so the output shape is predictable and reviewable.
- Include worked examples so new users understand the expected output quality.
- Package everything as a portable Claude Code plugin installable from a directory.

## Non-goals

- Automatic code generation from tasks (this plugin stops at the task list).
- Integration with external project management tools (Linear, Jira, GitHub Issues).
- Real-time collaboration or multi-user artifact merging.
- Enforcement that artifacts exist before code is written (hooks are advisory, not blocking by default).

## Primary users / actors

- **Individual developers** using Claude Code who want structured planning before implementation.
- **Teams** who want a shared, reviewable spec-and-plan step in their workflow.
- **Plugin authors** who use this plugin as a reference implementation of a Claude Code plugin.

## Use cases

1. Developer has a feature request; runs `/sdd add bulk invoice export for admin users` and receives all three artifacts in one shot.
2. Developer runs `/spec` first, reviews and edits the spec, then runs `/plan` pointing at the spec file, then `/tasks` pointing at the plan.
3. Team lead reviews `docs/specs/` as part of a PR, traces requirements through to task breakdown.
4. A developer new to the plugin reads `skills/spec-driven-dev/examples/` to understand the expected artifact format before generating their first spec.

## Functional requirements

- FR-1: The plugin provides four slash commands: `/spec`, `/plan`, `/tasks`, and `/sdd`.
- FR-2: `/spec <request>` generates a spec artifact at `docs/specs/<slug>-spec.md`.
- FR-3: `/plan <spec-path>` reads a spec and generates a plan artifact at `docs/plans/<slug>-plan.md`.
- FR-4: `/tasks <plan-path>` reads a plan and generates a task list at `docs/tasks/<slug>-tasks.md`.
- FR-5: `/sdd <request>` runs the full pipeline (spec → plan → tasks) in one invocation.
- FR-6: Every artifact includes YAML frontmatter with `artifact_type`, `title`, `slug`, `status`, `source_request`, and `depends_on`.
- FR-7: The plugin exposes a `spec-driven-dev` skill that can be invoked directly or by the commands.
- FR-8: Templates are provided for all three artifact types and are referenced by the skill.
- FR-9: Worked examples are provided for all three artifact types.
- FR-10: A `plugin.json` manifest at `.claude-plugin/plugin.json` describes the plugin.

## Non-functional requirements

- NFR-1: The plugin must be loadable by Claude Code via `--plugin-dir` without errors.
- NFR-2: All artifacts must be valid markdown with parseable YAML frontmatter.
- NFR-3: The plugin must not require any external dependencies beyond what Claude Code provides.
- NFR-4: Commands must work in any project directory, writing output relative to the working directory.

## Constraints

- Must conform to the Claude Code plugin schema (`$schema` in `plugin.json`).
- All skill, command, agent, and hook files must be markdown with valid YAML frontmatter.
- The plugin is read-only with respect to existing project files; it only creates new artifact files.

## Assumptions

- Claude Code supports loading plugins from a local directory via `--plugin-dir`.
- The plugin schema supports `disable-model-invocation: true` in command frontmatter to prevent automatic LLM calls on load.
- Users have a `docs/` directory or are comfortable having one created at the project root.

## Open questions

- OQ-1: Should the skill enforce the spec → plan → tasks sequence (refuse to generate a plan if no spec exists at the expected path)?
- OQ-2: Should the hooks file include a pre-commit hook that warns when tasks exist but no spec file is linked?
- OQ-3: Is there a plugin registry or distribution mechanism, or is local `--plugin-dir` the only install path?

## Acceptance criteria

- AC-1: Running `/spec-driven-dev:spec <request>` creates a well-formed spec file at the correct path.
- AC-2: Running `/spec-driven-dev:plan <spec-path>` creates a well-formed plan file linked to the spec.
- AC-3: Running `/spec-driven-dev:tasks <plan-path>` creates a well-formed task list linked to the plan.
- AC-4: Running `/spec-driven-dev:sdd <request>` creates all three artifacts in one invocation.
- AC-5: All three artifacts have valid YAML frontmatter with all required fields.
- AC-6: The plugin loads without errors when passed to `claude --plugin-dir`.
- AC-7: Examples in `skills/spec-driven-dev/examples/` match the shape defined in the templates.
