# Missing UI States Gap Analysis

Documentation of missing UI states (loading, empty, error, disabled, partial/degraded) for all 15 screens: 5 canonical + 10 gap screens. States already documented in canonical specs are noted with references.

---

## Coverage Matrix

| Screen | Loading | Empty | Error | Disabled | Partial |
|--------|---------|-------|-------|----------|---------|
| Upload | New | New | Partial (covered in 01-upload.md for validation) | Partial (covered for CTA in 01-upload.md) | N/A |
| Processing | Partial (covered: queued state) | N/A | Partial (covered: failed state) | New | New |
| Results Overview | Covered in 03-results-overview.md | Covered (redirect) | Covered in 03-results-overview.md | New | New |
| Results Detail | Covered in 04-results-detail.md | New | Covered in 04-results-detail.md | New | New |
| Dashboard | Covered in 05-dashboard.md | Covered in 05-dashboard.md | Covered in 05-dashboard.md | New | New |
| Auth / Login | New | N/A | New | New | N/A |
| Auth / Sign Up | New | N/A | New | New | N/A |
| Auth / Forgot Password | New | N/A | New | New | N/A |
| Onboarding / Welcome | New | N/A | N/A | N/A | N/A |
| Settings / Account | New | New | New | New | New |
| Settings / Billing | New | New | New | New | New |
| Error / 404 | N/A | N/A | N/A (screen IS the error state) | N/A | N/A |
| Error / 500 | N/A | N/A | N/A (screen IS the error state) | New | N/A |
| Error / Offline | N/A | N/A | N/A (screen IS the error state) | N/A | N/A |
| Profile | New | New | New | New | New |

**Legend:** Covered = already documented in canonical spec file. Partial = some aspects covered. New = documented in this file. N/A = state does not apply to this screen.

---

## Upload

### Loading

The Upload screen is primarily static content (drop zone, cost panel, stats cards) that does not depend on a data fetch. However, there is one loading scenario:

- **Page load:** Sidebar Nav and Top Bar render immediately (static). Drop zone renders in empty state. Cost Estimate panel renders with static "10 credits" placeholder. No skeleton states needed for initial page render since all content is static or aspirational.
- **Credit balance fetch (future):** When a real billing system exists, the Top Bar credit display and Cost Estimate panel would show skeleton shimmer while fetching the user's credit balance. Skeleton: `surface-container-high` pulse animation on the credit number in Top Bar and the cost value in the Glass Panel.

### Empty

- **No file selected:** This IS the default state, documented in 01-upload.md. Drop zone shows dashed border, icon, "Drag video here or click to browse" prompt, Browse Files button.
- **No previous analyses (future context):** Not relevant to Upload screen -- the user is here to start a new analysis regardless of history.

### Error

- **Validation errors:** Covered in 01-upload.md -- wrong format, file too large, file too long. Red border on drop zone, inline error message.
- **Upload network error (NEW):** If the file upload fails due to network issues mid-upload:
  - Progress bar turns `error` red, stops advancing
  - Error message inside drop zone: "Upload failed. Check your connection and try again."
  - "Retry" text link appears below error message
  - Drop zone retains file selection (user does not need to re-select)
  - CTA button remains disabled
- **Submission error (NEW):** If the POST /run request to RunPod fails after upload completes:
  - CTA button returns from loading state to enabled state
  - Red error banner appears below the Cost Estimate panel: "Failed to start analysis. Please try again."
  - Banner includes "Retry" button that re-submits the same request
  - Banner auto-dismisses after 10 seconds or on retry click

### Disabled

- **CTA "Analyze Video" button:** Covered in 01-upload.md -- disabled until upload is complete. Additional disabled conditions:
  - Disabled during file upload (progress 0-99%)
  - Disabled when validation error is showing
  - Disabled when insufficient credits (aspirational -- when billing exists, show "Insufficient Credits" tooltip on hover of disabled button)
- **Browse Files button:** Never disabled (always available to select a new file, even during upload -- cancels current upload and starts new selection)
- **Sidebar Nav items:** Never disabled -- user can always navigate away

