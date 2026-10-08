"use server";

import { revalidatePath } from "next/cache";
import { carregarConta } from "@/lib/conta";
import { avaliarCandidatas } from "@/lib/ia";
import { PLANOS } from "@/lib/planos";
import { diasDesde, hojeBrasil, type Empresa } from "@/lib/util";

export type EstadoLista = { erro?: string; aviso?: string };

export async function gerarListaDoDia(_: EstadoLista): Promise<EstadoLista> {
  const { supabase, user, plano, icpAtivo } = await carregarConta();
  if (!icpAtivo) return { erro: "Cadastre seu cliente ideal primeiro." };

  const hoje = hojeBrasil();
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("data_lista", hoje);
  const faltam = PLANOS[plano].leadsPorDia - (count ?? 0);
  if (faltam <= 0) return { aviso: "Sua lista de hoje já está completa. Volte amanhã!" };

  const { data: candidatas, error } = await supabase.rpc("candidatos_do_dia", {
    p_icp_id: icpAtivo.id,
    p_limite: Math.min(30, faltam * 3),
  });
  if (error) return { erro: "Não foi possível buscar empresas agora." };
  const empresas = (candidatas ?? []) as Empresa[];
  if (empresas.length === 0) {
    return {
      aviso:
        "Não encontramos novas empresas com este perfil. Tente incluir mais cidades, atividades ou um período maior em “Meu cliente ideal”.",
    };
  }

  const codigos = [...new Set(empresas.map((e) => e.cnae_principal).filter(Boolean))] as string[];
  const { data: cnaes } = await supabase.from("cnaes").select("codigo, descricao").in("codigo", codigos);
  const mapaCnae = Object.fromEntries((cnaes ?? []).map((c) => [c.codigo, c.descricao]));

  let notas = new Map<string, { fit: number; motivo: string }>();
  try {
    const avaliacoes = await avaliarCandidatas(icpAtivo, empresas, mapaCnae);
    notas = new Map(avaliacoes.map((a) => [a.cnpj.replace(/\D/g, ""), a]));
  } catch {
    // Sem IA, segue com a ordem por data de abertura
  }

  const escolhidas = empresas
    .map((e) => {
      const nota = notas.get(e.cnpj);
      const dias = diasDesde(e.data_abertura);
      return {
        empresa: e,
        fit: nota ? Math.round(Math.min(100, Math.max(0, nota.fit))) : null,
        motivo: nota?.motivo ?? (dias !== null ? `Empresa aberta há ${dias} dias.` : null),
      };
    })
    .sort((a, b) => (b.fit ?? -1) - (a.fit ?? -1))
    .slice(0, faltam);

  const { error: erroInsert } = await supabase.from("leads").upsert(
    escolhidas.map((x) => ({
      user_id: user.id,
      icp_id: icpAtivo.id,
      company_cnpj: x.empresa.cnpj,
      fit_score: x.fit,
      motivo: x.motivo,
      data_lista: hoje,
    })),
    { onConflict: "user_id,company_cnpj", ignoreDuplicates: true },
  );
  if (erroInsert) return { erro: "Não foi possível salvar a lista. Tente de novo." };

  revalidatePath("/hoje");
  return {};
}
