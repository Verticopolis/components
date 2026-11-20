---
package: patch
---
- `windows/uiModal`'s `ModalView` types its `title` as `string | TemplateResult` and its `body` as
  `TemplateResult`, so typecheck catches a caller handing it an element or a node list.
- `windows/detached`'s `renderDetached` throws on top-level text (which is never placed) and when an
  update changes a top-level value into text, as it already did for new elements.
