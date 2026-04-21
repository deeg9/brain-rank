import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions - BrainRank",
  description: "Terms and conditions governing your use of BrainRank.",
};

export default function TermsPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Terms and Conditions</h1>
      <p className="text-sm text-gray-500">Effective Date: April 15, 2026</p>
      <p className="text-sm text-gray-500 mb-8">Last Updated: April 20, 2026</p>

      <div className="not-prose rounded-xl border border-black/10 bg-gray-50 p-5 mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
          Research Beta Notice
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          BrainRank is currently operating as a non-commercial research beta. No fees are
          collected, the Creator tier is paused, and uploads are additionally governed by our{" "}
          <a href="/research-agreement" className="underline">
            Contribution Agreement
          </a>
          .
        </p>
      </div>

      <p>
        These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the BrainRank website,
        applications, and related services (collectively, the &quot;Service&quot;) operated by BrainRank
        (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or using the Service, you agree to be bound
        by these Terms. If you do not agree to these Terms, you may not access or use the Service.
      </p>

      {/* 1. Acceptance of Terms */}
      <h2 className="font-headline">1. Acceptance of Terms</h2>
      <p>
        By creating an account, accessing, or using the Service, you acknowledge that you have read, understood, and
        agree to be bound by these Terms and our{" "}
        <a href="/privacy">Privacy Policy</a>, which is incorporated herein by reference. We reserve the right to
        modify these Terms at any time. Material changes will be posted on this page with an updated effective date.
        Your continued use of the Service after such changes constitutes acceptance of the modified Terms.
      </p>

      {/* 2. Description of Service */}
      <h2 className="font-headline">2. Description of Service</h2>
      <p>
        BrainRank is an AI-powered content analysis platform that uses brain-predictive modeling to generate neural
        activation scores for user-submitted content. The Service processes uploaded videos, images, and text through
        Meta&apos;s TRIBE v2 foundation model and returns per-segment predictions of neural engagement. These
        predictions are computational estimates derived from machine learning models trained on functional magnetic
        resonance imaging (fMRI) data. They are <strong>not</strong> actual brain scans, medical measurements, or
        recordings of real viewer brain activity.
      </p>

      {/* 3. Eligibility */}
      <h2 className="font-headline">3. Eligibility</h2>
      <p>
        You must be at least 13 years of age to use the Service. If you are between 13 and 18 years of age (or the
        age of majority in your jurisdiction), you may only use the Service under the supervision of a parent or legal
        guardian who agrees to be bound by these Terms. By using the Service, you represent and warrant that you meet
        these eligibility requirements.
      </p>

      {/* 4. Account Registration */}
      <h2 className="font-headline">4. Account Registration</h2>
      <p>
        To use certain features of the Service, you must create an account. You agree to:
      </p>
      <ul>
        <li>Provide accurate, current, and complete information during registration.</li>
        <li>Maintain the security and confidentiality of your login credentials.</li>
        <li>Promptly notify us of any unauthorized use of your account.</li>
        <li>Accept responsibility for all activities that occur under your account.</li>
      </ul>
      <p>
        You may not create more than one account per person. We reserve the right to suspend or terminate accounts
        that we reasonably believe are duplicates or have been created with false information.
      </p>

      {/* 5. Subscription Plans & Billing */}
      <h2 className="font-headline">5. Subscription Plans & Billing</h2>

      <h3 className="font-headline">5.1 Free Tier</h3>
      <p>
        Free accounts are entitled to three (3) content analyses per day. The daily cycle resets at 00:00 UTC.
        Unused credits do not roll over to subsequent days.{" "}
        <strong>
          During the research beta, all accounts use the free tier; the Creator tier is paused.
        </strong>
      </p>

      <h3 className="font-headline">5.2 Creator Tier</h3>
      <p>
        <strong>Paused during the research beta — the Creator tier is not available for new
        subscriptions at this time.</strong>
      </p>
      <p>
        When active, the Creator subscription (&quot;Creator Tier&quot;) provides unlimited content
        analyses and additional features as described on our pricing page. The Creator Tier is
        priced at $20.00 USD per month or $200.00 USD per year (billed annually) when offered.
      </p>

      <h3 className="font-headline">5.3 Billing & Renewal</h3>
      <p>
        <strong>No fees are collected during the research beta.</strong> When paid subscriptions
        are active, they automatically renew at the end of each billing period at the then-current
        price unless you cancel before the renewal date. You may cancel your subscription at any
        time. Cancellation takes effect at the end of the current billing period. All payments are
        processed by Stripe, Inc. and are subject to the{" "}
        <a href="https://stripe.com/legal/end-users" target="_blank" rel="noopener noreferrer">
          Stripe Services Agreement
        </a>
        .
      </p>

      <h3 className="font-headline">5.4 Refunds</h3>
      <p>
        All fees are non-refundable except as required by applicable law. No refunds or credits will be issued for
        partial billing periods, downgrades, or unused analyses.
      </p>

      <h3 className="font-headline">5.5 Changes to Pricing, Plans, and Rate Limits</h3>
      <p>
        We may change the pricing of any subscription plan at any time. Pricing changes will not affect your current
        billing period; existing paid subscribers will be notified by email or in-app notice before any change takes
        effect at the next renewal. If you do not agree to the new pricing, you may cancel your subscription before
        the renewal date.
      </p>
      <p>
        Plan features, credit allowances, daily and monthly quotas, rate limits, and other usage parameters are
        subject to change at any time without prior notice in order to maintain Service availability, manage
        infrastructure costs, prevent abuse, or improve the Service. Material changes to the Free Tier or to any
        feature you actively rely on will be reflected on our pricing page with an updated effective date. Your
        continued use of the Service after such changes constitutes acceptance of the modified terms.
      </p>

      <h3 className="font-headline">5.6 Research Beta & Contribution Agreement</h3>
      <p>
        While the Service is operated as a non-commercial research beta, the Service is provided
        free of charge to all users in accordance with the terms of Meta&apos;s TRIBE v2 model
        license (Creative Commons Attribution-NonCommercial 4.0). By uploading content during the
        research beta, you additionally agree to our{" "}
        <a href="/research-agreement">Contribution Agreement</a>, which governs how your uploaded
        media and the resulting neural-activation predictions contribute to the Open Storytelling
        Research Project. In the event of a conflict between these Terms and the Contribution
        Agreement as applied to uploaded media, the Contribution Agreement controls.
      </p>

      {/* 6. Your Content */}
      <h2 className="font-headline">6. Your Content</h2>

      <h3 className="font-headline">6.1 Ownership</h3>
      <p>
        You retain all ownership rights in the content you upload to the Service (&quot;Your Content&quot;). BrainRank
        does not claim ownership of Your Content.
      </p>

      <h3 className="font-headline">6.2 License Grant</h3>
      <p>
        By uploading Your Content, you grant BrainRank a limited, non-exclusive, royalty-free, worldwide license to
        store, process, transmit, and display Your Content solely as necessary to provide, maintain, and improve the
        Service. This license includes the right to transmit Your Content to our third-party processing infrastructure
        for AI analysis. This license terminates when you delete Your Content or your account, except as required for
        backup, archival, or legal compliance purposes.
      </p>

      <h3 className="font-headline">6.3 Representations</h3>
      <p>You represent and warrant that:</p>
      <ul>
        <li>You own or have the necessary rights, licenses, and permissions to upload and authorize the processing of Your Content.</li>
        <li>Your Content does not infringe, misappropriate, or violate any third party&apos;s intellectual property rights, privacy rights, publicity rights, or any other legal rights.</li>
        <li>Your Content complies with all applicable laws and regulations.</li>
      </ul>

      <h3 className="font-headline">6.4 Public Content</h3>
      <p>
        If you choose to make an analysis public, it will be visible on the Discover page and your public profile.
        Other authenticated users may view and bookmark your public analyses. You may change the visibility of any
        analysis at any time.
      </p>

      {/* 7. AI-Generated Analysis Results */}
      <h2 className="font-headline">7. AI-Generated Analysis Results</h2>
      <p>You acknowledge and agree that:</p>
      <ul>
        <li>
          Analysis results are <strong>computational estimates</strong> generated by artificial intelligence models.
          They are not measurements of actual brain activity, medical data, or scientific findings.
        </li>
        <li>
          Results are probabilistic in nature and may be inaccurate, inconsistent, incomplete, or unreliable. We make
          no representations regarding the accuracy or reliability of any analysis results.
        </li>
        <li>
          Similar or identical content submitted by different users may produce similar or identical results.
        </li>
        <li>
          You are solely responsible for any decisions, actions, or strategies you undertake based on analysis results.
          BrainRank does not warrant that results will improve your content performance, engagement, revenue, or any
          other metric.
        </li>
        <li>
          Analysis results do not constitute medical advice, scientific findings, professional recommendations, or any
          form of expert opinion. See our <a href="/disclaimer">Disclaimer</a> for additional information.
        </li>
      </ul>

      {/* 8. Acceptable Use */}
      <h2 className="font-headline">8. Acceptable Use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>Upload, transmit, or distribute any content that is unlawful, defamatory, obscene, threatening, abusive, harassing, hateful, or otherwise objectionable.</li>
        <li>Infringe upon or violate the intellectual property rights, privacy rights, or other rights of any third party.</li>
        <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with any person or entity.</li>
        <li>Interfere with or disrupt the Service, servers, or networks connected to the Service.</li>
        <li>Attempt to gain unauthorized access to any portion of the Service, other accounts, computer systems, or networks connected to the Service.</li>
        <li>Use any robot, spider, scraper, or other automated means to access the Service for any purpose without our express written permission.</li>
        <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of the Service.</li>
        <li>Use the Service to develop, train, or improve any competing product or service.</li>
        <li>Use analysis results to make medical diagnoses, treatment decisions, or any health-related determinations.</li>
        <li>Circumvent, disable, or otherwise interfere with any security features of the Service.</li>
      </ul>
      <p>
        We reserve the right to investigate and take appropriate action against anyone who, in our sole discretion,
        violates this provision, including removing content, suspending or terminating accounts, and reporting to law
        enforcement authorities.
      </p>

      {/* 9. Intellectual Property */}
      <h2 className="font-headline">9. Intellectual Property</h2>
      <p>
        The Service, including its design, features, functionality, text, graphics, logos, icons, and software, is
        owned by BrainRank and is protected by copyright, trademark, and other intellectual property laws. You may not
        copy, modify, distribute, sell, or lease any part of the Service, nor may you reverse engineer or attempt to
        extract the source code of any software, unless permitted by applicable law.
      </p>
      <p>
        &quot;BrainRank&quot; and the BrainRank logo are trademarks of BrainRank. You may not use our trademarks
        without our prior written consent.
      </p>

      {/* 10. Privacy */}
      <h2 className="font-headline">10. Privacy</h2>
      <p>
        Your use of the Service is also governed by our <a href="/privacy">Privacy Policy</a>, which describes how we
        collect, use, and disclose your personal information. By using the Service, you consent to the data practices
        described in the Privacy Policy.
      </p>

      {/* 11. Disclaimer of Warranties */}
      <h2 className="font-headline">11. Disclaimer of Warranties</h2>
      <p className="uppercase text-sm font-semibold">
        THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT WARRANTIES OF ANY
        KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, BRAINRANK DISCLAIMS ALL
        WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
        FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
      </p>
      <p className="uppercase text-sm font-semibold">
        WITHOUT LIMITING THE FOREGOING, BRAINRANK DOES NOT WARRANT THAT: (A) THE SERVICE WILL BE UNINTERRUPTED,
        TIMELY, SECURE, OR ERROR-FREE; (B) THE RESULTS OBTAINED FROM THE SERVICE WILL BE ACCURATE, RELIABLE, OR
        COMPLETE; (C) THE QUALITY OF ANY ANALYSIS, INFORMATION, OR OTHER MATERIAL OBTAINED THROUGH THE SERVICE WILL
        MEET YOUR EXPECTATIONS; OR (D) ANY ERRORS IN THE SERVICE WILL BE CORRECTED.
      </p>
      <p className="uppercase text-sm font-semibold">
        AI-GENERATED ANALYSIS RESULTS ARE COMPUTATIONAL ESTIMATES THAT MAY CONTAIN ERRORS, INACCURACIES, OR
        INCONSISTENCIES. YOU ACKNOWLEDGE THAT YOU USE THE SERVICE AND RELY ON ANALYSIS RESULTS ENTIRELY AT YOUR OWN
        RISK.
      </p>

      {/* 12. Limitation of Liability */}
      <h2 className="font-headline">12. Limitation of Liability</h2>
      <p className="uppercase text-sm font-semibold">
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL BRAINRANK, ITS OFFICERS, DIRECTORS,
        EMPLOYEES, AGENTS, AFFILIATES, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
        OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL,
        BUSINESS OPPORTUNITIES, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH: (A) YOUR ACCESS TO
        OR USE OF (OR INABILITY TO ACCESS OR USE) THE SERVICE; (B) ANY CONTENT OR ANALYSIS RESULTS OBTAINED FROM THE
        SERVICE; (C) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON OR RELATED TO THE SERVICE; OR (D) UNAUTHORIZED
        ACCESS, USE, OR ALTERATION OF YOUR CONTENT OR INFORMATION.
      </p>
      <p className="uppercase text-sm font-semibold">
        IN NO EVENT SHALL BRAINRANK&apos;S TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING
        TO THE SERVICE EXCEED THE GREATER OF: (A) THE AMOUNTS YOU HAVE PAID TO BRAINRANK IN THE TWELVE (12) MONTHS
        PRECEDING THE CLAIM; OR (B) ONE HUNDRED DOLLARS ($100.00 USD).
      </p>
      <p>
        Some jurisdictions do not allow the exclusion or limitation of certain damages. In such jurisdictions, our
        liability shall be limited to the maximum extent permitted by law.
      </p>

      {/* 13. Indemnification */}
      <h2 className="font-headline">13. Indemnification</h2>
      <p>
        You agree to indemnify, defend, and hold harmless BrainRank and its officers, directors, employees, agents,
        and affiliates from and against any and all claims, damages, obligations, losses, liabilities, costs, and
        expenses (including reasonable attorneys&apos; fees) arising from: (a) your access to or use of the Service;
        (b) Your Content; (c) your violation of these Terms; (d) your violation of any third-party right, including
        intellectual property, privacy, or publicity rights; or (e) any claim that Your Content caused damage to a
        third party.
      </p>

      {/* 14. Termination */}
      <h2 className="font-headline">14. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time, with or without cause or notice, including
        if we reasonably believe you have violated these Terms. Upon termination: (a) your license to use the Service
        immediately ceases; (b) we may delete Your Content and account data from our active systems; and (c) you will
        not be entitled to any refund of fees paid.
      </p>
      <p>
        You may delete your account at any time. You are solely responsible for creating backup copies of Your Content
        before deletion.
      </p>
      <p>
        Sections 6.2, 7, 9, 11, 12, 13, 16, and 17 shall survive any termination of these Terms.
      </p>

      {/* 15. Copyright Infringement (DMCA) */}
      <h2 className="font-headline">15. Copyright Infringement (DMCA)</h2>
      <p>
        If you believe that content on the Service infringes your copyright, please send a notice to our designated
        copyright agent with the following information:
      </p>
      <ol>
        <li>A physical or electronic signature of the person authorized to act on behalf of the copyright owner.</li>
        <li>Identification of the copyrighted work claimed to have been infringed.</li>
        <li>Identification of the material that is claimed to be infringing, with sufficient detail to locate the material.</li>
        <li>Your contact information (address, telephone number, email address).</li>
        <li>A statement that you have a good-faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law.</li>
        <li>A statement, under penalty of perjury, that the information in the notice is accurate and that you are authorized to act on behalf of the copyright owner.</li>
      </ol>
      <p>
        <strong>Copyright Agent Email:</strong> team@trybrainrank.com
      </p>

      {/* 16. Governing Law */}
      <h2 className="font-headline">16. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United
        States, without regard to its conflict of law provisions. You agree to submit to the personal and exclusive
        jurisdiction of the courts located in the State of Delaware for the resolution of any disputes not subject to
        arbitration.
      </p>

      {/* 17. Dispute Resolution */}
      <h2 className="font-headline">17. Dispute Resolution</h2>

      <h3 className="font-headline">17.1 Informal Resolution</h3>
      <p>
        Before filing any formal proceedings, you agree to first attempt to resolve any dispute, claim, or controversy
        arising out of or relating to these Terms or the Service (&quot;Dispute&quot;) informally by contacting us at
        team@trybrainrank.com. We will attempt to resolve the Dispute informally for at least thirty (30) days before
        either party may initiate arbitration.
      </p>

      <h3 className="font-headline">17.2 Binding Arbitration</h3>
      <p>
        If a Dispute cannot be resolved informally, you and BrainRank agree that the Dispute shall be resolved through
        binding individual arbitration administered by the American Arbitration Association (&quot;AAA&quot;) under its
        Consumer Arbitration Rules. The arbitration shall be conducted by a single neutral arbitrator. The arbitration
        may be conducted in person, through the submission of documents, by phone, or online.
      </p>

      <h3 className="font-headline">17.3 Class Action and Jury Trial Waiver</h3>
      <p className="uppercase text-sm font-semibold">
        YOU AND BRAINRANK AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL
        CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE
        PROCEEDING. UNLESS BOTH PARTIES AGREE OTHERWISE, THE ARBITRATOR MAY NOT CONSOLIDATE MORE THAN ONE
        PERSON&apos;S CLAIMS. YOU AND BRAINRANK WAIVE ANY RIGHT TO A JURY TRIAL.
      </p>

      <h3 className="font-headline">17.4 Opt-Out</h3>
      <p>
        You may opt out of this arbitration provision by sending written notice to team@trybrainrank.com within thirty
        (30) days of first accepting these Terms. Your notice must include your name, email address, and a clear
        statement that you wish to opt out of binding arbitration.
      </p>

      <h3 className="font-headline">17.5 Exceptions</h3>
      <p>
        Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in any court of
        competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of a
        party&apos;s copyrights, trademarks, trade secrets, patents, or other intellectual property rights.
      </p>

      {/* 18. Severability */}
      <h2 className="font-headline">18. Severability</h2>
      <p>
        If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions
        shall continue in full force and effect. The invalid provision shall be modified to the minimum extent
        necessary to make it valid and enforceable while preserving its original intent.
      </p>

      {/* 19. Entire Agreement */}
      <h2 className="font-headline">19. Entire Agreement</h2>
      <p>
        These Terms, together with the Privacy Policy and Disclaimer, constitute the entire agreement between you and
        BrainRank regarding your use of the Service and supersede all prior and contemporaneous understandings,
        agreements, representations, and warranties, both written and oral, regarding the Service.
      </p>

      {/* 20. Contact */}
      <h2 className="font-headline">20. Contact</h2>
      <p>
        If you have any questions about these Terms, please contact us at:
      </p>
      <p>
        <strong>Email:</strong> team@trybrainrank.com
      </p>
    </article>
  );
}
