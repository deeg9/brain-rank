# Phase 26: Research-Backed Neural Insights and Benchmark Engine - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a benchmark interpretation engine and research-backed insights UI to the Results Detail page. Transform raw brain activation scores into actionable, contextual insights grounded in published neuroscience research. Replace the current generic "Key Insights" section with smart analysis.

</domain>

<decisions>
## Implementation Decisions

### Benchmark Engine (Pure Logic — No UI)
- **D-01:** Create `web/src/lib/benchmark.ts` — pure functions, zero dependencies. Takes segment data + summary scores, returns structured insights.
- **D-02:** Define tier thresholds for each brain region on TRIBE v2's 0-1 scale:
  - **Elite (top 10%):** > 0.85
  - **Strong (top 25%):** 0.70 - 0.85
  - **Average:** 0.45 - 0.70
  - **Weak (bottom 25%):** 0.25 - 0.45
  - **Critical (bottom 10%):** < 0.25
  These are calibrated estimates based on the Stanford PNAS study + neuromarketing industry norms. Can be refined with real user data later.

- **D-03:** Hook Analysis function — isolate segments in 0-5s window:
  - High Reward (>0.70) + High Attention (>0.70) = "Strong viral hook"
  - High Reward + Low Attention = "Engaging but unfocused — tighten the visual"
  - Low Reward + High Attention = "Attention-grabbing but not satisfying — add payoff"
  - Low both = "Weak hook — consider a more surprising opener"
  - Based on Stanford finding: "NAcc + mPFC activity in first 4 seconds predicts virality"

- **D-04:** Drop-off Risk detection — find segments where Emotional Processing drops >30% from previous segment. These are scroll-away points (based on anterior insula / negative arousal research).

- **D-05:** Share Moment detection — find segments where Social Cognition peaks (local maxima above 0.70). Based on research: "mentalizing regions activate when viewers think about sharing."

- **D-06:** Flow State detection — find contiguous segments where BOTH Attention >0.60 AND Reward >0.60. These are the strongest segments (AIM framework: Affect + Integration).

- **D-07:** Overall Virality Score — weighted composite:
  - Hook strength (0-5s Reward + Attention): 30% weight
  - Retention (avg Attention across full video): 25% weight
  - Emotional arc (variance of Emotional Processing — higher variance = more engaging): 20% weight
  - Shareability (peak Social Cognition): 25% weight
  - Output as percentile tier: "Top 10%", "Top 25%", "Average", "Below Average"

### Insights Panel Component
- **D-08:** Replace current "Key Insights" section on Results Detail page with a new `InsightsPanel` component.
- **D-09:** Sections in the panel:
  1. **Virality Verdict** — overall score with tier badge and one-line summary
  2. **Hook Analysis** — 0-5s breakdown with per-region scores and interpretation
  3. **Key Moments** — timeline of detected Share Moments, Drop-off Risks, Flow States
  4. **Recommendations** — 2-3 actionable suggestions based on the weakest areas
- **D-10:** Visual style: use existing Card/glass-surface components, color-coded badges (tertiary for strong, primary for average, error for weak), neural-gradient on the virality score.

### Timeline Annotations
- **D-11:** Add colored zone markers on the NeuralTimeline x-axis:
  - Green zones = Flow State segments
  - Amber zones = transitions / neutral
  - Red zones = Drop-off Risk segments
- **D-12:** Add icon markers above the timeline at Share Moment timestamps (share icon) and Drop-off Risk timestamps (warning icon). These should be small, non-intrusive.

### Benchmark Comparison Cards
- **D-13:** Show 4 mini comparison cards below the insights panel:
  - Hook Strength: your score vs "viral average" (0.75 benchmark)
  - Retention Power: your score vs benchmark (0.60)
  - Shareability: your score vs benchmark (0.68)
  - Emotional Arc: your score vs benchmark (0.50 variance)
  Each card shows: your value, benchmark value, delta arrow (up/down), percentile tier label

### Research Attribution
- **D-14:** Small "Research basis" expandable section at the bottom of InsightsPanel citing: Stanford/PNAS 2020 viral prediction study, PNAS Nexus 2024 mega-analysis (16 fMRI datasets), Meta TRIBE v2 brain activation model. Builds credibility. One line per source with link.

### Claude's Discretion
- Exact wording of insight interpretations (should feel smart but not academic)
- Animation/transitions for the insights panel
- Whether benchmark comparison cards are in a row or 2x2 grid
- How to handle edge cases (very short videos, single-segment videos)

</decisions>

<canonical_refs>
## Canonical References

### Research Sources (encode into benchmark logic)
- Stanford PNAS 2020: "Brain activity forecasts video engagement" — NAcc + mPFC in first 4s predicts virality, anterior insula predicts drop-off
- PNAS Nexus 2024 mega-analysis: Reward + Social Cognition activation = message effectiveness
- AMA 2025: Emotion is early predictor, social cognition becomes dominant over time
- Neurons Inc: Attention scores >65 = +59% CTR improvement

### Existing Code
- `web/src/app/(app)/results/[id]/page.tsx` — Results Detail page (parent)
- `web/src/components/results/NeuralTimeline.tsx` — Timeline to add zone annotations
- `web/src/components/results/RegionBreakdown.tsx` — Region color config
- `web/src/components/results/SegmentTable.tsx` — SegmentData types
- `web/src/lib/results.ts` — Existing results utilities

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SegmentData` type with `regions: { attention, reward, emotional_processing, social_cognition }`
- `ResultsData.summary` with `overall`, `hook_score`, `retention_score`, `peak_second`, `peak_score`
- `formatTimestamp` utility
- `TRACK_CONFIG` with colors for all 4 regions
- CSS utilities: `glass-surface`, `glow-primary`, `animate-score-in`, `neural-gradient`

### Integration Points
- InsightsPanel replaces "Key Insights" section (~line 229-280 of results/[id]/page.tsx)
- Timeline annotations added to NeuralTimeline.tsx (new optional props)
- Benchmark cards added below InsightsPanel in the page layout
- BenchmarkEngine is a pure utility — no component, imported by page

</code_context>

<specifics>
## Specific Ideas

- The insights should feel like having a neuroscience advisor looking at your video — smart, specific, actionable
- "Your hook activates reward centers at 87% — that's stronger than 85% of viral content" is better than "High score in first 5 seconds"
- Recommendations should be concrete: "Your emotional engagement drops 40% at 1:23 — consider adding a pattern interrupt (cut, zoom, or music change) to re-engage viewers"
- The virality verdict should feel like a grade/report card — satisfying to see, motivating to improve

</specifics>

<deferred>
## Deferred Ideas

- Historical comparison (how this video compares to user's previous videos)
- Industry benchmarks by content category (education, entertainment, etc.)
- AI-generated edit suggestions with timestamps
- Export insights as PDF report

</deferred>

---

*Phase: 26-research-backed-neural-insights-and-benchmark-engine*
*Context gathered: 2026-04-10*
