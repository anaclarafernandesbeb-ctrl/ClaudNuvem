import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PLANOS, type Plano } from "@/lib/planos";

const PASSOS = [
  ["Conte o que você vende", "Um cadastro de 5 minutos define seu cliente ideal."],
  ["Receba a lista do dia", "Empresas recém-abertas na sua região, com nota de fit e o motivo do contato."],
  ["Envie em um clique", "WhatsApp ou e-mail, com a mensagem já escrita pela IA no seu tom."],
  ["Siga o follow-up", "Lembretes no 2º, 5º e 10º dia, com o próximo texto pronto."],
];

export default function Inicio() {
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <Logo />
        <Link href="/entrar" className="btn-secundario">
          Entrar
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <p className="mb-4 text-sm font-bold tracking-widest text-laranja-escuro uppercase">
          Copiloto de prospecção
        </p>
        <h1 className="max-w-3xl text-4xl leading-tight font-bold md:text-6xl">
          Todo dia, as empresas certas para você vender. Com a mensagem pronta.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-texto-suave">
          A Prospecta encontra empresas que acabaram de abrir na sua cidade, escreve uma
          abordagem personalizada e te lembra do follow-up. Você só clica e envia pelo seu
          WhatsApp ou e-mail.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/entrar" className="btn-primario text-lg">
            Começar grátis
          </Link>
          <a href="#planos" className="btn-secundario text-lg">
            Ver planos
          </a>
        </div>
      </section>

      <section className="bg-marinho py-16 text-creme">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold">Como funciona</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {PASSOS.map(([titulo, texto], i) => (
              <div key={titulo} className="rounded-2xl border border-marinho-2 bg-marinho-2 p-6">
                <p className="font-display text-2xl font-bold text-laranja">0{i + 1}</p>
                <h3 className="mt-2 text-xl font-semibold">{titulo}</h3>
                <p className="mt-2 text-sm text-[#b9c7d6]">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold">Planos</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(Object.keys(PLANOS) as Plano[]).map((id) => {
            const p = PLANOS[id];
            return (
              <div
                key={id}
                className={`cartao ${id === "solo" ? "border-2 border-laranja" : ""}`}
              >
                <h3 className="text-xl font-semibold">{p.nome}</h3>
                <p className="mt-2 font-display text-4xl font-bold">
                  R$ {p.preco}
                  {p.preco > 0 && <span className="text-base text-texto-suave">/mês</span>}
                </p>
                <ul className="mt-4 space-y-1 text-texto-suave">
                  {p.itens.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-borda py-8 text-center text-sm text-texto-suave">
        <Link href="/privacidade" className="underline">
          Privacidade e LGPD
        </Link>{" "}
        ·{" "}
        <Link href="/remover" className="underline">
          Remover minha empresa
        </Link>
      </footer>
    </main>
  );
}
