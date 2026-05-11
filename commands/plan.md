---
description: Create an implementation plan from a specification, grounded in the existing codebase or in explicit decisions for new projects.
argument-hint: [spec path]
disable-model-invocation: true
allowed-tools: Read Write Edit MultiEdit Glob Grep Bash(ls *) Bash(find *) Bash(mkdir *)
---

Create an implementation plan from this spec:

$ARGUMENTS

Follow these steps in order. Do not skip steps.

## Step 1 — Read the spec

Read the referenced spec file. Extract:
- The feature or system being built
- Known constraints (language, framework, deployment target, data model restrictions)
- Any technology decisions already captured in the spec

## Step 2 — Assess the codebase

Determine whether an existing codebase is present.

Run these probes:
- `Glob("**/{package.json,Gemfile,go.mod,requirements.txt,Cargo.toml,pom.xml,*.csproj,pyproject.toml}")` — project definition files
- `Glob("src/**/*", "app/**/*", "lib/**/*")` — common source roots

**If source files are found (existing project):**

Explore before designing. Identify the areas of the system the spec touches — auth, data model, API surface, UI, background jobs, etc. — then for each area:
- Glob for likely file locations
- Grep for relevant symbols, types, patterns, or conventions already in use
- Find analogous existing features — similar things already built are the strongest signal for how to build the new thing
- Note the frameworks, naming conventions, and structural patterns in use

Record what you found. Every component reference in the plan must come from this exploration.

**If no source files are found (new project):**

Check the spec for technology constraints or preferences. Then determine:
- Is the stack (language, framework, deployment target) specified or inferable? If not, these are blocking decisions that must be listed explicitly in the plan — not assumed silently.
- What initial directory structure is consistent with the spec's constraints and the inferred or decided stack?
- Are there external dependencies (databases, APIs, auth providers) implied by the spec that need to be decided?

Design the project structure as part of the plan, not as a silent assumption.

## Step 3 — Generate the plan

Write the output to `docs/plans/<slug>-plan.md`. Use the plan template from `skills/spec-driven-dev/templates/plan-template.md`.

Requirements for all plans:
- Every entry in "Components and files affected" must carry one of these tags:
  - `[exists]` — confirmed present via Glob or Grep
  - `[new]` — to be created as part of this work
  - `[assumed]` — could not be confirmed; explain why in a note
- Avoid `[assumed]` wherever possible. If a path cannot be confirmed, investigate further before tagging it assumed.
- Technology decisions not captured in the spec must appear in the plan as explicit named decisions, not silent defaults.
- Do not generate the task list in this command.