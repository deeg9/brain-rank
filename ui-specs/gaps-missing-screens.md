# Missing Screens Gap Analysis

Screens not covered in the canonical set (00-screen-index.md lists 5: Upload, Processing, Results Overview, Results Detail, Dashboard). This document specs every additional screen required for the complete NeuroCut v1 product surface.

---

## Summary Table

| # | Screen | Category | Priority | New Components Needed |
|---|--------|----------|----------|----------------------|
| 1 | Auth / Login | Auth | High | AuthCard |
| 2 | Auth / Sign Up | Auth | High | PasswordStrengthIndicator |
| 3 | Auth / Forgot Password | Auth | High | ConfirmationMessage |
| 4 | Onboarding / Welcome | Onboarding | Medium | HeroIllustrationPlaceholder, StepIndicator |
| 5 | Settings / Account | Settings | Medium | FormSection, Toggle |
| 6 | Settings / Billing | Settings | Medium | TransactionHistoryTable, CreditPackageCard |
| 7 | Error / 404 | Error | High | ErrorIllustrationPlaceholder |
| 8 | Error / 500 | Error | High | (uses ErrorIllustrationPlaceholder) |
| 9 | Error / Offline | Error | Medium | ConnectionStatusIndicator |
| 10 | Profile | Profile | Low | AvatarUpload, StatCard |

---

## Auth / Login

**Purpose:** Entry point for returning users to authenticate with email and password.

### Layout

```
+---------------------------------------------------------------+
|                                                               |
|                     [NeuroCut logo + wordmark]                |
|                                                               |
|                  +---------------------------+                |
|                  |       AuthCard             |                |
|                  |                            |                |
|                  |  "Welcome back"            |                |
|                  |  "Sign in to your account" |                |
|                  |                            |                |
|                  |  Email                     |                |
|                  |  [________________________]|                |
|                  |                            |                |
|                  |  Password                  |                |
|                  |  [________________________]|                |
|                  |                            |                |
|                  |  [Forgot password?]        |                |
|                  |                            |                |
|                  |  [ Sign In  -->  ]         |                |
|                  |                            |                |
|                  |  "Don't have an account?"  |                |
|                  |  [Sign up]                 |                |
|                  +---------------------------+                |
|                                                               |
+---------------------------------------------------------------+
```

Centered card on dark `surface` background. No sidebar nav -- auth screens are outside the main app shell. Card uses `surface-container-high` background with `rounded-xl`. Max-width 420px, vertically and horizontally centered.

### Components

