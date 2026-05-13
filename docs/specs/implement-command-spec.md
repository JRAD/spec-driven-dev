---
artifact_type: spec
title: Task-Driven Implementation Command
slug: implement-command
status: approved
source_request: add a feature to this plugin that will work on implementing the project by following the task list and using the other artifacts to guide development
depends_on: []
---

# Task-Driven Implementation Command

## Summary

A new `/implement` command for the spec-driven-dev plugin that reads a project's task list and linked artifacts (plan and spec) and drives Claude Code through implementation, batching independent tasks for concurrent execution and gating each task's completion on human confirmation.

## Problem statement

The spec-driven-dev plugin currently stops at the task list. A developer who has run the full `/sdd` pipeline has a spec, plan, and task list — but no structured way to use those artifacts during implementation. They must manually cross-reference three markdown files while coding, keep mental track of which tasks are complete, and decide on their own when a task's validation criteria have been satisfied. The artifacts that were generated to guide development are not actually connected to the development process.

## Goals

- `[G-001]` Developers can start implementing a project by invoking one command that loads all relevant artifact context automatically.
- `[G-002]` Each task is implemented with its full context visible — objective, work instructions, validation steps, referenced plan components, and linked spec acceptance criteria.
- `[G-003]` Progress through the task list is tracked durably within the task list file itself so any developer can see current status at a glance.
- `[G-004]` Developers retain control over implementation pace: no individual task is marked complete without human confirmation.
- `[G-005]` Phase boundaries receive explicit acknowledgment so teams can checkpoint and validate before moving forward.
- `[G-006]` Independent tasks within a phase are implemented concurrently in a single work session rather than sequentially, reducing unnecessary round-trips for work that has no ordering constraint.

## Non-goals

- Automatic sequential execution through all tasks without human checkpoints.
- Automatically invoking the project's test runner or linter as part of task validation — deferred to a future version. The command will guide the developer on what to validate; they run it themselves. When the future version ships, it should auto-detect the project's existing runner (`package.json` scripts, `Makefile` targets, `pytest.ini`, etc.) rather than introducing its own.
- Modifying or regenerating spec, plan, or task list artifacts based on implementation discoveries — deferred to a future version. If implementation reveals a gap in the spec or plan, the developer should use `/spec` or `/plan` to address it. A future version could offer to surface discovered issues as new open questions or trigger a `/spec-review`.
- Integration with external project management or issue tracking systems.
- Parallel execution across phases: tasks in different phases are always sequential; the command does not execute Phase 2 tasks while Phase 1 tasks remain incomplete.
- True concurrent process execution: parallel batching happens within a single Claude Code work session, not across multiple simultaneous Claude processes or sessions.

## Primary users / actors

- **Developer with a completed task list** — has run `/sdd` or `/spec` + `/plan` + `/tasks`; is ready to begin implementation and wants Claude Code to do the coding while using the artifacts as the authoritative guide.
- **Team lead reviewing progress** — reads the task list file to see which tasks are complete without running any command; relies on the in-file progress markers being accurate and human-readable.

## Use cases

