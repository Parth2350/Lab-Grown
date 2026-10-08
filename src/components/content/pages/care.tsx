import { site } from '@/config/site';
import { TextLink } from '../ui';
import { DataTable, Note, Steps, type DocSection } from './InfoShell';

const email = site.contact.email;
const Mail = () => <TextLink href={`mailto:${email}`}>{email}</TextLink>;

// ───────────────────────────── shipping ─────────────────────────────

export const shippingIntro = `Every piece from ${site.name} travels fully insured, from our workshop bench to your door — and standard delivery is always on us.`;

export const shippingSections: DocSection[] = [
  {
    id: 'complimentary-shipping',
    title: 'Complimentary insured shipping',
    body: (
      <>
        <p>
          Every order ships free of charge with our Insured Standard service. Your jewelry is insured for its full value from the moment it leaves our workshop
          until it is signed for, so there is nothing for you to arrange and nothing to pay at checkout for delivery.
        </p>
        <p>If you need your piece sooner, faster options are available at checkout for most destinations.</p>
      </>
    ),
  },
  {
    id: 'delivery-options',
    title: 'Delivery options',
    body: (
      <>
        <DataTable
          caption="Delivery options and timings"
          head={['Service', 'Cost', 'Delivery time*']}
          rows={[
            ['Insured Standard', 'Complimentary', '7–10 business days'],
            ['Insured Express', '$35', '3–5 business days'],
            ['Priority Overnight', '$75', '1–2 business days (major cities only)'],
          ]}
        />
        <p className="text-[15px]">
          *Delivery times are counted from dispatch, not from the date of your order, and exclude weekends and public holidays. Remote areas may take a little
          longer.
        </p>
      </>
    ),
  },
  {
    id: 'production-times',
    title: 'Production & dispatch times',
    body: (
      <>
        <p>Because much of our jewelry is made to order in our own workshop, dispatch times depend on the piece:</p>
        <ul>
          <li>
            <strong className="font-normal text-ink">Ready to ship</strong> — dispatched within 1–3 business days.
          </li>
          <li>
            <strong className="font-normal text-ink">Made to order</strong> — pieces crafted in your choice of metal, purity or diamond are usually dispatched within
            2–3 weeks.
          </li>
          <li>
            <strong className="font-normal text-ink">Engraving</strong> — adds around 2 business days.
          </li>
          <li>
            <strong className="font-normal text-ink">Bespoke commissions</strong> — the timeline is agreed in your design proposal, typically 3–5 weeks after you
            approve the final design.
          </li>
        </ul>
        <p>The estimated dispatch date for every item is shown on the product page and in your order confirmation.</p>
      </>
    ),
  },
  {
    id: 'destinations',
    title: 'Where we deliver',
    body: (
      <p>
        We currently deliver to clients in more than {site.stats.countries.replace('+', '')} countries across North America, Europe, the Middle East and Asia-Pacific,
        as well as throughout India. Available destinations are listed at checkout. If yours is not, write to us at <Mail /> and we will do our best to help.
      </p>
    ),
  },
  {
    id: 'duties-taxes',
    title: 'Duties & taxes',
    body: (
      <>
        <p>
          Import duties and local taxes are set by the destination country. Where we can calculate them in advance, they are shown at checkout; otherwise the
          carrier may collect them before delivery. We will always let you know before dispatch if charges are likely to apply.
        </p>
        <Note>
          For your protection we declare every parcel at its full value. We are unable to mark jewelry as a gift or reduce its declared value — doing so would
          invalidate its insurance.
        </Note>
      </>
    ),
  },
  {
    id: 'packaging',
    title: 'Packaging & discretion',
    body: (
      <p>
        Your piece arrives in our signature presentation box together with its diamond grading report and a care card, inside a plain, unbranded outer carton
        with tamper-evident sealing. Nothing on the outside of the parcel hints at what is inside — useful if you are planning a surprise.
      </p>
    ),
  },
  {
    id: 'tracking',
    title: 'Tracking & signature',
    body: (
      <>
        <p>
          As soon as your order is dispatched we email you a tracking link. An adult signature is required on delivery, and the carrier will not leave the
          parcel unattended. If you will be away, most carriers allow you to reschedule or collect from a nearby depot.
        </p>
        <p>For security, we cannot ship to PO boxes, parcel lockers or freight-forwarding addresses.</p>
      </>
    ),
  },
  {
    id: 'address-changes',
    title: 'Changing your delivery address',
    body: (
      <p>
        Contact us as early as possible if you need to change your address. We can update it at any point before dispatch. Once a parcel is with the carrier,
        insurance conditions mean we are unable to redirect it.
      </p>
    ),
  },
  {
    id: 'lost-or-damaged',
    title: 'Delayed, lost or damaged parcels',
    body: (
      <p>
        If your parcel is delayed, arrives damaged or appears to have been opened, please do not sign for it if you can avoid doing so, and contact us within 48
        hours at <Mail />. Because every shipment is insured, we will repair, replace or refund your order once the carrier&apos;s investigation is complete —
        usually within 5–10 business days.
      </p>
    ),
  },
];

