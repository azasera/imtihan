# Agent rules

## Think and classify before acting

Before starting any work, use the strongest reasoning capabilities available
and think carefully about the request. Identify and classify the user's intent
in clear, natural language that the user can understand. Determine:

- Whether the request will create or modify Convex backend files.
- Whether the user wants an edit or maintenance task, a new feature, or a bug
  fix.
- Whether the request involves frontend UI or UX design.
- Whether the request requires a third-party integration.

Use this classification to select the correct workflow and skills before taking
action. Keep private chain-of-thought private; communicate only the concise
classification, assumptions, plan, and conclusions needed by the user.

Work as a careful, autonomous coding agent. Infer the user's intent from the
request and repository context, then carry authorized work through validation.
The user's latest explicit instruction takes precedence over these defaults and
over skill guidance.

## Understand before editing

- Read only the repository files and documentation relevant to the request.
- If Git is available, inspect `git status --short`, relevant `git diff` output,
  and `git ls-files` before editing. Treat existing changes as user-owned and
  preserve unrelated work.
- Use `rg` or `rg --files` for codebase discovery when available.
- Distinguish requests to explain, review, or diagnose from requests to change
  code. Do not mutate the repository when the user only asked for analysis.
- Make reasonable, reversible assumptions. Ask only when a missing decision
  would materially change the result or requires new authority.

## Route work through skills

Use the most relevant installed skill whenever the request matches it. Skills
own their detailed workflows; do not reproduce or replace those workflows here.

Skills come first. Honor any skill or slash-command workflow explicitly invoked
by the user, even when automatic intent classification or a rule below would
normally select a different workflow. For example, if the user invokes `/chore`
for a bug fix, use the `chore` workflow for that request. The user's explicit
skill choice takes precedence over automatic routing and repository defaults,
subject only to higher-priority platform and safety instructions. Do not add a
different primary workflow unless the user requests it.

- READ `feature` skills: add or intentionally change product behavior.
- READ `bug` skills: reproduce, diagnose, and repair incorrect behavior.
- READ `chore` skills : maintain, refactor, configure, or edit without intentionally adding
  product behavior.
- READ `e2e-tester` skills: execute browser-based user journeys, either when
  the user explicitly requests it or when a `feature`, `bug`, or `chore` task
  hands off a prepared E2E specification under `specs/e2e/`. Every `feature`
  or `bug` change that adds or modifies a critical user journey must classify
  E2E as `Required`/`Recommended`/`Not needed` and produce that spec as part
  of its own task, per the invoked skill's E2E policy — it must not skip this
  classification silently. A `Required` classification blocks the task from
  being reported as fully validated until E2E is run (immediately when the
  user explicitly asked and browser automation is available, otherwise via a
  handed-off `/e2e-tester` run) — see Testing requirements below.
- For frontend UI work, READ & apply `ui-design` skills during implementation and READ & apply `ui-review` skills
  after the change. Also READ & apply `animate` skills or READ & apply `ask-sonner` skills only when their narrow
  descriptions match.
- For Convex work, apply the relevant bundled `convex` or `convex-*` skill.
- Explicitly invoked workflows remain governed by their own skills.

A specialized skill may complement `feature`, `bug`, or `chore`; it does not
replace the primary workflow. If skill instructions conflict, prefer the skill
that is more specific to the files or operation being performed. Never let a
skill silently broaden the user's requested scope.

## Coding behavior

- Use clean, descriptive names for files, modules, types, functions, variables,
  and other symbols. Names should clearly express intent and make relevant code
  easy for agents and developers to discover with search tools.
- Avoid files longer than 1,000 lines. Before a file reaches that size, split it
  into smaller, cohesive modules with clear responsibilities.
- Organize related code into relevant directories. Put reusable utility
  functions in dedicated utility modules instead of mixing them into feature or
  component files.
- Prefer the simplest readable implementation. If an expression or operation is
  clear in one line, do not expand it into three lines without a readability or
  correctness reason.
- NEVER use emojis in the page design. Use Lucide icons instead.
- NEVER leak technical specification codes (`SCR-*`, `*-FR-*`, `*-AC-*`, `TASK-*`, `Fase *`, internal doc paths `.md`, or wireframe numbers) into user-facing UI text, badges, titles, placeholders, toasts, or end-user documentation. Technical codes belong strictly in tests, code comments, and specification files.
- Always prioritize using shadcn components before creating custom HTML components. 
  Start with shadcn, then customize the design to match the UI rules.

## Testing requirements

Whenever a change creates, edits, or adds behavior in application code, write
or update the tests below before considering the task done. This is mandatory,
not conditional on the user asking for tests explicitly.

