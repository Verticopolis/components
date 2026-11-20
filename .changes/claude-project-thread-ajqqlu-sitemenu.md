---
package: minor
---
- `windows/siteMenu` is the Win95 menu bar a Starlight docs site wears: File (the site's items,
  then Print), Edit (Find, Copy Link to This Page), Options (the look and, when offered, the
  appearance schemes) and Help (the site's items). `mountSiteMenu(root, deps, items)` draws it,
  `siteMenuModel` is its model, `starlightDeps()` wires the built-in items to a Starlight page
  and `schemeDeps(key)` adds the schemes. Each built-in item carries a `data-site-item` code that
  a `picked` dep hears.
