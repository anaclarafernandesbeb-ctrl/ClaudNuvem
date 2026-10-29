"use server";

import { headers } from "next/headers";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoEntrar = { ok?: boolean; erro?: string };

export async function enviarLink(_: EstadoEntrar, formData: FormData): Promise<EstadoEntrar> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { erro: "Digite um e-mail válido." };

  const origem =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${(await headers()).get("host")}`;
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origem}/auth/callback` },
  });
  if (error) {
    console.error("Login por link falhou:", error.status, error.code, error.message);
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return { erro: "Muitos pedidos de link em pouco tempo. Espere alguns minutos e tente de novo." };
    }
    return { erro: `Não foi possível enviar o link agora (${error.code ?? error.status ?? "erro"}: ${error.message}).` };
  }
  return { ok: true };
}
