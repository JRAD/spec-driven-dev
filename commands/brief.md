---
description: Write a one-page brief (problem, approach, decisions, contracts, done-when) for small or single-concern work, or for settling decisions so other work can start.
argument-hint: [request]
allowed-tools: Read Write Edit Glob Grep Bash(mkdir *) Bash(ls *) Bash(find *) Bash(git log *) Bash(git status *)
---

Write a one-page brief for this request:

$ARGUMENTS

This is the quick tier of the spec-driven-dev workflow (see the "Tiers" section of `skills/spec-driven-dev/SKILL.md`). It produces one file, with no reference IDs and no separate plan or task list.

## Steps

1. **Ground it.** If a codebase exists, read the areas the request touches with Glob/Grep/Read. Every file or component you name in the brief must be one you found. If the request is greenfield, say so and name the open stack decisions instead of assuming them.

2. **Find what must be agreed.** Before writing, ask: if two people (or sessions) built different parts of this independently, what would they have to agree on? Data shapes, API boundaries, where shared state lives, definitions of key terms, who owns each unresolved question. Put the answers in **Contracts** and **Decisions**. This step is the main reason the brief exists; do not skip it for multi-part work.

3. **Write** `docs/briefs/<slug>-brief.md` using the shape of `skills/spec-driven-dev/templates/brief-template.md`. Derive the slug from the request title. Omit sections that would be empty or obvious. Keep it to roughly one page.

4. **Check it before presenting:**
   - Could someone other than you verify each **Done when** item, without asking you anything?
   - Is every open decision named with an owner and a `[blocking]`/`[advisory]` classification?
   - If the work has multiple pieces, is every shared data shape or definition in **Contracts**?
   - Does the brief name only files and components you actually found?

5. **Escalate if it doesn't fit.** If the brief has several blocking questions you cannot narrow, or the scope clearly exceeds one page, say so and recommend `/sdd --full` with the brief as the source request, rather than stretching the brief.

6. **Checkpoint.** Report the file path and present any blocking decisions by name. Ask: "Reply **approve** to proceed, or give feedback to revise." After approval, the work can be implemented directly from the brief, split into tickets by the user, or promoted to the full tier. Do not file tickets or start implementation unless the user asks.
