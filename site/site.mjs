// The gallery site's shared constants: its address, the side menu, and the
// color schemes the Options menu offers.

export const SITE_ORIGIN = "https://components.verticopolis.com";

export const GAME = "https://verticopolis.com/";
export const GITHUB = "https://github.com/Verticopolis/components";
export const GITHUB_ISSUES = `${GITHUB}/issues/new/choose`;
export const NPM = "https://www.npmjs.com/package/@verticopolis/components";
export const ENGINE_DOCS = "https://docs.verticopolis.com/";
export const PLAYER_HELP = "https://help.verticopolis.com/";

/** The color schemes, by the value each sets on `html[data-scheme]` (none for
 *  the classic look). */
export const SCHEMES = [
  { label: "Classic", value: "classic" },
  { label: "Skyline", value: "skyline" },
  { label: "High Contrast", value: "high_contrast" },
];

/** Where the picked scheme is kept between pages. */
export const SCHEME_KEY = "vc-components-scheme";

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
  SCHEMES.map((s) => s.value).filter((v) => v !== "classic"),
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
      { label: "Icons", link: "/controls/icons/" },
    ],
  },
  { label: "Sounds", link: "/sounds/" },
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
      { label: "Audio", link: "/docs/audio/" },
      { label: "Sprite atlas", link: "/docs/atlas/" },
    ],
  },
];
