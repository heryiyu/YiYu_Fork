# UI Library Inventory and Migration Plan

## 1. Inventory of Reusable UI Patterns

### Modals (6 components)
| Component | Overlay | Card | Header | Close | Tabs | Form |
|-----------|---------|------|--------|-------|------|------|
| AddSheepModal | debug-editor-overlay | simple-editor | editor-header | CloseButton | - | inline |
| ConfirmDialog | debug-editor-overlay | modal-card | modal-header | CloseButton | - | modal-form |
| SettingsModal | debug-editor-overlay | modal-card | modal-header | CloseButton | modal-tabs | modal-form |
| TagManagerModal | debug-editor-overlay | modal-card | modal-header | CloseButton | - | modal-form |
| SheepDetailModal | debug-editor-overlay | modal-card | modal-header | CloseButton | modal-tabs | modal-form |
| Guide | debug-editor-overlay | modal-card | modal-header | CloseButton | modal-tabs | modal-form |

**Pattern:** All use `debug-editor-overlay` + `modal-card` (or `simple-editor` for AddSheep). Close actions use `CloseButton`.

### Buttons
| Pattern | Usage | Location |
|---------|-------|----------|
| modal-btn-primary | Primary actions | ConfirmDialog, SettingsModal, TagManagerModal, SheepDetailModal |
| modal-btn-secondary | Cancel/secondary | ConfirmDialog, TagManagerModal, SheepDetailModal |
| btn-destructive | Delete/danger | ConfirmDialog, SheepDetailModal |
| modal-btn-secondary-outline | Outline style | SheepDetailModal |
| CloseButton | Close modals, search clear, filter menu | AddSheepModal, ConfirmDialog, SettingsModal, TagManagerModal, SheepDetailModal, Guide, SevenStepsMap, SheepList |

### Form Controls
| Pattern | Usage |
|---------|-------|
| form-group + label + input/select/textarea | SettingsModal, SheepDetailModal, TagManagerModal |
| Inline styles (width, padding, border) | AddSheepModal, SheepDetailModal TagSelect, TagManagerModal |

### Tags/Chips
| Pattern | Usage |
|---------|-------|
| Inline span (padding, borderRadius, background, color) | SheepDetailModal TagSelect, TagManagerModal, SettingsModal tag list |
| sheep-state-chip | SettingsModal fallback states |
| dock-toolbar-chip | SheepList filter bar |

### Hint/Notice
| Pattern | Usage |
|---------|-------|
| ModalHint | SettingsModal, SheepDetailModal |
| modal-hint-box, modal-info-box | App.css |

### Toast
| Pattern | Usage |
|---------|-------|
| Toast | App (global system messages) |

### Icon Actions (ghost buttons)
| Pattern | Usage |
|---------|-------|
| background: none, border: none, cursor: pointer | TagSelect reorder/remove, TagManagerModal edit/delete |

---

## 2. UI Primitives (Proposed API)

### CloseButton (exists)
- Props: `ariaLabel`, `onClick`, `size`, `className`, `variant` (default | sm)
- Used: SheepList search clear, filter settings. **Migrate:** All modal close buttons.

### Button (to create)
- Props: `variant` (primary | secondary | destructive | outline | ghost), `size` (default | sm), `disabled`, `className`, `children`
- Maps: modal-btn-primary → primary, modal-btn-secondary → secondary, btn-destructive → destructive

### IconButton (to create)
- Props: `icon`, `ariaLabel`, `onClick`, `disabled`, `className`, `variant` (default | ghost | danger)
- Maps: CloseButton (special case), TagSelect ChevronUp/Down/remove, TagManagerModal Pencil/Trash2

### Tag (to create)
- Props: `name`, `color`, `className`
- Maps: TagSelect tag span, TagManagerModal tag span, SettingsModal tag list

### ModalHint (exists, promote to ui/)
- Props: `children`, `className`, `style`, `role`, `ariaLive`
- Already used in SettingsModal, SheepDetailModal

### FormRow / FormGroup (CSS only, document)
- Use existing `.form-group` with label + input. Ensure tokens for input styles.

---

## 3. Token Gap List (Prioritized)

### Add to design-tokens.css
| Token | Value | Replaces |
|-------|-------|----------|
| --text-muted | #666666 | #666, #999 in many files |
| --text-muted-light | #999999 | #999 |
| --palette-gray-muted | #6b7280 | Tag default color |
| --tag-custom-default | var(--palette-gray-muted) | #6b7280 |
| --bg-light-gray | #f5f5f5 | modal-status-box |
| --bg-info | #e3f2fd | modal-info-box-blue |
| --border-info | #90caf9 | modal-btn-secondary-outline |
| --bg-snow | #f0faff | .snow .grass |
| --btn-shadow | 0 4px 0 rgba(143,125,103,0.4) | Move from #root |
| --btn-shadow-active | 0 2px 0 rgba(143,125,103,0.4) | Move from #root |
| --taupe-hover | #8f7d7d | modal-btn-secondary:hover |

### Replace in CSS (high priority)
- App.css: #999, #666, #333, #ccc, #f0faff, #8f7d7d, #90caf9, #e3f2fd, #f5f5f5
- SheepList.css: #fde8ec, #f39fac, #e8f5e9, #2e7d32, #6b7280, #9e9e9e, #666
- CloseButton.css: #4f4640, #2f2a26 → use --text-label or new token

### Replace in JSX (medium priority)
- SheepDetailModal, TagManagerModal, SettingsModal, AddSheepModal: inline color: '#666', '#999', '#6b7280', '#fff'

---

## 4. Migration Sequence

1. **Token consolidation** – Add missing tokens, move btn-shadow to design-tokens.css
2. **Replace hardcoded colors** – App.css, SheepList.css, CloseButton.css
3. **Migrate close buttons** – Replace raw `close-btn` with `<CloseButton />` in AddSheepModal, ConfirmDialog, SettingsModal, TagManagerModal, SheepDetailModal, Guide, SevenStepsMap
4. **Add Button component** – Create Button.jsx, migrate AddSheepModal submit to use it
5. **Add Tag component** – Create Tag.jsx, migrate TagSelect, TagManagerModal, SettingsModal
6. **Move ModalHint to ui/** – Already in components/, add to ui/ or keep and document
7. **Document form-group** – Ensure form-group uses tokens for inputs

---

## 5. Guardrails (Usage Guide)

- **Tokens:** Prefer `var(--token-name)` over hex. Add new tokens to design-tokens.css.
- **Buttons:** Use `modal-btn-primary`, `modal-btn-secondary`, `btn-destructive` or future Button component.
- **Close:** Use `<CloseButton />` for all modal/dialog close actions.
- **Tags:** Use Tag component or `.sheep-state-chip` for status chips.
- **Modals:** Use `debug-editor-overlay` + `modal-card` + `modal-header` + `modal-form` structure.
