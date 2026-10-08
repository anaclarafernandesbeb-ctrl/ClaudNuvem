import { Logo } from "@/components/Logo";
import { FormEntrar } from "./FormEntrar";

export default function Entrar() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-4">
      <Logo />
      <div>
        <h1 className="text-3xl font-bold">Entrar ou criar conta</h1>
        <p className="mt-2 text-texto-suave">É grátis para começar.</p>
      </div>
      <FormEntrar />
    </main>
  );
}
