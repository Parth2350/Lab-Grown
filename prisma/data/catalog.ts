/* Demo catalog for Aurevia — all names and copy are original. Prices in whole dollars. */

export type SeedArt = {
  kind: string;
  head?: string;
  band?: string;
  prongs?: number;
  sides?: string;
  second?: string;
  stones?: string;
  stoneShape?: string;
  graduated?: boolean;
  size?: string;
};

export type SeedOption = { tw: number; delta: number; color?: string; clarity?: string };

export type SeedProduct = {
  name: string;
  cat: string;
  shapes: string[];
  styles: string[];
  setting?: string;
  center?: number;
  total?: number;
  base: number;
  metals?: string[];
  purities?: string[];
  art: SeedArt;
  coll?: string[];
  flags?: ('trending' | 'featured' | 'new')[];
  options?: SeedOption[];
  note: string;
};

export const CATEGORIES = [
  {
    slug: 'engagement-rings',
    name: 'Engagement Rings',
    description:
      'Certified lab-grown diamond engagement rings, hand-finished in our own workshop. Choose your setting, then select the exact diamond that speaks to you.',
  },
  {
    slug: 'wedding-bands',
    name: 'Wedding Bands',
    description: 'Eternity, half-eternity and classic bands designed to sit beautifully beside your engagement ring — and to be worn every day for a lifetime.',
  },
  {
    slug: 'rings',
    name: 'Rings',
    description: 'Stackable bands, cocktail rings and modern signets. Fine jewelry for every finger and every occasion.',
  },
  {
    slug: 'earrings',
    name: 'Earrings',
    description: 'Solitaire studs, sculptural hoops and graceful drops, set with matched pairs of certified lab-grown diamonds.',
  },
  {
    slug: 'pendants',
    name: 'Pendants',
    description: 'Solitaire, halo and bezel pendants that catch the light at the collarbone — from everyday petite to show-stopping.',
  },
  {
    slug: 'necklaces',
    name: 'Necklaces',
    description: 'Tennis necklaces, rivières and layering chains crafted with hand-matched lab-grown diamonds.',
  },
  {
    slug: 'bracelets',
    name: 'Bracelets',
    description: 'Tennis bracelets, bangles and delicate station chains — the finishing touch to every look.',
  },
];

export const COLLECTIONS = [
  { slug: 'solitaire', name: 'Solitaire', description: 'One extraordinary diamond, nothing to distract from it.', featured: true },
  { slug: 'engagement', name: 'Engagement', description: 'Our most-loved proposal designs.', featured: true },
  { slug: 'geometric', name: 'Geometric', description: 'Architectural lines, bezels and east-west settings for the modern collector.', featured: true },
  { slug: 'art-deco', name: 'Art Deco', description: 'Step cuts, baguettes and the glamour of the 1920s, reimagined.', featured: true },
  { slug: 'emerald-cut', name: 'Emerald Cut Collection', description: 'The hall-of-mirrors sparkle of the emerald cut across rings, earrings, necklaces and bracelets.', featured: true },
  { slug: 'halo', name: 'Halo', description: 'A circle of light around a centre diamond.' },
  { slug: 'three-stone', name: 'Three Stone', description: 'Past, present and future in three brilliant diamonds.' },
  { slug: 'toi-et-moi', name: 'Toi et Moi', description: 'Two stones, two stories, one ring.' },
  { slug: 'eternity', name: 'Eternity', description: 'Unbroken circles of diamonds.' },
  { slug: 'stackable', name: 'Stackable', description: 'Delicate bands designed to be layered.' },
  { slug: 'tennis', name: 'Tennis', description: 'Lines of perfectly matched diamonds for wrist and neck.' },
  { slug: 'bridal', name: 'Bridal', description: 'For the aisle and every anniversary after.' },
  { slug: 'anniversary-gifts', name: 'Anniversary Gifts', description: 'Celebrate another year together with something that lasts forever.' },
  { slug: 'birthday-gifts', name: 'Birthday Gifts', description: 'Thoughtful, sparkling gifts for the people you love.' },
  { slug: 'wedding-gifts', name: 'Wedding Gifts', description: 'For the couple, the bride, and the bridal party.' },
  { slug: 'bridal-gifts', name: 'Bridal Gifts', description: 'Something new — and something to treasure.' },
  { slug: 'personalized-jewelry', name: 'Personalized Jewelry', description: 'Engravable pieces made to carry initials, dates and secret messages.' },
];

const ALL3 = ['yellow', 'white', 'rose'];

