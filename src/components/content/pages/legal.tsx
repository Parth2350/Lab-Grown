import { site } from '@/config/site';
import { TextLink } from '../ui';
import { DataTable, Note, type DocSection } from './InfoShell';

const { address, email } = site.contact;
const addressLine = `${address.street}, ${address.city} ${address.postalCode}, ${address.region}, ${address.country}`;
const Mail = () => <TextLink href={`mailto:${email}`}>{email}</TextLink>;

// ───────────────────────────── privacy ─────────────────────────────

export const privacyIntro = `Your privacy matters as much to us as the jewelry we make. This policy explains, in plain language, what we collect, why, and the choices you have.`;

export const privacySections: DocSection[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: (
      <p>
        This website is operated by {site.legalName} (&ldquo;{site.name}&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), whose registered workshop is at {addressLine}. We
        are responsible for the personal information described in this policy. You can reach us about privacy at any time at <Mail />.
      </p>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'Information we collect',
    body: (
      <>
        <h3>Information you give us</h3>
        <ul>
          <li>Account and order details: your name, email, phone number, billing and delivery addresses, ring size and any engraving text.</li>
          <li>Messages you send through our contact form, email, phone or WhatsApp.</li>
          <li>Bespoke requests, including your design preferences, budget and any inspiration images you upload.</li>
          <li>Partner program applications, including your social media handle, website and audience details.</li>
          <li>Your answers to our Find Your Match quiz, reviews you write, and newsletter sign-ups.</li>
        </ul>
        <h3>Information collected automatically</h3>
        <p>
          When you visit, our servers record technical information such as your IP address, browser type, device and the pages you view. This helps us keep the
          site secure and working properly. Optional analytics are only used with your consent — see our <TextLink href="/pages/cookie-policy">Cookie Policy</TextLink>.
        </p>
        <h3>Information from others</h3>
        <ul>
          <li>Payment confirmations from our payment processor. We never see or store your full card number.</li>
          <li>Delivery updates from our shipping and insurance partners.</li>
          <li>Your name, email address and profile picture if you choose to sign in with Google.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How we use your information',
    body: (
      <ul>
        <li>To make, deliver and support your jewelry — processing payments, arranging insured shipping, returns and warranty repairs.</li>
        <li>To answer your questions and provide client care.</li>
        <li>To design bespoke pieces and prepare proposals for you.</li>
        <li>To review partner program applications and manage partnerships.</li>
        <li>To personalise recommendations, such as the results of our quiz.</li>
        <li>To send you news and offers — only if you have opted in, and you can unsubscribe at any time.</li>
        <li>To prevent fraud, keep our website secure and meet our legal, tax and accounting obligations.</li>
      </ul>
    ),
  },
  {
    id: 'legal-bases',
    title: 'Our legal bases',
    body: (
      <p>
        Depending on where you live, we rely on one or more legal bases to use your information: to perform our contract with you (for example, fulfilling an
        order); our legitimate interests in running and improving our business, balanced against your rights; your consent (for example, marketing emails and
        optional cookies), which you can withdraw at any time; and compliance with legal obligations.
      </p>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share it with',
    body: (
      <>
        <p>
          <strong className="font-normal text-ink">We never sell your personal information.</strong> We share it only with trusted service providers who help us
          run our business, under contracts that require them to protect it and use it solely on our instructions:
        </p>
        <ul>
          <li>payment processors, to take payments securely;</li>
          <li>shipping, customs and insurance partners, to deliver and insure your jewelry;</li>
          <li>cloud hosting, image storage and email providers, to run our website and communicate with you.</li>
        </ul>
        <p>We may also disclose information where required by law, to protect our rights, or as part of a sale or reorganisation of our business.</p>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'International transfers',
    body: (
      <p>
        Our workshop is in India and our clients are worldwide, so your information may be processed in India and in other countries where our service providers
        operate. Wherever it is processed, we take steps — such as contractual safeguards — to ensure it receives a level of protection consistent with this
        policy.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <ul>
        <li>Order and payment records: for as long as tax and accounting laws require, typically eight years.</li>
        <li>Enquiries and client care messages: 24 months after our last contact with you.</li>
        <li>Bespoke requests and inspiration images: 24 months after your request closes, unless they form part of an order.</li>
        <li>Unsuccessful partner applications: 12 months.</li>
        <li>Quiz answers are kept to improve our recommendations and are not used to identify you unless you are signed in.</li>
      </ul>
    ),
  },
  {
    id: 'security',
    title: 'Keeping it secure',
    body: (
      <p>
        We protect your information with encryption in transit, restricted access for our team, and hashed passwords for customer accounts. No system is
        completely secure, but we work continually to safeguard your data and will notify you and the relevant authorities of any breach where the law requires.
      </p>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: (
      <>
        <p>Subject to the laws of your country, you have the right to:</p>
        <ul>
          <li>access the personal information we hold about you and receive a copy;</li>
          <li>ask us to correct or complete it;</li>
          <li>ask us to delete it, or to restrict how we use it;</li>
          <li>object to processing based on our legitimate interests, including direct marketing;</li>
          <li>receive your information in a portable format;</li>
          <li>withdraw your consent at any time;</li>
          <li>complain to your local data protection authority.</li>
        </ul>
        <p>
          To exercise any of these rights, email <Mail />. We may need to verify your identity, and we will respond within 30 days.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: <p>Our website is intended for adults. We do not knowingly collect personal information from anyone under 18.</p>,
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy from time to time. The &ldquo;last updated&rdquo; date at the top of the page shows when it was last revised, and we will tell you
        about significant changes by email or on our website.
      </p>
    ),
  },
];

// ───────────────────────────── terms ─────────────────────────────

export const termsIntro = `These terms explain the agreement between you and ${site.name} when you use our website and buy our jewelry. Please read them carefully — they are written to be clear rather than clever.`;

export const termsSections: DocSection[] = [
  {
    id: 'about',
    title: 'About these terms',
    body: (
      <p>
        These terms form an agreement between you and {site.legalName}, {addressLine}. By using this website or placing an order you agree to them, together with
        our <TextLink href="/pages/privacy-policy">Privacy Policy</TextLink>, <TextLink href="/pages/shipping-policy">Shipping Policy</TextLink>,{' '}
        <TextLink href="/pages/returns">Returns</TextLink> and <TextLink href="/pages/refund-policy">Refund Policy</TextLink>.
      </p>
    ),
  },
  {
    id: 'accounts',
    title: 'Eligibility & your account',
    body: (
      <p>
        You must be at least 18 years old to place an order. If you create an account, please keep your details accurate and your password confidential — you are
        responsible for activity under your account. Tell us straight away if you believe it has been used without your permission.
      </p>
    ),
  },
  {
    id: 'products',
    title: 'Our jewelry',
    body: (
      <>
        <p>
          Our diamonds are laboratory-grown diamonds: real diamonds with the same chemical, physical and optical properties as mined diamonds. Centre diamonds are
          independently graded by IGI or GIA, and the grading report supplied with your piece is the definitive description of its diamond.
        </p>
        <p>
          Every piece is finished by hand, so small variations in appearance from the illustrations on our website are natural. Carat weights, dimensions and metal
          weights are subject to customary industry tolerances.
        </p>
      </>
    ),
  },
  {
    id: 'prices',
    title: 'Prices & payment',
    body: (
      <>
        <p>
          Prices are shown in Indian rupees (INR) and include any applicable discounts. GST and any delivery charges are shown before you pay. Payments are
          processed securely by our payment partner, and we do not store your card details.
        </p>
        <p>
          We work hard to keep prices accurate. If an item is listed at an obviously incorrect price, we will contact you before dispatch and you may either
          proceed at the correct price or cancel for a full refund.
        </p>
      </>
    ),
  },
  {
    id: 'orders',
    title: 'Orders & acceptance',
    body: (
      <p>
        After you place an order we email a confirmation of receipt. Our contract with you is formed when we confirm your order is being prepared or has been
        dispatched. We may decline or cancel an order — for example, if a diamond is no longer available, a pricing error has occurred or we suspect fraud — and
        will refund any payment in full if we do.
      </p>
    ),
  },
  {
    id: 'made-to-order',
    title: 'Made-to-order & bespoke pieces',
    body: (
      <p>
        Production and delivery times shown on our website are estimates; we will keep you informed if anything changes. Bespoke commissions are governed by the
        design proposal you approve, including its timeline, price and deposit terms described in our <TextLink href="/pages/refund-policy">Refund Policy</TextLink>.
      </p>
    ),
  },
  {
    id: 'delivery-risk',
    title: 'Delivery, risk & ownership',
    body: (
      <p>
        Your jewelry is insured by us until it is delivered and signed for, at which point responsibility for it passes to you. Ownership passes to you once we
        have received full payment.
      </p>
    ),
  },
  {
    id: 'returns-warranty',
    title: 'Returns & warranty',
    body: (
      <p>
        You may return eligible items within 30 days of delivery as described in our <TextLink href="/pages/returns">Returns</TextLink> page, and every piece is
        covered by our <TextLink href="/pages/warranty">lifetime manufacturing warranty</TextLink>. These commitments are in addition to your statutory rights as a
        consumer, which are not affected.
      </p>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual property',
    body: (
      <p>
        Our designs, illustrations, photographs, text and branding belong to {site.name} or its licensors and are protected by copyright, design and trade mark
        laws. You may view and share our pages for personal, non-commercial purposes, but you may not copy, reproduce or sell our designs. We will never knowingly
        reproduce another jeweler&apos;s protected design, and we do not recreate a client&apos;s bespoke design for anyone else without their permission.
      </p>
    ),
  },
  {
    id: 'your-content',
    title: 'Reviews & content you share',
    body: (
      <p>
        When you submit a review, image or other content, you give us a non-exclusive, royalty-free licence to display it in connection with our business. Content
        must be honest, lawful and your own. We may moderate or remove content that does not meet these standards.
      </p>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Using our website',
    body: (
      <p>
        Please do not misuse our website — for example, by attempting to gain unauthorised access, introducing malicious code, scraping content at scale or using
        the site for fraudulent purposes. We may suspend access where we reasonably believe these terms have been breached.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Our liability',
    body: (
      <p>
        To the extent permitted by law, we are not liable for losses that were not reasonably foreseeable, or for business losses. Our total liability for any
        order is limited to the price you paid for it. Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or
        for anything else that cannot be limited by law.
      </p>
    ),
  },
  {
    id: 'law',
    title: 'Governing law',
    body: (
      <p>
        These terms are governed by the laws of India, and disputes are subject to the courts of Mumbai. If you are a consumer living elsewhere, you also keep the
        protection of any mandatory laws of your country of residence and may bring proceedings there.
      </p>
    ),
  },
  {
    id: 'changes-contact',
    title: 'Changes & contact',
    body: (
      <p>
        We may update these terms from time to time; the version in force when you place an order applies to that order. Questions are always welcome at <Mail />.
      </p>
    ),
  },
];

// ───────────────────────────── cookies ─────────────────────────────

export const cookieIntro = `Like almost every website, we use a small number of cookies and similar technologies. Here is what they do and how you can control them.`;

export const cookieSections: DocSection[] = [
  {
    id: 'what-are-cookies',
    title: 'What cookies are',
    body: (
      <p>
        Cookies are small text files stored by your browser when you visit a website. Similar technologies, such as your browser&apos;s local and session storage,
        let a site remember information on your device. In this policy we refer to all of them as &ldquo;cookies&rdquo;.
      </p>
    ),
  },
  {
    id: 'categories',
    title: 'How we use them',
    body: (
      <ul>
        <li>
          <strong className="font-normal text-ink">Strictly necessary</strong> — keep you signed in and protect our forms from misuse. These are
          always on, because the website cannot function without them.
        </li>
        <li>
          <strong className="font-normal text-ink">Preferences</strong> — remember your shopping bag, wishlist, comparisons and quiz results on your device.
        </li>
        <li>
          <strong className="font-normal text-ink">Analytics</strong> — help us understand, in aggregate, which pages are useful so we can improve them. Used only with
          your consent.
        </li>
        <li>
          <strong className="font-normal text-ink">Marketing</strong> — measure the effectiveness of our campaigns. Used only with your consent.
        </li>
      </ul>
    ),
  },
  {
    id: 'cookie-list',
    title: 'Cookies we set',
    body: (
      <DataTable
        caption="Cookies and similar technologies used on this website"
        head={['Name', 'Purpose', 'Type', 'Duration']}
        rows={[
          ['next-auth.session-token', 'Keeps you signed in to your account', 'Necessary', '30 days'],
          ['next-auth.csrf-token', 'Protects sign-in and forms against cross-site request forgery', 'Necessary', 'Session'],
          ['next-auth.callback-url', 'Returns you to the right page after signing in', 'Necessary', 'Session'],
          ['Local storage (bag, wishlist, compare)', 'Remembers the pieces you have saved on this device', 'Preferences', 'Until you clear them'],
          ['Session storage (quiz)', 'Keeps your Find Your Match results during your visit', 'Preferences', 'Until the tab is closed'],
        ]}
      />
    ),
  },
  {
    id: 'third-parties',
    title: 'Third-party cookies',
    body: (
      <p>
        We do not embed third-party videos, maps or social
        media widgets that track you across other websites.
      </p>
    ),
  },
  {
    id: 'managing',
    title: 'Managing cookies',
    body: (
      <>
        <p>
          You can block or delete cookies in your browser settings at any time, and most browsers let you do this site by site. Clearing your browser&apos;s site data
          also removes items saved in local storage.
        </p>
        <Note>If you block strictly necessary cookies, signing in will not work correctly.</Note>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes & contact',
    body: (
      <p>
        We will update this policy if the cookies we use change. If you have questions, email <Mail /> or read our{' '}
        <TextLink href="/pages/privacy-policy">Privacy Policy</TextLink>.
      </p>
    ),
  },
];
