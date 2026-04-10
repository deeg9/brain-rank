import { describe, it, expect } from "vitest";
import { decodeVertexData, VERTEX_COUNT } from "./vertex-codec";

describe("VERTEX_COUNT", () => {
  it("equals 20484", () => {
    expect(VERTEX_COUNT).toBe(20_484);
  });
});

describe("decodeVertexData", () => {
  /**
   * Helper: create a base64 string from a Uint8Array.
   * Uses btoa with binary string conversion (same as browser).
   */
  function toBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  it("decodes a known base64 string to Float32Array of correct length", () => {
    const input = new Uint8Array(VERTEX_COUNT);
    // Fill with a pattern
    for (let i = 0; i < VERTEX_COUNT; i++) {
      input[i] = i % 256;
    }
    const b64 = toBase64(input);
    const result = decodeVertexData(b64);

    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(VERTEX_COUNT);
  });

  it("normalizes decoded values to [0, 1] range", () => {
    const input = new Uint8Array(VERTEX_COUNT);
    input[0] = 0;
    input[1] = 128;
    input[2] = 255;
    const b64 = toBase64(input);
    const result = decodeVertexData(b64);

    expect(result[0]).toBeCloseTo(0 / 255, 5);
    expect(result[1]).toBeCloseTo(128 / 255, 5);
    expect(result[2]).toBeCloseTo(255 / 255, 5);
  });

  it("throws on empty string", () => {
    expect(() => decodeVertexData("")).toThrow("vertex_data is empty");
  });

  it("throws on wrong length", () => {
    const input = new Uint8Array(100);
    const b64 = toBase64(input);
    expect(() => decodeVertexData(b64)).toThrow(
      `Expected ${VERTEX_COUNT} vertices, got 100`
    );
  });

  it("roundtrip: encode uint8 values to base64, decode, verify accuracy", () => {
    const input = new Uint8Array(VERTEX_COUNT);
    for (let i = 0; i < VERTEX_COUNT; i++) {
      input[i] = Math.floor(Math.random() * 256);
    }
    const b64 = toBase64(input);
    const result = decodeVertexData(b64);

    for (let i = 0; i < VERTEX_COUNT; i++) {
      expect(result[i]).toBeCloseTo(input[i] / 255, 5);
    }
  });
});
