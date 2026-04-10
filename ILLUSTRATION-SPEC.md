# NeuroCut Illustration Spec Sheet

> For generation with Google Nano Banana / Imagen.
> Cross-referenced from Stitch designs (Project 15366884645778091653) vs current codebase.

---

## 7 Illustrations Needed for NeuroCut

| # | Illustration | Description | Where Used |
|---|-------------|-------------|------------|
| 1 | Welcome hero | An abstract neural network visualization — dark background (#0e0e10), glowing purple synaptic tendrils (#ba9eff) branching outward from a central node, with subtle cyan (#5af8fb) energy pulses along the connections. Ethereal, cinematic, like looking into a digital brain. Should feel premium and "neural" — not a generic brain clip art. Organic, flowing lines with depth-of-field blur at edges. | Welcome/Onboarding page — hero image above "Welcome to NeuroCut" heading |
| 2 | Login ambient | A dark, atmospheric neural landscape — abstract synaptic connections glowing faintly in deep space. Mostly dark (#0e0e10 to #131315) with very subtle purple (#ba9eff at 20% opacity) and cyan (#5af8fb at 10% opacity) light traces. Should feel like a background texture, not a focal illustration. Moody, cinematic, understated. | Login page — decorative image below the sign-in card |
| 3 | Dashboard video thumb 1 | A cinematic still frame of abstract flowing colors — purple, teal, and magenta gradients swirling like paint in water. Dark base. Should look like a creative video thumbnail for "Neural_Flow_Master_v2.mp4". | Dashboard — video card thumbnail placeholder 1 |
| 4 | Dashboard video thumb 2 | A cinematic still of vibrant neon light trails — electric pink and green streaks against a dark urban backdrop. Should look like a social media video thumbnail for "Social_Hook_Testing_A.mov". | Dashboard — video card thumbnail placeholder 2 |
| 5 | Dashboard video thumb 3 | A cinematic still of a person in motion with dramatic editorial color grading — deep teal and warm orange tones. Silhouetted figure against moody backdrop. Should look like a creative video thumbnail for "Editorial_Cut_Final_Rev.mp4". | Dashboard — video card thumbnail placeholder 3 |
| 6 | Empty state brain | A minimal, elegant illustration of a resting neural network — a single brain-shaped node cluster with dim, inactive connections. Gentle purple (#ba9eff at 30%) glow. Feels like a sleeping engine waiting to be activated. Not sad or empty — more like "ready to ignite". Centered composition on transparent background. | Dashboard empty state — above "No analyses yet" heading |
| 7 | NeuroCut logo icon | A compact neural/brain icon — abstract, geometric, a simplified synaptic node with 2-3 branching connections. Solid purple gradient (#ba9eff to #8455ef). Should work at 32x32 and scale to 128x128. This is the app icon/favicon used in the sidebar, top bar, and auth screens. | Sidebar logo, auth page headers, favicon |

---

## Specs for Imagen / Nano Banana

- **Size:** 640x360px for hero/ambient images (16:9 aspect), 320x180px for video thumbnails, 240x240px for empty state illustration, 128x128px for logo icon
- **Format:** PNG with transparent background where noted, otherwise dark (#0e0e10) background
- **Style:** Dark, cinematic, editorial. Think high-end neural visualization — NOT medical/anatomical brain imagery. Abstract, flowing, luminous connections on dark backgrounds. Premium SaaS feel, not sci-fi.
- **Colors:**
  - Primary: `#ba9eff` (soft purple)
  - Secondary: `#5af8fb` (electric cyan)  
  - Tertiary: `#9bffce` (mint green)
  - Accent: `#8455ef` (deep purple)
  - Error/warm: `#f472b6` (pink), `#fbbf24` (amber)
  - Background: `#0e0e10` (near black)
  - Never use pure white — max brightness is `#f9f5f8`
- **Consistency:** All illustrations should feel like they belong in the same "Neural Editorial" design system — same color palette, same dark aesthetic, same level of abstraction. Think: if a high-end design studio made a brain-tech product.

---

## Also Needed (Optional / Lower Priority)

| # | Asset | Description | Where Used |
|---|-------|-------------|------------|
| 8 | Processing background | A very subtle, almost invisible neural grid pattern — like a circuit board or synapse map at 3-5% opacity. Used as a repeating texture. | Processing page — background behind the glass panel |
| 9 | Results video placeholder | A cinematic dark frame with faint neural overlay lines (like a HUD/heads-up display). Should look like a paused video player with neural analysis overlay hints. | Results Overview + Results Detail — video player placeholder area |
| 10 | Signup ambient | Similar to Login ambient (#2) but slightly different composition — maybe the neural connections are denser or more "growing/expanding" to match the "create account" energy. | Sign Up page — decorative background or below card |

---

## File Naming Convention

Save as:
```
public/illustrations/welcome-hero.png
public/illustrations/login-ambient.png
public/illustrations/thumb-neural-flow.png
public/illustrations/thumb-social-hook.png
public/illustrations/thumb-editorial-cut.png
public/illustrations/empty-brain.png
public/illustrations/logo-icon.png
public/illustrations/processing-grid.png     (optional)
public/illustrations/results-video-frame.png  (optional)
public/illustrations/signup-ambient.png       (optional)
```

---

## What We DON'T Need (Already Handled)

These are covered by Material Symbols icons (already in the codebase):
- `psychology` / `psychology_alt` — brain icons for 404, empty states
- `play_circle` — video play buttons
- `cloud_upload` — upload icons  
- `check_circle` — success states
- `wifi_off` — offline detection
- `warning` — error states

These are handled by Recharts (already implemented):
- Neural activation timeline charts
- Region breakdown bars
