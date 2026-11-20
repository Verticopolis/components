---
package: patch
---
- the declarations resolve under `nodenext`. Every relative import in the
  shipped `.d.ts` files now names its `.js` file (or `/index.js`), so a
  project that resolves modules the way Node does follows them instead of
  failing, or reading every imported type as `any` with `skipLibCheck` on.
  The packed package's `engines` is `node >=22` in place of `26.x`, so an
  install on Node 22 or 24 no longer warns; the package runs on both. The
  repository's own tooling stays on Node 26.
