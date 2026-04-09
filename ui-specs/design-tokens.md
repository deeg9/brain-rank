# Design Tokens Reference

Single-source-of-truth for all design tokens used across NeuroCut's UI. Extracted from [DESIGN.md](../DESIGN.md) and validated against the 5 canonical screen specs.

Referenced by [components.md](components.md) -- components use token names, not raw values.

---

## 1. Color Tokens

### Surface Hierarchy

The palette uses Tonal Layering to create depth without borders. Each surface level creates visual separation through background shifts.

| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `surface` | `#0e0e10` | The canvas | Base page background, top bar background |
| `surface-container-lowest` | `#000000` | Recessed elements | Creates "recessed" feel when placed on `surface-container-low` |
| `surface-container-low` | `#131315` | Navigation, sidebars | Sidebar nav background, timeline track background |
| `surface-container` | `#19191c` | Primary editor/timeline area | Main content area, active nav item background |
| `surface-container-high` | `#1f1f22` | Floating/actionable elements | Card backgrounds, elevated panels, skeleton shimmer highlight |
| `surface-container-highest` | `#262528` | Most elevated elements | Secondary button fills, credit badge background, disabled CTA |
| `surface-bright` | 60% opacity + 20px backdrop blur | Glassmorphism | Glass panels (Upload cost estimate, Processing progress container), active list item states |

### Accent Colors

| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `primary` | `#ba9eff` | Electric Purple -- main brand accent | Active nav border, CTA gradient start, primary button text-on-dark, attention track color |
| `primary-dim` | `#8455ef` | Gradient endpoint | Neural-gradient end, playhead color, CTA gradient end |
| `primary-container` | (derived from primary) | Neural chip backgrounds | Tag/chip backgrounds for AI categories |
| `on-primary-container` | (derived) | Neural chip text | Text on `primary-container` backgrounds |
| `secondary` | `#5af8fb` | Cyan/Teal -- AI processing | Stable engagement timeline segments, emotional processing track, input field focus border, processing stage icon |
| `secondary-fixed` | `#5af8fb` | Standard AI processing indicator | Same value as secondary; used in semantic contexts |
| `tertiary` | `#9bffce` | Emerald green -- high engagement/success | High engagement timeline, reward track, complete states, Upgrade button pill, success indicators |
| `error` | `#ff6e84` | Crimson -- low engagement/errors | Drop-off timeline segments, failed states, validation errors, attention drop tags |

### Text Colors

| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `on-surface` | `#f6f3f5` | Primary text | Headlines, body text, active labels. NOT 100% white -- reduces eye strain in dark environment |
| `on-surface-variant` | `#acaaad` | Secondary/muted text | Inactive nav items, timestamps, metadata, subtitles, social cognition track (muted) |
| `on-background` | 4% opacity shadow | Shadow color | Ambient shadow tint for floating menus |

### Outline

| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `outline-variant` | 15% opacity (ghost border) | Subtle boundaries | Ghost borders on secondary buttons, card edges when separator needed for accessibility |

### Design Rules

**The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning content. All boundaries must be created through background shifts between surface tiers. The only exception is the active nav item's left border accent (2px, `primary`).

**The "Glass & Gradient" Rule:** Main CTAs and "AI Insight" cards use glassmorphism (`surface-bright` at 60% opacity with `20px` backdrop blur) for modals and floating toolbars. Neural-gradient transitions (from `primary` to `primary-dim`) are used for progress bars and primary action buttons to simulate energy flow.

**The "Ghost Border" Rule:** If a separator is absolutely required for accessibility, use `outline-variant` at 15% opacity. This creates a "suggestion" of a boundary that does not clutter the high-density workspace.

**No Pure White Text:** Always use `on-surface` (`#f6f3f5`) or `on-surface-variant` (`#acaaad`). Never use `#ffffff`.

**No Standard Blue:** Do not use standard blue for links or actions. Use Electric Purple (`primary`) or Teal (`secondary`) instead.

---

## 2. Typography Tokens

### Font Families

| Token | Font | Role | Usage |
|-------|------|------|-------|
| `font-display` | Space Grotesk | Technical Editorial -- display and headlines | Hero metrics, section headers, numerical data readouts, score displays |
| `font-body` | Inter | Workhorse -- body and labels | Body text, labels, descriptions, compact information, timestamps |
| `font-mono` | (system monospace) | Code/log display | Inference log panel timestamps and messages |

