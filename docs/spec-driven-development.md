# Spec-Driven Development with Spec Kit

This project uses **[GitHub Spec Kit](https://github.com/github/spec-kit)** so specifications stay the source of truth and agents (and humans) implement against them—not chat memory.

## One-minute mental model

```text
Constitution  →  Spec  →  Plan  →  Tasks  →  Implement  →  Verify against Spec
   (rules)      (what)   (how)   (steps)     (code)         (tests + acceptance)
```

**Never** invent product behavior in code first. Change the spec (or tasks), then implement.

## Prerequisites

| Tool | Why |
| ---- | --- |
| [Cursor](https://cursor.com) | Spec Kit skills live in `.cursor/skills/speckit-*` |
| Node ≥ 22 + Yarn 1 | App/toolchain (after implementation starts) |
| [uv](https://docs.astral.sh/uv/) + `specify-cli` | Optional — re-init or upgrade Spec Kit |

Install / upgrade Spec Kit CLI (already used once in this repo):

```bash
uv tool install specify-cli
# ensure ~/.local/bin (or equivalent) is on PATH
specify --version
```

## Where things live

| Artifact | Path | Purpose |
| -------- | ---- | ------- |
| Constitution | `.specify/memory/constitution.md` | Dual north star, SDD, TDD, SOLID, non-goals |
| Feature folder | `specs/001-quest-deck/` | One feature’s full package |
| → Spec | `specs/001-quest-deck/spec.md` | User stories, FRs, success criteria |
| → Plan | `specs/001-quest-deck/plan.md` | Stack, structure, constitution check |
| → Tasks | `specs/001-quest-deck/tasks.md` | Ordered checkboxes (T001…) |
| → Data model | `specs/001-quest-deck/data-model.md` | Entities + XP/streak formulas |
| → Contract | `specs/001-quest-deck/contracts/rest-api.md` | HTTP API |
| → Research | `specs/001-quest-deck/research.md` | Why we chose this approach |
| Templates / scripts | `.specify/templates/`, `.specify/scripts/` | Spec Kit internals — don’t hand-edit unless customizing |

## Cursor skills (slash commands)

In Cursor Agent chat, use the Spec Kit skills (names may appear as `/speckit-…`):

| Skill | When to use |
| ----- | ----------- |
| `/speckit-constitution` | Change project-wide principles |
| `/speckit-specify` | New feature or rewrite requirements (what/why) |
| `/speckit-clarify` | Optional — resolve ambiguity before planning |
| `/speckit-plan` | Tech stack & architecture from the spec |
| `/speckit-tasks` | Break plan into implementable tasks |
| `/speckit-analyze` | Optional — consistency check before coding |
| `/speckit-checklist` | Optional — quality checklist for the spec |
| `/speckit-implement` | Execute tasks in order |
| `/speckit-converge` | After partial builds — find remaining work vs spec |
| `/speckit-taskstoissues` | Optional — push tasks to GitHub Issues |

You can also ask the agent in plain language: *“Implement the next unchecked task in `specs/001-quest-deck/tasks.md` following the constitution.”*

## Day-to-day: implement the current MVP

Quest Deck week-1 is already specified. You do **not** need to re-run specify/plan unless requirements change.

1. Read [constitution](../.specify/memory/constitution.md) (dual north star).
2. Skim [spec.md](../specs/001-quest-deck/spec.md) acceptance scenarios.
3. Open [tasks.md](../specs/001-quest-deck/tasks.md) and work **T001 → T026** in order (respect phase gates).
4. Prefer TDD where tasks say “write failing test first.”
5. After a chunk of work, verify against the spec’s **Acceptance Scenarios** and **Success Criteria**—not only “tests pass.”
6. Commit only when you (the human) ask to commit.

**Execution options**

- Cursor: `/speckit-implement`  
- Or: Superpowers-style subagent/inline execution against `tasks.md` (allowed by the constitution)

## Day-to-day: change behavior safely

Example: “Add a fourth seed deck.”

1. Update `specs/001-quest-deck/spec.md` (FR + seed assumptions) and `data-model.md` if needed.
2. Update `tasks.md` with new checkboxes (or run `/speckit-tasks` / `/speckit-converge`).
3. Implement and test.
4. Do **not** only edit seed code and leave the spec stale.

## Day-to-day: start a new feature (Phase 2+)

```powershell
# From repo root (PowerShell scripts ship with Spec Kit)
& .\.specify\scripts\powershell\create-new-feature.ps1 -ShortName "streak-freeze" "Add optional streak freeze for missed days"
```

Then in Cursor:

1. `/speckit-specify` — fill `specs/00N-…/spec.md`  
2. `/speckit-plan` — `plan.md`  
3. `/speckit-tasks` — `tasks.md`  
4. Optional `/speckit-analyze`  
5. `/speckit-implement`

Keep Phase 2 ideas aligned with the constitution’s **out of MVP** list until you intentionally promote them.

## CLI cheat sheet

```bash
specify --help
specify check
specify self check
specify self upgrade
```

Re-init in an existing repo (rare; already done):

```bash
specify init --here --force --integration cursor-agent --script ps --ignore-agent-tools
```

## Relationship to earlier drafts

Earlier Superpowers brainstorming docs were migrated into Spec Kit (`specs/001-quest-deck/`) and removed. Spec Kit artifacts are the only source of truth.

## Troubleshooting

| Problem | What to do |
| ------- | ---------- |
| Agent invents features | Point it at constitution + `spec.md`; reject out-of-scope work |
| `specify` not found | Add `uv` tool bin to PATH (`~/.local/bin` on many setups) |
| Skills missing in Cursor | Confirm `.cursor/skills/speckit-*` exists; reopen agent |
| Spec drift after coding | Run `/speckit-converge` or manually sync `spec.md` / `tasks.md` |

## Further reading

- [GitHub Spec Kit README](https://github.com/github/spec-kit)  
- [Using Quest Deck](./using-quest-deck.md) (product usage)  
- [Docs index](./README.md)  
