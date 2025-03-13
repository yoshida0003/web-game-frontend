import type { Config } from "tailwindcss";

export default {
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
      },
    },
    container: {
      center: true,
      padding: '2rem',
      screens: {
        sm: '100%',
        md: '100%',
        lg: '100%',
        xl: '100%',
        '2xl': '100%',
      },
    },
  },
  plugins: [],
} satisfies Config;
