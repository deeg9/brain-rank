import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupVideoTimeSync } from './useVideoTime';

describe('useVideoTime (via setupVideoTimeSync)', () => {
  let originalRAF: typeof globalThis.requestAnimationFrame;
  let originalCAF: typeof globalThis.cancelAnimationFrame;

  beforeEach(() => {
    originalRAF = globalThis.requestAnimationFrame;
    originalCAF = globalThis.cancelAnimationFrame;
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRAF;
    globalThis.cancelAnimationFrame = originalCAF;
  });

  it('calls requestVideoFrameCallback when available on video element', () => {
    const mockRVFC = vi.fn().mockReturnValue(42);
    const video = {
      requestVideoFrameCallback: mockRVFC,
      cancelVideoFrameCallback: vi.fn(),
    } as unknown as HTMLVideoElement;

    const onTimeUpdate = vi.fn();
    setupVideoTimeSync(video, onTimeUpdate);

    expect(mockRVFC).toHaveBeenCalledTimes(1);
    expect(mockRVFC).toHaveBeenCalledWith(expect.any(Function));
  });

  it('falls back to requestAnimationFrame when requestVideoFrameCallback is absent', () => {
    const mockRAF = vi.fn().mockReturnValue(99);
    globalThis.requestAnimationFrame = mockRAF;

    const video = {
      paused: false,
      currentTime: 5.5,
    } as unknown as HTMLVideoElement;

    const onTimeUpdate = vi.fn();
    setupVideoTimeSync(video, onTimeUpdate);

    expect(mockRAF).toHaveBeenCalledTimes(1);
    expect(mockRAF).toHaveBeenCalledWith(expect.any(Function));
  });

  it('cleanup cancels the registered callback (rVFC path)', () => {
    const mockRVFC = vi.fn().mockReturnValue(42);
    const mockCancelVFC = vi.fn();
    const video = {
      requestVideoFrameCallback: mockRVFC,
      cancelVideoFrameCallback: mockCancelVFC,
    } as unknown as HTMLVideoElement;

    const onTimeUpdate = vi.fn();
    const cleanup = setupVideoTimeSync(video, onTimeUpdate);

    cleanup();
    expect(mockCancelVFC).toHaveBeenCalledWith(42);
  });

  it('cleanup cancels requestAnimationFrame (rAF fallback path)', () => {
    const mockRAF = vi.fn().mockReturnValue(77);
    const mockCAF = vi.fn();
    globalThis.requestAnimationFrame = mockRAF;
    globalThis.cancelAnimationFrame = mockCAF;

    const video = {
      paused: true,
      currentTime: 0,
    } as unknown as HTMLVideoElement;

    const onTimeUpdate = vi.fn();
    const cleanup = setupVideoTimeSync(video, onTimeUpdate);

    cleanup();
    expect(mockCAF).toHaveBeenCalledWith(77);
  });

  it('invokes onTimeUpdate with mediaTime when rVFC callback fires', () => {
    let capturedCallback: (now: number, metadata: { mediaTime: number }) => void;
    const mockRVFC = vi.fn().mockImplementation((cb) => {
      capturedCallback = cb;
      return 1;
    });
    const video = {
      requestVideoFrameCallback: mockRVFC,
      cancelVideoFrameCallback: vi.fn(),
    } as unknown as HTMLVideoElement;

    const onTimeUpdate = vi.fn();
    setupVideoTimeSync(video, onTimeUpdate);

    // Simulate the browser calling our callback
    capturedCallback!(performance.now(), { mediaTime: 3.14 });

    expect(onTimeUpdate).toHaveBeenCalledWith(3.14);
  });
});
