# Persistent E2E specs

This directory stores browser-validation handoffs that must survive across chat
sessions and coding-agent hosts. Implementation workflows create one semantic
Markdown file per work item when E2E is required or recommended.

Use this structure:

```markdown
# E2E: <target>

- Source: <task, issue, requirement, or request>
- Recommendation: Required | Recommended
- Status: Pending | Passed | Failed | Blocked
- Environment: local | development
- Base URL: <URL or pending>
- Last updated: YYYY-MM-DD

## Prerequisites

- <browser, account, fixture, or setup>

## Scenarios

1. <scenario name>
   - Actions: <observable browser actions>
   - Expected: <observable result>

## Evidence

- Pending.
```

Run a spec with:

```text
/e2e-tester specs/e2e/<file>.md
```

The E2E tester updates the status and appends evidence. Do not store passwords,
tokens, session cookies, or personal customer data in these files.
