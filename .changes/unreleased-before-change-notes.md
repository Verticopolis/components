---
package: minor
---
- `src/shared/` is now `src/model/`, exported as `model/*`: the
  tower model types and the small helpers over them. `shared/*` stays as an
  alias for the same files until 1.0, so existing imports keep working; move
  them to `model/*`.
