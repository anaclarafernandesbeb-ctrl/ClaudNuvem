import { Logo } from "@/components/Logo";
import { FormRemover } from "./FormRemover";

export const metadata = { title: "Remover minha empresa · Prospecta" };

export default function Remover() {
  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-10">
      <Logo />
      <h1 className="text-3xl font-bold">Remover minha empresa</h1>
      <p className="text-texto-suave">
        Recebeu um contato feito pela Prospecta e não quer mais ser procurado? Informe o CNPJ
        abaixo e sua empresa deixa de aparecer para todos os usuários.
      </p>
      <FormRemover />
    </main>
  );
}
