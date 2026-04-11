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
    // Fast Math.round: (v * 255 + 0.5) | 0
    const idx = ((values[i] * 255 + 0.5) | 0) * 4;
    const out = i * 3;
    target[out] = lutData[idx] * INV_255;
    target[out + 1] = lutData[idx + 1] * INV_255;
    target[out + 2] = lutData[idx + 2] * INV_255;
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
