# The harness protocol

Version 1.

This is the contract between an adapter and the runner. It is deliberately minimal, transport-level, and free of any reference to a framework, the runner speaks HTTP and HTML, nothing else.

If you are writing an adapter, this document plus [`adapters/radix`](../adapters/radix) is everything you need.

---

## 1. Serve a route per component

```
GET /harness/<component>
```

`<component>` is the spec id: `dialog`, `combobox`, `tabs`, `menu`, `accordion`.

Any server will do. The runner is given a base URL and appends the path. A Vite dev server, a static export, or a single hand-written HTML file are all equally valid.

## 2. Announce readiness

Set the attribute once the component has mounted and is interactive:

```html
<body data-handrail-ready="true">
```

The runner waits for this before it touches anything. Setting it too early is the most common cause of flaky results, set it after mount and after any first paint your library defers.

## 3. Expose metadata

```js
window.__HANDRAIL__ = {
  protocolVersion: 1,
  library: "radix",
  libraryVersions: { "@radix-ui/react-dialog": "1.1.4" },
  adapterVersion: "0.1.0",
  component: "dialog",
  notes: "optional, anything the runner should record about how this was mounted"
};
```

`libraryVersions` is read straight into the result file. It must be the **resolved** version, not the semver range from `package.json`, a result that cannot name the exact version it tested is not reproducible.

## 4. Render the required elements

Each spec declares `requiredElements`. Every one must be present, each carrying its `data-testid`.

The runner fails the whole run with `harness-invalid` if any required element is missing. That is deliberate: it is a loud adapter bug, not a quiet library failure. **A library must never be scored down because of an incomplete adapter.**

## 5. Use the standard content

Where the spec fixes a string, use it exactly. Assertions about accessible names compare against these.

| Slot          | Required text          |
| ------------- | ---------------------- |
| Dialog title  | `Handrail test dialog` |
| Trigger label | `Open dialog`          |
| Close label   | `Close`                |

---

## Component: `dialog`

APG pattern: <https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>

### Required elements

| `data-testid`        | What it must be                                                        |
| -------------------- | ---------------------------------------------------------------------- |
| `hr-before`          | A focusable `<button>` in the document **before** the trigger           |
| `hr-trigger`         | The control that opens the dialog. Label: `Open dialog`                 |
| `hr-outside-content` | A focusable `<button>` outside the dialog, labelled `Content outside the dialog`. Used for inertness checks |
| `hr-dialog`          | The dialog container element                                            |
| `hr-title`           | The dialog's visible title. Text: `Handrail test dialog`                |
| `hr-field-1`         | A focusable `<input type="text">` inside the dialog                     |
| `hr-field-2`         | A second focusable `<input type="text">` inside the dialog              |
| `hr-close`           | A `<button>` inside the dialog that closes it. Label: `Close`           |
| `hr-after`           | A focusable `<button>` in the document **after** the trigger            |

### Required initial state

The dialog is **closed** on load. `hr-dialog` and its children need not exist in the DOM until opened, most libraries portal them in, and that is fine.

### Structural requirements

- `hr-before`, `hr-trigger`, `hr-outside-content` and `hr-after` are in DOM order, all outside the dialog
- `hr-outside-content` remains in the document when the dialog opens

`hr-outside-content` is a button rather than a paragraph on purpose. Interactive elements are always present in the accessibility tree unless something deliberately hides them, so their absence, or their `ignored` flag, is an unambiguous signal. A generic `<div>` can be dropped from the tree for reasons that have nothing to do with the modal, which would make the inertness check quietly unreliable.
- The dialog contains exactly three focusable elements: `hr-field-1`, `hr-field-2`, `hr-close`, in that DOM order

That last point matters. The focus-trap assertions count Tab presses, so a library that injects extra focusable elements (a sentinel node, a decorative close icon that is also tabbable) will produce different traversal. If your library does that legitimately, say so in `notes` and open an issue, do not paper over it in the adapter.

### Do not

- Do not add your own focus management, key handlers, or ARIA attributes. **The point is to measure what the library does unaided.** If you find yourself adding `onKeyDown` to make a test pass, stop: you have just hidden the exact defect we exist to find.
- Do not style the harness. Visual design is irrelevant and adds noise.
- Do not use a library's "accessible" opt-in mode without recording it in `notes`. If accessibility is off by default, that *is* the finding.

---

## Component: `combobox`

APG pattern: <https://www.w3.org/WAI/ARIA/apg/patterns/combobox/>

An editable combobox with a listbox popup.

### Required elements

