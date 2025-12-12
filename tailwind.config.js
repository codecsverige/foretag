/** @type {import('tailwindcss').Config} */
import forms from "@tailwindcss/forms";

const config = {
  darkMode: "class", // تفعيل الوضع الليلى عبر class="dark"
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563EB", // blue-600
          dark: "#1E40AF", // blue-800
        },
      },
      ringColor: {
        brand: "#2563EB",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [
    forms, // تحسين مظهر عناصر النماذج
  ],
};

export default config;
