---
phase: quick
plan: 260409-sjd
type: execute
wave: 1
depends_on: []
files_modified:
  - web/src/app/(auth)/signup/page.tsx
autonomous: true
requirements: []
---

<objective>
Add password strength indicator (4-segment bar) and Terms of Service checkbox to Sign Up page.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Add password strength indicator and terms checkbox to signup page</name>
  <files>web/src/app/(auth)/signup/page.tsx</files>
  <action>
Modify web/src/app/(auth)/signup/page.tsx:

1. Add useState for password and termsAccepted:
   - const [password, setPassword] = useState('')
   - const [termsAccepted, setTermsAccepted] = useState(false)

2. Add password strength calculator function:
   - Check length (>=8), has uppercase, has number, has special char
   - Score 0-4 based on how many criteria met
   - Labels: ['', 'Weak', 'Fair', 'Good', 'Strong']
   - Colors: ['', 'bg-error', 'bg-[#f59e0b]', 'bg-[#eab308]', 'bg-tertiary-container']

3. Below the Password Input, add 4-segment strength bar:
   - 4 small bars in a flex row with gap-1
   - Each bar: h-1 rounded-full, flex-1
   - Filled bars use the strength color, empty use surface-container-lowest
   - Below bars: strength label text in matching color, text-xs

4. Wire password Input with onChange to update password state AND still work with form submission (use a hidden input or controlled input)

5. Before the submit button, add terms checkbox:
   - Custom checkbox (no native browser checkbox — use a clickable div with check icon)
   - Or simpler: use a real checkbox with custom styling
   - Label: "I agree to the Terms of Service and Privacy Policy"
   - "Terms of Service" and "Privacy Policy" are Links (href="#" placeholder)
   - Styled with text-primary for links

6. Disable submit button when !termsAccepted:
   - Add disabled prop to Button when !termsAccepted
   - Button should show reduced opacity when disabled

Match existing design system: no borders, tonal colors, text-on-surface-variant for labels.
  </action>
  <verify>Password strength bar updates in real-time. Terms checkbox gates submission. All styling matches design system.</verify>
  <done>Sign Up page has password strength indicator and terms checkbox</done>
</task>

</tasks>
