# Policy boundaries

Generate repository instruction files only when a rule must apply to ordinary work even when no skill is invoked. Examples include stable source-of-truth paths, mandatory security boundaries, or repository-wide validation commands.

Do not put step-by-step procedures, one feature's acceptance criteria, optional workflows, tool tutorials, or temporary project state in policy. Those belong in skills, task artifacts, or a live work ledger.

`source/policy.yaml` is canonical. Use this shape:

```yaml
version: "1.0"
rules:
  - id: policy-001
    statement: "A concise repository-wide invariant."
    rationale: "Why ordinary work must always follow it."
    source: "confirmed-user-input"
```

Adapters render managed sections for `AGENTS.md` and `CLAUDE.md`. The installer must preserve all text outside its own bundle markers.
