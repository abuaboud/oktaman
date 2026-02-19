/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			'royal-gold': {
  				'50': 'hsl(49.1 84.6% 94.9%)',
  				'100': 'hsl(50.2 84.3% 90%)',
  				'200': 'hsl(50.2 84.3% 80%)',
  				'300': 'hsl(49.9 85.6% 70%)',
  				'400': 'hsl(50 85.3% 60%)',
  				'500': 'hsl(50 85.1% 50%)',
  				'600': 'hsl(50 85.3% 40%)',
  				'700': 'hsl(49.9 85.6% 30%)',
  				'800': 'hsl(50.2 84.3% 20%)',
  				'900': 'hsl(50.2 84.3% 10%)',
  				'950': 'hsl(50 83.3% 7.1%)'
  			},
  			'bubblegum-pink': {
  				'50': 'hsl(351 76.9% 94.9%)',
  				'100': 'hsl(350.8 76.5% 90%)',
  				'200': 'hsl(350.8 76.5% 80%)',
  				'300': 'hsl(351.3 76.5% 70%)',
  				'400': 'hsl(350.9 77.5% 60%)',
  				'500': 'hsl(350.9 77.3% 50%)',
  				'600': 'hsl(350.9 77.5% 40%)',
  				'700': 'hsl(351.3 76.5% 30%)',
  				'800': 'hsl(350.8 76.5% 20%)',
  				'900': 'hsl(350.8 76.5% 10%)',
  				'950': 'hsl(351.4 77.8% 7.1%)'
  			},
  			'carrot-orange': {
  				'50': 'hsl(32.7 84.6% 98%)',
  				'100': 'hsl(30.7 88.2% 90%)',
  				'200': 'hsl(30.7 88.2% 80%)',
  				'300': 'hsl(31.1 88.2% 70%)',
  				'400': 'hsl(31 88.2% 60%)',
  				'500': 'hsl(30.9 88.2% 50%)',
  				'600': 'hsl(31 88.2% 40%)',
  				'700': 'hsl(31.1 88.2% 30%)',
  				'800': 'hsl(30.7 88.2% 20%)',
  				'900': 'hsl(30.7 88.2% 10%)',
  				'950': 'hsl(30 88.9% 7.1%)'
  			},
  			'strong-cyan': {
  				'50': 'hsl(175.7 53.8% 94.9%)',
  				'100': 'hsl(175.9 56.9% 90%)',
  				'200': 'hsl(175.9 56.9% 80%)',
  				'300': 'hsl(176.5 55.6% 70%)',
  				'400': 'hsl(176.3 55.9% 60%)',
  				'500': 'hsl(175.8 56.1% 50%)',
  				'600': 'hsl(176.3 55.9% 40%)',
  				'700': 'hsl(176.5 55.6% 30%)',
  				'800': 'hsl(175.9 56.9% 20%)',
  				'900': 'hsl(175.9 56.9% 10%)',
  				'950': 'hsl(177 55.6% 7.1%)'
  			},
  			'emerald': {
  				'50': 'hsl(130.9 44% 95.1%)',
  				'100': 'hsl(133 45.1% 90%)',
  				'200': 'hsl(134.3 45.1% 80%)',
  				'300': 'hsl(133.9 45.1% 70%)',
  				'400': 'hsl(134.3 45.1% 60%)',
  				'500': 'hsl(134.1 45.1% 50%)',
  				'600': 'hsl(134.3 45.1% 40%)',
  				'700': 'hsl(133.9 45.1% 30%)',
  				'800': 'hsl(134.3 45.1% 20%)',
  				'900': 'hsl(133 45.1% 10%)',
  				'950': 'hsl(135 44.4% 7.1%)'
  			},
  			'blue-grey': {
  				'50': 'hsl(208 60% 95.1%)',
  				'100': 'hsl(209 60.8% 90%)',
  				'200': 'hsl(209 58.8% 80%)',
  				'300': 'hsl(209 59.5% 70%)',
  				'400': 'hsl(209 58.8% 60%)',
  				'500': 'hsl(209 59.2% 50%)',
  				'600': 'hsl(209 58.8% 40%)',
  				'700': 'hsl(209 59.5% 30%)',
  				'800': 'hsl(209 58.8% 20%)',
  				'900': 'hsl(209 60.8% 10%)',
  				'950': 'hsl(208.6 60% 6.9%)'
  			},
  			'slate-blue': {
  				'50': 'hsl(245.5 44% 95.1%)',
  				'100': 'hsl(245.7 41.2% 90%)',
  				'200': 'hsl(245.7 41.2% 80%)',
  				'300': 'hsl(246.5 42.5% 70%)',
  				'400': 'hsl(246.3 42.2% 60%)',
  				'500': 'hsl(246.2 42% 50%)',
  				'600': 'hsl(246.3 42.2% 40%)',
  				'700': 'hsl(246.5 42.5% 30%)',
  				'800': 'hsl(245.7 41.2% 20%)',
  				'900': 'hsl(245.7 41.2% 10%)',
  				'950': 'hsl(248 42.9% 6.9%)'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
