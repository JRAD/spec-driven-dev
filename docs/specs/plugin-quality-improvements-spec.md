---
artifact_type: spec
title: Spec-Driven-Dev Plugin Quality Improvements
slug: plugin-quality-improvements
status: draft
source_request: >
  Seven findings from a structural self-review of the spec-driven-dev plugin
  (agent-command delegation, quality-rule duplication, /implement completion-
  marking reliability, tag-format documentation consistency, task-list status
  lifecycle, hook documentation accuracy, and missing consistency checks),
  each treated as a single feature.
depends_on: []
---

# Spec-Driven-Dev Plugin Quality Improvements

## Summary

Fix seven concrete, independently verifiable gaps surfaced by a structural review of the spec-driven-dev plugin itself: commands that don't invoke their matching specialist agents, quality rules duplicated across four files instead of one, a completion-marking protocol in `/implement` that depends on the LLM's own carefulness rather than a verifiable check, a tag-format mismatch between documentation and actual output, a task-list `status` field that never reflects completion, a hook whose documented behavior overstates what it does, and no repeatable check that would catch any of the above without another manual review.

## Problem statement

The plugin's design spreads the same behavioral rules across `SKILL.md`, three specialist agent files, three single-artifact commands, two templates, and generated `docs/` artifacts. `BACKLOG.md`'s own history shows that nearly every past change to the pipeline required touching several of these files in lockstep to stay consistent. Nothing in the plugin currently catches it when that lockstep breaks.

A self-review surfaced seven concrete instances of this drift already in the repository: `commands/spec.md`, `commands/plan.md`, and `commands/tasks.md` never invoke the `request-analyst`, `implementation-architect`, and `task-decomposer` agents that exist specifically to do that work, so those agents' investigation depth and self-checks are unused by the primary entry points; the same quality rules (task sizing, tagging scheme) appear near-verbatim in both `SKILL.md` and the agent files; `/implement`'s completion-marking step (`agents/implementation-driver.md` Section 8) asks the LLM to locate a line by hand and verify by character-counting rather than running a check that fails loudly on ambiguity; `agents/implementation-driver.md`'s parsing table documents tags without backticks while `templates/tasks-template.md` and `examples/example-tasks.md` render them with backticks; a fully-completed task list (`docs/tasks/implement-command-tasks.md`) still carries `status: draft` because nothing updates that field on completion; `README.md` calls the guardrail hook a safeguard without noting it only ever fires once per project, not per feature; and none of the above would have been caught except by the manual review that found them.

Left unaddressed, every future change to the pipeline risks the same class of silent drift, and anyone relying on `/implement`'s completion markers is trusting a hand-verified, non-mechanical operation to record ground truth about what has actually been built.

## Goals

- `[G-001]` A developer running any single-artifact command (`/spec`, `/plan`, `/tasks`) or the equivalent `/sdd` stage gets the benefit of that stage's specialist agent, instead of a duplicated inline instruction set.
- `[G-002]` A contributor changing a quality rule (task sizing, tagging scheme, etc.) updates it in one place instead of several.
- `[G-003]` A maintainer running `/implement` can trust that a confirmed task's completion marker is applied correctly and that nothing else in the file is silently altered, without that guarantee resting solely on the LLM's own carefulness.
- `[G-004]` A contributor reading `agents/implementation-driver.md`'s parsing rules sees the same tag format the templates and examples actually produce.
- `[G-005]` A maintainer inspecting a task list's frontmatter can tell whether all tasks are complete without opening the file body.
- `[G-006]` A contributor reading `README.md`'s Hooks section learns the guardrail's real firing behavior, not an idealized one.
- `[G-007]` A contributor who breaks tag-format or agent-delegation consistency finds out automatically — without anyone needing to remember to run a check — rather than from the next manual review.

## Non-goals

