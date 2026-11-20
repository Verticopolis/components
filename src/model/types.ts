/** @deprecated Moved to `@verticopolis/engine/model/types`. This path is removed in components 1.0. */
export * from "@verticopolis/engine/model/types";
import type { VacateReason } from "@verticopolis/engine/model/types";
import { VACATE_REASON_TEXT as sharedVacateReasonText } from "./vacateReasonText";
export { VIEW_ZOOM_MAX, VIEW_ZOOM_MIN } from "@verticopolis/engine/model/viewZoom";

/** The vacate reasons' text, typed against the engine's reasons so a reason
 *  the engine adds fails the compiler until it has its text. */
export const VACATE_REASON_TEXT: Record<VacateReason, string> = sharedVacateReasonText;
