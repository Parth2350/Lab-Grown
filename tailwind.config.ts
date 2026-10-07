import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1200px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        ivory: '#FBF9F5',
        porcelain: '#F5F1EA',
        sand: '#ECE5DA',
        stone: '#D8CFC1',
        ink: '#141311',
        charcoal: '#2B2925',
        taupe: '#68615B',
        line: '#E6DFD3',
        gold: {
          DEFAULT: '#A8834A',
          light: '#CDB079',
          pale: '#F1E7D3',
          deep: '#86662F',
        },
        success: '#3F6B4E',
        danger: '#9B3B32',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.18em',
        wideish: '0.08em',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        display: ['clamp(2.5rem, 5.6vw, 5rem)', { lineHeight: '1.04', letterSpacing: '-0.01em' }],
      },
      maxWidth: {
        site: '1440px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,19,17,0.04), 0 8px 24px -12px rgba(20,19,17,0.12)',
        lift: '0 18px 50px -24px rgba(20,19,17,0.28)',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0.6)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        shimmer: 'shimmer 1.4s linear infinite',
        twinkle: 'twinkle 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
