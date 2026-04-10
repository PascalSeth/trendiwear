import LegalContentWrapper from "@/app/components/LegalContentWrapper";

export default function TermsPage() {
  return (
    <LegalContentWrapper
      title="Terms of Service"
      subtitle="The professional standards of our elite fashion ecosystem."
      lastUpdated="Revised April 10, 2026"
    >
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing Trendizip, you enter into a binding agreement with Trendizip Inc. Whether you are a connoisseur of style or a master artisan, your presence on this platform indicates full acceptance of these high-standard protocols.
        </p>
      </section>

      <section>
        <h2>2. Professional Integrity (Artisans & Boutiques)</h2>
        <p>
          All registered professionals represent the vanguard of our platform. By registering, you agree to:
        </p>
        <ul>
          <li><strong>Quality Guarantee:</strong> Every garment or service must match the description and imagery provided in your archive.</li>
          <li><strong>Timeline Accountability:</strong> You are responsible for meeting delivery deadlines discussed with the client.</li>
          <li><strong>Automated Payouts:</strong> You agree that all earnings will be processed through our automated subaccount system, subject to standard platform service fees.</li>
        </ul>
      </section>

      <section>
        <h2>3. The Marketplace & Escrow</h2>
        <p>
          Trendizip acts as a sophisticated bridge between creators and clients. To protect all parties:
        </p>
        <ul>
          <li><strong>Payment Protection:</strong> Funds for orders are encrypted and managed securely via Paystack/Stripe.</li>
          <li><strong>Dispute Resolution:</strong> In the event of a discrepancy regarding fit or quality, Trendizip reserves the right to mediate the release of funds based on evidence provided by both parties.</li>
        </ul>
      </section>

      <section>
        <h2>4. Creative Intellectual Property</h2>
        <p>
          Designers retain full ownership of their original creations. However, by uploading images to the Trendizip Professional Archive, you grant the platform a non-exclusive right to use these visuals for platform promotion and discovery indexing.
        </p>
      </section>

      <section>
        <h2>5. Smart Discovery & Content</h2>
        <p>
          Users may not use automated tools to scrape our curated &quot;Fashion Discovery&quot; data. This unique mapping of styles and trends is the proprietary intellectual technology of Trendizip. Replicating our discovery algorithms for external use is strictly prohibited.
        </p>
      </section>

      <section>
        <h2>6. Limitation of Liability</h2>
        <p>
          Trendizip provides the digital infrastructure for connection. While we verify our professionals, we are not directly liable for the physical quality of garments or specific stylistic choices made between a client and an artisan. Use of the platform is at your own creative risk.
        </p>
      </section>

      <section>
        <h2>7. Amendments</h2>
        <p>
          As the fashion industry evolves, so do we. We reserve the right to refine these terms at any time. Your continued participation in the Trendizip ecosystem constitutes acceptance of the latest standards.
        </p>
      </section>
    </LegalContentWrapper>
  );
}
