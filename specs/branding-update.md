# Specification: App Branding Update (E-Imtihan At-Tauhid)

## Problem & Desired Behavior
The application currently uses template placeholder branding ("Planora", generic icon).
The desired behavior is to update the application branding to "E-Imtihan At-Tauhid" and integrate the official logo image (`E-Imtihan At-Tauhid Logo.png`) across the site configuration, application layout, metadata, header, sidebar, homepage, and favicon/app icon.

## Scope
- **In Scope:**
  - Copying the logo asset `E-Imtihan At-Tauhid Logo.png` to `apps/public/logo.png`, `apps/public/planora-logo.png`, and `apps/app/icon.png`.
  - Updating `apps/lib/site-config.ts` to set `name: "E-Imtihan At-Tauhid"` and an appropriate description.
  - Updating `apps/components/site-header.tsx` to render the logo image alongside the application name.
  - Updating `apps/components/app-sidebar.tsx` to render the logo image in the sidebar header.
  - Updating `apps/app/(main)/page.tsx` home heading to "E-Imtihan At-Tauhid".
  - Running automated tests (`npm --prefix apps run test`) to ensure no regressions or UI spec leakages.
- **Out of Scope:**
  - Modifying Convex backend tables, schemas, or authentication logic.
  - Modifying TCExam legacy PHP files.

## Evidence & Affected Files
- `d:\DATA\PROJEK\IMTIHAN\E-Imtihan At-Tauhid Logo.png` (source logo image)
- `apps/lib/site-config.ts`
- `apps/components/site-header.tsx`
- `apps/components/app-sidebar.tsx`
- `apps/app/(main)/page.tsx`
- `apps/public/logo.png`
- `apps/public/planora-logo.png`
- `apps/app/icon.png`

## Implementation Tasks (Dependency-Ordered)
1. Copy `E-Imtihan At-Tauhid Logo.png` to `apps/public/logo.png`, `apps/public/planora-logo.png`, and `apps/app/icon.png`.
2. Update `apps/lib/site-config.ts` to set the new name and description.
3. Update `apps/components/site-header.tsx` to use the image logo.
4. Update `apps/components/app-sidebar.tsx` to use the image logo.
5. Update `apps/app/(main)/page.tsx` heading.
6. Run testing and validation scripts.

## Measurable Acceptance Criteria
- `siteConfig.name` returns `"E-Imtihan At-Tauhid"`.
- Browser title (`metadata.title` via `apps/app/layout.tsx`) reflects `"E-Imtihan At-Tauhid"`.
- `apps/public/logo.png` and `apps/app/icon.png` exist with the contents of `E-Imtihan At-Tauhid Logo.png`.
- Header and sidebar display the logo image and brand name cleanly.
- `npm --prefix apps run test` passes without errors or UI leakages.

## Risk & Compatibility
- **Risk:** Missing image import or improper sizing in Next.js Image component.
  - *Mitigation:* Explicit width/height with Tailwind object-contain sizing.
- **Compatibility:** No breaking API or database schema changes.

## Validation Commands
- `npm --prefix apps run test`
