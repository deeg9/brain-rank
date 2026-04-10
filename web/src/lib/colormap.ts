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
 * Apply a colormap to normalized activation values, writing RGB triplets
 * into the target buffer in-place.
 *
 * @param values - Float32Array of length 20,484 with values in [0, 1]
 * @param colormap - Colormap name to use
 * @param target - Float32Array of length 20,484 * 3 = 61,452 to write RGB into
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
