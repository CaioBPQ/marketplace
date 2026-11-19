import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tokens Semânticos Reativos via CSS Variables (White-Label Dinâmico)
        canvas: 'rgb(var(--canvas-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        stone: 'rgb(var(--stone-rgb) / <alpha-value>)',
        hairline: 'rgb(var(--hairline-rgb) / <alpha-value>)',
        obsidian: {
          DEFAULT: 'rgb(var(--obsidian-rgb) / <alpha-value>)',
          soft: 'rgb(var(--obsidian-soft-rgb) / <alpha-value>)',
          border: 'rgb(var(--obsidian-border-rgb) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--ink-secondary-rgb) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted-rgb) / <alpha-value>)',
        },
        bronze: {
          50: 'rgb(var(--accent-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--accent-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--accent-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--accent-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--accent-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--accent-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--accent-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--accent-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--accent-800-rgb) / <alpha-value>)',
          900: 'rgb(var(--accent-900-rgb) / <alpha-value>)',
        },
        sage: {
          50: 'rgb(var(--sage-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--sage-100-rgb) / <alpha-value>)',
          600: 'rgb(var(--sage-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--sage-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--sage-800-rgb) / <alpha-value>)',
        },
        brand: {
          primary: 'var(--brand-primary)',
          hover: 'var(--brand-primary-hover)',
          dark: 'var(--brand-surface-dark)',
          'dark-soft': 'var(--brand-surface-dark-soft)',
          'on-primary': 'var(--brand-text-on-primary)',
        },
        primary: {
          50: 'rgb(var(--canvas-rgb) / <alpha-value>)',
          100: 'rgb(var(--stone-rgb) / <alpha-value>)',
          200: 'rgb(var(--hairline-rgb) / <alpha-value>)',
          300: 'rgb(var(--ink-muted-rgb) / <alpha-value>)',
          400: 'rgb(var(--ink-muted-rgb) / <alpha-value>)',
          500: 'rgb(var(--ink-secondary-rgb) / <alpha-value>)',
          600: 'rgb(var(--ink-secondary-rgb) / <alpha-value>)',
          700: 'rgb(var(--obsidian-border-rgb) / <alpha-value>)',
          800: 'rgb(var(--obsidian-soft-rgb) / <alpha-value>)',
          900: 'rgb(var(--ink-rgb) / <alpha-value>)',
          950: 'rgb(var(--obsidian-rgb) / <alpha-value>)',
        },
        accent: {
          50: 'rgb(var(--accent-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--accent-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--accent-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--accent-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--accent-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--accent-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--accent-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--accent-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--accent-800-rgb) / <alpha-value>)',
          900: 'rgb(var(--accent-900-rgb) / <alpha-value>)',
        },
        success: {
          50: 'rgb(var(--sage-50-rgb) / <alpha-value>)',
          500: 'rgb(var(--sage-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--sage-700-rgb) / <alpha-value>)',
        },
        danger: {
          50: '#FBF2F2',
          500: '#9E3A33',
          700: '#7C2B25',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['var(--font-heading)', 'Montserrat', 'Cormorant Garamond', 'serif'],
        serif: ['var(--font-heading)', 'Montserrat', 'Cormorant Garamond', 'serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        editorial: '4px',
        card: '6px',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
