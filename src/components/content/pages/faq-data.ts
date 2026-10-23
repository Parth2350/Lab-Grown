import { site } from '@/config/site';
import type { Faq } from '../FaqSection';

export const FAQ_GROUPS: { id: string; title: string; items: Faq[] }[] = [
  {
    id: 'diamonds',
    title: 'Diamonds',
    items: [
      {
        q: 'Do you offer natural diamonds as well as lab-grown?',
        a: 'Yes. We work with both certified natural and lab-grown diamonds. Prices shown on the site are for lab-grown diamonds; tell us the design you love on WhatsApp, or start a bespoke enquiry, and we will source a certified natural diamond and quote it for you.',
      },
      {
        q: 'Are lab-grown diamonds real diamonds?',
        a: 'Yes. A lab-grown diamond is pure crystallised carbon, exactly like a mined diamond, with the same hardness, brilliance and fire. The only difference is its origin: it is grown under carefully controlled conditions rather than extracted from the earth. It is not a simulant such as cubic zirconia or moissanite.',
      },
      {
        q: 'Will my diamond come with a grading report?',
        a: 'Every centre diamond is independently graded by IGI or GIA, and the report travels with your jewelry. Smaller accent and pavé diamonds are hand-matched by our gemologists to the same colour and clarity standards.',
      },
      {
        q: 'How can I tell that my diamond is the one on the report?',
        a: 'Most graded diamonds carry a microscopic laser inscription of the report number on the girdle, visible under a jeweler’s loupe. You can also enter the report number on the grading laboratory’s website to confirm the details.',
      },
      {
        q: 'Will a lab-grown diamond lose its sparkle or change colour?',
        a: 'No. Lab-grown diamonds are chemically and structurally stable. With simple cleaning they will look as brilliant in fifty years as they do today.',
      },
    ],
  },
  {
    id: 'orders',
    title: 'Orders & payment',
    items: [
      {
        q: 'Which payment methods do you accept?',
        a: 'Payments are processed securely by our payment partner, which supports major credit and debit cards, UPI, net banking and popular wallets. Available methods vary by country, and our team confirms them with you on WhatsApp when you place your order.',
      },
      {
        q: 'Can I change or cancel my order?',
        a: 'You can cancel or change any order free of charge within 24 hours, or at any time before production begins. Contact our client care team with your order number and we will take care of it.',
      },
      {
        q: 'In which currency are prices shown?',
        a: 'Prices are shown in Indian rupees (₹) by default, in US dollars ($) for visitors in the United States and in Canadian dollars (CAD$) in Canada. You can switch at any time from the location menu at the bottom of every page. GST of 3% is added to your order total. If you pay with a card in another currency, your bank converts the amount at its own exchange rate.',
      },
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping & delivery',
    items: [
      {
        q: 'Is shipping really free?',
        a: 'Yes. Every order ships with complimentary, fully insured standard delivery and requires a signature on arrival. Express and overnight upgrades are available, just ask when you order on WhatsApp.',
      },
      {
        q: 'How long will my jewelry take to arrive?',
        a: 'Ready-to-ship pieces leave our workshop within 1–3 business days; made-to-order pieces within 2–3 weeks. Standard delivery then takes 7–10 business days, express 3–5.',
      },
      {
        q: 'Do you ship internationally?',
        a: `Yes — we deliver to clients in more than ${site.stats.countries.replace('+', '')} countries. Where import duties and taxes can be calculated in advance, our team shares them with you before you confirm your order.`,
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & warranty',
    items: [
      {
        q: 'What is your return policy?',
        a: 'You can return or exchange eligible pieces within 30 days of delivery for a full refund. Return shipping is complimentary and insured. Engraved pieces and bespoke commissions are made just for you and cannot be returned.',
      },
      {
        q: 'What does the lifetime warranty cover?',
        a: 'Our lifetime manufacturing warranty covers defects in materials and workmanship, including loose settings and diamonds lost because of a manufacturing fault. It also includes complimentary cleaning, polishing and inspection for as long as you own your piece.',
      },
    ],
  },
  {
    id: 'sizing',
    title: 'Ring sizing',
    items: [
      {
        q: 'How do I find my ring size?',
        a: 'The most reliable way is to be measured by a local jeweler. Alternatively, contact us and we will post you a complimentary reusable ring sizer. If you are buying a surprise, choose your best estimate — most rings include one complimentary resize within 60 days.',
      },
      {
        q: 'Can my ring be resized later?',
        a: 'Most solitaire, halo and plain band designs can be resized up or down by about two sizes. Full eternity bands cannot be resized without disturbing the diamonds, so we offer a size exchange instead.',
      },
    ],
  },
  {
    id: 'bespoke',
    title: 'Bespoke design',
    items: [
      {
        q: 'How long does a bespoke piece take?',
        a: 'Most commissions take 4–6 weeks from first conversation to delivery: about a week for sketches and CAD renders, then 3–5 weeks in our workshop once you approve the design.',
      },
      {
        q: 'Can you make a design I have seen elsewhere?',
        a: 'We are happy to create an original piece inspired by the things you love, but we do not copy another jeweler’s protected designs. Share your inspiration and we will design something that is entirely yours.',
      },
    ],
  },
];

export const ALL_FAQS: Faq[] = FAQ_GROUPS.flatMap((g) => g.items);