- `[UC-001]` Developer runs `/implement` in a project directory with a single task list in `docs/tasks/`. The command auto-discovers the task list, loads the linked plan and spec, identifies the first incomplete task, and implements it. After implementation, the developer confirms the task is done and the command marks it complete in the file. The developer approves continuing to the next task.
- `[UC-002]` Developer runs `/implement docs/tasks/widget-dashboard-tasks.md` to target a specific task list when multiple exist. The command loads that file and resumes from the first incomplete task.
- `[UC-003]` Developer runs `/implement` in a project with multiple task lists in `docs/tasks/`. The command lists the available files and asks the developer to select one before proceeding.
- `[UC-004]` Developer runs `/implement` after completing three of ten tasks in a previous session. The command skips the three already-marked tasks and resumes from task four.
- `[UC-005]` Developer completes the last task in Phase 1. The command displays the Phase 1 definition-of-done summary and confirms with the developer before loading Phase 2's first task.
- `[UC-006]` Developer runs `/implement` in a project where all tasks are already marked complete. The command reports full completion and exits without modifying any files.
- `[UC-007]` Phase 2 contains tasks T2.1 (no dependencies), T2.2 (no dependencies), and T2.3 (depends on T2.1). The command identifies T2.1 and T2.2 as an independent batch, announces them, implements both in one work session, then asks the developer to confirm each separately. Once both are confirmed, the command evaluates the ready set again and presents T2.3 (now unblocked by T2.1's completion) as a sequential task.

## Functional requirements

- `[FR-001]` When a user invokes `/implement [optional-task-list-path]` and provides a path, the command loads the task list at that path.
- `[FR-002]` When a user invokes `/implement` without a path and exactly one `.md` file exists in `docs/tasks/`, the command loads that file automatically.
- `[FR-003]` When a user invokes `/implement` without a path and multiple `.md` files exist in `docs/tasks/`, the command presents a numbered list of available files and waits for the user to select one before proceeding.
- `[FR-004]` When the task list is loaded, the command reads the `depends_on` frontmatter to locate and load the implementation plan; it then reads the plan's `depends_on` to locate and load the spec.
- `[FR-005]` When the command identifies the next incomplete task, it presents to the user: the task's objective, work description, validation steps, any `[COMP-###]` and `[INTF-###]` references from the plan, and any `[AC-###]` references from the spec.
- `[FR-006]` When implementing a task, the command uses the loaded spec, plan, and task details as authoritative context and does not generate or infer requirements beyond what those artifacts describe.
- `[FR-007]` When the implementation work for a task is complete and the user confirms the validation steps are satisfied, the command adds a completion marker to the task heading in the task list file.
- `[FR-008]` After marking a task complete, the command displays the count of completed and remaining tasks in the current phase and overall, then asks whether to proceed to the next task.
- `[FR-009]` When the last task in a phase is marked complete, the command displays that phase's definition-of-done text (the "Phase N definition of done:" summary from the task list) before asking whether to continue to the next phase.
- `[FR-010]` When all tasks in the task list are already marked complete, the command outputs a completion summary and exits without modifying any files.
- `[FR-011]` When a task list path is provided but the file does not exist, the command reports the missing file and exits without attempting implementation.
- `[FR-012]` When a `depends_on` link in the task list or plan points to a file that does not exist, the command reports the missing artifact and asks the user whether to continue without that context or abort.
- `[FR-013]` When determining the next work unit within a phase, the command identifies all tasks whose `Dependencies:` field either is empty or lists only task IDs already marked complete — this set is the current execution batch.
- `[FR-014]` When the current execution batch contains more than one task, the command announces the batch (listing all task titles and count), implements all tasks in the batch within a single work session, then presents each task's validation steps individually for per-task human confirmation.
- `[FR-015]` When the current execution batch contains exactly one task, the command implements it and confirms it following the behavior described in FR-005 through FR-008.
- `[FR-016]` When a developer declines validation for a task in a parallel batch, the command does not mark that task complete; it marks the other confirmed tasks complete, then re-evaluates the ready set — the declined task re-enters the batch if its dependencies are still satisfied.

## Non-functional requirements

- `[NFR-001]` The command file must load in Claude Code without errors; a project directory containing at least one task list in `docs/tasks/` with valid frontmatter must be sufficient for the command to start.
- `[NFR-002]` Completion markers written to the task list must be valid GitHub-Flavored Markdown and must not alter any content in the file other than the targeted task heading line.

## Constraints

- `[CON-001]` The command file must use the same YAML frontmatter format (`description`, `argument-hint`, `disable-model-invocation`, `allowed-tools`) used by all other commands in the plugin.
- `[CON-002]` Progress tracking must be stored as in-file markers within the task list markdown file; no separate state files, databases, or external services may be introduced.
- `[CON-003]` The command must not modify spec or plan artifacts; those files are read-only inputs to the implementation process.
- `[CON-004]` The command must not regenerate or overwrite task list content other than adding completion markers to task headings.

## Assumptions

- `[ASM-001]` Task lists generated by this plugin follow the structure in `tasks-template.md`: phases with `## Phase N` headings, tasks with `### Task N.M — Title` sub-headings, and a `**Phase N definition of done:**` summary at the end of each phase.
- `[ASM-002]` The `depends_on` frontmatter in the task list points to the plan file, and the plan's `depends_on` points to the spec file, forming a complete traceability chain the command can follow.
- `[ASM-003]` Developers understand that validation is self-assessed: the command guides Claude to perform the implementation and describe what to verify, but a human confirms the criteria before the task is marked done.
- `[ASM-004]` The codebase being implemented resides in the working directory where the `docs/` artifacts directory is located.
- `[ASM-005]` A task heading with ` ✓` appended (e.g., `### Task 1.1 — Title ✓`) is sufficient as a completion marker that humans can read and the command can detect.
- `[ASM-006]` Task `Dependencies:` fields list zero or more `[T-###]` reference IDs from the same task list, and those IDs are the sole basis for dependency resolution; the command does not infer dependencies from task content or ordering.

## Open questions

- `[OQ-001]` `[advisory]` What completion marker format should be used — appending ` ✓` to the task heading, adding `- [x]` checkboxes, or a `status: done` block within the task body? Owner: plugin author.
- `[OQ-002]` `[advisory]` Should the command support targeting a specific task by number (e.g., `/implement docs/tasks/foo-tasks.md --from 2.3`) to allow jumping to a task after manual edits? Owner: plugin author.
- `[OQ-003]` `[advisory]` Should an `implementation-driver` specialist agent be added alongside the command, following the pattern of `request-analyst`, `implementation-architect`, and `task-decomposer`? Owner: plugin author.

## Acceptance criteria

- `[AC-001]` `covers [FR-001], [FR-002]` Running `/implement` in a project directory containing exactly one task list in `docs/tasks/` starts the command without error and displays the first incomplete task with its objective, work, validation, and artifact references.
- `[AC-002]` `covers [FR-003]` Running `/implement` in a project with two or more task list files in `docs/tasks/` presents a numbered list of those files and does not begin implementation until the user selects one.
- `[AC-003]` `covers [FR-004]` After loading the task list, the command correctly resolves and loads the linked plan and spec by following `depends_on` frontmatter links.
- `[AC-004]` `covers [FR-005], [FR-006]` The task context presented to the user includes the task's objective, work description, validation steps, and any cited `[COMP-###]`, `[INTF-###]`, and `[AC-###]` references resolved to their full text from the linked artifacts.
- `[AC-005]` `covers [FR-007]` After the user confirms a task is complete, the task list file is updated with a completion marker on the task heading; all other file content is unchanged.
- `[AC-006]` `covers [FR-008]` After each individual task confirmation (whether from a sequential or parallel batch), the command displays "X of Y tasks complete in Phase N (Z tasks remain overall)" and asks whether to proceed.
- `[AC-007]` `covers [FR-009]` When the last task in a phase completes, the command displays that phase's definition-of-done text before asking whether to advance to the next phase.
- `[AC-008]` `covers [FR-010]` Running `/implement` when all tasks are already marked complete outputs "All tasks complete — [task list title]" and makes no changes to any file.
- `[AC-009]` `covers [FR-011]` Running `/implement path/that/does/not/exist.md` outputs an error message naming the missing file and exits without modifying any files.
- `[AC-010]` `covers [FR-012]` When a `depends_on` link points to a missing artifact, the command reports which artifact is missing and asks the user whether to continue without that context.
- `[AC-011]` `covers [FR-013], [FR-014]` Given a phase with tasks T1 (no dependencies), T2 (no dependencies), and T3 (depends on T1): the command identifies T1 and T2 as the first execution batch, announces "2 tasks can be implemented together: T1, T2", implements both in one work session, then asks for per-task validation confirmation for T1 and T2 before presenting T3.
- `[AC-012]` `covers [FR-016]` When a developer confirms T1 but declines T2 in a parallel batch: T1 is marked complete, T2 is not; the command re-evaluates the ready set and presents T2 again (still unblocked) in the next cycle.
