/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
		'./features/**/*.{js,ts,jsx,tsx,mdx}',
		'./shared/**/*.{js,ts,jsx,tsx,mdx}',
		'./page/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
        // Wippy 스타일 컬러
        primary: {
          DEFAULT: 'var(--color-primary)',      // #6C5CE7
          light: 'var(--color-primary-light)',  // #A8A4E3
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',    // #00B894
          foreground: 'hsl(var(--secondary-foreground))'
        },
        accent: {
          DEFAULT: 'var(--color-accent)',       // #FD79A8
          foreground: 'hsl(var(--accent-foreground))'
        },
        background: 'var(--color-background)',  // #F8FAFD
        foreground: 'hsl(var(--foreground))',
        text: {
          DEFAULT: 'var(--color-text)',         // #2D3436
          light: 'var(--color-text-light)',     // #636E72
          foreground: 'hsl(var(--foreground))'
        },
        border: 'var(--color-border)',          // #DFE6E9
        white: 'var(--color-white)',            // #FFFFFF
        error: 'var(--color-error)',            // #FF7675
        success: 'var(--color-success)',        // #55EFC4
        warning: 'var(--color-warning)',        // #FFEAA7

  			// 기존 다크모드 관련 색상
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			pretendard: [
  				'Pretendard',
  				'sans-serif'
  			]
  		},
  		boxShadow: {
  			card: 'var(--box-shadow)',
        hover: 'var(--box-shadow-hover)'
  		},
  		animation: {
  			'float-up': 'float-up 0.5s ease-out',
  			blink: 'blink 1s infinite'
  		},
  		keyframes: {
  			'float-up': {
  				'0%': {
  					transform: 'translateY(0) translateX(-50%)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'translateY(-20px) translateX(-50%)',
  					opacity: '0'
  				}
  			},
  			blink: {
  				'50%': {
  					opacity: '0.5'
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

