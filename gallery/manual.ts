/**
 * Links from the gallery back to the player's manual (help.verticopolis.com),
 * so a room, a scene or a figure can be read about where the game explains
 * it. The pages and anchors are the manual's own; a link to a page that moves
 * there goes stale here, so `manualLink` keeps them all in one place.
 */
import { html, type TemplateResult } from "lit-html";
import type { FacilityKind } from "../lib/render/renderModel.js";

const MANUAL = "https://help.verticopolis.com/";

/** The manual's address for a page path and anchor, such as `rooms/hotels/#housekeeping`. */
export function manualHref(path: string): string {
  return MANUAL + path;
}

/** A small "In the manual" link to a manual page, for a figure's caption. */
export const manualLink = (path: string): TemplateResult =>
  html`<a class="g-manual" href=${manualHref(path)}>In the manual</a>`;

/** Where the manual covers each room the Rooms page shows. */
export const ROOM_MANUAL: Partial<Record<FacilityKind, string>> = {
  office: "rooms/offices/",
  condo: "rooms/homes/#condominiums",
  rentalStudio: "rooms/homes/#studios-and-apartments-modern",
  rentalApartment: "rooms/homes/#studios-and-apartments-modern",
  hotelSingle: "rooms/hotels/#the-three-rooms",
  hotelDouble: "rooms/hotels/#the-three-rooms",
  hotelSuite: "rooms/hotels/#the-three-rooms",
  housekeeping: "rooms/hotels/#housekeeping",
  fastFood: "rooms/food-and-shops/#fast-food",
  restaurant: "rooms/food-and-shops/#restaurants",
  foodHall: "rooms/food-and-shops/#food-hall-modern",
  shop: "rooms/food-and-shops/#retail-shops",
  boutiqueBay: "rooms/food-and-shops/#boutique-bay-modern",
  clinic: "rooms/food-and-shops/#clinic-modern",
  cinema: "rooms/venues/#cinema",
  partyHall: "rooms/venues/#party-hall",
  amusements: "rooms/venues/#amusements",
  fitnessClub: "rooms/venues/#fitness-club",
  nightclub: "rooms/venues/#nightclub",
  spa: "rooms/venues/#spa",
  skyBar: "rooms/venues/#sky-bar",
  aquaticCenter: "rooms/venues/#aquatic-center",
  daycare: "rooms/venues/#daycare",
  parkingRamp: "rooms/services/#parking",
  parking: "rooms/services/#parking",
  security: "rooms/services/#security",
  medical: "rooms/services/#medical-center",
  recycling: "rooms/services/#recycling-center",
  metro: "rooms/services/#metro-station",
  weddingHall: "rooms/wedding-hall/",
};
