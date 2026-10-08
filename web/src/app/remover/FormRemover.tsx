"use client";

import { useActionState } from "react";
import { pedirRemocao, type EstadoRemover } from "./actions";

export function FormRemover() {
  const [estado, acao, enviando] = useActionState<EstadoRemover, FormData>(pedirRemocao, {});
  if (estado.ok) {
    return <p className="cartao">Pedido registrado. Sua empresa não será mais mostrada aos usuários.</p>;
  }
  return (
    <form action={acao} className="space-y-4">
      <div>
        <label className="rotulo" htmlFor="cnpj">CNPJ da empresa</label>
        <input id="cnpj" name="cnpj" required className="campo" placeholder="00.000.000/0000-00" />
      </div>
      <div>
        <label className="rotulo" htmlFor="contato">E-mail ou telefone para contato (opcional)</label>
        <input id="contato" name="contato" className="campo" />
      </div>
      <div>
        <label className="rotulo" htmlFor="motivo">Motivo (opcional)</label>
        <textarea id="motivo" name="motivo" rows={3} className="campo" />
      </div>
      {estado.erro && <p className="text-sm text-laranja-escuro">{estado.erro}</p>}
      <button className="btn-primario" disabled={enviando}>
        {enviando ? "Enviando..." : "Pedir remoção"}
      </button>
    </form>
  );
}
