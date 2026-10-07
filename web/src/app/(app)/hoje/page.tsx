import Link from "next/link";
import { carregarConta } from "@/lib/conta";
import { PLANOS } from "@/lib/planos";
import { hojeBrasil } from "@/lib/util";
import { CartaoLead, type LeadComEmpresa } from "@/components/CartaoLead";
import { BotaoGerar } from "./BotaoGerar";

export default async function Hoje() {
  const { supabase, plano, icpAtivo } = await carregarConta();

  if (!icpAtivo) {
    return (
      <div className="cartao max-w-xl space-y-4">
        <h1 className="text-2xl font-bold">Boas-vindas à Prospecta!</h1>
        <p className="text-texto-suave">
          Para montar sua primeira lista, conte o que você vende e para quem. Leva 5 minutos.
        </p>
        <Link href="/perfil" className="btn-primario">Cadastrar meu cliente ideal</Link>
      </div>
    );
  }

  const hoje = hojeBrasil();
  const [{ data: daLista }, { data: followups }] = await Promise.all([
    supabase
      .from("leads")
      .select("*, companies(*)")
      .eq("data_lista", hoje)
      .order("fit_score", { ascending: false, nullsFirst: false }),
    supabase
      .from("leads")
      .select("*, companies(*)")
      .eq("status", "enviado")
      .lte("proximo_followup_em", new Date().toISOString())
      .order("proximo_followup_em"),
  ]);
  const lista = (daLista ?? []) as LeadComEmpresa[];
  const pendentes = (followups ?? []) as LeadComEmpresa[];
  const limite = PLANOS[plano].leadsPorDia;
  const novos = lista.filter((l) => l.status === "novo").length;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-laranja-escuro uppercase">
              {icpAtivo.nome}
            </p>
            <h1 className="text-3xl font-bold">Sua lista de hoje</h1>
            <p className="text-texto-suave">
              {lista.length} de {limite} empresas · {novos} ainda sem contato
            </p>
          </div>
          {lista.length < limite && (
            <BotaoGerar texto={lista.length === 0 ? "Montar lista de hoje" : "Completar lista"} />
          )}
        </div>
        {lista.length === 0 ? (
          <p className="cartao text-texto-suave">
            Clique em “Montar lista de hoje” para receber as empresas do dia.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {lista.map((l) => (
              <CartaoLead key={l.id} lead={l} destaque={l.status === "novo" ? undefined : "Já contatada"} />
            ))}
          </div>
        )}
        {lista.length >= limite && plano !== "pro" && (
          <p className="text-sm text-texto-suave">
            Quer mais empresas por dia? <Link href="/planos" className="underline">Conheça os planos</Link>.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Follow-ups de hoje</h2>
        {pendentes.length === 0 ? (
          <p className="text-texto-suave">Nenhum follow-up pendente. 🎉</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {pendentes.map((l) => (
              <CartaoLead key={l.id} lead={l} destaque={`Follow-up ${l.followup_passo + 1} pendente`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
