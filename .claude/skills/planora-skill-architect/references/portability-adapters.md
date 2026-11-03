# Portability adapters

## Certified v1 targets

- Codex: `.agents/skills/<name>/SKILL.md`; invocation UI metadata may use `agents/openai.yaml`; repository policy uses `AGENTS.md`.
- Antigravity: `.agents/skills/<name>/SKILL.md`; repository policy uses `AGENTS.md`.
- Claude Code: `.claude/skills/<name>/SKILL.md`; repository policy uses `CLAUDE.md`; explicit invocation is represented with Claude-specific frontmatter.

Canonical invocation modes are `explicit`, `implicit`, and `both`. Adapters map them to the closest native mechanism and record any semantic gap in `reports/compatibility.md`. Do not claim certification when a required permission or invocation behavior cannot be represented.

Certification in v1 is scoped to format, structure, and generated adapter output. It does not claim identical model behavior. Record invocation gaps explicitly, especially implicit-only Codex skills and explicit-only Antigravity skills.

Install one host adapter at a time with `install_skill_bundle.py --agent <host>`. Use `--agent all` only when the destination intentionally supports every generated host layout.

Host-specific fields belong only under `targets/`. Never copy Codex `agents/openai.yaml` or Claude-only frontmatter into `source/skills/`.