- **Unit tests** — always, for any new or changed function, method, or class
  containing logic. Cover the happy path, edge cases (empty/null input,
  boundary values), and error cases (invalid input raises the correct error).
  Mock all external dependencies (DB, network, filesystem, time, randomness).
  Do not write tests that merely re-check TypeScript's compile-time type
  guarantees; focus on logic, not shape.
- **Integration tests** — whenever the change touches a boundary between real
  components: an API endpoint, a database read/write, a call to an external
  service, or a Convex public/internal function crossing module boundaries.
  Exercise the real dependency (test DB, sandbox deployment) rather than
  mocking the thing under test. Cover both the success path and a realistic
  failure path (dependency error, invalid upstream data).
- **E2E tests** — only for critical user journeys (e.g. auth, checkout,
  payment, primary create/submit flows) that are newly added or whose
  behavior changed. Do not add or duplicate E2E coverage for minor/cosmetic
  changes or for journeys already covered by an unchanged E2E spec — verify
  the existing spec still passes instead. Follow the invoked skill's E2E
  policy: classify the need as `Required`/`Recommended`/`Not needed`, and
  when it is not `Not needed`, produce a spec under `specs/e2e/` as a handoff
  for `/e2e-tester` rather than assuming it must run synchronously in the
  same task. A `Required` classification must still be reported as pending
  or blocked, never silently dropped, until it actually runs and passes.

Skip a category only when it does not apply (e.g. a pure `chore` with no
logic or behavior change needs no new tests, just passing existing ones), and
state explicitly in the report which category was skipped and why.

## Execute and validate

- Keep changes scoped. Preserve established architecture and conventions unless
  the request requires changing them.
- Never expose or commit secrets. Avoid destructive operations and do not
  discard changes you did not create.
- Do not commit, push Git changes, deploy to production, publish, purchase, or
  contact external parties unless the user explicitly asks.
- Run the smallest meaningful checks for the changed behavior, then broaden
  only when risk, failures, or repository requirements justify it.
- Never weaken tests or acceptance criteria to make a change pass.
- Do not claim a check, browser journey, or deployment succeeded unless it was
  actually run and observed.
- Report what changed, checks run, checks skipped, and any remaining risk or
  blocker in concise, user-friendly language.

Befor write and change any code. PLAN first!
Create your plan that covers:
Define the problem and desired behavior, in/out scope, evidence, relevant files,
dependency-ordered implementation requirements, measurable acceptance criteria,
risk, compatibility/security/migration considerations, repository-appropriate
validation commands, and documentation expectations. Preserve unrelated work.
Verify the specification is complete and internally consistent, then return only
the created specification path.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`apps/node_modules/next/dist/docs/` before writing any Next.js code. Heed
deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`apps/convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks are already bundled with this repository.
They can be refreshed from `apps/` with `npx convex ai-files install`.

## Convex structure and execution rules

- Always use the relevant `convex` or `convex-*` skill for any request that
  creates, changes, reviews, or otherwise concerns files under `apps/convex/`.
- Organize each primary feature in its own directory under `apps/convex/`. For
  example, project-related backend code belongs in `apps/convex/project/`.
- Within each feature directory, use `public/` and `private/` as the two core
  directories. Keep frontend-facing Convex APIs in `public/`; every such
  function must authenticate the frontend caller and enforce the required
  authorization. Keep internal queries, mutations, actions, helpers, and later
  processing stages in `private/`, exposed through Convex internal functions
  when they are called by public or other private functions.
- Keep public functions short and focused on validation, authentication,
  authorization, and orchestration. For multi-stage or long-running work, have
  the public function call or schedule internal actions for the second and
  subsequent processing stages.
- Framework-required top-level files such as `schema.ts`, `auth.config.ts`,
  `http.ts`, generated files, and shared infrastructure are exceptions to the
  feature-directory convention.

<!-- convex-ai-end -->

<!-- convex-workflow-rules -->

## Convex development rule

Always run the following after finishing any creation or edit of files in
`apps/convex/`. Run it from `apps/` against the user's configured development
deployment:

```bash
npx convex dev --once
```

Do not finish the task until it reports `Convex functions ready!`. If a
development deployment is not configured or cannot be accessed, report Convex
validation as blocked instead of selecting a deployment or using production
without explicit user direction.

<!-- convex-workflow-rules-end -->
## Planora planning documents

Planora creates [.planora/](.planora/) at the project root when
`$planora-product-kit` is invoked. It contains `README.md`, `manifest.json`,
`PRD/`, applicable `UI/` or `DX/` guides, and `EXECUTION/TODO.md`.
Keep these documents in Git. The starter does not include an empty package.
Use `$planora-status` to inspect progress, `$planora-next` to execute one item,
and `$planora-change` to revise the plan. Resolve this project-level package
when working from subdirectories such as `apps/`; follow the location rules
in the Planora skills.
