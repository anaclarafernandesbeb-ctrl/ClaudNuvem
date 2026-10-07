import Link from "next/link";
import { carregarConta } from "@/lib/conta";
import { PLANOS } from "@/lib/planos";
import { FormPerfil } from "./FormPerfil";
import { ativarPerfil } from "./actions";

export default async function Perfil({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string; id?: string; salvo?: string }>;
}) {
  const { novo, id, salvo } = await searchParams;
  const { supabase, plano, icps, icpAtivo } = await carregarConta();
  const editando = novo ? null : (icps.find((i) => i.id === id) ?? icpAtivo);

  let descricoes: { codigo: string; descricao: string }[] = [];
  if (editando?.cnae_prefixos.length) {
    const filtro = editando.cnae_prefixos.map((p) => `codigo.like.${p}*`).join(",");
    const { data } = await supabase.from("cnaes").select("codigo, descricao").or(filtro).limit(40);
    descricoes = data ?? [];
  }

  let disponiveis: number | null = null;
  if (editando) {
    const { data } = await supabase.rpc("candidatos_do_dia", { p_icp_id: editando.id, p_limite: 200 });
    disponiveis = data?.length ?? 0;
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{editando ? "Meu cliente ideal" : "Novo perfil de cliente"}</h1>
        {salvo && <p className="cartao border-laranja">Perfil salvo! Agora é só abrir a lista de hoje.</p>}
        <FormPerfil key={editando?.id ?? "novo"} icp={editando} />
      </div>

      <aside className="space-y-4">
        {editando && (
          <div className="cartao space-y-2">
            <h2 className="text-lg font-semibold">O que a busca encontra</h2>
            <p className="text-sm text-texto-suave">
              {disponiveis === 200 ? "Mais de 200" : disponiveis} empresas disponíveis com este perfil.
            </p>
            {descricoes.length > 0 && (
              <ul className="max-h-64 space-y-1 overflow-auto text-xs text-texto-suave">
                {descricoes.map((c) => (
                  <li key={c.codigo}>
                    <b>{c.codigo}</b> {c.descricao}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/hoje" className="btn-primario w-full">Ver lista de hoje</Link>
          </div>
        )}

        {icps.length > 0 && (
          <div className="cartao space-y-2">
            <h2 className="text-lg font-semibold">Seus perfis</h2>
            {icps.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-2 text-sm">
                <Link href={`/perfil?id=${i.id}`} className="underline">{i.nome}</Link>
                {i.id === icpAtivo?.id ? (
                  <span className="text-xs font-semibold text-laranja-escuro">em uso</span>
                ) : (
                  <form action={ativarPerfil.bind(null, i.id)}>
                    <button className="text-xs underline">usar este</button>
                  </form>
                )}
              </div>
            ))}
            {icps.length < PLANOS[plano].perfis ? (
              <Link href="/perfil?novo=1" className="btn-secundario w-full text-sm">Criar outro perfil</Link>
            ) : (
              <p className="text-xs text-texto-suave">
                Seu plano permite {PLANOS[plano].perfis} perfil(is). <Link href="/planos" className="underline">Ver planos</Link>
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
