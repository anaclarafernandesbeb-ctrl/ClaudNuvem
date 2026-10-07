"use server";

import { criarClienteAdmin } from "@/lib/supabase/admin";

export type EstadoRemover = { ok?: boolean; erro?: string };

export async function pedirRemocao(_: EstadoRemover, formData: FormData): Promise<EstadoRemover> {
  const cnpj = String(formData.get("cnpj") || "").replace(/\D/g, "");
  const contato = String(formData.get("contato") || "").slice(0, 200);
  const motivo = String(formData.get("motivo") || "").slice(0, 1000);
  if (cnpj.length !== 14) return { erro: "Digite um CNPJ com 14 números." };

  const admin = criarClienteAdmin();
  const { error } = await admin
    .from("global_optouts")
    .upsert({ cnpj, contato, motivo }, { onConflict: "cnpj" });
  if (error) return { erro: "Não foi possível registrar agora. Tente de novo." };

  // Para os follow-ups de quem já tinha essa empresa na lista
  await admin
    .from("leads")
    .update({ proximo_followup_em: null, status: "perdido" })
    .eq("company_cnpj", cnpj)
    .in("status", ["novo", "enviado"]);

  return { ok: true };
}