- **AuthCard** (NEW): Container card for auth forms. Props: `title: string`, `subtitle: string`, `children: ReactNode`. Background `surface-container-high`, `rounded-xl`, padding `card-padding-md` (24px). No border (follows No-Line Rule from design-tokens.md).
- **InputField** (from [components.md](components.md) -- input field pattern in design-tokens.md): Email and password inputs. Background `surface-container-low`, bottom-border-only, focus illuminates to `secondary`. Label in `label-sm` `on-surface-variant`.
- **Neural-Gradient CTA Button** (from [components.md](components.md) #11): "Sign In" button, full-width within card, `neural-gradient` background.
- **Text Link**: "Forgot password?" and "Sign up" links in `primary` color (no standard blue per design-tokens.md rules).

### Interactions

1. **Submit login form** -- Click "Sign In" or press Enter. Button shows loading spinner. On success: redirect to Dashboard. On failure: inline error message below form ("Invalid email or password") in `error` color.
2. **Navigate to Sign Up** -- Click "Sign up" link. Routes to Auth / Sign Up screen.
3. **Navigate to Forgot Password** -- Click "Forgot password?" link. Routes to Auth / Forgot Password screen.

### Data Requirements

| UI Field | Source | Tag | Notes |
|----------|--------|-----|-------|
| email | User input | aspirational | No auth backend exists |
| password | User input | aspirational | No auth backend exists |
| auth token | Auth API response | aspirational | No auth system implemented |
| error message | Auth API error | aspirational | No auth backend to return errors |

### Navigation

- **Entry:** Direct URL, redirect from any protected route when unauthenticated
- **Exit:** Dashboard (on success), Sign Up (link), Forgot Password (link)

### New Components Needed

- **AuthCard**: Centered card container for auth forms (reused across all 3 auth screens)

---

## Auth / Sign Up

**Purpose:** Registration screen for new users to create an account.

### Layout

Same centered card pattern as Login. Card contains additional fields (confirm password, terms checkbox) so is slightly taller.

```
+---------------------------------------------------------------+
|                     [NeuroCut logo + wordmark]                |
|                                                               |
|                  +---------------------------+                |
|                  |       AuthCard             |                |
|                  |                            |                |
|                  |  "Create your account"     |                |
|                  |  "Start analyzing videos"  |                |
|                  |                            |                |
|                  |  Email                     |                |
|                  |  [________________________]|                |
|                  |                            |                |
|                  |  Password                  |                |
|                  |  [________________________]|                |
|                  |  [strength indicator]      |                |
|                  |                            |                |
|                  |  Confirm Password          |                |
|                  |  [________________________]|                |
|                  |                            |                |
|                  |  [x] I agree to Terms      |                |
|                  |                            |                |
|                  |  [ Create Account --> ]    |                |
|                  |                            |                |
|                  |  "Already have an account?"|                |
|                  |  [Sign in]                 |                |
|                  +---------------------------+                |
+---------------------------------------------------------------+
```

### Components

- **AuthCard** (shared with Login): Same centered card container.
- **InputField** (from [components.md](components.md)): Email, password, confirm password inputs.
- **PasswordStrengthIndicator** (NEW): Horizontal bar below password field. 4 segments that fill with color as strength increases. Weak: `error`, Fair: `on-surface-variant`, Good: `secondary`, Strong: `tertiary`. Props: `strength: "weak" | "fair" | "good" | "strong"`.
- **Checkbox**: Terms acceptance checkbox. Label links to Terms of Service (aspirational). Unchecked state blocks form submission.
- **Neural-Gradient CTA Button** (from [components.md](components.md) #11): "Create Account" button, disabled until all fields valid and terms checked.
- **Text Link**: "Sign in" link in `primary` color.

### Interactions

1. **Password strength feedback** -- As user types password, PasswordStrengthIndicator updates in real time. Minimum requirement: 8 characters.
2. **Password match validation** -- Confirm password field shows inline error if it does not match password field (validated on blur).
3. **Submit sign up form** -- Click "Create Account". Button shows loading state. On success: redirect to Onboarding / Welcome. On failure: inline error below relevant field.
4. **Navigate to Login** -- Click "Sign in" link. Routes to Auth / Login.

### Data Requirements

| UI Field | Source | Tag | Notes |
|----------|--------|-----|-------|
| email | User input | aspirational | No auth backend |
| password | User input | aspirational | No auth backend |
| confirm password | User input (client-side validation only) | aspirational | No auth backend |
| terms acceptance | Checkbox state | aspirational | No terms document exists yet |
| password strength | Client-side computation | derived | Computed from password input |

### Navigation

- **Entry:** "Sign up" link from Login screen
- **Exit:** Onboarding / Welcome (on success), Login (link)

### New Components Needed

- **PasswordStrengthIndicator**: Visual password strength meter

---

## Auth / Forgot Password

**Purpose:** Allows users to request a password reset link via email.

### Layout

Same centered card pattern. Minimal content -- single email input and submit button.

```
+---------------------------------------------------------------+
|                     [NeuroCut logo + wordmark]                |
|                                                               |
|                  +---------------------------+                |
|                  |       AuthCard             |                |
|                  |                            |                |
|                  |  "Reset your password"     |                |
|                  |  "Enter your email and     |                |
|                  |   we'll send a reset link" |                |
|                  |                            |                |
|                  |  Email                     |                |
|                  |  [________________________]|                |
|                  |                            |                |
|                  |  [ Send Reset Link --> ]   |                |
|                  |                            |                |
|                  |  [Back to Sign In]         |                |
|                  +---------------------------+                |
+---------------------------------------------------------------+
```

After submission, the card content transitions to a confirmation state:

```
|                  |  [checkmark icon]          |                |
|                  |  "Check your email"        |                |
|                  |  "We sent a reset link to  |                |
|                  |   user@example.com"        |                |
|                  |                            |                |
|                  |  [Resend email]            |                |
|                  |  [Back to Sign In]         |                |
```

### Components

- **AuthCard** (shared): Same container.
- **InputField** (from [components.md](components.md)): Email input.
- **Neural-Gradient CTA Button** (from [components.md](components.md) #11): "Send Reset Link" button.
- **ConfirmationMessage** (NEW): Success state content with checkmark icon (`tertiary` color), headline, description with the submitted email echoed back, and "Resend email" action link.
- **Text Link**: "Back to Sign In" in `primary` color.

### Interactions

1. **Submit email** -- Click "Send Reset Link". Button shows loading state. Card content transitions to confirmation state with animation (fade-out form, fade-in confirmation).
2. **Resend email** -- Click "Resend email" link in confirmation state. Brief loading state, then "Email sent again" confirmation.
3. **Back to Sign In** -- Click link. Routes to Auth / Login.

### Data Requirements

| UI Field | Source | Tag | Notes |
|----------|--------|-----|-------|
| email | User input | aspirational | No auth backend or email service |
| confirmation state | Form submission | aspirational | No backend to process reset |

### Navigation

- **Entry:** "Forgot password?" link from Login screen
- **Exit:** Login (link), email inbox (external, aspirational)

### New Components Needed

- **ConfirmationMessage**: Success/confirmation display with icon, headline, and description

---

## Onboarding / Welcome

**Purpose:** First-run experience after signup that introduces NeuroCut and guides the user to their first analysis.

### Layout

Full-width page without sidebar (not yet in the main app shell). Single-column centered layout with hero section.

```
+---------------------------------------------------------------+
|                                                               |
|  [NeuroCut logo]                              [Skip -->]      |
|                                                               |
|           +-----------------------------------+               |
|           |                                   |               |
|           |   [Illustration Placeholder]      |               |
|           |   Brain + video visualization     |               |
|           |                                   |               |
|           +-----------------------------------+               |
|                                                               |
|           "Welcome to NeuroCut"                               |
|           (headline-lg, Space Grotesk)                        |
|                                                               |
|           "Predict how your audience's brain                  |
|            responds to your video content.                    |
|            Upload a video, get neural                         |
|            activation scores in minutes."                     |
|           (body-md, on-surface-variant)                       |
|                                                               |
|           [ Upload Your First Video  --> ]                    |
|           (neural-gradient CTA, large)                        |
|                                                               |
|           Step Indicator:  (o) (o) (o)                        |
|           "1 of 1" or expandable for future steps             |
|                                                               |
+---------------------------------------------------------------+
```

### Components

- **HeroIllustrationPlaceholder** (NEW): Large centered placeholder area (aspect-ratio 16:9, max-width 600px) with `surface-container` background and centered brain/video icon. In v1 this is a styled placeholder; real illustration to be created later.
- **Neural-Gradient CTA Button** (from [components.md](components.md) #11): "Upload Your First Video" -- large variant, centered.
- **StepIndicator** (NEW): Dot-based step indicator for multi-step onboarding. For v1, single step. Props: `currentStep: number`, `totalSteps: number`. Dots use `primary` for current, `on-surface-variant` for others.
- **Text Link**: "Skip" link in top-right, `on-surface-variant` color. Navigates to Dashboard.

### Interactions

1. **Click CTA** -- "Upload Your First Video" navigates to Upload screen.
2. **Click Skip** -- "Skip" link navigates to Dashboard.

### Data Requirements

| UI Field | Source | Tag | Notes |
|----------|--------|-----|-------|
| illustration | Static asset | aspirational | Placeholder in v1, real illustration later |
| copy text | Static strings | real | Hardcoded marketing copy |
| user name | Auth context | aspirational | No auth system to provide name |

### Navigation

- **Entry:** Redirect from Sign Up on successful registration
- **Exit:** Upload (CTA), Dashboard (Skip)

### New Components Needed

- **HeroIllustrationPlaceholder**: Large centered placeholder for onboarding illustrations
- **StepIndicator**: Dot-based step navigation for multi-step flows

---

## Settings / Account

**Purpose:** Allows the user to view and edit their profile information, change password, and manage notification preferences.

### Layout

Uses the standard app shell (Sidebar Nav + Top Bar) with a settings-specific content area.

```
+----------+----------------------------------------------------+
|          | Top Bar                                            |
| Sidebar  | [< Back to Dashboard]  Settings        [avatar]   |
| Nav      +----------------------------------------------------+
|          |                                                    |
| Upload   |  Settings / Account                                |
| Process  |                                                    |
| Results  |  +----------------------------------------------+  |
| Dashbrd  |  | FormSection: Profile Information             |  |
|          |  |                                              |  |
| ------   |  | Display Name                                 |  |
| New      |  | [________________________]                   |  |
| Analysis |  |                                              |  |
|          |  | Email                                        |  |
| ------   |  | [________________________] (read-only)       |  |
| Settings*|  |                                              |  |
| Support  |  | [ Save Changes ]                             |  |
|          |  +----------------------------------------------+  |
|          |                                                    |
|          |  +----------------------------------------------+  |
|          |  | FormSection: Change Password                 |  |
|          |  |                                              |  |
|          |  | Current Password                             |  |
|          |  | [________________________]                   |  |
|          |  | New Password                                 |  |
|          |  | [________________________]                   |  |
|          |  | Confirm New Password                         |  |
|          |  | [________________________]                   |  |
|          |  |                                              |  |
|          |  | [ Update Password ]                          |  |
|          |  +----------------------------------------------+  |
|          |                                                    |
|          |  +----------------------------------------------+  |
|          |  | FormSection: Notifications                   |  |
|          |  |                                              |  |
|          |  | Analysis Complete   [toggle]                 |  |
|          |  | Processing Failed   [toggle]                 |  |
|          |  | Product Updates     [toggle]                 |  |
|          |  +----------------------------------------------+  |
+----------+----------------------------------------------------+
```

### Components

- **Sidebar Nav** (from [components.md](components.md) #1): Settings item active.
- **Top Bar** (from [components.md](components.md) #2): Back arrow to Dashboard, "Settings" title.
- **FormSection** (NEW): Grouped form container with title. Background `surface-container`, `rounded-xl`, padding `card-padding-md`. Title in `headline-sm` `Space Grotesk`.
- **InputField** (from [components.md](components.md)): Display name, email (read-only variant), password fields. Standard bottom-border input pattern from design-tokens.md.
- **Toggle** (NEW): On/off switch for notification preferences. On state: `tertiary` track color. Off state: `on-surface-variant` track. Props: `checked: boolean`, `onChange: () => void`, `label: string`.
- **Button** (secondary variant): "Save Changes" and "Update Password" -- `surface-container-highest` background with ghost border.

### Interactions

1. **Edit display name** -- Modify text, click "Save Changes". Button shows loading state. Success: brief `tertiary` flash confirmation. Error: inline error message.
2. **Change password** -- Fill current + new + confirm, click "Update Password". Validates match. Success: fields clear, confirmation message. Error: inline error.
3. **Toggle notifications** -- Click toggle. Immediate state change (optimistic update). Failure: revert toggle, show error toast.

### Data Requirements

| UI Field | Source | Tag | Notes |
|----------|--------|-----|-------|
| display name | User profile | aspirational | No user profile system |
| email | User auth record | aspirational | No auth system |
| current password | User input | aspirational | No auth system |
| notification preferences | User settings store | aspirational | No settings backend |

### Navigation

- **Entry:** "Settings" link in Sidebar Nav footer, or direct URL
- **Exit:** Dashboard (back arrow), any screen via Sidebar Nav

### New Components Needed

- **FormSection**: Grouped form container with section title
- **Toggle**: On/off switch control for boolean settings

---

## Settings / Billing

**Purpose:** Displays current plan, credit balance, purchase options, and transaction history.

### Layout

Same app shell as Account settings. Settings sub-navigation could be tabs or a secondary nav within content area.

```
+----------+----------------------------------------------------+
|          | Top Bar                                            |
| Sidebar  | [< Back to Dashboard]  Settings        [avatar]   |
| Nav      +----------------------------------------------------+
|          |                                                    |
| Upload   |  Settings / Billing                                |
| Process  |                                                    |
| Results  |  Quick Stats Row                                   |
| Dashbrd  |  +------------+ +------------+ +------------+      |
|          |  | Current    | | Credits    | | Total      |      |
| ------   |  | Plan       | | Balance    | | Spent      |      |
| New      |  | "Pro"      | | 450        | | $24.50     |      |
| Analysis |  +------------+ +------------+ +------------+      |
|          |                                                    |
| ------   |  +----------------------------------------------+  |
| Settings*|  | Purchase Credits                              |  |
| Support  |  |                                              |  |
|          |  | +----------+ +----------+ +----------+      |  |
|          |  | | 100      | | 500      | | 1000     |      |  |
|          |  | | credits  | | credits  | | credits  |      |  |
|          |  | | $9.99    | | $39.99   | | $69.99   |      |  |
|          |  | | [Buy]    | | [Buy]    | | [Buy]    |      |  |
|          |  | +----------+ +----------+ +----------+      |  |
|          |  +----------------------------------------------+  |
|          |                                                    |
|          |  +----------------------------------------------+  |
|          |  | Transaction History                          |  |
|          |  |                                              |  |
|          |  | Date      | Type     | Amount  | Balance    |  |
|          |  | Oct 24    | Purchase | +100    | 450        |  |
|          |  | Oct 22    | Analysis | -10     | 350        |  |
|          |  | Oct 20    | Purchase | +100    | 360        |  |
|          |  +----------------------------------------------+  |
+----------+----------------------------------------------------+
```

### Components

- **Sidebar Nav** (from [components.md](components.md) #1): Settings item active.
- **Top Bar** (from [components.md](components.md) #2): Back arrow, "Settings" title.
- **Summary Metric Cards** (from [components.md](components.md) #5): Horizontal row of 3 cards -- Current Plan, Credit Balance, Total Spent. Dashboard horizontal variant.
- **CreditPackageCard** (NEW): Card displaying a credit package option. Props: `credits: number`, `price: string`, `popular?: boolean`. Background `surface-container-high`, `rounded-xl`. "Popular" variant has `primary` border. "Buy" button uses secondary style.
- **TransactionHistoryTable** (NEW): Scrollable table showing credit transactions. Columns: Date, Type (Purchase/Analysis/Refund), Amount (+/-), Running Balance. Alternating row backgrounds using `surface-container` / `surface-container-low`. Sortable by date.
- **FormSection** (from Settings / Account): Container for "Purchase Credits" section.

### Interactions

1. **Purchase credits** -- Click "Buy" on a package card. Opens confirmation dialog. On confirm: loading state, process payment (aspirational). Success: balance updates, transaction added to history.
2. **View transaction history** -- Scrollable table, sortable by date column. Click column header to sort.
3. **Plan upgrade** -- "Upgrade" link in Current Plan card navigates to plan comparison (aspirational, not specced for v1).

### Data Requirements

| UI Field | Source | Tag | Notes |
|----------|--------|-----|-------|
| current plan | Subscription system | aspirational | No billing system exists |
| credit balance | Billing system | aspirational | Show static "450" placeholder |
| total spent | Billing system | aspirational | No payment history |
| credit packages | Static config | aspirational | Pricing not finalized |
| transaction history | Billing database | aspirational | No transaction records |

### Navigation

- **Entry:** "Billing" tab/link within Settings, or direct URL
- **Exit:** Account settings (sibling tab), any screen via Sidebar Nav

### New Components Needed

- **CreditPackageCard**: Credit purchase option card
- **TransactionHistoryTable**: Scrollable, sortable transaction history

---

## Error / 404

**Purpose:** Displayed when the user navigates to a URL that does not match any known route.

### Layout

Centered, minimal layout. No sidebar nav -- error pages stand alone to avoid confusion about what failed.

```
+---------------------------------------------------------------+
|                                                               |
|  [NeuroCut logo]                                              |
|                                                               |
|           +-----------------------------------+               |
|           |                                   |               |
|           |   [Illustration Placeholder]      |               |
|           |   Lost/confused visual metaphor   |               |
|           |                                   |               |
|           +-----------------------------------+               |
|                                                               |
|           "404"                                               |
|           (display-lg, Space Grotesk, primary)                |
|                                                               |
|           "Page not found"                                    |
|           (headline-lg, Space Grotesk)                        |
|                                                               |
|           "The page you're looking for                        |
|            doesn't exist or has been moved."                  |
|           (body-md, on-surface-variant)                       |
|                                                               |
|           [ Back to Dashboard  --> ]                          |
|           (neural-gradient CTA)                               |
|                                                               |
+---------------------------------------------------------------+
```

### Components

- **ErrorIllustrationPlaceholder** (NEW): Centered placeholder (max-width 300px, aspect 1:1) with `surface-container` background and icon. Reused for all error pages with different icons/themes.
- **Neural-Gradient CTA Button** (from [components.md](components.md) #11): "Back to Dashboard" -- standard size, centered.
- **NeuroCut logo**: Small wordmark at top-left for brand context.

### Interactions

1. **Click CTA** -- "Back to Dashboard" navigates to Dashboard.
2. **Browser back** -- Standard browser back behavior.

### Data Requirements

| UI Field | Source | Tag | Notes |
|----------|--------|-----|-------|
| error code | Route matching | real | 404 determined by router |
| error message | Static strings | real | Hardcoded copy |

### Navigation

- **Entry:** Invalid URL / unmatched route
- **Exit:** Dashboard (CTA), browser back

### New Components Needed

- **ErrorIllustrationPlaceholder**: Centered illustration area for error pages

---

## Error / 500

**Purpose:** Displayed when an unexpected server error occurs.

### Layout

Same centered pattern as 404 with different copy and a retry action.

```
+---------------------------------------------------------------+
|                                                               |
|  [NeuroCut logo]                                              |
|                                                               |
|           +-----------------------------------+               |
|           |                                   |               |
|           |   [Illustration Placeholder]      |               |
|           |   Broken/error visual metaphor    |               |
|           |                                   |               |
|           +-----------------------------------+               |
|                                                               |
|           "Something went wrong"                              |
|           (headline-lg, Space Grotesk)                        |
|                                                               |
|           "We hit an unexpected error.                        |
|            Our team has been notified."                       |
|           (body-md, on-surface-variant)                       |
|                                                               |
|           [ Try Again  --> ]                                  |
|           (neural-gradient CTA)                               |
|                                                               |
|           [Back to Dashboard]                                 |
|           (text link, on-surface-variant)                     |
|                                                               |
+---------------------------------------------------------------+
```

### Components

- **ErrorIllustrationPlaceholder** (shared with 404): Different icon/theme (broken gear or warning triangle).
- **Neural-Gradient CTA Button** (from [components.md](components.md) #11): "Try Again" -- retries the failed action or reloads the page.
- **Text Link**: "Back to Dashboard" as secondary escape route.

### Interactions

1. **Try Again** -- Retries the last failed operation (page reload or re-fetch). Button shows loading state briefly.
2. **Back to Dashboard** -- Navigates to Dashboard.

### Data Requirements

| UI Field | Source | Tag | Notes |
|----------|--------|-----|-------|
| error type | Error boundary / catch | real | Captured from runtime error |
| error ID | Error tracking service | aspirational | No error tracking in v1 |

### Navigation

- **Entry:** Unhandled exception in app, API 500 response
- **Exit:** Retry (same page), Dashboard (link)

### New Components Needed

None -- reuses ErrorIllustrationPlaceholder from 404.

---

## Error / Offline

**Purpose:** Displayed when the browser detects loss of network connectivity.

### Layout

Same centered pattern as other error pages. Includes an auto-retry mechanism.

```
+---------------------------------------------------------------+
|                                                               |
|  [NeuroCut logo]                                              |
|                                                               |
|           +-----------------------------------+               |
|           |                                   |               |
|           |   [Illustration Placeholder]      |               |
|           |   Disconnected visual metaphor    |               |
|           |                                   |               |
|           +-----------------------------------+               |
|                                                               |
|           "You're offline"                                    |
|           (headline-lg, Space Grotesk)                        |
|                                                               |
|           "Check your internet connection.                    |
|            We'll reconnect automatically                      |
|            when you're back online."                          |
|           (body-md, on-surface-variant)                       |
|                                                               |
|           [ConnectionStatusIndicator]                         |
|           Checking connection... (spinner)                    |
|                                                               |
|           [ Retry Now ]                                       |
|           (secondary button)                                  |
|                                                               |
+---------------------------------------------------------------+
```

### Components

- **ErrorIllustrationPlaceholder** (shared): Disconnected/wifi-off themed icon.
- **ConnectionStatusIndicator** (NEW): Shows current connection check status. Props: `status: "checking" | "offline" | "reconnecting" | "online"`. Checking: spinner with `on-surface-variant` text. Offline: red dot with `error` text. Reconnecting: pulsing `secondary` dot. Online: green dot with `tertiary` text -- triggers auto-redirect back to previous page.
- **Button** (secondary variant): "Retry Now" -- manually triggers connection check.

### Interactions

1. **Auto-retry** -- Browser `online` event listener triggers automatic reconnection. When connectivity returns, brief "Reconnected" message with `tertiary` checkmark, then auto-redirect to the page the user was on before going offline.
2. **Manual retry** -- Click "Retry Now" to manually trigger a connection check (fetch a small health endpoint). Shows spinner during check.

### Data Requirements

| UI Field | Source | Tag | Notes |
|----------|--------|-----|-------|
| connection status | Browser navigator.onLine + fetch probe | real | Client-side detection |
| previous route | Router state | real | Where to redirect on reconnection |

### Navigation

- **Entry:** Network loss detected (browser `offline` event or failed fetch)
- **Exit:** Previous page (auto-redirect on reconnection), manual retry

### New Components Needed

- **ConnectionStatusIndicator**: Live connection status display with auto-retry

---

## Profile

**Purpose:** Displays the user's profile information, account age, and aggregate analysis statistics.

### Layout

Uses the standard app shell (Sidebar Nav + Top Bar).

```
+----------+----------------------------------------------------+
|          | Top Bar                                            |
| Sidebar  | [< Back to Dashboard]  Profile         [avatar]   |
| Nav      +----------------------------------------------------+
|          |                                                    |
| Upload   |  +----------------------------------------------+  |
| Process  |  |  Profile Card                                |  |
| Results  |  |                                              |  |
| Dashbrd  |  |  [Avatar Placeholder]                        |  |
|          |  |   (large circle, 96px, surface-container)     |  |
| ------   |  |                                              |  |
| New      |  |  Display Name                                |  |
| Analysis |  |  user@example.com                            |  |
|          |  |  Member since: October 2026                  |  |
|          |  |                                              |  |
| ------   |  |  [ Edit Profile ]                            |  |
| Settings |  +----------------------------------------------+  |
| Support  |                                                    |
|          |  Analysis Stats                                    |
|          |  +------------+ +------------+ +------------+      |
|          |  | Total      | | Average    | | Best       |      |
|          |  | Analyses   | | Score      | | Score      |      |
|          |  | 12         | | 76         | | 96         |      |
|          |  +------------+ +------------+ +------------+      |
|          |                                                    |
|          |  +----------------------------------------------+  |
|          |  | Recent Activity                              |  |
|          |  |                                              |  |
|          |  | Oct 24 - Analyzed "campaign_v4.mp4" (84)     |  |
|          |  | Oct 22 - Analyzed "intro_reel.mp4" (71)      |  |
|          |  | Oct 20 - Analyzed "product_demo.mp4" (96)    |  |
|          |  +----------------------------------------------+  |
+----------+----------------------------------------------------+
```

### Components

- **Sidebar Nav** (from [components.md](components.md) #1): No specific item active (Profile is not a main nav item -- accessed from avatar dropdown or sidebar footer).
- **Top Bar** (from [components.md](components.md) #2): Back arrow, "Profile" title.
- **AvatarUpload** (NEW): Large circular avatar placeholder (96px diameter). Background `surface-container-high`. Default: user initial or person icon in `on-surface-variant`. On hover: overlay with camera icon for upload. Props: `imageUrl?: string`, `initials?: string`, `onUpload?: () => void`.
- **Summary Metric Cards** (from [components.md](components.md) #5): Horizontal row, 3 cards -- Total Analyses, Average Score, Best Score. Same horizontal variant as Dashboard Quick Stats.
- **Activity Feed**: Simple list of recent analysis activity. Each item: date + video filename + score. Uses `body-sm` text, `on-surface-variant` for date, `on-surface` for filename. Contained in a `surface-container` card with `rounded-xl`.
- **Button** (secondary variant): "Edit Profile" navigates to Settings / Account.

### Interactions

1. **Edit Profile** -- Click "Edit Profile" button. Navigates to Settings / Account.
2. **Click activity item** -- Click a recent analysis entry. Navigates to Results Overview for that job.
3. **Upload avatar** -- Click avatar placeholder. Opens file picker for image. Aspirational.

### Data Requirements

| UI Field | Source | Tag | Notes |
|----------|--------|-----|-------|
| display name | User profile | aspirational | No user system |
| email | User auth record | aspirational | No auth system |
| avatar image | User profile | aspirational | No upload/storage |
| member since | User creation date | aspirational | No user record |
| total analyses | Count of jobs | derived | Requires job store (same dependency as Dashboard) |
| average score | Mean of Summary.overall | derived | Requires job store |
| best score | Max of Summary.overall | derived | Requires job store |
| recent activity | Job history | derived | Requires job store |

### Navigation

- **Entry:** Avatar click in Top Bar, user profile card in Sidebar footer
- **Exit:** Settings / Account (Edit Profile), Results Overview (activity item click), any screen via Sidebar Nav

### New Components Needed

- **AvatarUpload**: Circular avatar display with upload interaction
