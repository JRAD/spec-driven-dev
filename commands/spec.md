---
description: Create a specification markdown artifact from a raw request.
argument-hint: [feature request]
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(mkdir *) Bash(ls *) Agent
---

Invoke the `spec-driven-dev:request-analyst` agent (via the Agent tool) to create a specification for this request:

$ARGUMENTS

Pass the agent a prompt that includes:
- The raw request above, verbatim.
- The requirement to write the output to `docs/specs/<slug>-spec.md` using the shape of `skills/spec-driven-dev/templates/spec-template.md`.
- The requirement to list any required assumptions explicitly.
- The scope boundary: generate the specification only — do not generate an implementation plan or task list.

Once the agent returns, report the spec's file path to the user. Do not perform the drafting yourself — if the agent invocation fails or the agent reports it cannot proceed, report that failure and stop rather than drafting the spec directly.