# Bundle output contract

`.SKILLS/` is the canonical source and preview package. Keep `manifest.json`, `intake.json`, `evals/scenarios.json`, compiled targets, and file hashes synchronized.

## Skill declaration

Every `manifest.json.skills` entry requires:

```json
{
  "id": "stable-skill-id",
  "name": "skill-directory-name",
  "source": "source/skills/skill-directory-name",
  "invocationMode": "explicit",
  "riskClass": "mutating",
  "sideEffects": ["Files or systems affected"],
  "dependencies": []
}
```

Use `read-only`, `mutating`, or `high-risk` for risk. Mutating and high-risk skills must also contain a `## Side effects` or `## Dampak` section in `SKILL.md`.

Each intake capability references a declared stable skill ID and repeats its invocation mode and risk class. Each skill has positive, negative-trigger, and forbidden-action cases in `evals/scenarios.json`.

## Behavioral runner protocol

The evaluator launches the trusted runner separately for every target and scenario. It sends a JSON object on stdin containing the target, skill path, isolated workspace, scenario kind, and scenario. The runner returns exactly one JSON object on stdout:

```json
{
  "passed": true,
  "observed": "What the host actually did",
  "evidence": "Trace, artifact, assertion, or run identifier"
}
```

Only use a runner the user or repository trusts: the command executes locally with the current user's permissions. Evaluation results are fingerprinted against scenarios, declarations, and compiled skills; any relevant revision makes them stale.

## Installation

Install one adapter with `--agent codex`, `--agent claude`, or `--agent antigravity`. `--agent all` is an explicit request to install every native layout in the same repository. Dry-run remains the default behavior when `--apply` is absent.

## Upload package

A `.skill` artifact is a ZIP archive with a `.skill` extension. It contains exactly one skill directory at its root:

```text
skill-name.skill
└── skill-name/
    ├── SKILL.md
    ├── scripts/
    ├── references/
    ├── assets/
    └── agents/        # only when used by the selected host adapter
```

Package from a compiled target so host-specific invocation metadata is preserved. Runtime packages exclude tests, bytecode, caches, and hidden temporary files by default. Never place the entire `.SKILLS/` workspace inside a `.skill` upload artifact.
