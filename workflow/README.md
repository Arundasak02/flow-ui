# Workflow Operating Guide (PO + Dev + UI Visual Expert + QA)

## Roles

- PO owns `vision.md` + `acceptance-criteria.md`
- Dev owns code changes + `dev-report.md`
- UI Visual Expert owns `ui-visual-review.md`
- QA owns `qa-report.md` + `defects/`
- Orchestrator enforces gates

## Iteration loop

1. PO updates vision and criteria.
2. Dev implements only approved criteria IDs.
3. UI Visual Expert reviews first-impression clarity and vision alignment.
4. QA validates each criterion and records defects.
5. PO reviews UI + QA outcomes and signs off.

## Gate command

```bash
bash /Users/home/IdeaProjects/flow-agent-orchestrator/scripts/check-gates.sh /Users/home/IdeaProjects/flow-ui
```

If gate is not READY, iteration cannot be closed.

## One-command automated cycle

```bash
npm run workflow:cycle
```

This command:
- runs Playwright visual checks,
- writes `qa-report.md`,
- writes `ui-visual-review.md`,
- runs orchestrator gate check,
- appends cycle status to `iteration-log.md`.

