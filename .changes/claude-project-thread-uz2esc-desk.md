---
package: major
---
- `windows/desk/deskWindow` draws the desk's pieces with lit-html: the
  frame, its title bar's icon and buttons, the size grip and the resize
  outline, with their events bound in the templates. `buildFrame(doc, id,
  title, close?)` takes the frame's ✕ (`{ label, onClick }`) and returns
  `{ root, body, setTitle }`; `setTitle` renames the window in place, and
  `titleText` is gone. `titleButton` is gone: a frame's ✕ comes from
  `buildFrame`. `deskFrameTemplate` is the frame's template.
- `windows/desk/deskWindowMenu`'s `WindowMenu` draws its menu with lit-html
  and re-renders the grayed items each time it opens. Its API is unchanged.
