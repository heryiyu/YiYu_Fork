# UI Library

Reusable UI primitives for the sheep-care-game. Use these components and tokens to maintain consistency and reduce duplication.

## Components

### CloseButton
Use for all modal/dialog close actions and search clear buttons.

```jsx
import { CloseButton } from './ui/CloseButton';

<CloseButton onClick={onClose} ariaLabel="關閉" />
<CloseButton ref={focusRef} onClick={onClose} ariaLabel="關閉" />  // supports ref for focus
<CloseButton className="dock-toolbar-search-clear" variant="sm" ariaLabel="清除並收起搜尋" onClick={...} />
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

### Checkbox
Custom checkbox that hides native UI and uses design tokens.

```jsx
import { Checkbox } from './ui/Checkbox';

<Checkbox checked={value} onChange={toggle} ariaLabel="顯示篩選" />
```

Props: `checked`, `onChange`, `disabled`, `ariaLabel`, `className`, `id`, `name`

---

### Slider
Custom range input (subtle, modern styling).

```jsx
import { Slider } from './ui/Slider';

<Slider value={value} min={10} max={50} step={5} onChange={handleChange} ariaLabel="畫面顯示小羊數量" />
```

Props: `value`, `min`, `max`, `step`, `onChange`, `ariaLabel`, `className`, `disabled`

---

### Button
Reusable button with design system variants.

```jsx
import { Button } from './ui/Button';

<Button variant="primary" onClick={...}>確定</Button>
<Button variant="success" type="submit">新增</Button>
<Button variant="destructive" onClick={...}>刪除</Button>
```

Props: `variant` (primary | secondary | destructive | outline | ghost | success), `size` (default | sm), `disabled`, `type`, `className`, `children`

---

### Tag
Colored pill for status labels and user-defined tags.

```jsx
import { Tag } from './ui/Tag';

<Tag name="新朋友" color="#5385db" />
<Tag name="健康" variant="healthy" />
```

Props: `name`, `color`, `variant` (new | seeker | christian | dead | sick | healthy | custom), `className`

---

### Tooltip
Shadcn-style tooltip: dark background, white text, fade animation, hover delay.

```jsx
import { Tooltip } from './ui/Tooltip';

<Tooltip content="在草原上尋找此小羊" side="top">
  <button>...</button>
</Tooltip>
```

Props: `content`, `side` (top|bottom|left|right), `delayDuration` (default 300ms).

### IconButton
Ghost icon button for reorder, remove, edit, delete actions.

**Rule:** When 2+ IconButtons are placed together, wrap them in `IconButtonGroup` to narrow the gap and treat them as a component group.

```jsx
import { IconButton, IconButtonGroup } from './ui/IconButton';
import { Pencil } from 'lucide-react';

<IconButton icon={Pencil} onClick={...} ariaLabel="編輯" />
<IconButton icon={Trash2} onClick={...} variant="danger" ariaLabel="刪除" />

// Grouped (narrower gap):
<IconButtonGroup>
  <IconButton icon={Pencil} onClick={...} ariaLabel="編輯" />
  <IconButton icon={Trash2} onClick={...} variant="danger" ariaLabel="刪除" />
</IconButtonGroup>
```

Props: `icon`, `ariaLabel`, `onClick`, `disabled`, `variant` (default | danger), `className`, `size`

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
