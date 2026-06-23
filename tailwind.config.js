/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens — neutral, editorial, restrained. One accent.
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        line: 'var(--color-line)',
        'line-strong': 'var(--color-line-strong)',
        ink: 'var(--color-ink)',
        'ink-muted': 'var(--color-ink-muted)',
        'ink-subtle': 'var(--color-ink-subtle)',
        accent: 'var(--color-accent)',
        'accent-soft': 'var(--color-accent-soft)',
        'accent-ink': 'var(--color-accent-ink)',
        positive: 'var(--color-positive)',
        warning: 'var(--color-warning)',
        critical: 'var(--color-critical)',
      },
      fontSize: {
        display: ['var(--font-size-display)', { lineHeight: 'var(--leading-tight)' }],
        h1: ['var(--font-size-h1)', { lineHeight: 'var(--leading-tight)' }],
        h2: ['var(--font-size-h2)', { lineHeight: 'var(--leading-tight)' }],
        body: ['var(--font-size-body)', { lineHeight: 'var(--leading-normal)' }],
        small: ['var(--font-size-small)', { lineHeight: 'var(--leading-normal)' }],
        micro: ['var(--font-size-micro)', { lineHeight: 'var(--leading-normal)' }],
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        token: 'var(--radius)',
        'token-lg': 'var(--radius-lg)',
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
};