// ───────────────────────────── returns ─────────────────────────────

export const returnsIntro = `Fine jewelry should feel exactly right. If it does not, you have 30 days from delivery to return or exchange it — with a complimentary, fully insured return label.`;

export const returnsSections: DocSection[] = [
  {
    id: 'thirty-days',
    title: 'Our 30-day promise',
    body: (
      <p>
        You may return any eligible piece within 30 days of the delivery date for a full refund or an exchange. Return shipping is complimentary and insured
        for the full value of your jewelry, wherever you are in the world.
      </p>
    ),
  },
  {
    id: 'how-to-return',
    title: 'How to start a return',
    body: (
      <Steps>
        <li>
          Write to <Mail /> or use our <TextLink href="/contact">contact form</TextLink> with your order number and the piece you would like to return or exchange.
        </li>
        <li>Within one business day we will send a prepaid, insured return label and clear packing instructions.</li>
        <li>Place the piece in its original presentation box with its diamond grading report, care card and any accessories, then seal the outer carton.</li>
        <li>Hand the parcel to the carrier or book a collection. Keep your receipt until we confirm that your return has arrived.</li>
      </Steps>
    ),
  },
  {
    id: 'condition',
    title: 'Condition of returned items',
    body: (
      <>
        <p>To qualify for a full refund, returned jewelry must be:</p>
        <ul>
          <li>unworn and in its original condition, without scratches, dents or signs of wear;</li>
          <li>returned with its original grading report — the laser inscription on the diamond must match the report number;</li>
          <li>free from resizing, repairs or alterations made by anyone other than {site.name}.</li>
        </ul>
        <p>
          Every return is inspected by our gemologists. If a piece does not meet these conditions we will contact you to discuss options before anything else
          happens — including returning it to you at no cost.
        </p>
      </>
    ),
  },
  {
    id: 'exceptions',
    title: 'Items we cannot accept for return',
    body: (
      <ul>
        <li>Engraved or personalised pieces, unless they arrive with a fault.</li>
        <li>Bespoke commissions made to your individual design.</li>
        <li>Earrings whose protective hygiene seal has been removed.</li>
        <li>Gift cards.</li>
      </ul>
    ),
  },
  {
    id: 'exchanges',
    title: 'Exchanges & resizing',
    body: (
      <>
        <p>
          Within 30 days you can exchange your piece for a different size, metal or design. If the new piece costs more, we will charge the difference; if it costs
          less, we will refund it.
        </p>
        <p>
          Most ring styles also include one complimentary resize within 60 days of delivery. Eternity and some pavé bands cannot be resized without compromising
          the setting — for those we offer a size exchange instead.
        </p>
      </>
    ),
  },
  {
    id: 'international',
    title: 'International returns',
    body: (
      <p>
        Return shipping is complimentary from every country we deliver to. Import duties you paid on delivery are not always refundable by customs authorities,
        but we will provide the export paperwork you need to reclaim them where your country allows it.
      </p>
    ),
  },
  {
    id: 'refund-timing',
    title: 'When you will be refunded',
    body: (
      <p>
        Once your return passes inspection, your refund is issued to the original payment method. Full details are in our{' '}
        <TextLink href="/pages/refund-policy">Refund Policy</TextLink>.
      </p>
    ),
  },
];

// ───────────────────────────── refunds ─────────────────────────────

export const refundIntro = `Clear, fair and prompt. Here is exactly how refunds work for returns, cancellations and bespoke commissions.`;

