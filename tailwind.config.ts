import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		spacing: {
  			'section-py': '4rem',      // 16
  			'section-py-sm': '6rem',   // 24
  			'section-py-lg': '8rem',   // 32
  			'section-py-xl': '9rem',   // 36
  			'section-py-2xl': '10rem', // 40
  			'section-px': '1rem',      // 4
  			'section-px-sm': '1.5rem', // 6
  			'section-px-lg': '2rem',   // 8
  			'section-mb': '3rem',      // 12
  			'section-mb-sm': '5rem',   // 20
  		},
  		aspectRatio: {
  			'4/3': '4 / 3',
  			'3/2': '3 / 2',
  			'2/3': '2 / 3',
  			'3/4': '3 / 4',
  			'16/9': '16 / 9',
  			'9/16': '9 / 16',
  		},
  		maxWidth: {
  			'landing-section': '1440px',
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-fade': 'linear-gradient(180deg, var(--tw-gradient-stops))'
  		},
  		fontFamily: {
  			sans: [
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Oxygen',
  				'Ubuntu',
  				'Cantarell',
  				'Open Sans',
  				'Helvetica Neue',
  				'sans-serif',
  			]
  		},
  		fontWeight: {
  			thin: '100',
  			extralight: '200',
  			light: '300',
  			normal: '400',
  			medium: '500',
  			semibold: '600',
  			bold: '700',
  			extrabold: '800',
  			black: '900',
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
  			'collapsible-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-collapsible-content-height)'
  				}
  			},
  			'collapsible-up': {
  				from: {
  					height: 'var(--radix-collapsible-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(30px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'fade-right': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(-30px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			'fade-left': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(30px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			'hero-fade-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(40px)'
  				},
  				'20%': {
  					opacity: '0.2',
  					transform: 'translateY(30px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'spin3d': {
  				from: { transform: 'rotateY(0deg)' },
  				to: { transform: 'rotateY(-360deg)' },
  			},
  			'image-transition': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(20px) scale(0.95)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0) scale(1)'
  				}
  			},
  			'tab-content-out': {
  				'0%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				},
  				'100%': {
  					opacity: '0',
  					transform: 'translateY(-2em)'
  				}
  			},
  			'tab-content-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(2em)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'tab-image-out': {
  				'0%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				},
  				'100%': {
  					opacity: '0',
  					transform: 'translateX(3%)'
  				}
  			},
  			'tab-image-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(3%)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			'fade-in': {
  				'0%': {
  					opacity: '0',
  				},
  				'100%': {
  					opacity: '1',
  				}
  			},
  			'fade-in-scale': {
  				'0%': {
  					opacity: '0',
  					transform: 'scale(0.95)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'collapsible-down': 'collapsible-down 0.2s ease-out',
  			'collapsible-up': 'collapsible-up 0.2s ease-out',
  			'fade-up': 'fade-up 0.8s ease-out forwards',
  			'fade-right': 'fade-right 0.8s ease-out forwards',
  			'fade-left': 'fade-left 0.8s ease-out forwards',
  			'hero-fade-up': 'hero-fade-up 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards',
  			'spin-slow': 'spin3d 24s linear infinite',
  			'pause': 'none',
  			'image-transition': 'image-transition 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'tab-content-out': 'tab-content-out 0.4s cubic-bezier(0.625, 0.05, 0, 1) forwards',
  			'tab-content-in': 'tab-content-in 0.4s cubic-bezier(0.625, 0.05, 0, 1) forwards',
  			'tab-image-out': 'tab-image-out 0.4s cubic-bezier(0.625, 0.05, 0, 1) forwards',
  			'tab-image-in': 'tab-image-in 0.4s cubic-bezier(0.625, 0.05, 0, 1) forwards',
  			'fade-in': 'fade-in 0.5s ease-out forwards',
  			'fade-in-scale': 'fade-in-scale 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontSize: {
  			'text-xs': ['0.6875rem', { lineHeight: '1rem' }],
  			'text-sm': ['0.75rem', { lineHeight: '1.25rem' }],
  			'text-base': ['0.8125rem', { lineHeight: '1.5rem' }],
  			'text-lg': ['0.875rem', { lineHeight: '1.5rem' }],
  			'text-xl': ['1rem', { lineHeight: '1.5rem' }],
  			'2xl': ['1.125rem', { lineHeight: '1.35' }],
  			'3xl': ['1.25rem', { lineHeight: '1.35' }],
  			'4xl': ['1.5rem', { lineHeight: '1.25' }],
  			'5xl': ['1.875rem', { lineHeight: '1.2' }],
  			'6xl': ['2.25rem', { lineHeight: '1.1' }],
  			'7xl': ['3rem', { lineHeight: '1.1' }],
  			'8xl': ['3.75rem', { lineHeight: '1.1' }],
  			'9xl': ['4.5rem', { lineHeight: '1.1' }],
  			'hero': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.04em', fontWeight: '600' }],
  			'hero-sm': ['3.5rem', { lineHeight: '1.2', letterSpacing: '-0.04em', fontWeight: '600' }],
  			'hero-lg': ['4rem', { lineHeight: '1.15', letterSpacing: '-0.04em', fontWeight: '600' }],
  			'hero-xl': ['4.25rem', { lineHeight: '1.15', letterSpacing: '-0.04em', fontWeight: '600' }],
  			'hero-2xl': ['4.5rem', { lineHeight: '1.15', letterSpacing: '-0.04em', fontWeight: '600' }],
  			'section-header': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.04em' }],
  			'section-header-sm': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.04em' }],
  			'section-header-lg': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.04em' }],
  			'section-header-xl': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.04em' }],
  			'section-header-2xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.04em' }],
  			'header-1': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.04em' }],
  			'header-2': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.04em' }],
  			'header-3': ['1.125rem', { lineHeight: '1.2', letterSpacing: '-0.04em' }],
  			'subheader': ['1rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
  			'subheader-sm': ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
  			'subheader-lg': ['1.25rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
  			'button': ['0.8125rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
  			'button-lg': ['0.875rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
  			'text-button': ['0.8125rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
  			'text-button-sm': ['0.75rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
  			'text-button-lg': ['0.875rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
  		},
  		transformStyle: {
  			'preserve-3d': 'preserve-3d',
  		},
  		transitionTimingFunction: {
  			'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  		},
  		transformOrigin: {
  			'center-left': '0 50%',
  			'center-right': '100% 50%',
  		},
  		perspective: {
  			'1000': '1000px',
  			'2000': '2000px',
  		},
  		rotate: {
  			'360': '360deg',
  		},
  		scale: {
  			'102': '1.02',
  		},
  		zIndex: {
  			'60': '60',
  			'70': '70',
  		},
  		boxShadow: {
  			'card': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  			'card-hover': '0 30px 60px -12px rgba(0, 0, 0, 0.35)',
  		},
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(function({ addUtilities }) {
      addUtilities({
        '.animation-delay-150': {
          'animation-delay': '150ms',
        },
        '.animation-delay-300': {
          'animation-delay': '300ms',
        },
        '.animation-delay-500': {
          'animation-delay': '500ms',
        },
        '.tab-button-base': {
          '@apply px-4 sm:px-6 py-2 rounded-lg transition-all font-semibold': {},
        },
        '.tab-button-active': {
          '@apply bg-gray-900 text-white': {},
        },
        '.tab-button-inactive': {
          '@apply text-gray-500 hover:text-gray-900 hover:bg-gray-100': {},
        },
        '.btn-padding': {
          'padding-left': '1.5rem',
          'padding-right': '1.5rem',
          'padding-top': '0.5rem',
          'padding-bottom': '0.5rem',
          '@screen sm': {
            'padding-left': '2rem',
            'padding-right': '2rem',
            'padding-top': '0.75rem',
            'padding-bottom': '0.75rem',
          },
        },
      })
    }),
  ],
};

export default config; 