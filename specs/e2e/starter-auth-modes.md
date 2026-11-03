# E2E: Starter authentication modes

- Source: starter template authentication configuration
- Recommendation: Recommended
- Status: Pending
- Environment: local Next.js app with a personal Convex development deployment
- Browser: host agent browser capability; do not use Playwright or Cypress

## Prerequisites

- Complete `npm run setup` and confirm `npx convex dev --once` succeeds.
- Use a dedicated test email address and a non-production Google OAuth client.
- Start the application with `npm run dev` and use `http://localhost:3000`.
- Run each mode with matching public flags and Convex deployment flags, then
  restart the local app between modes.

## Scenarios

1. Google plus email/password
   - Set both authentication methods to enabled.
   - Open `/login` and `/signup`.
   - Confirm the Google action and email/password form are both visible.
   - Create an email/password account, sign out, then sign in again.
   - Sign in with Google and confirm the protected account page loads.
2. Email/password only
   - Disable Google and enable email/password on both frontend and backend.
   - Confirm no Google action is rendered on `/login` or `/signup`.
   - Create an account, sign out, sign in, and reach the protected account page.
3. Google only
   - Enable Google and disable email/password on both frontend and backend.
   - Confirm the email/password form is absent on `/login` and `/signup`.
   - Sign in with Google and reach the protected account page.
4. Access protection
   - While signed out, open `/account` and confirm the app redirects to login.
   - While signed in, open `/login` and `/signup` and confirm the app redirects
     away from authentication pages.
5. Browser health
   - During every scenario, confirm there are no unexpected browser-console or
     backend errors.

## Evidence

- Result: Pending
- Tested at: Pending
- Scenario evidence: Pending
- Failures or blockers: Convex development deployment is not configured in the
  clean starter workspace.
