---
package: major
---
- `windows/menuBar`'s `MenuBar` draws the bar itself with lit-html from a
  `MenuBarModel` (titles with their underlined letter, items with a shortcut,
  a check, a radio group, grayed, hidden, a link, `data-*` attributes or an
  `onPick`, separators and submenus), and binds its handlers in the template.
  The constructor is now `new MenuBar(host, model, options)`, and
  `bar.render(model)` redraws it with a changed model. A page no longer
  writes the bar's markup or wires its items' clicks; the constructor that
  wired hand-written markup is gone. The model types are exported from
  `windows/menuBar`, and `windows/menuBarTemplate` holds the template.
