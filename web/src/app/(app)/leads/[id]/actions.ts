"use server";

import { revalidatePath } from "next/cache";
import { carregarConta } from "@/lib/conta";
import { analisarResposta, gerarMensagens } from "@/lib/ia";
import { INTERVALO_FOLLOWUP, type Empresa, type StatusLead } from "@/lib/util";

async function carregarLead(id: string) {
  const conta = await carregarConta();
  const { data: lead } = await conta.supabase
    .from("leads")
    .select("*, companies(*), icps(*)")
    .eq("id", id)
    .single();
  if (!lead) throw new Error("Lead não encontrado");
  return { ...conta, lead };
}

function emDias(dias: number) {
  return new Date(Date.now() + dias * 86_400_000).toISOString();
}

export type EstadoMensagem = { erro?: string };

export async function escreverMensagem(id: string, _: EstadoMensagem): Promise<EstadoMensagem> {
  const { supabase, lead, icpAtivo } = await carregarLead(id);
  const perfil = lead.icps ?? icpAtivo;
  if (!perfil) return { erro: "Cadastre seu cliente ideal primeiro." };
  const empresa = lead.companies as Empresa;
  const { data: cnae } = await supabase
    .from("cnaes")
    .select("descricao")
    .eq("codigo", empresa.cnae_principal ?? "")
    .maybeSingle();
  const passo = lead.status === "novo" ? 0 : lead.followup_passo + 1;
  try {
    const m = await gerarMensagens(perfil, empresa, cnae?.descricao ?? null, lead.motivo, passo);
    await supabase
      .from("leads")
      .update({ mensagem_whatsapp: m.whatsapp, email_assunto: m.email_assunto, email_corpo: m.email_corpo })
      .eq("id", id);
  } catch {
    return { erro: "A IA não respondeu agora. Tente de novo em instantes." };
  }
  revalidatePath(`/leads/${id}`);
  return {};
}

export async function salvarMensagem(id: string, formData: FormData) {
  const { supabase } = await carregarLead(id);
  await supabase
    .from("leads")
    .update({
      mensagem_whatsapp: String(formData.get("mensagem_whatsapp") || "").slice(0, 2000),
      email_assunto: String(formData.get("email_assunto") || "").slice(0, 200),
      email_corpo: String(formData.get("email_corpo") || "").slice(0, 5000),
    })
    .eq("id", id);
  revalidatePath(`/leads/${id}`);
}

/** Chamado quando o usuário confirma que enviou a mensagem (primeiro contato ou follow-up). */
export async function marcarEnviado(id: string) {
  const { supabase, lead } = await carregarLead(id);
  if (lead.status === "novo") {
    await supabase
      .from("leads")
      .update({
        status: "enviado",
        enviado_em: new Date().toISOString(),
        followup_passo: 0,
        proximo_followup_em: emDias(INTERVALO_FOLLOWUP[0]),
        mensagem_whatsapp: null,
        email_assunto: null,
        email_corpo: null,
      })
      .eq("id", id);
  } else if (lead.status === "enviado") {
    const passo = lead.followup_passo + 1;
    await supabase
      .from("leads")
      .update({
        followup_passo: passo,
        proximo_followup_em: passo < INTERVALO_FOLLOWUP.length ? emDias(INTERVALO_FOLLOWUP[passo]) : null,
        mensagem_whatsapp: null,
        email_assunto: null,
        email_corpo: null,
      })
      .eq("id", id);
  }
  revalidatePath(`/leads/${id}`);
  revalidatePath("/hoje");
}

export async function mudarStatus(id: string, status: StatusLead) {
  const { supabase } = await carregarLead(id);
  await supabase
    .from("leads")
    .update({ status, ...(status !== "enviado" ? { proximo_followup_em: null } : {}) })
    .eq("id", id);
  revalidatePath(`/leads/${id}`);
  revalidatePath("/hoje");
  revalidatePath("/leads");
}

export async function bloquearEmpresa(id: string) {
  const { supabase, user, lead } = await carregarLead(id);
  await supabase
    .from("suppressions")
    .upsert({ user_id: user.id, cnpj: lead.company_cnpj }, { onConflict: "user_id,cnpj" });
  await supabase.from("leads").update({ status: "perdido", proximo_followup_em: null }).eq("id", id);
  revalidatePath(`/leads/${id}`);
  revalidatePath("/hoje");
}

export async function salvarNotas(id: string, formData: FormData) {
  const { supabase } = await carregarLead(id);
  await supabase.from("leads").update({ notas: String(formData.get("notas") || "").slice(0, 5000) }).eq("id", id);
  revalidatePath(`/leads/${id}`);
}

export type EstadoResposta = {
  erro?: string;
  resultado?: { classificacao: string; resumo: string; sugestao: string };
};

export async function avaliarResposta(
  id: string,
  _: EstadoResposta,
  formData: FormData,
): Promise<EstadoResposta> {
  const texto = String(formData.get("resposta") || "").trim();
  if (!texto) return { erro: "Cole a resposta que você recebeu." };
  const { supabase, user, lead, icpAtivo } = await carregarLead(id);
  const perfil = lead.icps ?? icpAtivo;
  if (!perfil) return { erro: "Cadastre seu cliente ideal primeiro." };
  try {
    const resultado = await analisarResposta(perfil, lead.companies as Empresa, texto);
    if (resultado.classificacao === "pediu_remocao") {
      await supabase
        .from("suppressions")
        .upsert({ user_id: user.id, cnpj: lead.company_cnpj }, { onConflict: "user_id,cnpj" });
      await supabase.from("leads").update({ status: "perdido", proximo_followup_em: null }).eq("id", id);
    } else if (resultado.classificacao === "sem_interesse") {
      await supabase.from("leads").update({ status: "perdido", proximo_followup_em: null }).eq("id", id);
    } else if (lead.status === "novo" || lead.status === "enviado") {
      await supabase.from("leads").update({ status: "respondeu", proximo_followup_em: null }).eq("id", id);
    }
    revalidatePath(`/leads/${id}`);
    return { resultado };
  } catch {
    return { erro: "A IA não respondeu agora. Tente de novo em instantes." };
  }
}
