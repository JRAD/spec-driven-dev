---
description: Create a task list markdown artifact from an implementation plan.
argument-hint: [plan path]
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(ls *) Bash(find *)
---

Create a task list from this implementation plan input:

$ARGUMENTS

Requirements:
- Read the referenced implementation plan.
- Write the output to `docs/tasks/<slug>-tasks.md`.
- Use the task template shape from `skills/spec-driven-dev/templates/tasks-template.md`.
- Break work into logical, ordered chunks with dependencies and validation.