---
name: planora-skill-architect
description: Design one or more portable agent skills from a user's workflow, separate optional procedures from repository-wide policy, and produce a validated multi-host preview bundle. Use only when explicitly invoked to architect or revise a skill bundle.
---

# Planora Skill Architect

Turn a workflow or knowledge need into a portable, reviewable skill bundle at `.SKILLS/`. Do not install the generated bundle unless the user separately requests apply.

## Workflow

1. Inspect the request, attachments, repository instructions, existing skills, relevant scripts, and agent configuration. Preserve unrelated worktree changes.
2. Read [intake and decomposition](references/intake-and-decomposition.md). Maintain a ledger of facts, assumptions, decisions, open questions, required tools, side effects, and target agents.
3. Ask no more than three high-impact questions per round. Start generation after the user confirms the summary or explicitly accepts a draft with open assumptions.
4. Classify each capability as repository invariant, reusable knowledge, read-only workflow, mutating workflow, high-risk or external workflow, or deterministic automation. Split capabilities when triggers, permissions, risks, inputs and outputs, or lifecycle differ.
5. Read [canonical authoring](references/canonical-authoring.md) before authoring source skills. Read [policy boundaries](references/policy-boundaries.md) only when repository-wide rules may be required.
6. Read [output contract](references/output-contract.md). Run `scripts/scaffold_skill_bundle.py`, replace the draft source with product-specific content, update the manifest, intake ledger, and scenarios, then run `scripts/compile_targets.py`.
7. Read [validation and evaluation](references/validation-and-evaluation.md), run the scenario evaluator with a real host-capable runner, then run the validator and repair all critical findings. Read [portability adapters](references/portability-adapters.md) when a target needs host-specific behavior.
8. Export each uploadable skill with `scripts/package_skill.py`. Present the `.skill` artifact and `.SKILLS/install-plan.json` preview. Run `scripts/install_skill_bundle.py --apply` only after an explicit apply request.

## Non-negotiable constraints

- Use `.SKILLS/` as the static canonical and preview directory. It is not an auto-discovery location.
- Certify only Codex, Claude Code, and Antigravity in v1. Label other adapters best-effort.
- Keep host-specific metadata out of `source/`.
- Generate `policy.yaml` and instruction files only for rules that must govern ordinary repository work continuously. Keep task procedures in skills.
- Record unconfirmed claims as assumptions. Never invent tools, permissions, commercial facts, author identity, or licensing terms.
- Default an unknown license to `UNLICENSED` and keep the bundle blocked from publish-ready status.
- Declare mutations, external effects, credentials, dependencies, and stopping conditions.
- Refuse unsafe paths, unmanaged overwrites, and conflicting skill names during install.

## Commands

```text
python scripts/scaffold_skill_bundle.py --name <name> --output <repository> --locale id-ID
python scripts/compile_targets.py <repository>/.SKILLS --targets codex,claude,antigravity
python scripts/run_scenario_evals.py <repository>/.SKILLS --runner <runner-command-and-arguments>
python scripts/validate_skill_bundle.py <repository>/.SKILLS
python scripts/package_skill.py <repository>/.SKILLS --agent codex --skill <skill-name> --output <repository>
python scripts/install_skill_bundle.py <repository>/.SKILLS --target <repository> --agent codex --dry-run
```

The default language follows the user's request and otherwise uses Bahasa Indonesia.

## Side effects

- Creates or revises `.SKILLS/` in the selected repository.
- `--apply` may add native skill directories and managed instruction blocks to a target repository, but only after explicit user authorization and successful preflight.
