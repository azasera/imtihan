---
name: ui-review
description: Review a material frontend change against its existing UI contract, responsive behavior, accessibility, interaction states, and anti-generic craft standards. Use after UI implementation or for an explicit design audit; report findings without silently redesigning the product.
---

# UI Review

Provide an evidence-based review of implemented UI. This is a review workflow,
not authority to change product identity or acceptance criteria.

## Review inputs

1. Read repository rules, the task or diff, and the applicable design source.
2. In a Planora package, trace the target to `.planora/UI/` and its referenced
   PRD requirements.
3. Inspect changed files and representative shared tokens/components. Use Git
   status and staged/unstaged diffs when available; do not review unrelated UI.
4. If browser capability is available and the app can run safely, inspect the
   affected surface at one representative desktop and mobile viewport. This is
   visual QA, not browser E2E.

## Review order

1. Product fidelity: required content, behavior, hierarchy, and screen purpose.
2. Identity fidelity: semantic colors, 60:30:10 hierarchy, typography, density,
   shape, elevation, imagery, and motion.
3. Interaction completeness: focus, hover, active, disabled, loading, empty,
   error, success, keyboard, and recovery behavior.
4. Responsive behavior: reflow, reading order, overflow, touch targets, and
   navigation at narrow widths.
5. Accessibility: semantics, labels, focus visibility, contrast risks, reduced
   motion, and color-independent meaning. Do not claim formal compliance from
   visual inspection alone.
6. Craft: remove unsupported AI defaults, decoration without purpose, repeated
   card shells, invented proof, vague copy, and inconsistent primitives.
   - Technical Spec Leakage: Pastikan tidak ada screen ID (`SCR-*`), PRD requirement codes (`*-FR-*`, `*-AC-*`, `*-NFR-*`), nomor tugas (`TASK-*`), nomor fase (`Fase *`), nomor wireframe (seperti `1. `), atau path markdown internal (`*.md`) yang bocor ke teks UI, badge, placeholder, toast, modal, atau panduan pengguna.

## Findings

Report only actionable findings, ordered by impact:

- `Blocker`: breaks a requirement, primary task, access, or critical viewport.
- `High`: materially contradicts the approved UI identity or key interaction.
- `Medium`: visible inconsistency, incomplete state, or meaningful craft issue.
- `Low`: localized polish with low user impact.

Each finding must include file and line when available, observed evidence,
expected behavior or design source, and the smallest appropriate correction.
Separate browser-observed evidence from code inference.

Close with one verdict: `ready`, `ready with residual findings`, or `not ready`.
When used inside an implementation workflow, that workflow may fix in-scope
findings and rerun one bounded review. Do not start an open-ended polish loop.
If user-journey validation is needed, create or preserve the separate E2E
handoff required by repository policy.