- Rewriting the substantive quality content of `SKILL.md` (task sizing thresholds, AC/FR rules, etc.) — only its duplication across files is in scope.
- Building a general-purpose CI/CD pipeline for the plugin. An automatically-triggered check wired into the plugin's own hook mechanism satisfies `[G-007]`; it does not need to run in a hosted CI system.
- Formally documenting the full `status` frontmatter lifecycle (`draft` → `approved` → ...) across all three artifact types — only the task-list-completion transition in `[G-005]` is in scope, pending `[OQ-002]`.
- Changing `/implement`'s human-confirmation UX (confirm/skip prompts) — only the mechanics of *how* a confirmed completion is recorded change.
- Making the guardrail hook per-feature-scoped (e.g., branch- or slug-aware) — default scope is a documentation fix, pending `[OQ-003]`.

## Primary users / actors

- **Plugin maintainer** — runs `/sdd` on this request, approves each stage, and will maintain the plugin going forward. Wants the fixes to be durable, not cosmetic.
- **Downstream plugin users** — developers in other repositories who install `spec-driven-dev` and run `/spec`, `/plan`, `/tasks`, `/implement`. Indirectly affected: get more reliable agent-backed behavior and trustworthy completion tracking once these are fixed. Do not interact with this work directly.
- **Claude Code (the executing LLM)** — non-human actor. It is the "runtime" that reads every command, agent, and skill file addressed here; its behavior is exactly what these files constrain. A fix that isn't legible to this actor (e.g., an instruction it won't reliably follow) doesn't satisfy the goal.

## Use cases

- `[UC-001]` Maintainer runs `/spec <request>`. The command's instructions cause the `request-analyst` agent to be invoked to draft the specification, rather than the command file containing its own duplicate drafting logic. Covers `[G-001]`.
- `[UC-002]` Maintainer runs `/implement` and confirms the last incomplete task in a task list. The task's heading is marked `✓` and the task list's frontmatter `status` field changes to `complete`, with no other line altered. Covers `[G-003]`, `[G-005]`.
- `[UC-003]` (Failure case) Maintainer runs `/implement` on a task list where the target task's heading text cannot be uniquely and exactly matched (e.g., a prior manual edit altered it). The system reports that it could not locate the heading and makes no change to the file, rather than guessing. Covers `[G-003]`.
- `[UC-004]` (Failure/edge case) A future contributor edits `templates/tasks-template.md`'s tag format without updating `agents/implementation-driver.md`'s parsing table. The consistency check fires automatically off that edit — the contributor did not run anything manually — and reports the mismatch by name. Covers `[G-004]`, `[G-007]`.
- `[UC-005]` A future contributor reads `README.md`'s Hooks section and correctly understands, without reading `hooks/hooks.json`, that the guardrail stops firing once any spec exists anywhere under `docs/specs/`, not per feature. Covers `[G-006]`.

## Functional requirements

- `[FR-001]` When a user runs `/spec`, the system generates the specification by invoking the `request-analyst` agent.
- `[FR-002]` When a user runs `/plan`, the system generates the implementation plan by invoking the `implementation-architect` agent.
- `[FR-003]` When a user runs `/tasks`, the system generates the task list by invoking the `task-decomposer` agent.
- `[FR-004]` When `/sdd` executes Stage 1, the system invokes the `request-analyst` agent to generate the spec.
- `[FR-005]` When `/sdd` executes Stage 2, the system invokes the `implementation-architect` agent to generate the plan.
- `[FR-006]` When `/sdd` executes Stage 3, the system invokes the `task-decomposer` agent to generate the task list.
- `[FR-007]` When a command file (`spec.md`, `plan.md`, `tasks.md`, `sdd.md`) or an agent file states a quality rule that also appears in `SKILL.md`, the file references the relevant `SKILL.md` section instead of restating the rule's text.
- `[FR-008]` The `[PREFIX-###]` reference-tagging scheme (prefix table and numbering rule) is defined in full in exactly one file (`SKILL.md`); every other file that needs it links to that section instead of reproducing the table.
- `[FR-009]` When `/implement` marks a task complete, the system verifies that exactly one line in the task list file changed and that the changed line is the exact target task heading before treating the operation as successful.
- `[FR-010]` When the target task heading cannot be uniquely and exactly located in the task list file, the system reports an error naming the task ID and makes no change to the file.
- `[FR-011]` The reference-tag format documented in `agents/implementation-driver.md`'s parsing table matches the delimiter structure (e.g., backtick-wrapping) actually produced by `templates/tasks-template.md` and `examples/example-tasks.md`.
- `[FR-012]` When `/implement` confirms the last incomplete task in a task list, the system sets that task list's frontmatter `status` field to `complete`.
- `[FR-013]` When `/implement` sets a task list's status to `complete`, no frontmatter field or content line other than the status line and the confirmed task's heading is altered.
- `[FR-014]` `README.md`'s Hooks section states that the guardrail hook stops firing once any file exists in `docs/specs/`, not on a per-feature basis.
- `[FR-015]` A check exists that reports a failure when the reference-tag delimiter format documented in `agents/implementation-driver.md` differs from the format used in `templates/tasks-template.md` or `examples/example-tasks.md`.
- `[FR-016]` A check exists that reports a failure when any of `commands/spec.md`, `commands/plan.md`, or `commands/tasks.md` does not reference its corresponding agent file (`request-analyst.md`, `implementation-architect.md`, `task-decomposer.md` respectively).
- `[FR-017]` The checks required by `[FR-015]` and `[FR-016]` run automatically when the files they cover are modified — a maintainer does not need to remember to invoke them manually for the check to fire.

