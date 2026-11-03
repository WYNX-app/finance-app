import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('⚠️ ERRO FATAL: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão definidas!');
  // Se isso acontecer, o app não consegue buscar dados, mas não vai "quebrar" a tela em branco
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co', 
  key || 'placeholder', 
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }
);