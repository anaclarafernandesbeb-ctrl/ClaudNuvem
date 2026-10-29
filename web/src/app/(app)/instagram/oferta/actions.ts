"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { carregarContaIg } from "@/lib/conta-ig";

export type EstadoOferta = { erro?: string };

const TIPOS = ["infoproduto", "mentoria", "micro_saas", "servico"];
const CONVITES = ["call", "isca", "checkout"];

export async function salvarOferta(_: EstadoOferta, formData: FormData): Promise<EstadoOferta> {
  const { supabase, user } = await carregarContaIg();

  const id = String(formData.get("id") || "") || null;
  const texto = (campo: string, max = 1000) => String(formData.get(campo) || "").trim().slice(0, max);
  const tipo = texto("tipo", 20);
  const convite = texto("convite", 20);
  const checkout = texto("checkout_url", 500);
  const dados = {
    nome: texto("nome", 120),
    tipo: TIPOS.includes(tipo) ? tipo : "infoproduto",
    preco: texto("preco", 120),
    transformacao: texto("transformacao"),
    para_quem: texto("para_quem"),
    para_quem_nao: texto("para_quem_nao") || null,
    provas: texto("provas", 3000) || null,
    garantia: texto("garantia", 300) || null,
    bonus_urgencia: texto("bonus_urgencia", 500) || null,
    checkout_url: /^https?:\/\//i.test(checkout) ? checkout : null,
    convite: CONVITES.includes(convite) ? convite : "call",
    isca: texto("isca", 500) || null,
    tom: texto("tom", 40) || "amigável",
    assinatura: texto("assinatura", 80) || null,
  };

  if (!dados.nome || !dados.preco || !dados.transformacao || !dados.para_quem) {
    return { erro: "Preencha o nome, o preço, a transformação e para quem é." };
  }
  if (dados.convite === "checkout" && !dados.checkout_url) {
    return { erro: "Para convidar direto para a compra, informe o link de checkout (começando com https://)." };
  }

  const registro = { ...dados, user_id: user.id, ativo: true };
  const { data, error } = id
    ? await supabase.from("ofertas_ig").update(registro).eq("id", id).select("id").single()
    : await supabase.from("ofertas_ig").insert(registro).select("id").single();
  if (error || !data) return { erro: "Não foi possível salvar. Tente de novo." };

  await supabase.from("ofertas_ig").update({ ativo: false }).neq("id", data.id);
  revalidatePath("/instagram", "layout");
  redirect("/instagram/oferta?salvo=1");
}

export async function ativarOferta(id: string) {
  const { supabase } = await carregarContaIg();
  await supabase.from("ofertas_ig").update({ ativo: false }).neq("id", id);
  await supabase.from("ofertas_ig").update({ ativo: true }).eq("id", id);
  revalidatePath("/instagram", "layout");
}