### Type Scale

| Token | Role | Usage |
|-------|------|-------|
| `display-lg` | Hero metrics | Large score values in metric cards (e.g., "78", "84"), primary data callouts |
| `headline-lg` | Major titles | Page titles ("Upload Analysis", "Analysis History"), empty state headlines |
| `headline-sm` | Section headers | Component section titles, panel headers, card group labels |
| `body-md` | Descriptions | Body text, descriptions, recommendation content, supporting paragraphs |
| `body-sm` | Compact information | Dense data labels, card subtitles, high-density workspace text |
| `label-sm` | Timestamps, metadata | Log timestamps, time markers on timeline, data tags, small metadata |

### Typography Rules

**The "Leaps of Scale" Rule:** Never use two font sizes that are only 2px apart. Create visual tension and hierarchy through deliberate scale jumps. For example, pair `headline-lg` title with `body-md` description -- never `headline-lg` with `headline-sm` as adjacent elements.

**Numerical Data:** Use `Space Grotesk` (`font-display`) for all numerical data to give it a "dashboard of the future" aesthetic. This includes scores, percentages, timestamps in metric cards, and timeline axis labels.

**High-Density Embrace:** Professional editors want maximum data density. Use `body-sm` and `label-sm` to keep information compact without sacrificing legibility (Inter handles this well at small sizes).

---

## 3. Spacing Tokens

### Layout

| Token | Value | Usage |
|-------|-------|-------|
| `sidebar-width` | 256px (w-64) | Fixed sidebar nav width on all screens |
| `content-max-width-wide` | max-w-7xl | Upload screen main content area |
| `content-max-width-narrow` | max-w-4xl | Processing screen centered content |
| `grid-columns` | 12 | Results screens column grid system |

### Padding and Gaps

| Token | Value | Usage |
|-------|-------|-------|
| `card-padding-sm` | 16px | Compact card/list internal padding, list item separation |
| `card-padding-md` | 24px | Standard card/list internal padding |
| `section-gap` | 16-24px | Vertical gaps between major content sections |

**Cards & Lists Rule:** Strictly no divider lines between list items. Use 16px or 24px vertical padding and subtle background shifts (`surface-container` to `surface-container-high`) to denote different items.

### Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 2px | Neural chips/tags -- technical/robotic feel |
| `rounded-md` | 6px | Internal UI elements, small buttons |
| `rounded-lg` | 8px | Standard buttons, progress bars, most interactive elements |
| `rounded-xl` | 12px | Main video preview window, glass panels, cards, drop zones |
| `rounded-full` | 9999px | Status badge pills, credit pills |

**Rounding Rule:** Use `rounded-xl` (12px) for the main video preview window, but keep internal UI elements at `rounded-lg` (8px) or `rounded-md` (6px) to maintain a technical edge.

---

## 4. Elevation Tokens

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-ambient` | 32px blur, 0px offset, `on-background` at 4% opacity | Floating menus, elevated panels. Feels like soft glow, not dark smudge. |
| `shadow-glow` | Neural-gradient tint with blur | Active progress bar fill, CTA hover state |

### Layering Principle

Depth is created through tonal shifts between surface tiers, not through shadows.

| Effect | Technique | Example |
|--------|-----------|---------|
| Recessed | `surface-container-lowest` on `surface-container-low` | Inset panels, embedded content |
| Lifted | `surface-container-high` on `surface` | Cards, floating elements |
| Prominent | `surface-container-highest` on any lower tier | Active controls, elevated badges |

**No Heavy Shadows:** Never use pitch-black drop shadows. They look cheap. Rely on tonal shifts between surface tiers for all depth cues except floating menus (which use `shadow-ambient`).

---

## 5. Semantic Mappings

Design tokens mapped to their product-specific meaning across NeuroCut's UI.

### Timeline Engagement Colors

| Condition | Token | Hex | Trigger |
|-----------|-------|-----|---------|
| High engagement | `tertiary` | `#9bffce` | `activation_score > 0.7` |
| Stable engagement | `secondary` | `#5af8fb` | `activation_score 0.4-0.7` |
| Drop-off | `error` | `#ff6e84` | `activation_score < 0.4` |

### Brain Region Track Colors

| Region | Token | Hex |
|--------|-------|-----|
| Attention | `primary` | `#ba9eff` |
| Reward | `tertiary` | `#9bffce` |
| Emotional Processing | `secondary` | `#5af8fb` |
| Social Cognition | `on-surface-variant` | `#acaaad` (muted) |