export const PRODUCTS: SeedProduct[] = [
  // ───────────── Engagement rings (centre stone chosen from diamond inventory) ─────────────
  { name: 'Celeste Oval Hidden Halo Engagement Ring', cat: 'engagement-rings', shapes: ['oval'], styles: ['hidden-halo', 'modern'], setting: 'four-prong', center: 2, total: 2.25, base: 990, metals: [...ALL3, 'yellow-white'], art: { kind: 'ring', head: 'hidden-halo', band: 'pave' }, coll: ['engagement', 'halo', 'bridal'], flags: ['trending', 'featured'], note: 'A whisper of pavé hides beneath the oval centre stone, revealed only when the light catches it from the side.' },
  { name: 'Aria Round Solitaire Engagement Ring', cat: 'engagement-rings', shapes: ['round'], styles: ['solitaire'], setting: 'six-prong', center: 1.5, total: 1.5, base: 690, art: { kind: 'ring', head: 'solitaire', band: 'plain', prongs: 6 }, coll: ['solitaire', 'engagement'], flags: ['trending'], note: 'Six slender claws lift a round brilliant high above a tapered band — the purest expression of a proposal ring.' },
  { name: 'Seraphine Emerald Cut Hidden Halo Ring', cat: 'engagement-rings', shapes: ['emerald'], styles: ['hidden-halo', 'modern'], setting: 'four-prong', center: 2.5, total: 2.8, base: 1090, metals: [...ALL3, 'rose-white'], art: { kind: 'ring', head: 'hidden-halo', band: 'pave' }, coll: ['emerald-cut', 'engagement', 'art-deco'], flags: ['featured'], note: 'Long step facets meet a secret halo and a pavé band for quiet, architectural glamour.' },
  { name: 'Elodie Cushion Halo Engagement Ring', cat: 'engagement-rings', shapes: ['cushion'], styles: ['halo', 'vintage'], setting: 'four-prong', center: 1.5, total: 1.9, base: 1150, art: { kind: 'ring', head: 'halo', band: 'pave' }, coll: ['engagement', 'halo'], note: 'A pillowed cushion cut framed by a hand-set halo, with romance borrowed from heirloom rings.' },
  { name: 'Margaux Pear Halo Engagement Ring', cat: 'engagement-rings', shapes: ['pear'], styles: ['halo'], setting: 'five-prong', center: 1.5, total: 1.85, base: 1090, art: { kind: 'ring', head: 'halo', band: 'plain' }, coll: ['engagement', 'halo'], flags: ['trending'], note: 'A graceful teardrop wrapped in a delicate halo, set on a slim polished band that lets it shine.' },
  { name: 'Isla Radiant Three Stone Engagement Ring', cat: 'engagement-rings', shapes: ['radiant'], styles: ['three-stone', 'baguette'], setting: 'three-stone', center: 2, total: 2.6, base: 1290, art: { kind: 'ring', head: 'three-stone', sides: 'baguette', band: 'plain' }, coll: ['three-stone', 'engagement', 'art-deco'], note: 'A radiant centre flanked by tapered baguettes — past, present and future in crisp geometry.' },
  { name: 'Juliette Pear & Oval Toi et Moi Ring', cat: 'engagement-rings', shapes: ['pear', 'oval'], styles: ['toi-et-moi', 'modern'], setting: 'four-prong', center: 1, total: 2, base: 1390, art: { kind: 'ring', head: 'toi-et-moi', second: 'oval', band: 'plain' }, coll: ['toi-et-moi', 'engagement'], flags: ['trending', 'new'], note: 'Two diamonds, two shapes, one story: a pear and an oval nestle side by side on an open band.' },
  { name: 'Saskia Emerald & Pear Toi et Moi Ring', cat: 'engagement-rings', shapes: ['emerald', 'pear'], styles: ['toi-et-moi', 'modern'], setting: 'four-prong', center: 1.5, total: 2.6, base: 1450, metals: ['yellow', 'white'], art: { kind: 'ring', head: 'toi-et-moi', second: 'pear', band: 'knife' }, coll: ['toi-et-moi', 'emerald-cut'], flags: ['new'], note: 'An emerald cut meets a pear on a knife-edge band — a contemporary twist on the Napoleonic classic.' },
  { name: 'Vivienne Princess Solitaire Engagement Ring', cat: 'engagement-rings', shapes: ['princess'], styles: ['solitaire', 'modern'], setting: 'four-prong', center: 1.5, total: 1.5, base: 720, art: { kind: 'ring', head: 'solitaire', band: 'cathedral' }, coll: ['solitaire', 'engagement', 'geometric'], note: 'Crisp V-claws protect each corner of the princess cut, lifted on soaring cathedral shoulders.' },
  { name: 'Odette Marquise Vintage Halo Ring', cat: 'engagement-rings', shapes: ['marquise'], styles: ['vintage', 'halo'], setting: 'six-prong', center: 1.5, total: 1.8, base: 1190, art: { kind: 'ring', head: 'halo', band: 'cathedral', prongs: 6 }, coll: ['engagement', 'halo', 'art-deco'], note: 'A regal marquise inside a milgrain-inspired halo, with cathedral arches drawn from Edwardian design.' },
  { name: 'Liora Asscher Art Deco Double Halo Ring', cat: 'engagement-rings', shapes: ['asscher'], styles: ['halo', 'vintage'], setting: 'four-prong', center: 2, total: 2.45, base: 1250, purities: ['14K', '18K'], art: { kind: 'ring', head: 'double-halo', band: 'pave' }, coll: ['art-deco', 'geometric', 'engagement'], flags: ['featured'], note: 'A mesmerising asscher windmill held within two rows of pavé — pure Jazz Age drama.' },
  { name: 'Amara Heart Halo Engagement Ring', cat: 'engagement-rings', shapes: ['heart'], styles: ['halo'], setting: 'three-prong', center: 1, total: 1.3, base: 990, metals: ['rose', 'yellow', 'white'], art: { kind: 'ring', head: 'halo', band: 'pave', prongs: 3 }, coll: ['halo', 'anniversary-gifts'], note: 'The ultimate symbol of love, precision-cut and haloed in light.' },
  { name: 'Noor Oval Solitaire Engagement Ring', cat: 'engagement-rings', shapes: ['oval'], styles: ['solitaire'], setting: 'four-prong', center: 2, total: 2, base: 740, art: { kind: 'ring', head: 'solitaire', band: 'plain' }, coll: ['solitaire', 'engagement'], flags: ['trending'], note: 'An elongated oval on four fine claws and a whisper-thin band — understated, effortless, forever.' },
  { name: 'Sienna Round Pavé Cathedral Ring', cat: 'engagement-rings', shapes: ['round'], styles: ['solitaire', 'vintage'], setting: 'six-prong', center: 1, total: 1.2, base: 890, art: { kind: 'ring', head: 'solitaire', band: 'pave', prongs: 6 }, coll: ['solitaire', 'engagement'], note: 'Hand-set pavé climbs gently towards a six-claw head, adding brilliance from every angle.' },
  { name: 'Aurelie Emerald Three Stone Baguette Ring', cat: 'engagement-rings', shapes: ['emerald'], styles: ['three-stone', 'baguette'], setting: 'three-stone', center: 2, total: 2.5, base: 1390, art: { kind: 'ring', head: 'three-stone', sides: 'baguette', band: 'plain' }, coll: ['emerald-cut', 'three-stone', 'art-deco'], note: 'Step-cut harmony: an emerald centre and two baguettes that echo its clean lines.' },
  { name: 'Colette Oval Bezel Solitaire Ring', cat: 'engagement-rings', shapes: ['oval'], styles: ['bezel', 'solitaire', 'modern'], setting: 'bezel', center: 1.5, total: 1.5, base: 820, art: { kind: 'ring', head: 'bezel', band: 'plain' }, coll: ['solitaire', 'geometric'], flags: ['new'], note: 'A sleek gold collar encircles the oval — modern, protective and wonderfully tactile.' },
  { name: 'Esme Elongated Cushion Pavé Ring', cat: 'engagement-rings', shapes: ['cushion'], styles: ['solitaire'], setting: 'four-prong', center: 2, total: 2.3, base: 950, art: { kind: 'ring', head: 'solitaire', band: 'pave' }, coll: ['solitaire', 'engagement'], note: 'An elongated cushion with soft corners, set above a fine pavé band for maximum sparkle.' },
  { name: 'Ines Round Halo Engagement Ring', cat: 'engagement-rings', shapes: ['round'], styles: ['halo'], setting: 'four-prong', center: 1, total: 1.35, base: 1050, art: { kind: 'ring', head: 'halo', band: 'pave' }, coll: ['halo', 'engagement', 'bridal'], flags: ['trending'], note: 'A classic halo that makes a one-carat round look bigger and brighter, with pavé all the way down.' },
  { name: 'Maren Radiant Solitaire Engagement Ring', cat: 'engagement-rings', shapes: ['radiant'], styles: ['solitaire', 'modern'], setting: 'four-prong', center: 3, total: 3, base: 880, purities: ['14K', '18K'], art: { kind: 'ring', head: 'solitaire', band: 'knife' }, coll: ['solitaire', 'engagement'], flags: ['new'], note: 'A three-carat radiant on a knife-edge band — bold brilliance with a razor-sharp silhouette.' },
  { name: 'Thea East-West Oval Engagement Ring', cat: 'engagement-rings', shapes: ['oval'], styles: ['modern', 'solitaire'], setting: 'four-prong', center: 1.5, total: 1.5, base: 780, art: { kind: 'ring', head: 'east-west', band: 'plain', size: 'thin' }, coll: ['geometric', 'solitaire'], flags: ['new'], note: 'Turned on its side, the oval reads fresh and fashion-forward on a delicate band.' },
  { name: 'Rosalind Pear Hidden Halo Engagement Ring', cat: 'engagement-rings', shapes: ['pear'], styles: ['hidden-halo', 'solitaire'], setting: 'five-prong', center: 2, total: 2.2, base: 860, art: { kind: 'ring', head: 'hidden-halo', band: 'pave' }, coll: ['engagement', 'halo'], note: 'A pear set point-up with a concealed halo that sparkles from the profile.' },
  { name: 'Valentina Emerald Solitaire Engagement Ring', cat: 'engagement-rings', shapes: ['emerald'], styles: ['solitaire', 'modern'], setting: 'four-prong', center: 3, total: 3, base: 860, purities: ['14K', '18K'], art: { kind: 'ring', head: 'solitaire', band: 'plain' }, coll: ['emerald-cut', 'solitaire', 'engagement'], flags: ['trending'], note: 'Three carats of hall-of-mirrors light on a refined plain band — confidence, distilled.' },
  { name: 'Wren Round Three Stone Pear Ring', cat: 'engagement-rings', shapes: ['round'], styles: ['three-stone'], setting: 'three-stone', center: 1.5, total: 2.1, base: 1190, art: { kind: 'ring', head: 'three-stone', sides: 'pear', band: 'plain' }, coll: ['three-stone', 'engagement'], note: 'Two pear-shaped side stones point gently towards a brilliant round centre.' },

  // ───────────── Wedding bands ─────────────
  { name: 'Adele Round Full Eternity Band', cat: 'wedding-bands', shapes: ['round'], styles: ['eternity', 'anniversary'], setting: 'four-prong', base: 380, art: { kind: 'band', stones: 'full', stoneShape: 'round' }, coll: ['eternity', 'bridal', 'anniversary-gifts', 'wedding-gifts'], flags: ['trending'], options: [{ tw: 1, delta: 420 }, { tw: 2, delta: 890 }, { tw: 3, delta: 1450 }], note: 'An unbroken circle of round brilliants on shared claws — the forever band.' },
  { name: 'Beatrix Emerald Cut Eternity Band', cat: 'wedding-bands', shapes: ['emerald'], styles: ['eternity', 'anniversary'], setting: 'four-prong', base: 420, art: { kind: 'band', stones: 'full', stoneShape: 'emerald' }, coll: ['eternity', 'emerald-cut', 'art-deco'], flags: ['featured'], options: [{ tw: 2, delta: 990 }, { tw: 3.5, delta: 1690 }, { tw: 5, delta: 2390 }], note: 'East-west emerald cuts set end to end for a mirror-like ribbon of light.' },
  { name: 'Camille Oval Eternity Band', cat: 'wedding-bands', shapes: ['oval'], styles: ['eternity'], setting: 'four-prong', base: 410, art: { kind: 'band', stones: 'full', stoneShape: 'oval' }, coll: ['eternity', 'bridal'], flags: ['trending'], options: [{ tw: 2, delta: 960 }, { tw: 3, delta: 1490 }], note: 'Ovals laid sideways create a softly undulating line of brilliance.' },
  { name: 'Delphine Baguette Channel Eternity Band', cat: 'wedding-bands', shapes: ['emerald'], styles: ['eternity', 'baguette'], setting: 'channel', base: 450, art: { kind: 'band', stones: 'full', stoneShape: 'baguette' }, coll: ['eternity', 'art-deco'], options: [{ tw: 1, delta: 520 }, { tw: 2, delta: 990 }], note: 'Baguettes held in a sleek channel for a smooth, snag-free Art Deco band.' },
  { name: 'Eloise Classic Comfort-Fit Band', cat: 'wedding-bands', shapes: [], styles: ['bold-gold'], base: 290, art: { kind: 'band', stones: 'none', size: 'wide' }, coll: ['bridal', 'personalized-jewelry', 'wedding-gifts'], note: 'Our heirloom-weight comfort-fit band, engravable on the inside with names, dates or coordinates.' },
  { name: 'Florence Pavé Half Eternity Band', cat: 'wedding-bands', shapes: ['round'], styles: ['eternity', 'stackable', 'anniversary'], setting: 'pave', base: 320, art: { kind: 'band', stones: 'half', stoneShape: 'round' }, coll: ['stackable', 'eternity', 'anniversary-gifts'], flags: ['trending'], options: [{ tw: 0.5, delta: 190 }, { tw: 1, delta: 390 }], note: 'Pavé across the top half for comfort and sparkle where it counts.' },
  { name: 'Genevieve Curved Contour Band', cat: 'wedding-bands', shapes: ['round'], styles: ['stackable', 'modern'], setting: 'pave', base: 280, art: { kind: 'band', stones: 'half', stoneShape: 'round', size: 'thin' }, coll: ['stackable', 'bridal'], flags: ['new'], options: [{ tw: 0.35, delta: 170 }], note: 'A gently curved contour that nests perfectly beneath halo and three-stone rings.' },
  { name: 'Helena Marquise Eternity Band', cat: 'wedding-bands', shapes: ['marquise'], styles: ['eternity', 'vintage'], setting: 'four-prong', base: 460, art: { kind: 'band', stones: 'full', stoneShape: 'marquise' }, coll: ['eternity'], options: [{ tw: 1.5, delta: 780 }, { tw: 2.5, delta: 1280 }], note: 'Marquise diamonds set end to end like a wreath of light.' },

  // ───────────── Rings ─────────────
  { name: 'Ivy Dainty Pavé Stacking Ring', cat: 'rings', shapes: ['round'], styles: ['stackable'], setting: 'pave', base: 149, art: { kind: 'band', stones: 'half', stoneShape: 'round', size: 'thin' }, coll: ['stackable', 'birthday-gifts'], flags: ['trending'], options: [{ tw: 0.15, delta: 30 }], note: 'A whisper-fine band of micro-pavé, made to be stacked three or four at a time.' },
  { name: 'Josephine Emerald Cut Cocktail Ring', cat: 'rings', shapes: ['emerald'], styles: ['cocktail', 'halo'], setting: 'four-prong', center: 3, total: 3.6, base: 1490, purities: ['14K', '18K'], art: { kind: 'ring', head: 'double-halo', band: 'bold' }, coll: ['emerald-cut', 'art-deco'], flags: ['featured'], note: 'A statement emerald cut ringed twice in pavé on a substantial band — made for evenings.' },
  { name: 'Lucienne Bold Gold Dome Ring', cat: 'rings', shapes: ['round'], styles: ['bold-gold', 'bezel', 'modern'], setting: 'bezel', base: 520, art: { kind: 'signet' }, coll: ['geometric'], flags: ['new'], options: [{ tw: 0.25, delta: 120 }], note: 'A sculptural dome of polished gold with a single flush-set diamond.' },
  { name: 'Mireille Oval Bezel Ring', cat: 'rings', shapes: ['oval'], styles: ['bezel', 'modern'], setting: 'bezel', center: 1, total: 1, base: 620, art: { kind: 'ring', head: 'bezel', band: 'plain', size: 'thin' }, coll: ['geometric', 'birthday-gifts'], note: 'A low-profile bezel oval for everyday wear — sleek, secure and quietly luminous.' },
  { name: 'Nadia Diamond Cluster Ring', cat: 'rings', shapes: ['round'], styles: ['cocktail', 'vintage'], setting: 'four-prong', base: 410, art: { kind: 'ring', head: 'cluster', band: 'plain' }, coll: ['anniversary-gifts', 'birthday-gifts'], options: [{ tw: 0.75, delta: 390 }, { tw: 1.25, delta: 620 }], note: 'A floral cluster of round brilliants that reads like one larger diamond.' },
  { name: 'Ophelia Monogram Signet Ring', cat: 'rings', shapes: ['round'], styles: ['bold-gold'], setting: 'bezel', base: 390, art: { kind: 'signet' }, coll: ['personalized-jewelry', 'birthday-gifts'], options: [{ tw: 0.05, delta: 40 }], note: 'An oval signet face ready for your initials, finished with a tiny flush diamond.' },
  { name: 'Penelope Five Stone Anniversary Ring', cat: 'rings', shapes: ['round'], styles: ['anniversary'], setting: 'four-prong', base: 450, art: { kind: 'ring', head: 'five-stone', band: 'plain' }, coll: ['anniversary-gifts'], flags: ['trending'], options: [{ tw: 0.5, delta: 290 }, { tw: 1, delta: 560 }, { tw: 2, delta: 1190 }], note: 'Five graduated diamonds — one for every chapter you have written together.' },
  { name: 'Rhea Asscher Bezel Ring', cat: 'rings', shapes: ['asscher'], styles: ['bezel', 'modern'], setting: 'bezel', center: 1, total: 1, base: 640, art: { kind: 'ring', head: 'bezel', band: 'plain', size: 'thin' }, coll: ['geometric', 'art-deco'], note: 'A square asscher in a crisp gold frame — graphic, modern and endlessly wearable.' },
  { name: 'Sabine Baguette Stacking Band', cat: 'rings', shapes: ['emerald'], styles: ['stackable', 'baguette'], setting: 'channel', base: 230, art: { kind: 'band', stones: 'half', stoneShape: 'baguette', size: 'thin' }, coll: ['stackable', 'art-deco'], options: [{ tw: 0.4, delta: 210 }], note: 'Channel-set baguettes add clean, architectural sparkle to any stack.' },

  // ───────────── Earrings ─────────────
  { name: 'Talia Round Solitaire Stud Earrings', cat: 'earrings', shapes: ['round'], styles: ['stud', 'solitaire'], setting: 'four-prong', base: 120, art: { kind: 'studs' }, coll: ['solitaire', 'birthday-gifts', 'bridal-gifts'], flags: ['trending', 'featured'], options: [{ tw: 0.25, delta: 95 }, { tw: 0.5, delta: 210 }, { tw: 1, delta: 480 }, { tw: 2, delta: 1090 }, { tw: 3, delta: 1790 }], note: 'Perfectly matched round brilliants in secure four-claw baskets with screw backs.' },
  { name: 'Ursula Oval Solitaire Stud Earrings', cat: 'earrings', shapes: ['oval'], styles: ['stud', 'solitaire'], setting: 'four-prong', base: 140, art: { kind: 'studs' }, coll: ['solitaire', 'bridal-gifts'], options: [{ tw: 0.5, delta: 230 }, { tw: 1, delta: 520 }, { tw: 2, delta: 1150 }], note: 'Elongated ovals that flatter every face shape — modern classics.' },
  { name: 'Violette Princess Stud Earrings', cat: 'earrings', shapes: ['princess'], styles: ['stud', 'solitaire'], setting: 'four-prong', base: 130, art: { kind: 'studs' }, coll: ['solitaire', 'geometric'], options: [{ tw: 0.5, delta: 220 }, { tw: 1, delta: 500 }], note: 'Crisp squares with corner claws for a sharp, contemporary sparkle.' },
  { name: 'Willa Round Halo Stud Earrings', cat: 'earrings', shapes: ['round'], styles: ['stud', 'halo'], setting: 'four-prong', base: 220, art: { kind: 'studs', head: 'halo' }, coll: ['halo', 'anniversary-gifts'], options: [{ tw: 0.5, delta: 260 }, { tw: 1, delta: 560 }], note: 'A halo of pavé makes each stud read nearly twice its size.' },
  { name: 'Xanthe Pavé Hoop Earrings', cat: 'earrings', shapes: ['round'], styles: ['hoop'], setting: 'pave', base: 360, art: { kind: 'hoops', size: 'medium' }, coll: ['birthday-gifts'], flags: ['trending'], options: [{ tw: 0.5, delta: 240 }, { tw: 1, delta: 480 }], note: 'Medium hoops lined with hand-set pavé, finished with hinged snap closures.' },
  { name: 'Ysolde Mini Pavé Huggie Earrings', cat: 'earrings', shapes: ['round'], styles: ['hoop', 'stackable'], setting: 'pave', base: 149, art: { kind: 'hoops', size: 'huggie' }, coll: ['birthday-gifts'], flags: ['new'], options: [{ tw: 0.2, delta: 80 }], note: 'Close-fitting huggies made to sleep in, shower in and never take off.' },
  { name: 'Zara Large Inside-Out Hoop Earrings', cat: 'earrings', shapes: ['round'], styles: ['hoop', 'bold-gold'], setting: 'pave', base: 690, purities: ['14K', '18K'], art: { kind: 'hoops', size: 'large' }, coll: ['anniversary-gifts'], options: [{ tw: 1.5, delta: 690 }, { tw: 2.5, delta: 1090 }], note: 'Statement hoops with diamonds inside and out, so they sparkle from every angle.' },
  { name: 'Adeline Pear Halo Drop Earrings', cat: 'earrings', shapes: ['pear'], styles: ['drop', 'halo'], setting: 'five-prong', base: 290, art: { kind: 'drops', head: 'halo' }, coll: ['bridal-gifts', 'wedding-gifts'], flags: ['featured'], options: [{ tw: 1, delta: 520 }, { tw: 2, delta: 1120 }], note: 'Haloed pears swing gently from round brilliant studs — made for the aisle.' },
  { name: 'Bianca Oval Drop Earrings', cat: 'earrings', shapes: ['oval'], styles: ['drop'], setting: 'four-prong', base: 260, art: { kind: 'drops' }, coll: ['bridal-gifts'], options: [{ tw: 1, delta: 510 }, { tw: 2, delta: 1100 }], note: 'Clean oval drops with movement and light, beneath a petite round stud.' },
  { name: 'Cora Emerald Bezel Stud Earrings', cat: 'earrings', shapes: ['emerald'], styles: ['stud', 'bezel', 'modern'], setting: 'bezel', base: 170, art: { kind: 'studs', head: 'bezel' }, coll: ['emerald-cut', 'geometric'], options: [{ tw: 0.5, delta: 240 }, { tw: 1, delta: 540 }], note: 'Emerald cuts framed in polished gold — graphic, minimal, utterly chic.' },
  { name: 'Dahlia Petite Bezel Stud Earrings', cat: 'earrings', shapes: ['round'], styles: ['stud', 'bezel'], setting: 'bezel', base: 120, art: { kind: 'studs', head: 'bezel' }, coll: ['birthday-gifts'], options: [{ tw: 0.1, delta: 45 }, { tw: 0.2, delta: 80 }], note: 'Tiny bezel studs for second piercings, first jewelry and everyday ease.' },

  // ───────────── Pendants ─────────────
  { name: 'Elise Round Solitaire Pendant', cat: 'pendants', shapes: ['round'], styles: ['solitaire'], setting: 'four-prong', center: 1, total: 1, base: 260, art: { kind: 'pendant', head: 'solitaire' }, coll: ['solitaire', 'birthday-gifts', 'anniversary-gifts'], flags: ['trending'], note: 'A single round brilliant floating on a fine cable chain — the pendant everyone should own.' },
  { name: 'Fleur Oval Solitaire Pendant', cat: 'pendants', shapes: ['oval'], styles: ['solitaire'], setting: 'four-prong', center: 1, total: 1, base: 270, art: { kind: 'pendant', head: 'solitaire' }, coll: ['solitaire', 'bridal-gifts'], flags: ['new'], note: 'An oval suspended north-south for a long, elegant line at the collarbone.' },
  { name: 'Gaia Pear Halo Pendant', cat: 'pendants', shapes: ['pear'], styles: ['halo'], setting: 'five-prong', center: 1, total: 1.25, base: 390, art: { kind: 'pendant', head: 'halo' }, coll: ['halo', 'bridal-gifts'], note: 'A haloed teardrop that catches light with every movement.' },
  { name: 'Hazel Bezel Round Pendant', cat: 'pendants', shapes: ['round'], styles: ['bezel', 'solitaire', 'modern'], setting: 'bezel', center: 0.5, total: 0.5, base: 230, art: { kind: 'pendant', head: 'bezel' }, coll: ['geometric', 'solitaire'], note: 'A smooth bezel solitaire designed to be worn every single day.' },
  { name: 'Iris Heart Halo Pendant', cat: 'pendants', shapes: ['heart'], styles: ['halo'], setting: 'three-prong', center: 1, total: 1.2, base: 340, metals: ['rose', 'yellow', 'white'], art: { kind: 'pendant', head: 'halo' }, coll: ['anniversary-gifts', 'birthday-gifts'], note: 'A heart-shaped diamond framed in pavé — love, made literal.' },
  { name: 'Jolie Emerald Cut Pendant', cat: 'pendants', shapes: ['emerald'], styles: ['solitaire', 'modern'], setting: 'four-prong', center: 1, total: 1, base: 290, art: { kind: 'pendant', head: 'solitaire' }, coll: ['emerald-cut'], note: 'Long step facets suspended from a slim bail for understated glamour.' },
  { name: 'Kaia Three Stone Journey Pendant', cat: 'pendants', shapes: ['round'], styles: ['three-stone', 'anniversary'], setting: 'three-stone', base: 210, art: { kind: 'pendant', head: 'three-stone' }, coll: ['anniversary-gifts', 'three-stone'], options: [{ tw: 0.5, delta: 260 }, { tw: 0.75, delta: 380 }, { tw: 1, delta: 520 }], note: 'Three diamonds for past, present and future — a meaningful anniversary gift.' },
  { name: 'Lumi Engravable Disc Pendant', cat: 'pendants', shapes: ['round'], styles: ['bezel', 'layering'], setting: 'bezel', base: 159, art: { kind: 'pendant', head: 'bezel' }, coll: ['personalized-jewelry', 'birthday-gifts'], flags: ['new'], options: [{ tw: 0.05, delta: 40 }], note: 'A polished disc with a single bezel diamond — engrave it with initials on the reverse.' },
  { name: 'Mila Petite Round Pendant', cat: 'pendants', shapes: ['round'], styles: ['solitaire', 'layering'], setting: 'four-prong', base: 159, art: { kind: 'pendant', head: 'solitaire' }, coll: ['birthday-gifts', 'solitaire'], options: [{ tw: 0.15, delta: 55 }, { tw: 0.25, delta: 95 }], note: 'A petite solitaire on an adjustable chain — the perfect first diamond.' },

  // ───────────── Necklaces ─────────────
  { name: 'Nova Classic Round Tennis Necklace', cat: 'necklaces', shapes: ['round'], styles: ['tennis'], setting: 'four-prong', base: 990, art: { kind: 'tennis-necklace', stoneShape: 'round' }, coll: ['tennis', 'anniversary-gifts'], flags: ['featured', 'trending'], options: [{ tw: 5, delta: 1950 }, { tw: 7, delta: 2900 }, { tw: 10, delta: 4100 }], note: 'An uninterrupted river of matched round brilliants with a hidden box clasp and double safety.' },
  { name: 'Olympia Graduated Tennis Necklace', cat: 'necklaces', shapes: ['round'], styles: ['tennis'], setting: 'four-prong', base: 1090, art: { kind: 'tennis-necklace', stoneShape: 'round', graduated: true }, coll: ['tennis'], options: [{ tw: 5, delta: 1950 }, { tw: 8, delta: 3200 }], note: 'Diamonds gently increase in size towards the centre, drawing the eye to the décolletage.' },
  { name: 'Paloma Emerald Cut Tennis Necklace', cat: 'necklaces', shapes: ['emerald'], styles: ['tennis', 'modern'], setting: 'four-prong', base: 1290, purities: ['14K', '18K'], art: { kind: 'tennis-necklace', stoneShape: 'emerald' }, coll: ['tennis', 'emerald-cut', 'art-deco'], options: [{ tw: 8, delta: 3600 }, { tw: 12, delta: 5200 }], note: 'Emerald cuts set east-west for a sleek, liquid line of light.' },
  { name: 'Quinn Oval Tennis Necklace', cat: 'necklaces', shapes: ['oval'], styles: ['tennis'], setting: 'four-prong', base: 1190, art: { kind: 'tennis-necklace', stoneShape: 'oval' }, coll: ['tennis'], flags: ['new'], options: [{ tw: 6, delta: 2700 }, { tw: 9, delta: 3900 }], note: 'Ovals laid end to end for a softer, more romantic take on the tennis necklace.' },
  { name: 'Sloane Diamond Station Necklace', cat: 'necklaces', shapes: ['round'], styles: ['layering', 'bezel'], setting: 'bezel', base: 260, art: { kind: 'station-necklace' }, coll: ['birthday-gifts'], flags: ['trending'], options: [{ tw: 0.3, delta: 160 }, { tw: 0.5, delta: 260 }], note: 'Five bezel diamonds spaced along a fine chain — effortless on its own or layered.' },
  { name: 'Tessa Bezel Oval Solitaire Necklace', cat: 'necklaces', shapes: ['oval'], styles: ['solitaire', 'bezel'], setting: 'bezel', center: 1, total: 1, base: 280, art: { kind: 'pendant', head: 'bezel' }, coll: ['solitaire'], note: 'A bezel-set oval fixed on a fine chain so it always sits perfectly centred.' },
  { name: 'Uma Layering Chain with Diamond Stations', cat: 'necklaces', shapes: ['round'], styles: ['layering'], setting: 'bezel', base: 179, art: { kind: 'station-necklace' }, coll: ['birthday-gifts'], flags: ['new'], options: [{ tw: 0.15, delta: 70 }], note: 'A dainty layering chain punctuated with tiny diamond stations.' },

  // ───────────── Bracelets ─────────────
  { name: 'Vera Classic Round Tennis Bracelet', cat: 'bracelets', shapes: ['round'], styles: ['tennis'], setting: 'four-prong', base: 520, art: { kind: 'tennis-bracelet', stoneShape: 'round' }, coll: ['tennis', 'anniversary-gifts', 'wedding-gifts'], flags: ['trending', 'featured'], options: [{ tw: 2, delta: 690 }, { tw: 3, delta: 990 }, { tw: 5, delta: 1690 }, { tw: 7, delta: 2390 }], note: 'The definitive tennis bracelet — flexible, perfectly matched and secured with a double-lock clasp.' },
  { name: 'Winona Oval Tennis Bracelet', cat: 'bracelets', shapes: ['oval'], styles: ['tennis'], setting: 'four-prong', base: 640, art: { kind: 'tennis-bracelet', stoneShape: 'oval' }, coll: ['tennis'], options: [{ tw: 4, delta: 1450 }, { tw: 6, delta: 2150 }], note: 'East-west ovals flow around the wrist in a softly scalloped line.' },
  { name: 'Xenia Emerald Cut Tennis Bracelet', cat: 'bracelets', shapes: ['emerald'], styles: ['tennis', 'modern'], setting: 'four-prong', base: 720, art: { kind: 'tennis-bracelet', stoneShape: 'emerald' }, coll: ['tennis', 'emerald-cut'], options: [{ tw: 5, delta: 1890 }, { tw: 8, delta: 2990 }], note: 'A ribbon of step-cut diamonds with Art Deco poise.' },
  { name: 'Yvette Bezel Station Bracelet', cat: 'bracelets', shapes: ['round'], styles: ['bezel', 'layering'], setting: 'bezel', base: 159, art: { kind: 'bangle', stones: 'none', head: 'bezel' }, coll: ['birthday-gifts'], flags: ['new'], options: [{ tw: 0.25, delta: 80 }], note: 'A fine chain bracelet with bezel-set diamonds — light, easy and made to stack.' },
  { name: 'Zelie Pavé Diamond Bangle', cat: 'bracelets', shapes: ['round'], styles: ['bangle'], setting: 'pave', base: 640, art: { kind: 'bangle', stones: 'half' }, coll: ['anniversary-gifts'], options: [{ tw: 0.5, delta: 240 }, { tw: 1, delta: 470 }], note: 'A slim hinged bangle with pavé across the top for subtle, all-day sparkle.' },
  { name: 'Anouk Baguette Tennis Bracelet', cat: 'bracelets', shapes: ['emerald'], styles: ['tennis', 'baguette'], setting: 'channel', base: 680, art: { kind: 'tennis-bracelet', stoneShape: 'baguette' }, coll: ['tennis', 'art-deco'], options: [{ tw: 3, delta: 1190 }, { tw: 5, delta: 1890 }], note: 'Channel-set baguettes create a smooth, architectural line around the wrist.' },
  { name: 'Brielle Bold Gold Cuff', cat: 'bracelets', shapes: ['round'], styles: ['bangle', 'bold-gold', 'bezel'], setting: 'bezel', base: 790, purities: ['14K', '18K'], art: { kind: 'bangle', stones: 'none', head: 'bezel' }, coll: ['geometric'], options: [{ tw: 0.3, delta: 130 }], note: 'A substantial open cuff in polished gold, punctuated by one bezel-set diamond.' },
];

