"use client";

import { useActionState } from "react";
import { enviarLink, type EstadoEntrar } from "./actions";

export function FormEntrar() {
  const [estado, acao, enviando] = useActionState<EstadoEntrar, FormData>(enviarLink, {});

  if (estado.ok) {
    return (
      <p className="cartao">
        Pronto! Enviamos um link de acesso para o seu e-mail. Abra o e-mail e clique no link
        para entrar.
      </p>
    );
  }

  return (
    <form action={acao} className="space-y-4">
      <div>
        <label htmlFor="email" className="rotulo">
          Seu e-mail
        </label>
        <input id="email" name="email" type="email" required className="campo" placeholder="voce@empresa.com.br" />
      </div>
      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
      <button className="btn-primario w-full" disabled={enviando}>
        {enviando ? "Enviando..." : "Receber link de acesso"}
      </button>
      <p className="text-xs text-texto-suave">
        Sem senha: você entra pelo link que chega no seu e-mail.
      </p>
    </form>
  );
}
