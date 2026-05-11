/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Skill recommendation: Plus Jakarta Sans — Friendly SaaS
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        // EcoMetriX brand palette (base: GHG green + clean neutrals)
        brand: {
          50:  '#E1F5EE',
          100: '#9FE1CB',
          200: '#5DCAA5',
          300: '#1D9E75',  // primary
          400: '#0F6E56',  // dark primary
          500: '#085041',
          600: '#04342C',
        },
        // Neutrals
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8FAFA',
          tertiary: '#F1F5F3',
        },
        text: {
          primary:   '#1A2E25',
          secondary: '#4A6358',
          muted:     '#8BA898',
        },
        border: {
          DEFAULT: '#D6E8E0',
          strong:  '#B3D4C8',
        },
        // Semantic
        success: '#1D9E75',
        warning: '#BA7517',
        danger:  '#993C1D',
        info:    '#1D6E9E',
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
        modal: '0 20px 60px rgba(0,0,0,0.12)',
      },
      fontSize: {
        xs:   ['11px', { lineHeight: '1.5' }],
        sm:   ['13px', { lineHeight: '1.6' }],
        base: ['15px', { lineHeight: '1.7' }],
        lg:   ['17px', { lineHeight: '1.6' }],
        xl:   ['20px', { lineHeight: '1.4' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['32px', { lineHeight: '1.2' }],
        '4xl': ['40px', { lineHeight: '1.15' }],
      },
    },
  },
  plugins: [],
}
