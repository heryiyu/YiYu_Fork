# UI Library

Reusable UI primitives for the sheep-care-game. Use these components and tokens to maintain consistency and reduce duplication.

## Components

### CloseButton
Use for all modal/dialog close actions and search clear buttons.

```jsx
import { CloseButton } from './ui/CloseButton';

<CloseButton onClick={onClose} ariaLabel="關閉" />
<CloseButton ref={focusRef} onClick={onClose} ariaLabel="關閉" />  // supports ref for focus
<CloseButton className="dock-toolbar-search-clear" variant="sm" ariaLabel="收起搜尋" onClick={...} />
```

Props: `ariaLabel`, `onClick`, `size`, `className`, `variant` (default | sm), `ref`

---

### Toast
Reusable toast message with optional close button and variants.

```jsx
import { Toast } from './ui/Toast';

<Toast message="設定已更新" />
<Toast message="連線失敗" variant="error" />
```

Props: `message`, `variant` (default | info | success | warning | error), `duration`, `onClose`, `portal`, `className`

---

## Design Tokens

All tokens live in `src/styles/design-tokens.css`. Prefer `var(--token-name)` over hex values.

### Text
- `--text-primary`, `--text-body`, `--text-label`, `--text-inverse`
- `--text-muted` (#666), `--text-muted-light` (#999)
- `--text-icon`, `--text-icon-hover` (for icon buttons)

### Backgrounds
- `--bg-app`, `--bg-card`, `--bg-card-secondary`, `--bg-modal-overlay`
- `--bg-light-gray`, `--bg-info`, `--bg-snow`, `--bg-admin`

### Buttons
- `--btn-primary-bg`, `--btn-primary-hover`, `--btn-secondary-bg`, `--btn-danger-bg`
- `--btn-disabled-bg`, `--btn-shadow`, `--btn-shadow-active`

### Tags
- `--tag-new-bg`, `--tag-sick-bg`, `--tag-healthy-bg`, `--tag-dead-bg`
- `--tag-custom-default` (for user-defined tags)

### Borders
- `--border-main`, `--border-subtle`, `--border-info`, `--border-admin`

---

## Guardrails

1. **Tokens:** Add new colors/spacing to `design-tokens.css`; avoid hardcoded hex in CSS/JSX.
2. **Close buttons:** Use `<CloseButton />` everywhere; do not use raw `<button className="close-btn">✖</button>`.
3. **Modal structure:** Use `debug-editor-overlay` + `modal-card` + `modal-header` + `modal-form`.
4. **Buttons:** Use `modal-btn-primary`, `modal-btn-secondary`, `btn-destructive` classes.
5. **Form groups:** Use `.form-group` with label + input/select/textarea for consistent layout.
