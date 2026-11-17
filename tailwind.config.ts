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
        // Tokens Semânticos do Design System Editorial (Avantgarde + Yonobi + Sunday in Brooklyn)
        canvas: '#F6F4EF',      // Alabastro / Off-white mineral quente
        surface: '#FDFCF9',     // Papel marfim para cards e superfícies elevadas
        stone: '#EDE9E0',       // Pedra suave para superfícies secundárias e inputs
        hairline: '#DED9CE',    // Divisórias estruturais sutis de 1px
        obsidian: {
          DEFAULT: '#121211',   // Carvão profundo para contrastes editoriais
          soft: '#1B1A18',      // Superfície elevada escura
          border: '#2D2B27',    // Divisória sutil em fundos escuros
        },
        ink: {
          DEFAULT: '#161513',   // Texto principal alto contraste suave
          secondary: '#5B564E', // Texto secundário quente
          muted: '#8C867B',     // Metadados e labels discretos
        },
        bronze: {
          50: '#FAF6F0',
          100: '#F2E9DA',
          200: '#E2CEB0',
          300: '#CFAF82',
          400: '#BC9058',
          500: '#9A6B3B',       // Acento principal contido (Bronze / Terracota nobre)
          600: '#7D542B',
          700: '#624020',
          800: '#4A3018',
          900: '#332010',
        },
        sage: {
          50: '#F2F6F3',
          100: '#E0EAE3',
          600: '#2E5A44',
          700: '#214433',
          800: '#183326',
        },
        // Mapeamento compatível dos tokens primary/accent para coesão total
        primary: {
          50: '#F6F4EF',
          100: '#EDE9E0',
          200: '#DED9CE',
          300: '#C4BEB0',
          400: '#8C867B',
          500: '#5B564E',
          600: '#3D3A34',
          700: '#2A2824',
          800: '#1E1D1A',
          900: '#161513',
          950: '#121211',
        },
        accent: {
          50: '#FAF6F0',
          100: '#F2E9DA',
          200: '#E2CEB0',
          300: '#CFAF82',
          400: '#BC9058',
          500: '#9A6B3B',
          600: '#7D542B',
          700: '#624020',
          800: '#4A3018',
          900: '#332010',
        },
        success: {
          50: '#F2F6F3',
          500: '#2E5A44',
          700: '#214433',
        },
        danger: {
          50: '#FBF2F2',
          500: '#9E3A33',
          700: '#7C2B25',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['var(--font-serif)', 'Cormorant Garamond', 'Georgia', 'serif'],
        serif: ['var(--font-serif)', 'Cormorant Garamond', 'Georgia', 'serif'],
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
