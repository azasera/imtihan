# Canonical skill authoring

The canonical source follows Open Agent Skills: one kebab-case directory per skill, a required `SKILL.md`, and only the scripts, references, and assets the workflow needs.

## Frontmatter

Canonical `SKILL.md` frontmatter contains portable fields only:

```yaml
---
name: example-skill
description: Perform a specific outcome when the user requests that workflow. Exclude a neighboring workflow when confusion is likely.
---
```

Keep names lowercase, kebab-case, and at most 64 characters. Make descriptions discriminating enough to separate adjacent skills. Store invocation mode, risk, targets, and host metadata in the bundle manifest; adapters add native host fields.

## Instruction quality

- State the outcome, decision points, authorization boundary, and concrete stopping conditions.
- Prefer progressive disclosure: core routing in `SKILL.md`, conditional detail in `references/`, deterministic repetition in `scripts/`.
- Do not restate generic model capabilities or repository policy.
- Use relative links and portable paths. Do not embed credentials, personal machine paths, or undeclared runtime dependencies.
- For mutating work, identify affected systems and require explicit authorization only where the action needs it.

## Scenario contract

Each skill must have at least one positive invocation scenario, one negative-trigger scenario, and one forbidden-action scenario. Scenarios evaluate observable routing or safety behavior, not exact prose.
