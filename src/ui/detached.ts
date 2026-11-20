import { render, type TemplateResult } from "lit-html";

/**
 * A lit template drawn into elements this package places inside a page's own
 * element (a game window's title bar, the desk), which no template of ours
 * owns. Rendering into that element itself would share lit's one render slot
 * per container with whatever else renders there, so the template renders
 * into a fragment of its own and its elements are placed from it. `update`
 * re-renders the same template with new values: lit's parts keep pointing at
 * the placed elements wherever they now sit, so only what changed is
 * touched.
 *
 * Only elements are placed, so the template's top level holds elements (and
 * blank text between them) and nothing else: top-level text would never
 * reach the page. `update` takes the same template with each top-level
 * expression keeping the same kind of value; a value that changes kind
 * (`nothing` to a template, one template to another, a longer list, `nothing`
 * to text) would draw new nodes into the fragment, out of the page's sight.
 * Both throw rather than drop what they drew.
 */
export interface Detached {
  /** The template's elements, in order (lit's marker comments left out). */
  readonly elements: readonly Element[];
  update(template: TemplateResult): void;
}

/** Text the page would show if it were placed: anything but blank. */
const shownText = (node: Node): boolean => node.nodeType === 3 /* Text */ && /\S/.test(node.nodeValue ?? "");

export function renderDetached(doc: Document, template: TemplateResult): Detached {
  const frag = doc.createDocumentFragment();
  render(template, frag);
  if ([...frag.childNodes].some(shownText))
    throw new Error("renderDetached: the template has text at its top level; only elements are placed.");
  return {
    elements: [...frag.children],
    update: (next) => {
      render(next, frag);
      if ([...frag.childNodes].some((node) => node.nodeType === 1 /* Element */ || shownText(node)))
        throw new Error("renderDetached: an update drew new nodes; keep the template's shape.");
    },
  };
}
