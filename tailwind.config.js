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
        // Airbnb-inspired design tokens from DESIGN.md
        primary: {
          DEFAULT: 'var(--color-primary)',      // #ff385c
          active: 'var(--color-primary-active)', // #e00b41
          disabled: 'var(--color-primary-disabled)', // #ffd1da
          light: 'var(--color-primary-disabled)',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'var(--color-surface-soft)', // #f7f7f7
          foreground: 'hsl(var(--secondary-foreground))'
        },
        accent: {
          DEFAULT: 'var(--color-accent)',       // #ff385c
          foreground: 'hsl(var(--accent-foreground))'
        },
        background: 'var(--color-background)',  // #ffffff
        foreground: 'hsl(var(--foreground))',
        text: {
          DEFAULT: 'var(--color-text)',         // #222222
          body: 'var(--color-body)',            // #3f3f3f
          light: 'var(--color-text-light)',     // #6a6a6a
          muted: 'var(--color-muted-soft)',     // #929292
          foreground: 'hsl(var(--foreground))'
        },
        border: 'var(--color-border)',          // #dddddd
        white: 'var(--color-white)',            // #FFFFFF
        canvas: 'var(--color-canvas)',
        surface: {
          soft: 'var(--color-surface-soft)',
          strong: 'var(--color-surface-strong)'
        },
        error: 'var(--color-error)',            // #c13515
        success: 'var(--color-success)',        // #008a05
        warning: 'var(--color-warning)',        // #b26a00
        luxe: 'var(--color-luxe)',
        plus: 'var(--color-plus)',

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
        cereal: [
          '"Airbnb Cereal VF"',
          'Circular',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'sans-serif'
        ],
        // Keep the old utility name mapped to the new system to avoid broad call-site churn.
  			pretendard: [
          '"Airbnb Cereal VF"',
          'Circular',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
  				'sans-serif'
        ],
        barlow: [
          'Barlow',
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
