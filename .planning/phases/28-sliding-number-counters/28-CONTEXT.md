# Phase 28: Sliding Number Counters - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Brain activation scores on the results page animate into view with spring-physics number counters instead of appearing as static text. Adapts the 21st.dev "Sliding Number" component.

</domain>

<decisions>
## Implementation Decisions

### Component Design
- Create a SlidingNumber component based on the 21st.dev pattern: Framer Motion useSpring + useTransform for digit-by-digit animation
- Each digit slot uses a spring animation to slide between values
- Support decimal numbers (brain activation scores like 87.3)
- Component accepts `value: number` prop and animates from 0 to target

### Integration Points
- Replace static number displays in MetricCard component on the results page
- Replace static numbers in BenchmarkCards component
- Animation should trigger on mount or when score values enter viewport (useInView)
- Must work with existing Space Grotesk font and design token colors

### Claude's Discretion
- Exact spring physics parameters (stiffness, damping, mass)
- Whether to use intersection observer for viewport triggering vs mount-only
- Component file location and naming

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- web/src/lib/utils.ts — cn() utility (just installed in Phase 27)
- web/src/components/results/ — MetricCard, BenchmarkCards, ActivationTimeline components
- framer-motion, react-use-measure already installed

### Established Patterns
- Components use TypeScript interfaces for props
- Design tokens: --primary (#ba9eff), --secondary (#5af8fb), --surface (#0e0e10)
- Font: Space Grotesk for headlines/numbers, Inter for body

### Integration Points
- web/src/app/results/[id]/page.tsx — results page that renders metrics
- MetricCard and BenchmarkCards — primary targets for sliding numbers

</code_context>

<specifics>
## Specific Ideas

The 21st.dev SlidingNumber component uses this pattern:
- Framer Motion motionValue + useSpring for smooth digit transitions
- Each digit renders in a fixed-width container with overflow hidden
- Digits slide vertically through 0-9 positions based on spring value
- react-use-measure for measuring digit heights

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
