---
name: new-task
description: "Scaffold a new task file in tasks/ using the project's task template. Use when: creating a new task, adding a task to the backlog, planning new feature work."
---

Scaffold a new task file for the Planymaps project.

**Task number:** ${input:taskNumber:e.g. 0029}
**Task title:** ${input:taskTitle:e.g. Comment Threads}
**Phase (1–7):** ${input:phase:see tasks/PHASES.md}
**Depends on (task IDs or 'none'):** ${input:dependsOn:e.g. T-0020, T-0021}
**One-sentence description:** ${input:description}

---

Create the file at `tasks/T-${input:taskNumber}-${input:taskSlug}.md` using the structure from [tasks/REFERENCE-sample-task-note.md](../tasks/REFERENCE-sample-task-note.md).

The file must include these sections:

```
# T-{NUMBER} — {Title}

## Status
pending | in-progress | done

## Phase
{phase number and name}

## Objective
{One paragraph describing what this task achieves and why it matters to the product.}

## Dependencies
- List of T-XXXX task IDs this task depends on

## Scope
- Bullet list of concrete deliverables included in this task

## Out of Scope
- Bullet list of related work explicitly NOT part of this task

## Deliverables
- Files to create or modify
- Docs to update (if architecture changes)

## Validation Steps
1. Step-by-step manual or automated verification
2. Run `pnpm lint && pnpm typecheck` before marking done

## Result Notes
<!-- Filled in when the task is completed. Record unresolved issues, design decisions, follow-up tasks. -->
```

After creating the task file, add a line to the correct phase section in [tasks/INDEX.md](../tasks/INDEX.md):

```
- [ ] [T-{NUMBER} — {Title}](T-{NUMBER}-{slug}.md)
```
