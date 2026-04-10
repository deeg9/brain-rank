/** Number of cortical vertices in fsaverage5 mesh (both hemispheres). */
export const VERTEX_COUNT = 20_484;

/**
 * Decode a base64-encoded uint8 vertex activation payload into a
 * normalized Float32Array with values in [0, 1].
 *
 * The backend quantizes float32 activations (already in [0,1]) to uint8
 * by multiplying by 255. This function reverses that: uint8 / 255 -> float32.
 *
 * @param base64 - Base64 string from segment.vertex_data
 * @returns Float32Array of length VERTEX_COUNT with values in [0, 1]
 * @throws Error if decoded length does not match VERTEX_COUNT
 */
export function decodeVertexData(base64: string): Float32Array {
  if (!base64) {
    throw new Error("vertex_data is empty");
  }

  // Decode base64 to binary
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  if (bytes.length !== VERTEX_COUNT) {
    throw new Error(
      `Expected ${VERTEX_COUNT} vertices, got ${bytes.length}`
    );
  }

  // Normalize uint8 [0,255] -> float32 [0,1]
  const floats = new Float32Array(VERTEX_COUNT);
  for (let i = 0; i < VERTEX_COUNT; i++) {
    floats[i] = bytes[i] / 255;
  }

  return floats;
}
