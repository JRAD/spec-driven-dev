---
description: Create a task list from an implementation plan with sized tasks, explicit dependencies, and runnable validation steps.
argument-hint: [plan path]
allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(mkdir *) Bash(ls *) Agent
---

Invoke the `spec-driven-dev:task-decomposer` agent (via the Agent tool) to create a task list from this implementation plan:

$ARGUMENTS

Pass the agent a prompt that includes:
- The plan path above, verbatim.
- The requirement to also read the plan's source spec (via its `depends_on` frontmatter) to extract acceptance criteria for validation-step mapping.
- The requirement to write the output to `docs/tasks/<slug>-tasks.md` using the shape of `skills/spec-driven-dev/templates/tasks-template.md`.

Once the agent returns, report the task list's file path to the user. Do not perform the decomposition yourself — if the agent invocation fails or the agent reports it cannot proceed, report that failure and stop rather than drafting the task list directly.
