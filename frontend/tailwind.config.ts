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
        background: "#F8FAFC",
        foreground: "#0C2340",
        // Authentic Razorpay Enterprise Palette
        razorpay: {
          navy: "#0C2340",       // Midnight Razorpay Dark Navy (Headers, Sidebar active)
          dark: "#081528",       // Deepest Slate Navy
          blue: "#0C83FF",       // Razorpay Primary Electric Blue
          bright: "#3395FF",     // Razorpay Electric Light Blue
          cyan: "#00D2D2",       // Razorpay Cyan Accent
          hover: "#0266CC",      // Blue Hover
          surface: "#F4F7FA",    // Subtle Card Background
          border: "#E2E8F0",     // Clean Slate Border
        },
        brand: {
          50: "#F0F7FF",
          100: "#E0EFFE",
          200: "#BAE0FD",
          500: "#0C83FF",
          600: "#0266CC",
          700: "#0C2340",
          900: "#081528",
        },
        financial: {
          matched: "#10B981",    // Emerald
          warning: "#F59E0B",    // Amber
          danger: "#EF4444",     // Rose
          neutral: "#64748B",    // Slate
          cyan: "#06B6D4",       // Cyan
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        "fin-card": "0 1px 3px 0 rgba(12, 35, 64, 0.04), 0 1px 2px -1px rgba(12, 35, 64, 0.04)",
        "fin-hover": "0 10px 15px -3px rgba(12, 35, 64, 0.06), 0 4px 6px -4px rgba(12, 35, 64, 0.03)",
        "fin-elevated": "0 20px 25px -5px rgba(12, 35, 64, 0.08), 0 8px 10px -6px rgba(12, 35, 64, 0.04)",
      }
    },
  },
  plugins: [],
};
export default config;
