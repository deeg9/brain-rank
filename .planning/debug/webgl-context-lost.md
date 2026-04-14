---
status: investigating
trigger: "THREE.WebGLRenderer: Context Lost on dashboard/processing pages"
created: 2026-04-13T00:00:00Z
updated: 2026-04-13T00:00:00Z
---

## Current Focus

hypothesis: Multiple Canvas instances (especially 2x BrainViewer in ComparisonModal) exhaust browser WebGL context limit, and no explicit cleanup/disposal is performed
test: Audit all Canvas mount points and trace navigation flows that accumulate contexts
expecting: Finding 2+ simultaneous Canvas instances or rapid mount/unmount without proper disposal
next_action: Implement fixes (see Resolution section)

## Symptoms

expected: 3D brain viewers render without errors on dashboard, processing, and results pages
actual: THREE.WebGLRenderer: Context Lost appearing multiple times; 3D brain viewers fail; Uncaught error from events-5a94e5eb.esm.js
errors: THREE.WebGLRenderer: Context Lost; Uncaught error at events-5a94e5eb.esm.js
reproduction: Navigate between processing and results pages, or open ComparisonModal from dashboard
started: Unknown — likely since ComparisonModal with 2x BrainViewer was added

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-04-13
  checked: Dashboard page (web/src/app/(app)/dashboard/page.tsx, DashboardGrid.tsx)
  found: Dashboard does NOT render any Canvas or 3D viewer. Uses VideoThumb (HTML video element) for thumbnails. No WebGL on dashboard page itself.
  implication: The dashboard is not the source of excessive WebGL contexts. Original hypothesis about "one per analysis card" is wrong.

- timestamp: 2026-04-13
  checked: Processing page (web/src/app/(app)/processing/page.tsx)
  found: Renders 1x ProcessingBrain via dynamic import. ProcessingBrain contains 1 Canvas with BrainViewerCanvas + EffectComposer/Bloom. Uses requestAnimationFrame for continuous animation with no frameloop control.
  implication: 1 WebGL context consumed on processing page.

- timestamp: 2026-04-13
  checked: Results page (web/src/app/(app)/results/[id]/page.tsx)
  found: Renders 1x BrainViewer via dynamic import. BrainViewer contains 1 Canvas with BrainViewerCanvas + EffectComposer/Bloom.
  implication: 1 WebGL context consumed on results page.

- timestamp: 2026-04-13
  checked: ComparisonModal (web/src/components/compare/ComparisonModal.tsx)
  found: Renders 2x BrainViewer side-by-side (one for Analysis A, one for Analysis B). Each BrainViewer creates its own Canvas. Modal is dynamically imported and mounted when user clicks Compare from dashboard.
  implication: ComparisonModal creates 2 WebGL contexts simultaneously. This is the highest context consumer in the app.

- timestamp: 2026-04-13
  checked: LightningShader (web/src/components/hero/LightningShader.tsx)
  found: Uses raw WebGL (not R3F Canvas) on welcome page only. Creates its own WebGL context from a regular canvas element. Only on /welcome, not in the app flow.
  implication: Not contributing to the bug in the dashboard/processing/results flow.

- timestamp: 2026-04-13
  checked: All Canvas components for cleanup/disposal
  found: No onCreated callback, no forceContextLoss, no gl.dispose, no renderer.dispose, no frameloop="demand" anywhere. R3F handles disposal internally on unmount (calls forceContextLoss), but the EffectComposer/Bloom post-processing creates additional render targets that may not be properly cleaned up.
  implication: Relying entirely on R3F's automatic cleanup, which may not handle post-processing resources (EffectComposer creates multiple framebuffers/render targets).

- timestamp: 2026-04-13
  checked: Web research on R3F context lost issues
  found: Well-documented R3F issue. Browser limits ~8-16 active WebGL contexts. R3F calls forceContextLoss on unmount (intentional). Known leak issues with EffectComposer/postprocessing. Best practice: keep single Canvas, swap contents; use frameloop="demand" to reduce GPU pressure; dispose resources explicitly.
  implication: The architecture of creating/destroying Canvas per page navigation and creating 2 simultaneous Canvases in ComparisonModal is the root problem.

## Resolution

root_cause: |
  Three contributing factors:
  1. ComparisonModal creates 2 simultaneous Canvas instances (2x BrainViewer side-by-side), consuming 2 WebGL contexts at once
  2. Navigation between processing->results destroys one Canvas and creates another without guaranteeing the old context is fully released (browser may delay reclamation)
  3. EffectComposer/Bloom post-processing creates additional render targets (framebuffers) inside each Canvas that may leak on unmount
  4. No frameloop control — all Canvases run at full animation speed even when not visible (e.g., ComparisonModal brain viewers keep rendering)
  
  The Uncaught error from events-5a94e5eb.esm.js is likely R3F's internal event system trying to operate on a lost context.

fix: |
  Recommended fixes (in priority order):
  
  **Fix 1 (High impact): Add explicit cleanup to BrainViewer and ProcessingBrain**
  - Add `onCreated` callback to Canvas to capture the gl context
  - On unmount, explicitly call `gl.dispose()`, `gl.forceContextLoss()`, and clean up EffectComposer
  - Example:
    ```tsx
    <Canvas
      onCreated={({ gl }) => {
        glRef.current = gl;
      }}
    >
    ```
    And in cleanup useEffect:
    ```tsx
    useEffect(() => {
      return () => {
        glRef.current?.dispose();
        glRef.current?.forceContextLoss();
        glRef.current?.domElement?.remove();
        glRef.current = null;
      };
    }, []);
    ```
  
  **Fix 2 (Medium impact): Use frameloop="demand" on ComparisonModal brain viewers**
  - The comparison brains don't need continuous animation
  - Add `frameloop="demand"` to Canvas in BrainViewer when used in comparison mode
  - This reduces GPU pressure and may prevent context eviction
  
  **Fix 3 (Medium impact): Reduce Canvas instances in ComparisonModal**
  - Option A: Use a single Canvas with two brain meshes side by side (portals)
  - Option B: Render static snapshots (canvas.toDataURL()) instead of live 3D in comparison
  - Option C: Only render one brain at a time with a toggle
  
  **Fix 4 (Low effort): Add WebGL context lost event handler**
  - Listen for 'webglcontextlost' event and attempt recovery
  - ```tsx
    gl={{ 
      alpha: true,
      onContextLost: (event) => {
        event.preventDefault(); // Prevent default behavior
        // Attempt to restore context
      }
    }}
    ```

verification: (pending)
files_changed: []
