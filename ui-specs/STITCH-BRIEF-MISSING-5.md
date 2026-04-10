# NeuroCut — Stitch Generation Brief (5 Missing Screens)

## Purpose

This is a follow-up brief for 5 screens that were not generated in the first Stitch pass. These screens complete the NeuroCut v1 product surface. All screens use the same design system as the 10 screens already generated.

**Already generated (do NOT regenerate):** Login, Sign Up, Welcome Onboarding, Upload Analysis, Processing Analysis, Results Overview, Results Detail, Dashboard, Billing Settings, 404 Error Page.

**Generate these 5 screens:**
1. Settings — General (account + notifications)
2. Error — 500 Server Error
3. Error — Offline / No Connection
4. Empty State (no analyses yet)
5. Profile

---

## Design System (same as previous brief)

### Colors — Surface Hierarchy (Tonal Layering, NO borders)

| Token | Hex | Role |
|-------|-----|------|
| `surface` | `#0e0e10` | Base page background |
| `surface-container-lowest` | `#000000` | Recessed elements |
| `surface-container-low` | `#131315` | Sidebar nav background |
| `surface-container` | `#19191c` | Main content area |
| `surface-container-high` | `#1f1f22` | Card backgrounds |
| `surface-container-highest` | `#262528` | Secondary button fills |
| `surface-bright` | `#2c2c2f` at 60% opacity + 20px backdrop blur | Glass panels |

### Colors — Accents

| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#ba9eff` | Electric Purple — brand accent, CTA gradient start |
| `primary-dim` | `#8455ef` | CTA gradient end |
| `secondary` | `#5af8fb` | Cyan — AI processing, input focus |
| `tertiary` | `#9bffce` | Emerald green — success, toggle on-state |
| `error` | `#ff6e84` | Crimson — errors, failed states |

### Text Colors

| Token | Hex |
|-------|-----|
| `on-surface` | `#f6f3f5` | Primary text (NOT pure white) |
| `on-surface-variant` | `#acaaad` | Muted/secondary text |

### Design Rules

1. **No-Line Rule:** NO 1px solid borders for sectioning. Use background shifts between surface tiers.
2. **Neural-Gradient:** `linear-gradient(135deg, #ba9eff, #8455ef)` for CTA buttons and progress bars.
3. **Glass & Gradient Rule:** Glass panels use `surface-bright` at 60% opacity + 20px backdrop blur.
4. **Ghost Border:** If separator needed, use `#48474a` at 15% opacity.
5. **No Pure White:** Always `#f6f3f5` for text, never `#ffffff`.

### Typography

| Font | Usage |
|------|-------|
| **Space Grotesk** | Headlines, display metrics, section titles |
| **Inter** | Body text, labels, descriptions |
| System monospace | Log output |

### Shared Layout — App Shell

All 5 screens below (except the 2 error pages) use the same app shell as the already-generated screens:

- **Sidebar Nav** (fixed left, w-64): Background `surface-container-low`. Nav items: Dashboard, Neural Analysis, Content Library, A/B Testing, Settings. Active item has 2px left border in `primary`. Bottom section: New Analysis CTA, Settings, Support links.
- **Top Bar** (sticky top): Background `surface`. Credits display, plan badge, notification icon, user avatar.
- **Content Area** (ml-64): Main scrollable content.

The 2 error pages (500, Offline) do NOT use the app shell — they are full-screen centered like the existing 404 page.

---

## Screen 1: Settings — General

**Purpose:** Account settings, password change, and notification preferences. Combines Settings-General and Settings-Notifications into one screen (same pattern as Billing Settings already generated).

**Use the same app shell as the Billing Settings screen** — Sidebar Nav with Settings item active, Top Bar with back arrow.

### Layout

Single column, max-width content area. Three stacked form sections:

```
+----------+----------------------------------------------------+
|          | Top Bar                                            |
| Sidebar  | [< Back]  Settings                     [avatar]   |
| Nav      +----------------------------------------------------+
|          |                                                    |
|          |  Settings / General                                |
|          |  "Manage your account and preferences"             |
|          |                                                    |
|          |  +----------------------------------------------+  |
|          |  | SECTION: Profile Information                 |  |
|          |  |                                              |  |
|          |  | Display Name                                 |  |
|          |  | [________________________]                   |  |
|          |  |                                              |  |
|          |  | Email                                        |  |
|          |  | [________________________] (read-only, gray) |  |
|          |  |                                              |  |
|          |  | [ Save Changes ]  (secondary button)         |  |
|          |  +----------------------------------------------+  |
|          |                                                    |
|          |  +----------------------------------------------+  |
|          |  | SECTION: Change Password                     |  |
|          |  |                                              |  |
|          |  | Current Password                             |  |
|          |  | [________________________]                   |  |
|          |  | New Password                                 |  |
|          |  | [________________________]                   |  |
|          |  | Confirm New Password                         |  |
|          |  | [________________________]                   |  |
|          |  |                                              |  |
|          |  | [ Update Password ]  (secondary button)      |  |
|          |  +----------------------------------------------+  |
|          |                                                    |
|          |  +----------------------------------------------+  |
|          |  | SECTION: Notifications                       |  |
|          |  |                                              |  |
|          |  | Analysis Complete       [====] on            |  |
|          |  | Processing Failed       [====] on            |  |
|          |  | Weekly Summary          [    ] off           |  |
|          |  | Product Updates         [    ] off           |  |
|          |  +----------------------------------------------+  |
+----------+----------------------------------------------------+
```

### Components