| `data-testid`  | What it must be                                                          |
| -------------- | ------------------------------------------------------------------------ |
| `hr-before`    | A focusable `<button>` before the combobox                                |
| `hr-combobox`  | The **input element itself**, the one carrying `role="combobox"`         |
| `hr-after`     | A focusable `<button>` after the combobox                                 |
| `hr-listbox`   | The popup listbox (need not exist until opened)                           |
| `hr-option-1`  | First option, `Apple`                                                     |
| `hr-option-2`  | Second option, `Banana`                                                   |
| `hr-option-3`  | Third option, `Cherry`                                                    |

`hr-combobox` must be the input, **not** a wrapper around it. Assertions read its role, `aria-expanded`, `aria-activedescendant`, `aria-controls` and value. Most libraries will not let you place an attribute there directly, use `stampTestIds` (below).

### Required content and state

- The combobox is labelled `Choose a fruit`
- Exactly three options, in the order above: distinct initial letters, so typeahead cannot make traversal ambiguous, and already alphabetical, so sorting cannot reorder them
- The popup is **closed** on load
- The combobox is **empty** on load, so a selection assertion can tell that something was committed

### Do not

- Do not pre-select an option
- Do not filter, sort or transform the option list
- Do not add key handlers. The spec opens the popup with Down Arrow, per APG, if that does nothing, that *is* the finding

---

## Stamping test ids onto elements you do not control

Most libraries do not let you place an attribute on the element carrying the semantics. React Spectrum's `ComboBox` forwards `data-testid` to a wrapper rather than to the `input[role="combobox"]` inside it, and popups are portalled in only when opened.

`stampTestIds` from `@handrail/harness-kit` attaches ids by structural selector, and keeps doing so via a `MutationObserver` as the DOM changes:

```ts
stampTestIds({
  "hr-combobox": 'input[role="combobox"]',
  "hr-listbox": '[role="listbox"]',
  "hr-option-1": { selector: '[role="option"]', index: 0 },
});
```

**It places a marker and nothing else.** Never use it to add ARIA attributes, roles, labels or handlers, that is forging a pass, and it is the one thing that would make this project worthless.

Prefer structural selectors (`input[role="combobox"]`) over cosmetic ones (`.css-1x2y3z`). If the library stops producing that element, a structural selector fails loudly as a missing required element, whereas a class-based one may silently match the wrong node and measure something that is not the component.

---

## Declaring a component unsupported

When a library genuinely does not ship a component, the adapter announces readiness with `supported: false` instead of rendering a harness:

```ts
announceReady({ ...metaFor(component), supported: false,
  unsupportedReason: "Radix UI does not ship a combobox primitive." });
```

Every assertion is then recorded as `not-applicable` and the target scores `n/a` rather than zero. Not shipping a component is a scope decision, not an accessibility failure, and the index must not imply otherwise.

Do **not** use this to skip a component the library does ship but implements badly.

---

## Component: `menu`

APG pattern: <https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/>

A button that opens a menu.

### Required elements

| `data-testid` | What it must be                                              |
| ------------- | ------------------------------------------------------------ |
| `hr-before`   | A focusable `<button>` before the menu button                 |
| `hr-trigger`  | The menu button, labelled `Open menu`                         |
| `hr-after`    | A focusable `<button>` after the menu button                  |
| `hr-menu`     | The menu popup (need not exist until opened)                  |
| `hr-item-1`   | First item, `Cut`                                             |
| `hr-item-2`   | Second item, `Duplicate`                                      |
| `hr-item-3`   | Third item, `Paste`                                           |

### Required content and state

- Exactly three items, in the order above, with distinct initial letters so typeahead cannot disambiguate wrongly
- The menu is **closed** on load
- No item is disabled, checked, or a submenu

### Note on the pattern

Unlike a combobox, a menu **moves focus into itself**. Either mechanism the APG permits is accepted: DOM focus on a menu item via roving tabindex, or `aria-activedescendant` on the menu.

The assertions wait for the active item to change rather than reading it immediately. Roving focus is commonly moved in an effect or an animation frame, and reading it synchronously produces false blocker-level failures against libraries that are behaving correctly, see [`DECISIONS.md`](DECISIONS.md) 007.

---

## Components: `tabs`, `accordion`

Specifications pending: see [`PLAN.md`](PLAN.md) Phase 2. Element tables will be added here before the specs are written, so adapter authors can work ahead.

---

## Versioning

The protocol is versioned by `protocolVersion`. A breaking change increments it, and the runner refuses to execute adapters declaring an unsupported version rather than producing a subtly wrong result.

Additive changes: a new component, a new optional field, do not increment it.
