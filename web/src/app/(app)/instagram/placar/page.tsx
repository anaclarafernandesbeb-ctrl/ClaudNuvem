import Link from "next/link";
import { calcularPlacar, carregarContaIg, type LinhaPlacar } from "@/lib/conta-ig";
import { ETAPAS_IG, type PerfilIg } from "@/lib/instagram";
import { CartaoPerfilIg } from "@/components/CartaoPerfilIg";

const GANCHOS: Record<string, string> = {
  conteudo_recente: "Conteúdo recente",
  lancamento: "Lançamento",
  bio: "Bio",
  conquista: "Conquista",
  pergunta_do_publico: "Pergunta do público",
  nicho: "Nicho",
  outro: "Outro",
};

function pct(a: number, b: number) {
  return b === 0 ? "–" : `${Math.round((100 * a) / b)}%`;
}

function Tabela({ titulo, linhas, rotulos }: { titulo: string; linhas: LinhaPlacar[]; rotulos?: Record<string, string> }) {
  return (
    <div className="cartao space-y-3 overflow-x-auto">
      <h2 className="text-xl font-semibold">{titulo}</h2>
      {linhas.length === 0 ? (
        <p className="text-sm text-texto-suave">Ainda sem abordagens registradas.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-texto-suave">
            <tr><th className="py-1">Tipo</th><th>Abordados</th><th>Resposta</th><th>Call</th><th>Vendas</th></tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.chave} className="border-t border-borda">
                <td className="py-1">{rotulos?.[l.chave] ?? l.chave}</td>
                <td>{l.abordados}</td>
                <td className="font-semibold">{pct(l.responderam, l.abordados)}</td>
                <td>{l.calls}</td>
                <td>{l.vendas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default async function Placar({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { supabase } = await carregarContaIg();
  const placar = await calcularPlacar(supabase);
  const filtro = ETAPAS_IG.find((e) => e.status === status)?.status ?? "respondeu";
  const { data } = await supabase.from("perfis_ig").select("*").eq("status", filtro).order("created_at", { ascending: false }).limit(60);
  const perfis = (data ?? []) as PerfilIg[];
  const t = placar.total;

  const funil = [
    { nome: "Abordados", valor: t.abordados, taxa: null },
    { nome: "Responderam", valor: t.responderam, taxa: pct(t.responderam, t.abordados), meta: "meta ≥ 15%" },
    { nome: "Call / checkout", valor: t.calls, taxa: pct(t.calls, t.responderam), meta: "meta ≥ 30%" },
    { nome: "Vendas", valor: t.vendas, taxa: pct(t.vendas, t.calls), meta: "meta ≥ 30%" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/instagram" className="text-sm underline">← Lista do dia</Link>
        <h1 className="mt-2 text-3xl font-bold">Placar</h1>
        <p className="text-texto-suave">
          O que está convertendo. A partir de 10 abordagens, a IA passa a priorizar os ganchos e nichos que mais respondem.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        {funil.map((f) => (
          <div key={f.nome} className="cartao">
            <p className="text-sm text-texto-suave">{f.nome}</p>
            <p className="text-3xl font-bold">{f.valor}</p>
            {f.taxa && <p className="text-sm"><b>{f.taxa}</b> da etapa anterior · <span className="text-texto-suave">{f.meta}</span></p>}
          </div>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Tabela titulo="Por tipo de gancho" linhas={placar.porGancho} rotulos={GANCHOS} />
        <Tabela titulo="Por nicho" linhas={placar.porNicho} />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Funil</h2>
        <div className="flex flex-wrap gap-2">
          {ETAPAS_IG.map((e) => (
            <Link key={e.status} href={`/instagram/placar?status=${e.status}`}
              className={`rounded-full border px-3 py-1 text-sm ${filtro === e.status ? "border-laranja bg-laranja font-semibold" : "border-borda"}`}>
              {e.nome}
            </Link>
          ))}
        </div>
        {perfis.length === 0 ? (
          <p className="text-texto-suave">Nenhum perfil nesta etapa.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {perfis.map((p) => <CartaoPerfilIg key={p.id} perfil={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
