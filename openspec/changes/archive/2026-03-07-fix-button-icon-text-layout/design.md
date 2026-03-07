# Design: Fix Button Icon + Text Layout

## Context

The `FantasyButton` component (`components/ui/FantasyButton.tsx`)
uses `inline-flex items-center` on the outer `<motion.button>`,
which correctly establishes a flex container. However, children
are wrapped in a plain `<span>` (line 108) that doesn't enforce
horizontal layout. When children contain an SVG icon element
followed by text, the icon renders as a block-level element
within the span, causing it to stack above the text.

This affects any button where icons are passed as part of
`children` rather than via the `icon` prop. The most visible
case is the auth form's "Enter Realm" / "Join Guild" /
"Found Guild" buttons in `AuthForm.tsx`.

## Goals / Non-Goals

**Goals:**

- Icon and text within FantasyButton children always render
  on a single horizontal line
- Fix works for all button sizes (sm, md, lg)
- No changes to the FantasyButton props API

**Non-Goals:**

- Refactoring AuthForm to use the `icon` prop instead of
  inline children (that's a separate cleanup)
- Changing button sizing or padding behavior

## Decisions

### Add `inline-flex items-center` to the children span

**Choice**: Add `inline-flex items-center` classes to the
`<span>` wrapper around `{children}` on line 108 of
`FantasyButton.tsx`.

**Rationale**: The outer button is already a flex container
with `gap-2`. The children span just needs to also be a
flex container so its internal icon + text stay horizontal.
`inline-flex` keeps it as an inline-level flex container
within the outer button's flex layout, and `items-center`
vertically aligns the icon with the text.

**Alternative considered**: Remove the `<span>` wrapper
entirely and render `{children}` directly. Rejected because
the span serves as a consistent wrapper that pairs with the
loading spinner and icon spans for predictable flex behavior.

**Alternative considered**: Refactor all call sites to use
the `icon` prop. Rejected as unnecessarily broad — the
component should handle mixed children gracefully regardless.

## Risks / Trade-offs

- **Low risk**: Adding flex to the children span could
  affect buttons with complex multi-element children.
  Mitigated by the fact that all current usages are simple
  icon + text patterns.
- **No migration needed**: This is a one-line CSS class
  change with no API impact.
