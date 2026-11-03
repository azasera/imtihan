# E2E: App Branding & Logo Display

- Source: User request to update App name and logo to E-Imtihan At-Tauhid
- Recommendation: Recommended
- Status: Pending
- Environment: local Next.js development server
- Base URL: http://localhost:3000
- Last updated: 2026-10-28

## Prerequisites

- Start the application with `npm run dev` (or `npm --prefix apps run dev:web`).
- Access via standard browser.

## Scenarios

1. Public Header Branding
   - Actions: Navigate to `/` as an unauthenticated visitor.
   - Expected: Header displays the logo image (`/logo.png`) and "E-Imtihan At-Tauhid" text branding.
2. Document Title & Favicon
   - Actions: Inspect page `<title>` and `<link rel="icon">`.
   - Expected: Document title is "E-Imtihan At-Tauhid", favicon reflects the new logo.
3. Authenticated Sidebar Branding
   - Actions: Log in and view the sidebar header.
   - Expected: Sidebar header displays the logo image and "E-Imtihan At-Tauhid".
4. Main Page Content
   - Actions: View `/`.
   - Expected: Heading displays "E-Imtihan At-Tauhid".

## Evidence

- Result: Pending
- Tested at: Pending
- Scenario evidence: Pending
- Failures or blockers: None
