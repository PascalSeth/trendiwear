import LegalContentWrapper from "@/app/components/LegalContentWrapper";

export default function PrivacyPage() {
  return (
    <LegalContentWrapper
      title="Privacy Policy"
      subtitle="How we curate your style while protecting your identity."
      lastUpdated="Revised April 10, 2026"
    >
      <section>
        <h2>1. The Vanguard Commitment</h2>
        <p>
          At Trendizip, we believe that true style is personal, and privacy is a fundamental standard of luxury. This policy outlines our rigorous approach to data protection as you navigate our boutique marketplace.
        </p>
      </section>

      <section>
        <h2>2. Information We Curate</h2>
        <p>To provide a bespoke experience, we collect information across three main pillars:</p>
        <ul>
          <li><strong>Identity & Profile:</strong> Your name, email address, and professional credentials if you are an artisan.</li>
          <li><strong>The Fit:</strong> Body measurements and sizing preferences provided voluntarily to ensure garment accuracy.</li>
          <li><strong>Fashion Vibe (Smart Discovery):</strong> We observe your search patterns and favorite styles to train our Discovery Engine locally, ensuring you only see what truly resonates with your aesthetic.</li>
        </ul>
      </section>

      <section>
        <h2>3. Localized Style Intelligence</h2>
        <p>
          Our <strong>Fashion Discovery Engine</strong> uses keyword heuristic mapping to categorize products into &quot;vibes&quot; (e.g., Avant-Garde, Minimalist, Royal). This data is used to personalize your feed and is never sold to third-party advertisers. We value your taste as your intellectual property.
        </p>
      </section>

      <section>
        <h2>4. Transactional Security</h2>
        <p>
          All financial transactions are handled through secure gateways (Paystack and Stripe). Trendizip does not store your full card details or mobile money pins on our servers. When you register as a professional, your mobile money details are used strictly for automated earnings payouts via our secure subaccount system.
        </p>
      </section>

      <section>
        <h2>5. Your Creative Control</h2>
        <p>
          You remain the master of your data. You may at any time:
        </p>
        <ul>
          <li>Access, correct, or delete your body measurements.</li>
          <li>Opt-out of stylized marketing updates.</li>
          <li>Request the permanent removal of your professional archive and profile.</li>
        </ul>
      </section>

      <section>
        <h2>6. Global Standards</h2>
        <p>
          While we are rooted in the artisan communities of Ghana, we adhere to global privacy standards (including GDPR principles) to protect our international clientele and craftspeople.
        </p>
      </section>
    </LegalContentWrapper>
  );
}
