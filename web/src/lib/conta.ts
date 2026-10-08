import "server-only";
import { exigirUsuario } from "./supabase/server";
import { planoValido, type Plano } from "./planos";

export type Icp = {
  id: string;
  nome: string;
  o_que_vende: string;
  para_quem: string;
  diferencial: string | null;
  tom: string;
  assinatura: string | null;
  ufs: string[];
  cidades: string[];
  cnae_prefixos: string[];
  idade_max_dias: number;
  ativo: boolean;
};

/** Usuário logado, o plano que vale agora e o perfil de cliente ativo. */
export async function carregarConta() {
  const { supabase, user } = await exigirUsuario();
  const [{ data: perfil }, { data: icps }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("icps").select("*").order("created_at", { ascending: false }),
  ]);
  const plano: Plano =
    perfil && perfil.plano_status === "ativo" && planoValido(perfil.plano) ? perfil.plano : "gratis";
  const lista = (icps ?? []) as Icp[];
  const icpAtivo = lista.find((i) => i.ativo) ?? lista[0] ?? null;
  return { supabase, user, perfil, plano, icps: lista, icpAtivo };
}