- **Form Section Card**: `surface-container` background, `rounded-xl`, padding 24px. Title in `Space Grotesk headline-sm`.
- **Input Fields**: Background `surface-container-low`, bottom-border-only, focus illuminates to `secondary` (#5af8fb). Label in Inter `label-sm` `on-surface-variant`.
- **Toggle Switch**: Track 40px wide. On: `tertiary` (#9bffce) track. Off: `on-surface-variant` track. Round thumb.
- **Secondary Buttons**: "Save Changes" and "Update Password" — `surface-container-highest` background with ghost border.

### States

- **Loading:** Skeleton shimmer on form sections
- **Error:** Inline error message below field in `error` color
- **Success:** Brief green flash confirmation on save

---

## Screen 2: Error — 500 Server Error

**Purpose:** Shown when an unexpected server error occurs. Full-screen centered, NO app shell.

**Use the exact same layout pattern as the existing 404 page** but with different copy and icons.

### Layout

```
+---------------------------------------------------------------+
|  [NeuroCut logo]                          [Credits] [avatar]  |
|                                                               |
|                                                               |
|              [  warning icon in circle  ]                     |
|              (psychology_alt or error icon)                    |
|              (with decorative dot pattern)                     |
|                                                               |
|              "500"                                             |
|              (text-[7rem], Space Grotesk, on-surface)         |
|                                                               |
|              "Something went wrong"                           |
|              (headline-lg, Space Grotesk)                     |
|                                                               |
|              "We hit an unexpected error.                     |
|               Our team has been notified.                     |
|               Please try again in a moment."                  |
|              (body-md, on-surface-variant)                    |
|                                                               |
|              [ Try Again ]                                    |
|              (neural-gradient CTA button)                     |
|                                                               |
|              Back to Dashboard                                |
|              (text link, on-surface-variant)                  |
|                                                               |
|  ─────────────────────────────────────────────────────────    |
|  System Status: Operational    Error: ERR-500-xxxxx           |
+---------------------------------------------------------------+
```

### Key Differences from 404

- Large number shows "500" instead of "404"
- Heading: "Something went wrong" instead of "Page not found"
- Icon: warning/error themed instead of search themed
- CTA: "Try Again" (retries action) instead of "Back to Dashboard"
- Secondary link: "Back to Dashboard" below CTA
- Footer shows error reference code

---

## Screen 3: Error — Offline / No Connection

**Purpose:** Shown when browser loses network connectivity. Full-screen centered, NO app shell.

**Same layout pattern as 404/500 error pages.**

### Layout

```
+---------------------------------------------------------------+
|  [NeuroCut logo]                                              |
|                                                               |
|                                                               |
|              [  wifi_off icon in circle  ]                    |
|              (with decorative dot pattern)                    |
|                                                               |
|              "You're offline"                                 |
|              (headline-lg, Space Grotesk)                     |
|                                                               |
|              "Check your internet connection.                 |
|               We'll reconnect automatically                   |
|               when you're back online."                       |
|              (body-md, on-surface-variant)                    |
|                                                               |
|              [  ●  Checking connection...  ]                  |
|              (status indicator with spinner)                  |
|              (secondary color when checking)                  |
|                                                               |
|              [ Retry Now ]                                    |
|              (secondary button, surface-container-highest)    |
|                                                               |
+---------------------------------------------------------------+
```

### Key Differences from 404/500

- NO large number — just the headline
- Icon: `wifi_off` Material Symbol instead of search/warning
- Status indicator: animated spinner showing connection check status
- CTA is secondary button ("Retry Now") not neural-gradient — less urgent
- No footer error code

### Connection Status States

- **Checking:** Pulsing `secondary` (#5af8fb) dot + "Checking connection..." spinner
- **Offline:** Red `error` (#ff6e84) dot + "No connection detected"
- **Reconnecting:** Pulsing `secondary` dot + "Reconnecting..."
- **Online:** Green `tertiary` (#9bffce) dot + "Connected!" — auto-redirects after 1 second

---

## Screen 4: Empty State (No Analyses Yet)

**Purpose:** Shown on the Dashboard when the user has zero analyses. Uses the app shell (sidebar + top bar).

**Use the same app shell as the Dashboard screen** — Sidebar Nav with Dashboard item active, Top Bar with credits.

### Layout

Same header as Dashboard ("Analysis History" heading) but the job card grid is replaced with a centered empty state.

```
+----------+----------------------------------------------------+
|          | Top Bar                                            |
| Sidebar  | NeuroCut          Credits: 500    Pro    [avatar]  |
| Nav      +----------------------------------------------------+
|          |                                                    |
|          |  Analysis History                                  |
|          |  "Your neural analysis workspace"                  |
|          |                                                    |
|          |  Quick Stats                                       |
|          |  [Total: 0] [Credits: 500] [Avg Score: --]         |
|          |                                                    |
|          |  +----------------------------------------------+  |
|          |  |                                              |  |
|          |  |          [  science icon  ]                  |  |
|          |  |          (large, 64px, on-surface-variant)   |  |
|          |  |                                              |  |
|          |  |     "No analyses yet"                        |  |
|          |  |     (headline-sm, Space Grotesk)             |  |
|          |  |                                              |  |
|          |  |     "Upload your first video to see          |  |
|          |  |      neural engagement insights."            |  |
|          |  |     (body-md, on-surface-variant)             |  |
|          |  |                                              |  |
|          |  |     [ Upload Your First Video ]              |  |
|          |  |     (neural-gradient CTA button)             |  |
|          |  |                                              |  |
|          |  +----------------------------------------------+  |
|          |                                                    |
|          |  +----------------------------------------------+  |
|          |  | "How it works"                               |  |
|          |  |                                              |  |
|          |  | 1. Upload   2. Analyze   3. Optimize         |  |
|          |  | [icon]      [icon]       [icon]              |  |
|          |  | "Drop a     "Our AI     "Get per-           |  |
|          |  |  video"      predicts    segment             |  |
|          |  |              brain       scores"             |  |
|          |  |              activation"                     |  |
|          |  +----------------------------------------------+  |
+----------+----------------------------------------------------+
```

### Components

- **Empty State Card**: Centered within content area. `surface-container` background, `rounded-xl`, padding 48px. Contains icon, heading, description, CTA.
- **How-It-Works Section**: 3-column horizontal card below empty state. Each step: Material Symbol icon (48px, `on-surface-variant`), step number, short description. Background `surface-container`, `rounded-xl`.
- **Neural-Gradient CTA**: "Upload Your First Video" — navigates to Upload screen.
- **Quick Stats Row**: Same 3-column layout as Dashboard but with "0", "500", and "--" values.

### States

- This IS the empty state — it shows when `analyses.length === 0`
- Once user has at least 1 analysis, this screen is replaced by the normal Dashboard with job cards

---

## Screen 5: Profile

**Purpose:** Displays user profile info, aggregate stats, and recent activity. Uses the app shell.

### Layout

```
+----------+----------------------------------------------------+
|          | Top Bar                                            |
| Sidebar  | [< Back]  Profile                      [avatar]   |
| Nav      +----------------------------------------------------+
|          |                                                    |
|          |  +----------------------------------------------+  |
|          |  |  Profile Card                                |  |
|          |  |                                              |  |
|          |  |  [ Large Avatar Circle ]   Display Name      |  |
|          |  |  (96px, surface-container-  user@example.com |  |
|          |  |   high, person icon)        Member since      |  |
|          |  |                             October 2026     |  |
|          |  |                                              |  |
|          |  |                     [ Edit Profile ]         |  |
|          |  |                     (secondary button)       |  |
|          |  +----------------------------------------------+  |
|          |                                                    |
|          |  Analysis Stats                                    |
|          |  +------------+ +------------+ +------------+      |
|          |  | Total      | | Average    | | Best       |      |
|          |  | Analyses   | | Score      | | Score      |      |
|          |  |            | |            | |            |      |
|          |  | 12         | | 76         | | 96         |      |
|          |  | (display-  | | (display-  | | (display-  |      |
|          |  |  lg, Space | |  lg, Space | |  lg, Space |      |
|          |  |  Grotesk)  | |  Grotesk)  | |  Grotesk)  |      |
|          |  +------------+ +------------+ +------------+      |
|          |                                                    |
|          |  +----------------------------------------------+  |
|          |  | Recent Activity                              |  |
|          |  |                                              |  |
|          |  | Oct 24  campaign_v4.mp4        Score: 84     |  |
|          |  | Oct 22  intro_reel.mp4         Score: 71     |  |
|          |  | Oct 20  product_demo.mp4       Score: 96     |  |
|          |  | Oct 18  hero_video_v2.mp4      Score: 63     |  |
|          |  +----------------------------------------------+  |
+----------+----------------------------------------------------+
```

### Components

- **Profile Card**: `surface-container-high` background, `rounded-xl`, flex row layout. Left: large avatar circle (96px diameter, `surface-container` background, person icon in `on-surface-variant`). Right: name (`headline-md`, Space Grotesk), email (`body-sm`, `on-surface-variant`), member since, Edit Profile button.
- **Stats Row**: Same 3-column pattern as Dashboard Quick Stats. Each card: `surface-container-high`, `rounded-xl`. Label in `label-sm` uppercase tracking-widest, value in `display-lg` Space Grotesk.
- **Activity Feed**: `surface-container` card, `rounded-xl`. Each row: date (on-surface-variant), filename (on-surface), score with small neural-gradient progress bar. Rows separated by subtle background shift (alternating surface-container / surface-container-low), NOT borders. Clickable — navigates to Results Overview.

### States

- **Loading:** Skeleton shimmer on profile card and stats
- **Empty activity:** "No analyses yet" message with CTA to Upload

---

## Generation Notes

- All 5 screens use **Tailwind CSS** with the custom color config (same as the 10 already-generated screens)
- Use **Material Symbols Outlined** for all icons (same CDN as existing screens)
- Use **Google Fonts**: Space Grotesk (headlines) + Inter (body)
- Dark mode only (`class="dark"` on html root)
- Sidebar width: `w-64` (16rem), content area: `ml-64`
- All cards: `rounded-xl`, NO 1px borders, use surface tier shifts for depth
- Glass panels: `rgba(44, 44, 47, 0.6)` background + `backdrop-blur-[20px]`
- CTA buttons: `linear-gradient(135deg, #ba9eff, #8455ef)` background

**Priority order:** Settings-General > Empty State > Profile > Error-500 > Error-Offline
