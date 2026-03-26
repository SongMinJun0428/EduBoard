const SUPABASE_URL = "https://ucmzrkwrsezfdjnnwsww.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbXpya3dyc2V6ZmRqbm53c3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDIzODcsImV4cCI6MjA2ODQxODM4N30.rvLItmDStjWb3GfECnCXocHvj-CMTfHfD1CHsAHOLaw";

// 1. Initialize Supabase Client
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Global AI Config defaults
window.AI_CONFIG = {
    provider: 'gemini',
    apiUrl: '' // Will be populated from Supabase
};

// 3. Fetch API Config from eduboard table
async function fetchAIConfig() {
    try {
        const { data, error } = await window.sb
            .from('eduboard')
            .select('api_url')
            .limit(1)
            .single();

        if (error) {
            console.warn("Failed to fetch AI config from eduboard:", error.message);
        } else if (data && data.api_url) {
            window.AI_CONFIG.apiUrl = data.api_url;
            console.log("AI Config loaded from Supabase successfully.");
        }
    } catch (e) {
        console.warn("Exception while fetching AI config:", e.message);
    }
}

// Fetch immediately on load
fetchAIConfig();