export const refundSections: DocSection[] = [
  {
    id: 'timing',
    title: 'When refunds are issued',
    body: (
      <>
        <p>
          We inspect every return within 3 business days of receiving it. Once approved, we issue your refund to the original payment method and email you a
          confirmation.
        </p>
        <p>
          Your bank or card provider may take a further 5–10 business days to show the credit on your statement. If you paid in another currency, the amount you
          receive can differ slightly because of exchange rates set by your bank.
        </p>
      </>
    ),
  },
  {
    id: 'what-is-refunded',
    title: 'What is refunded',
    body: (
      <ul>
        <li>The full price you paid for the returned item, after any discounts applied to your order.</li>
        <li>Taxes collected by us on the returned item.</li>
        <li>Optional express or overnight shipping charges are refunded only if your piece arrived faulty or was not what you ordered.</li>
      </ul>
    ),
  },
  {
    id: 'partial-refunds',
    title: 'Partial refunds',
    body: (
      <>
        <p>We will always contact you before applying any deduction. A partial refund may apply when:</p>
        <ul>
          <li>the diamond grading report is missing — we deduct the laboratory&apos;s fee to re-certify the stone;</li>
          <li>the piece shows wear or damage that needs restoration before it can be offered again.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cancellations',
    title: 'Cancelling an order',
    body: (
      <p>
        You can cancel any order free of charge within 24 hours of placing it, or at any time before production begins, and we will refund you in full. Once a
        made-to-order piece is in production we will complete and deliver it — you then remain covered by our 30-day returns window.
      </p>
    ),
  },
  {
    id: 'bespoke',
    title: 'Bespoke commissions',
    body: (
      <p>
        Your bespoke consultation, sketches and first CAD renders are complimentary. When you approve your final design we ask for a 30% deposit to begin
        production. The deposit is fully refundable until casting begins; after that, bespoke pieces are made exclusively for you and are non-refundable — but
        they are, of course, covered by our <TextLink href="/pages/warranty">lifetime warranty</TextLink>.
      </p>
    ),
  },
  {
    id: 'promotions',
    title: 'Promotions & gift cards',
    body: (
      <>
        <p>
          If you return part of an order that qualified for a promotion, the refund reflects the price you actually paid for each item. Complimentary gifts that
          came with a purchase should be returned with it.
        </p>
        <p>Gift cards are non-refundable. Purchases paid for with a gift card are refunded as a new gift card.</p>
      </>
    ),
  },
  {
    id: 'questions',
    title: 'Questions about a refund',
    body: (
      <p>
        If your refund has not arrived within 10 business days of our confirmation email, please contact us at <Mail /> with your order number and we will
        trace it for you.
      </p>
    ),
  },
];

// ───────────────────────────── warranty ─────────────────────────────

export const warrantyIntro = `We stand behind the craftsmanship of every piece we make — not for a year or two, but for as long as you own it.`;

export const warrantySections: DocSection[] = [
  {
    id: 'lifetime',
    title: 'Our lifetime manufacturing warranty',
    body: (
      <p>
        Every piece from {site.name} is covered against defects in materials and workmanship for its lifetime. If something goes wrong because of the way it was
        made, we will repair it — or, if a repair is not possible, replace it with an identical or equivalent piece — at no cost to you, including insured
        shipping both ways.
      </p>
    ),
  },
  {
    id: 'covered',
    title: 'What is covered',
    body: (
      <ul>
        <li>Flaws in the metal, such as porosity, cracks or weak solder joints.</li>
        <li>Prongs, bezels or channels that loosen or fail under normal wear.</li>
        <li>Diamonds that fall from their setting because of a manufacturing fault — we replace them with a stone of equal or better quality.</li>
        <li>Clasps, safety catches and hinges that stop working as intended.</li>
      </ul>
    ),
  },
  {
    id: 'not-covered',
    title: 'What is not covered',
    body: (
      <>
        <ul>
          <li>Natural wear over time — fine scratches, softened edges or gradual thinning of a band.</li>
          <li>Accidental damage, such as a bent prong or misshapen ring caused by a knock or crush.</li>
          <li>Loss or theft of a piece or a diamond that was not caused by a manufacturing fault.</li>
          <li>Damage from chemicals, extreme heat, or repairs and alterations made by another jeweler.</li>
        </ul>
        <Note>We recommend insuring your jewelry against loss, theft and accidental damage. On request, we provide an itemised valuation document for your insurer.</Note>
      </>
    ),
  },
  {
    id: 'complimentary-care',
    title: 'Complimentary lifetime care',
    body: (
      <>
        <p>Alongside the warranty, every piece includes:</p>
        <ul>
          <li>professional cleaning and polishing whenever you need it;</li>
          <li>a full inspection, with prongs and settings checked and tightened;</li>
          <li>rhodium re-plating of white gold within the first year (thereafter at cost);</li>
          <li>one complimentary resize within 60 days of delivery, for eligible ring styles.</li>
        </ul>
        <p>We recommend an inspection every 12 months — especially for engagement rings and pieces worn every day.</p>
      </>
    ),
  },
  {
    id: 'claims',
    title: 'How to make a claim',
    body: (
      <Steps>
        <li>
          Email <Mail /> with your order number, a short description and, if possible, a photo of the issue.
        </li>
        <li>We send you a prepaid, insured shipping label so your piece can come back to our workshop.</li>
        <li>Our master jewelers assess it within 3 business days and confirm the work required.</li>
        <li>Most repairs are completed within 2–3 weeks, and your piece returns to you fully insured.</li>
      </Steps>
    ),
  },
  {
    id: 'transfer',
    title: 'Who the warranty covers',
    body: (
      <p>
        The warranty applies to the original purchaser and to the recipient of a piece bought as a gift. Proof of purchase — your order number is enough — is
        required for every claim.
      </p>
    ),
  },
];

// ───────────────────────────── care guide ─────────────────────────────

export const careIntro = `Diamonds are the hardest natural material on earth, but fine jewelry still loves a little attention. A few simple habits will keep every piece as brilliant as the day it arrived.`;

export const careSections: DocSection[] = [
  {
    id: 'everyday',
    title: 'Everyday wear',
    body: (
      <>
        <p>Put your jewelry on last and take it off first. Lotions, perfume and hairspray leave a film that dulls a diamond&apos;s sparkle surprisingly quickly.</p>
        <p>Remove your pieces before:</p>
        <ul>
          <li>swimming — chlorine and salt water can weaken gold alloys over time;</li>
          <li>the gym, gardening, cleaning or anything that involves heavy lifting or knocks;</li>
          <li>applying sunscreen, self-tan or cleaning products.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cleaning',
    title: 'Cleaning at home',
    body: (
      <>
        <Steps>
          <li>Fill a small bowl with warm water and add a few drops of mild, fragrance-free washing-up liquid.</li>
          <li>Soak your jewelry for 20–30 minutes to loosen everyday build-up.</li>
          <li>Brush gently with a soft, clean toothbrush, paying attention to the underside of the diamond where oils collect.</li>
          <li>Rinse in clean warm water — over a bowl, never an open drain — and pat dry with a lint-free cloth.</li>
        </Steps>
        <p>Once a week is ideal for rings worn every day; once a month is plenty for earrings and necklaces.</p>
      </>
    ),
  },
  {
    id: 'avoid',
    title: 'What to avoid',
    body: (
      <ul>
        <li>Bleach, chlorine, acetone and abrasive cleaners, which can discolour or pit gold.</li>
        <li>Toothpaste and baking soda — both are abrasive and will scratch polished metal.</li>
        <li>Ultrasonic cleaners for pavé, micro-pavé and eternity pieces; vibrations can loosen very small stones.</li>
      </ul>
    ),
  },
  {
    id: 'storing',
    title: 'Storing your jewelry',
    body: (
      <>
        <p>
          Diamonds can scratch other diamonds — and gold — so store each piece separately in its presentation box, a soft pouch or a lined compartment. Fasten
          necklaces and bracelets before putting them away to prevent tangles.
        </p>
        <p>When travelling, a padded jewelry roll keeps pieces apart and protected.</p>
      </>
    ),
  },
  {
    id: 'metals',
    title: 'Caring for each gold colour',
    body: (
      <ul>
        <li>
          <strong className="font-normal text-ink">Yellow gold</strong> develops a soft patina with wear. A professional polish restores its original lustre.
        </li>
        <li>
          <strong className="font-normal text-ink">White gold</strong> is finished with rhodium for its bright white colour. As the plating gently wears, a warmer
          tone can appear; re-plating every 12–18 months keeps it crisp.
        </li>
        <li>
          <strong className="font-normal text-ink">Rose gold</strong> owes its blush to copper and is wonderfully durable. Its colour may deepen slightly over the
          years — many people love this.
        </li>
      </ul>
    ),
  },
  {
    id: 'settings',
    title: 'Checking settings & clasps',
    body: (
      <p>
        Every so often, hold your ring up to your ear and tap it gently: a rattle or a stone that moves means it is time for a check-up. Look for prongs that catch
        on fabric and test the clasps of bracelets and necklaces. If anything feels loose, stop wearing the piece and contact us — repairs of manufacturing faults
        are covered by our <TextLink href="/pages/warranty">lifetime warranty</TextLink>.
      </p>
    ),
  },
  {
    id: 'professional',
    title: 'Professional care',
    body: (
      <p>
        We offer complimentary professional cleaning, polishing and inspection for the lifetime of your jewelry. We recommend sending engagement rings and pieces
        worn daily to our workshop once a year. Write to <Mail /> to arrange an insured pick-up.
      </p>
    ),
  },
];
