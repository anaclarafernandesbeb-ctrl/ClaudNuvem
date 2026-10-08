"use server";

import { redirect } from "next/navigation";
import { carregarConta } from "@/lib/conta";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { cancelarAssinatura, criarAssinatura, criarCliente, linkPrimeiraCobranca } from "@/lib/asaas";
import { PLANOS, planoValido } from "@/lib/planos";

export type EstadoAssinar = { erro?: string };

export async function assinar(_: EstadoAssinar, formData: FormData): Promise<EstadoAssinar> {
  const { user, perfil } = await carregarConta();
  const plano = formData.get("plano");
  const nome = String(formData.get("nome") || "").trim();
  const cpfCnpj = String(formData.get("cpf_cnpj") || "").replace(/\D/g, "");
  if (!planoValido(plano) || plano === "gratis") return { erro: "Escolha um plano." };
  if (!nome) return { erro: "Informe seu nome ou o nome da empresa." };
  if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) return { erro: "Informe um CPF ou CNPJ válido." };

  const admin = criarClienteAdmin();
  let link: string | null;
  try {
    const clienteId =
      perfil?.asaas_customer_id ?? (await criarCliente(nome, user.email ?? "", cpfCnpj)).id;
    if (perfil?.asaas_subscription_id) {
      await cancelarAssinatura(perfil.asaas_subscription_id).catch(() => undefined);
    }
    const assinatura = await criarAssinatura(
      clienteId,
      PLANOS[plano].preco,
      `Prospecta ${PLANOS[plano].nome}`,
      user.id,
    );
    await admin
      .from("profiles")
      .update({
        asaas_customer_id: clienteId,
        asaas_subscription_id: assinatura.id,
        plano_pendente: plano,
      })
      .eq("id", user.id);
    link = await linkPrimeiraCobranca(assinatura.id);
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Não foi possível criar a assinatura." };
  }
  if (!link) return { erro: "Assinatura criada, mas a cobrança ainda não ficou pronta. Recarregue a página em instantes." };
  redirect(link);
}
