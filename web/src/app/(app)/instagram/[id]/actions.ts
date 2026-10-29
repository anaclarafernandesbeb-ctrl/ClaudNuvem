"use server";

import { revalidatePath } from "next/cache";
import { calcularPlacar, carregarContaIg, resumoAprendizados } from "@/lib/conta-ig";
import { escreverAbertura, proximaMensagem, raioX } from "@/lib/ia-instagram";
import { INTERVALO_FOLLOWUP_IG, type MensagemIg, type PerfilIg, type StatusIg } from "@/lib/instagram";

async function carregarPerfil(id: string) {
  const conta = await carregarContaIg();
  const { data } = await conta.supabase.from("perfis_ig").select("*").eq("id", id).single();
  if (!data) throw new Error("Perfil não encontrado");
  return { ...conta, perfil: data as PerfilIg };
}

function atualizarTelas(id: string) {
  revalidatePath(`/instagram/${id}`);
  revalidatePath("/instagram");
}

function emDias(dias: number) {
  return new Date(Date.now() + dias * 86_400_000).toISOString();
}

const ERRO_IA = "A IA não respondeu agora. Tente de novo em instantes.";

export type EstadoIg = { erro?: string; aviso?: string };

/** Dados colados pela usuária (perfis pessoais ou sem a API da Meta) + Raio-X na hora. */
export async function salvarDadosEAnalisar(id: string, _: EstadoIg, formData: FormData): Promise<EstadoIg> {
  const { supabase, perfil, ofertaAtiva } = await carregarPerfil(id);
  if (!ofertaAtiva) return { erro: "Cadastre sua oferta primeiro." };
  const texto = (campo: string, max: number) => String(formData.get(campo) || "").trim().slice(0, max) || null;
  const numero = (campo: string) => {
    const n = Number(String(formData.get(campo) || "").replace(/\D/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const dados = {
    nome: texto("nome", 120) ?? perfil.nome,
    bio: texto("bio", 1000) ?? perfil.bio,
    site: texto("site", 300) ?? perfil.site,
    legendas: texto("legendas", 4000) ?? perfil.legendas,
    seguidores: numero("seguidores") ?? perfil.seguidores,
    dados_em: new Date().toISOString(),
  };
  if (!dados.bio && !dados.legendas) return { erro: "Cole pelo menos a bio do perfil." };

  await supabase.from("perfis_ig").update(dados).eq("id", id);
  try {
    const aprendizados = resumoAprendizados(await calcularPlacar(supabase));
    const r = await raioX(ofertaAtiva, { ...perfil, ...dados }, aprendizados);
    await supabase.from("perfis_ig").update({ ...r, analisado_em: new Date().toISOString() }).eq("id", id);
  } catch {
    return { erro: ERRO_IA };
  }
  atualizarTelas(id);
  return { aviso: "Raio-X atualizado." };
}

/** Abertura (status novo) ou follow-up (abordado e sem resposta). */
export async function escreverDm(id: string, _: EstadoIg): Promise<EstadoIg> {
  const { supabase, perfil, ofertaAtiva } = await carregarPerfil(id);
  if (!ofertaAtiva) return { erro: "Cadastre sua oferta primeiro." };
  const passo = perfil.status === "novo" ? 0 : perfil.followup_passo + 1;
  try {
    const aprendizados = resumoAprendizados(await calcularPlacar(supabase));
    const m = await escreverAbertura(ofertaAtiva, perfil, passo, aprendizados);
    await supabase
      .from("perfis_ig")
      .update({ rascunho: m.mensagem, ...(passo === 0 ? { tipo_gancho: m.tipo_gancho } : {}) })
      .eq("id", id);
  } catch {
    return { erro: ERRO_IA };
  }
  atualizarTelas(id);
  return {};
}

export async function salvarRascunho(id: string, formData: FormData) {
  const { supabase } = await carregarPerfil(id);
  await supabase
    .from("perfis_ig")
    .update({ rascunho: String(formData.get("rascunho") || "").slice(0, 2000) || null })
    .eq("id", id);
  revalidatePath(`/instagram/${id}`);
}

/** A usuária confirma que enviou o rascunho no Instagram. */
export async function marcarEnviado(id: string, formData: FormData) {
  const { supabase, user, perfil } = await carregarPerfil(id);
  const texto = String(formData.get("rascunho") || perfil.rascunho || "").trim().slice(0, 2000);
  if (!texto) return;

  await supabase.from("mensagens_ig").insert({ user_id: user.id, perfil_id: id, autor: "eu", texto, etapa: perfil.etapa });

  if (perfil.status === "novo") {
    await supabase
      .from("perfis_ig")
      .update({
        status: "abordado",
        enviado_em: new Date().toISOString(),
        followup_passo: 0,
        proximo_followup_em: emDias(INTERVALO_FOLLOWUP_IG[0]),
        rascunho: null,
      })
      .eq("id", id);
  } else if (perfil.status === "abordado") {
    const passo = perfil.followup_passo + 1;
    await supabase
      .from("perfis_ig")
      .update({
        followup_passo: passo,
        proximo_followup_em: passo < INTERVALO_FOLLOWUP_IG.length ? emDias(INTERVALO_FOLLOWUP_IG[passo]) : null,
        rascunho: null,
      })
      .eq("id", id);
  } else {
    await supabase.from("perfis_ig").update({ rascunho: null }).eq("id", id);
  }
  atualizarTelas(id);
}

export type EstadoResposta = {
  erro?: string;
  resultado?: { classificacao: string; leitura: string; estrategia: string; alternativa: string };
};

/** 3.3 A usuária cola a resposta do lead; a IA lê e deixa a próxima mensagem pronta. */
export async function registrarResposta(id: string, _: EstadoResposta, formData: FormData): Promise<EstadoResposta> {
  const texto = String(formData.get("resposta") || "").trim().slice(0, 4000);
  if (!texto) return { erro: "Cole a resposta que você recebeu." };
  const { supabase, user, perfil, ofertaAtiva } = await carregarPerfil(id);
  if (!ofertaAtiva) return { erro: "Cadastre sua oferta primeiro." };

  const { data: historico } = await supabase
    .from("mensagens_ig")
    .select("*")
    .eq("perfil_id", id)
    .order("created_at");

  let r: Awaited<ReturnType<typeof proximaMensagem>>;
  try {
    r = await proximaMensagem(ofertaAtiva, perfil, (historico ?? []) as MensagemIg[], texto);
  } catch {
    return { erro: ERRO_IA };
  }

  await supabase
    .from("mensagens_ig")
    .insert({ user_id: user.id, perfil_id: id, autor: "lead", texto, etapa: perfil.etapa, classificacao: r.classificacao });

  let status: StatusIg = perfil.status;
  if (r.classificacao === "pediu_parar") {
    await supabase
      .from("bloqueios_ig")
      .upsert({ user_id: user.id, username: perfil.username }, { onConflict: "user_id,username" });
    status = "perdido";
  } else if (r.classificacao === "sem_interesse") {
    status = "perdido";
  } else if (r.classificacao === "comprou") {
    status = "venda";
  } else if (perfil.status === "novo" || perfil.status === "abordado") {
    status = "respondeu";
  }

  await supabase
    .from("perfis_ig")
    .update({ status, etapa: r.etapa, rascunho: r.mensagem, proximo_followup_em: null })
    .eq("id", id);

  atualizarTelas(id);
  return {
    resultado: { classificacao: r.classificacao, leitura: r.leitura, estrategia: r.estrategia, alternativa: r.alternativa },
  };
}

export async function mudarStatus(id: string, status: StatusIg) {
  const { supabase } = await carregarPerfil(id);
  await supabase
    .from("perfis_ig")
    .update({ status, ...(status !== "abordado" ? { proximo_followup_em: null } : {}) })
    .eq("id", id);
  atualizarTelas(id);
  revalidatePath("/instagram/placar");
}

export async function salvarNotas(id: string, formData: FormData) {
  const { supabase } = await carregarPerfil(id);
  await supabase.from("perfis_ig").update({ notas: String(formData.get("notas") || "").slice(0, 5000) }).eq("id", id);
  revalidatePath(`/instagram/${id}`);
}

export async function bloquearPerfil(id: string) {
  const { supabase, user, perfil } = await carregarPerfil(id);
  await supabase
    .from("bloqueios_ig")
    .upsert({ user_id: user.id, username: perfil.username }, { onConflict: "user_id,username" });
  await supabase.from("perfis_ig").update({ status: "perdido", proximo_followup_em: null, rascunho: null }).eq("id", id);
  atualizarTelas(id);
}
