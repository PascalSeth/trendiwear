import type { Metadata } from "next";
import LegalContentWrapper from "@/app/components/LegalContentWrapper";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "TrendiZip Privacy Policy detailing what personal data we collect from buyers, professionals and visitors, how we use it, and your rights.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalContentWrapper
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your personal data across the TrendiZip platform."
      lastUpdated="Effective Nov 5, 2026"
    >
      <section>
        <h2>1. Who we are</h2>
        <p>
          TrendiZip (trendizip.com and the TrendiZip app) is a fashion marketplace operated by
          Stan Paraclete, Shalom Estate, Shalom Junction Road, Adenta Municipality, Accra, Ghana.
          We are the data controller for the personal data described here.
        </p>
        <p>
          This policy explains what personal data we collect from buyers, Professionals (tailors,
          designers and sellers) and visitors, why we use it, who we share it with, and the rights you
          have. We process personal data in line with Ghana&apos;s Data Protection Act, 2012 (Act 843),
          and we follow GDPR principles for users outside Ghana.
        </p>
      </section>

      <section>
        <h2>2. Data we collect and why</h2>
        <div className="legal-table-container">
          <table>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Who it applies to</th>
                <th scope="col">Why we use it</th>
                <th scope="col">Legal basis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Name, email, phone number, password</strong> (stored encrypted)</td>
                <td>All account holders</td>
                <td>Create and secure your account, send order and account messages</td>
                <td>Contract</td>
              </tr>
              <tr>
                <td><strong>Delivery address</strong></td>
                <td>Buyers</td>
                <td>Deliver orders</td>
                <td>Contract</td>
              </tr>
              <tr>
                <td><strong>Body measurements and size preferences</strong> (optional)</td>
                <td>Buyers</td>
                <td>Make custom garments that fit</td>
                <td>Consent; you can delete them any time</td>
              </tr>
              <tr>
                <td><strong>Order history, messages with Professionals, reviews</strong></td>
                <td>Buyers and Professionals</td>
                <td>Fulfil orders, resolve disputes, prevent fraud</td>
                <td>Contract, legitimate interests</td>
              </tr>
              <tr>
                <td><strong>Brand or trading name, profile photo, portfolio images, business location</strong></td>
                <td>Professionals</td>
                <td>Build and display your storefront</td>
                <td>Contract</td>
              </tr>
              <tr>
                <td><strong>Mobile money number or bank account details for payouts</strong></td>
                <td>Professionals</td>
                <td>Pay your earnings through Paystack subaccounts</td>
                <td>Contract, legal obligation</td>
              </tr>
              <tr>
                <td><strong>Payment confirmation details</strong> (amount, reference, last 4 card digits or MoMo network)</td>
                <td>Buyers</td>
                <td>Confirm and refund payments</td>
                <td>Contract, legal obligation</td>
              </tr>
              <tr>
                <td><strong>Searches, favourites and styles you view</strong></td>
                <td>All users</td>
                <td>Personalise your feed through our Fashion Discovery feature</td>
                <td>Legitimate interests</td>
              </tr>
              <tr>
                <td><strong>Device, browser, IP address, pages visited</strong></td>
                <td>All visitors</td>
                <td>Keep the site secure, fix errors, measure usage</td>
                <td>Legitimate interests</td>
              </tr>
              <tr>
                <td><strong>Newsletter email</strong></td>
                <td>Subscribers</td>
                <td>Send fashion updates and offers</td>
                <td>Consent; unsubscribe any time</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          We do not collect your full card number, card CVV or mobile money PIN. These are
          entered directly with our payment providers.
        </p>
      </section>

      <section>
        <h2>3. Who we share data with</h2>
        <p>We do not sell your personal data. We share it only as follows:</p>
        <ul>
          <li>
            <strong>Professionals and buyers.</strong> When you order, the Professional receives your name,
            phone number, delivery address and any measurements needed for that order. Buyers
            see a Professional&apos;s public storefront details.
          </li>
          <li>
            <strong>Payment providers.</strong> Paystack and Stripe process payments, refunds and payouts and
            must keep your data secure under their own privacy policies.
          </li>
          <li>
            <strong>Service providers.</strong> Hosting, database, email and analytics providers that run the
            platform for us, under contracts that limit their use of your data.
          </li>
          <li>
            <strong>Delivery partners.</strong> Couriers receive the name, phone number and address needed to
            deliver.
          </li>
          <li>
            <strong>Authorities.</strong> Regulators, courts or police when the law requires it, or to prevent fraud
            or protect users&apos; safety.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. International transfers</h2>
        <p>
          Some of our service providers store data on servers outside Ghana. When that happens,
          we use providers that apply recognised security standards and contractual protections,
          as required by Act 843.
        </p>
      </section>

      <section>
        <h2>5. How long we keep data</h2>
        <ul>
          <li>
            <strong>Account data:</strong> while your account is open, and up to 12 months after you close it.
          </li>
          <li>
            <strong>Order, payment and payout records:</strong> 6 years, for tax and accounting purposes.
          </li>
          <li>
            <strong>Measurements:</strong> until you delete them or close your account.
          </li>
          <li>
            <strong>Newsletter email:</strong> until you unsubscribe.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Security</h2>
        <p>
          We use HTTPS encryption, encrypted passwords, access controls and secure payment
          gateways to protect your data. No system is completely secure; if a breach affects your
          data, we will notify you and the Data Protection Commission as the law requires.
        </p>
      </section>

      <section>
        <h2>7. Your rights</h2>
        <p>You can ask us to:</p>
        <ul>
          <li>give you a copy of the personal data we hold about you;</li>
          <li>correct data that is wrong or incomplete;</li>
          <li>delete your data or close your account (we may keep records the law requires);</li>
          <li>stop using your data for marketing or personalisation;</li>
          <li>withdraw consent you gave, such as for measurements or the newsletter.</li>
        </ul>
        <p>
          Email <a href="mailto:trendiziponline@gmail.com">trendiziponline@gmail.com</a> from your account email. We will reply within 30 days. If
          you are not satisfied, you can complain to Ghana&apos;s Data Protection Commission (
          <a href="https://dataprotection.org.gh" target="_blank" rel="noopener noreferrer">dataprotection.org.gh</a>).
        </p>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          We use essential cookies and similar storage to keep you logged in, remember your cart
          and keep the site secure. We also use analytics cookies to understand how the site is
          used. You can block or delete cookies in your browser settings, but some features, such as
          login and checkout, may stop working.
        </p>
      </section>

      <section>
        <h2>9. Children</h2>
        <p>
          TrendiZip is not meant for children under 13, and we do not knowingly collect their data.
          Users aged 13–17 should use TrendiZip only with a parent or guardian. If you believe a child
          has given us data, contact us and we will delete it.
        </p>
      </section>

      <section>
        <h2>10. Changes to this policy</h2>
        <p>
          We may update this policy. The new version will appear on this page with a new effective
          date, and we will email you about significant changes.
        </p>
      </section>

      <section>
        <h2>11. Contact us</h2>
        <p>
          TrendiZip (operated by Stan Paraclete)<br />
          Shalom Estate, Shalom Junction Road, Adenta Municipality, Accra, Ghana<br />
          Email: <a href="mailto:trendiziponline@gmail.com">trendiziponline@gmail.com</a>
        </p>
      </section>
    </LegalContentWrapper>
  );
}

