/** "Find Your Match" recommendation quiz definition (seeded into recommendation_quiz). */

export type QuizOption = { value: string; label: string; hint?: string };
export type QuizQuestion = { id: string; title: string; subtitle?: string; options: QuizOption[]; layout?: 'grid' | 'shapes' | 'list' };

export const QUIZ_SLUG = 'find-your-match';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'recipient',
    title: 'Who are you shopping for?',
    subtitle: 'We will tailor every suggestion to them.',
    options: [
      { value: 'partner', label: 'My partner' },
      { value: 'proposal', label: 'A proposal', hint: 'Planning to pop the question' },
      { value: 'myself', label: 'Myself', hint: 'Treat yourself — you deserve it' },
      { value: 'family', label: 'Family or a friend' },
    ],
  },
  {
    id: 'occasion',
    title: 'What is the occasion?',
    options: [
      { value: 'engagement', label: 'Engagement' },
      { value: 'wedding', label: 'Wedding' },
      { value: 'anniversary', label: 'Anniversary' },
      { value: 'birthday', label: 'Birthday' },
      { value: 'milestone', label: 'A milestone' },
      { value: 'everyday', label: 'Just because' },
    ],
  },
  {
    id: 'metal',
    title: 'Which metal do they wear most?',
    options: [
      { value: 'yellow', label: 'Yellow Gold' },
      { value: 'white', label: 'White Gold' },
      { value: 'rose', label: 'Rose Gold' },
      { value: 'any', label: 'Not sure' },
    ],
  },
  {
    id: 'shape',
    title: 'Pick a diamond shape',
    subtitle: 'Go with your instinct — you can always change it later.',
    layout: 'shapes',
    options: [
      { value: 'round', label: 'Round' },
      { value: 'oval', label: 'Oval' },
      { value: 'princess', label: 'Princess' },
      { value: 'cushion', label: 'Cushion' },
      { value: 'emerald', label: 'Emerald' },
      { value: 'pear', label: 'Pear' },
      { value: 'marquise', label: 'Marquise' },
      { value: 'radiant', label: 'Radiant' },
      { value: 'asscher', label: 'Asscher' },
      { value: 'heart', label: 'Heart' },
      { value: 'any', label: 'Not sure' },
    ],
  },
  {
    id: 'budget',
    title: 'What is your budget?',
    options: [
      { value: '0-500', label: 'Under $500' },
      { value: '500-1000', label: '$500 – $1,000' },
      { value: '1000-2500', label: '$1,000 – $2,500' },
      { value: '2500-5000', label: '$2,500 – $5,000' },
      { value: '5000-', label: '$5,000+' },
    ],
  },
  {
    id: 'style',
    title: 'Which style feels most like them?',
    options: [
      { value: 'classic', label: 'Classic & timeless' },
      { value: 'modern', label: 'Modern & minimal' },
      { value: 'vintage', label: 'Vintage-inspired' },
      { value: 'statement', label: 'Bold & statement' },
      { value: 'delicate', label: 'Delicate & everyday' },
    ],
  },
  {
    id: 'type',
    title: 'What kind of piece?',
    options: [
      { value: 'engagement', label: 'Engagement ring' },
      { value: 'band', label: 'Wedding band' },
      { value: 'ring', label: 'Fashion ring' },
      { value: 'earrings', label: 'Earrings' },
      { value: 'necklace', label: 'Necklace or pendant' },
      { value: 'bracelet', label: 'Bracelet' },
    ],
  },
];
