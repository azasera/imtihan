@AGENTS.md

Use `AGENTS.md` as the single source of truth for repository instructions.

## Planora planning documents

Planora creates [.planora/](.planora/) at the project root when
`$planora-product-kit` is invoked. It contains `README.md`, `manifest.json`,
`PRD/`, applicable `UI/` or `DX/` guides, and `EXECUTION/TODO.md`.
Keep these documents in Git. The starter does not include an empty package.
Use `$planora-status` to inspect progress, `$planora-next` to execute one item,
and `$planora-change` to revise the plan. Resolve this project-level package
when working from subdirectories such as `apps/`; follow the location rules
in the Planora skills.
