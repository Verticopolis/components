---
package: minor
---
- `windows/scenarioList` draws a game's scenarios: `scenarioLaunchTemplate`, a launch window of numbered rows with each scenario's brief, trophies and Play button (or why it is locked) and a foot the game fills; `scenarioRowsTemplate`, `scenarioDetailsTemplate`, `scenarioGoalsTemplate` and `scenarioTrophiesTemplate` for the pieces; and `scenarioBestText`. The trophies carry the best mark's name beside them.
- `windows/newScenario` is the New Scenario dialog for the shared modal (`newScenarioView`): a list box of scenarios beside the picked one's details, with Play and Cancel. The arrow keys, Home and End move the pick, Enter plays, and entries listed first (such as a sandbox) carry their own details.
- `styles/game/scenario-list.css` styles both in a new `vc.windows.scenario-list` layer, which `styles.css` imports and declares after `vc.windows.appearance`. Rows are at least 44 px tall on a touch screen.
