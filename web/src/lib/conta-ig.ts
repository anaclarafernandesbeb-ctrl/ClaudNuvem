import "server-only";
import { carregarConta } from "./conta";
import type { OfertaIg } from "./instagram";

/** Conta logada + a oferta em uso no Instagram. */
export async function carregarContaIg() {
  const conta = await carregarConta();
  const { data } = await conta.supabase.from("ofertas_ig").select("*").order("created_at", { ascending: false });
  const ofertas = (data ?? []) as OfertaIg[];
  const ofertaAtiva = ofertas.find((o) => o.ativo) ?? ofertas[0] ?? null;
  return { ...conta, ofertas, ofertaAtiva };
}

export type LinhaPlacar = { chave: string; abordados: number; responderam: number; calls: number; vendas: number };

const RESPONDEU = ["respondeu", "call", "venda"];

/** 3.4 Placar: taxa de resposta e de venda por tipo de gancho e por nicho. */
export async function calcularPlacar(supabase: Awaited<ReturnType<typeof carregarConta>>["supabase"]) {
  const { data } = await supabase
    .from("perfis_ig")
    .select("status, tipo_gancho, nicho, enviado_em")
    .not("enviado_em", "is", null);
  const linhas = data ?? [];
  const agrupar = (campo: "tipo_gancho" | "nicho") => {
    const mapa = new Map<string, LinhaPlacar>();
    for (const l of linhas) {
      const chave = (l[campo] as string | null) || "sem registro";
      const linha = mapa.get(chave) ?? { chave, abordados: 0, responderam: 0, calls: 0, vendas: 0 };
      linha.abordados++;
      if (RESPONDEU.includes(l.status)) linha.responderam++;
      if (l.status === "call" || l.status === "venda") linha.calls++;
      if (l.status === "venda") linha.vendas++;
      mapa.set(chave, linha);
    }
    return [...mapa.values()].sort((a, b) => b.responderam / b.abordados - a.responderam / a.abordados);
  };
  const total = agrupar("tipo_gancho").reduce(
    (t, l) => ({
      chave: "total",
      abordados: t.abordados + l.abordados,
      responderam: t.responderam + l.responderam,
      calls: t.calls + l.calls,
      vendas: t.vendas + l.vendas,
    }),
    { chave: "total", abordados: 0, responderam: 0, calls: 0, vendas: 0 },
  );
  return { total, porGancho: agrupar("tipo_gancho"), porNicho: agrupar("nicho") };
}

/** Resumo do placar para a IA priorizar o que já funcionou (só com amostra mínima). */
export function resumoAprendizados(placar: Awaited<ReturnType<typeof calcularPlacar>>) {
  if (placar.total.abordados < 10) return null;
  const pct = (a: number, b: number) => `${Math.round((100 * a) / Math.max(1, b))}%`;
  const ganchos = placar.porGancho
    .filter((l) => l.abordados >= 3)
    .map((l) => `- gancho "${l.chave}": ${pct(l.responderam, l.abordados)} de resposta (${l.abordados} abordagens)`);
  const nichos = placar.porNicho
    .filter((l) => l.abordados >= 3)
    .slice(0, 5)
    .map((l) => `- nicho "${l.chave}": ${pct(l.responderam, l.abordados)} de resposta, ${l.vendas} venda(s)`);
  const texto = [...ganchos, ...nichos].join("\n");
  return texto || null;
}
