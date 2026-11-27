/**
 * The Tower in 3D view: the player's tower as a 3D model they can orbit and
 * zoom, live from the same render model the side view reads. It draws into a
 * canvas the game hands it and never changes the simulation.
 *
 * The tower draws as merged bands of {@link BAND_FLOORS} floors (two draw
 * calls a band), with the cars and the people as instanced meshes. A change
 * to the tower rebuilds only the bands it touched, one band per frame.
 *
 * Use: `Tower3dView.mount(canvas, options)` returns the view, or null after
 * calling `onUnavailable` when the device cannot draw 3D.
 */
import {
  CanvasTexture,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  type BufferAttribute,
  type BufferGeometry,
  type Material,
} from "three";
import { findCatalogFacility } from "../render/catalogIndex";
import { lobbyHalls, type LobbyHalls } from "../render/lobbyHalls";
import type { RenderCatalog, RenderRules, RenderSim, RenderTransport, RenderUnit } from "../render/renderModel";
import { hangArt, tintArt, type ArtPaint } from "./bandArt";
import { BAND_FLOORS, buildBand, DEPTH, STORY } from "./bandGeometry";
import {
  artLookAt,
  artTintAt,
  builtBox,
  disposeBand,
  gradient,
  lotLimits,
  peopleWindowAt,
  REFRESH_FRAMES,
  REFRESH_ROOMS,
  unitsIn,
  type BandMesh,
  type PeopleWindow,
  type Tower3dStats,
} from "./viewParts";
import {
  attachOrbitInput,
  clampOrbit,
  farPlane,
  homeOrbit,
  placeCamera,
  type FrameBox,
  type Orbit,
  type OrbitLimits,
} from "./camera3d";
import { changedBands, towerBands, type TowerBands } from "./floorDigest";
import { buildLot, GROUND_Y } from "./lot3d";
import { Cars } from "./cabs3d";
import { Traffic } from "./movers3d";
import { Crowd } from "./people3d";
import { FrameClock, startTier, stepDown, TIERS, type Tier } from "./quality";
import { isArt, resolveTime, skyLight, type LookVariant, type TimeChoice, type TimeOfDay } from "./sky3d";

export type { LookVariant, TimeChoice, TimeOfDay } from "./sky3d";
export type { Tier } from "./quality";
export type { Tower3dStats } from "./viewParts";

/** Why the view could not draw. */
export type Unavailable = "no-webgl2" | "context-lost";

export interface Tower3dOptions {
  /** The simulation as the renderer reads it; called every frame. */
  readonly sim: () => RenderSim;
  /** The tower's catalog (the rooms' heights). */
  readonly catalog: RenderCatalog;
  /** Whether a room's people are in (its lights are on at night). */
  readonly rules: Pick<RenderRules, "isPresent">;
  readonly variant?: LookVariant;
  readonly tier?: Tier;
  readonly time?: TimeChoice;
  /** Called once when the device cannot draw 3D, or stops drawing it. */
  readonly onUnavailable?: (why: Unavailable) => void;
}

const FOV = 32;

