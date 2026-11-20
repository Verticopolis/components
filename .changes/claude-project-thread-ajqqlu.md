---
package: minor
---
- `windows/schemes` lists the appearance schemes (`SCHEMES`, `SCHEME_NAMES`, `DEFAULT_SCHEME`,
  `isScheme`) and dresses a page in one (`applyScheme`, `schemeOf`, and `loadScheme` and
  `saveScheme` under a key the page names). It imports no stylesheet and no lit.
- `windows/appearance` is the Appearance dialog: `openAppearanceDialog(shell, current, save,
  { note, displaceable })` opens it in a `ModalShell`; `appearanceView` and
  `appearanceTemplate` are its view and body for a caller that drives the shell itself. It
  imports `styles/game/appearance.css`.
