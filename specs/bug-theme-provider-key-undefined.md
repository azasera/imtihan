# Specification: Bug Fix - ThemeProvider KeyboardEvent Key Undefined TypeError

## Problem & Desired Behavior
- **Problem**: When a `keydown` event is dispatched where `event.key` is undefined or null (such as certain virtual keyboards, autofill, IME composition events, or synthetic/legacy browser events), `onKeyDown` in `ThemeHotkey` calls `event.key.toLowerCase()`, triggering `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`.
- **Desired Behavior**: The handler should safely check whether `event.key` is defined before attempting to call `toLowerCase()`. If `event.key` is nullish or not "d"/"D", it should simply return early without throwing an unhandled runtime error.

## Scope
- **In Scope**:
  - `apps/components/theme-provider.tsx`: Add null/undefined-safe access on `event.key` (`!event.key || event.key.toLowerCase() !== "d"`).
  - `apps/tests/theme-provider.test.ts`: Add a unit test verifying safe handling when `key` is undefined or null.
- **Out of Scope**:
  - Convex backend files.
  - Changes to other components or theme provider props.

## Evidence & Relevant Files
- `apps/components/theme-provider.tsx`: Line 50 contains `if (event.key.toLowerCase() !== "d")`.
- Stack trace provided: `TypeError: Cannot read properties of undefined (reading 'toLowerCase') at onKeyDown (components/theme-provider.tsx:50:21)`.

## Implementation Requirements (Dependency-Ordered)
1. Update `apps/components/theme-provider.tsx` to safely verify `event.key` using null-safe check (`if (!event.key || event.key.toLowerCase() !== "d")`).
2. Add unit regression test in `apps/tests/theme-provider.test.ts`.
3. Run test suites (`npm --prefix apps run test`) to verify all tests pass.

## Measurable Acceptance Criteria
- `onKeyDown` handles an event where `event.key` is `undefined` without throwing any TypeError.
- The "d" hotkey functionality for toggling dark/light mode remains intact when `event.key` is "d" or "D".
- All unit and leakage tests in `apps/tests/` pass cleanly.

## Risk & Compatibility
- **Risk**: Low. Safe optional checking is backward-compatible with all standard and non-standard browser events.
- **Compatibility**: Compatible with React 19, Next.js 16.3.5.

## Validation Commands
- `npm --prefix apps run test`
