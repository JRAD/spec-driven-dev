---
description: Create a task list from an implementation plan with sized tasks, explicit dependencies, and runnable validation steps.
argument-hint: [plan path]
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(mkdir *) Bash(ls *)
---

Create a task list from this implementation plan:

$ARGUMENTS

Follow these steps in order. Do not skip steps.

## Step 1 — Read the plan

Read the referenced plan file. Extract:
- The phases and delivery sequence
- The components and files affected, including their `[exists]`/`[new]`/`[assumed]` tags
- The risks identified and the order in which they should be tested
- The interfaces and contracts between components

Also read the source spec (via the plan's `depends_on` frontmatter) to extract the acceptance criteria. Each task's validation step should map to one or more ACs.

## Step 2 — Design the phase structure

Map the plan's delivery sequence to task phases. Each phase must end with a working, testable system state — not "scaffolding in place" but something a developer can actually verify runs. The riskiest assumption in the plan should be tested in Phase 1, not deferred.

Before writing any tasks, sketch the phase boundaries and what is demonstrably working at each one.

## Step 3 — Write the tasks

Write the output to `docs/tasks/<slug>-tasks.md`. Use the task template from `skills/spec-driven-dev/templates/tasks-template.md`.

Apply these rules to every task:

**Sizing**
- One task = one focused coding session or one PR. If a task spans independently-failable areas or its done-criteria contains "and" connecting two distinct outcomes, split it.
- If a task's validation is trivially obvious or it can be merged into an adjacent task without losing clarity, merge it.

**Dependencies**
- List every dependency explicitly by task number. There are no implicit dependencies.
- Tasks within the same phase must be parallelizable unless a dependency is stated.
- Check: if a developer completed only the listed dependencies, would they have everything needed to start this task?

**Validation steps**
- Write each validation step specifically enough that a developer who didn't write the task could run it without asking questions.
- Name the file, command, endpoint, or observable behavior — not just "tests pass."
- Each validation should map to an acceptance criterion from the spec. Note which AC it covers.

**Done-criteria**
- State a condition, not an activity. "Implement X" is an activity. "X passes all unit tests and is wired into Y; no existing tests broken" is a condition.
- Must be verifiable by someone other than the task author.

**Phase definition of done**
- Close every phase with a `**Phase N definition of done:**` line that names the testable system state at that boundary.
