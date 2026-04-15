import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - BrainRank",
  description: "How BrainRank collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-sm text-gray-500">Effective Date: April 15, 2026</p>
      <p className="text-sm text-gray-500 mb-8">Last Updated: April 15, 2026</p>

      <p>
        This Privacy Policy describes how BrainRank (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses,
        discloses, and protects your personal information when you access or use our website, applications, and related
        services (collectively, the &quot;Service&quot;). By using the Service, you agree to the collection and use of
        information in accordance with this policy.
      </p>

      {/* 1. Information We Collect */}
      <h2 className="font-headline">1. Information We Collect</h2>

      <h3 className="font-headline">1.1 Account Information</h3>
      <p>
        When you create an account, we collect your email address and password. You may optionally provide additional
        profile information including a username, biography, and profile picture (avatar). Your username, biography,
        and avatar are publicly visible once set.
      </p>

      <h3 className="font-headline">1.2 Content You Upload</h3>
      <p>
        When you use the Service to analyze content, we collect and store the media you upload, including video files,
        image files, and text submissions. This content is stored in our cloud infrastructure and is used solely to
        perform the analysis you request.
      </p>

      <h3 className="font-headline">1.3 Analysis Results</h3>
      <p>
        When we process your content through our AI analysis pipeline, the resulting neural activation scores, segment
        data, brain region activations, and associated metadata are stored in our database and linked to your account.
      </p>

      <h3 className="font-headline">1.4 Payment Information</h3>
      <p>
        If you subscribe to a paid plan, your payment is processed by our third-party payment processor, Stripe, Inc.
        We transmit your email address to Stripe to create a customer record. We do not receive, store, or process
        your credit card number, CVV, or full billing details. Stripe&apos;s collection and use of your payment
        information is governed by the{" "}
        <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
          Stripe Privacy Policy
        </a>
        .
      </p>

      <h3 className="font-headline">1.5 Usage Data</h3>
      <p>
        We track credit consumption for free-tier users to enforce weekly usage limits. This includes records of when
        analyses were initiated and which job they correspond to. We also store subscription status information
        (active, canceled, etc.) synced from Stripe via webhooks.
      </p>

      <h3 className="font-headline">1.6 Automatically Collected Information</h3>
      <p>
        We use essential authentication cookies provided by Supabase to maintain your login session. These are
        strictly functional cookies required for the Service to operate.
      </p>
      <p>
        If you consent to analytics cookies, we use <strong>PostHog</strong>, a product analytics platform, to collect
        usage data including:
      </p>
      <ul>
        <li>Pages viewed and navigation patterns</li>
        <li>Feature usage and interaction events (clicks, form submissions)</li>
        <li>Device type, browser type, and operating system</li>
        <li>Approximate location derived from IP address (country/region level only)</li>
        <li>Session duration and frequency</li>
      </ul>
      <p>
        This data is collected only after you provide consent via our cookie banner. You may decline analytics
        cookies, and the Service will function normally without them.
      </p>
      <p>
        <strong>We do not use:</strong>
      </p>
      <ul>
        <li>Advertising cookies or pixels</li>
        <li>Third-party advertising networks (e.g., Meta Pixel, Google Ads)</li>
        <li>Device fingerprinting</li>
        <li>Cross-site tracking</li>
      </ul>

      {/* 2. How We Use Your Information */}
      <h2 className="font-headline">2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve the Service, including processing your content through our AI analysis pipeline</li>
        <li>Process payments and manage your subscription</li>
        <li>Track and enforce credit usage limits for free-tier accounts</li>
        <li>Display your public profile and public analyses on the Discover page and your profile page (only when you choose to make content public)</li>
        <li>Communicate with you about service-related matters, including account verification, billing, and policy changes</li>
        <li>Detect, investigate, and prevent fraudulent transactions, unauthorized access, and other illegal activities</li>
        <li>Comply with legal obligations</li>
      </ul>

      {/* 3. How We Process Your Content */}
      <h2 className="font-headline">3. How We Process Your Content</h2>
      <p>
        When you submit content for analysis, the following processing occurs:
      </p>
      <ol>
        <li>Your uploaded media is stored securely in our cloud storage infrastructure (hosted by Supabase).</li>
        <li>
          A URL referencing your uploaded content is transmitted to RunPod, a third-party GPU compute provider, where
          Meta&apos;s TRIBE v2 brain-predictive foundation model processes the content and generates neural activation
          predictions.
        </li>
        <li>The resulting analysis data (scores, segments, brain region activations) is returned to our servers and stored in our database.</li>
      </ol>
      <p><strong>Important:</strong></p>
      <ul>
        <li>We do <strong>not</strong> use your content to train, fine-tune, or improve any AI or machine learning models.</li>
        <li>We do <strong>not</strong> sell, license, or otherwise distribute your content to third parties.</li>
        <li>Your content is processed solely to deliver the analysis you requested.</li>
      </ul>

      {/* 4. Third-Party Service Providers */}
      <h2 className="font-headline">4. Third-Party Service Providers</h2>
      <p>
        We engage the following third-party service providers to operate the Service. Each provider&apos;s use of your
        data is governed by their own privacy policy:
      </p>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Purpose</th>
            <th>Data Shared</th>
            <th>Privacy Policy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Supabase</strong></td>
            <td>Database, authentication, file storage</td>
            <td>Account data, uploaded content, analysis results</td>
            <td><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a></td>
          </tr>
          <tr>
            <td><strong>Stripe</strong></td>
            <td>Payment processing, subscription management</td>
            <td>Email address, payment information (collected directly by Stripe)</td>
            <td><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a></td>
          </tr>
          <tr>
            <td><strong>RunPod</strong></td>
            <td>GPU compute for AI model inference</td>
            <td>Content URLs for processing</td>
            <td><a href="https://www.runpod.io/legal/privacy-policy" target="_blank" rel="noopener noreferrer">runpod.io/legal/privacy-policy</a></td>
          </tr>
          <tr>
            <td><strong>PostHog</strong></td>
            <td>Product analytics (with consent)</td>
            <td>Page views, feature usage, device info, approximate location</td>
            <td><a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer">posthog.com/privacy</a></td>
          </tr>
        </tbody>
      </table>
      <p>
        We do not share your personal information with any other third parties for marketing, advertising, or data
        brokering purposes.
      </p>

      {/* 5. Public Content & Social Features */}
      <h2 className="font-headline">5. Public Content & Social Features</h2>
      <ul>
        <li><strong>Private by default.</strong> All analyses are private when created. You must explicitly choose to make an analysis public.</li>
        <li><strong>Public analyses</strong> are visible on the Discover page and your public profile page. Other authenticated users may view and bookmark your public analyses.</li>
        <li><strong>Public profiles</strong> display your username, avatar, biography, and any analyses you have made public.</li>
        <li><strong>View counts</strong> on public analyses are tracked anonymously. We do not record the identity of individual viewers.</li>
        <li>You may change an analysis from public to private (or vice versa) at any time.</li>
      </ul>

      {/* 6. Cookies & Tracking Technologies */}
      <h2 className="font-headline">6. Cookies & Tracking Technologies</h2>
      <p>BrainRank uses the following categories of cookies:</p>

      <h3 className="font-headline">Essential Cookies (Always Active)</h3>
      <p>
        Authentication session cookies provided by Supabase are strictly necessary for the Service to function. These
        cookies maintain your login session and cannot be opted out of while using the Service. They do not track your
        behavior or collect analytics data.
      </p>

      <h3 className="font-headline">Analytics Cookies (Consent Required)</h3>
      <p>
        With your consent, we use PostHog to set analytics cookies that help us understand how you use the Service.
        These cookies track page views, feature interactions, and session data. Analytics cookies are only set after
        you click &quot;Accept&quot; on our cookie consent banner.
      </p>
      <p>You can manage your cookie preferences at any time:</p>
      <ul>
        <li><strong>On first visit:</strong> A cookie consent banner will appear at the bottom of the page. You may accept or decline analytics cookies.</li>
        <li><strong>To change your choice:</strong> Clear your browser&apos;s local storage for this site, and the consent banner will reappear on your next visit.</li>
        <li><strong>Browser settings:</strong> You can block all cookies through your browser settings, though this may affect the functionality of the Service.</li>
      </ul>
      <p>
        We do not use advertising cookies, retargeting pixels, or cross-site tracking technologies.
      </p>

      {/* 7. Data Retention */}
      <h2 className="font-headline">7. Data Retention</h2>
      <ul>
        <li><strong>Account data</strong> is retained for as long as your account is active.</li>
        <li><strong>Uploaded content and analysis results</strong> are retained until you delete them or delete your account.</li>
        <li><strong>Credit usage records</strong> are retained for billing audit and compliance purposes.</li>
        <li><strong>Payment and subscription records</strong> synced from Stripe are retained for financial reconciliation and legal compliance.</li>
        <li><strong>Account deletion:</strong> You may request deletion of your account and associated data by contacting us. Upon account deletion, we will remove your personal data from our active systems, subject to any legal retention requirements.</li>
      </ul>

      {/* 8. Data Security */}
      <h2 className="font-headline">8. Data Security</h2>
      <p>
        We implement reasonable technical and organizational measures to protect your personal information, including:
      </p>
      <ul>
        <li>All data transmitted between your browser and our servers is encrypted via HTTPS/TLS.</li>
        <li>Database access is controlled through row-level security policies, ensuring users can only access their own data.</li>
        <li>Sensitive API keys and service credentials are stored server-side and never exposed to client applications.</li>
        <li>Payment processing is handled entirely by Stripe, a PCI DSS Level 1 certified provider.</li>
      </ul>
      <p>
        While we strive to protect your personal information, no method of transmission over the Internet or method of
        electronic storage is 100% secure. We cannot guarantee absolute security. You use the Service at your own risk.
      </p>

      {/* 9. Children's Privacy */}
      <h2 className="font-headline">9. Children&apos;s Privacy</h2>
      <p>
        The Service is not intended for use by individuals under the age of 13. We do not knowingly collect personal
        information from children under 13. If we become aware that we have collected personal information from a child
        under 13, we will take steps to delete such information promptly. If you believe that a child under 13 has
        provided us with personal information, please contact us at the address below.
      </p>

      {/* 10. Your Rights */}
      <h2 className="font-headline">10. Your Rights</h2>
      <p>Depending on your location, you may have the following rights regarding your personal information:</p>

      <h3 className="font-headline">All Users</h3>
      <ul>
        <li>Access, correct, or update your account information through your Settings page.</li>
        <li>Delete individual analyses and their associated uploaded content.</li>
        <li>Toggle any analysis between public and private.</li>
        <li>Cancel your subscription at any time through the Billing settings.</li>
        <li>Request deletion of your account by contacting us.</li>
      </ul>

      <h3 className="font-headline">California Residents (CCPA/CPRA)</h3>
      <p>If you are a California resident, you have the right to:</p>
      <ul>
        <li>Request disclosure of the categories and specific pieces of personal information we have collected about you.</li>
        <li>Request deletion of your personal information.</li>
        <li>Opt out of the sale or sharing of your personal information. <strong>We do not sell or share your personal information.</strong></li>
        <li>Not be discriminated against for exercising your privacy rights.</li>
      </ul>

      <h3 className="font-headline">European Economic Area, United Kingdom & Switzerland (GDPR)</h3>
      <p>If you are located in the EEA, UK, or Switzerland, you have the right to:</p>
      <ul>
        <li>Access, rectify, or erase your personal data.</li>
        <li>Restrict or object to processing of your personal data.</li>
        <li>Data portability (receive your data in a structured, machine-readable format).</li>
        <li>Withdraw consent at any time where processing is based on consent.</li>
        <li>Lodge a complaint with your local Data Protection Authority.</li>
      </ul>
      <p>
        Our legal bases for processing your personal data include: performance of a contract (providing the Service),
        legitimate interests (improving and securing the Service), compliance with legal obligations, and your consent
        where applicable.
      </p>

      {/* 11. International Data Transfers */}
      <h2 className="font-headline">11. International Data Transfers</h2>
      <p>
        Your information may be transferred to, stored, and processed in the United States and other countries where
        our service providers operate. These countries may have data protection laws that differ from the laws of your
        country. By using the Service, you consent to the transfer of your information to the United States and other
        jurisdictions. We take reasonable steps to ensure that your data is treated securely and in accordance with
        this Privacy Policy.
      </p>

      {/* 12. Changes to This Privacy Policy */}
      <h2 className="font-headline">12. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. If we make material changes, we will notify you by posting
        the updated policy on this page with a revised &quot;Last Updated&quot; date. Your continued use of the Service
        after any changes constitutes your acceptance of the updated policy. We encourage you to review this policy
        periodically.
      </p>

      {/* 13. Contact Us */}
      <h2 className="font-headline">13. Contact Us</h2>
      <p>
        If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please
        contact us at:
      </p>
      <p>
        <strong>Email:</strong> privacy@brainrank.app
      </p>
    </article>
  );
}
