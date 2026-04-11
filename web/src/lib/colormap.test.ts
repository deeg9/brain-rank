import { describe, it, expect } from 'vitest';
import {
  buildColormapLUT,
  applyColormapFromLUT,
} from './colormap';

// Legacy implementation copied from original colormap.ts for regression testing
import { interpolateInferno, interpolatePlasma, interpolateViridis } from 'd3-scale-chromatic';
import { rgb } from 'd3-color';

type ColormapName = 'inferno' | 'plasma' | 'viridis';

const LEGACY_INTERPOLATORS: Record<ColormapName, (t: number) => string> = {
  inferno: interpolateInferno,
  plasma: interpolatePlasma,
  viridis: interpolateViridis,
};

function applyColormapLegacy(
  values: Float32Array,
  colormap: ColormapName,
  target: Float32Array,
): void {
  const interpolate = LEGACY_INTERPOLATORS[colormap];
  for (let i = 0; i < values.length; i++) {
    const cssColor = interpolate(values[i]);
    const parsed = rgb(cssColor);
    target[i * 3] = parsed.r / 255;
    target[i * 3 + 1] = parsed.g / 255;
    target[i * 3 + 2] = parsed.b / 255;
  }
}

describe('buildColormapLUT', () => {
  it('returns a Uint8Array of length 1024 (256 entries * 4 RGBA)', () => {
    const lut = buildColormapLUT('plasma');
    expect(lut).toBeInstanceOf(Uint8Array);
    expect(lut.length).toBe(256 * 4);
  });

  it('has alpha=255 for every entry', () => {
    const lut = buildColormapLUT('plasma');
    for (let i = 0; i < 256; i++) {
      expect(lut[i * 4 + 3]).toBe(255);
    }
  });

  it('returns different RGB values for different colormaps at index 128', () => {
    const infernoLUT = buildColormapLUT('inferno');
    const plasmaLUT = buildColormapLUT('plasma');
    const idx = 128 * 4;
    const infernoRGB = [infernoLUT[idx], infernoLUT[idx + 1], infernoLUT[idx + 2]];
    const plasmaRGB = [plasmaLUT[idx], plasmaLUT[idx + 1], plasmaLUT[idx + 2]];
    expect(infernoRGB).not.toEqual(plasmaRGB);
  });
});

describe('applyColormapFromLUT', () => {
  it('maps value 0.0 to the first LUT entry RGB', () => {
    const lut = buildColormapLUT('plasma');
    const values = new Float32Array([0.0]);
    const target = new Float32Array(3);
    applyColormapFromLUT(values, lut, target);

    expect(target[0]).toBeCloseTo(lut[0] / 255, 2);
    expect(target[1]).toBeCloseTo(lut[1] / 255, 2);
    expect(target[2]).toBeCloseTo(lut[2] / 255, 2);
  });

  it('maps value 1.0 to the last LUT entry RGB', () => {
    const lut = buildColormapLUT('plasma');
    const values = new Float32Array([1.0]);
    const target = new Float32Array(3);
    applyColormapFromLUT(values, lut, target);

    const lastIdx = 255 * 4;
    expect(target[0]).toBeCloseTo(lut[lastIdx] / 255, 2);
    expect(target[1]).toBeCloseTo(lut[lastIdx + 1] / 255, 2);
    expect(target[2]).toBeCloseTo(lut[lastIdx + 2] / 255, 2);
  });

  it('produces output matching legacy d3-color path within epsilon', () => {
    // Use a representative set of values
    const count = 100;
    const values = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      values[i] = i / (count - 1);
    }

    const lut = buildColormapLUT('plasma');
    const lutTarget = new Float32Array(count * 3);
    applyColormapFromLUT(values, lut, lutTarget);

    const legacyTarget = new Float32Array(count * 3);
    applyColormapLegacy(values, 'plasma', legacyTarget);

    // Epsilon accounts for 256-entry LUT quantization: max error is bounded by
    // the colormap gradient * (1/255). For steep plasma gradients this reaches ~0.012.
    // Visually imperceptible (< 3 levels out of 255).
    const epsilon = 0.02;
    for (let i = 0; i < count * 3; i++) {
      expect(Math.abs(lutTarget[i] - legacyTarget[i])).toBeLessThanOrEqual(epsilon);
    }
  });
});