## Non-functional requirements

- `[NFR-001]` The completion-marking mechanism (`[FR-009]`, `[FR-010]`) produces zero unintended file mutations (changes to any line other than the intended target heading and, when applicable, the status line) across every test case exercised by the `[FR-015]`/`[FR-016]` check suite.

## Constraints

- `[CON-001]` Fixes must remain implementable within Claude Code's existing plugin format — markdown commands/agents/skills, and a Node.js-only `hooks.json` — without introducing external services or a hosted CI dependency.
- `[CON-002]` Existing generated artifacts under `docs/` must remain valid: their current frontmatter (including existing `status: draft` and `status: approved` values) must not be broken or require migration by this work.
- `[CON-003]` The guardrail hook must remain cross-platform (Node.js only, no shell-specific syntax), per its existing design.

## Assumptions

- `[ASM-001]` The specialist agent files (`request-analyst.md`, `implementation-architect.md`, `task-decomposer.md`) already contain sufficient behavioral depth that wiring commands to invoke them, rather than rewriting the agents, is sufficient to satisfy `[G-001]`. If this is false for a given agent — its content has drifted behind `SKILL.md`'s current quality bar — that agent's content must be brought up to date as part of this work before the command is wired to invoke it; the plan stage's exploration is where this gets checked, not assumed away.
- `[ASM-002]` `complete` is an acceptable and sufficient new value for the task-list `status` field; no other lifecycle states are required by this work.
- `[ASM-003]` A check wired to run automatically via the plugin's existing hook mechanism (no hosted CI system) satisfies `[G-007]`. A script that only runs when a maintainer remembers to invoke it manually does not satisfy `[G-007]`, since the goal is specifically that a future maintainer without the original history doesn't have to remember.

## Open questions

- `[OQ-001]` `[blocking]` **Resolved:** an actual script/tool, not a documented manual protocol. Decision criteria per maintainer request: durability and token/compute cost.
  - **Script/tool (chosen):** *Durability* — removes the guarantee's dependence on the LLM correctly executing a multi-step prose verification every single time; the check is the same regardless of model quality, context length, or fatigue. This is the actual defect `[G-003]` names, so a fix that still routes through LLM carefulness doesn't fix it. *Cost* — one Bash call to a small Node script that does an exact-line match, write, and post-write line-count diff; cheaper than the manual alternative below. *Trade-off* — one more file to maintain, and it must be kept in sync with the task-list heading format (already true of the prose protocol today).
  - **Manual protocol, strengthened (rejected):** *Durability* — still the same class of failure, only mitigated: correctness still depends on the LLM reading back the file and reasoning about a diff correctly each time. *Cost* — more expensive per operation: requires a pre-edit read, the edit, a post-edit read, and model reasoning to compare them, versus one deterministic script call. *Trade-off* — no new file, more flexible to task-list format drift without code changes.
  - Resolution now feeds `[FR-009]`/`[FR-010]`; the plan stage names this as a technology decision (script location, e.g. under a new `scripts/` directory, invoked by `implementation-driver` via Bash).
