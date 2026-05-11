---
artifact_type: implementation_plan
title: Spec-Driven Development Plugin for Claude Code
slug: plugin-for-claude-code
status: draft
source_request: build a Claude Code plugin that implements a spec-driven development workflow
depends_on:
  - docs/specs/plugin-for-claude-code-spec.md
---

# Spec-Driven Development Plugin for Claude Code Implementation Plan

## Summary

The plugin is a directory of markdown files with YAML frontmatter. There is no build step and no runtime code. Implementation means authoring the correct files in the correct locations, validating their structure, and verifying the plugin loads in Claude Code.

## Scope linkage

Covers FR-1 through FR-10 and NFR-1 through NFR-4 from the spec. OQ-1 (sequence enforcement) resolved as advisory only — the skill includes a note but does not hard-block. OQ-2 (pre-commit hook) deferred. OQ-3 (registry) out of scope.

## Architecture overview

```
spec-driven-dev-plugin/
├── .claude-plugin/
│   └── plugin.json              ← manifest; registers commands, skills, agents, hooks
├── skills/spec-driven-dev/
│   ├── SKILL.md                 ← main workflow skill
│   ├── templates/               ← artifact shape references
│   └── examples/                ← worked examples
├── commands/
│   ├── spec.md                  ← /spec command
│   ├── plan.md                  ← /plan command
│   ├── tasks.md                 ← /tasks command
│   └── sdd.md                   ← /sdd full pipeline command
├── agents/
│   ├── request-analyst.md
│   ├── implementation-architect.md
│   └── task-decomposer.md
├── hooks/
│   └── hooks.json
└── docs/                        ← sample generated artifacts (this plugin's own SDD output)
```

The plugin has no executable code. Claude Code interprets the markdown files directly.

## Components and files affected

| File | Role | Status |
|------|------|--------|
| `.claude-plugin/plugin.json` | Manifest; must declare all commands, skills, agents, hooks | Author |
| `skills/spec-driven-dev/SKILL.md` | Core workflow logic and quality rules | Author |
| `skills/spec-driven-dev/templates/*.md` | Blank artifact scaffolds | Author |
| `skills/spec-driven-dev/examples/*.md` | Representative worked examples | Author |
| `commands/spec.md` | Thin command that invokes the skill for spec only | Author |
| `commands/plan.md` | Thin command that invokes the skill for plan only | Author |
| `commands/tasks.md` | Thin command that invokes the skill for tasks only | Author |
| `commands/sdd.md` | Full pipeline command | Author |
| `agents/request-analyst.md` | Specialist agent for clarifying ambiguous requests | Author |
| `agents/implementation-architect.md` | Specialist agent for plan generation | Author |
| `agents/task-decomposer.md` | Specialist agent for task list generation | Author |
| `hooks/hooks.json` | Hook definitions (advisory, not blocking) | Author |
| `docs/specs/plugin-for-claude-code-spec.md` | Self-referential spec for this plugin | Author |
| `docs/plans/plugin-for-claude-code-plan.md` | This file | Author |
| `docs/tasks/plugin-for-claude-code-tasks.md` | Task list for authoring this plugin | Author |

## Interfaces and contracts

**plugin.json** must include:
- `$schema` pointing to the Claude Code plugin manifest schema.
- `name`, `version`, `description`, `author`.
- `commands` array listing each command file path and its trigger name.
- `skills` array listing the skill directory path.
- `agents` array listing each agent file path.
- `hooks` path to the hooks JSON file.

**SKILL.md frontmatter** must include:
- `name`, `description`, `argument-hint`, `disable-model-invocation`, `allowed-tools`.

**Command frontmatter** must include:
- `description`, `argument-hint`, `disable-model-invocation`, `allowed-tools`.

**Artifact frontmatter** (generated output) must include:
- `artifact_type`, `title`, `slug`, `status`, `source_request`, `depends_on`.

## Data flow

1. User invokes a command (e.g., `/spec-driven-dev:spec add widget dashboard`).
2. Claude Code loads the command file, reads its body as the prompt.
3. The prompt references the `spec-driven-dev` skill via the skill name or direct file reference.
4. The skill's `SKILL.md` provides generation rules and quality requirements.
5. Claude generates the artifact and writes it to `docs/specs/<slug>-spec.md`.
6. For `/sdd`, steps repeat for plan and tasks in sequence, each reading the previous artifact.

## Error handling

- If a referenced spec or plan file does not exist when `/plan` or `/tasks` is run, the skill surfaces this as an open question rather than generating a broken artifact.
- If the `docs/` subdirectory does not exist, the skill creates it via `Bash(mkdir *)` (listed in `allowed-tools`).
- Malformed user requests result in a spec with populated `## Open questions` rather than a failed generation.

## Testing and validation

- **Load test**: run `claude --plugin-dir ./spec-driven-dev-plugin` and verify no load errors.
- **Command smoke test**: run each of the four commands with a simple request; verify output files are created at correct paths with valid frontmatter.
- **Template conformance**: manually compare each generated artifact against its template to verify all sections are present.
- **Example review**: read all three example files and verify they match the template shapes and contain plausible, well-formed content.
- **Cross-reference check**: verify `depends_on` fields in plan and tasks point to real files in `docs/`.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| plugin.json schema mismatch causes load failure | Medium | Plugin won't load | Validate against schema during authoring; test load early |
| Skill prompt too long or ambiguous causes poor artifact quality | Medium | Artifacts don't match templates | Write clear, section-by-section generation rules; include examples |
| `allowed-tools` list missing a needed tool | Low | Command fails mid-execution | Test each command end-to-end; add tools as discovered |
| Examples diverge from templates over time | Low | Confusion for new users | Treat examples as living documents; update when templates change |

## Delivery sequence

1. Author and validate `plugin.json` manifest with all registrations.
2. Author `SKILL.md` with full generation rules and quality requirements.
3. Author all three templates.
4. Author all three worked examples (spec, plan, tasks for a concrete feature).
5. Author four command files (`spec`, `plan`, `tasks`, `sdd`).
6. Author three agent files.
7. Author `hooks.json`.
8. Author `docs/` self-referential artifacts (spec, plan, tasks for this plugin).
9. Load test and command smoke tests.
10. Write `README.md` with usage instructions.
