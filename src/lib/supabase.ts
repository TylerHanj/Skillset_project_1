import { createClient } from '@supabase/supabase-js';

// Подтягиваем переменные в зависимости от твоего сборщика (Vite или Next.js)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Пропущены переменные окружения для Supabase!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
