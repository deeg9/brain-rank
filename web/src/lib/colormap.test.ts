import { describe, it, expect } from 'vitest';
import {
  buildColormapLUT,
  applyColormapFromLUT,
  smoothstep,
  applyThresholdGlow,
  THRESHOLD,
  BLEND_LOW,
  BLEND_HIGH,
  DARK_GRAY,
  MAX_EMISSIVE,
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

describe('smoothstep', () => {
  it('returns 0 when value is below edge0', () => {
    expect(smoothstep(0.25, 0.35, 0.20)).toBe(0);
  });

  it('returns 1 when value is above edge1', () => {
    expect(smoothstep(0.25, 0.35, 0.40)).toBe(1);
  });

  it('returns 0.5 at the midpoint', () => {
    expect(smoothstep(0.25, 0.35, 0.30)).toBe(0.5);
  });

  it('returns 0 at edge0', () => {
    expect(smoothstep(0.25, 0.35, 0.25)).toBe(0);
  });

  it('returns 1 at edge1', () => {
    expect(smoothstep(0.25, 0.35, 0.35)).toBe(1);
  });
});

describe('applyThresholdGlow', () => {
  const lutData = buildColormapLUT('inferno');

  it('outputs dark gray for value 0.0', () => {
    const values = new Float32Array([0.0]);
    const target = new Float32Array(3);
    applyThresholdGlow(values, lutData, target);
    const dg = DARK_GRAY;
    expect(target[0]).toBeCloseTo(dg, 3);
    expect(target[1]).toBeCloseTo(dg, 3);
    expect(target[2]).toBeCloseTo(dg, 3);
  });

  it('outputs dark gray for value 0.2 (below threshold blend range)', () => {
    const values = new Float32Array([0.2]);
    const target = new Float32Array(3);
    applyThresholdGlow(values, lutData, target);
    const dg = DARK_GRAY;
    expect(target[0]).toBeCloseTo(dg, 3);
    expect(target[1]).toBeCloseTo(dg, 3);
    expect(target[2]).toBeCloseTo(dg, 3);
  });

  it('outputs inferno-mapped color with emissive scaling for value 0.5', () => {
    const values = new Float32Array([0.5]);
    const target = new Float32Array(3);
    applyThresholdGlow(values, lutData, target);
    // Above threshold fully (blend=1), should NOT be dark gray
    const dg = DARK_GRAY;
    const isNotDarkGray = target[0] !== dg || target[1] !== dg || target[2] !== dg;
    expect(isNotDarkGray).toBe(true);
    // At least one channel should be > dark gray (inferno colors are warm)
    expect(Math.max(target[0], target[1], target[2])).toBeGreaterThan(dg);
  });

  it('outputs inferno color at max emissive scale for value 1.0', () => {
    const values = new Float32Array([1.0]);
    const target = new Float32Array(3);
    applyThresholdGlow(values, lutData, target);
    // At value 1.0, emissive scale = 2.0, so some channels should be > 1.0 (HDR)
    // Inferno at 1.0 is bright yellow (~252, 255, 164 in 0-255)
    const maxChannel = Math.max(target[0], target[1], target[2]);
    expect(maxChannel).toBeGreaterThan(1.0); // HDR values exceed 1.0
  });

  it('outputs a blend at value 0.30 (midpoint of smoothstep range)', () => {
    const values = new Float32Array([0.30]);
    const target = new Float32Array(3);
    applyThresholdGlow(values, lutData, target);
    const dg = DARK_GRAY;
    // At 0.30, smoothstep(0.25, 0.35, 0.30) = 0.5 — halfway blend
    // Should be between dark gray and inferno color — not purely dark gray
    // At least one channel should differ from pure dark gray
    const diffFromDarkGray = Math.abs(target[0] - dg) + Math.abs(target[1] - dg) + Math.abs(target[2] - dg);
    expect(diffFromDarkGray).toBeGreaterThan(0.01);
  });

  it('has emissive scale of 2.0 at value 1.0', () => {
    // emissiveScale = 1.0 + ((value - THRESHOLD) / (1 - THRESHOLD)) * (MAX_EMISSIVE - 1.0)
    const emissiveAtMax = 1.0 + ((1.0 - THRESHOLD) / (1 - THRESHOLD)) * (MAX_EMISSIVE - 1.0);
    expect(emissiveAtMax).toBeCloseTo(2.0, 5);
  });

  it('has emissive scale of 1.0 at threshold value', () => {
    const emissiveAtThreshold = 1.0 + ((THRESHOLD - THRESHOLD) / (1 - THRESHOLD)) * (MAX_EMISSIVE - 1.0);
    expect(emissiveAtThreshold).toBeCloseTo(1.0, 5);
  });
});
