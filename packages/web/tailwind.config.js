/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#191B23',
          secondary: '#1E2028',
          tertiary: '#252831',
          surface: '#2A2D37',
        },
        text: {
          primary: '#E2E4E9',
          secondary: '#8B8FA3',
          tertiary: '#5E6272',
        },
        accent: {
          purple: '#7C5CFC',
          teal: '#2DD4BF',
          blue: '#3B82F6',
          amber: '#F59E0B',
          red: '#EF4444',
          pink: '#EC4899',
        },
        border: {
          subtle: '#2A2D37',
          DEFAULT: '#363943',
          strong: '#4A4E5C',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.3)',
        modal: '0 8px 32px rgba(0, 0, 0, 0.5)',
        glow: '0 0 20px rgba(124, 92, 252, 0.15)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.transition-fast': { transition: 'all 150ms ease-in-out' },
        '.transition-normal': { transition: 'all 250ms ease-in-out' },
      })
    }
  ],
};
