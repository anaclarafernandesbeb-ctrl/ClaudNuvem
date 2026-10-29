import Link from "next/link";
import { carregarContaIg } from "@/lib/conta-ig";
import { META_DMS_DIA, type PerfilIg } from "@/lib/instagram";
import { businessDiscoveryConfigurado } from "@/lib/meta";
import { hojeBrasil } from "@/lib/util";
import { CartaoPerfilIg } from "@/components/CartaoPerfilIg";
import { BotaoAnalisar, FormAdicionar } from "./Formularios";

export default async function Instagram() {
  const { supabase, ofertaAtiva } = await carregarContaIg();

  if (!ofertaAtiva) {
    return (
      <div className="cartao max-w-xl space-y-4">
        <h1 className="text-2xl font-bold">Prospecção no Instagram</h1>
        <p className="text-texto-suave">
          Primeiro, conte o que você vende: produto, preço, transformação e para quem é. A IA usa
          isso para escolher quem abordar e escrever cada mensagem.
        </p>
        <Link href="/instagram/oferta" className="btn-primario">Cadastrar minha oferta</Link>
      </div>
    );
  }

  const inicioDoDia = `${hojeBrasil()}T00:00:00-03:00`;
  const [{ data: lista }, { data: followups }, { count: pendentes }, { data: semDados }, { count: enviadasHoje }] =
    await Promise.all([
      supabase
        .from("perfis_ig")
        .select("*")
        .eq("status", "novo")
        .not("analisado_em", "is", null)
        .gte("fit", 40)
        .order("fit", { ascending: false })
        .limit(META_DMS_DIA),
      supabase
        .from("perfis_ig")
        .select("*")
        .eq("status", "abordado")
        .lte("proximo_followup_em", new Date().toISOString())
        .order("proximo_followup_em"),
      supabase
        .from("perfis_ig")
        .select("id", { count: "exact", head: true })
        .eq("status", "novo")
        .is("analisado_em", null)
        .is("dados_em", null),
      supabase
        .from("perfis_ig")
        .select("*")
        .eq("status", "novo")
        .is("analisado_em", null)
        .not("dados_em", "is", null)
        .limit(10),
      supabase
        .from("mensagens_ig")
        .select("id", { count: "exact", head: true })
        .eq("autor", "eu")
        .gte("created_at", inicioDoDia),
    ]);

  const perfis = (lista ?? []) as PerfilIg[];
  const atrasados = (followups ?? []) as PerfilIg[];
  const faltamDados = (semDados ?? []) as PerfilIg[];
  const enviadas = enviadasHoje ?? 0;
  const progresso = Math.min(100, Math.round((100 * enviadas) / META_DMS_DIA));

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-widest text-laranja-escuro uppercase">{ofertaAtiva.nome}</p>
          <h1 className="text-3xl font-bold">Instagram: lista do dia</h1>
          <p className="text-texto-suave">
            {enviadas} de {META_DMS_DIA} DMs hoje · volume seguro, enviadas por você
          </p>
          <div className="mt-2 h-2 w-64 max-w-full rounded-full bg-borda">
            <div className="h-2 rounded-full bg-laranja" style={{ width: `${progresso}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/instagram/placar" className="btn-secundario">Placar</Link>
          <Link href="/instagram/oferta" className="btn-secundario">Minha oferta</Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Follow-ups de hoje</h2>
        {atrasados.length === 0 ? (
          <p className="text-texto-suave">Nenhum follow-up pendente.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {atrasados.map((p) => (
              <CartaoPerfilIg key={p.id} perfil={p} destaque={`Follow-up ${p.followup_passo + 1} pendente`} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Prontos para abordar</h2>
        {perfis.length === 0 ? (
          <p className="cartao text-texto-suave">
            Nenhum perfil analisado ainda. Adicione os @ abaixo e clique em “Analisar perfis”.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {perfis.map((p) => <CartaoPerfilIg key={p.id} perfil={p} />)}
          </div>
        )}
        <p className="text-xs text-texto-suave">Perfis com fit abaixo de 40 ficam fora da lista, mas continuam no Funil.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="cartao space-y-3">
          <h2 className="text-xl font-semibold">Adicionar perfis</h2>
          <p className="text-sm text-texto-suave">
            Boas fontes: quem comenta nos posts de criadores do seu nicho, quem segue concorrentes,
            participantes de lives e indicações.
          </p>
          <FormAdicionar />
        </div>
        <div className="cartao space-y-3">
          <h2 className="text-xl font-semibold">Raio-X da IA</h2>
          <p className="text-sm text-texto-suave">
            {pendentes ?? 0} perfil(is) aguardando análise. A IA lê a bio e os últimos posts e dá
            fit, temperatura, dor provável e o gancho de abertura.
          </p>
          {!businessDiscoveryConfigurado() && (
            <p className="rounded-lg bg-laranja/10 p-2 text-xs">
              A leitura automática dos perfis ainda não está ligada (falta conectar o app da Meta).
              Até lá, abra cada perfil e cole a bio para a IA analisar.
            </p>
          )}
          <BotaoAnalisar pendentes={pendentes ?? 0} />
        </div>
      </section>

      {faltamDados.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Precisam da bio</h2>
          <p className="text-texto-suave">
            Perfis pessoais ou sem dados públicos. Abra, cole a bio (e se quiser uma legenda recente) e analise.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {faltamDados.map((p) => <CartaoPerfilIg key={p.id} perfil={p} destaque="Colar bio" />)}
          </div>
        </section>
      )}
    </div>
  );
}
