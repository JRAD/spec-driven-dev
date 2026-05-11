---
artifact_type: task_list
title: Spec-Driven Development Plugin for Claude Code
slug: plugin-for-claude-code
status: draft
source_request: build a Claude Code plugin that implements a spec-driven development workflow
depends_on:
  - docs/plans/plugin-for-claude-code-plan.md
---

# Spec-Driven Development Plugin for Claude Code Task List

## Phase 1 — Plugin manifest and skill core

### Task 1.1 — Author and validate plugin.json
- Objective: Create a valid `plugin.json` manifest that registers all commands, the skill, agents, and hooks.
- Dependencies: none
- Work: Write `.claude-plugin/plugin.json` with `$schema`, `name`, `version`, `description`, `author`, `commands`, `skills`, `agents`, and `hooks` fields. Validate against the Claude Code plugin schema.
- Validation: `claude --plugin-dir ./spec-driven-dev-plugin` loads without manifest errors.
- Done when: Plugin loads cleanly; all registered paths exist or are stubs.

### Task 1.2 — Author SKILL.md
- Objective: Write the core `spec-driven-dev` skill with full generation rules, quality requirements, and tool permissions.
- Dependencies: Task 1.1
- Work: Write `skills/spec-driven-dev/SKILL.md` with correct frontmatter (`name`, `description`, `argument-hint`, `disable-model-invocation`, `allowed-tools`). Include artifact flow rules, output locations, quality rules for each artifact type, generation rules for frontmatter and ambiguity handling, and links to templates and examples.
- Validation: Skill is listed and loadable via the plugin. Frontmatter parses without errors.
- Done when: SKILL.md is complete, passes a manual review against the spec's FR-7 and quality rules.

**Phase 1 definition of done:** Plugin loads. Skill is registered. Manifest is valid.

---

## Phase 2 — Templates and examples

### Task 2.1 — Author three artifact templates
- Objective: Provide blank scaffolds for spec, plan, and task list that define the required section structure.
- Dependencies: Task 1.2 (SKILL.md references them)
- Work: Write `templates/spec-template.md`, `templates/plan-template.md`, and `templates/tasks-template.md`. Each must include correct frontmatter fields as placeholders and all required section headings from the SKILL.md quality rules.
- Validation: Compare each template against the corresponding quality rules section in SKILL.md; all required headings present.
- Done when: All three templates pass the section checklist; no required heading is missing.

### Task 2.2 — Author three worked examples
- Objective: Provide fully populated example artifacts for a concrete feature so new users can calibrate output quality.
- Dependencies: Task 2.1 (templates define the shape)
- Work: Write `examples/example-spec.md`, `examples/example-plan.md`, and `examples/example-tasks.md` for a realistic feature (e.g., bulk invoice export). Each must be complete — no placeholder text — and must conform to its template's section structure and frontmatter contract.
- Validation: Each example has all template sections filled with plausible content. `depends_on` in example-plan points to example-spec; example-tasks points to example-plan.
- Done when: All three examples pass manual review; cross-references are consistent.

**Phase 2 definition of done:** Templates and examples are complete, internally consistent, and linked correctly.

---

## Phase 3 — Commands and agents

### Task 3.1 — Author four command files
- Objective: Provide the `/spec`, `/plan`, `/tasks`, and `/sdd` commands as thin wrappers over the skill.
- Dependencies: Task 1.2
- Work: Write `commands/spec.md`, `commands/plan.md`, `commands/tasks.md`, and `commands/sdd.md`. Each must include `description`, `argument-hint`, `disable-model-invocation`, and `allowed-tools` frontmatter. Body must direct Claude to use the `spec-driven-dev` skill and enforce artifact sequencing (spec only, plan only, tasks only, or full pipeline).
- Validation: Each command invocation writes the correct artifact to the correct path. Running `/sdd` produces all three artifacts in sequence.
- Done when: All four commands produce correct output in a smoke test; no command generates artifacts outside its stated scope.

### Task 3.2 — Author three agent files
- Objective: Provide specialist agent definitions for request analysis, architecture planning, and task decomposition.
- Dependencies: Task 1.1 (must be registered in manifest)
- Work: Write `agents/request-analyst.md`, `agents/implementation-architect.md`, and `agents/task-decomposer.md`. Each must define the agent's role, input, output, and constraints in the body. Frontmatter must include `name`, `description`, and `allowed-tools`.
- Validation: Agents are listed in the plugin and loadable. Each agent's description clearly differentiates its role from the others.
- Done when: All three agent files have valid frontmatter and non-trivial body content.

**Phase 3 definition of done:** All commands and agents are authored, registered, and smoke-tested.

---

## Phase 4 — Hooks and docs

### Task 4.1 — Author hooks.json
- Objective: Define advisory hooks that reinforce the spec-driven workflow without blocking normal operation.
- Dependencies: Task 1.1
- Work: Write `hooks/hooks.json` with at least one hook (e.g., a reminder when writing to `docs/tasks/` that a spec and plan should exist). Hooks must be advisory — they warn but do not prevent the action.
- Validation: Hook file is valid JSON. Hook fires in a test scenario without error.
- Done when: `hooks.json` is valid and at least one hook is defined with a clear advisory message.

### Task 4.2 — Verify docs/ self-referential artifacts
- Objective: Confirm that `docs/specs/`, `docs/plans/`, and `docs/tasks/` contain the plugin's own SDD artifacts and that they are internally consistent.
- Dependencies: All prior tasks
- Work: Review `docs/specs/plugin-for-claude-code-spec.md`, `docs/plans/plugin-for-claude-code-plan.md`, and `docs/tasks/plugin-for-claude-code-tasks.md`. Verify frontmatter cross-references are correct, all sections are filled, and content reflects the actual plugin as built.
- Validation: `depends_on` in plan points to spec; `depends_on` in tasks points to plan. All acceptance criteria from the spec are traceable through the plan and tasks.
- Done when: All three docs artifacts are accurate, complete, and cross-referenced correctly.

**Phase 4 definition of done:** Hooks are defined. Self-referential docs are complete and accurate. Plugin is fully authored.

---

## Phase 5 — Final validation

### Task 5.1 — End-to-end load and smoke test
- Objective: Verify the plugin loads cleanly and all four commands produce correct output.
- Dependencies: All prior tasks
- Work: Run `claude --plugin-dir ./spec-driven-dev-plugin`. Invoke `/spec-driven-dev:spec`, `/spec-driven-dev:plan`, `/spec-driven-dev:tasks`, and `/spec-driven-dev:sdd` with a simple test request. Verify output file paths, frontmatter fields, and section completeness.
- Validation: All four commands succeed. Output files exist at correct paths. Frontmatter includes all required fields. No load errors.
- Done when: All acceptance criteria AC-1 through AC-7 from the spec are verified.

**Phase 5 definition of done:** Plugin is verified end-to-end. All spec acceptance criteria are met. Ready to distribute.
