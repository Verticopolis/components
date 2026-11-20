// The gallery site's shared constants: its address, its links, the side menu,
// and the script that puts the kept scheme on the page before it paints.

import { DEFAULT_SCHEME, SCHEMES as SCHEME_IDS } from "../lib/ui/schemes.js";
import { SCHEME_KEY } from "./schemeKey.mjs";

export const SITE_ORIGIN = "https://components.verticopolis.com";

export const GAME = "https://verticopolis.com/";
export const GITHUB = "https://github.com/Verticopolis/components";
export const GITHUB_ISSUES = `${GITHUB}/issues/new/choose`;
export const NPM = "https://www.npmjs.com/package/@verticopolis/components";
export const ENGINE_DOCS = "https://docs.verticopolis.com/";
export const PLAYER_HELP = "https://help.verticopolis.com/";

/** Where the picked scheme is kept between pages. */
export { SCHEME_KEY };

/** A value as a JavaScript literal that is safe inside an inline <script>:
 *  the characters that could close the tag or end a line are escaped. */
function scriptLiteral(value) {
  return JSON.stringify(value).replace(
    /[<>/\u2028\u2029]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

/** Sets the scheme picked last on <html> before the page paints. */
export const SCHEME_BOOT = `(function(){try{var s=localStorage.getItem(${scriptLiteral(SCHEME_KEY)});if(${scriptLiteral(
  SCHEME_IDS.filter((v) => v !== DEFAULT_SCHEME),
)}.indexOf(s)>=0)document.documentElement.setAttribute("data-scheme",s)}catch(e){}})();`;

export const sidebar = [
  { label: "Overview", link: "/" },
  {
    label: "Windows and controls",
    items: [
      { label: "Buttons", link: "/controls/buttons/" },
      { label: "Windows", link: "/controls/windows/" },
      { label: "Wells, fields and key-value rows", link: "/controls/wells/" },
      { label: "Menu bar", link: "/controls/menu-bar/" },
      { label: "Message boxes", link: "/controls/message-boxes/" },
      { label: "Alert cards and updates", link: "/controls/alert-cards/" },
      { label: "Appearance", link: "/controls/appearance/" },
      { label: "Open and Save As", link: "/controls/file-dialog/" },
      { label: "Icons", link: "/controls/icons/" },
    ],
  },
  {
    label: "Desktop",
    items: [
      { label: "The desk", link: "/desktop/desk/" },
      { label: "Where windows open", link: "/desktop/layout/" },
      { label: "Title screen", link: "/desktop/title-screen/" },
      { label: "Screen saver", link: "/desktop/screen-saver/" },
    ],
  },
  { label: "Sounds", link: "/sounds/" },
  { label: "Docs sites", link: "/docs-sites/" },
  {
    label: "The tower",
    items: [
      { label: "Lobbies", link: "/tower/lobbies/" },
      { label: "Stairs and escalators", link: "/tower/stairs-and-escalators/" },
      { label: "Elevators", link: "/tower/elevators/" },
      { label: "Rooms", link: "/tower/rooms/" },
      { label: "People", link: "/tower/people/" },
    ],
  },
  {
    label: "Docs",
    items: [
      { label: "Architecture", link: "/docs/architecture/" },
      { label: "Design system", link: "/docs/design-system/" },
      { label: "The desk", link: "/docs/desk/" },
      { label: "Audio", link: "/docs/audio/" },
      { label: "Sprite atlas", link: "/docs/atlas/" },
    ],
  },
];