### Partial

N/A -- Upload screen content is either fully available (static) or not at all. No partial data loading scenario.

---

## Processing

### Loading

- **Initial page load (covered):** Queued state documented in 02-processing.md -- indeterminate progress bar, "Waiting for GPU..." label, all stage checklist items in "waiting" state.
- **Resume from navigation (NEW):** When user navigates back to Processing with an existing `job_id`:
  - Brief loading overlay: "Checking job status..." with spinner (1-2 seconds while first poll completes)
  - Sidebar and Top Bar render immediately
  - Glass panel content shows skeleton shimmer for progress bar and stage checklist
  - After first poll response: content fills in based on current job status

### Error

- **Job failure (covered):** Documented in 02-processing.md -- status=FAILED shows error message, red styling, Retry button.
- **Polling network failure (NEW):**
  - After 3 consecutive failed polls: yellow warning banner below progress panel
  - Banner text: "Connection interrupted. Retrying..." with animated dots
  - Polling continues at reduced interval (10 seconds instead of 3-5)
  - When connection restores: banner auto-dismisses, polling resumes normal interval
  - Job continues running on RunPod regardless of client connection
- **Invalid job_id (NEW):**
  - If first poll returns 404 or "job not found":
  - Progress panel replaced with error card
  - Message: "Analysis not found. It may have expired or been deleted."
  - CTA: "Start New Analysis" (navigates to Upload) and "Back to Dashboard"

### Disabled

- **Cancel/Back button:** Disabled during the 1-2 second completion animation (auto-redirect in progress) to prevent navigation conflicts.
- **Sidebar "New Analysis" CTA:** Never disabled -- user can start a new analysis even while one is processing.
- **No other interactive elements** on Processing screen that can be disabled (progress display is read-only).

### Partial

- **Stage checklist partially loaded (NEW):** If polling returns IN_PROGRESS but with a progress percentage that maps to mid-pipeline:
  - Completed stages show green checkmarks: "Done"
  - Current stage shows animated sync icon: "Processing"
  - Remaining stages show grey pending icon: "Wait" at 30% opacity
  - This is the normal operating state but is technically "partial" -- some stages complete, others pending
- **Inference logs unavailable (NEW):** The Inference Log Panel is aspirational. When no log data is available:
  - Panel shows static placeholder text: "Inference logs will appear here in a future update"
  - Green pulse dot in header is not shown
  - Panel background dims slightly compared to active state

---

## Results Overview

### Loading

Covered in 03-results-overview.md: "Skeleton cards (shimmer animation), timeline placeholder bar, video thumbnail area grayed."

### Empty

Covered in 03-results-overview.md: "Should not occur -- user is redirected here only on successful analysis completion. Redirect to Dashboard if no data."

### Error

Covered in 03-results-overview.md: "Error message card with error type and retry button. Timeline and metrics hidden."

### Disabled

- **Export shortcut button (NEW):** Disabled while data is still loading (skeleton state). Enabled only when OutputSchema is fully loaded and parsed. Disabled state: `surface-container-highest` background, muted text, `cursor-not-allowed`.
- **"View Full Analysis" / "Deep Dive" button (NEW):** Disabled during loading state. Enabled once results data is available.
- **Timeline interactions (NEW):** Timeline scrubbing, click-to-seek, and playhead drag are disabled during loading state. Timeline renders as skeleton bar during loading, becomes interactive only when segment data is populated.
- **Metric card click (NEW):** Cards are non-interactive during loading (skeleton state). Become clickable when data loads. Engagement IQ card (aspirational) is always non-interactive with "Coming Soon" tooltip.

### Partial

- **Summary loads but timeline fails (NEW):**
  - Summary metric cards render with data (Overall Score, Hook Score, etc.)
  - Timeline section shows error state: "Unable to load timeline data. Try refreshing the page." with Retry link
  - Video player placeholder still renders with duration
  - AI Recommendations panel still shows (aspirational content, no dependency on timeline)
  - Export button disabled (incomplete data)
