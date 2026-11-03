---
description: Create an implementation plan from a specification, grounded in the existing codebase or in explicit decisions for new projects.
argument-hint: [spec path]
allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(ls *) Bash(find *) Bash(mkdir *) Agent
---

Invoke the `spec-driven-dev:implementation-architect` agent (via the Agent tool) to create an implementation plan from this spec:

$ARGUMENTS

Pass the agent a prompt that includes:
- The spec path above, verbatim.
- The requirement to explore the codebase (or identify greenfield decisions) before designing, per the agent's own instructions.
- The requirement to write the output to `docs/plans/<slug>-plan.md` using the shape of `skills/spec-driven-dev/templates/plan-template.md`, tagging every "Components and files affected" entry `[exists]`, `[new]`, or `[assumed]`.
- The scope boundary: generate the plan only — do not generate the task list.

Once the agent returns, report the plan's file path to the user. Do not perform the exploration or drafting yourself — if the agent invocation fails or the agent reports it cannot proceed, report that failure and stop rather than drafting the plan directly.