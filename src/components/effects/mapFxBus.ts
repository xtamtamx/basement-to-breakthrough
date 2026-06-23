/**
 * mapFxBus — an imperative bus so any component can fire a celebratory particle
 * burst on the map's Pixi overlay without prop-plumbing or re-initing Pixi
 * (mirrors the audio singleton + surgeRef decoupling). The live MapFXLayer effect
 * registers its handler via setBurstHandler() and clears it on teardown, so
 * mapFx.burst() is a guaranteed no-op when the layer is off/uninitialized.
 *
 * Lives in its own module (not MapFXLayer.tsx) so the component file keeps
 * exporting only components — required for React fast-refresh.
 */
export type BurstOpts = { kind?: 'confetti' | 'spark'; count?: number; colors?: number[] };

type BurstFn = (x: number | null, y: number | null, o?: BurstOpts) => void;

let handler: BurstFn | null = null;

/** Called by the live MapFXLayer effect (and with null on cleanup). */
export const setBurstHandler = (fn: BurstFn | null): void => {
  handler = fn;
};

export const mapFx = {
  burst(x: number | null = null, y: number | null = null, o?: BurstOpts): void {
    handler?.(x, y, o);
  },
};
