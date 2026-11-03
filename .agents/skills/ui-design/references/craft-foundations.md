# UI craft foundations

Use these as quality gates after the product's own design contract. When a rule
conflicts with an approved identity or explicit user direction, the approved
direction wins.

## Identity and color

- Map colors to semantic roles before writing component styles.
- Apply 60:30:10 as visual hierarchy: approximately 60% dominant canvas, 30%
  supporting surfaces or regions, and 10% accent and primary-action emphasis.
- Keep status colors semantic and focus indicators visible even when they sit
  outside the ratio.
- Use one recognizable accent deliberately. Do not distribute it across every
  icon, badge, heading, and button.
- Prefer tokens over repeated literal values.

## Hierarchy and composition

- Give every screen one clear purpose, focal point, and primary action.
- Use spacing, alignment, type, and grouping before adding containers.
- A card must communicate grouping, selection, or elevation; do not wrap every
  block in an identical rounded rectangle.
- Vary composition only when content roles differ. Repeated product patterns
  should remain predictable.
- Avoid the default AI composition: centered gradient headline, two generic
  calls to action, three equal feature cards, floating decorative badges, and a
  dashboard-shaped illustration with invented data.

## Typography and content

- Follow approved type roles and use a restrained scale with readable line
  lengths. Do not introduce a novelty font for one emphasized word.
- Use sentence case unless the brand contract says otherwise.
- Write specific interface copy. Avoid empty claims such as "seamless",
  "elevate", "unlock", and "next-generation" unless they are verified product
  language.
- Do not invent testimonials, metrics, customers, or product screenshots.

## Components and states

- Prefer accessible primitives already present in the repository.
- Keep variants tied to meaning: primary, secondary, destructive, quiet, or
  contextual—not arbitrary visual variety.
- Design default, hover, focus-visible, active, disabled, loading, empty, error,
  and success states when the component can reach them.
- Maintain consistent control height, icon treatment, radius logic, and focus
  behavior across a flow.

## Responsive and accessible behavior

- Define how every multi-column or dense region changes below its useful
  breakpoint. Do not rely on accidental wrapping.
- Prevent horizontal overflow and preserve logical reading order.
- Keep touch targets usable, labels associated with controls, keyboard focus
  visible, and important meaning independent of color alone.
- Use `min-height: 100dvh` rather than rigid mobile `100vh` where a full-height
  surface is required.

## Imagery and motion

- Use imagery only when it carries product, instructional, emotional, or brand
  value. Image generation is a plan decision, never automatic because a tool is
  available.
- Do not construct a fake screenshot to imply nonexistent functionality.
- Motion must provide feedback, spatial continuity, state explanation, or
  relief from a jarring change. Frequently repeated actions deserve little or
  no motion.
- Respect reduced-motion preferences and avoid layout-triggering animation.
