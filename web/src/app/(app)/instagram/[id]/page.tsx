import Link from "next/link";
import { notFound } from "next/navigation";
import { carregarContaIg } from "@/lib/conta-ig";
import {
  ETAPAS_IG,
  formatarNumero,
  linkDm,
  linkPerfil,
  PLAYBOOK,
  type MensagemIg,
  type PerfilIg,
} from "@/lib/instagram";
import { bloquearPerfil, mudarStatus, salvarNotas } from "./actions";
import { BotaoEscrever, EnvioDm, FormDados, LerResposta } from "./Interativos";

const ESTAGIOS: Record<string, string> = {
  iniciante: "Iniciante",
  crescendo: "Crescendo",
  escalando: "Escalando",
  ja_vende: "Já vende",
};

export default async function PerfilInstagram({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, ofertaAtiva } = await carregarContaIg();
  const [{ data }, { data: msgs }] = await Promise.all([
    supabase.from("perfis_ig").select("*").eq("id", id).maybeSingle(),
    supabase.from("mensagens_ig").select("*").eq("perfil_id", id).order("created_at"),
  ]);
  if (!data) notFound();
  const p = data as PerfilIg;
  const conversa = (msgs ?? []) as MensagemIg[];

  const followupVencido =
    p.status === "abordado" && p.proximo_followup_em && new Date(p.proximo_followup_em) <= new Date();
  const emConversa = p.status === "respondeu" || p.status === "call";
  const podeEscrever = p.status === "novo" || followupVencido;
  const titulo =
    p.status === "novo" ? "Mensagem de abertura" : emConversa ? "Próxima mensagem" : `Follow-up ${p.followup_passo + 1}`;
  const etapa = PLAYBOOK.find((e) => e.etapa === p.etapa);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div>
          <Link href="/instagram" className="text-sm underline">← Voltar</Link>
          <h1 className="mt-2 text-3xl font-bold">@{p.username}</h1>
          <p className="text-texto-suave">
            {[p.nome, p.seguidores !== null ? `${formatarNumero(p.seguidores)} seguidores` : null, p.nicho]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <a href={linkPerfil(p.username)} target="_blank" rel="noopener noreferrer" className="text-sm underline">
            Ver perfil no Instagram
          </a>
        </div>

        {!ofertaAtiva && (
          <p className="cartao border-laranja">
            Cadastre sua oferta em <Link href="/instagram/oferta" className="underline">Minha oferta</Link> para a IA trabalhar.
          </p>
        )}

        {p.analisado_em ? (
          <section className="cartao space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-xl font-semibold">Raio-X</h2>
              {p.estagio && <span className="rounded-full border border-borda px-3 py-1 text-xs">{ESTAGIOS[p.estagio] ?? p.estagio}</span>}
              {p.temperatura && <span className="rounded-full bg-laranja/30 px-3 py-1 text-xs font-bold">{p.temperatura}</span>}
              {p.fit !== null && <span className="rounded-full bg-marinho px-3 py-1 text-xs font-bold text-creme">Fit {p.fit}</span>}
            </div>
            {p.resumo && <p>{p.resumo}</p>}
            {p.dor && <p className="text-sm"><b>Dor provável:</b> {p.dor}</p>}
            {p.sinais.length > 0 && (
              <p className="text-sm"><b>Sinais de compra:</b> {p.sinais.join(" · ")}</p>
            )}
            {p.gancho && <p className="text-sm"><b>Gancho:</b> {p.gancho}</p>}
          </section>
        ) : (
          <section className="cartao space-y-3">
            <h2 className="text-xl font-semibold">Raio-X pendente</h2>
            <p className="text-sm text-texto-suave">
              Cole a bio para a IA analisar, ou use “Analisar perfis” na lista do dia.
            </p>
          </section>
        )}

        <section className="cartao space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{titulo}</h2>
              {etapa && emConversa && (
                <p className="text-xs text-texto-suave">Etapa {etapa.etapa} de 5: {etapa.nome}. {etapa.objetivo}</p>
              )}
            </div>
            {podeEscrever && ofertaAtiva && (
              <BotaoEscrever id={id} texto={p.rascunho ? "Escrever outra versão" : "Escrever DM com IA"} />
            )}
          </div>

          {p.status === "abordado" && !followupVencido && (
            <p className="text-texto-suave">
              {p.proximo_followup_em
                ? `Próximo follow-up em ${new Date(p.proximo_followup_em).toLocaleDateString("pt-BR")}.`
                : "Os 2 follow-ups já foram enviados. Se não houver resposta, marque como perdido."}
            </p>
          )}
          {emConversa && !p.rascunho && (
            <p className="text-texto-suave">Quando a pessoa responder, cole a resposta abaixo para receber a próxima mensagem.</p>
          )}
          {p.rascunho && (podeEscrever || emConversa) && (
            <EnvioDm key={p.rascunho} id={id} rascunho={p.rascunho} linkDm={linkDm(p.username)} />
          )}
        </section>

        {p.status !== "novo" && p.status !== "perdido" && (
          <section className="cartao space-y-3">
            <h2 className="text-xl font-semibold">A pessoa respondeu?</h2>
            <LerResposta id={id} />
          </section>
        )}

        {conversa.length > 0 && (
          <section className="cartao space-y-3">
            <h2 className="text-xl font-semibold">Conversa</h2>
            <div className="space-y-2">
              {conversa.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    m.autor === "eu" ? "ml-auto bg-laranja/20" : "bg-creme"
                  }`}
                >
                  {m.texto}
                  <p className="mt-1 text-[10px] text-texto-suave">
                    {new Date(m.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="cartao space-y-3">
          <h2 className="text-xl font-semibold">{p.analisado_em ? "Dados do perfil" : "Colar dados do perfil"}</h2>
          <FormDados perfil={p} />
        </section>

        <section className="cartao space-y-3">
          <h2 className="text-xl font-semibold">Anotações</h2>
          <form action={salvarNotas.bind(null, id)} className="space-y-2">
            <textarea name="notas" rows={3} className="campo" defaultValue={p.notas ?? ""} />
            <button className="text-sm underline">Salvar anotações</button>
          </form>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="cartao space-y-2">
          <h2 className="text-lg font-semibold">Etapa do funil</h2>
          <div className="flex flex-wrap gap-2">
            {ETAPAS_IG.map((e) => (
              <form key={e.status} action={mudarStatus.bind(null, id, e.status)}>
                <button
                  className={`rounded-full border px-3 py-1 text-sm ${
                    p.status === e.status ? "border-laranja bg-laranja font-semibold" : "border-borda"
                  }`}
                >
                  {e.nome}
                </button>
              </form>
            ))}
          </div>
        </div>

        <div className="cartao space-y-2 text-sm">
          <h2 className="text-lg font-semibold">Playbook</h2>
          <ol className="space-y-1">
            {PLAYBOOK.map((e) => (
              <li key={e.etapa} className={e.etapa === p.etapa && p.status !== "novo" ? "font-semibold text-laranja-escuro" : ""}>
                {e.etapa}. {e.nome}: <span className="text-texto-suave">{e.objetivo}</span>
              </li>
            ))}
          </ol>
        </div>

        <form action={bloquearPerfil.bind(null, id)} className="cartao space-y-2">
          <p className="text-sm text-texto-suave">A pessoa pediu para não receber mais mensagens?</p>
          <button className="text-sm font-semibold text-laranja-escuro underline">Bloquear e não mostrar mais</button>
        </form>
      </aside>
    </div>
  );
}