### Neural-Gradient

- **Definition:** `linear-gradient(primary, primary-dim)` = `linear-gradient(#ba9eff, #8455ef)`
- **Used for:** Progress bar fills, CTA button backgrounds, "energy flow" visual motif
- **Screens:** Upload (CTA, upload progress), Processing (job progress bar)

### Active Navigation

- **Left border:** 2px solid `primary` (`#ba9eff`)
- **Background:** `surface-container` (`#19191c`)
- **Icon:** Filled variant
- **Text:** Bold, `on-surface` (`#f6f3f5`)

### Status Semantic Colors

| Status | Token | Usage |
|--------|-------|-------|
| Success / Complete | `tertiary` | Green badge, 100% progress, "Done" stage checkmark |
| Processing / Active | `secondary` | Cyan badge, processing stage icon, input focus |
| Warning / Queued | `outline-variant` (muted) | Waiting states, grey pending icons |
| Error / Failed | `error` | Red badge, validation errors, failed progress bars |
| Brand / Primary | `primary` | Active nav, CTA gradient start, primary actions |

### Neural Moment Tag Colors (aspirational)

| Tag Type | Token | Icon |
|----------|-------|------|
| Strong Hook | `tertiary` | bolt |
| Peak Engagement | `primary` | star |
| Emotional Spike | `secondary` | heart |
| Attention Drop | `error` | trending_down |
| Social Moment | `on-surface-variant` | groups |

### Input Fields

- **Background:** `surface-container-low` (`#131315`)
- **Border:** Bottom-only 1px (exception to No-Line Rule for inputs)
- **Focus:** Bottom border illuminates to `secondary` (`#5af8fb`)
- **No traditional box borders** on inputs

---

## 6. Validation Notes

### Tokens from DESIGN.md confirmed in screen specs

All surface hierarchy tokens (`surface` through `surface-container-highest`) are actively used across screen layouts. The `primary`, `secondary`, `tertiary`, and `error` accent colors are used extensively in timeline visualizations, status indicators, and navigation. Typography tokens (`Space Grotesk` for display, `Inter` for body) are referenced in all component styling sections.

### Tokens in DESIGN.md with limited/no explicit spec usage

| Token | DESIGN.md Section | Spec Status | Notes |
|-------|-------------------|-------------|-------|
| `surface-container-lowest` (`#000000`) | Section 2 (Layering) | Not explicitly referenced in any screen spec | Defined for "recessed" effect; no screen currently uses a recessed container pattern |
| `primary-container` | Section 5 (Neural Chips) | Not explicitly referenced | Neural chips are described in DESIGN.md but no screen spec defines a neural chip component |
| `on-primary-container` | Section 5 (Neural Chips) | Not explicitly referenced | Same as above -- chip text color |
| `surface-bright` opacity value | Section 2 (Glass Rule) | Referenced indirectly | Upload and Processing specs mention "glass panel" but don't specify the exact 60%/20px values -- those come from DESIGN.md |

### Colors used in specs without explicit DESIGN.md token

| Usage | Spec | Color | Suggested Token |
|-------|------|-------|-----------------|
| Drop zone border on dragover | Upload (01) | `primary/50` (50% opacity primary) | Could be defined as `primary-hover` |
| Job card hover border | Dashboard (05) | `primary/30` (30% opacity primary) | Could be defined as `primary-subtle` |
| Drop zone dashed border | Upload (01) | `outline-variant/30` | Opacity variant of existing ghost border token |
| Stage "waiting" opacity | Processing (02) | 30% opacity on elements | General `opacity-muted` token not defined |

### Discrepancy Notes

1. **Input field bottom border:** DESIGN.md's "No-Line Rule" prohibits 1px solid borders, but DESIGN.md Section 5 explicitly allows a 1px bottom-border for input fields that illuminates on focus. This is an intentional exception within the design system itself.

2. **Active nav left border:** The 2px left border accent on active nav items appears in all screen specs but is not explicitly called out as a No-Line Rule exception in DESIGN.md. It functions as a visual indicator rather than a sectioning border, so it aligns with the rule's intent.

3. **Drop zone dashed border:** Upload spec uses a dashed border for the drop zone. DESIGN.md prohibits solid borders but does not address dashed/dotted borders. The dashed style serves a functional purpose (affordance for drop target) rather than sectioning, so it is compatible with the design system's intent.
