
(() => {
  const SUPABASE_URL = "https://psyoerdzvkedptvffpnt.supabase.co";

  const SUPABASE_KEY = "TU_CLAVE_PUBLICA_SB_PUBLISHABLE";

  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
})();