- `[OQ-002]` `[advisory]` Should the full `status` frontmatter lifecycle (e.g., `draft` → `approved` → `complete`) be formally documented in `SKILL.md` as part of this work, or is the single completion transition in `[G-005]` sufficient for now? Owner: plugin maintainer.
- `[OQ-003]` `[advisory]` For `[G-006]`, is documenting the hook's real "fires once" limitation sufficient, or should this work also attempt a better-scoped check (e.g., per-slug), despite `BACKLOG.md`'s prior finding that this isn't reliably achievable without stdin parsing? Owner: plugin maintainer.
- `[OQ-004]` `[blocking]` **Resolved:** the underlying concern isn't script location — it's that a manually-run check depends on a future maintainer, who won't have the original history, remembering to run it. A check that only exists to be invoked by hand will eventually go unrun. So the check is wired into the plugin's existing automatic-enforcement surface — `hooks/hooks.json` — as a hook that invokes a script under a new `scripts/` directory (Node.js, consistent with `[CON-001]`/`[CON-003]`), firing on edits to the files it covers, rather than requiring a manually-run command. See `[FR-017]`.

## Acceptance criteria

- `[AC-001]` `covers [FR-001]` — `commands/spec.md` contains an explicit instruction to invoke the `request-analyst` agent to produce the specification.
- `[AC-002]` `covers [FR-002]` — `commands/plan.md` contains an explicit instruction to invoke the `implementation-architect` agent to produce the plan.
- `[AC-003]` `covers [FR-003]` — `commands/tasks.md` contains an explicit instruction to invoke the `task-decomposer` agent to produce the task list.
- `[AC-004]` `covers [FR-004] [FR-005] [FR-006]` — `commands/sdd.md`'s Stage 1, Stage 2, and Stage 3 sections each contain an explicit instruction to invoke `request-analyst`, `implementation-architect`, and `task-decomposer` respectively.
- `[AC-005]` `covers [FR-007]` — A text search for the task-sizing rule paragraph currently duplicated in both `SKILL.md` and `agents/task-decomposer.md` returns exactly one full-text match (in `SKILL.md`); `agents/task-decomposer.md` links to that section instead of reproducing it.
- `[AC-006]` `covers [FR-008]` — A text search for the `[PREFIX-###]` tagging table returns exactly one full reproduction of the table (in `SKILL.md`); other files that reference it link to that section by name.
- `[AC-007]` `covers [FR-009] [FR-010] [NFR-001]` — Given a task list where the target task's heading text cannot be uniquely matched (simulated by a prior manual edit), running `/implement`'s marking step makes zero changes to the file and reports "Could not locate heading line for [T-###]"; given a task list with an unambiguous match, the operation changes exactly the target heading line.
- `[AC-008]` `covers [FR-011]` — The tag-delimiter pattern shown in `agents/implementation-driver.md`'s parsing table (e.g., backtick-wrapped or not) is identical to the literal tag rendering in `templates/tasks-template.md` and `examples/example-tasks.md`.
- `[AC-009]` `covers [FR-012] [FR-013]` — Given a task list with all but one task already marked `✓` and `status: draft`, confirming the last task's validation changes the file's `status:` line to `complete` and the confirmed task's heading to end in ` ✓`; a line-by-line diff shows no other line changed.
- `[AC-010]` `covers [FR-014]` — `README.md`'s Hooks section contains a sentence stating the guardrail stops firing once any file exists in `docs/specs/`, not on a per-feature basis.
- `[AC-011]` `covers [FR-015]` — Editing `templates/tasks-template.md` to remove backticks from one tag occurrence, without running any check by hand, causes a mismatch to be reported automatically off that edit; editing it without introducing a mismatch reports no failure.
- `[AC-012]` `covers [FR-016]` — Removing the agent-invocation instruction from one of `commands/spec.md`, `plan.md`, or `tasks.md`, without running any check by hand, causes that file to be reported automatically as missing its agent reference; editing any of the three without removing the reference reports no failure.
- `[AC-013]` `covers [FR-017]` — Inspecting `hooks/hooks.json` shows the `[FR-015]`/`[FR-016]` checks registered as a hook trigger (not only as a standalone script), so they fire on the relevant file edits without a maintainer invoking a command.
