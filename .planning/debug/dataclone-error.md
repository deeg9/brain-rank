---
status: investigating
trigger: "DataCloneError: Failed to execute 'measure' on 'Performance': Data cannot be cloned, out of memory"
created: 2026-04-13T00:00:00Z
updated: 2026-04-13T00:00:00Z
---

## Current Focus

hypothesis: ProcessingBrain.tsx calls setState(new Float32Array(61452)) inside requestAnimationFrame at ~60fps, creating ~60 large allocations/sec. Each setState triggers a React re-render of the entire component tree. Turbopack's dev-mode performance instrumentation (performance.measure) tries to structured-clone these large typed arrays for its tracing/profiling pipeline, which exhausts memory and throws DataCloneError.
test: Confirmed by code reading -- line 118 of ProcessingBrain.tsx does `setRegionColors(new Float32Array(buf))` inside a rAF loop
expecting: Removing the setState from the animation loop (using a ref instead) will eliminate the error
next_action: Apply fix -- replace useState with useRef for regionColors in ProcessingBrain.tsx

## Symptoms

expected: Processing page renders 3D brain viewer without errors
actual: Runtime DataCloneError: Failed to execute 'measure' on 'Performance': Data cannot be cloned, out of memory
errors: DataCloneError: Failed to execute 'measure' on 'Performance': Data cannot be cloned, out of memory
reproduction: Visit localhost:3000/processing?jobId=... -- happens every time
started: Present since ProcessingBrain component was added

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-04-13T00:01:00Z
  checked: ProcessingBrain.tsx animation loop (lines 98-124)
  found: |
    Line 118: `setRegionColors(new Float32Array(buf))` is called inside requestAnimationFrame.
    VERTEX_COUNT = 20,484. Each Float32Array is VERTEX_COUNT * 3 = 61,452 floats = ~240KB.
    This creates a NEW 240KB Float32Array and triggers a React setState ~60 times per second.
    That is ~14.4MB/sec of allocations that all flow through React's reconciler.
  implication: This is a textbook R3F anti-pattern -- setState inside an animation loop causes massive re-renders and memory pressure.

- timestamp: 2026-04-13T00:02:00Z
  checked: React Three Fiber performance pitfalls documentation
  found: |
    R3F docs explicitly warn: "Never, ever, setState animations! Instead, use refs and mutate!"
    "Setting state in useFrame means you are pumping 60 component updates per second through React,
    60 times per second where it has to diff for changes, execute all hooks, then render."
  implication: The ProcessingBrain component violates this core R3F principle.

- timestamp: 2026-04-13T00:03:00Z
  checked: Turbopack memory behavior in dev mode
  found: |
    Turbopack dev server instruments React renders with performance.measure() for its tracing pipeline.
    When React re-renders 60x/sec with 240KB typed arrays as props, Turbopack's instrumentation
    attempts to structured-clone these objects. Structured clone of typed arrays is O(n) copy.
    At 60fps this means ~14.4MB/sec of cloning overhead ON TOP of the 14.4MB/sec of allocations.
    Combined: ~28.8MB/sec of transient memory, overwhelming the structured clone budget.
  implication: The error is a Turbopack dev-mode amplification of an underlying R3F anti-pattern. The root cause is the setState-in-rAF pattern, not Turbopack itself.

- timestamp: 2026-04-13T00:04:00Z
  checked: BrainGlowMesh.tsx (the consumer of regionColors)
  found: |
    BrainGlowMesh already uses useFrame() for its shimmer animation and directly mutates
    colorBuffer via typed array writes (lines 106-153). It reads regionColors in a useEffect
    (line 79-95) to set baseColorBuffer, then the useFrame loop handles per-frame updates.
    This means regionColors does NOT need to change every frame -- it only needs to change
    when the target activation pattern changes (every 800ms per the interval on line 91-95).
  implication: The fix is straightforward -- update regionColors via ref, not state, and only trigger a React re-render when the vertex map loads or the component mounts.

## Resolution

root_cause: |
  ProcessingBrain.tsx line 118 calls `setRegionColors(new Float32Array(buf))` inside a
  requestAnimationFrame loop running at ~60fps. This creates a new 240KB Float32Array and
  triggers a full React re-render 60 times per second. In Turbopack dev mode, each re-render
  is instrumented via performance.measure(), which attempts to structured-clone the component
  props/state including the large typed array. The combination of 60fps React re-renders with
  240KB typed arrays overwhelms the structured clone budget, causing:
  "DataCloneError: Failed to execute 'measure' on 'Performance': Data cannot be cloned, out of memory"

  This is a well-documented React Three Fiber anti-pattern: never call setState inside an
  animation loop. The BrainGlowMesh consumer already handles per-frame updates via useFrame
  and direct buffer mutation -- it does not need React state to drive the animation.

fix: |
  Replace the useState-based animation with a ref-based approach in ProcessingBrain.tsx:

  1. Change `const [regionColors, setRegionColors] = useState<Float32Array | null>(null)`
     to `const regionColorsRef = useRef<Float32Array | null>(null)`

  2. In the animation loop (line 118), replace:
       `setRegionColors(new Float32Array(buf))`
     with:
       `regionColorsRef.current = buf` (reuse the same buffer, no allocation)

  3. The BrainGlowMesh already handles per-frame visual updates via useFrame --
     it only needs the regionColors reference to set its baseColorBuffer once when
     the colors meaningfully change.

  4. To trigger the initial render and subsequent region changes, use a simple
     counter state that increments only when the vertex map loads or activation
     pattern changes (every 800ms), NOT every frame.

  Alternative simpler fix: Since BrainGlowMesh.useFrame already does per-frame
  shimmer, just pass the regionColors buffer as a ref and let BrainGlowMesh read
  from it each frame. No React re-renders needed for the animation at all.

verification: (pending)
files_changed:
  - web/src/components/results/ProcessingBrain.tsx