- **Video thumbnail fails to load (NEW):**
  - Video Player Placeholder shows dark `surface` background with broken image icon
  - All other components render normally
  - Timeline and metrics are independent of thumbnail
- **Aspirational sections unavailable (normal state):**
  - AI Recommendations shows static placeholder content
  - Engagement IQ card shows "Coming Soon"
  - Emotional Tags are not rendered
  - This is the normal v1 state, not a degraded state

---

## Results Detail

### Loading

Covered in 04-results-detail.md: "Skeleton bars for timeline tracks, skeleton rows for segment table, export buttons disabled."

### Empty

- **Segment Explorer empty (NEW):** Edge case where OutputSchema has zero segments (should not occur with valid analysis, but defensive design):
  - Table shows Empty State component: "No segment data available" with psychology icon
  - Multi-track timeline shows flat zero-line
  - Region Breakdown Panel shows all zeros
  - Export still functional (exports the empty-but-valid schema)

### Error

Covered in 04-results-detail.md: "Error card with back button to Dashboard. All data components hidden."

### Disabled

- **Export buttons (NEW):**
  - Disabled during loading state
  - Disabled during active export (brief spinner on the clicked button)
  - Share button always disabled with "Coming Soon" tooltip (aspirational)
  - PDF export button always disabled with "Coming Soon" tooltip (aspirational)
- **Column sort in Segment Explorer (NEW):** Sort headers are non-interactive during loading (skeleton rows). Active once data renders.
- **Track collapse toggle (NEW):** Disabled during loading (skeleton state). Enabled once track data renders.
- **Tag management "Add Tag" button (NEW):** Always disabled in v1 with "Coming in a future update" tooltip. Aspirational -- no tag storage API.

### Partial

- **Some region tracks fail to render (NEW):**
  - If segment data has null/missing values for one or more regions (e.g., `social_cognition` is null across all segments):
  - That track shows flat line with "No data" label in `on-surface-variant`
  - Other tracks render normally
  - Region Breakdown Panel shows "N/A" for the missing region's average/peak
  - Tooltip on timeline hover omits the missing region from the breakdown
- **Video player fails but data loads (NEW):**
  - Video Player Placeholder shows error state (dark background, broken icon)
  - All timeline, region, and table components render normally
  - Video-timeline sync interactions are inactive (no video to sync with)

---

## Dashboard

### Loading

Covered in 05-dashboard.md: "Skeleton grid: 4 placeholder cards with pulse animation, skeleton stat cards."

### Empty

Covered in 05-dashboard.md: "Hide Quick Stats row, show Empty State with onboarding prompt and 'New Analysis' CTA."

### Error

Covered in 05-dashboard.md: "Error banner at top of content area: 'Failed to load analyses. Retry?' with retry button."

### Disabled

- **Job Card "View Results" button (NEW):** Disabled for jobs with `status: "processing"` -- shows "Processing..." label instead. Disabled for jobs with `status: "failed"` -- shows "Retry" instead (different action, not disabled per se).
- **Search input (NEW):** Disabled during initial loading (skeleton state). Enabled once job list loads (even if empty -- searching an empty list yields the empty state).
- **Sort controls (NEW):** Disabled during initial loading. Disabled when only 1 or 0 jobs exist (nothing to sort). Enabled with 2+ jobs.
- **"New Analysis" button:** Never disabled -- always available in sidebar and header.

### Partial

- **Some job cards fail to load thumbnails (NEW):**
  - Affected job cards show gradient placeholder (neural-gradient) instead of thumbnail
  - All other card content (filename, date, score, status) renders normally
  - Non-affected cards render with their thumbnails
- **Quick Stats partially available (NEW):**
  - If job history loads but credit balance API fails (future scenario):
  - Total Analyses and Average Score cards render with data
  - Credits Remaining card shows "Unavailable" with `on-surface-variant` text and retry icon
  - Cards are independent -- one failure does not block others
