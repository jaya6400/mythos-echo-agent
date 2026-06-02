import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        card: "var(--card)",
        accent: {
          blue: "#3b82f6",
          amber: "#f59e0b",
          emerald: "#10b981",
          purple: "#8b5cf6",
          rose: "#f43f5e",
        }
      },
      boxShadow: {
        'neon-teal': '0 0 15px rgba(20, 184, 166, 0.2), 0 0 30px rgba(20, 184, 166, 0.05)',
        'neon-indigo': '0 0 15px rgba(99, 102, 241, 0.25), 0 0 40px rgba(99, 102, 241, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: { // Updated to include blur for glow texture and adjusted opacity
          '0%, 100%': { opacity: '0.15', transform: 'scale(1) translate(0px, 0px)', filter: 'blur(0px)' },
          '50%': { opacity: '0.3', transform: 'scale(1.02) translate(6px, -10px)', filter: 'blur(2px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
