// src/config.js
// Development mein khali ("") rehta hai: React "/api/..." same address par bhejta hai
// aur vite.config.js ka proxy usay Django (127.0.0.1:8000) tak pahunchata hai.
// Deploy karte waqt .env mein VITE_API_URL=https://aap-ka-backend.com set karein.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "";
export default API_BASE_URL;
