import Link from "next/link";
import { carregarContaIg } from "@/lib/conta-ig";
import { FormOferta } from "./FormOferta";
import { ativarOferta } from "./actions";

export default async function Oferta({
  searchParams,
}: {
  searchParams: Promise<{ nova?: string; id?: string; salvo?: string }>;
}) {
  const { nova, id, salvo } = await searchParams;
  const { ofertas, ofertaAtiva } = await carregarContaIg();
  const editando = nova ? null : (ofertas.find((o) => o.id === id) ?? ofertaAtiva);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{editando ? "Minha oferta" : "Nova oferta"}</h1>
        <p className="text-texto-suave">
          Tudo o que a IA escreve sai daqui: quanto mais concreto, mais certeira a conversa.
        </p>
        {salvo && <p className="cartao border-laranja">Oferta salva! Agora adicione os perfis que quer abordar.</p>}
        <FormOferta key={editando?.id ?? "nova"} oferta={editando} />
      </div>

      <aside className="space-y-4">
        {salvo && <Link href="/instagram" className="btn-primario w-full">Ir para a lista do dia</Link>}
        {ofertas.length > 0 && (
          <div className="cartao space-y-2">
            <h2 className="text-lg font-semibold">Suas ofertas</h2>
            {ofertas.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 text-sm">
                <Link href={`/instagram/oferta?id=${o.id}`} className="underline">{o.nome}</Link>
                {o.id === ofertaAtiva?.id ? (
                  <span className="text-xs font-semibold text-laranja-escuro">em uso</span>
                ) : (
                  <form action={ativarOferta.bind(null, o.id)}>
                    <button className="text-xs underline">usar esta</button>
                  </form>
                )}
              </div>
            ))}
            <Link href="/instagram/oferta?nova=1" className="btn-secundario w-full text-sm">Criar outra oferta</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
