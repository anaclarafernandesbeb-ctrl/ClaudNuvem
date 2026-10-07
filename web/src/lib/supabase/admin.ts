import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Cliente com a chave secreta: ignora RLS. Use só no servidor. */
export function criarClienteAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
