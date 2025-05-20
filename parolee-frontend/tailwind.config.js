// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Make sure it scans your source files
  ],
  darkMode: 'class', // Optional: if you want dark mode toggle later
  theme: {
    extend: {
      colors: { // Add your brand colors from Laravel project's tailwind.config.js
        'brand-purple': {
          light: '#A78BFA',
          DEFAULT: '#6D28D9',
          medium: '#5B21B6',
          dark: '#4C1D95',
          hero: '#4C1D95', // This was from landing page, adjust for admin
          admin: '#4F46E5', // Example for admin panel primary (Indigo-600)
        },
        'brand-gray': {
          extralight: '#F9FAFB',
          light: '#F3F4F6',
          DEFAULT: '#6B7280',
          medium: '#4B5563',
          dark: '#1F2937',
          'admin-bg': '#111827', // Example dark background for admin
          'admin-card': '#1F2937', // Example dark card background
        }
      },
    },
  },
  plugins: [
    //require('@tailwindcss/forms'), // If you use it for forms
  ],
}