---
artifact_type: brief
title: <title>
slug: <slug>
status: draft
source_request: <original request>
depends_on: []
---

# <title>

<!-- Target: one page. No reference IDs. Omit any section that would be empty or obvious.
     If the work is mostly settling decisions so other work can start, the "Decisions" and
     "Contracts" sections are the body of this document and the rest can be a sentence each. -->

## Problem

<!-- Current situation, why it is inadequate, who is affected. No solution language. 2–5 sentences. -->

## Approach

<!-- What will be built or changed, in prose. Ground it in real files/components when a codebase exists. -->

## Decisions

<!-- Separate what is settled from what is not. For each open item: who can answer it, and
     what it blocks. Mark an item [blocking] if answering it differently changes scope or design. -->

**Settled**
- ...

**Open**
- [blocking] ... Owner: ... Blocks: ...
- [advisory] ... Owner: ...

## Contracts

<!-- What must the pieces of work agree on? Data shapes passed between jobs or tickets, API
     boundaries, where shared state lives, what a term like "regressed" means.
     Omit for a single-unit change. If two people or sessions could build against different
     assumptions here, this section is not optional. -->

## Done when

<!-- Testable, pass/fail checks written so someone else could run them. Prefer concrete cases
     ("the 5 red nightly runs group into the 3 known causes") over adjectives. -->

- ...

## Out of scope

<!-- Only things a reader would plausibly assume are included. -->

## Work

<!-- Ordered pieces of work, each with how to tell it is finished. Omit for a single-unit change.
     Each piece should be sized to a reviewable diff (see SKILL.md "Task sizing"). Not a task
     list artifact: no IDs, no dependency fields. Note ordering/dependencies in prose. -->

1. ... — done when ...
