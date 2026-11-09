import type { Metadata } from "next";
import LegalContentWrapper from "@/app/components/LegalContentWrapper";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "TrendiZip Terms and Conditions governing use of the platform, account eligibility, buying, selling, delivery, refunds, and dispute resolution.",
};

export default function TermsConditionsPage() {
  return (
    <LegalContentWrapper
      title="Terms and Conditions"
      subtitle="The binding agreement and professional standards governing the TrendiZip platform."
      lastUpdated="Effective Nov 5, 2026"
    >
      <section>
        <h2>1. About TrendiZip and these Terms</h2>
        <p>
          TrendiZip (trendizip.com and the TrendiZip app) is an online fashion marketplace that
          connects buyers with tailors, designers and fashion sellers (&quot;Professionals&quot;).
          TrendiZip is operated by Stan Paraclete, Shalom Estate, Shalom Junction Road,
          Adenta Municipality, Accra, Ghana (&quot;TrendiZip&quot;, &quot;we&quot;, &quot;us&quot;).
        </p>
        <p>
          These Terms and Conditions (&quot;Terms&quot;) are a binding agreement between you and
          TrendiZip. By creating an account, browsing, buying or selling on TrendiZip, you accept
          these Terms and our <Link href="/privacy-policy">Privacy Policy</Link>. If you do not agree, do not
          use the platform.
        </p>
        <p>
          TrendiZip is a marketplace. Unless a listing clearly says it is sold by TrendiZip, the contract
          for each item or tailoring service is between the buyer and the Professional who listed it.
          TrendiZip provides the platform, payment processing through licensed providers, and
          dispute support as described below.
        </p>
      </section>

      <section>
        <h2>2. Accounts and eligibility</h2>
        <ul>
          <li>
            You must be at least 18 years old, or use TrendiZip with the involvement of a parent or
            guardian who accepts these Terms on your behalf.
          </li>
          <li>
            You must give accurate, current information when you register and keep it up to date.
            Professionals must use their real name or registered business name.
          </li>
          <li>
            You are responsible for keeping your password and login details secret, and for all
            activity on your account. Tell us immediately at <a href="mailto:trendiziponline@gmail.com">trendiziponline@gmail.com</a> if you
            suspect unauthorised use.
          </li>
          <li>
            One person or business may not run multiple accounts to get around a suspension, a
            review, or a free trial.
          </li>
          <li>
            We may verify identity, phone number, mobile money or bank details before activating
            payouts or approving a storefront.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Buying on TrendiZip</h2>
        <p>
          <strong>Orders.</strong> When you place an order, you make an offer to buy from the Professional
          at the price shown. The order is confirmed when payment succeeds and you receive an order
          confirmation. A Professional may decline an order (for example, if an item is out of stock);
          you will then receive a full refund.
        </p>
        <p>
          <strong>Prices.</strong> Prices are shown in Ghana cedis (GHS) unless stated otherwise and
          include any taxes the Professional is required to charge. Delivery fees, where they apply,
          are shown at checkout before you pay.
        </p>
        <p>
          <strong>Payment.</strong> Payments are processed by Paystack (and Stripe for some international
          cards). Accepted methods include mobile money (MTN MoMo, Telecel Cash, AirtelTigo Money),
          debit and credit cards, and other methods shown at checkout. TrendiZip never sees or
          stores your full card number or mobile money PIN. Your payment provider&apos;s own terms
          also apply.
        </p>
        <p>
          <strong>Custom and bespoke orders.</strong> For made-to-measure garments, you are
          responsible for giving accurate measurements, fabric choices and style instructions. The
          Professional will make the garment to what was agreed in the order and in TrendiZip
          messages. Keep important agreements in writing on the platform so they can be checked if
          there is a dispute.
        </p>
        <p>
          <strong>Payment protection.</strong> For orders paid through TrendiZip, we may hold the
          Professional&apos;s payout until the order is marked delivered or the dispute window in section
          5 has passed. Paying a Professional outside TrendiZip removes this protection, and we cannot
          help recover money paid that way.
        </p>
      </section>

      <section>
        <h2>4. Selling on TrendiZip (Professionals)</h2>
        <p>
          <strong>Storefront.</strong> Professionals register through the &quot;Register as a
          Professional&quot; page and get a personal store link they may share on WhatsApp, Instagram,
          TikTok and elsewhere.
        </p>
        <p>
          <strong>Listings.</strong> You must own, or have the right to sell, everything you list. Photos
          and descriptions must show the actual item or your actual work, including fabric, colour,
          size range, price and production time. Do not use other people&apos;s photos without permission.
        </p>
        <p>
          <strong>Free trial and plans.</strong> New Professionals receive a 3-month free trial. Before
          the trial ends, we will tell you the price and terms of any paid plan. You will not be charged
          unless you choose a paid plan. If you do not, your storefront may be paused until you do.
        </p>
        <p>
          <strong>Fees.</strong> TrendiZip may deduct a service fee from each sale. The fee that applies
          is shown in your seller dashboard before you accept the sale. We will give at least 30
          days&apos; notice by email or in the dashboard before increasing any fee.
        </p>
        <p>
          <strong>Payouts.</strong> Earnings are paid automatically to the mobile money or bank account
          you provide, through our payment provider&apos;s subaccount (split payment) system, after any
          service fee and refunds are deducted. Payout timing follows the provider&apos;s settlement
          schedule. You are responsible for giving correct payout details; we are not liable for
          payments sent to details you entered wrongly.
        </p>
        <p>
          <strong>Your responsibilities.</strong> You must fulfil orders as described and by the agreed
          date, communicate with buyers through TrendiZip, honour the refund rules in section 5, and
          handle any taxes, licences and registrations your business needs under Ghanaian law.
        </p>
      </section>

      <section>
        <h2>5. Delivery, returns, refunds and disputes</h2>
        <p>
          <strong>Delivery.</strong> Each listing shows the Professional&apos;s delivery or pickup
          options and estimated timeline. Delivery within Ghana is arranged by the Professional or a
          courier they choose. Risk in the item passes to you when it is delivered to the address you
          gave or collected by you.
        </p>

        <h3>Refund rules at a glance</h3>
        <div className="legal-table-container">
          <table>
            <thead>
              <tr>
                <th scope="col">Situation</th>
                <th scope="col">What you can get</th>
                <th scope="col">Time limit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Order declined or not sent by the Professional</strong></td>
                <td>Full refund</td>
                <td>Automatic</td>
              </tr>
              <tr>
                <td><strong>Item not delivered by the agreed date</strong></td>
                <td>Full refund if not delivered within 7 days after the agreed date</td>
                <td>Request within 14 days of the agreed date</td>
              </tr>
              <tr>
                <td><strong>Ready-made item wrong, damaged or not as described</strong></td>
                <td>Return for refund or replacement</td>
                <td>Report within 48 hours of delivery</td>
              </tr>
              <tr>
                <td><strong>Ready-made item, change of mind</strong></td>
                <td>Return for refund, if unworn, unwashed and with tags; buyer pays return delivery</td>
                <td>Request within 7 days of delivery</td>
              </tr>
              <tr>
                <td><strong>Custom or bespoke item made to your measurements and instructions</strong></td>
                <td>Free alteration or remake if it does not match the agreed order; no refund for change of mind</td>
                <td>Report within 48 hours of delivery</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>How to request a refund.</strong> Open the order in your account and choose &quot;Report
          a problem&quot;, or email <a href="mailto:trendiziponline@gmail.com">trendiziponline@gmail.com</a> with your order number, photos and
          a short description. The Professional has 3 days to respond. If you cannot agree,
          TrendiZip will review the evidence from both sides and decide whether to release, partly
          refund or fully refund the payment. Our decision on held funds is final for the purposes
          of the platform, but does not remove any legal rights you have.
        </p>
        <p>
          <strong>Refund payment.</strong> Approved refunds go back to the original payment method
          (card or mobile money) within 5–10 business days, depending on your bank or network.
          Delivery fees are refunded when the Professional is at fault.
        </p>
      </section>

      <section>
        <h2>6. Prohibited conduct</h2>
        <p>You must not:</p>
        <ul>
          <li>sell counterfeit, stolen or illegal goods, or copy another designer&apos;s protected work;</li>
          <li>post false reviews, misleading listings, or photos you do not have rights to;</li>
          <li>harass, threaten or defraud other users;</li>
          <li>ask buyers to pay outside TrendiZip to avoid fees;</li>
          <li>scrape, copy or reverse-engineer the platform, its data or its discovery features;</li>
          <li>upload viruses or interfere with the platform&apos;s security or operation.</li>
        </ul>
      </section>

      <section>
        <h2>7. Content and intellectual property</h2>
        <p>
          The TrendiZip name, logo, site design and software belong to TrendiZip. Professionals
          keep ownership of their designs and photos. By uploading them, you give TrendiZip a free,
          non-exclusive, worldwide licence to display them on the platform and use them to
          promote TrendiZip and your storefront, for as long as they are on the platform and for a
          reasonable period after removal for already-published promotions.
        </p>
      </section>

      <section>
        <h2>8. Suspension and closing accounts</h2>
        <p>
          You may close your account at any time by emailing us; open orders must be completed or
          refunded first. We may suspend or close an account, remove listings, or hold payouts if we
          reasonably believe these Terms have been broken, fraud is involved, or the law requires it.
          Where possible we will tell you why and give you a chance to respond.
        </p>
      </section>

      <section>
        <h2>9. Liability</h2>
        <p>
          We work to keep TrendiZip available and secure, but the platform is provided &quot;as is&quot;
          and may sometimes be unavailable. Professionals are responsible for the quality, safety
          and legality of what they sell. To the extent the law allows, TrendiZip is not liable for
          indirect or consequential losses, and our total liability to you for any claim is limited to the
          fees TrendiZip received from the transaction in question, or GHS 500 where no
          transaction is involved. Nothing in these Terms limits liability that cannot be limited under
          Ghanaian law, including for fraud.
        </p>
      </section>

      <section>
        <h2>10. Changes to these Terms</h2>
        <p>
          We may update these Terms. We will post the new version on this page with a new
          effective date, and give at least 14 days&apos; notice of material changes by email or on the
          site. Continued use after that date means you accept the updated Terms.
        </p>
      </section>

      <section>
        <h2>11. Governing law</h2>
        <p>
          These Terms are governed by the laws of the Republic of Ghana, including the Electronic
          Transactions Act, 2008 (Act 772). Any dispute that cannot be resolved through our
          support process will be handled by the courts of Ghana.
        </p>
      </section>

      <section>
        <h2>12. Contact us</h2>
        <p>
          TrendiZip (operated by Stan Paraclete)<br />
          Shalom Estate, Shalom Junction Road, Adenta Municipality, Accra, Ghana<br />
          Email: <a href="mailto:trendiziponline@gmail.com">trendiziponline@gmail.com</a><br />
          Website: <Link href="/contact">www.trendizip.com/contact</Link>
        </p>
      </section>
    </LegalContentWrapper>
  );
}