export class Tower3dView {
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FOV, 1, 0.5, 1200);
  private readonly tower = new Group();
  private readonly bands = new Map<number, BandMesh>();
  private readonly hemi = new HemisphereLight();
  private readonly sun = new DirectionalLight();
  private readonly cars = new Cars();
  private readonly crowd = new Crowd();
  private readonly traffic = new Traffic();
  private artTicks = 0;
  private repaintNext = 0;
  private readonly clock = new FrameClock();
  private solidMat: Material;
  private readonly glowMat = new MeshBasicMaterial({ vertexColors: true, transparent: true });
  /** After dark the rooms draw unlit in their night colors: lit rooms glow, empty ones go dark. */
  private readonly nightMat = new MeshBasicMaterial({ vertexColors: true });
  private night = false;
  private lot: Mesh | null = null;
  private layout: TowerBands | null = null;
  private halls: LobbyHalls | null = null;
  private dirty: number[] = [];
  private revision = -1;
  private orbit: Orbit;
  private limits: OrbitLimits;
  /** The built part of the tower, which the opening view fits in frame. */
  private built: FrameBox;
  private tier: Tier;
  private variant: LookVariant;
  private time: TimeChoice;
  private drawnTime: TimeOfDay | null = null;
  private frame = 0;
  private last = 0;
  private visible = true;
  private lastBuildMs = 0;
  private readonly detach: () => void;

  /** Mounts a view on `canvas`, or returns null (after `onUnavailable`) when 3D can't draw. */
  static mount(canvas: HTMLCanvasElement, options: Tower3dOptions): Tower3dView | null {
    let renderer: WebGLRenderer;
    try {
      // three.js needs WebGL 2 and throws without it.
      renderer = new WebGLRenderer({ canvas, antialias: options.tier !== "low", powerPreference: "high-performance" });
    } catch {
      options.onUnavailable?.("no-webgl2");
      return null;
    }
    return new Tower3dView(canvas, renderer, options);
  }

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly renderer: WebGLRenderer,
    private readonly options: Tower3dOptions,
  ) {
    this.variant = options.variant ?? "art";
    this.crowd.setVoxel(this.variant === "voxel");
    this.time = options.time ?? (this.variant === "night" ? "night" : "follow");
    this.tier =
      options.tier ??
      startTier({
        coarsePointer: matchMedia("(pointer: coarse)").matches,
        shortSide: Math.min(screen.width, screen.height),
        cores: navigator.hardwareConcurrency || 4,
      });
    this.solidMat = this.makeSolidMaterial();
    renderer.outputColorSpace = SRGBColorSpace;
    this.scene.add(
      this.tower,
      this.hemi,
      this.sun,
      this.sun.target,
      ...this.cars.meshes,
      this.crowd.mesh,
      this.traffic.mesh,
    );
    this.limits = this.computeLimits();
    this.built = this.limits;
    this.orbit = homeOrbit(this.limits, FOV, 1);
    this.syncStructure(true);
    this.detach = attachOrbitInput(
      canvas,
      () => this.orbit,
      () => this.limits,
      () => undefined,
      () => this.resetView(),
    );
    canvas.addEventListener("webglcontextlost", this.lost);
    this.resize(canvas.clientWidth || 640, canvas.clientHeight || 480);
    this.resetView();
    this.frame = requestAnimationFrame(this.tick);
  }

  /** Shows or hides the view; hidden, it draws nothing and reads nothing. */
  setVisible(on: boolean): void {
    if (on === this.visible) return;
    this.visible = on;
    cancelAnimationFrame(this.frame);
    if (on) {
      this.last = 0;
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  /** Sets the drawing size in CSS pixels. */
  resize(width: number, height: number): void {
    const ratio = Math.min(devicePixelRatio || 1, TIERS[this.tier].maxPixelRatio);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  /** Follows the game clock, or pins a time of day for this window. */
  setTimeOfDay(choice: TimeChoice): void {
    this.time = choice;
    this.drawnTime = null;
  }

  /** Switches the look (for comparing variants side by side). */
  setVariant(variant: LookVariant): void {
    const art = (isArt(variant) || isArt(this.variant)) && variant !== this.variant;
    this.variant = variant;
    this.crowd.setVoxel(variant === "voxel");
    if (art && this.layout) for (const b of [...this.bands.keys(), ...this.layout.units.keys()]) this.rebuild(b);
    const old = this.solidMat;
    this.solidMat = this.makeSolidMaterial();
    for (const b of this.bands.values()) if (b.solid) this.paint(b.solid);
    if (this.lot) this.paint(this.lot);
    old.dispose();
    this.drawnTime = null;
  }

  /** Back to the opening view: front three-quarter, whole tower in frame. */
  resetView(): void {
    this.orbit = homeOrbit(this.limits, FOV, this.camera.aspect, this.built);
  }

  /** Turns the camera around the tower by `dTheta` and tilts it by `dPhi` (radians), as a drag would. */
  orbitBy(dTheta: number, dPhi = 0): void {
    this.orbit.theta += dTheta;
    this.orbit.phi += dPhi;
    clampOrbit(this.orbit, this.limits);
  }

  /**
   * The floors and tiles the view wants people for: the whole lot across,
   * and a tier's reach above and below the floor the camera looks at. The
   * game hands this to the simulation's people window while the view is open.
   */
  peopleWindow(): PeopleWindow {
    return peopleWindowAt(this.orbit.ty / STORY, this.tier, this.options.catalog.world.lotWidth);
  }

  /** The numbers the gate records. */
  stats(): Tower3dStats {
    const info = this.renderer.info;
    return {
      tier: this.tier,
      frameP50: this.clock.percentile(50),
      frameP90: this.clock.percentile(90),
      frameP95: this.clock.percentile(95),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      bands: this.bands.size,
      people: this.crowd.mesh.count,
      cars: this.cars.meshes[0]!.count,
      pixelRatio: this.renderer.getPixelRatio(),
      lastBuildMs: this.lastBuildMs,
    };
  }

  /** What the view shows, for the screen-reader summary the game words. */
  summary(): { floors: number; population: number; timeOfDay: TimeOfDay } {
    const sim = this.options.sim();
    return {
      floors: sim.tower.highestFloor - sim.tower.lowestFloor + 1,
      population: sim.population,
      timeOfDay: this.drawnTime ?? resolveTime(this.time, sim.clock.hour),
    };
  }

  /** Draws one frame at `scale` times the current size and returns it as a PNG. */
  capture(scale = 1): Promise<Blob | null> {
    const ratio = this.renderer.getPixelRatio();
    this.renderer.setPixelRatio(ratio * scale);
    this.renderer.render(this.scene, this.camera);
    return new Promise((done) => {
      this.canvas.toBlob((b) => {
        this.renderer.setPixelRatio(ratio);
        done(b);
      }, "image/png");
    });
  }

  /** Stops drawing and frees everything the view holds, the GL context included. */
  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.detach();
    this.canvas.removeEventListener("webglcontextlost", this.lost);
    for (const b of this.bands.values()) disposeBand(b);
    this.bands.clear();
    this.lot?.geometry.dispose();
    this.cars.dispose();
    this.crowd.dispose();
    this.traffic.dispose();
    this.solidMat.dispose();
    this.glowMat.dispose();
    this.nightMat.dispose();
    (this.scene.background as CanvasTexture | null)?.dispose?.();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private readonly lost = (e: Event): void => {
    e.preventDefault();
    cancelAnimationFrame(this.frame);
    this.options.onUnavailable?.("context-lost");
  };

  private readonly tick = (now: number): void => {
    if (!this.visible) return;
    this.frame = requestAnimationFrame(this.tick);
    if (this.last > 0 && this.clock.record(now - this.last, now) && this.tier !== "low") {
      this.tier = stepDown(this.tier);
      this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
    }
    this.last = now;
    const sim = this.options.sim();
    if (sim.tower.revision !== this.revision) this.syncStructure(false);
    if (this.dirty.length) this.rebuild(this.dirty.shift()!);
    for (const m of this.cars.update(sim.tower.elevators ?? sim.tower.transports, now)) this.scene.add(m);
    for (const m of this.crowd.update(sim, TIERS[this.tier].people, this.orbit, now)) this.scene.add(m);
    this.traffic.update(now, -90, this.options.catalog.world.lotWidth + 90, GROUND_Y, -DEPTH - 9);
    this.syncSky(resolveTime(this.time, sim.clock.hour));
    if (++this.artTicks % REFRESH_FRAMES === 0) this.repaintOne(sim);
    clampOrbit(this.orbit, this.limits);
    const far = farPlane(this.orbit, this.limits);
    if (Math.abs(far - this.camera.far) > far * 0.1) {
      this.camera.far = far;
      this.camera.near = Math.max(0.5, far / 4000);
      this.camera.updateProjectionMatrix();
    }
    placeCamera(this.camera, this.orbit);
    const fog = this.scene.fog as Fog | null;
    if (fog) {
      // Haze starts past the tower, wherever the camera is.
      fog.near = this.orbit.radius * 1.6;
      fog.far = this.orbit.radius * 5;
    }
    this.renderer.render(this.scene, this.camera);
  };

  /** Re-reads the tower's layout; on the first pass builds every band at once. */
  private syncStructure(all: boolean): void {
    const sim = this.options.sim();
    this.revision = sim.tower.revision;
    this.halls = lobbyHalls(sim.tower.lobbyHeights());
    const next = towerBands(sim.tower, this.stories, !isArt(this.variant));
    const changed = changedBands(this.layout, next);
    const basements = changed.some((b) => b <= 0) || !this.lot;
    this.layout = next;
    this.limits = this.computeLimits();
    this.built = builtBox(sim.tower.units, this.limits);
    if (all) for (const b of changed) this.rebuild(b);
    else for (const b of changed) if (!this.dirty.includes(b)) this.dirty.push(b);
    if (basements) this.rebuildLot();
  }

  private readonly stories = (u: RenderUnit): number =>
    u.kind === "lobby" && this.halls
      ? this.halls.heightAt(u.floor, u.x)
      : (findCatalogFacility(this.options.catalog, u.kind)?.floors ?? 1);

  private rebuild(band: number): void {
    const t0 = performance.now();
    const layout = this.layout!;
    const old = this.bands.get(band);
    const built = buildBand({
      band,
      units: layout.units.get(band) ?? [],
      transports: layout.transports.get(band) ?? [],
      bridges: layout.bridges.get(band) ?? [],
      rows: layout.rows,
      stories: this.stories,
      isPresent: this.options.rules.isPresent,
      art: isArt(this.variant),
    });
    // Swap only once the new band is complete, so no half-built band ever draws.
    const next: BandMesh = {
      solid: this.addMesh(built.solid, this.solidMat, true),
      glow: this.addMesh(built.glow, this.glowMat),
      art: isArt(this.variant)
        ? this.buildArt(band, layout.units.get(band) ?? [], layout.transports.get(band) ?? [])
        : null,
    };
    if (old) disposeBand(old);
    if (next.solid || next.glow || next.art) this.bands.set(band, next);
    else this.bands.delete(band);
    this.lastBuildMs = performance.now() - t0;
  }

  /** Paints a band's room art and hangs it on the back walls. */
  private buildArt(band: number, units: readonly RenderUnit[], shafts: readonly RenderTransport[]): BandMesh["art"] {
    const look = this.artLook(this.options.sim());
    const art = hangArt(band, units, this.stories, look, this.artTint(), shafts, this.variant === "voxel");
    if (art) this.tower.add(...art.meshes);
    return art;
  }

  /** Repaints the rooms that changed in the next band, so lights, people at work and signs follow the game. */
  private repaintOne(sim: RenderSim): void {
    if (!isArt(this.variant) || !this.bands.size) return;
    const keys = [...this.bands.keys()].sort((a, b) => a - b);
    const band = keys[this.repaintNext % keys.length]!;
    this.repaintNext = (this.repaintNext + 1) % keys.length;
    this.bands
      .get(band)
      ?.art?.paint.refresh(unitsIn(sim, band), this.stories, this.artLook(sim), this.renderer, REFRESH_ROOMS);
  }

  private artLook(sim: RenderSim): ArtPaint {
    return artLookAt(this.drawnTime ?? resolveTime(this.time, sim.clock.hour), sim.clock.hour);
  }

  private artTint(): number {
    return artTintAt(this.drawnTime);
  }

  private rebuildLot(): void {
    const sim = this.options.sim();
    const geometry = buildLot({
      lotWidth: this.options.catalog.world.lotWidth,
      lowestFloor: sim.tower.lowestFloor,
      rows: this.layout?.rows ?? new Map(),
    });
    if (this.lot) {
      this.lot.geometry.dispose();
      this.scene.remove(this.lot);
    }
    this.lot = geometry ? this.paint(new Mesh(geometry, this.solidMat)) : null;
    if (this.lot) this.scene.add(this.lot);
  }

  private addMesh(geometry: BufferGeometry | null, material: Material, painted = false): Mesh | null {
    if (!geometry) return null;
    const mesh = new Mesh(geometry, material);
    if (painted) this.paint(mesh);
    this.tower.add(mesh);
    return mesh;
  }

  /** Gives a solid mesh the day or the night colors and material. */
  private paint(mesh: Mesh): Mesh {
    const colors = mesh.geometry.userData as { day?: BufferAttribute; night?: BufferAttribute };
    const next = this.night ? colors.night : colors.day;
    if (next && mesh.geometry.getAttribute("color") !== next) mesh.geometry.setAttribute("color", next);
    mesh.material = this.night ? this.nightMat : this.solidMat;
    return mesh;
  }

  private syncSky(time: TimeOfDay): void {
    if (time === this.drawnTime) return;
    this.drawnTime = time;
    const s = skyLight(time, this.variant);
    const old = this.scene.background as CanvasTexture | null;
    this.scene.background = gradient(s.top, s.bottom);
    old?.dispose?.();
    this.scene.fog = new Fog(s.fog, 1, 2);
    this.hemi.color.setHex(s.hemiSky);
    this.hemi.groundColor.setHex(s.hemiGround);
    this.hemi.intensity = s.hemi;
    this.sun.color.setHex(s.sunColor);
    this.sun.intensity = s.sun;
    const cx = (this.limits.minX + this.limits.maxX) / 2;
    this.sun.position.set(cx + s.sunFrom[0] * 300, s.sunFrom[1] * 300, s.sunFrom[2] * 300);
    this.sun.target.position.set(cx, 20, -3.5);
    const sim = this.options.sim();
    for (const b of this.bands.values()) {
      if (!b.art) continue;
      for (const m of b.art.meshes) tintArt(m, this.artTint());
      b.art.paint.paint(unitsIn(sim, b.art.paint.band), this.stories, this.artLook(sim));
    }
    this.crowd.setNight(time !== "day");
    this.traffic.setNight(time !== "day");
    if (this.night !== (time === "night")) {
      this.night = time === "night";
      for (const b of this.bands.values()) if (b.solid) this.paint(b.solid);
      if (this.lot) this.paint(this.lot);
    }
    this.glowMat.opacity = s.glow;
    this.glowMat.visible = s.glow > 0;
    this.renderer.toneMappingExposure = s.exposure;
  }

  private computeLimits(): OrbitLimits {
    const t = this.options.sim().tower;
    return lotLimits(this.options.catalog.world.lotWidth, t.lowestFloor, t.highestFloor);
  }

  private makeSolidMaterial(): Material {
    return this.variant === "lit" || isArt(this.variant)
      ? new MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 })
      : new MeshLambertMaterial({ vertexColors: true });
  }
}

export { BAND_FLOORS };