- **Mixed job statuses (covered):** Documented in 05-dashboard.md as "Single Processing" state -- processing cards show spinner, completed cards show normally.

---

## Auth / Login

### Loading

- **Form submission loading:** After clicking "Sign In", button transitions to loading state (spinner + "Signing in..."). Form inputs become read-only during submission. Entire card shows subtle opacity reduction (0.9) to indicate pending state.

### Error

- **Invalid credentials:** Red error message appears below the password field: "Invalid email or password." Both input fields gain `error` bottom-border color. Error clears on any field edit.
- **Account locked:** Error message: "Account temporarily locked. Try again in 15 minutes." Both inputs read-only with retry timer.
- **Network error:** Error message: "Unable to connect. Check your internet connection." Retry link below message.
- **Rate limited:** Error message: "Too many attempts. Please wait before trying again."

### Disabled

- **"Sign In" button:** Disabled when email is empty OR password is empty. Disabled during form submission (loading state). Enabled when both fields have values.
- **Input fields:** Read-only during form submission. Otherwise always editable.

---

## Auth / Sign Up

### Loading

- **Form submission loading:** After clicking "Create Account", button shows loading state (spinner + "Creating account..."). All form inputs become read-only. Card shows subtle opacity reduction.

### Error

- **Email already taken:** Error below email field: "An account with this email already exists. Sign in instead?" with "Sign in" link.
- **Password too weak:** Error below password field (in addition to strength indicator): "Password must be at least 8 characters."
- **Passwords don't match:** Error below confirm password field: "Passwords do not match." Validated on blur from confirm field.
- **Terms not accepted:** Error below checkbox on submit attempt: "You must agree to the Terms of Service."
- **Network error:** Same pattern as Login -- message below form with retry link.

### Disabled

- **"Create Account" button:** Disabled when: any required field is empty, passwords don't match, terms not checked. Disabled during form submission. Enabled only when all validation passes.
- **Input fields:** Read-only during form submission.

---

## Auth / Forgot Password

### Loading

- **Form submission loading:** After clicking "Send Reset Link", button shows loading state. Email input becomes read-only.
- **Transition to confirmation:** After successful submission, 300ms fade-out of form, 300ms fade-in of confirmation message.

### Error

- **Email not found:** Error below email field: "No account found with this email address."
- **Rate limited:** Error below email field: "Reset link already sent. Check your email or wait 5 minutes to resend."
- **Network error:** Error below form: "Unable to send reset link. Check your internet connection."

### Disabled

- **"Send Reset Link" button:** Disabled when email field is empty or does not match basic email format. Disabled during submission.
- **"Resend email" link (confirmation state):** Disabled for 60 seconds after sending. Shows countdown: "Resend in 45s". Enabled after cooldown.

---

## Onboarding / Welcome

### Loading

- **Page load:** Minimal loading state. NeuroCut logo renders immediately. Illustration placeholder fades in. Copy text and CTA button fade in with staggered 200ms delay per element for a polished entrance animation.
- **No data fetch required** -- all content is static.

---

## Settings / Account

### Loading

- **Initial page load:** Form sections show skeleton shimmer for input values while user profile data loads. Section titles render immediately (static). Toggle states show neutral position during load.
- **Save in progress:** "Save Changes" / "Update Password" buttons show spinner and "Saving..." text. Inputs become read-only.

### Empty

- **New user with no profile data:** Display Name input shows placeholder "Enter your display name". Email shows the auth email (populated from auth context). All notification toggles default to ON.

### Error

- **Save failed:** Red error banner below the affected FormSection: "Failed to save changes. Please try again." Banner includes "Retry" action.
- **Password update failed:** Error below the Change Password section: "Current password is incorrect." or "Failed to update password."
- **Load failed:** Full content area replaced with error card: "Unable to load settings. Please try again." with Retry button.

### Disabled

