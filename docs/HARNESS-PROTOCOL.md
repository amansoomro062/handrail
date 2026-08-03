# The harness protocol

Version 1.

This is the contract between an adapter and the runner. It is deliberately minimal, transport-level, and free of any reference to a framework — the runner speaks HTTP and HTML, nothing else.

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

The runner waits for this before it touches anything. Setting it too early is the most common cause of flaky results — set it after mount and after any first paint your library defers.

## 3. Expose metadata

```js
window.__HANDRAIL__ = {
  protocolVersion: 1,
  library: "radix",
  libraryVersions: { "@radix-ui/react-dialog": "1.1.4" },
  adapterVersion: "0.1.0",
  component: "dialog",
  notes: "optional — anything the runner should record about how this was mounted"
};
```

`libraryVersions` is read straight into the result file. It must be the **resolved** version, not the semver range from `package.json` — a result that cannot name the exact version it tested is not reproducible.

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

The dialog is **closed** on load. `hr-dialog` and its children need not exist in the DOM until opened — most libraries portal them in, and that is fine.

### Structural requirements

- `hr-before`, `hr-trigger`, `hr-outside-content` and `hr-after` are in DOM order, all outside the dialog
- `hr-outside-content` remains in the document when the dialog opens

`hr-outside-content` is a button rather than a paragraph on purpose. Interactive elements are always present in the accessibility tree unless something deliberately hides them, so their absence — or their `ignored` flag — is an unambiguous signal. A generic `<div>` can be dropped from the tree for reasons that have nothing to do with the modal, which would make the inertness check quietly unreliable.
- The dialog contains exactly three focusable elements: `hr-field-1`, `hr-field-2`, `hr-close`, in that DOM order

That last point matters. The focus-trap assertions count Tab presses, so a library that injects extra focusable elements (a sentinel node, a decorative close icon that is also tabbable) will produce different traversal. If your library does that legitimately, say so in `notes` and open an issue — do not paper over it in the adapter.

### Do not

- Do not add your own focus management, key handlers, or ARIA attributes. **The point is to measure what the library does unaided.** If you find yourself adding `onKeyDown` to make a test pass, stop: you have just hidden the exact defect we exist to find.
- Do not style the harness. Visual design is irrelevant and adds noise.
- Do not use a library's "accessible" opt-in mode without recording it in `notes`. If accessibility is off by default, that *is* the finding.

---

## Components: `combobox`, `menu`, `tabs`, `accordion`

Specifications pending — see [`PLAN.md`](PLAN.md) Phase 2. Element tables will be added here before the specs are written, so adapter authors can work ahead.

---

## Versioning

The protocol is versioned by `protocolVersion`. A breaking change increments it, and the runner refuses to execute adapters declaring an unsupported version rather than producing a subtly wrong result.

Additive changes — a new component, a new optional field — do not increment it.