export const REVIEW_POOL = [
  { rating: 5, title: 'Better than I imagined', body: 'The photos do not do it justice. The diamond is incredibly bright and the setting feels substantial and beautifully finished.' },
  { rating: 5, title: 'She said yes!', body: 'The concierge team helped me pick the perfect stone within my budget. It arrived early, fully insured, in the most beautiful box.' },
  { rating: 5, title: 'Exquisite craftsmanship', body: 'You can tell this was made by people who care. Every claw is perfectly polished and the stone sits beautifully level.' },
  { rating: 4, title: 'Gorgeous, sizing took a week', body: 'Absolutely stunning piece. I needed a resize and it took about a week, but the team kept me updated the whole time.' },
  { rating: 5, title: 'Wear it every day', body: 'Comfortable enough to wear every day and it still catches the light constantly. I get compliments wherever I go.' },
  { rating: 5, title: 'Certificate gave me confidence', body: 'The IGI report matched the diamond exactly and I could verify it online. Great value compared to what I saw elsewhere.' },
  { rating: 5, title: 'Perfect anniversary gift', body: 'Bought this for our tenth anniversary. My wife cried. The packaging alone felt like a luxury experience.' },
  { rating: 5, title: 'Sparkles like crazy', body: 'I was nervous buying fine jewelry online but the quality is exceptional. The cut is superb — it sparkles even in dim light.' },
  { rating: 4, title: 'Beautiful and delicate', body: 'Lovely, delicate piece. Slightly smaller than I expected but that is my fault for not checking the measurements.' },
  { rating: 5, title: 'Customer service is outstanding', body: 'They answered all my questions on WhatsApp within minutes and even sent a video of the exact diamond before I ordered.' },
  { rating: 5, title: 'Heirloom quality', body: 'Feels like something that will be passed down. Weighty, well made and the gold colour is rich and warm.' },
  { rating: 5, title: 'Matches my engagement ring perfectly', body: 'Sits flush against my ring and the diamonds are perfectly matched in colour. Could not be happier.' },
  { rating: 5, title: 'Exactly as described', body: 'Arrived exactly as described with all paperwork. Shipping was fast and the tracking was clear throughout.' },
  { rating: 4, title: 'Lovely piece', body: 'Very pretty and well made. The clasp is secure and easy to use. Would buy again.' },
  { rating: 5, title: 'Showstopper', body: 'I wore it to a wedding and could not stop looking at it. It is truly a showstopper without being flashy.' },
  { rating: 5, title: 'Ethical and beautiful', body: 'Knowing it is lab-grown and still this beautiful makes it even more special to me.' },
];

