---
package: major
---
- `windows/icons` draws icons only through lit: `iconTemplate(name, opts)` for an icon and
  `messageWithIcons(message)` for a bulletin line with its leading emoji swapped for an icon.
  `iconElement` and `appendMessageWithIcons` are removed; render `iconTemplate` or
  `messageWithIcons` in a lit template instead.
- `windows/escape` (`escapeHtml`) is removed. Nothing in the package builds HTML strings
  anymore, and a lit template escapes every binding.