- **Email field:** Always read-only/disabled (cannot change email through settings -- requires separate verification flow).
- **"Save Changes" button:** Disabled when no changes have been made (dirty state detection). Enabled once any field differs from its loaded value.
- **"Update Password" button:** Disabled when any password field is empty or confirm does not match new. Disabled during submission.

### Partial

- **Profile loads but notification preferences fail:**
  - Profile Information section renders with data
  - Change Password section renders normally
  - Notifications section shows error: "Unable to load notification preferences" with Retry link
  - Sections are independent -- one failure does not block others

---

## Settings / Billing

### Loading

- **Initial page load:** Quick Stats row shows skeleton cards. Purchase Credits section shows skeleton cards for packages. Transaction History table shows skeleton rows (4 placeholder rows).
- **Purchase in progress:** Clicked "Buy" button shows spinner. Confirmation dialog shows loading indicator during payment processing.

### Empty

- **No transaction history:** Transaction History section shows empty state: "No transactions yet. Purchase credits to get started." Table header still visible with no rows.
- **No credit balance (new user):** Credits Balance card shows "0" with "Purchase credits" link.

### Error

- **Purchase failed:** Error dialog: "Payment failed. Please check your payment method and try again." Dialog has "Try Again" and "Cancel" buttons.
- **Load failed:** Full content replaced with error card: "Unable to load billing information. Please try again."
- **Transaction history load failed:** Stats render normally. Transaction table shows: "Unable to load transaction history" with Retry link.

### Disabled

- **"Buy" buttons:** Disabled during any active purchase transaction. Only one purchase can be in-flight at a time. Other packages' Buy buttons dim to `surface-container-highest` with `cursor-not-allowed`.
- **Plan upgrade link:** Disabled with "Coming Soon" tooltip if no upgrade path exists.

### Partial

- **Stats load but transactions fail:**
  - Quick Stats cards render with current values
  - Purchase Credits cards render with packages
  - Transaction History shows error with Retry
- **Some stats unavailable:**
  - Available stats render normally
  - Unavailable stat card shows "Unavailable" text in `on-surface-variant`

---

## Error / 404

Error pages ARE the error state -- they do not have separate loading, empty, error, disabled, or partial states. The 404 page renders immediately with static content.

---

## Error / 500

### Disabled

- **"Try Again" button:** Shows loading state (spinner) during retry attempt. If retry also fails, button re-enables with updated message: "Still having trouble. Please try again later." After 3 consecutive retry failures, button text changes to "Contact Support" and links to support (aspirational).

---

## Error / Offline

Error pages ARE the error state. The offline screen renders immediately from cached assets.

- **Connection transitions** are handled by the ConnectionStatusIndicator component documented in gaps-missing-screens.md. States: checking, offline, reconnecting, online.

---

## Profile

### Loading

- **Initial page load:** Avatar shows generic person icon at full opacity. Display name and email show skeleton text bars. Stats cards show skeleton shimmer. Recent Activity list shows 3 skeleton rows.

### Empty

- **New user with no analyses:** Stats cards show: Total Analyses = 0, Average Score = "--", Best Score = "--". Recent Activity section shows empty state: "No analyses yet. Upload your first video to see your activity here." with "New Analysis" CTA link.

### Error

- **Profile load failed:** Content area replaced with error card: "Unable to load profile. Please try again." with Retry button.
- **Stats load failed but profile loads:** Avatar, name, email render. Stats cards show "Unavailable" with retry icon. Recent Activity shows error with Retry link.

### Disabled

- **"Edit Profile" button:** Never disabled -- always navigates to Settings / Account.
- **Activity item click:** Disabled for items with failed job status. Shows `cursor-default` instead of pointer. Tooltip: "Analysis failed -- no results available."

### Partial

- **Profile loads but stats fail:**
  - Avatar, display name, email, member since all render
  - Stats row shows error state per card ("Unavailable")
  - Recent Activity shows independently (separate data fetch)
- **Avatar upload fails:**
  - Avatar reverts to previous image or default icon
  - Brief `error` toast: "Failed to upload image. Try again."
  - Rest of profile remains unaffected
