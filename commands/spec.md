---
description: Create a specification markdown artifact from a raw request.
argument-hint: [feature request]
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(mkdir *) Bash(ls *)
---

Use the `spec-driven-dev` workflow to create a specification for this request:

$ARGUMENTS

Requirements:
- Write the output to `docs/specs/<slug>-spec.md`.
- Use the spec template shape from `skills/spec-driven-dev/templates/spec-template.md`.
- If assumptions are required, list them explicitly.
- Do not generate an implementation plan or task list in this command.