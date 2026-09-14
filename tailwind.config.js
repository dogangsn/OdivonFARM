const plugin = require('tailwindcss/plugin');
const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,scss,ts}'],
  important: true,
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        gray: colors.slate,
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
          DEFAULT: '#4f46e5',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', ...defaultTheme.fontFamily.sans],
        mono: ['"IBM Plex Mono"', ...defaultTheme.fontFamily.mono],
      },
      spacing: {
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '50': '12.5rem',
        '72': '18rem',
        '80': '20rem',
        '96': '24rem',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      zIndex: {
        '49': '49',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '99': '99',
        '999': '999',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')({ modifiers: ['sm', 'lg'] }),

    // icon-size plugin (compatible with icon-size-4, icon-size-5, icon-size-6 etc.)
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          'icon-size': (value) => ({
            width: value,
            height: value,
            minWidth: value,
            minHeight: value,
            fontSize: value,
            lineHeight: value,
            svg: {
              width: value,
              height: value,
            },
          }),
        },
        {
          values: {
            '3': '0.75rem',
            '3.5': '0.875rem',
            '4': '1rem',
            '4.5': '1.125rem',
            '5': '1.25rem',
            '6': '1.5rem',
            '7': '1.75rem',
            '8': '2rem',
            '9': '2.25rem',
            '10': '2.5rem',
            '12': '3rem',
            '14': '3.5rem',
            '16': '4rem',
          },
        }
      );
    }),

    // Semantic design tokens for theme compatibility (.bg-card, .bg-default, etc.)
    plugin(({ addComponents }) => {
      addComponents({
        '.bg-card': {
          backgroundColor: 'var(--odivon-bg-card, #ffffff) !important',
        },
        '.bg-default': {
          backgroundColor: 'var(--odivon-bg-default, #f8fafc) !important',
        },
        '.text-default': {
          color: 'var(--odivon-text-default, #0f172a) !important',
        },
        '.text-secondary': {
          color: 'var(--odivon-text-secondary, #64748b) !important',
        },
        '.bg-hover': {
          backgroundColor: 'var(--odivon-bg-hover, rgba(148, 163, 184, 0.12)) !important',
        },
        '.border-default': {
          borderColor: 'var(--odivon-border, #e2e8f0) !important',
        },
      });
    }),
  ],
};
