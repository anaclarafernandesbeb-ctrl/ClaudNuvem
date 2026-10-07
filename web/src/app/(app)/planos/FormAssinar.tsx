"use client";

import { useActionState } from "react";
import { assinar, type EstadoAssinar } from "./actions";

export function FormAssinar({ plano, rotulo }: { plano: string; rotulo: string }) {
  const [estado, acao, enviando] = useActionState<EstadoAssinar, FormData>(assinar, {});
  return (
    <form action={acao} className="space-y-3">
      <input type="hidden" name="plano" value={plano} />
      <input name="nome" required className="campo" placeholder="Seu nome ou da empresa" />
      <input name="cpf_cnpj" required className="campo" placeholder="CPF ou CNPJ" />
      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
      <button className="btn-primario w-full" disabled={enviando}>
        {enviando ? "Gerando cobrança..." : rotulo}
      </button>
    </form>
  );
}
