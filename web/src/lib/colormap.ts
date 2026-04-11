import { interpolateInferno, interpolatePlasma, interpolateViridis } from 'd3-scale-chromatic';
import { rgb } from 'd3-color';

export type ColormapName = 'inferno' | 'plasma' | 'viridis';

export const COLORMAP_OPTIONS: { name: string; value: ColormapName }[] = [
  { name: 'Plasma', value: 'plasma' },
  { name: 'Inferno', value: 'inferno' },
  { name: 'Viridis', value: 'viridis' },
];

const INTERPOLATORS: Record<ColormapName, (t: number) => string> = {
  inferno: interpolateInferno,
  plasma: interpolatePlasma,
  viridis: interpolateViridis,
};

/**
 * Build a 256-entry RGBA lookup table for a colormap.
 * Each entry is 4 bytes (R, G, B, A) stored sequentially.
 * Total size: 256 * 4 = 1024 bytes.
 *
 * This is computed once per colormap change, not per vertex.
 * The d3-color CSS string parsing happens here, not in the per-vertex path.
 */
export function buildColormapLUT(colormap: ColormapName): Uint8Array {
  const interpolate = INTERPOLATORS[colormap];
  const lut = new Uint8Array(256 * 4);

  for (let i = 0; i < 256; i++) {
    const cssColor = interpolate(i / 255);
    const parsed = rgb(cssColor);
    const offset = i * 4;
    lut[offset] = parsed.r;
    lut[offset + 1] = parsed.g;
    lut[offset + 2] = parsed.b;
    lut[offset + 3] = 255;
  }

  return lut;
}

/**
 * Apply a pre-built colormap LUT to normalized activation values,
 * writing RGB triplets into the target buffer in-place.
 *
 * This function uses only array index lookups -- no d3-color, no CSS parsing.
 * Orders of magnitude faster than the legacy applyColormap for large vertex counts.
 *
 * @param values - Float32Array of normalized values in [0, 1]
 * @param lutData - Uint8Array of length 1024 from buildColormapLUT
 * @param target - Float32Array of length values.length * 3 to write RGB into
 */
export function applyColormapFromLUT(
  values: Float32Array,
  lutData: Uint8Array,
  target: Float32Array,
): void {
  const INV_255 = 0.00392156862745098; // 1/255, avoids division per iteration

  for (let i = 0; i < values.length; i++) {
    // Fast Math.round: (v * 255 + 0.5) | 0, clamped to [0, 255] for safety
    const lutIdx = Math.min(255, Math.max(0, (values[i] * 255 + 0.5) | 0));
    const idx = lutIdx * 4;
    const out = i * 3;
    target[out] = lutData[idx] * INV_255;
    target[out + 1] = lutData[idx + 1] * INV_255;
    target[out + 2] = lutData[idx + 2] * INV_255;
  }
}

// --- Threshold Glow Constants ---

/** Activation threshold -- vertices below this appear dark */
export const THRESHOLD = 0.3;
/** Width of the smoothstep blend zone (THRESHOLD +/- BLEND_WIDTH/2) */
export const BLEND_WIDTH = 0.1;
/** Lower edge of blend zone */
export const BLEND_LOW = THRESHOLD - BLEND_WIDTH / 2; // 0.25
/** Upper edge of blend zone */
export const BLEND_HIGH = THRESHOLD + BLEND_WIDTH / 2; // 0.35
/** Dark gray value for below-threshold vertices (0x1a / 255) */
export const DARK_GRAY = 0x1a / 255; // ~0.10196
/** Maximum emissive intensity multiplier at activation = 1.0 */
export const MAX_EMISSIVE = 2.0;

/**
 * Standard smoothstep hermite interpolation.
 * Returns 0 when x <= edge0, 1 when x >= edge1,
 * and a smooth curve between.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Apply threshold-based emissive glow coloring.
 *
 * Below BLEND_LOW: dark gray (#1a1a1a).
 * Above BLEND_HIGH: inferno color scaled by emissive intensity (1.0 to MAX_EMISSIVE).
 * In between: smoothstep blend from dark gray to inferno.
 *
 * Output values can exceed 1.0 (HDR) due to emissive scaling.
 * Use with toneMapped={false} on the material.
 *
 * @param values - Float32Array of normalized activation values in [0, 1]
 * @param lutData - Uint8Array of length 1024 from buildColormapLUT('inferno')
 * @param target - Float32Array of length values.length * 3 to write RGB into
 */
export function applyThresholdGlow(
  values: Float32Array,
  lutData: Uint8Array,
  target: Float32Array,
): void {
  const INV_255 = 0.00392156862745098; // 1/255

  for (let i = 0; i < values.length; i++) {
    const value = values[i];

    // Smoothstep blend factor: 0 below BLEND_LOW, 1 above BLEND_HIGH
    const blend = smoothstep(BLEND_LOW, BLEND_HIGH, value);

    // LUT lookup for inferno color
    const lutIdx = Math.min(255, Math.max(0, (value * 255 + 0.5) | 0));
    const idx = lutIdx * 4;
    const infernoR = lutData[idx] * INV_255;
    const infernoG = lutData[idx + 1] * INV_255;
    const infernoB = lutData[idx + 2] * INV_255;

    // Emissive scale: 1.0 at threshold, MAX_EMISSIVE at value=1.0
    const aboveRatio = Math.max(0, (value - THRESHOLD) / (1 - THRESHOLD));
    const emissiveScale = 1.0 + aboveRatio * (MAX_EMISSIVE - 1.0);

    // Lerp between dark gray and emissive-scaled inferno
    const out = i * 3;
    target[out] = DARK_GRAY + blend * (infernoR * emissiveScale - DARK_GRAY);
    target[out + 1] = DARK_GRAY + blend * (infernoG * emissiveScale - DARK_GRAY);
    target[out + 2] = DARK_GRAY + blend * (infernoB * emissiveScale - DARK_GRAY);
  }
}

/**
 * @deprecated Use buildColormapLUT + applyColormapFromLUT instead.
 * Kept for backward compatibility -- no consumers remain after BrainHeatmapMesh migration.
 */
export function applyColormap(
  values: Float32Array,
  colormap: ColormapName,
  target: Float32Array,
): void {
  const interpolate = INTERPOLATORS[colormap];

  for (let i = 0; i < values.length; i++) {
    const cssColor = interpolate(values[i]);
    const parsed = rgb(cssColor);
    target[i * 3] = parsed.r / 255;
    target[i * 3 + 1] = parsed.g / 255;
    target[i * 3 + 2] = parsed.b / 255;
  }
}
