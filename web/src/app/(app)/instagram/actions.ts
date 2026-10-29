"use server";

import { revalidatePath } from "next/cache";
import { calcularPlacar, carregarContaIg, resumoAprendizados } from "@/lib/conta-ig";
import { raioX } from "@/lib/ia-instagram";
import { normalizarUsername, type PerfilIg } from "@/lib/instagram";
import { buscarPerfilPublico } from "@/lib/meta";

export type EstadoAcao = { erro?: string; aviso?: string };

const MAX_POR_VEZ = 200;
const ANALISES_POR_CLIQUE = 5;

/** Recebe @ colados (um por linha, vírgula ou espaço) e/ou uma planilha CSV. */
export async function adicionarPerfis(_: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const { supabase, user } = await carregarContaIg();

  let texto = String(formData.get("usernames") || "");
  const arquivo = formData.get("planilha");
  const veioDePlanilha = arquivo instanceof File && arquivo.size > 0;
  if (veioDePlanilha) {
    if (arquivo.size > 1_000_000) return { erro: "A planilha deve ter até 1 MB." };
    texto += "\n" + (await arquivo.text());
  }

  // Em planilhas, aproveita qualquer célula que pareça um @ ou um link do Instagram
  const candidatos = texto.split(/[\s,;\t"]+/).filter((t) => t.startsWith("@") || /instagram\.com\//i.test(t) || !veioDePlanilha);
  const usernames = [...new Set(candidatos.map(normalizarUsername).filter(Boolean))] as string[];
  if (usernames.length === 0) return { erro: "Não encontrei nenhum @ válido." };
  if (usernames.length > MAX_POR_VEZ) return { erro: `Adicione até ${MAX_POR_VEZ} perfis por vez.` };

  const { data: bloqueados } = await supabase.from("bloqueios_ig").select("username").in("username", usernames);
  const bloqueio = new Set((bloqueados ?? []).map((b) => b.username));
  const novos = usernames.filter((u) => !bloqueio.has(u));

  const { data, error } = await supabase
    .from("perfis_ig")
    .upsert(
      novos.map((username) => ({ user_id: user.id, username, origem: veioDePlanilha ? "planilha" : "manual" })),
      { onConflict: "user_id,username", ignoreDuplicates: true },
    )
    .select("id");
  if (error) return { erro: "Não foi possível salvar os perfis. Tente de novo." };

  revalidatePath("/instagram");
  const inseridos = data?.length ?? 0;
  const repetidos = novos.length - inseridos;
  return {
    aviso:
      `${inseridos} perfil(is) adicionado(s)` +
      (repetidos > 0 ? `, ${repetidos} já estavam na sua lista` : "") +
      (bloqueio.size > 0 ? `, ${bloqueio.size} bloqueado(s) ignorado(s)` : "") +
      ". Agora clique em “Analisar perfis”.",
  };
}

/** Busca os dados públicos e faz o Raio-X dos próximos perfis ainda não analisados. */
export async function analisarPendentes(_: EstadoAcao): Promise<EstadoAcao> {
  const { supabase, ofertaAtiva } = await carregarContaIg();
  if (!ofertaAtiva) return { erro: "Cadastre sua oferta primeiro." };

  const { data } = await supabase
    .from("perfis_ig")
    .select("*")
    .eq("status", "novo")
    .is("analisado_em", null)
    .is("dados_em", null)
    .order("created_at")
    .limit(ANALISES_POR_CLIQUE);
  const fila = (data ?? []) as PerfilIg[];
  if (fila.length === 0) return { aviso: "Nenhum perfil novo para analisar." };

  const aprendizados = resumoAprendizados(await calcularPlacar(supabase));
  let analisados = 0;
  let semDados = 0;

  await Promise.all(
    fila.map(async (p) => {
      const publicos = await buscarPerfilPublico(p.username);
      const perfil: PerfilIg = { ...p, ...(publicos ?? {}), dados_em: new Date().toISOString() };
      if (!perfil.bio && !perfil.legendas) {
        semDados++;
        await supabase.from("perfis_ig").update({ dados_em: perfil.dados_em }).eq("id", p.id);
        return;
      }
      try {
        const r = await raioX(ofertaAtiva, perfil, aprendizados);
        await supabase
          .from("perfis_ig")
          .update({ ...(publicos ?? {}), dados_em: perfil.dados_em, ...r, analisado_em: new Date().toISOString() })
          .eq("id", p.id);
        analisados++;
      } catch {
        // Fica na fila para a próxima tentativa
      }
    }),
  );

  revalidatePath("/instagram");
  if (analisados === 0 && semDados === 0) return { erro: "A IA não respondeu agora. Tente de novo em instantes." };
  return {
    aviso:
      `${analisados} perfil(is) analisado(s).` +
      (semDados > 0 ? ` ${semDados} sem dados públicos: abra o perfil e cole a bio para analisar.` : ""),
  };
}
