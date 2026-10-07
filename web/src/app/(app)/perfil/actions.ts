"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { carregarConta } from "@/lib/conta";
import { sugerirCnaes } from "@/lib/ia";
import { PLANOS } from "@/lib/planos";
import { normalizarCidade, UFS } from "@/lib/util";

export type EstadoPerfil = { erro?: string };

export async function salvarPerfil(_: EstadoPerfil, formData: FormData): Promise<EstadoPerfil> {
  const { supabase, user, plano, icps } = await carregarConta();

  const id = String(formData.get("id") || "") || null;
  const texto = (campo: string, max = 500) => String(formData.get(campo) || "").trim().slice(0, max);
  const dados = {
    nome: texto("nome", 80) || "Meu cliente ideal",
    o_que_vende: texto("o_que_vende"),
    para_quem: texto("para_quem"),
    diferencial: texto("diferencial") || null,
    tom: texto("tom", 40) || "amigável",
    assinatura: texto("assinatura", 120) || null,
    ufs: formData.getAll("ufs").map(String).filter((u) => UFS.includes(u)),
    cidades: texto("cidades", 1000)
      .split(",")
      .map(normalizarCidade)
      .filter(Boolean),
    idade_max_dias: Math.min(365, Math.max(15, Number(formData.get("idade_max_dias")) || 180)),
  };

  if (!dados.o_que_vende || !dados.para_quem) {
    return { erro: "Conte o que você vende e para quem." };
  }
  if (dados.ufs.length === 0) return { erro: "Escolha pelo menos um estado." };
  if (!id && icps.length >= PLANOS[plano].perfis) {
    return { erro: `Seu plano permite ${PLANOS[plano].perfis} perfil(is) de cliente.` };
  }

  let cnae_prefixos = texto("cnaes", 400)
    .split(/[,\s]+/)
    .map((c) => c.replace(/\D/g, ""))
    .filter((c) => c.length >= 2 && c.length <= 7);

  if (cnae_prefixos.length === 0) {
    try {
      cnae_prefixos = (await sugerirCnaes(dados)).cnae_prefixos;
    } catch {
      return { erro: "A IA não respondeu agora. Tente salvar de novo em instantes." };
    }
  }

  const registro = { ...dados, cnae_prefixos, user_id: user.id, ativo: true };
  const { data, error } = id
    ? await supabase.from("icps").update(registro).eq("id", id).select("id").single()
    : await supabase.from("icps").insert(registro).select("id").single();
  if (error || !data) return { erro: "Não foi possível salvar. Tente de novo." };

  await supabase.from("icps").update({ ativo: false }).neq("id", data.id);
  revalidatePath("/", "layout");
  redirect(`/perfil?salvo=1`);
}

export async function ativarPerfil(id: string) {
  const { supabase } = await carregarConta();
  await supabase.from("icps").update({ ativo: false }).neq("id", id);
  await supabase.from("icps").update({ ativo: true }).eq("id", id);
  revalidatePath("/", "layout");
}
