---
name: Modal design refresh
overview: Align SheepDetailModal, SettingsModal, and Guide with the rounded, pastel card design of SheepListModal, and improve responsiveness across screen sizes.
todos:
  - id: refactor-modal-structure
    content: Refactor JSX layout/classes to match SheepListModal feel
    status: completed
  - id: add-modal-styles
    content: Add CSS for modal header/tabs/buttons/forms
    status: completed
  - id: responsive-tuning
    content: Add responsive rules for widths and button layout
    status: completed
  - id: align-settings-guide
    content: Update SettingsModal/Guide markup to shared styles
    status: completed
  - id: mobile-no-scroll
    content: Prevent main UI scroll on mobile to avoid black space
    status: completed
  - id: modal-accessibility
    content: Add ESC-to-close and focus handling for modals
    status: completed
  - id: button-standardization
    content: Standardize modal button styles and remove inline styles
    status: completed
  - id: hook-fix
    content: Fix useGame hook misuse in SettingsModal
    status: completed
isProject: false
---

# Modal design refresh plan

## Context

- Update modals in `[sheep-care-game/src/components/SheepDetailModal.jsx](sheep-care-game/src/components/SheepDetailModal.jsx)`, `[sheep-care-game/src/components/SettingsModal.jsx](sheep-care-game/src/components/SettingsModal.jsx)`, and `[sheep-care-game/src/components/Guide.jsx](sheep-care-game/src/components/Guide.jsx)` using the visual language from `[Shepherd-main/src/components/SheepListModal.tsx](Shepherd-main/src/components/SheepListModal.tsx)` (rounded card, soft header bar, pill tabs, soft borders, button styling).
- Add CSS in `[sheep-care-game/src/App.css](sheep-care-game/src/App.css)` for reusable modal styles and responsive behavior.

## Approach

- Restructure modal markup to use semantic sections (header, tabs, content panels, footer) and apply new class names aligned with the SheepListModal aesthetic.
- Replace inline tab styles with CSS classes to keep layout consistent and easier to tune for breakpoints.
- Add responsive rules to support small screens (max-width 480/640/768): reduce padding, scale font sizes, switch action buttons to stacked layout, and make the modal width fluid with a sensible max width.
- Keep existing logic and behavior (editing, pray button, admin slider, state handling) unchanged while improving layout and visual polish.

## Files to change

- `[sheep-care-game/src/components/SheepDetailModal.jsx](sheep-care-game/src/components/SheepDetailModal.jsx)`
- `[sheep-care-game/src/components/SettingsModal.jsx](sheep-care-game/src/components/SettingsModal.jsx)`
- `[sheep-care-game/src/components/Guide.jsx](sheep-care-game/src/components/Guide.jsx)`
- `[sheep-care-game/src/App.css](sheep-care-game/src/App.css)`
- `[sheep-care-game/src/index.css](sheep-care-game/src/index.css)` (if needed for body/html overflow)

## Implementation steps

1. Refactor modal structure and class names in `SheepDetailModal.jsx` to match the SheepListModal style (header bar, pill tabs, content sections, action buttons). Keep all existing state and handlers intact.
2. Add new CSS classes in `App.css` for:
  - Modal container/header/tabs styling (rounded corners, pastel header, border, shadow).
  - Form group spacing, labels, and inputs to match the SheepListModal inputs.
  - Action button styles (primary/pink prayer, secondary/taupe) consistent with the palette.
3. Add responsive CSS rules to:
  - Make modal width `min(92vw, 420px)` and ensure vertical scrolling for tall content.
  - Stack footer action buttons on narrow screens.
  - Adjust font sizes and padding for readability on small devices.
4. Update `SettingsModal.jsx` and `Guide.jsx` to use the shared modal classes (header, tabs, buttons) and remove inline styling where possible.
5. Add a mobile-specific rule to prevent scrolling/overscroll on the main app container (and/or `body`) so no black space appears on mobile.
6. Standardize modal button styles and remove remaining inline button styles for consistency.
7. Add ESC-to-close and basic focus handling for modals (focus first actionable element, restore focus on close).
8. Fix `SettingsModal` hook usage by using the top-level `useGame` hook for `saveToCloud`.
9. Validate that all modals open, tabs switch correctly, button interactions still work, and the main screen doesn't scroll on mobile.

## Notes

- I will reuse existing CSS variables (e.g., `--bg-card`, `--border-main`, `--palette-pink-action`) and align the color accents to the SheepListModal palette where it maps cleanly.
- No functional changes beyond styling/responsiveness.

