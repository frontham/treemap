import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#0E1012',
        paper: '#FAFAF7',
        panel: '#F2F1ED',
        hairline: '#E2E1DC',
        muted: '#6B6B65',
        accent: {
          DEFAULT: '#E0530B',
          soft: '#FBE8DA',
          ink: '#7A2E07',
        },
        sage: '#8FA384',
        sky: '#8AA3B0',
        warn: '#B7791F',
        danger: '#B23A30',
        // Dark mirrors — applied under .dark
        'ink-d': '#F0EFEA',
        'paper-d': '#0E1012',
        'panel-d': '#16181B',
        'hairline-d': '#2A2C30',
        'muted-d': '#8C8C85',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        md: ['15px', '22px'],
        lg: ['17px', '24px'],
        xl: ['20px', '28px'],
      },
      letterSpacing: {
        tight: '-0.01em',
        tighter: '-0.02em',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
      },
      boxShadow: {
        floating: '0 1px 2px rgb(14 16 18 / 0.04), 0 6px 24px rgb(14 16 18 / 0.06)',
        pin: '0 1px 2px rgb(14 16 18 / 0.18)',
        ring: '0 0 0 3px rgb(224 83 11 / 0.20)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        'fast': '120ms',
        'med': '180ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
