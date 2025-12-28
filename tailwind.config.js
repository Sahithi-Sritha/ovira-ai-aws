/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#7C3AED',
                    light: '#A78BFA',
                    dark: '#5B21B6',
                },
                secondary: {
                    DEFAULT: '#14B8A6',
                    light: '#5EEAD4',
                },
                accent: {
                    DEFAULT: '#EC4899',
                    light: '#F9A8D4',
                },
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444',
                info: '#3B82F6',
                background: '#FAF5FF',
                surface: {
                    DEFAULT: '#FFFFFF',
                    elevated: '#F9FAFB',
                },
                border: '#E5E7EB',
                'text-primary': '#1F2937',
                'text-secondary': '#6B7280',
                'text-muted': '#9CA3AF',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                'xl': '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            animation: {
                'slide-in-up': 'slideInUp 0.4s ease-out forwards',
                'fade-in': 'fadeIn 0.3s ease-out forwards',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
            },
            keyframes: {
                slideInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' },
                },
            },
        },
    },
    plugins: [],
}
