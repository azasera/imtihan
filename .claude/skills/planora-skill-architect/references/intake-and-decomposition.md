# Intake and decomposition

## Intake ledger

Capture these fields before authoring:

- Facts: directly supplied or verified repository facts.
- Assumptions: plausible but unconfirmed choices, each with impact.
- Decisions: confirmed choices and their rationale.
- Open questions: only unresolved choices that can materially change the result.
- Required tools: local commands, APIs, MCP servers, applications, or credentials.
- Side effects: files, repositories, accounts, deployments, or people affected.
- Target agents: certified hosts and any best-effort targets.

Ask at most three questions in one round. Prefer questions about authorization, irreversible effects, trigger boundaries, output contract, and target environments. Do not ask about details that repository inspection can answer safely.

## Capability classification

Classify every requested capability:

| Class | Typical placement |
| --- | --- |
| Repository invariant | `source/policy.yaml` |
| Reusable knowledge | Skill reference or concise `SKILL.md` guidance |
| Read-only workflow | Separate skill when independently useful |
| Mutating workflow | Separate skill with disclosed effects |
| High-risk or external workflow | Explicit-only skill with authorization boundary |
| Deterministic automation | Script called by the relevant skill |

Create separate skills when any of these materially differ: trigger, permission, risk, inputs and outputs, lifecycle, required tools, or stopping condition. Merge capabilities only when users naturally request them together and their sources and side effects are the same.

Assign stable skill IDs. Preserve them during revision unless the capability itself is removed or fundamentally redefined.
