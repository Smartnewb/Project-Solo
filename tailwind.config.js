/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF69B4', // 핑크
          light: '#FFB6C1',
          dark: '#FF1493',
        },
        secondary: {
          DEFAULT: '#E6E6FA', // 라벤더
          light: '#F0F0FF',
          dark: '#D8D8FF',
        },
        accent: {
          DEFAULT: '#00BFFF', // 네온 블루
          light: '#87CEFA',
          dark: '#0099CC',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      fontFamily: {
        pretendard: ['Pretendard', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'float-up': 'float-up 0.5s ease-out',
        'blink': 'blink 1s infinite',
      },
      keyframes: {
        'float-up': {
          '0%': {
            transform: 'translateY(0) translateX(-50%)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(-20px) translateX(-50%)',
            opacity: '0',
          },
        },
        'blink': {
          '50%': {
            opacity: '0.5',
          },
        },
      },
    },
  },
  plugins: [],
};

