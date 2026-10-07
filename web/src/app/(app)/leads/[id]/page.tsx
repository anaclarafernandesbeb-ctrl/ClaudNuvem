import Link from "next/link";
import { notFound } from "next/navigation";
import { carregarConta } from "@/lib/conta";
import {
  diasDesde,
  ETAPAS,
  formatarCnpj,
  formatarTelefone,
  linkEmail,
  linkWhatsApp,
  nomeEmpresa,
  type Empresa,
} from "@/lib/util";
import { bloquearEmpresa, marcarEnviado, mudarStatus, salvarMensagem, salvarNotas } from "./actions";
import { AnalisarResposta, BotaoCopiar, BotaoEscrever } from "./Interativos";

export default async function Lead({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await carregarConta();
  const { data: lead } = await supabase.from("leads").select("*, companies(*)").eq("id", id).maybeSingle();
  if (!lead) notFound();

  const e = lead.companies as Empresa;
  const { data: cnae } = await supabase
    .from("cnaes")
    .select("descricao")
    .eq("codigo", e.cnae_principal ?? "")
    .maybeSingle();
  const dias = diasDesde(e.data_abertura);
  const temMensagem = Boolean(lead.mensagem_whatsapp || lead.email_corpo);
  const followupVencido =
    lead.status === "enviado" &&
    lead.proximo_followup_em &&
    new Date(lead.proximo_followup_em) <= new Date();
  const podeEscrever = lead.status === "novo" || followupVencido;
  const wa = lead.mensagem_whatsapp ? linkWhatsApp(e.telefone, lead.mensagem_whatsapp) : null;
  const mail = lead.email_corpo ? linkEmail(e.email, lead.email_assunto ?? "", lead.email_corpo) : null;

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div>
          <Link href="/hoje" className="text-sm underline">← Voltar</Link>
          <h1 className="mt-2 text-3xl font-bold">{nomeEmpresa(e)}</h1>
          <p className="text-texto-suave">{cnae?.descricao ?? "Atividade não informada"}</p>
          {lead.motivo && <p className="mt-2">{lead.motivo}</p>}
        </div>

        <section className="cartao space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              {lead.status === "novo" ? "Primeira mensagem" : `Follow-up ${lead.followup_passo + 1}`}
            </h2>
            {podeEscrever && (
              <BotaoEscrever id={id} texto={temMensagem ? "Escrever outra versão" : "Escrever mensagem com IA"} />
            )}
          </div>

          {!podeEscrever && lead.status === "enviado" && (
            <p className="text-texto-suave">
              {lead.proximo_followup_em
                ? `Próximo follow-up em ${new Date(lead.proximo_followup_em).toLocaleDateString("pt-BR")}.`
                : "Todos os follow-ups foram enviados. Se não houver resposta, marque como perdido."}
            </p>
          )}

          {temMensagem && podeEscrever && (
            <form action={salvarMensagem.bind(null, id)} className="space-y-4">
              <div>
                <label className="rotulo" htmlFor="mensagem_whatsapp">WhatsApp</label>
                <textarea id="mensagem_whatsapp" name="mensagem_whatsapp" rows={5} className="campo"
                  defaultValue={lead.mensagem_whatsapp ?? ""} />
              </div>
              <div>
                <label className="rotulo" htmlFor="email_assunto">E-mail: assunto</label>
                <input id="email_assunto" name="email_assunto" className="campo" defaultValue={lead.email_assunto ?? ""} />
              </div>
              <div>
                <label className="rotulo" htmlFor="email_corpo">E-mail: texto</label>
                <textarea id="email_corpo" name="email_corpo" rows={7} className="campo"
                  defaultValue={lead.email_corpo ?? ""} />
              </div>
              <button className="text-sm underline">Salvar minhas alterações</button>
            </form>
          )}

          {temMensagem && podeEscrever && (
            <div className="flex flex-wrap gap-2 border-t border-borda pt-4">
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primario">Abrir no WhatsApp</a>
              ) : (
                <span className="text-sm text-texto-suave">Sem celular cadastrado para WhatsApp.</span>
              )}
              {mail && (
                <a href={mail} target="_blank" rel="noopener noreferrer" className="btn-secundario">Abrir no Gmail</a>
              )}
              <BotaoCopiar texto={lead.mensagem_whatsapp ?? ""} />
              <form action={marcarEnviado.bind(null, id)}>
                <button className="btn-secundario border-marinho">✓ Já enviei</button>
              </form>
            </div>
          )}
          {temMensagem && podeEscrever && (
            <p className="text-xs text-texto-suave">
              Salve suas alterações antes de abrir o WhatsApp ou o Gmail. Depois de enviar, clique
              em “Já enviei” para agendar o próximo follow-up.
            </p>
          )}
        </section>

        <section className="cartao space-y-3">
          <h2 className="text-xl font-semibold">Recebeu uma resposta?</h2>
          <AnalisarResposta id={id} />
        </section>

        <section className="cartao space-y-3">
          <h2 className="text-xl font-semibold">Anotações</h2>
          <form action={salvarNotas.bind(null, id)} className="space-y-2">
            <textarea name="notas" rows={3} className="campo" defaultValue={lead.notas ?? ""} />
            <button className="text-sm underline">Salvar anotações</button>
          </form>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="cartao space-y-2 text-sm">
          <h2 className="text-lg font-semibold">Dados da empresa</h2>
          {e.razao_social && <p><b>Razão social:</b> {e.razao_social}</p>}
          <p><b>CNPJ:</b> {formatarCnpj(e.cnpj)}</p>
          {dias !== null && <p><b>Aberta há:</b> {dias} dias</p>}
          {e.porte && <p><b>Porte:</b> {e.porte}</p>}
          <p><b>Local:</b> {[e.bairro, e.municipio_nome, e.uf].filter(Boolean).join(", ")}</p>
          {e.telefone && <p><b>Telefone:</b> {formatarTelefone(e.telefone)}</p>}
          {e.email && <p><b>E-mail:</b> {e.email}</p>}
          <p className="pt-2 text-xs text-texto-suave">
            Fonte: dados abertos do CNPJ, Receita Federal. O telefone e o e-mail às vezes são do
            escritório de contabilidade da empresa.
          </p>
          {e.pessoa_fisica && (
            <p className="rounded-lg bg-laranja/10 p-2 text-xs">
              Empresário individual ou MEI: estes dados também são de pessoa física. Faça um
              contato respeitoso e pare se a pessoa pedir.
            </p>
          )}
        </div>

        <div className="cartao space-y-2">
          <h2 className="text-lg font-semibold">Etapa</h2>
          <div className="flex flex-wrap gap-2">
            {ETAPAS.map((etapa) => (
              <form key={etapa.status} action={mudarStatus.bind(null, id, etapa.status)}>
                <button
                  className={`rounded-full border px-3 py-1 text-sm ${
                    lead.status === etapa.status ? "border-laranja bg-laranja font-semibold" : "border-borda"
                  }`}
                >
                  {etapa.nome}
                </button>
              </form>
            ))}
          </div>
        </div>

        <form action={bloquearEmpresa.bind(null, id)} className="cartao space-y-2">
          <p className="text-sm text-texto-suave">A empresa pediu para não ser mais contatada?</p>
          <button className="text-sm font-semibold text-laranja-escuro underline">
            Bloquear e não mostrar mais
          </button>
        </form>
      </aside>
    </div>
  );
}
