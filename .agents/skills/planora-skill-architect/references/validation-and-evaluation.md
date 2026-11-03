# Validation and evaluation

Validation covers four layers:

1. Structural: required files, JSON contracts, canonical skill frontmatter, safe names, relative links, manifest synchronization, and hashes.
2. Architectural: unique skill IDs and names, clear triggers, declared invocation mode and risk, sensible policy placement, and no host metadata in canonical sources.
3. Safety: disclosed side effects, no credentials, no unsafe paths or commands, declared dependencies, and explicit boundaries for mutating or external work.
4. Behavioral: positive, negative-trigger, and forbidden-action scenarios for every skill and native output for every certified target. Merely declaring scenarios does not count as evaluation.

Run `scripts/run_scenario_evals.py` with a runner command that executes each case in a fresh host session or equivalent isolated harness. The runner receives one JSON object on stdin and must return one JSON object on stdout containing `passed`, `observed`, and `evidence`. Results are stored in `evals/results.json`. A bundle cannot become `ready` while results are missing, stale, synthetic, or failing.

The deterministic quality score allocates 20 points each to structure and traceability, trigger clarity and decomposition, safety and side effects, portability, and scenario coverage. `ready` requires at least 85 points, no critical findings, all certified adapters passing, no unresolved markers, and no publication blockers.

Always report findings in `reports/quality.md`, compatibility limitations in `reports/compatibility.md`, collisions in `reports/conflicts.md`, and security observations in `reports/security.md`.
