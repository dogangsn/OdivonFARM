# Tailwind Configuration Guide (Odivon Design System)

This configuration defines the core color tokens, typography, z-index hierarchy, and spacing scale for the Odivon design system.

```javascript
// tailwind.config.js
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
        gray: colors.slate, // Slate is preferred over plain coolGray/gray for modern SaaS
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
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
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
      zIndex: {
        '49': '49',
        '50': '50',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
```