export const REVIEWERS = [
  ['Priya S.', 'Mumbai, IN'], ['Emily R.', 'New York, US'], ['James T.', 'London, UK'], ['Aisha K.', 'Dubai, AE'], ['Sophie L.', 'Paris, FR'],
  ['Daniel M.', 'Toronto, CA'], ['Mei C.', 'Singapore, SG'], ['Olivia B.', 'Sydney, AU'], ['Rohan P.', 'Bengaluru, IN'], ['Hannah W.', 'Chicago, US'],
  ['Lucas F.', 'Berlin, DE'], ['Ananya G.', 'Delhi, IN'], ['Grace H.', 'Auckland, NZ'], ['Noah A.', 'Austin, US'], ['Isabella V.', 'Milan, IT'], ['Zara N.', 'Manchester, UK'],
];

export const FIRST_NAMES = ['Ava', 'Liam', 'Maya', 'Arjun', 'Chloe', 'Ethan', 'Leah', 'Kabir', 'Nina', 'Oscar', 'Riya', 'Samuel', 'Tara', 'Vikram', 'Zoe', 'Aarav', 'Bella', 'Dev', 'Elena', 'Farah', 'Gabriel', 'Ishita', 'Jonah', 'Kiara', 'Leo', 'Meera', 'Nathan', 'Pooja', 'Ruby', 'Siddharth'];
export const LAST_NAMES = ['Sharma', 'Patel', 'Williams', 'Chen', 'Kapoor', 'Johnson', 'Mehta', 'Brown', 'Singh', 'Garcia', 'Iyer', 'Taylor', 'Nair', 'Martin', 'Reddy', 'Clarke'];
export const CITIES = [
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', postal: '400001' },
  { city: 'New York', state: 'NY', country: 'United States', postal: '10001' },
  { city: 'London', state: 'Greater London', country: 'United Kingdom', postal: 'W1K 1AA' },
  { city: 'Dubai', state: 'Dubai', country: 'United Arab Emirates', postal: '00000' },
  { city: 'Bengaluru', state: 'Karnataka', country: 'India', postal: '560001' },
  { city: 'Toronto', state: 'ON', country: 'Canada', postal: 'M5H 2N2' },
  { city: 'Singapore', state: 'Singapore', country: 'Singapore', postal: '018989' },
  { city: 'Sydney', state: 'NSW', country: 'Australia', postal: '2000' },
  { city: 'Delhi', state: 'Delhi', country: 'India', postal: '110001' },
  { city: 'Los Angeles', state: 'CA', country: 'United States', postal: '90012' },
];
