import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Privacidade e LGPD · Prospecta" };

export default function Privacidade() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Logo />
      <h1 className="text-3xl font-bold">Privacidade e LGPD</h1>
      <p className="text-sm text-texto-suave">
        Modelo inicial. Revise com um advogado antes do lançamento e preencha os campos entre
        colchetes.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Quem somos</h2>
        <p>
          A Prospecta é operada por [RAZÃO SOCIAL], CNPJ [CNPJ], com contato pelo e-mail
          [E-MAIL DE CONTATO].
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">De onde vêm os dados das empresas</h2>
        <p>
          Os dados das empresas mostrados no app vêm exclusivamente dos <b>dados públicos e
          abertos do CNPJ</b>, publicados pela Receita Federal. Não compramos nem vendemos listas
          de contatos.
        </p>
        <p>
          Usamos esses dados com base no <b>legítimo interesse</b> (art. 7º, IX, da LGPD) para
          permitir contatos comerciais B2B relevantes, com transparência sobre a origem do dado e
          opção de saída em toda mensagem. Empresários individuais e MEIs são sinalizados no app,
          porque os dados deles também são dados de pessoa física.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Como as mensagens são enviadas</h2>
        <p>
          A Prospecta não faz disparos automáticos. Cada mensagem é revisada e enviada pelo
          próprio usuário, do WhatsApp ou e-mail dele, que é responsável pelo contato.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Seus direitos</h2>
        <p>
          Se você representa uma empresa e não quer mais aparecer na Prospecta, peça a remoção
          na página <Link href="/remover" className="underline">Remover minha empresa</Link>. O
          pedido vale para todos os usuários do app.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Dados de quem usa o app</h2>
        <p>
          Guardamos seu e-mail, o perfil de cliente que você cadastrou e o histórico dos seus
          leads, para o app funcionar. Os textos das empresas são enviados à IA (Anthropic) só
          para gerar notas e mensagens. Pagamentos são processados pelo Asaas.
        </p>
      </section>
    </main>
  );
}
