---
name: engineering-journal
description: Operational invariant for maintaining the PitWall OS Engineering Journal
trigger: always_active
version: 1.0.0
---

# Engineering Journal Invariant & Standard Operating Procedure

## 1. Core Invariant
**No code or architecture changes may be considered complete without a corresponding entry recorded in the Engineering Journal.**

Every feature implementation, refactoring, performance optimization, or bug fix must be systematically documented under `docs/journal/`.

---

## 2. Directory Layout & Numbering Scheme
All entries must reside in `docs/journal/` using three-digit zero-padded sequential IDs:
```text
docs/journal/
├── README.md                          # Master index with summary table
├── 001-project-scaffolding.md         # [ENTRY-001] Initial setup & zero-cost architecture
├── 002-fastf1-ingestion-pipeline.md   # [ENTRY-002] ...
└── ...
```

---

## 3. Entry Document Format
Each journal file `docs/journal/XXX-<slug>.md` MUST adhere to this structure:

```markdown
# [ENTRY-XXX] <Title>

**Date**: YYYY-MM-DD  
**Author**: <Name or Role>  
**Status**: Completed | In Progress | Deprecated  
**Component**: Backend | Frontend | Lakehouse | OTel | Physics  

---

## 1. Objective & Context
Describe what was built or changed and the business/engineering motivation.

## 2. Technical Decisions & Trade-Offs
Detail alternative options considered and the rationale for the selected design (e.g., in-process DuckDB vs external Postgres).

## 3. Files Touched
- `created`: Path to new files
- `modified`: Path to modified files
- `deleted`: Path to deleted files (if any)

## 4. OpenTelemetry & Verification
- Spans added or updated (`span.name`, attributes)
- Metrics emitted (`f1.tire.pressure_psi`, etc.)
- Verification steps (cURL commands, log outputs, test passes)

## 5. Next Steps
Immediate subsequent tasks enabled by this entry.
```

---

## 4. Master Index Maintenance
After creating any entry, the developer or agent MUST update `docs/journal/README.md` to append the entry into the Master Table:

| Entry ID | Date | Component | Summary | Status |
| :--- | :--- | :--- | :--- | :--- |
| `[ENTRY-001]` | 2026-10-31 | Infra / Core | Initial scaffolding, zero-cost architecture rationale, Docker, OTel Collector | Completed |

---

## 5. Git Commit Approval Gate

**MANDATORY**: The agent MUST NEVER run `git commit`, `git push`, or any destructive `git` command (reset, rebase, force-push) without first presenting a commit summary to the user and receiving explicit approval.

### Pre-Commit Checklist (show to user before every commit)
1. **Files staged**: List every file in the diff (`git diff --cached --name-only`)
2. **Commit message**: Show the full proposed conventional-commit message
3. **Impact summary**: One sentence describing what changes and why
4. **Wait for user to respond "approve" / "yes" / "go" or equivalent** before running `git commit`.

### Pre-Push Checklist
1. Show `git log --oneline origin/main..HEAD` (commits to be pushed)
2. Confirm remote URL (`git remote -v`)
3. Wait for explicit user approval before running `git push`.

---

## 6. Bug-Fix & Incident Post-Mortem Protocol
Whenever a bug, broken dependency, runtime exception, or unexpected performance degradation is fixed, the engineer MUST record an incident entry in `docs/journal/BUG-FIXES.md` with:
1. `Incident ID`: `[BUG-XXX]`
2. `Component`: The affected module or service
3. `Symptom`: The exact error message or unexpected behavior
4. `Root Cause Analysis (RCA)`: Technical explanation of why it occurred
5. `Resolution & Code Change`: The exact architectural fix applied
6. `Verification`: Proof of fix (test output or log verification)

