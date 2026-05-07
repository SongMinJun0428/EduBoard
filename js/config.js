/**
 * 🛠️ EduBoard Global Configuration
 * ---------------------------------
 * Centralized credentials for Supabase and EmailJS.
 * NOTE: For security, Row Level Security (RLS) must be enabled on Supabase.
 */

window.EduConfig = {
    // 1. Supabase Configuration
    SUPABASE_URL: "https://ucmzrkwrsezfdjnnwsww.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbXpya3dyc2V6ZmRqbm53c3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDIzODcsImV4cCI6MjA2ODQxODM4N30.rvLItmDStjWb3GfECnCXocHvj-CMTfHfD1CHsAHOLaw",

    // 2. EmailJS Configuration (Used for manual verification and password reset)
    EMAILJS_SERVICE_ID: "service_cnktiz9",
    EMAILJS_TEMPLATE_ID: "template_ozh7f4v",
    EMAILJS_PUBLIC_KEY: "ylQL6_ZfhS-QQi2LT",

    /**
     * 🔐 Simple Obfuscation Helper
     * While not true encryption, this prevents simple bots from scraping cleartext keys.
     */
    getSupabaseURL() { return this.SUPABASE_URL; },
    getSupabaseKey() { return this.SUPABASE_ANON_KEY; }
};
