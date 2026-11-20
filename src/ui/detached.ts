import { render, type TemplateResult } from "lit-html";

/**
 * A lit template drawn into elements this package places inside a page's own
 * element (a game window's title bar, the desk), which no template of ours
 * owns. Rendering into that element itself would share lit's one render slot
 * per container with whatever else renders there, so the template renders
 * into a fragment of its own and its elements are placed from it. `update`
 * re-renders the same template with new values: lit's parts keep pointing at
 * the placed elements wherever they now sit, so only what changed is
 * touched. Give `update` the same template it started with.
 */
export interface Detached {
  /** The template's elements, in order (lit's marker comments left out). */
  readonly elements: readonly Element[];
  update(template: TemplateResult): void;
}

export function renderDetached(doc: Document, template: TemplateResult): Detached {
  const frag = doc.createDocumentFragment();
  render(template, frag);
  return {
    elements: [...frag.children],
    update: (next) => {
      render(next, frag);
      if (frag.firstElementChild)
        throw new Error("renderDetached: an update drew new elements; keep the template's shape.");
    },
  };
}
